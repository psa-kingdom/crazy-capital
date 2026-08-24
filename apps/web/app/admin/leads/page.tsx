'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users2,
  Plus,
  Search,
  Filter,
  Kanban,
  Table as TableIcon,
  Phone,
  Mail,
  Building,
  UserCheck,
  Clock,
  ArrowRight,
  Sparkles,
  ChevronRight,
  MoreVertical,
  CheckCircle,
  XCircle,
  UserPlus,
} from 'lucide-react';
import { Card, Button, Badge } from '@cc/ui';
import { crmApi } from '@/lib/api';
import { LeadStatus } from '@cc/types';

interface LeadItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  mobile: string;
  companyName: string | null;
  status: string;
  leadScore: number;
  notes: string | null;
  campaign: string | null;
  createdAt: string;
  source?: { id: string; name: string; code: string } | null;
  branch?: { id: string; name: string; code: string } | null;
  assignedTo?: { id: string; firstName: string; lastName: string; email: string } | null;
}

export default function LeadsPage() {
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initial demo leads data matching seed script
  const [leads, setLeads] = useState<LeadItem[]>([
    {
      id: 'lead-001',
      firstName: 'Rajesh',
      lastName: 'Gupta',
      email: 'rajesh.gupta@apextech.in',
      mobile: '9876543210',
      companyName: 'Apex Technologies Pvt Ltd',
      status: 'NEW',
      leadScore: 85,
      notes: 'Interested in Private Limited Incorporation & GST Registration package.',
      campaign: 'GOOGLE_ADS_Q3',
      createdAt: new Date().toISOString(),
      source: { id: 's1', name: 'Website', code: 'WEBSITE' },
      branch: { id: 'b1', name: 'Head Office', code: 'HO' },
      assignedTo: { id: 'u1', firstName: 'Priya', lastName: 'Verma', email: 'priya@crazycapital.in' },
    },
    {
      id: 'lead-002',
      firstName: 'Sneha',
      lastName: 'Patel',
      email: 'sneha@patelconsulting.com',
      mobile: '9876543211',
      companyName: 'Patel Legal Advisory',
      status: 'CONTACTED',
      leadScore: 70,
      notes: 'Initial WhatsApp outreach completed; sent company registration checklist.',
      campaign: 'WHATSAPP_CAMPAIGN',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      source: { id: 's2', name: 'WhatsApp', code: 'WHATSAPP' },
      branch: { id: 'b2', name: 'Mumbai Branch', code: 'MUMBAI_01' },
      assignedTo: { id: 'u2', firstName: 'Ananya', lastName: 'Deshmukh', email: 'ananya@crazycapital.in' },
    },
    {
      id: 'lead-003',
      firstName: 'Vikram',
      lastName: 'Mehta',
      email: 'vikram@mehtalogistics.in',
      mobile: '9876543212',
      companyName: 'Mehta Logistics India LLP',
      status: 'QUALIFIED',
      leadScore: 92,
      notes: 'High ticket size: MSME Loan syndication + Trademark Filing.',
      campaign: 'PARTNER_MEET_AUG',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      source: { id: 's3', name: 'Partner Referral', code: 'PARTNER_REFERRAL' },
      branch: { id: 'b3', name: 'Delhi Branch', code: 'DELHI_01' },
      assignedTo: { id: 'u3', firstName: 'Suresh', lastName: 'Nair', email: 'suresh@crazycapital.in' },
    },
    {
      id: 'lead-004',
      firstName: 'Deepak',
      lastName: 'Singhania',
      email: 'deepak@singhaniagroup.com',
      mobile: '9876543213',
      companyName: 'Singhania Industrial Corp',
      status: 'PROPOSAL',
      leadScore: 95,
      notes: 'Custom annual corporate compliance retainer quote sent.',
      campaign: 'DIRECT_CALL',
      createdAt: new Date(Date.now() - 14400000).toISOString(),
      source: { id: 's4', name: 'Direct Call', code: 'DIRECT_CALL' },
      branch: { id: 'b1', name: 'Head Office', code: 'HO' },
      assignedTo: { id: 'u4', firstName: 'Amit', lastName: 'Kumar', email: 'amit@crazycapital.in' },
    },
    {
      id: 'lead-005',
      firstName: 'Kavita',
      lastName: 'Reddy',
      email: 'kavita@reddyfoods.in',
      mobile: '9876543214',
      companyName: 'Reddy Organic Foods Pvt Ltd',
      status: 'LOST',
      leadScore: 30,
      notes: 'Opted for local CA firm due to existing relationship.',
      campaign: 'COLD_CALL',
      createdAt: new Date(Date.now() - 28800000).toISOString(),
      source: { id: 's5', name: 'Cold Call', code: 'COLD_CALL' },
      branch: { id: 'b4', name: 'Bangalore Branch', code: 'BLR_01' },
      assignedTo: { id: 'u1', firstName: 'Priya', lastName: 'Verma', email: 'priya@crazycapital.in' },
    },
  ]);

  // Form State for new lead
  const [newLead, setNewLead] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    companyName: '',
    sourceCode: 'WEBSITE',
    notes: '',
    leadScore: 50,
  });

  const kanbanColumns = [
    { key: 'NEW', label: 'New Inquiries', color: 'border-blue-400 bg-blue-50/40 text-blue-800' },
    { key: 'CONTACTED', label: 'Contacted', color: 'border-amber-400 bg-amber-50/40 text-amber-800' },
    { key: 'QUALIFIED', label: 'Qualified', color: 'border-emerald-400 bg-emerald-50/40 text-emerald-800' },
    { key: 'PROPOSAL', label: 'Proposal Sent', color: 'border-purple-400 bg-purple-50/40 text-purple-800' },
    { key: 'CONVERTED', label: 'Converted (360)', color: 'border-teal-400 bg-teal-50/40 text-teal-800' },
    { key: 'LOST', label: 'Archived / Lost', color: 'border-slate-300 bg-slate-100 text-slate-600' },
  ];

  useEffect(() => {
    async function fetchLeads() {
      try {
        setIsLoading(true);
        const res: any = await crmApi.getLeads({ limit: 100 });
        if (res && res.data && Array.isArray(res.data)) {
          setLeads(res.data);
        }
      } catch (err) {
        // Fallback to seeded demo dataset if backend unavailable
        console.info('CRM API not reachable, running in demo mode');
      } finally {
        setIsLoading(false);
      }
    }
    fetchLeads();
  }, []);

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLead.firstName || !newLead.lastName || !newLead.mobile) {
      alert('Please fill in required fields: First Name, Last Name, and Mobile Number.');
      return;
    }

    try {
      const createdFromApi: any = await crmApi.createLead({
        firstName: newLead.firstName.trim(),
        lastName: newLead.lastName.trim(),
        email: newLead.email ? newLead.email.trim() : undefined,
        mobile: newLead.mobile.trim(),
        companyName: newLead.companyName ? newLead.companyName.trim() : undefined,
        sourceCode: newLead.sourceCode,
        notes: newLead.notes ? newLead.notes.trim() : undefined,
        leadScore: Number(newLead.leadScore) || 50,
      });

      if (createdFromApi && createdFromApi.id) {
        setLeads([createdFromApi, ...leads]);
      } else {
        const created: LeadItem = {
          id: `lead-${Date.now()}`,
          firstName: newLead.firstName,
          lastName: newLead.lastName,
          email: newLead.email || null,
          mobile: newLead.mobile,
          companyName: newLead.companyName || null,
          status: 'NEW',
          leadScore: Number(newLead.leadScore) || 50,
          notes: newLead.notes || null,
          campaign: 'MANUAL_ENTRY',
          createdAt: new Date().toISOString(),
          source: { id: 's1', name: newLead.sourceCode, code: newLead.sourceCode },
          branch: { id: 'b1', name: 'Head Office', code: 'HO' },
          assignedTo: { id: 'u1', firstName: 'Priya', lastName: 'Verma', email: 'priya@crazycapital.in' },
        };
        setLeads([created, ...leads]);
      }
    } catch (err: any) {
      const created: LeadItem = {
        id: `lead-${Date.now()}`,
        firstName: newLead.firstName,
        lastName: newLead.lastName,
        email: newLead.email || null,
        mobile: newLead.mobile,
        companyName: newLead.companyName || null,
        status: 'NEW',
        leadScore: Number(newLead.leadScore) || 50,
        notes: newLead.notes || null,
        campaign: 'MANUAL_ENTRY',
        createdAt: new Date().toISOString(),
        source: { id: 's1', name: newLead.sourceCode, code: newLead.sourceCode },
        branch: { id: 'b1', name: 'Head Office', code: 'HO' },
        assignedTo: { id: 'u1', firstName: 'Priya', lastName: 'Verma', email: 'priya@crazycapital.in' },
      };
      setLeads([created, ...leads]);
    }

    setIsCreateModalOpen(false);
    setNewLead({
      firstName: '',
      lastName: '',
      email: '',
      mobile: '',
      companyName: '',
      sourceCode: 'WEBSITE',
      notes: '',
      leadScore: 50,
    });
  };

  const handleAdvanceStatus = async (leadId: string, currentStatus: string) => {
    const nextMap: Record<string, string> = {
      NEW: 'CONTACTED',
      CONTACTED: 'QUALIFIED',
      QUALIFIED: 'PROPOSAL',
    };
    const nextStatus = nextMap[currentStatus];
    if (!nextStatus) return;

    try {
      await crmApi.updateLeadStatus(leadId, nextStatus, 'Status advanced via Kanban');
    } catch (e) {
      // Local state update
    }

    setLeads(
      leads.map((l) => (l.id === leadId ? { ...l, status: nextStatus } : l)),
    );
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      search === '' ||
      `${lead.firstName} ${lead.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      lead.mobile.includes(search) ||
      (lead.companyName && lead.companyName.toLowerCase().includes(search.toLowerCase())) ||
      (lead.email && lead.email.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === '' || lead.status === statusFilter;
    const matchesSource = sourceFilter === '' || lead.source?.code === sourceFilter;

    return matchesSearch && matchesStatus && matchesSource;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">CRM Leads Engine</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-brand-100 text-brand-800 border border-brand-200">
              Vertical Slice 1.2
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            State Machine Lifecycle: NEW → CONTACTED → QUALIFIED → PROPOSAL → CONVERTED
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Switcher */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" /> Kanban Board
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === 'table'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" /> Data Table
            </button>
          </div>

          <Button
            onClick={() => setIsCreateModalOpen(true)}
            variant="primary"
            className="flex items-center gap-2 text-xs font-semibold shadow-sm shadow-brand-500/20"
          >
            <Plus className="w-4 h-4" /> Add Lead
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search leads by name, phone, company, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 outline-none cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="PROPOSAL">Proposal</option>
            <option value="CONVERTED">Converted</option>
            <option value="LOST">Lost</option>
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 outline-none cursor-pointer"
          >
            <option value="">All Lead Sources (ADR-013)</option>
            <option value="WEBSITE">Website</option>
            <option value="WHATSAPP">WhatsApp</option>
            <option value="PARTNER_REFERRAL">Partner Referral</option>
            <option value="DIRECT_CALL">Direct Call</option>
            <option value="COLD_CALL">Cold Call</option>
          </select>
        </div>
      </div>

      {/* Kanban Board View */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto pb-4">
          {kanbanColumns.map((col) => {
            const columnLeads = filteredLeads.filter((l) => l.status === col.key);
            return (
              <div key={col.key} className="flex flex-col min-w-[240px] bg-slate-100/70 p-3 rounded-xl border border-slate-200/80">
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-200">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-bold ${col.color.split(' ')[2]}`}>{col.label}</span>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 bg-white rounded-full border border-slate-200 text-slate-700">
                    {columnLeads.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="space-y-3 flex-1">
                  {columnLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between space-y-2.5"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-1">
                          <Link
                            href={`/leads/${lead.id}`}
                            className="font-bold text-sm text-slate-900 group-hover:text-brand-600 transition-colors leading-tight"
                          >
                            {lead.firstName} {lead.lastName}
                          </Link>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200 shrink-0">
                            {lead.leadScore} pts
                          </span>
                        </div>
                        {lead.companyName && (
                          <div className="text-xs text-slate-500 font-medium truncate mt-0.5 flex items-center gap-1">
                            <Building className="w-3 h-3 shrink-0" /> {lead.companyName}
                          </div>
                        )}
                      </div>

                      {lead.notes && (
                        <p className="text-[11px] text-slate-600 line-clamp-2 italic bg-slate-50 p-1.5 rounded border border-slate-100">
                          "{lead.notes}"
                        </p>
                      )}

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-slate-700">{lead.mobile}</span>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold uppercase">
                          {lead.source?.name || 'Inbound'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1 gap-1">
                        <Link
                          href={`/leads/${lead.id}`}
                          className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-0.5"
                        >
                          View Timeline <ChevronRight className="w-3 h-3" />
                        </Link>
                        {['NEW', 'CONTACTED', 'QUALIFIED'].includes(lead.status) && (
                          <button
                            onClick={() => handleAdvanceStatus(lead.id, lead.status)}
                            className="text-[10px] px-2 py-1 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-md font-semibold transition-colors"
                          >
                            Advance ➔
                          </button>
                        )}
                        {lead.status === 'PROPOSAL' && (
                          <Link href={`/leads/${lead.id}`}>
                            <button className="text-[10px] px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md font-semibold transition-colors flex items-center gap-1">
                              Convert 360
                            </button>
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}

                  {columnLeads.length === 0 && (
                    <div className="p-4 text-center text-xs text-slate-400 italic">
                      No leads in this stage
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Data Table View */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Lead Name / Contact</th>
                  <th className="p-3.5">Company Entity</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Lead Score</th>
                  <th className="p-3.5">Source (ADR-013)</th>
                  <th className="p-3.5">Assigned To</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">
                        {lead.firstName} {lead.lastName}
                      </div>
                      <div className="text-slate-500 font-mono text-[11px]">{lead.mobile}</div>
                    </td>
                    <td className="p-3.5 font-medium text-slate-800">
                      {lead.companyName || '—'}
                    </td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                        {lead.status}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-brand-700">
                      {lead.leadScore}/100
                    </td>
                    <td className="p-3.5">
                      <span className="text-[11px] px-2 py-0.5 bg-brand-50 text-brand-700 font-semibold rounded">
                        {lead.source?.name || 'Inbound'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      {lead.assignedTo ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-brand-100 text-brand-800 text-[10px] font-bold flex items-center justify-center">
                            {lead.assignedTo.firstName[0]}
                          </div>
                          <span className="text-xs font-medium">
                            {lead.assignedTo.firstName} {lead.assignedTo.lastName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      <Link href={`/leads/${lead.id}`}>
                        <Button variant="outline" size="sm" className="text-xs py-1 px-2.5">
                          View Detail
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Lead Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Capture New Lead</h3>
                <p className="text-xs text-slate-500">Add an authenticated inquiry into Crazy Capital CRM</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={newLead.firstName}
                    onChange={(e) => setNewLead({ ...newLead, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="e.g. Rahul"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={newLead.lastName}
                    onChange={(e) => setNewLead({ ...newLead, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="e.g. Sharma"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mobile (10-Digit) *</label>
                  <input
                    type="tel"
                    required
                    value={newLead.mobile}
                    onChange={(e) => setNewLead({ ...newLead, mobile: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="9876543210"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={newLead.email}
                    onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="rahul@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Company / Enterprise Name</label>
                <input
                  type="text"
                  value={newLead.companyName}
                  onChange={(e) => setNewLead({ ...newLead, companyName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="e.g. Sharma Technologies Pvt Ltd"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lead Source (ADR-013)</label>
                  <select
                    value={newLead.sourceCode}
                    onChange={(e) => setNewLead({ ...newLead, sourceCode: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
                  >
                    <option value="WEBSITE">Website</option>
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="PARTNER_REFERRAL">Partner Referral</option>
                    <option value="DIRECT_CALL">Direct Call</option>
                    <option value="COLD_CALL">Cold Call</option>
                    <option value="EVENT">Event / Exhibition</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lead Score (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newLead.leadScore}
                    onChange={(e) => setNewLead({ ...newLead, leadScore: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Inquiry Details & Notes</label>
                <textarea
                  rows={3}
                  value={newLead.notes}
                  onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Customer requirements, requested services..."
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Create Lead
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
