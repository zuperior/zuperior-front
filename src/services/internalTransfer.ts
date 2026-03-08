import axios from 'axios';

// Normalize backend base URL to ensure it targets /api
const RAW_BASE = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5001/api';
const BASE_URL = RAW_BASE.endsWith('/api') ? RAW_BASE : `${RAW_BASE.replace(/\/+$/, '')}/api`;

// Create axios instance with token interceptor
const transferApi = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000,
});

// Add token interceptor
transferApi.interceptors.request.use((config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('userToken') : null;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

interface InternalTransferParams {
    fromAccount: string;
    toAccount: string;
    amount: number;
    comment?: string;
}

interface InternalTransferResponse {
    success: boolean;
    message: string;
    data?: {
        transferId: string;
        fromAccount: string;
        toAccount: string;
        amount: number;
        fromBalance?: number;
        toBalance?: number;
        sourceTransactionId: string;
        destTransactionId: string;
    };
    error?: string;
}

export async function InternalTransfer(params: InternalTransferParams): Promise<InternalTransferResponse> {
    try {
        const response = await transferApi.post<InternalTransferResponse>('/internal-transfer', {
            fromAccount: params.fromAccount,
            toAccount: params.toAccount,
            amount: params.amount,
            comment: params.comment || 'Internal transfer',
        });
        return response.data;
    } catch (error: any) {
        // Surface backend error message to the UI
        const message = error?.response?.data?.message || error?.message || 'Internal transfer failed';
        throw new Error(message);
    }
}
