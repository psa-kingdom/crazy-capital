'use client';

import React, { useState, useEffect } from 'react';
import {
  Coins,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  Building2,
  FileText,
  User,
  CreditCard,
  Send,
  X,
} from 'lucide-react';
import { commissionsApi, payoutsApi } from '../../lib/api';
import { CommissionDto, CommissionStatus } from '@cc/types';

export default function CommissionsPage() {
  const [commissions, setCommissions] = useState<CommissionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ALL' | CommissionStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [approveModalItem, setApproveModalItem] = useState<CommissionDto | null>(null);
  const [approveNotes, setApproveNotes] = useState('');
  const [rejectModalItem, setRejectModalItem] = useState<CommissionDto | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [payoutModalItem, setPayoutModalItem] = useState<CommissionDto | null>(null);
  const [payoutUtr, setPayoutUtr] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('BANK_TRANSFER');
  const [payoutNotes, setPayoutNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchCommissions = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, any> = {};
      if (activeTab !== 'ALL') {
        params.status = activeTab;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      const res = await commissionsApi.getCommissions(params);
      const items = res.data?.data?.data || res.data?.data || res.data || [];
      setCommissions(Array.isArray(items) ? items : []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load partner commissions queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommissions();
  }, [activeTab]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCommissions();
  };

  const handleApprove = async () => {
    if (!approveModalItem) return;
    try {
      setSubmitting(true);
      await commissionsApi.approveCommission(approveModalItem.id, { notes: approveNotes });
      setApproveModalItem(null);
      setApproveNotes('');
      await fetchCommissions();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to approve commission');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectModalItem || !rejectReason.trim()) return;
    try {
      setSubmitting(true);
      await commissionsApi.rejectCommission(rejectModalItem.id, { reason: rejectReason.trim() });
      setRejectModalItem(null);
      setRejectReason('');
      await fetchCommissions();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reject commission');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordPayout = async () => {
    if (!payoutModalItem || !payoutUtr.trim()) return;
    try {
      setSubmitting(true);
      await payoutsApi.recordManualPayout({
        commissionId: payoutModalItem.id,
        referenceNumber: payoutUtr.trim(),
        paymentMethod: payoutMethod,
        notes: payoutNotes.trim() || undefined,
      });
      setPayoutModalItem(null);
      setPayoutUtr('');
      setPayoutNotes('');
      await fetchCommissions();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to record manual payout');
    } finally {
      setSubmitting(false);
    }
  };

  // Aggregated Stats
  const totalAccrued = commissions.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const pendingCount = commissions.filter((c) => c.status === 'PENDING').length;
  const approvedCount = commissions.filter((c) => c.status === 'APPROVED').length;
  const paidTotal = commissions
    .filter((c) => c.status === 'PAID')
    .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Domain 9 • ADR-011 & ADR-014
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
              Admin Approval Required
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-2 flex items-center gap-2">
            <Coins className="w-7 h-7 text-emerald-600" />
            Partner Commissions & Payouts Engine
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review referral earnings, enforce Admin-only approval gates (ADR-011), and record verified bank payouts (ADR-014).
          </p>
        </div>

        <button
          onClick={fetchCommissions}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Queue
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Accrued</span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            ₹{totalAccrued.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-xs text-slate-400 mt-1 block">Across all partner referrals</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-amber-200/80 bg-amber-50/20 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-700 uppercase tracking-wider">Pending Approval</span>
            <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-700 mt-2">{pendingCount}</p>
          <span className="text-xs text-amber-600 mt-1 block">Awaiting Admin sign-off (ADR-011)</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-blue-200/80 bg-blue-50/20 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-blue-700 uppercase tracking-wider">Approved Unpaid</span>
            <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-blue-700 mt-2">{approvedCount}</p>
          <span className="text-xs text-blue-600 mt-1 block">Ready for bank UTR disbursement</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-emerald-200/80 bg-emerald-50/20 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-700 uppercase tracking-wider">Disbursed Payouts</span>
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-2">
            ₹{paidTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-xs text-emerald-600 mt-1 block">Settled via NEFT / IMPS</span>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          {(['ALL', 'PENDING', 'APPROVED', 'PAID', 'REJECTED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab === 'ALL' ? 'All Commissions' : tab}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search partner, case, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Case Reference</th>
                <th className="py-3.5 px-4">Service & Client</th>
                <th className="py-3.5 px-4">Partner Details</th>
                <th className="py-3.5 px-4 text-right">Base Amount</th>
                <th className="py-3.5 px-4 text-right">Rate</th>
                <th className="py-3.5 px-4 text-right">Commission</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                    Loading commissions queue...
                  </td>
                </tr>
              ) : commissions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No partner commissions found matching criteria.
                  </td>
                </tr>
              ) : (
                commissions.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Case Ref */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {c.application?.applicationNumber || 'APP-REFERRAL'}
                      <span className="block text-[10px] font-normal text-slate-400 font-sans">
                        {new Date(c.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </td>

                    {/* Service & Client */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{c.service?.name || 'Financial Service'}</div>
                      <div className="text-[11px] text-slate-500">
                        Client: {c.application?.customer?.fullName || 'Direct Customer'}
                      </div>
                    </td>

                    {/* Partner */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">
                        {c.partner ? `${c.partner.firstName} ${c.partner.lastName}` : 'Partner User'}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">{c.partner?.email}</div>
                    </td>

                    {/* Base Amount */}
                    <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                      ₹{Number(c.baseAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Rate */}
                    <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                      {Number(c.rate)}%
                    </td>

                    {/* Commission Amount */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700 text-sm">
                      ₹{Number(c.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center">
                      {c.status === 'PENDING' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                          <Clock className="w-3 h-3" /> PENDING APPROVAL
                        </span>
                      )}
                      {c.status === 'APPROVED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                          <CheckCircle2 className="w-3 h-3" /> APPROVED
                        </span>
                      )}
                      {c.status === 'PAID' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> PAID
                        </span>
                      )}
                      {c.status === 'REJECTED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                          <XCircle className="w-3 h-3" /> REJECTED
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      {c.status === 'PENDING' && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setApproveModalItem(c)}
                            className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => setRejectModalItem(c)}
                            className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {c.status === 'APPROVED' && (
                        <button
                          onClick={() => setPayoutModalItem(c)}
                          className="px-2.5 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
                        >
                          Record Payout
                        </button>
                      )}
                      {c.status === 'PAID' && (
                        <div className="text-[11px] font-mono text-emerald-700">
                          UTR: {c.payouts?.[0]?.referenceNumber || 'VERIFIED'}
                        </div>
                      )}
                      {c.status === 'REJECTED' && (
                        <div className="text-[11px] text-rose-600 truncate max-w-[140px]" title={c.rejectionReason || ''}>
                          {c.rejectionReason || 'Policy condition'}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Approve Commission (ADR-011) */}
      {approveModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Approve Partner Commission
              </h3>
              <button
                onClick={() => setApproveModalItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 text-xs space-y-1 text-emerald-950">
              <div><strong>Partner:</strong> {approveModalItem.partner?.firstName} {approveModalItem.partner?.lastName} ({approveModalItem.partner?.email})</div>
              <div><strong>Case Ref:</strong> {approveModalItem.application?.applicationNumber}</div>
              <div><strong>Approved Commission:</strong> <span className="font-bold text-emerald-700 text-sm">₹{Number(approveModalItem.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span> ({Number(approveModalItem.rate)}%)</div>
            </div>

            <div className="text-xs text-slate-500">
              Per <strong>ADR-011</strong>, this approval is Admin-authorized and will immediately queue this commission for manual bank payout and dispatch a multi-channel alert to the partner.
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Approval Notes (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="e.g., Verified MCA incorporation and customer full invoice payment."
                value={approveNotes}
                onChange={(e) => setApproveNotes(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setApproveModalItem(null)}
                disabled={submitting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={submitting}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
              >
                {submitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Confirm Admin Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Reject Commission (ADR-011) */}
      {rejectModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-rose-600 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-600" />
                Reject Partner Commission
              </h3>
              <button
                onClick={() => setRejectModalItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100 text-xs space-y-1 text-rose-950">
              <div><strong>Partner:</strong> {rejectModalItem.partner?.firstName} {rejectModalItem.partner?.lastName}</div>
              <div><strong>Case Ref:</strong> {rejectModalItem.application?.applicationNumber}</div>
              <div><strong>Claimed Amount:</strong> ₹{Number(rejectModalItem.amount).toLocaleString('en-IN')}</div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Rejection Reason (Required) *
              </label>
              <textarea
                rows={3}
                placeholder="Provide clear rationale (e.g. Lead was already an active client in Crazy Capital CRM, or client payment was refunded)."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRejectModalItem(null)}
                disabled={submitting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={submitting || !rejectReason.trim()}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {submitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Record Manual Payout (ADR-014) */}
      {payoutModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                Record Bank Payout (ADR-014)
              </h3>
              <button
                onClick={() => setPayoutModalItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-xs space-y-1 text-blue-950">
              <div><strong>Partner:</strong> {payoutModalItem.partner?.firstName} {payoutModalItem.partner?.lastName} ({payoutModalItem.partner?.email})</div>
              <div><strong>Case:</strong> {payoutModalItem.application?.applicationNumber}</div>
              <div><strong>Disbursement Amount:</strong> <span className="font-bold text-blue-700 text-sm">₹{Number(payoutModalItem.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bank UTR / Transaction Reference Number *
                </label>
                <input
                  type="text"
                  placeholder="e.g., AXISN26223847291 or HDFC00012398"
                  value={payoutUtr}
                  onChange={(e) => setPayoutUtr(e.target.value)}
                  className="w-full text-xs p-2.5 font-mono rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="BANK_TRANSFER">Bank Transfer (NEFT / IMPS / RTGS)</option>
                  <option value="UPI">UPI Transfer</option>
                  <option value="CHEQUE">Bank Cheque</option>
                  <option value="RAZORPAYX">RazorpayX Direct API</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Disbursement Remarks
                </label>
                <input
                  type="text"
                  placeholder="e.g., Transferred from HDFC Operating A/c to Partner ICICI"
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPayoutModalItem(null)}
                disabled={submitting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRecordPayout}
                disabled={submitting || !payoutUtr.trim()}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {submitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
                Disburse & Notify Partner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
