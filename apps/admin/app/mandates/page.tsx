'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  Play,
  Pause,
  XCircle,
  CheckCircle2,
  RefreshCw,
  Zap,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { mandatesApi } from '../../lib/api';

interface SubscriptionMandate {
  id: string;
  customerId: string;
  customerName?: string;
  planName: string;
  frequency: string;
  amount: number;
  status: 'ACTIVE' | 'PAUSED' | 'CANCELLED';
  gatewayMandateId?: string;
  paymentMethod: string;
  nextBillingDate: string;
  lastBilledDate?: string;
  createdAt: string;
}

export default function MandatesPage() {
  const [mandates, setMandates] = useState<SubscriptionMandate[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [debitingId, setDebitingId] = useState<string | null>(null);
  const [debitResult, setDebitResult] = useState<any>(null);

  // Form State
  const [formData, setFormData] = useState({
    customerId: 'cust-demo-1234',
    planName: 'Annual ROC & GST Filing Retainer',
    frequency: 'MONTHLY',
    amount: 2999,
    paymentMethod: 'UPI_AUTOPAY',
  });

  useEffect(() => {
    fetchMandates();
  }, []);

  const fetchMandates = async () => {
    setLoading(true);
    try {
      const res: any = await mandatesApi.listMandates();
      setMandates(res?.data || res || []);
    } catch (e) {
      console.error('Failed to load subscription mandates:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMandate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await mandatesApi.createMandate(formData);
      setModalOpen(false);
      await fetchMandates();
    } catch (e) {
      console.error('Failed to create mandate:', e);
    }
  };

  const handleExecuteDebit = async (mandateId: string) => {
    setDebitingId(mandateId);
    setDebitResult(null);
    try {
      const res: any = await mandatesApi.executeDebit(mandateId);
      setDebitResult(res?.data || res);
      await fetchMandates();
    } catch (e) {
      console.error('Debit execution failed:', e);
    } finally {
      setDebitingId(null);
    }
  };

  const handleUpdateStatus = async (mandateId: string, newStatus: 'ACTIVE' | 'PAUSED' | 'CANCELLED') => {
    try {
      await mandatesApi.updateStatus(mandateId, { status: newStatus });
      await fetchMandates();
    } catch (e) {
      console.error('Failed to update mandate status:', e);
    }
  };

  const activeCount = Array.isArray(mandates) ? mandates.filter((m) => m.status === 'ACTIVE').length : 0;
  const mrrTotal = Array.isArray(mandates)
    ? mandates.filter((m) => m.status === 'ACTIVE').reduce((sum, m) => sum + Number(m.amount), 0)
    : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <CreditCard className="h-6 w-6 text-brand-600" />
              UPI AutoPay & Recurring Mandates Hub
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <Zap className="w-3 h-3 mr-1" />
              NPCI e-Mandate Active
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Automated recurring retainers, annual ROC compliance subscriptions, and direct UPI AutoPay debit lifecycle.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create Subscription Mandate
          </button>
          <button
            onClick={fetchMandates}
            className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
            title="Refresh mandates"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active Mandates</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{activeCount}</div>
          <div className="text-xs text-slate-500 mt-1">Direct debit enabled</div>
        </div>

        <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Monthly Recurring (MRR)</span>
            <TrendingUp className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            ₹{mrrTotal.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-emerald-600 font-medium mt-1">
            +18.4% annualized growth
          </div>
        </div>

        <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Debit Success Rate</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">99.4%</div>
          <div className="text-xs text-slate-500 mt-1">UPI AutoPay 2.0 protocol</div>
        </div>

        <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Next Cycle Debits</span>
            <Calendar className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">₹42,500</div>
          <div className="text-xs text-slate-500 mt-1">Scheduled next 7 days</div>
        </div>
      </div>

      {/* Debit Result Banner */}
      {debitResult && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Debit Successful:</strong> Debited ₹{debitResult.amountDebited} (Txn: {debitResult.transactionId})
            </span>
          </div>
          <button onClick={() => setDebitResult(null)} className="text-xs underline hover:opacity-80">
            Dismiss
          </button>
        </div>
      )}

      {/* Mandates Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
          <h3 className="font-semibold text-sm text-slate-900">Registered Subscriptions</h3>
          <span className="text-xs text-slate-500">{Array.isArray(mandates) ? mandates.length : 0} total subscriptions</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Customer</th>
                <th className="py-3.5 px-4 font-semibold">Plan Name</th>
                <th className="py-3.5 px-4 font-semibold">Frequency</th>
                <th className="py-3.5 px-4 font-semibold">Amount</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold">Next Debit</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!Array.isArray(mandates) || mandates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    {loading ? 'Loading subscription mandates...' : 'No recurring subscriptions found.'}
                  </td>
                </tr>
              ) : (
                mandates.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      {m.customerName || 'Demo Customer'}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900">{m.planName}</div>
                      <div className="text-[11px] font-mono text-slate-500">{m.paymentMethod}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        {m.frequency}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      ₹{Number(m.amount).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                          m.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : m.status === 'PAUSED'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {new Date(m.nextBillingDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      {m.status === 'ACTIVE' && (
                        <>
                          <button
                            onClick={() => handleExecuteDebit(m.id)}
                            disabled={debitingId === m.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded bg-brand-600 text-white hover:bg-brand-700 transition-colors disabled:opacity-50"
                            title="Execute instant charge"
                          >
                            <Play className="w-3 h-3" />
                            {debitingId === m.id ? 'Charging...' : 'Charge Now'}
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(m.id, 'PAUSED')}
                            className="p-1 rounded text-amber-600 hover:bg-amber-50 transition-colors"
                            title="Pause mandate"
                          >
                            <Pause className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      {m.status === 'PAUSED' && (
                        <button
                          onClick={() => handleUpdateStatus(m.id, 'ACTIVE')}
                          className="p-1 rounded text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="Resume mandate"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {m.status !== 'CANCELLED' && (
                        <button
                          onClick={() => handleUpdateStatus(m.id, 'CANCELLED')}
                          className="p-1 rounded text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Cancel mandate"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Mandate Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-brand-600" />
                New Subscription Mandate
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMandate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Plan / Service Retainer Name</label>
                <input
                  type="text"
                  value={formData.planName}
                  onChange={(e) => setFormData({ ...formData, planName: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Frequency</label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-900"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="ANNUALLY">Annually</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Payment Method</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-900"
                >
                  <option value="UPI_AUTOPAY">UPI AutoPay 2.0</option>
                  <option value="ENACH_NETBANKING">e-NACH NetBanking Mandate</option>
                  <option value="CREDIT_CARD">Credit Card Auto-Debit</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors mt-2"
              >
                Register Subscription Mandate
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
