'use client';

import React from 'react';
import Link from 'next/link';
import {
  Users2,
  UserCheck,
  TrendingUp,
  ArrowRight,
  Sparkles,
  PhoneCall,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { Card, Button, Badge } from '@cc/ui';

export default function AdminDashboardPage() {
  const stats = [
    { label: 'Total CRM Leads', value: '1,428', change: '+18.4%', trend: 'up', icon: Users2, color: 'text-brand-600 bg-brand-50' },
    { label: 'Qualified Leads', value: '412', change: '+12.1%', trend: 'up', icon: TrendingUp, color: 'text-amber-600 bg-amber-50' },
    { label: 'Master Customers (360)', value: '894', change: '+24.5%', trend: 'up', icon: UserCheck, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Conversion Velocity', value: '28.8%', change: '+3.2%', trend: 'up', icon: Sparkles, color: 'text-purple-600 bg-purple-50' },
  ];

  const recentLeads = [
    { id: '1', name: 'Rajesh Gupta', company: 'Apex Technologies Pvt Ltd', mobile: '9876543210', status: 'NEW', score: 85, source: 'WEBSITE', time: '10 mins ago' },
    { id: '2', name: 'Sneha Patel', company: 'Patel Legal Advisory', mobile: '9876543211', status: 'CONTACTED', score: 70, source: 'WHATSAPP', time: '45 mins ago' },
    { id: '3', name: 'Vikram Mehta', company: 'Mehta Logistics India LLP', mobile: '9876543212', status: 'QUALIFIED', score: 92, source: 'PARTNER_REFERRAL', time: '2 hours ago' },
    { id: '4', name: 'Deepak Singhania', company: 'Singhania Industrial Corp', mobile: '9876543213', status: 'PROPOSAL', score: 95, source: 'DIRECT_CALL', time: '4 hours ago' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NEW':
        return <Badge variant="info">New Inquiry</Badge>;
      case 'CONTACTED':
        return <Badge variant="warning">Contacted</Badge>;
      case 'QUALIFIED':
        return <Badge variant="success">Qualified</Badge>;
      case 'PROPOSAL':
        return <Badge variant="default">Proposal Sent</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-900 via-slate-900 to-brand-950 p-6 md:p-8 text-white shadow-lg">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-amber-300 text-xs font-semibold mb-3">
            <span>🇮🇳</span>
            <span>Crazy Capital OS • Sprint 2 Operational Release</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            India's Business Operating System
          </h1>
          <p className="mt-2 text-sm md:text-base text-slate-300">
            Welcome to the centralized CRM Engine and Customer 360 cockpit. Track multi-channel inbound inquiries, lead assignments, state machines, and master customer profiles in real-time.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/leads">
              <Button variant="primary" className="bg-brand-500 hover:bg-brand-400 text-white font-semibold">
                Open CRM Kanban Board <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/customers">
              <Button variant="outline" className="text-white border-white/30 hover:bg-white/10">
                Search Customer 360
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">{stat.label}</span>
                <div className={`p-2 rounded-xl ${stat.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-900">{stat.value}</span>
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5">
                  {stat.change}
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Main Grid: CRM Pipeline & Customer 360 Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent High-Score Leads */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Active High-Priority Inquiries</h2>
              <p className="text-xs text-slate-500">Live multi-branch inbound queue</p>
            </div>
            <Link href="/leads" className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1">
              View all leads <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-sm">
            {recentLeads.map((lead) => (
              <div key={lead.id} className="p-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-900 truncate">{lead.name}</span>
                    {getStatusBadge(lead.status)}
                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono font-medium">
                      Score {lead.score}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 truncate">
                    {lead.company} • <span className="font-mono">{lead.mobile}</span> • Source: {lead.source}
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <Link href={`/leads`}>
                    <Button variant="outline" size="sm" className="text-xs py-1 px-3">
                      View Lead
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System & Vertical Slice Status */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Sprint Architecture</h2>
          <Card className="p-5 space-y-4 bg-slate-900 text-white border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-semibold text-slate-400">Architecture Phase</span>
              <Badge variant="success">Phase 1 (MVP)</Badge>
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-200">Vertical Slice 1.1: Foundation & RBAC</span>
                  <p className="text-slate-400 text-[11px]">JWT, Argon2, Multi-tenancy Isolation (Verified ✅)</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-200">Vertical Slice 1.2: CRM Lead Engine</span>
                  <p className="text-slate-400 text-[11px]">State machine, activities, ADR-013 sources (Sprint 2)</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-200">Vertical Slice 1.3: Customer 360</span>
                  <p className="text-slate-400 text-[11px]">Atomic lead conversion & master profiles (Sprint 2)</p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-[11px] text-slate-400">
              <span>Prisma ORM • NestJS 10 • Next.js 15</span>
              <span className="text-emerald-400 font-mono">0 ERRORS</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
