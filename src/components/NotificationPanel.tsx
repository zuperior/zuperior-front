"use client";

import { Bell, X } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { formatDistanceToNow } from "date-fns";

export function NotificationPanel() {
  const { theme } = useTheme();
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return "💰";
      case "withdrawal":
        return "💸";
      case "internal_transfer":
        return "🔄";
      case "account_creation":
        return "✅";
      case "account_update":
        return "⚙️";
      case "support_ticket_reply":
        return "💬";
      default:
        return "🔔";
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return "Recently";
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative h-9 w-9 p-0 hover:bg-black/5 dark:hover:bg-white/5"
        >
          <Bell className="h-5 w-5 text-black dark:text-white" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 flex items-center justify-center text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[380px] max-h-[500px] overflow-y-auto p-0 dark:bg-[#01040D] border border-[#9F8BCF]/25 rounded-[12px]"
      >
        <div className="sticky top-0 z-10 bg-white dark:bg-[#01040D] border-b border-black/10 dark:border-white/10 px-4 py-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-black dark:text-white">
            Notifications
          </h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 px-2 text-purple-500 hover:text-purple-600 dark:hover:bg-white/5"
              onClick={async (e) => {
                e.preventDefault();
                await markAllAsRead();
              }}
            >
              Mark all as read
            </Button>
          )}
        </div>

        {loading && notifications.length === 0 ? (
          <div className="p-8 text-center text-sm text-black/60 dark:text-white/60">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-sm text-black/60 dark:text-white/60">
            No notifications yet
          </div>
        ) : (
          <div className="divide-y divide-black/10 dark:divide-white/10">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${
                  !notification.isRead
                    ? "bg-purple-500/5 dark:bg-purple-500/10"
                    : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-semibold text-black dark:text-white ${
                            !notification.isRead ? "font-bold" : ""
                          }`}
                        >
                          {notification.title}
                        </p>
                        <p className="text-xs text-black/70 dark:text-white/70 mt-1 break-words">
                          {notification.message}
                        </p>
                        <p className="text-[10px] text-black/50 dark:text-white/50 mt-2">
                          {formatDate(notification.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!notification.isRead && (
                          <button
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              await markAsRead(notification.id);
                            }}
                            className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-colors"
                            title="Mark as read"
                          >
                            <div className="h-2 w-2 rounded-full bg-purple-500" />
                          </button>
                        )}
                        <button
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            await deleteNotification(notification.id);
                          }}
                          className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-colors"
                          title="Delete"
                        >
                          <X className="h-3.5 w-3.5 text-black/50 dark:text-white/50" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
