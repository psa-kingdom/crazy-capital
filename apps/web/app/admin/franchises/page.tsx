'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Coins,
  Percent,
  Layers,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  FileCheck,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { franchisesApi } from '../../../lib/api';

export default function AdminFranchisesPage() {
  const [franchises, setFranchises] = useState<any[]>([]);
  const [settlements, setSettlements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'FRANCHISES' | 'SETTLEMENTS' | 'PRICING'>('FRANCHISES');

  // Form states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    franchiseType: 'CITY_FRANCHISE',
    legalEntityName: '',
    cinGstin: '',
    primaryContactName: '',
    phone: '',
    email: '',
    city: 'Noida',
    state: 'Uttar Pradesh',
    revenueSharePct: 70.0,
    securityDeposit: 500000,
  });

  const [settlementFranchiseId, setSettlementFranchiseId] = useState('');
  const [generatingSettlement, setGeneratingSettlement] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [fRes, sRes] = await Promise.allSettled([
        franchisesApi.getFranchises(),
        franchisesApi.getSettlements(''),
      ]);

      if (fRes.status === 'fulfilled') {
        const list = fRes.value.data?.data || fRes.value.data || [];
        setFranchises(Array.isArray(list) ? list : []);
        if (list.length > 0 && !settlementFranchiseId) {
          setSettlementFranchiseId(list[0].id);
        }
      }
      if (sRes.status === 'fulfilled') {
        const sList = sRes.value.data?.data || sRes.value.data || [];
        setSettlements(Array.isArray(sList) ? sList : []);
      }
    } catch (err) {
      console.error('Failed to load franchises data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateFranchise = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await franchisesApi.createFranchise(formData);
      setShowCreateModal(false);
      await fetchData();
    } catch (err) {
      console.error('Failed to create franchise', err);
    }
  };

  const handleGenerateSettlement = async () => {
    if (!settlementFranchiseId) return;
    try {
      setGeneratingSettlement(true);
      await franchisesApi.generateSettlement(settlementFranchiseId, {
        periodStart: '2026-08-01',
        periodEnd: '2026-08-31',
        notes: 'Monthly August 2026 Automated Billing Run',
      });
      await fetchData();
    } catch (err) {
      console.error('Failed to generate settlement', err);
    } finally {
      setGeneratingSettlement(false);
    }
  };

  const handleApproveSettlement = async (id: string) => {
    try {
      await franchisesApi.approveSettlement(id);
      await fetchData();
    } catch (err) {
      console.error('Failed to approve settlement', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="font-bold text-lg text-slate-100 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-black">
                CC
              </div>
              <span>Crazy Capital Admin</span>
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-sm font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              Franchise Management & 70/30 Revenue Sharing
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition"
            >
              <Plus className="w-4 h-4" />
              Onboard Franchise
            </button>
            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* KPI Overview */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Active Franchises</div>
            <div className="text-2xl font-black text-slate-100">{franchises.length}</div>
            <p className="text-xs text-slate-500 mt-1">Nationwide Hubs</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Standard Split</div>
            <div className="text-2xl font-black text-amber-400">70% / 30%</div>
            <p className="text-xs text-amber-500/80 mt-1">Franchise / HQ Retained</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Pending Settlements</div>
            <div className="text-2xl font-black text-purple-400">
              {settlements.filter((s) => s.status === 'PENDING_APPROVAL').length}
            </div>
            <p className="text-xs text-purple-500/80 mt-1">Awaiting approval</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Settled Disbursed</div>
            <div className="text-2xl font-black text-emerald-400">
              ₹{settlements.reduce((acc, s) => acc + (s.status === 'SETTLED' ? Number(s.netPayableAmount) : 0), 0).toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-emerald-500/80 mt-1">Total revenue shared</p>
          </div>
        </section>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 space-x-4">
          {[
            { id: 'FRANCHISES', label: `Franchise Directory (${franchises.length})`, icon: Building2 },
            { id: 'SETTLEMENTS', label: `Monthly Settlements & Approvals (${settlements.length})`, icon: Coins },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition ${
                  active
                    ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: FRANCHISES DIRECTORY */}
        {activeTab === 'FRANCHISES' && (
          <div className="space-y-4">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="divide-y divide-slate-800">
                {franchises.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">No franchises registered yet.</div>
                ) : (
                  franchises.map((f) => (
                    <div key={f.id} className="p-5 hover:bg-slate-800/40 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-100 text-base">{f.name}</span>
                          <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-amber-400 border border-slate-700">
                            {f.code}
                          </span>
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {f.franchiseType}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-3">
                          <span>Entity: {f.legalEntityName || 'Crazy Capital Partner Network'}</span>
                          <span>•</span>
                          <span>Location: {f.city}, {f.state}</span>
                          <span>•</span>
                          <span>Share: {f.revenueSharePct}%</span>
                          <span>•</span>
                          <span>Deposit: ₹{Number(f.securityDeposit).toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {f.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MONTHLY REVENUE SHARING SETTLEMENTS */}
        {activeTab === 'SETTLEMENTS' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-100">Generate Settlement Calculation</h3>
                <p className="text-xs text-slate-400 mt-0.5">Calculates 70/30 split from paid branch invoices for the selected period.</p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={settlementFranchiseId}
                  onChange={(e) => setSettlementFranchiseId(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none"
                >
                  {franchises.map((f) => (
                    <option key={f.id} value={f.id}>{f.name} ({f.code})</option>
                  ))}
                </select>
                <button
                  onClick={handleGenerateSettlement}
                  disabled={generatingSettlement}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition disabled:opacity-50"
                >
                  {generatingSettlement ? 'Calculating...' : 'Run Settlement Run'}
                </button>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="divide-y divide-slate-800">
                {settlements.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">No settlement records generated yet.</div>
                ) : (
                  settlements.map((s) => (
                    <div key={s.id} className="p-5 hover:bg-slate-800/40 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-slate-100">{s.settlementReference}</span>
                          <span className="text-xs text-slate-400">({s.franchise?.name || 'Franchise Hub'})</span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                          <span>Gross: ₹{Number(s.grossRevenue).toLocaleString('en-IN')}</span>
                          <span>•</span>
                          <span className="text-amber-400 font-semibold">Franchise (70%): ₹{Number(s.franchiseShareAmount).toLocaleString('en-IN')}</span>
                          <span>•</span>
                          <span className="text-slate-300">HQ (30%): ₹{Number(s.crazyCapitalRetainedAmount).toLocaleString('en-IN')}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                            s.status === 'APPROVED'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                          }`}
                        >
                          {s.status}
                        </span>
                        {s.status === 'PENDING_APPROVAL' && (
                          <button
                            onClick={() => handleApproveSettlement(s.id)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
                          >
                            Approve Settlement
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal: Onboard Franchise */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl">
              <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-400" />
                Onboard New Franchise Location
              </h3>
              <form onSubmit={handleCreateFranchise} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Franchise Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Noida Central Franchise"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Code *</label>
                    <input
                      type="text"
                      required
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="FR-NOIDA-01"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Revenue Share (%)</label>
                    <input
                      type="number"
                      value={formData.revenueSharePct}
                      onChange={(e) => setFormData({ ...formData, revenueSharePct: parseFloat(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">State</label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                  >
                    Create Franchise
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
