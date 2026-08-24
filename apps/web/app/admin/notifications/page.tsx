'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCw,
  Send,
  Search,
  Filter,
  Eye,
  Check,
  X,
  ExternalLink,
  ShieldCheck,
  Radio,
  Layers,
  Sparkles,
} from 'lucide-react';
import { AdminShell } from '@/components/layout/admin-shell';
import { notificationsApi } from '@/lib/api';
import { NotificationChannel, NotificationStatus } from '@cc/types';

interface NotificationLog {
  id: string;
  organizationId?: string | null;
  userId?: string | null;
  channel: NotificationChannel;
  eventType: string;
  recipient: string;
  subject?: string | null;
  body: string;
  status: NotificationStatus;
  provider: string;
  providerMessageId?: string | null;
  idempotencyKey?: string | null;
  attempts: number;
  errorMessage?: string | null;
  metadata?: any;
  sentAt?: string | null;
  createdAt: string;
}

export default function NotificationsPage() {
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedChannel, setSelectedChannel] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Modals
  const [selectedLog, setSelectedLog] = useState<NotificationLog | null>(null);
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  // Test Dispatch Form State
  const [testChannel, setTestChannel] = useState<NotificationChannel>('EMAIL');
  const [testRecipient, setTestRecipient] = useState('founder@crazycapital.in');
  const [testEventType, setTestEventType] = useState('test.dispatch');
  const [testCustomMessage, setTestCustomMessage] = useState(
    'Verification dispatch ping from Crazy Capital Staging Matrix',
  );
  const [testSubject, setTestSubject] = useState('Crazy Capital Staging Test Notification');
  const [dispatchingTest, setDispatchingTest] = useState(false);
  const [testSuccessMessage, setTestSuccessMessage] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, any> = { page, limit: 15 };
      if (selectedChannel) params.channel = selectedChannel;
      if (selectedStatus) params.status = selectedStatus;
      if (searchQuery) params.search = searchQuery;

      const res = await notificationsApi.getLogs(params);
      setLogs(res.data.data || []);
      setTotalPages(res.data.meta?.totalPages || 1);
      setTotalCount(res.data.meta?.total || 0);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch notification logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedChannel, selectedStatus, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleRetry = async (logId: string) => {
    try {
      setRetryingId(logId);
      await notificationsApi.retryLog(logId);
      await fetchLogs();
      if (selectedLog && selectedLog.id === logId) {
        const refreshed = await notificationsApi.getLogById(logId);
        setSelectedLog(refreshed.data);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to retry notification');
    } finally {
      setRetryingId(null);
    }
  };

  const handleSendTestDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setDispatchingTest(true);
      setTestSuccessMessage(null);
      const res = await notificationsApi.testDispatch({
        channel: testChannel,
        recipient: testRecipient,
        eventType: testEventType,
        customMessage: testCustomMessage,
        subject: testSubject,
      });

      setTestSuccessMessage(
        `Dispatched successfully via ${res.data.provider} (${res.data.status}). ID: ${res.data.id}`,
      );
      await fetchLogs();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Test dispatch failed');
    } finally {
      setDispatchingTest(false);
    }
  };

  // Metrics
  const emailCount = logs.filter((l) => l.channel === 'EMAIL').length;
  const smsCount = logs.filter((l) => l.channel === 'SMS').length;
  const whatsappCount = logs.filter((l) => l.channel === 'WHATSAPP').length;
  const sentCount = logs.filter((l) => l.status === 'SENT').length;
  const deliveryRate = logs.length > 0 ? Math.round((sentCount / logs.length) * 100) : 100;

  const getChannelBadge = (channel: NotificationChannel) => {
    switch (channel) {
      case 'EMAIL':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Mail className="w-3 h-3" /> Resend Email
          </span>
        );
      case 'SMS':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Smartphone className="w-3 h-3" /> MSG91 SMS
          </span>
        );
      case 'WHATSAPP':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <MessageSquare className="w-3 h-3" /> Interakt WhatsApp
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200">
            <Bell className="w-3 h-3" /> {channel}
          </span>
        );
    }
  };

  const getStatusBadge = (status: NotificationStatus) => {
    switch (status) {
      case 'SENT':
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> SENT
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
            <AlertCircle className="w-3 h-3 text-rose-600" /> FAILED
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            <Clock className="w-3 h-3 text-amber-600" /> PENDING
          </span>
        );
    }
  };

  return (
    <AdminShell>
      <div className="space-y-6 pb-12">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-md border border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Vertical Slice 1.9
              </span>
              <span className="text-xs text-slate-400 font-mono">ADR-020 Notification Matrix</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Event-Driven Notification Matrix</h1>
            <p className="text-sm text-slate-300 mt-1">
              Centralized multi-channel dispatch orchestrator: Resend Email, MSG91 SMS, and Interakt WhatsApp.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setTestSuccessMessage(null);
                setTestModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors border border-indigo-400/30"
            >
              <Send className="w-4 h-4" /> Staging Test Dispatcher
            </button>
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl border border-slate-700 transition-colors"
            >
              <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Dispatches</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalCount}</h3>
              <p className="text-xs text-slate-400 mt-1">Multi-channel events</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Layers className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Delivery Rate</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">{deliveryRate}%</h3>
              <p className="text-xs text-slate-400 mt-1">Sent & verified</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Resend Email</p>
              <h3 className="text-2xl font-bold text-indigo-900 mt-1">{emailCount}</h3>
              <p className="text-xs text-indigo-600 mt-1 font-medium">Transactional HTML</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Mail className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">WhatsApp & SMS</p>
              <h3 className="text-2xl font-bold text-emerald-900 mt-1">{whatsappCount + smsCount}</h3>
              <p className="text-xs text-emerald-600 mt-1 font-medium">Interakt + MSG91</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <MessageSquare className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-96">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search recipient, subject, event..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
            >
              Search
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <Filter className="w-3.5 h-3.5" /> Channel:
            </div>
            <select
              value={selectedChannel}
              onChange={(e) => {
                setSelectedChannel(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Channels</option>
              <option value="EMAIL">Resend Email</option>
              <option value="SMS">MSG91 SMS</option>
              <option value="WHATSAPP">Interakt WhatsApp</option>
            </select>

            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 ml-2">
              Status:
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="SENT">SENT</option>
              <option value="FAILED">FAILED</option>
              <option value="PENDING">PENDING</option>
            </select>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h2 className="text-sm font-bold text-slate-800">Delivery Audit Log Matrix</h2>
            <span className="text-xs text-slate-500">
              Showing {logs.length} of {totalCount} records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Channel</th>
                  <th className="px-5 py-3">Event Type</th>
                  <th className="px-5 py-3">Recipient</th>
                  <th className="px-5 py-3">Subject / Message</th>
                  <th className="px-5 py-3">Provider</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                      <RotateCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                      Loading notification logs...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                      <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      No notification logs found matching criteria.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap">{getChannelBadge(log.channel)}</td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                          {log.eventType}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap font-medium text-slate-900">
                        {log.recipient}
                      </td>
                      <td className="px-5 py-3.5 max-w-xs truncate text-xs text-slate-500">
                        {log.subject || log.body}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span
                          className={`text-xs font-mono font-medium px-2 py-0.5 rounded ${
                            log.provider === 'MOCK'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {log.provider}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">{getStatusBadge(log.status)}</td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-400">
                        {new Date(log.createdAt).toLocaleString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-right space-x-2">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
                          title="View Payload Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {log.status === 'FAILED' && (
                          <button
                            onClick={() => handleRetry(log.id)}
                            disabled={retryingId === log.id}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Retry Dispatch"
                          >
                            <RotateCw
                              className={`w-4 h-4 ${retryingId === log.id ? 'animate-spin' : ''}`}
                            />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg text-slate-700 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-xs text-slate-500">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg text-slate-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Modal: Staging Test Dispatcher */}
        {testModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
              <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold">Staging Test Dispatcher</h3>
                    <p className="text-xs text-slate-300">Simulate or test multi-channel events</p>
                  </div>
                </div>
                <button
                  onClick={() => setTestModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSendTestDispatch} className="p-6 space-y-4">
                {testSuccessMessage && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    {testSuccessMessage}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Target Channel
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['EMAIL', 'SMS', 'WHATSAPP'] as NotificationChannel[]).map((ch) => (
                      <button
                        type="button"
                        key={ch}
                        onClick={() => {
                          setTestChannel(ch);
                          if (ch === 'EMAIL') setTestRecipient('founder@crazycapital.in');
                          else setTestRecipient('+919876543210');
                        }}
                        className={`py-2 px-3 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-colors ${
                          testChannel === ch
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-300 ring-2 ring-indigo-500/20'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {ch === 'EMAIL' && <Mail className="w-3.5 h-3.5" />}
                        {ch === 'SMS' && <Smartphone className="w-3.5 h-3.5" />}
                        {ch === 'WHATSAPP' && <MessageSquare className="w-3.5 h-3.5" />}
                        {ch}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Event Type Simulation
                  </label>
                  <select
                    value={testEventType}
                    onChange={(e) => setTestEventType(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    <option value="test.dispatch">Custom Test Dispatch (test.dispatch)</option>
                    <option value="invoice.sent">Invoice Sent (invoice.sent)</option>
                    <option value="payment.captured">Payment Captured (payment.captured)</option>
                    <option value="workflow.stage_changed">Stage Changed (workflow.stage_changed)</option>
                    <option value="document.verified">Document Verified (document.verified)</option>
                    <option value="document.rejected">Document Rejected (document.rejected)</option>
                    <option value="auth.otp">OTP Code (auth.otp)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Recipient Address / Phone
                  </label>
                  <input
                    type="text"
                    required
                    value={testRecipient}
                    onChange={(e) => setTestRecipient(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    placeholder={testChannel === 'EMAIL' ? 'founder@crazycapital.in' : '+919876543210'}
                  />
                </div>

                {testChannel === 'EMAIL' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Subject Line
                    </label>
                    <input
                      type="text"
                      value={testSubject}
                      onChange={(e) => setTestSubject(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Message Body / Content
                  </label>
                  <textarea
                    rows={3}
                    value={testCustomMessage}
                    onChange={(e) => setTestCustomMessage(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setTestModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={dispatchingTest}
                    className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-50"
                  >
                    <Send className={`w-4 h-4 ${dispatchingTest ? 'animate-spin' : ''}`} />
                    {dispatchingTest ? 'Dispatching...' : 'Send Test Notification'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Detailed Log Inspector */}
        {selectedLog && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Notification Audit Inspector</h3>
                    <p className="text-xs text-slate-500 font-mono">ID: {selectedLog.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">Channel</span>
                    <span className="font-semibold text-slate-800">{selectedLog.channel}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Provider</span>
                    <span className="font-semibold text-indigo-600 font-mono">{selectedLog.provider}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Status</span>
                    <span className="font-semibold">{selectedLog.status}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Attempts</span>
                    <span className="font-semibold text-slate-800">{selectedLog.attempts}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Recipient</span>
                    <span className="font-semibold text-slate-800 truncate block">{selectedLog.recipient}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Sent At</span>
                    <span className="font-semibold text-slate-800">
                      {selectedLog.sentAt ? new Date(selectedLog.sentAt).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                </div>

                {selectedLog.subject && (
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                      Subject
                    </label>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800">
                      {selectedLog.subject}
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                    Compiled Message Body
                  </label>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 whitespace-pre-wrap font-sans">
                    {selectedLog.body}
                  </div>
                </div>

                {selectedLog.errorMessage && (
                  <div>
                    <label className="text-xs font-semibold text-rose-500 uppercase tracking-wider block mb-1">
                      Provider Error Details
                    </label>
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs font-mono text-rose-800">
                      {selectedLog.errorMessage}
                    </div>
                  </div>
                )}

                {selectedLog.metadata && (
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                      Metadata & Provider Payload
                    </label>
                    <pre className="p-3 bg-slate-900 text-slate-200 rounded-lg text-xs font-mono overflow-x-auto">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                {selectedLog.status === 'FAILED' ? (
                  <button
                    onClick={() => handleRetry(selectedLog.id)}
                    disabled={retryingId === selectedLog.id}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                  >
                    <RotateCw
                      className={`w-3.5 h-3.5 ${retryingId === selectedLog.id ? 'animate-spin' : ''}`}
                    />
                    Retry Notification
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                    <Check className="w-4 h-4" /> Message Delivered & Verified
                  </div>
                )}

                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
