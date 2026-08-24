'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Receipt,
  Users2,
  Layers,
  Building2,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Coins,
  ArrowUpRight,
  ShieldCheck,
  FileCheck2,
  UserCheck,
  FileSpreadsheet,
} from 'lucide-react';
import { Card, Button, Badge } from '@cc/ui';
import { reportsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import {
  ExecutiveDashboardDto,
  RevenueReportDto,
  LeadsReportDto,
  OperationsReportDto,
  BranchComparisonReportDto,
} from '@cc/types';

export default function ReportsAndAnalyticsPage() {
  const { user, selectedBranchId, setSelectedBranchId } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'REVENUE' | 'LEADS' | 'OPERATIONS' | 'BRANCHES'>('OVERVIEW');
  const [dateRange, setDateRange] = useState<'7D' | '30D' | '90D' | 'ALL'>('30D');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Datasets
  const [dashboard, setDashboard] = useState<ExecutiveDashboardDto | null>(null);
  const [revenueReport, setRevenueReport] = useState<RevenueReportDto | null>(null);
  const [leadsReport, setLeadsReport] = useState<LeadsReportDto | null>(null);
  const [operationsReport, setOperationsReport] = useState<OperationsReportDto | null>(null);
  const [branchReport, setBranchReport] = useState<BranchComparisonReportDto | null>(null);

  const calculateDateRange = () => {
    if (dateRange === 'ALL') return {};
    const now = new Date();
    const start = new Date();
    if (dateRange === '7D') start.setDate(now.getDate() - 7);
    else if (dateRange === '30D') start.setDate(now.getDate() - 30);
    else if (dateRange === '90D') start.setDate(now.getDate() - 90);
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0],
    };
  };

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const filterParams = {
        ...calculateDateRange(),
        ...(selectedBranchId ? { branchId: selectedBranchId } : {}),
      };

      if (activeTab === 'OVERVIEW') {
        const res = await reportsApi.getDashboard(filterParams);
        setDashboard(res.data?.data || res.data || null);
      } else if (activeTab === 'REVENUE') {
        const res = await reportsApi.getRevenue(filterParams);
        setRevenueReport(res.data?.data || res.data || null);
      } else if (activeTab === 'LEADS') {
        const res = await reportsApi.getLeads(filterParams);
        setLeadsReport(res.data?.data || res.data || null);
      } else if (activeTab === 'OPERATIONS') {
        const res = await reportsApi.getOperations(filterParams);
        setOperationsReport(res.data?.data || res.data || null);
      } else if (activeTab === 'BRANCHES') {
        const res = await reportsApi.getBranches(filterParams);
        setBranchReport(res.data?.data || res.data || null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load report analytics dataset');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, [activeTab, dateRange, selectedBranchId]);

  const handleExport = async (format: 'csv' | 'json' = 'csv') => {
    try {
      setExporting(true);
      const filterParams = {
        reportType: activeTab === 'OVERVIEW' ? 'DASHBOARD' : activeTab,
        format,
        ...calculateDateRange(),
        ...(selectedBranchId ? { branchId: selectedBranchId } : {}),
      };

      const res = await reportsApi.exportReport(filterParams);
      const blob = new Blob([res.data], { type: format === 'csv' ? 'text/csv' : 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `crazy_capital_${activeTab.toLowerCase()}_report.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const isBranchManager = user?.roles?.includes('BRANCH_MANAGER') && !user?.roles?.includes('ADMIN') && !user?.roles?.includes('SUPER_ADMIN');

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200 flex items-center gap-1">
              <BarChart3 className="w-3.5 h-3.5" />
              Vertical Slice 1.12 • Single Source of Truth
            </span>
            {isBranchManager && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                Branch-Scoped View
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-2 flex items-center gap-2">
            Operational Dashboards & Reporting Engine
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time financial reconciliation, multi-channel lead funnels, fulfillment SLAs, and multi-branch benchmarking.
          </p>
        </div>

        {/* Global Controls & Export */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {/* Date Range Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            {(['7D', '30D', '90D', 'ALL'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  dateRange === r
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {r === 'ALL' ? 'All Time' : r}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchReportsData}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => handleExport('csv')}
            disabled={exporting || loading}
            className="flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            {exporting ? 'Exporting...' : 'Export CSV'}
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-2">
        {[
          { id: 'OVERVIEW', label: 'Executive Overview', icon: BarChart3 },
          { id: 'REVENUE', label: 'Revenue & Billing', icon: Receipt },
          { id: 'LEADS', label: 'CRM & Lead Funnel', icon: Users2 },
          { id: 'OPERATIONS', label: 'Fulfillment & Stages', icon: Layers },
          { id: 'BRANCHES', label: 'Branch Comparisons', icon: Building2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: EXECUTIVE OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          {/* Main KPI Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Invoiced</span>
                <Receipt className="w-4 h-4 text-brand-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">
                ₹{loading ? '—' : (dashboard?.kpis.totalRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
              <div className="flex items-center justify-between text-[11px] mt-1 text-slate-500">
                <span>Collected: ₹{(dashboard?.kpis.totalCollected || 0).toLocaleString('en-IN')}</span>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Total CRM Leads</span>
                <Users2 className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">
                {loading ? '—' : (dashboard?.kpis.totalLeads || 0).toLocaleString('en-IN')}
              </p>
              <div className="flex items-center justify-between text-[11px] mt-1 text-emerald-600 font-semibold">
                <span>{dashboard?.kpis.conversionRate || 0}% Conversion Rate</span>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Active Filings</span>
                <Layers className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">
                {loading ? '—' : (dashboard?.kpis.activeApplications || 0).toLocaleString('en-IN')}
              </p>
              <div className="flex items-center justify-between text-[11px] mt-1 text-slate-500">
                <span>Completed: {dashboard?.kpis.completedApplications || 0}</span>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Partner Commissions</span>
                <Coins className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">
                ₹{loading ? '—' : (dashboard?.kpis.totalCommissionsAccrued || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
              <div className="flex items-center justify-between text-[11px] mt-1 text-slate-500">
                <span>Paid Out: ₹{(dashboard?.kpis.totalCommissionsPaid || 0).toLocaleString('en-IN')}</span>
              </div>
            </Card>
          </div>

          {/* Breakdown Grids */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lead Status Breakdown */}
            <Card className="p-5 space-y-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center justify-between">
                <span>CRM Lead Status Funnel</span>
                <Badge variant="default">{dashboard?.leadsByStatus.length || 0} States</Badge>
              </h2>

              <div className="space-y-2.5">
                {dashboard?.leadsByStatus.map((st) => (
                  <div key={st.status} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-700">{st.status}</span>
                      <span className="font-mono text-slate-900">{st.count} ({st.percentage}%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-500 rounded-full"
                        style={{ width: `${st.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Top Revenue Services */}
            <Card className="p-5 space-y-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center justify-between">
                <span>Top Service Verticals</span>
                <Badge variant="info">By Filings</Badge>
              </h2>

              <div className="divide-y divide-slate-100">
                {(dashboard?.topServices || []).length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">No active service records</div>
                ) : (
                  dashboard?.topServices.map((srv) => (
                    <div key={srv.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900">{srv.name}</div>
                        <div className="text-[11px] text-slate-500">{srv.applicationsCount} applications</div>
                      </div>
                      <div className="text-right font-mono font-bold text-slate-800">
                        ₹{srv.revenue.toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Recent Live Activity Stream */}
            <Card className="p-5 space-y-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center justify-between">
                <span>Operational Activity Feed</span>
                <Badge variant="success">Live</Badge>
              </h2>

              <div className="divide-y divide-slate-100">
                {(dashboard?.recentActivities || []).length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">No recent events recorded</div>
                ) : (
                  dashboard?.recentActivities.map((act, idx) => (
                    <div key={`${act.id}-${idx}`} className="py-2.5 first:pt-0 last:pb-0 text-xs space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{act.reference}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(act.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">{act.description}</p>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: REVENUE & BILLING */}
      {activeTab === 'REVENUE' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-5">
              <span className="text-xs font-semibold text-slate-500 uppercase">Total Invoiced</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                ₹{(revenueReport?.summary.totalInvoiced || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
              <span className="text-xs text-slate-400 mt-1 block">{revenueReport?.summary.invoicesCount || 0} invoices</span>
            </Card>

            <Card className="p-5 bg-emerald-50/40 border-emerald-200">
              <span className="text-xs font-semibold text-emerald-700 uppercase">Total Collected</span>
              <p className="text-2xl font-bold text-emerald-800 mt-1">
                ₹{(revenueReport?.summary.totalCollected || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
              <span className="text-xs text-emerald-600 mt-1 block">{revenueReport?.summary.paidInvoicesCount || 0} settled</span>
            </Card>

            <Card className="p-5 bg-blue-50/40 border-blue-200">
              <span className="text-xs font-semibold text-blue-700 uppercase">18% GST Component</span>
              <p className="text-2xl font-bold text-blue-800 mt-1">
                ₹{(revenueReport?.summary.totalTax || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
              <span className="text-xs text-blue-600 mt-1 block">Statutory tax liability</span>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue By Service */}
            <Card className="p-5 space-y-4">
              <h2 className="text-sm font-bold text-slate-900">Revenue Contribution By Service</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b">
                    <tr>
                      <th className="py-2.5 px-3">Service</th>
                      <th className="py-2.5 px-3 text-center">Invoices</th>
                      <th className="py-2.5 px-3 text-right">Revenue (INR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {revenueReport?.byService.map((s) => (
                      <tr key={s.serviceId} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{s.serviceName}</td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-600">{s.invoicesCount}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          ₹{s.totalRevenue.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Revenue By Branch */}
            <Card className="p-5 space-y-4">
              <h2 className="text-sm font-bold text-slate-900">Revenue Contribution By Branch</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b">
                    <tr>
                      <th className="py-2.5 px-3">Branch</th>
                      <th className="py-2.5 px-3 text-center">Invoices</th>
                      <th className="py-2.5 px-3 text-right">Revenue (INR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {revenueReport?.byBranch.map((b) => (
                      <tr key={b.branchId} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{b.branchName}</td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-600">{b.invoicesCount}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          ₹{b.totalRevenue.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 3: CRM & LEADS */}
      {activeTab === 'LEADS' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card className="p-5">
              <span className="text-xs font-semibold text-slate-500 uppercase">Total Inquiries</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">{leadsReport?.summary.totalLeads || 0}</p>
            </Card>
            <Card className="p-5">
              <span className="text-xs font-semibold text-slate-500 uppercase">Converted Clients</span>
              <p className="text-2xl font-bold text-emerald-700 mt-1">{leadsReport?.summary.convertedLeads || 0}</p>
            </Card>
            <Card className="p-5">
              <span className="text-xs font-semibold text-slate-500 uppercase">Conversion Efficiency</span>
              <p className="text-2xl font-bold text-brand-600 mt-1">{leadsReport?.summary.conversionRate || 0}%</p>
            </Card>
            <Card className="p-5">
              <span className="text-xs font-semibold text-slate-500 uppercase">Avg Quality Score</span>
              <p className="text-2xl font-bold text-purple-700 mt-1">{leadsReport?.summary.avgScore || 0}/100</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Channel Sources */}
            <Card className="p-5 space-y-4">
              <h2 className="text-sm font-bold text-slate-900">Inbound Acquisition Channels</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b">
                    <tr>
                      <th className="py-2.5 px-3">Lead Source</th>
                      <th className="py-2.5 px-3 text-center">Volume</th>
                      <th className="py-2.5 px-3 text-center">Converted</th>
                      <th className="py-2.5 px-3 text-right">Conversion Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {leadsReport?.bySource.map((src) => (
                      <tr key={src.source} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{src.source}</td>
                        <td className="py-2.5 px-3 text-center font-mono">{src.count}</td>
                        <td className="py-2.5 px-3 text-center font-mono text-emerald-700">{src.convertedCount}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold">{src.conversionRate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Employee Conversion Velocity */}
            <Card className="p-5 space-y-4">
              <h2 className="text-sm font-bold text-slate-900">Staff Conversion Velocity</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b">
                    <tr>
                      <th className="py-2.5 px-3">Employee</th>
                      <th className="py-2.5 px-3 text-center">Assigned</th>
                      <th className="py-2.5 px-3 text-center">Converted</th>
                      <th className="py-2.5 px-3 text-right">Win Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {leadsReport?.byEmployee.map((emp) => (
                      <tr key={emp.userId} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-900">{emp.name}</div>
                          <div className="text-[10px] text-slate-400">{emp.email}</div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono">{emp.assignedCount}</td>
                        <td className="py-2.5 px-3 text-center font-mono text-emerald-700">{emp.convertedCount}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-brand-600">{emp.conversionRate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 4: OPERATIONS & FULFILLMENT */}
      {activeTab === 'OPERATIONS' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card className="p-5">
              <span className="text-xs font-semibold text-slate-500 uppercase">Total Applications</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">{operationsReport?.summary.totalApplications || 0}</p>
            </Card>
            <Card className="p-5 bg-blue-50/40 border-blue-200">
              <span className="text-xs font-semibold text-blue-700 uppercase">In Progress</span>
              <p className="text-2xl font-bold text-blue-800 mt-1">{operationsReport?.summary.inProgress || 0}</p>
            </Card>
            <Card className="p-5 bg-emerald-50/40 border-emerald-200">
              <span className="text-xs font-semibold text-emerald-700 uppercase">Completed</span>
              <p className="text-2xl font-bold text-emerald-800 mt-1">{operationsReport?.summary.completed || 0}</p>
            </Card>
            <Card className="p-5 bg-amber-50/40 border-amber-200">
              <span className="text-xs font-semibold text-amber-700 uppercase">Document Audit</span>
              <p className="text-2xl font-bold text-amber-800 mt-1">{operationsReport?.documentsStatus.verified || 0} verified</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* By Stage */}
            <Card className="p-5 space-y-4">
              <h2 className="text-sm font-bold text-slate-900">Active Applications by Stage</h2>
              <div className="space-y-3">
                {operationsReport?.byStage.map((st) => (
                  <div key={st.stageId} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-0">
                    <span className="font-semibold text-slate-800">{st.stageName}</span>
                    <Badge variant="info">{st.count} cases</Badge>
                  </div>
                ))}
              </div>
            </Card>

            {/* Document Vault Status */}
            <Card className="p-5 space-y-4">
              <h2 className="text-sm font-bold text-slate-900">Document Verification Health</h2>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <div className="text-lg font-bold text-emerald-800">{operationsReport?.documentsStatus.verified || 0}</div>
                  <div className="text-[10px] uppercase font-semibold text-emerald-600">Verified</div>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <div className="text-lg font-bold text-amber-800">{operationsReport?.documentsStatus.pendingReview || 0}</div>
                  <div className="text-[10px] uppercase font-semibold text-amber-600">In Review</div>
                </div>
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
                  <div className="text-lg font-bold text-rose-800">{operationsReport?.documentsStatus.rejected || 0}</div>
                  <div className="text-[10px] uppercase font-semibold text-rose-600">Rejected</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 5: BRANCH COMPARISONS */}
      {activeTab === 'BRANCHES' && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Multi-Branch Performance Benchmarking</h2>
              <p className="text-xs text-slate-500">Cross-branch operational volume, staff capacity, and revenue generation</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b">
                <tr>
                  <th className="py-3 px-3">Branch</th>
                  <th className="py-3 px-3">Location</th>
                  <th className="py-3 px-3 text-center">Active Staff</th>
                  <th className="py-3 px-3 text-center">Leads</th>
                  <th className="py-3 px-3 text-center">Conversion</th>
                  <th className="py-3 px-3 text-center">Filings</th>
                  <th className="py-3 px-3 text-right">Revenue (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {branchReport?.branches.map((b) => (
                  <tr key={b.branchId} className="hover:bg-slate-50">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{b.branchName}</div>
                      <div className="font-mono text-[10px] text-slate-400">{b.branchCode}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{b.city}, {b.state}</td>
                    <td className="py-3 px-3 text-center font-mono">{b.employeeCount}</td>
                    <td className="py-3 px-3 text-center font-mono">{b.leadCount}</td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-emerald-700">{b.conversionRate}%</td>
                    <td className="py-3 px-3 text-center font-mono">{b.applicationCount}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      ₹{b.totalRevenue.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
