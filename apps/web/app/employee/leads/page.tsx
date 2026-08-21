'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users2,
  PhoneCall,
  MessageSquare,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Building,
  Mail,
  Phone,
  Search,
  Plus,
  Send,
  UserCheck,
} from 'lucide-react';
import { Card, Button, Badge } from '@cc/ui';

export default function EmployeeLeadsPage() {
  const [activeTab, setActiveTab] = useState<'assigned' | 'all'>('assigned');
  const [search, setSearch] = useState('');
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [quickNote, setQuickNote] = useState('');

  const [employeeLeads, setEmployeeLeads] = useState([
    {
      id: 'emp-lead-1',
      name: 'Rajesh Gupta',
      company: 'Apex Technologies Pvt Ltd',
      mobile: '9876543210',
      email: 'rajesh.gupta@apextech.in',
      status: 'QUALIFIED',
      score: 85,
      source: 'Website',
      notes: 'Interested in Private Limited Incorporation & GST Registration package.',
      lastActivity: 'Discovery call completed (2 hrs ago)',
    },
    {
      id: 'emp-lead-2',
      name: 'Kavita Reddy',
      company: 'Reddy Organic Foods Pvt Ltd',
      mobile: '9876543214',
      email: 'kavita@reddyfoods.in',
      status: 'NEW',
      score: 65,
      source: 'WhatsApp',
      notes: 'FSSAI Food License + Trademark filing inquiry.',
      lastActivity: 'Inquiry received via WhatsApp (3 hrs ago)',
    },
    {
      id: 'emp-lead-3',
      name: 'Siddharth Rao',
      company: 'Rao BioTech Solutions LLP',
      mobile: '9811223399',
      email: 'siddharth@raobiotech.in',
      status: 'PROPOSAL',
      score: 90,
      source: 'Partner Referral',
      notes: 'DPIIT Startup Recognition + Section 80-IAC filing quote submitted.',
      lastActivity: 'Proposal quote sent (5 hrs ago)',
    },
  ]);

  const handleAdvanceStatus = (leadId: string, nextStatus: string) => {
    setEmployeeLeads(
      employeeLeads.map((l) => (l.id === leadId ? { ...l, status: nextStatus } : l)),
    );
  };

  const handleAddNote = (leadId: string) => {
    if (!quickNote.trim()) return;
    alert(`Activity logged for lead: "${quickNote}"`);
    setQuickNote('');
  };

  const filtered = employeeLeads.filter((l) =>
    search === '' ||
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.mobile.includes(search) ||
    l.company.toLowerCase().includes(search.toLowerCase()),
  );

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
                  Sprint 2 CRM
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Executive: Priya Verma • Noida Operations Branch (NOIDA_01)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800">
              {filtered.length} Active Leads Assigned
            </span>
          </div>
        </div>

        {/* Filter / Search Bar */}
        <div className="flex items-center gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search your assigned leads by name, phone, or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg outline-none focus:border-brand-500 text-white"
            />
          </div>
        </div>

        {/* Leads List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((lead) => (
            <div
              key={lead.id}
              className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-colors shadow-lg"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-base text-white">{lead.name}</h3>
                    <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <Building className="w-3.5 h-3.5 text-slate-500" /> {lead.company}
                    </div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-brand-950 text-brand-300 border border-brand-800">
                    {lead.status}
                  </span>
                </div>

                <div className="mt-3 p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-300 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Phone:</span>
                    <span className="font-mono font-bold text-slate-200">{lead.mobile}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Lead Score:</span>
                    <span className="font-mono text-amber-400 font-bold">{lead.score}/100</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Source:</span>
                    <span className="text-slate-300">{lead.source}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 mt-2.5 italic">"{lead.notes}"</p>
              </div>

              {/* Status Actions */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Transition Status:</span>
                  <div className="flex gap-1.5">
                    {lead.status === 'NEW' && (
                      <button
                        onClick={() => handleAdvanceStatus(lead.id, 'CONTACTED')}
                        className="px-2 py-1 bg-amber-950 text-amber-300 hover:bg-amber-900 text-[11px] font-bold rounded"
                      >
                        Contacted ➔
                      </button>
                    )}
                    {lead.status === 'CONTACTED' && (
                      <button
                        onClick={() => handleAdvanceStatus(lead.id, 'QUALIFIED')}
                        className="px-2 py-1 bg-emerald-950 text-emerald-300 hover:bg-emerald-900 text-[11px] font-bold rounded"
                      >
                        Qualified ➔
                      </button>
                    )}
                    {lead.status === 'QUALIFIED' && (
                      <button
                        onClick={() => handleAdvanceStatus(lead.id, 'PROPOSAL')}
                        className="px-2 py-1 bg-purple-950 text-purple-300 hover:bg-purple-900 text-[11px] font-bold rounded"
                      >
                        Proposal Sent ➔
                      </button>
                    )}
                    {lead.status === 'PROPOSAL' && (
                      <button
                        onClick={() => {
                          handleAdvanceStatus(lead.id, 'CONVERTED');
                          alert(`Lead ${lead.name} converted to Customer master profile!`);
                        }}
                        className="px-2 py-1 bg-teal-950 text-teal-300 hover:bg-teal-900 text-[11px] font-bold rounded flex items-center gap-1"
                      >
                        <UserCheck className="w-3 h-3" /> Convert 360
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
