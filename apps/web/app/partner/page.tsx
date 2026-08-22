'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Coins,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  FileCheck,
  Send,
  RefreshCw,
  AlertCircle,
  Briefcase,
  Search,
  Building2,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { partnersApi } from '../../lib/api';
import { PartnerCaseDto, PartnerStatsDto, CommissionDto } from '@cc/types';

export default function PartnerPortalPage() {
  const [stats, setStats] = useState<PartnerStatsDto | null>(null);
  const [cases, setCases] = useState<PartnerCaseDto[]>([]);
  const [commissions, setCommissions] = useState<CommissionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'REFERRAL' | 'CASES' | 'EARNINGS'>('REFERRAL');

  // Referral form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    mobile: '',
    email: '',
    companyName: '',
    serviceInterest: 'Private Limited Company Incorporation',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, casesRes, commRes] = await Promise.allSettled([
        partnersApi.getStats(),
        partnersApi.getCases(),
        partnersApi.getCommissions(),
      ]);

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data?.data || statsRes.value.data || null);
      }
      if (casesRes.status === 'fulfilled') {
        const items = casesRes.value.data?.data || casesRes.value.data || [];
        setCases(Array.isArray(items) ? items : []);
      }
      if (commRes.status === 'fulfilled') {
        const cItems = commRes.value.data?.data?.data || commRes.value.data?.data || commRes.value.data || [];
        setCommissions(Array.isArray(cItems) ? cItems : []);
      }
    } catch (err) {
      console.error('Failed to load partner data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleReferralSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);

    if (!formData.firstName.trim() || !formData.mobile.trim()) {
      setSubmitError('Please enter at least client first name and mobile number.');
      return;
    }

    try {
      setSubmitting(true);
      await partnersApi.submitLead(formData);
      setSubmitSuccess(true);
      setFormData({
        firstName: '',
        lastName: '',
        mobile: '',
        email: '',
        companyName: '',
        serviceInterest: 'Private Limited Company Incorporation',
        notes: '',
      });
      await fetchData();
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'Failed to submit referral. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 text-indigo-600 font-bold text-lg tracking-tight">
              <span className="p-1.5 rounded-lg bg-indigo-600 text-white font-black text-sm">CC</span>
              Crazy Capital
            </Link>
            <span className="text-slate-300">/</span>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">
              <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
              Partner Ecosystem
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <Link
              href="/"
              className="text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              Return to Website
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {/* Welcome Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-white/10 backdrop-blur-md text-indigo-200 border border-white/15">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Direct Referral & Tier 1 Partner Network
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Partner Growth Hub & Referral Matrix
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Refer Indian businesses and startups to Crazy Capital for incorporation, GST, compliance, and IP. Track your pipeline live and earn monthly direct bank payouts.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Referred</span>
              <Users className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">{stats?.totalLeads || 0}</p>
            <span className="text-xs text-slate-400 mt-1 block">
              {stats?.convertedLeads || 0} clients converted
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Cases</span>
              <FileCheck className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">{stats?.activeCases || 0}</p>
            <span className="text-xs text-blue-600 mt-1 block">In operational processing</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-amber-200/80 bg-amber-50/20 shadow-xs">
            <div className="flex items-center justify-between text-amber-700">
              <span className="text-xs font-semibold uppercase tracking-wider">Pending Payout</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-amber-800 mt-2">
              ₹{(stats?.pendingCommission || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
            <span className="text-xs text-amber-700 mt-1 block">Under Admin review</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 bg-emerald-50/20 shadow-xs">
            <div className="flex items-center justify-between text-emerald-700">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Disbursed</span>
              <Coins className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-emerald-800 mt-2">
              ₹{(stats?.paidCommission || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
            <span className="text-xs text-emerald-700 mt-1 block">Settled to bank account</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 gap-6">
          <button
            onClick={() => setActiveTab('REFERRAL')}
            className={`pb-3 text-sm font-semibold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'REFERRAL'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Send className="w-4 h-4" />
            Submit Client Referral
          </button>
          <button
            onClick={() => setActiveTab('CASES')}
            className={`pb-3 text-sm font-semibold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'CASES'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            Referred Cases Tracker ({cases.length})
          </button>
          <button
            onClick={() => setActiveTab('EARNINGS')}
            className={`pb-3 text-sm font-semibold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'EARNINGS'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Coins className="w-4 h-4" />
            Commission Ledger ({commissions.length})
          </button>
        </div>

        {/* TAB 1: Submit Client Referral Form */}
        {activeTab === 'REFERRAL' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 max-w-3xl mx-auto space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Send className="w-5 h-5 text-indigo-600" />
                Submit New Client Referral
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Our operations and sales executives will immediately initiate client onboarding while attributing referral commission to your partner account.
              </p>
            </div>

            {submitSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <div>
                  <div className="font-bold">Referral Submitted Successfully!</div>
                  <div>Our sales team has received the lead and is initiating contact. Track updates under Referred Cases.</div>
                </div>
              </div>
            )}

            {submitError && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 text-xs flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <form onSubmit={handleReferralSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Client First Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full text-xs p-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Client Last Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sharma"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full text-xs p-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +91 98765 43210"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="w-full text-xs p-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. ramesh@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full text-xs p-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Company / Entity Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sharma Logistics LLP"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full text-xs p-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Service Interest
                  </label>
                  <select
                    value={formData.serviceInterest}
                    onChange={(e) => setFormData({ ...formData, serviceInterest: e.target.value })}
                    className="w-full text-xs p-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Private Limited Company Incorporation">Private Limited Company Incorporation</option>
                    <option value="Limited Liability Partnership (LLP)">Limited Liability Partnership (LLP)</option>
                    <option value="GST Registration & Monthly Filing">GST Registration & Monthly Filing</option>
                    <option value="Trademark & IP Registration">Trademark & IP Registration</option>
                    <option value="Annual ROC & MCA Compliance">Annual ROC & MCA Compliance</option>
                    <option value="Startup India & DPIIT Recognition">Startup India & DPIIT Recognition</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Referral Context / Specific Client Needs
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Client needs urgent incorporation before the 15th for bank loan sanction."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Submit Referral to CRM
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: Referred Cases Tracker */}
        {activeTab === 'CASES' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Referred Cases Progress</h2>
                <p className="text-xs text-slate-500">Live lifecycle tracking of your client applications</p>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {loading ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                  Loading referred cases...
                </div>
              ) : cases.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No referred cases yet. Submit your first client referral above!
                </div>
              ) : (
                cases.map((c) => (
                  <div key={c.id} className="p-5 hover:bg-slate-50/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                          {c.applicationNumber}
                        </span>
                        <span className="text-xs font-semibold text-slate-900">{c.serviceName}</span>
                      </div>
                      <div className="text-xs text-slate-500">
                        Client: <strong className="text-slate-700">{c.customerName}</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs font-bold text-slate-900">{c.currentStage}</div>
                        <div className="text-[10px] text-slate-400">
                          Updated {new Date(c.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                        c.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : c.status === 'REJECTED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {c.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: Commission Ledger */}
        {activeTab === 'EARNINGS' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Commission & Payout Ledger</h2>
                <p className="text-xs text-slate-500">Detailed breakdown of referral commissions and bank UTR settlements</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-4">Case Reference</th>
                    <th className="py-3.5 px-4">Service</th>
                    <th className="py-3.5 px-4 text-right">Commission Rate</th>
                    <th className="py-3.5 px-4 text-right">Amount</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Settlement UTR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {commissions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        No commissions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    commissions.map((comm) => (
                      <tr key={comm.id} className="hover:bg-slate-50/80">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          {comm.application?.applicationNumber || 'REF-APP'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-800 font-medium">
                          {comm.service?.name || 'Financial Service'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                          {Number(comm.rate)}%
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                          ₹{Number(comm.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            comm.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : comm.status === 'APPROVED'
                              ? 'bg-blue-100 text-blue-800'
                              : comm.status === 'REJECTED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {comm.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-[11px] text-slate-600">
                          {comm.payouts?.[0]?.referenceNumber || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
