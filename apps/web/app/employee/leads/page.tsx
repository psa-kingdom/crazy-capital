'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Users2,
  ArrowLeft,
  Building,
  Phone,
  Search,
  Send,
  UserCheck,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { useToast } from '@cc/ui';
import { crmApi } from '@/lib/api';

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  companyName: string | null;
  mobile: string;
  email: string | null;
  status: string;
  leadScore: number | null;
  notes: string | null;
  source?: { id: string; name: string; code: string } | null;
  createdAt: string;
}

const STATUS_TRANSITIONS: Record<string, { next: string; label: string; cls: string }> = {
  NEW: { next: 'CONTACTED', label: 'Mark Contacted ➔', cls: 'bg-amber-950 text-amber-300 hover:bg-amber-900 border-amber-800' },
  CONTACTED: { next: 'QUALIFIED', label: 'Mark Qualified ➔', cls: 'bg-emerald-950 text-emerald-300 hover:bg-emerald-900 border-emerald-800' },
  QUALIFIED: { next: 'PROPOSAL', label: 'Proposal Sent ➔', cls: 'bg-purple-950 text-purple-300 hover:bg-purple-900 border-purple-800' },
};

const STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-slate-800 text-slate-300 border-slate-700',
  CONTACTED: 'bg-amber-950 text-amber-300 border-amber-800',
  QUALIFIED: 'bg-emerald-950 text-emerald-300 border-emerald-800',
  PROPOSAL: 'bg-purple-950 text-purple-300 border-purple-800',
  CONVERTED: 'bg-teal-950 text-teal-300 border-teal-800',
  LOST: 'bg-red-950 text-red-300 border-red-800',
};

const ACTIVITY_TYPES = [
  { value: 'CALL', label: '📞 Call' },
  { value: 'EMAIL', label: '📧 Email' },
  { value: 'WHATSAPP', label: '💬 WhatsApp' },
  { value: 'MEETING', label: '🤝 Meeting' },
  { value: 'NOTE', label: '📝 Note' },
];

export default function EmployeeLeadsPage() {
  const { success, error, info } = useToast();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [quickNotes, setQuickNotes] = useState<Record<string, string>>({});
  const [activityTypes, setActivityTypes] = useState<Record<string, string>>({});
  const [isLoggingActivity, setIsLoggingActivity] = useState<string | null>(null);
  const [transitioningId, setTransitioningId] = useState<string | null>(null);

  const fetchLeads = useCallback(
    async (silent = false) => {
      if (!silent) setIsLoading(true);
      else setIsRefreshing(true);
      try {
        const res = await crmApi.getLeads({ limit: 100 });
        const data = (res as any)?.data;
        const items: Lead[] = data?.items ?? data?.data ?? data ?? [];
        setLeads(Array.isArray(items) ? items : []);
      } catch (err: any) {
        if (!silent) {
          error('Failed to load leads', err.message || 'Check your connection and try again.');
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [error],
  );

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleAdvanceStatus = async (lead: Lead, nextStatus: string) => {
    setTransitioningId(lead.id);
    try {
      await crmApi.updateLeadStatus(
        lead.id,
        nextStatus,
        `Status advanced to ${nextStatus} by operations executive`,
      );
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, status: nextStatus } : l)));
      success('Status updated', `${lead.firstName} ${lead.lastName} → ${nextStatus}`);
    } catch (err: any) {
      error('Status update failed', err.message);
    } finally {
      setTransitioningId(null);
    }
  };

  const handleConvert = async (lead: Lead) => {
    setTransitioningId(lead.id);
    try {
      await crmApi.updateLeadStatus(
        lead.id,
        'CONVERTED',
        'Lead converted to Customer 360 profile by operations executive',
      );
      setLeads((prev) =>
        prev.map((l) => (l.id === lead.id ? { ...l, status: 'CONVERTED' } : l)),
      );
      success('Lead Converted!', `${lead.firstName} ${lead.lastName} → Customer profile.`);
    } catch (err: any) {
      error('Conversion failed', err.message);
    } finally {
      setTransitioningId(null);
    }
  };

  const handleAddActivity = async (lead: Lead) => {
    const note = quickNotes[lead.id] || '';
    const type = activityTypes[lead.id] || 'CALL';
    if (!note.trim()) {
      info('Note is empty', 'Enter activity details before logging.');
      return;
    }
    setIsLoggingActivity(lead.id);
    try {
      await crmApi.addLeadActivity(lead.id, type, note.trim());
      setQuickNotes((prev) => ({ ...prev, [lead.id]: '' }));
      success('Activity logged', `${type} note recorded.`);
    } catch (err: any) {
      error('Failed to log activity', err.message);
    } finally {
      setIsLoggingActivity(null);
    }
  };

  const filtered = leads.filter((l) => {
    const fullName = `${l.firstName} ${l.lastName}`.toLowerCase();
    const matchesSearch =
      search === '' ||
      fullName.includes(search.toLowerCase()) ||
      l.mobile.includes(search) ||
      (l.companyName || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === '' || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeCount = leads.filter((l) => !['CONVERTED', 'LOST'].includes(l.status)).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Operations Executive Lead Desk
                </h1>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-900 text-brand-300 border border-brand-700">
                  CRM Live
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Real-time leads from CRM</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800">
              {activeCount} Active Leads
            </span>
            <button
              onClick={() => fetchLeads(true)}
              disabled={isRefreshing}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800 transition-colors disabled:opacity-50"
              aria-label="Refresh leads"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, phone, or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg outline-none focus:border-brand-500 text-white placeholder-slate-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-300 outline-none focus:border-brand-500 cursor-pointer"
          >
            <option value="">All Statuses</option>
            {['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'CONVERTED', 'LOST'].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
            <p className="text-sm text-slate-400">Loading your assigned leads...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 rounded-2xl border-2 border-dashed border-slate-800">
            <Users2 className="w-10 h-10 text-slate-600" />
            <p className="text-sm font-semibold text-slate-400">
              {leads.length === 0 ? 'No leads assigned yet' : 'No leads match your filter'}
            </p>
            {leads.length === 0 && (
              <p className="text-xs text-slate-500">
                Check back later or ask your supervisor to assign leads.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((lead) => {
              const transition = STATUS_TRANSITIONS[lead.status];
              const isTransitioning = transitioningId === lead.id;
              const loggingThis = isLoggingActivity === lead.id;
              return (
                <div
                  key={lead.id}
                  className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-colors shadow-lg"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-base text-white truncate">
                          {lead.firstName} {lead.lastName}
                        </h3>
                        {lead.companyName && (
                          <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                            <Building className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span className="truncate">{lead.companyName}</span>
                          </div>
                        )}
                      </div>
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full font-bold border shrink-0 ${STATUS_COLORS[lead.status] || STATUS_COLORS.NEW}`}
                      >
                        {lead.status}
                      </span>
                    </div>

                    <div className="mt-3 p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-300 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 flex items-center gap-1">
                          <Phone className="w-3 h-3" /> Phone:
                        </span>
                        <a
                          href={`tel:${lead.mobile}`}
                          className="font-mono font-bold text-slate-200 hover:text-brand-300 transition-colors"
                        >
                          {lead.mobile}
                        </a>
                      </div>
                      {lead.leadScore != null && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Lead Score:</span>
                          <span className="font-mono text-amber-400 font-bold">
                            {lead.leadScore}/100
                          </span>
                        </div>
                      )}
                      {lead.source?.name && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Source:</span>
                          <span className="text-slate-300">{lead.source.name}</span>
                        </div>
                      )}
                    </div>

                    {lead.notes && (
                      <p className="text-xs text-slate-400 mt-2.5 italic line-clamp-2">
                        &ldquo;{lead.notes}&rdquo;
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-800 space-y-2">
                    {/* Quick activity log */}
                    <div className="flex gap-1.5">
                      <select
                        value={activityTypes[lead.id] || 'CALL'}
                        onChange={(e) =>
                          setActivityTypes((prev) => ({ ...prev, [lead.id]: e.target.value }))
                        }
                        className="text-[11px] bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-slate-300 outline-none focus:border-brand-500 cursor-pointer shrink-0"
                      >
                        {ACTIVITY_TYPES.map((a) => (
                          <option key={a.value} value={a.value}>
                            {a.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Log activity note..."
                        value={quickNotes[lead.id] || ''}
                        onChange={(e) =>
                          setQuickNotes((prev) => ({ ...prev, [lead.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddActivity(lead);
                        }}
                        className="flex-1 min-w-0 text-[11px] px-2 py-1 bg-slate-950 border border-slate-800 rounded outline-none focus:border-brand-500 text-white placeholder-slate-600"
                      />
                      <button
                        onClick={() => handleAddActivity(lead)}
                        disabled={loggingThis}
                        className="p-1.5 bg-brand-900 hover:bg-brand-800 text-brand-300 rounded transition-colors disabled:opacity-50 shrink-0"
                        aria-label="Log activity"
                      >
                        {loggingThis ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Status Transition */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Advance Status:</span>
                      <div className="flex gap-1.5">
                        {transition && (
                          <button
                            onClick={() => handleAdvanceStatus(lead, transition.next)}
                            disabled={isTransitioning}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded border transition-colors disabled:opacity-50 flex items-center gap-1 ${transition.cls}`}
                          >
                            {isTransitioning && <Loader2 className="w-3 h-3 animate-spin" />}
                            {transition.label}
                          </button>
                        )}
                        {lead.status === 'PROPOSAL' && (
                          <button
                            onClick={() => handleConvert(lead)}
                            disabled={isTransitioning}
                            className="px-2.5 py-1 bg-teal-950 text-teal-300 hover:bg-teal-900 border border-teal-800 text-[11px] font-bold rounded flex items-center gap-1 transition-colors disabled:opacity-50"
                          >
                            {isTransitioning ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <UserCheck className="w-3 h-3" />
                            )}
                            Convert 360
                          </button>
                        )}
                        {['CONVERTED', 'LOST'].includes(lead.status) && (
                          <span className="text-slate-600 text-[11px] italic">Closed</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
