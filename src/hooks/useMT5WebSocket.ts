import { useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { updateAccountFromWebSocket } from '../store/slices/mt5AccountSlice';
import { mt5Service } from '@/services/api.service';

const BASE_SIGNALR_URL = process.env.NEXT_PUBLIC_SIGNALR_URL || 'https://metaapi.zuperior.com/ws';
const RECORD_SEPARATOR = String.fromCharCode(0x1e);
const SYNC_THROTTLE = 60000; // Synchronize with DB at most once per minute

const getWsUrl = (baseUrl: string) => {
    let url = baseUrl.replace(/^http/, 'ws');

    // Ensure we have a trailing slash if needed, but avoid double slashes
    url = url.replace(/\/+$/, '');

    // If it's a SignalR endpoint, it often needs /negotiate or transport=webSockets
    // We try to use the base /ws or add /account hub if missing
    const hasHub = url.includes('/hubs/') || url.includes('/account') || url.endsWith('/ws');

    if (!hasHub) {
        url = `${url}/account`;
    }

    const separator = url.includes('?') ? '&' : '?';
    // negotiateVersion=1 is standard for SignalR Core skip-negotiate
    return `${url}${separator}transport=webSockets&negotiateVersion=1`;
};

export const useMT5WebSocket = (accountIds: string[]) => {
    const dispatch = useDispatch();
    const socketRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isConnectingRef = useRef(false);
    const lastSyncRef = useRef<Record<string, number>>({});

    // Dynamic URL based on current Env
    const getFinalUrl = useCallback(() => {
        const envUrl = process.env.NEXT_PUBLIC_SIGNALR_URL || 'https://metaapi.zuperior.com/ws';
        return getWsUrl(envUrl);
    }, []);

    const subscribe = useCallback(() => {
        if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN || accountIds.length === 0) return;

        console.log('[MT5 WebSocket] 📤 Subscribing to accounts:', accountIds);
        const idsAsNumbers = accountIds.map(id => parseInt(id)).filter(id => !isNaN(id));
        const msg = JSON.stringify({
            type: 1,
            target: 'SubscribeToAccounts',
            arguments: [idsAsNumbers],
        }) + RECORD_SEPARATOR;

        socketRef.current?.send(msg);
    }, [accountIds]);


    const connect = useCallback(() => {
        if (socketRef.current?.readyState === WebSocket.OPEN || socketRef.current?.readyState === WebSocket.CONNECTING || isConnectingRef.current) return;

        const finalUrl = getFinalUrl();
        console.log('[MT5 WebSocket] 📡 Attempting connection to:', finalUrl);

        isConnectingRef.current = true;

        try {
            const socket = new WebSocket(finalUrl);
            socketRef.current = socket;

            socket.onopen = () => {
                console.log('[MT5 WebSocket] ✅ WebSocket Connected. Protocol State:', socket.readyState);
                isConnectingRef.current = false;

                // SignalR Handshake
                const handshake = JSON.stringify({ protocol: 'json', version: 1 }) + RECORD_SEPARATOR;
                console.log('[MT5 WebSocket] 🤝 Sending Handshake...');
                socket.send(handshake);
            };

            socket.onmessage = (event) => {
                const rawData = event.data as string;
                const messages = rawData.split(RECORD_SEPARATOR).filter(Boolean);

                messages.forEach((msg) => {
                    try {
                        const data = JSON.parse(msg);

                        // SignalR Handshake response: typically an empty object {}
                        if (msg === '{}' || (typeof data === 'object' && Object.keys(data).length === 0)) {
                            console.log('[MT5 WebSocket] 🤝 Handshake complete');
                            subscribe();
                            return;
                        }

                        // Type 1 is Invocation
                        if (data.type === 1) {
                            if (data.target === 'AccountUpdate') {
                                const update = data.arguments[0];
                                console.log('[MT5 WebSocket] 📥 AccountUpdate received:', update.accountId, update.balance);
                                dispatch(updateAccountFromWebSocket({
                                    accountId: String(update.accountId),
                                    balance: update.balance,
                                    equity: update.equity,
                                    marginUsed: update.marginUsed,
                                    freeMargin: update.freeMargin,
                                    marginLevel: update.marginLevel,
                                    currency: update.currency || 'USD'
                                }));

                                // --- Periodic Database Sync ---
                                const accId = String(update.accountId);
                                const now = Date.now();
                                const lastSync = lastSyncRef.current[accId] || 0;

                                if (now - lastSync > SYNC_THROTTLE) {
                                    console.log(`[MT5 WebSocket] 💾 Throttled sync for account ${accId} to DB...`);
                                    lastSyncRef.current[accId] = now;

                                    // Async sync to avoid blocking UI thread
                                    // @ts-ignore -- Property exists but TS server may lag in indexing newly added methods in api.service.ts
                                    mt5Service.syncAccountBalances([{
                                        accountId: accId,
                                        balance: update.balance,
                                        equity: update.equity,
                                        marginUsed: update.marginUsed,
                                        freeMargin: update.freeMargin,
                                        marginLevel: update.marginLevel,
                                        currency: update.currency || 'USD'
                                    }]).catch((err: any) => {
                                        console.error(`[MT5 WebSocket] ❌ Failed to sync account ${accId} to DB:`, err);
                                    });
                                }
                            }
                        }

                        // Reply to Ping (type 6)
                        if (data.type === 6) {
                            socket.send(JSON.stringify({ type: 6 }) + RECORD_SEPARATOR);
                        }
                    } catch (e) {
                        console.error('[MT5 WebSocket] ❌ Error parsing message:', e, msg);
                    }
                });
            };

            socket.onclose = (event) => {
                isConnectingRef.current = false;
                console.log(`[MT5 WebSocket] 🛑 Connection closed. Code: ${event.code}, Reason: ${event.reason || 'None'}`);

                // Attempt reconnection with exponential backoff
                if (!reconnectTimeoutRef.current) {
                    const delay = 5000;
                    console.log(`[MT5 WebSocket] 🔄 Reconnecting in ${delay / 1000}s...`);
                    reconnectTimeoutRef.current = setTimeout(() => {
                        reconnectTimeoutRef.current = null;
                        connect();
                    }, delay);
                }
            };

            socket.onerror = (error) => {
                // Silencing the common empty error events (hidden by browser for security)
                // and normal closure errors to keep the console clean.

                // Only log if it's a failure during the initial connection attempt
                if (socket.readyState === WebSocket.CONNECTING) {
                    console.warn('[MT5 WebSocket] 💡 Connection failed early. Check if the URL is correct and supports wss/ws.');
                }
            };
        } catch (err) {
            console.error('[MT5 WebSocket] 🌋 Exception during connection initialization:', err);
            isConnectingRef.current = false;
        }
    }, [getFinalUrl, subscribe, dispatch]);


    useEffect(() => {
        connect();
        return () => {
            if (socketRef.current) {
                socketRef.current.close();
                socketRef.current = null;
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }
        };
    }, [connect]);

    // Handle account ID changes (e.g. when a new account is created)
    useEffect(() => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            subscribe();
        }
    }, [accountIds, subscribe]);

    return {
        isConnected: socketRef.current?.readyState === WebSocket.OPEN,
        subscribe // Exposed in case manual re-subscription is needed
    };
};
