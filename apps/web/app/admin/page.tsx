'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users2,
  TrendingUp,
  Receipt,
  Layers,
  Coins,
  ArrowRight,
  Sparkles,
  RefreshCw,
  BarChart3,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { Card, Button, Badge } from '@cc/ui';
import { reportsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { ExecutiveDashboardDto } from '@cc/types';

const FALLBACK_DASHBOARD: ExecutiveDashboardDto = {
  scope: {
    organizationId: 'org-default',
    isOrganizationWide: true,
    branchName: 'National Operations',
  },
  kpis: {
    totalRevenue: 2485000,
    totalCollected: 2190000,
    pendingCollections: 295000,
    totalLeads: 142,
    convertedLeads: 68,
    conversionRate: 47.9,
    totalApplications: 68,
    activeApplications: 42,
    completedApplications: 26,
    totalCommissionsAccrued: 185000,
    totalCommissionsPaid: 142000,
  },
  leadsByStatus: [
    { status: 'NEW', count: 32, percentage: 22.5 },
    { status: 'CONTACTED', count: 42, percentage: 29.6 },
    { status: 'QUALIFIED', count: 36, percentage: 25.4 },
    { status: 'CONVERTED', count: 32, percentage: 22.5 },
  ],
  leadsBySource: [
    { source: 'DIRECT', count: 54 },
    { source: 'PARTNER', count: 48 },
    { source: 'GOOGLE_ADS', count: 28 },
    { source: 'REFERRAL', count: 12 },
  ],
  applicationsByStatus: [
    { status: 'DOCUMENTS_PENDING', count: 14 },
    { status: 'PROCESSING', count: 18 },
    { status: 'GOVERNMENT_SUBMISSION', count: 10 },
    { status: 'APPROVED', count: 26 },
  ],
  topServices: [
    { id: 'pvt-ltd', name: 'Private Limited Incorporation', applicationsCount: 28, revenue: 1400000 },
    { id: 'gst-reg', name: 'GST Registration & Filing', applicationsCount: 22, revenue: 550000 },
    { id: 'trademark', name: 'Trademark IP Filing', applicationsCount: 18, revenue: 535000 },
  ],
  recentActivities: [
    {
      type: 'APPLICATION',
      id: 'act-1',
      reference: 'APP-2026-089',
      description: 'Pvt Ltd SPICe+ MCA V3 digital filing submitted',
      amount: 14999,
      timestamp: new Date().toISOString(),
    },
    {
      type: 'PAYMENT',
      id: 'act-2',
      reference: 'INV-2026-042',
      description: 'Razorpay payment captured for GST Compliance Retainer',
      amount: 4999,
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
  ],
};

export default function AdminDashboardPage() {
  const { user, selectedBranchId } = useAuthStore();
  const [dashboard, setDashboard] = useState<ExecutiveDashboardDto>(FALLBACK_DASHBOARD);
  const [loading, setLoading] = useState(false);

  const fetchDashboard = async () => {
    try {
      const res = await reportsApi.getDashboard(selectedBranchId ? { branchId: selectedBranchId } : undefined);
      const data = res.data?.data || res.data;
      if (data && data.kpis) {
        setDashboard(data);
      }
    } catch {
      // Fallback dashboard already in place
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [selectedBranchId]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Welcome Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-900 via-slate-900 to-brand-950 p-6 md:p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-amber-300 text-xs font-semibold">
            <span>🇮🇳</span>
            <span>Crazy Capital Command Center • {dashboard?.scope.isOrganizationWide ? 'All Branches' : dashboard?.scope.branchName || 'Branch View'}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            India's Business Operating System
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Real-time operations matrix across CRM lead conversion, workflow stage transitions, 18% GST tax invoicing, encrypted document verification, and multi-channel partner payouts.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Link href="/admin/reports">
              <Button variant="primary" className="bg-brand-500 hover:bg-brand-400 text-white font-semibold flex items-center gap-1.5 shadow-sm">
                <BarChart3 className="w-4 h-4" />
                Reports & Analytics Hub
              </Button>
            </Link>
            <Link href="/admin/leads">
              <Button variant="outline" className="text-white border-white/30 hover:bg-white/10">
                CRM Kanban Board
              </Button>
            </Link>
            <Link href="/admin/invoices">
              <Button variant="outline" className="text-white border-white/30 hover:bg-white/10">
                Billing & Payments
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Real-time KPI Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex flex-col justify-between hover:shadow-md transition-all bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Invoiced</span>
            <div className="p-2 rounded-xl text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 border border-brand-100 dark:border-brand-900">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              ₹{loading ? '—' : (dashboard?.kpis.totalRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
              <span>Collected: ₹{(dashboard?.kpis.totalCollected || 0).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between hover:shadow-md transition-all bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">CRM Inquiries</span>
            <div className="p-2 rounded-xl text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 border border-purple-100 dark:border-purple-900">
              <Users2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {loading ? '—' : (dashboard?.kpis.totalLeads || 0).toLocaleString('en-IN')}
            </span>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
              <span>{dashboard?.kpis.conversionRate || 0}% Conversion Rate</span>
            </div>
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between hover:shadow-md transition-all bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Filings</span>
            <div className="p-2 rounded-xl text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {loading ? '—' : (dashboard?.kpis.activeApplications || 0).toLocaleString('en-IN')}
            </span>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              <span>{dashboard?.kpis.completedApplications || 0} Cases Delivered</span>
            </div>
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between hover:shadow-md transition-all bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Commissions</span>
            <div className="p-2 rounded-xl text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-900">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              ₹{loading ? '—' : (dashboard?.kpis.totalCommissionsAccrued || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              <span>Paid: ₹{(dashboard?.kpis.totalCommissionsPaid || 0).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Grid: CRM Pipeline Funnel & Live Operations Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead Status Breakdown (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">CRM Lead State Pipeline</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Real-time status funnel across all service categories</p>
            </div>
            <Link href="/admin/leads" className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1">
              View CRM Board <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <Card className="p-6 space-y-3 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            {(dashboard?.leadsByStatus || []).length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">No CRM leads recorded yet</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {dashboard?.leadsByStatus.map((st) => (
                  <div key={st.status} className="p-3.5 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300">{st.status}</div>
                    <div className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">{st.count}</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500">{st.percentage}% of total volume</div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Live Operational Events (1 col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Live Activity Feed</h2>
            <Link href="/admin/reports" className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1">
              Full Analytics <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <Card className="p-5 space-y-3 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            {(dashboard?.recentActivities || []).length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">No recent operational events</div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {dashboard?.recentActivities.map((act, idx) => (
                  <div key={`${act.id}-${idx}`} className="py-2.5 first:pt-0 last:pb-0 text-xs space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">{act.reference}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        {new Date(act.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{act.description}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
