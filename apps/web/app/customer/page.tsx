'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Layers,
  FileCheck2,
  Receipt,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  FileUp,
  CreditCard,
  Building2,
  Shield,
  Sparkles,
} from 'lucide-react';
import { CustomerShell } from '../../components/layout/customer-shell';
import { customerPortalApi } from '../../lib/api';
import { CustomerDashboardDto } from '@cc/types';

export default function CustomerDashboardPage() {
  const [dashboard, setDashboard] = useState<CustomerDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await customerPortalApi.getDashboard();
      setDashboard(res.data?.data || res.data || null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load customer dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  return (
    <CustomerShell>
      <div className="space-y-8">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-indigo-200 border border-white/15 backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Customer Command Center
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Welcome, {dashboard?.customer?.firstName || 'Valued Client'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                Track your corporate filings, upload compliance documents, and manage invoices with real-time operational transparency.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchDashboard}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <Link
                href="/customer/applications"
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-950 bg-white hover:bg-slate-100 rounded-xl shadow-md transition-all"
              >
                View Applications
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Filings</span>
              <Layers className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">
              {loading ? '—' : dashboard?.stats?.activeApplications || 0}
            </p>
            <span className="text-xs text-indigo-600 mt-1 block">In processing queue</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Completed</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">
              {loading ? '—' : dashboard?.stats?.completedApplications || 0}
            </p>
            <span className="text-xs text-emerald-600 mt-1 block">Successfully delivered</span>
          </div>

          <div className={`p-5 rounded-2xl border shadow-xs ${
            (dashboard?.stats?.missingDocumentsCount || 0) > 0
              ? 'bg-amber-50/50 border-amber-200 text-amber-900'
              : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">Missing Docs</span>
              <FileCheck2 className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-amber-800 mt-2">
              {loading ? '—' : dashboard?.stats?.missingDocumentsCount || 0}
            </p>
            <span className="text-xs text-amber-700 mt-1 block">Mandatory KYC / filings</span>
          </div>

          <div className={`p-5 rounded-2xl border shadow-xs ${
            (dashboard?.stats?.unpaidInvoicesCount || 0) > 0
              ? 'bg-blue-50/50 border-blue-200 text-blue-900'
              : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">Pending Billing</span>
              <Receipt className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-800 mt-2">
              ₹{loading ? '—' : (dashboard?.stats?.unpaidAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
            <span className="text-xs text-blue-700 mt-1 block">
              {dashboard?.stats?.unpaidInvoicesCount || 0} unpaid invoices
            </span>
          </div>
        </div>

        {/* Missing Documents Urgent Action Banner */}
        {(dashboard?.stats?.missingDocumentsCount || 0) > 0 && (
          <div className="p-5 bg-gradient-to-r from-amber-500/10 via-amber-50 to-white border border-amber-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-amber-900">Action Required: Upload Compliance Documents</h3>
                <p className="text-xs text-amber-700 mt-0.5">
                  You have {dashboard?.stats?.missingDocumentsCount} mandatory documents pending. Operations will resume immediately upon verification.
                </p>
              </div>
            </div>
            <Link
              href="/customer/documents"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors self-start sm:self-auto"
            >
              <FileUp className="w-3.5 h-3.5" />
              Open Document Vault
            </Link>
          </div>
        )}

        {/* Main Grid: Active Applications & Quick Invoices */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Applications Column (2 Cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                Active Applications & Filing Progress
              </h2>
              <Link
                href="/customer/applications"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                View all ({dashboard?.stats?.totalApplications || 0})
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                Loading your active applications...
              </div>
            ) : (dashboard?.activeApplications?.length || 0) === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                No active service applications in progress.
              </div>
            ) : (
              <div className="space-y-3">
                {dashboard?.activeApplications.map((app) => (
                  <div
                    key={app.id}
                    className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-indigo-200 hover:shadow-md transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                            {app.applicationNumber}
                          </span>
                          <span className="text-xs font-bold text-slate-900">{app.serviceName}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                          <span>Current Stage: <strong>{app.currentStageName}</strong></span>
                          <span>•</span>
                          <span>Started {new Date(app.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        {app.missingDocsCount > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-semibold">
                            {app.missingDocsCount} docs needed
                          </span>
                        )}
                        <Link
                          href={`/customer/applications/${app.id}`}
                          className="px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-1"
                        >
                          Cockpit
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>

                    {/* Progress Stepper Bar */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                        <span>Workflow Progress</span>
                        <span className="text-indigo-600 font-bold">{app.progressPercent}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-500"
                          style={{ width: `${app.progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Invoices & Quick Pay Column (1 Col) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-600" />
                Invoices & Billing
              </h2>
              <Link
                href="/customer/billing"
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                All invoices
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
              {(dashboard?.recentInvoices?.length || 0) === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No invoices generated yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {dashboard?.recentInvoices.map((inv) => (
                    <div key={inv.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                      <div>
                        <div className="font-mono font-bold text-xs text-slate-900">{inv.invoiceNumber}</div>
                        <div className="text-[11px] text-slate-500">
                          {new Date(inv.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-xs text-slate-900">
                          ₹{Number(inv.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          inv.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {inv.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 border-t border-slate-100">
                <Link
                  href="/customer/billing"
                  className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition-colors flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  View Full Billing Ledger
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CustomerShell>
  );
}
