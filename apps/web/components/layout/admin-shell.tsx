'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users2,
  UserCheck,
  GitFork,
  FileCheck2,
  Coins,
  Receipt,
  Bell,
  BarChart3,
  BookOpen,
  Sliders,
  AlertTriangle,
  ListTodo,
  Building2,
  TrendingUp,
  Palette,
  Code2,
  Landmark,
  ShieldAlert,
  CreditCard,
  Activity,
  Menu,
  X,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '../../lib/auth-store';
import { AiCopilotDrawer } from '../copilot/ai-copilot-drawer';

export interface AdminShellProps {
  children: React.ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const { user, logout, selectedBranchId, setSelectedBranchId } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Executive Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Audit Logs & DPDP', href: '/admin/audit-logs', icon: ShieldAlert, badge: 'Slice 6.1' },
    { label: 'Recurring Mandates', href: '/admin/mandates', icon: CreditCard, badge: 'Slice 6.2' },
    { label: 'System Telemetry', href: '/admin/system-health', icon: Activity, badge: 'Slice 6.4' },
    { label: 'Predictive Intelligence', href: '/admin/reports/predictive', icon: TrendingUp, badge: 'Slice 4.4' },
    { label: 'White-Label & SaaS', href: '/admin/settings/white-label', icon: Palette, badge: 'Slice 5.2' },
    { label: 'Developer & Webhooks', href: '/admin/settings/developer-api', icon: Code2, badge: 'Slice 5.3' },
    { label: 'Gov Integrations Hub', href: '/admin/integrations/government', icon: Landmark, badge: 'Slice 5.4' },
    { label: 'CRM Leads & Priority', href: '/admin/leads', icon: Users2, badge: 'AI Hot' },
    { label: 'Workflow Builder', href: '/admin/workflows', icon: GitFork, badge: 'Slice 2.1' },
    { label: 'SLA & Escalations', href: '/admin/sla', icon: AlertTriangle, badge: 'Slice 2.2' },
    { label: 'Task Engine & Workload', href: '/admin/tasks', icon: ListTodo, badge: 'Slice 2.3' },
    { label: 'Branch & Regional Hubs', href: '/admin/branches', icon: Building2, badge: 'Slice 2.4' },
    { label: 'Reports & Analytics', href: '/admin/reports', icon: BarChart3, badge: 'Slice 1.12' },
    { label: 'CMS & Knowledge Base', href: '/admin/cms', icon: BookOpen, badge: 'Slice 1.13' },
    { label: 'Customer 360 Hub', href: '/admin/customers', icon: UserCheck, badge: 'Sprint 2' },
    { label: 'Document Vault (ADR-018)', href: '/admin/documents', icon: FileCheck2, badge: 'OCR AI' },
    { label: 'Billing & Invoices (ADR-014)', href: '/admin/invoices', icon: Receipt, badge: 'Slice 1.8' },
    { label: 'Notifications & Alerts', href: '/admin/notifications', icon: Bell, badge: 'Slice 1.9' },
    { label: 'Commissions & Payouts', href: '/admin/commissions', icon: Coins, badge: 'Slice 2.5' },
    { label: 'Lead Sources (ADR-013)', href: '/admin/settings/lead-sources', icon: Sliders },
  ];

  const branches = [
    { id: '', name: 'All Branches (HO Overview)' },
    { id: 'b-noida', name: 'Noida Branch (NOIDA_01)' },
    { id: 'b-delhi', name: 'Delhi Branch (DELHI_01)' },
    { id: 'b-mumbai', name: 'Mumbai Branch (MUMBAI_01)' },
    { id: 'b-blr', name: 'Bangalore Branch (BLR_01)' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link href="/admin" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-700 via-indigo-600 to-amber-500 flex items-center justify-center text-white font-bold shadow-md shadow-brand-500/20">
                CC
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-base tracking-tight text-slate-900 flex items-center gap-1.5">
                  Crazy Capital <span className="text-xs">🇮🇳</span>
                </span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                  Business OS • Admin & Ops
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {/* Branch Selector */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100/80 border border-slate-200 rounded-lg text-xs font-medium text-slate-700">
              <Building2 className="w-3.5 h-3.5 text-brand-600" />
              <select
                value={selectedBranchId || ''}
                onChange={(e) => setSelectedBranchId(e.target.value || null)}
                className="bg-transparent border-none outline-none text-slate-800 font-medium cursor-pointer"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Notification Bell */}
            <button className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white"></span>
            </button>

            {/* User Profile Pill */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 font-semibold flex items-center justify-center text-xs">
                {user?.firstName?.[0] || 'A'}
                {user?.lastName?.[0] || 'D'}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-800 leading-tight">
                  {user ? `${user.firstName} ${user.lastName}` : 'Admin'}
                </span>
                <span className="text-[10px] text-emerald-600 font-medium">SUPER_ADMIN</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0">
          <nav className="sticky top-24 space-y-1.5 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Core Navigation
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/30'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-brand-50 text-brand-700 border border-brand-200'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}

            <div className="pt-4 mt-4 border-t border-slate-100">
              <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                System Invariants
              </div>
              <div className="px-3 py-2 space-y-2 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>ADR-003 Multi-Tenancy</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>ADR-013 Configurable Sources</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>Rule C3 Master Customer ID</span>
                </div>
              </div>
            </div>
          </nav>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden bg-slate-900/50 backdrop-blur-sm">
            <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-white p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <span className="font-bold text-slate-900">Crazy Capital Admin</span>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <nav className="mt-4 space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium ${
                          isActive ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </div>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Pane */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>

      {/* Floating AI Operations Copilot Drawer (Slice 4.3) */}
      <AiCopilotDrawer />
    </div>
  );
}
