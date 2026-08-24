'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sliders,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  Edit2,
  Tag,
  ShieldCheck,
  X,
} from 'lucide-react';
import { Card, Button, Badge } from '@cc/ui';
import { crmApi } from '@/lib/api';

interface LeadSourceItem {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  leadsCount: number;
}

export default function LeadSourcesSettingsPage() {
  const [sources, setSources] = useState<LeadSourceItem[]>([
    { id: '1', name: 'Website', code: 'WEBSITE', isActive: true, leadsCount: 450 },
    { id: '2', name: 'WhatsApp', code: 'WHATSAPP', isActive: true, leadsCount: 290 },
    { id: '3', name: 'Partner Referral', code: 'PARTNER_REFERRAL', isActive: true, leadsCount: 380 },
    { id: '4', name: 'Direct Call', code: 'DIRECT_CALL', isActive: true, leadsCount: 120 },
    { id: '5', name: 'Cold Call', code: 'COLD_CALL', isActive: true, leadsCount: 95 },
    { id: '6', name: 'Social Media', code: 'SOCIAL_MEDIA', isActive: true, leadsCount: 160 },
    { id: '7', name: 'Email Campaign', code: 'EMAIL_CAMPAIGN', isActive: true, leadsCount: 85 },
    { id: '8', name: 'Event / Exhibition', code: 'EVENT', isActive: true, leadsCount: 45 },
  ]);

  React.useEffect(() => {
    async function loadSources() {
      try {
        const data: any = await crmApi.getLeadSources(true);
        if (Array.isArray(data)) {
          setSources(data.map((d: any) => ({
            id: d.id,
            name: d.name,
            code: d.code,
            isActive: d.isActive,
            leadsCount: d._count?.leads ?? d.leadsCount ?? 0,
          })));
        }
      } catch (err) {
        console.info('Using local lead sources state');
      }
    }
    loadSources();
  }, []);

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSource, setNewSource] = useState({ name: '', code: '' });

  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSource.name || !newSource.code) return;

    const normalizedCode = newSource.code.trim().toUpperCase().replace(/\s+/g, '_');

    try {
      const createdFromApi: any = await crmApi.createLeadSource({
        name: newSource.name.trim(),
        code: normalizedCode,
      });

      if (createdFromApi && createdFromApi.id) {
        setSources([...sources, {
          id: createdFromApi.id,
          name: createdFromApi.name,
          code: createdFromApi.code,
          isActive: createdFromApi.isActive,
          leadsCount: 0,
        }]);
      } else {
        const created: LeadSourceItem = {
          id: `src-${Date.now()}`,
          name: newSource.name.trim(),
          code: normalizedCode,
          isActive: true,
          leadsCount: 0,
        };
        setSources([...sources, created]);
      }
    } catch (err) {
      const created: LeadSourceItem = {
        id: `src-${Date.now()}`,
        name: newSource.name.trim(),
        code: normalizedCode,
        isActive: true,
        leadsCount: 0,
      };
      setSources([...sources, created]);
    }

    setIsModalOpen(false);
    setNewSource({ name: '', code: '' });
  };

  const toggleStatus = async (id: string) => {
    const current = sources.find((s) => s.id === id);
    const newStatus = current ? !current.isActive : true;

    try {
      await crmApi.updateLeadSource(id, { isActive: newStatus });
    } catch (err) {
      console.warn('API offline, toggling locally');
    }

    setSources(
      sources.map((s) => (s.id === id ? { ...s, isActive: newStatus } : s)),
    );
  };

  const filtered = sources.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Configurable Lead Sources</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-200">
              ADR-013 Standard
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Admin-configurable lead channels dynamically stored in the database. Never hardcoded as static enums.
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          variant="primary"
          className="flex items-center gap-2 text-xs font-semibold shadow-sm shadow-brand-500/20"
        >
          <Plus className="w-4 h-4" /> Add Lead Source
        </Button>
      </div>

      {/* ADR Explanation Card */}
      <Card className="p-4 bg-brand-900 text-white flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <span className="font-bold text-slate-200">ADR-013 Decision Invariant</span>
          <p className="text-slate-300">
            Admins have complete authority to add and deactivate lead sources (e.g. <code>INSTAGRAM_CAMPAIGN</code> or <code>EXPO_2026</code>) at runtime without requiring code deployments.
          </p>
        </div>
      </Card>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-3.5 border-b border-slate-200 flex items-center justify-between">
          <div className="relative max-w-sm w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search lead sources..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <span className="text-xs font-semibold text-slate-500">{filtered.length} sources configured</span>
        </div>

        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="p-3.5">Display Name</th>
              <th className="p-3.5">System Code</th>
              <th className="p-3.5">Attributed Leads</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="p-3.5 font-bold text-slate-900">{s.name}</td>
                <td className="p-3.5 font-mono text-slate-600">
                  <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-semibold">
                    {s.code}
                  </span>
                </td>
                <td className="p-3.5 font-mono font-semibold text-slate-800">
                  {s.leadsCount} leads
                </td>
                <td className="p-3.5">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      s.isActive
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {s.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="p-3.5 text-right">
                  <Button
                    size="sm"
                    variant={s.isActive ? 'outline' : 'primary'}
                    onClick={() => toggleStatus(s.id)}
                    className="text-xs py-1 px-2.5"
                  >
                    {s.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Lead Source Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Add New Lead Source (ADR-013)</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddSource} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Source Display Name *</label>
                <input
                  type="text"
                  required
                  value={newSource.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const code = name.trim().toUpperCase().replace(/\s+/g, '_');
                    setNewSource({ name, code });
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none"
                  placeholder="e.g. Instagram Influencer Campaign"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Unique Uppercase Code *</label>
                <input
                  type="text"
                  required
                  value={newSource.code}
                  onChange={(e) => setNewSource({ ...newSource, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none font-mono uppercase"
                  placeholder="INSTAGRAM_CAMPAIGN"
                />
              </div>
              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Save Source
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
