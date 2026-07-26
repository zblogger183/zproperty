"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  Banknote,
  Bell,
  CheckCircle,
  Clock,
  CreditCard,
  Shield,
  ShieldCheck,
  Users,
  XCircle,
  type LucideIcon,
} from "lucide-react";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  is_read: boolean;
  created_at: string;
}

const TYPE_ICONS: Record<string, { Icon: LucideIcon; className: string }> = {
  listing_approved: { Icon: CheckCircle, className: "bg-secondary text-primary" },
  listing_rejected: { Icon: XCircle, className: "bg-primary text-white" },
  cnic_verified: { Icon: ShieldCheck, className: "bg-secondary text-primary" },
  // ShieldAlert isn't available in the installed lucide-react version — Shield
  // is the documented substitute.
  cnic_rejected: { Icon: Shield, className: "bg-primary text-white" },
  payment_confirm: { Icon: CreditCard, className: "bg-secondary text-primary" },
  new_lead: { Icon: Users, className: "bg-primary text-white" },
  subscription_exp: { Icon: Clock, className: "bg-primary-mid text-white" },
  subscription_expired: { Icon: Clock, className: "bg-primary-mid text-white" },
  bank_transfer_pending: { Icon: Banknote, className: "bg-primary text-white" },
};
const DEFAULT_ICON: { Icon: LucideIcon; className: string } = { Icon: Bell, className: "bg-primary text-white" };

const NAVIGATION_BY_TYPE: Record<string, string> = {
  listing_approved: "/dashboard/listings",
  listing_rejected: "/dashboard/listings",
  cnic_verified: "/dashboard/settings",
  cnic_rejected: "/dashboard/settings",
  payment_confirm: "/dashboard/subscription",
  new_lead: "/dashboard/leads",
  subscription_exp: "/dashboard/subscription",
  subscription_expired: "/dashboard/subscription",
  bank_transfer_pending: "/admin/payments/bank-transfer",
  cnic_submitted: "/admin/users/verification",
};

const POLL_INTERVAL_MS = 60_000;

export function NotificationBell({
  userId,
  iconClassName = "text-primary",
}: {
  userId: string;
  iconClassName?: string;
}) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  async function loadNotifications() {
    try {
      const response = await fetch("/api/notifications");
      if (!response.ok) return;
      const data = (await response.json()) as { notifications: NotificationItem[]; unread_count: number };
      setNotifications(data.notifications);
      setUnreadCount(data.unread_count);
    } catch {
      // Best-effort — a failed poll just retries on the next interval.
    }
  }

  useEffect(() => {
    // Initial fetch on mount — there's no prior render value to diff
    // against here (unlike a derived-state reset), so the render-time
    // "adjust state" pattern doesn't apply; this is the legitimate
    // fetch-on-mount case an effect exists for.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadNotifications();

    // TODO: replace this 60s poll with a Supabase Realtime channel once
    // available: supabase.channel('notifications').on('postgres_changes', ...)
    const interval = setInterval(() => void loadNotifications(), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [userId]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function markRead(ids: string[] | "all") {
    const body = ids === "all" ? { all: true } : { notification_ids: ids };
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch {
      // Best-effort.
    }
  }

  function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    void markRead("all");
  }

  function handleNotificationClick(notification: NotificationItem) {
    if (!notification.is_read) {
      setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n)));
      setUnreadCount((count) => Math.max(0, count - 1));
      void markRead([notification.id]);
    }

    const destination = NAVIGATION_BY_TYPE[notification.type];
    setIsOpen(false);
    if (destination) router.push(destination);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => setIsOpen((value) => !value)}
        className={`relative cursor-pointer ${iconClassName}`}
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-secondary px-1 text-[10px] font-bold text-primary">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-8 z-50 max-h-96 w-80 overflow-y-auto rounded-xl border border-primary bg-white"
          style={{ boxShadow: "0 4px 20px color-mix(in srgb, var(--color-primary) 15%, transparent)" }}
        >
          <div className="flex items-center justify-between border-b border-primary px-4 py-3">
            <p className="text-sm font-semibold text-black">Notifications</p>
            {unreadCount > 0 && (
              <button type="button" onClick={handleMarkAllRead} className="text-xs text-primary underline">
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p className="py-8 text-center text-sm text-primary-mid">No notifications yet.</p>
          ) : (
            notifications.map((notification) => {
              const { Icon, className } = TYPE_ICONS[notification.type] ?? DEFAULT_ICON;
              return (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => handleNotificationClick(notification)}
                  className={`flex w-full items-start gap-3 border-b border-l-[3px] border-primary px-4 py-3 text-left hover:bg-secondary/5 ${
                    notification.is_read ? "border-l-transparent" : "border-l-secondary"
                  }`}
                >
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${className}`}>
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-semibold text-black">{notification.title}</p>
                    {notification.body && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-primary-mid">{notification.body}</p>
                    )}
                    <p className="mt-1 text-[10px] text-primary-mid">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
