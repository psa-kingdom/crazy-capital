'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Layers,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  FileCheck2,
  Receipt,
  Sparkles,
} from 'lucide-react';
import { CustomerShell } from '../../../components/layout/customer-shell';
import { customerPortalApi } from '../../../lib/api';

export default function CustomerApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await customerPortalApi.getMyApplications();
      const items = res.data?.data || res.data || [];
      setApplications(Array.isArray(items) ? items : []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const filteredApps = applications.filter((app) => {
    const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter;
    const matchesSearch =
      !search.trim() ||
      app.applicationNumber.toLowerCase().includes(search.toLowerCase()) ||
      app.serviceName.toLowerCase().includes(search.toLowerCase()) ||
      app.currentStage.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <CustomerShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
                Application Lifecycle
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-2 flex items-center gap-2">
              <Layers className="w-7 h-7 text-indigo-600" />
              My Service Applications
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Live tracking of all your incorporation, GST, IP, and compliance filings in the Crazy Capital engine.
            </p>
          </div>

          <button
            onClick={fetchApplications}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors self-start md:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
            {['ALL', 'IN_PROGRESS', 'SUBMITTED', 'COMPLETED'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  statusFilter === status
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {status === 'ALL' ? 'All Applications' : status.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search case ref or service..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Application Cards List */}
        {loading ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center text-slate-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
            Loading your applications...
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-500 text-xs">
            <Layers className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            No applications match your selected filters.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredApps.map((app) => (
              <div
                key={app.id}
                className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-xs text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                      {app.applicationNumber}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      app.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : app.status === 'REJECTED'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {app.status}
                    </span>
                  </div>

                  <h2 className="text-base font-bold text-slate-900">{app.serviceName}</h2>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5 font-medium text-slate-700">
                      <Clock className="w-3.5 h-3.5 text-indigo-600" />
                      Stage: <strong>{app.currentStage}</strong>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <FileCheck2 className="w-3.5 h-3.5" />
                      {app.documentsCount} documents
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Receipt className="w-3.5 h-3.5" />
                      {app.invoicesCount} invoices
                    </span>
                    <span>•</span>
                    <span>
                      Created {new Date(app.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-start md:self-auto">
                  <Link
                    href={`/customer/applications/${app.id}`}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                  >
                    Open Application Cockpit
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </CustomerShell>
  );
}
