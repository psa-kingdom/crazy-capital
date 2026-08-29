'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  CheckCheck,
  Check,
  Mail,
  MessageSquare,
  Smartphone,
  Info,
  AlertTriangle,
  FileCheck2,
  Clock,
  X,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { notificationsApi } from '../../lib/api';
import { useAuthStore } from '../../lib/auth-store';

export interface NotificationItem {
  id: string;
  channel: 'EMAIL' | 'SMS' | 'WHATSAPP' | 'IN_APP';
  eventType: string;
  subject?: string;
  body: string;
  status: string;
  metadata?: {
    isRead?: boolean;
    readAt?: string | null;
    actionUrl?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    [key: string]: any;
  };
  createdAt: string;
}

const DEFAULT_DEMO_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-demo-1',
    channel: 'IN_APP',
    eventType: 'lead.priority_assigned',
    subject: 'High Priority Lead Assigned',
    body: 'Lead "Vikramaditya Solar Power Pvt Ltd" (Valuation: ₹25L) assigned with AI Lead Score 94/100.',
    status: 'DELIVERED',
    metadata: { isRead: false, priority: 'URGENT', actionUrl: '/leads' },
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif-demo-2',
    channel: 'WHATSAPP',
    eventType: 'document.ocr_verified',
    subject: 'AI OCR Document Verified',
    body: 'Certificate of Incorporation for "Apex Advisors LLP" successfully extracted with 99.2% confidence.',
    status: 'SENT',
    metadata: { isRead: false, priority: 'HIGH', actionUrl: '/documents' },
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif-demo-3',
    channel: 'EMAIL',
    eventType: 'mandate.autopay_debited',
    subject: 'UPI AutoPay Debit Executed',
    body: 'Monthly retainer of ₹2,999 successfully debited via NPCI e-Mandate (Txn: CC-DEBIT-88219).',
    status: 'SENT',
    metadata: { isRead: true, readAt: new Date().toISOString(), actionUrl: '/mandates' },
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: 'notif-demo-4',
    channel: 'IN_APP',
    eventType: 'sla.breach_warning',
    subject: 'SLA Escalation Warning',
    body: 'Task "DSC Verification for OPC Registration" is approaching 4-hour SLA threshold (Escalation Level 1).',
    status: 'DELIVERED',
    metadata: { isRead: true, readAt: new Date().toISOString(), priority: 'URGENT', actionUrl: '/sla' },
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  },
];

export function NotificationCentre({ className = '' }: { className?: string }) {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'ALL' | 'UNREAD'>('ALL');
  const [notifications, setNotifications] = useState<NotificationItem[]>(DEFAULT_DEMO_NOTIFICATIONS);
  const [unreadCount, setUnreadCount] = useState(2);
  const [loading, setLoading] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    setMounted(true);
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const fetchNotifications = async () => {
    try {
      const hasToken =
        typeof window !== 'undefined' &&
        (localStorage.getItem('cc_access_token') ||
         localStorage.getItem('cc_customer_token'));

      if (!hasToken) {
        setUnreadCount(notifications.filter((n) => !n.metadata?.isRead).length);
        return;
      }

      const [notifsRes, countRes] = await Promise.allSettled([
        notificationsApi.getMyNotifications(),
        notificationsApi.getUnreadCount(),
      ]);

      if (notifsRes.status === 'fulfilled') {
        const rawData = notifsRes.value?.data;
        const list = Array.isArray(rawData)
          ? rawData
          : Array.isArray(rawData?.data)
          ? rawData.data
          : null;
        if (list && list.length > 0) {
          setNotifications(list);
        }
      }

      if (countRes.status === 'fulfilled') {
        const countData = countRes.value?.data;
        const count =
          typeof countData?.unreadCount === 'number'
            ? countData.unreadCount
            : typeof countData?.data?.unreadCount === 'number'
            ? countData.data.unreadCount
            : undefined;

        if (count !== undefined) {
          setUnreadCount(count);
        } else {
          setUnreadCount(notifications.filter((n) => !n.metadata?.isRead).length);
        }
      }
    } catch {
      // Keep local state intact
    }
  };

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await notificationsApi.markAsRead(id);
    } catch {}

    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, metadata: { ...(n.metadata || {}), isRead: true } } : n
      )
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
    } catch {}

    setNotifications((prev) =>
      prev.map((n) => ({ ...n, metadata: { ...(n.metadata || {}), isRead: true } }))
    );
    setUnreadCount(0);
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'EMAIL':
        return <Mail className="w-3.5 h-3.5 text-blue-500" />;
      case 'WHATSAPP':
        return <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />;
      case 'SMS':
        return <Smartphone className="w-3.5 h-3.5 text-amber-500" />;
      default:
        return <Bell className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />;
    }
  };

  const formatRelativeTime = (isoString: string) => {
    if (!mounted) return '';
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);

      if (diffMin < 1) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffHour < 24) return `${diffHour}h ago`;
      return `${diffDay}d ago`;
    } catch {
      return '';
    }
  };

  const filtered = notifications.filter((n) => {
    if (activeTab === 'UNREAD') return !n.metadata?.isRead;
    return true;
  });

  return (
    <div className={`relative ${className}`} ref={popoverRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        aria-label="Open notifications center"
        title="Notifications & Alerts"
        className="relative p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-xs"
      >
        <Bell className="w-4 h-4" />
        {mounted && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-950 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl z-50 overflow-hidden transition-all animate-in fade-in zoom-in-95 duration-150">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                Notification Centre
              </span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-50 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                  {unreadCount} unread
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-[11px] font-medium text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                >
                  <CheckCheck className="w-3 h-3" />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex border-b border-slate-100 dark:border-slate-800 px-4 bg-white dark:bg-slate-900 text-xs">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`py-2.5 px-3 font-semibold border-b-2 transition-colors ${
                activeTab === 'ALL'
                  ? 'border-brand-600 text-brand-600 dark:text-brand-400 dark:border-brand-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setActiveTab('UNREAD')}
              className={`py-2.5 px-3 font-semibold border-b-2 transition-colors ${
                activeTab === 'UNREAD'
                  ? 'border-brand-600 text-brand-600 dark:text-brand-400 dark:border-brand-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Unread ({notifications.filter((n) => !n.metadata?.isRead).length})
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-10 h-10 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="font-semibold text-xs text-slate-900 dark:text-white">
                  You&apos;re all caught up!
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  No {activeTab === 'UNREAD' ? 'unread ' : ''}notifications at this time.
                </div>
              </div>
            ) : (
              filtered.map((item) => {
                const isRead = !!item.metadata?.isRead;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleMarkAsRead(item.id)}
                    className={`p-3.5 flex gap-3 items-start transition-colors cursor-pointer ${
                      isRead
                        ? 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        : 'bg-brand-50/40 dark:bg-brand-950/30 hover:bg-brand-50/70 dark:hover:bg-brand-950/50'
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shrink-0 mt-0.5">
                      {getChannelIcon(item.channel)}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-xs font-semibold truncate ${isRead ? 'text-slate-800 dark:text-slate-200' : 'text-slate-900 dark:text-white'}`}>
                          {item.subject || item.eventType}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap shrink-0">
                          {formatRelativeTime(item.createdAt)}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                        {item.body}
                      </p>

                      <div className="flex items-center gap-2 pt-1">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {item.channel}
                        </span>
                        {!isRead && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300">
                            New
                          </span>
                        )}
                        {item.metadata?.actionUrl && (
                          <span className="text-[10px] text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-0.5 ml-auto">
                            View <ExternalLink className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                    </div>

                    {!isRead && (
                      <button
                        onClick={(e) => handleMarkAsRead(item.id, e)}
                        title="Mark as read"
                        className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 shrink-0"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="p-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-center">
            <a
              href="/notifications"
              className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
            >
              View Full Statutory Audit Logs ➔
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
