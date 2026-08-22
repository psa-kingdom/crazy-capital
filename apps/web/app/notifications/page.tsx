'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  CheckCircle2,
  Clock,
  ArrowLeft,
  ChevronRight,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Receipt,
  FileCheck2,
  Layers,
} from 'lucide-react';
import { Card, Button, Badge } from '@cc/ui';
import { notificationsApi } from '../../lib/api';

interface CustomerNotification {
  id: string;
  channel: 'EMAIL' | 'SMS' | 'WHATSAPP' | 'IN_APP';
  eventType: string;
  recipient: string;
  subject?: string | null;
  body: string;
  status: 'SENT' | 'PENDING' | 'FAILED' | 'DELIVERED';
  sentAt?: string | null;
  createdAt: string;
}

export default function CustomerNotificationsPage() {
  const [notifications, setNotifications] = useState<CustomerNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<CustomerNotification | null>(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await notificationsApi.getMyNotifications();
      setNotifications(res.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const getEventIcon = (eventType: string) => {
    if (eventType.startsWith('invoice') || eventType.startsWith('payment')) {
      return <Receipt className="w-5 h-5 text-indigo-400" />;
    }
    if (eventType.startsWith('document')) {
      return <FileCheck2 className="w-5 h-5 text-emerald-400" />;
    }
    if (eventType.startsWith('workflow')) {
      return <Layers className="w-5 h-5 text-amber-400" />;
    }
    return <Bell className="w-5 h-5 text-blue-400" />;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/applications"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>

          <button
            onClick={fetchNotifications}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {/* Header Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900/50 via-slate-900 to-slate-950 border border-indigo-500/20 p-8 shadow-2xl">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-3">
                <Sparkles className="w-3.5 h-3.5" /> Real-Time Service Alerts
              </div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Notification History</h1>
              <p className="text-sm text-slate-400 mt-2 max-w-xl">
                Track all transactional updates, GST invoice alerts, payment confirmations, and government filing status dispatches.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-slate-900/80 backdrop-blur-md px-4 py-3 rounded-xl border border-slate-800 text-center">
                <div className="text-2xl font-bold text-white">{notifications.length}</div>
                <div className="text-xs text-slate-400">Total Alerts</div>
              </div>
            </div>
          </div>
        </div>

        {/* Notification List */}
        <div className="space-y-3">
          {loading ? (
            <div className="p-12 text-center text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800/80">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
              Loading your alerts...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800/80">
              <Bell className="w-8 h-8 mx-auto mb-3 text-slate-600" />
              <p className="text-sm">You have no notification alerts at this time.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => setSelectedNotification(n)}
                className="group p-5 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/30 rounded-xl transition-all cursor-pointer flex items-start justify-between gap-4 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5 group-hover:border-indigo-500/50 transition-colors">
                    {getEventIcon(n.eventType)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                        {n.channel}
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="text-xs text-slate-400">
                        {new Date(n.createdAt).toLocaleString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">
                      {n.subject || n.eventType}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{n.body}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-indigo-400 shrink-0 mt-2 transition-colors" />
              </div>
            ))
          )}
        </div>

        {/* Modal / Drawer for notification details */}
        {selectedNotification && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                    {getEventIcon(selectedNotification.eventType)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {selectedNotification.subject || selectedNotification.eventType}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      Via {selectedNotification.channel} • {new Date(selectedNotification.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                {selectedNotification.body}
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedNotification(null)}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
