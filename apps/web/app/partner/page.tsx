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
  Share2,
  Copy,
  Check,
  Award,
  ShieldCheck,
  Tag,
  CreditCard,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { partnersApi, identityVerificationApi } from '../../lib/api';
import { PartnerCaseDto, PartnerStatsDto, CommissionDto, PartnerProfileDto } from '@cc/types';

export default function PartnerPortalPage() {
  const [stats, setStats] = useState<PartnerStatsDto | null>(null);
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [profile, setProfile] = useState<PartnerProfileDto | null>(null);
  const [cases, setCases] = useState<PartnerCaseDto[]>([]);
  const [commissions, setCommissions] = useState<CommissionDto[]>([]);
  const [referralTree, setReferralTree] = useState<any | null>(null);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'REFERRAL' | 'LINKS' | 'EARNINGS' | 'COUPONS' | 'KYC'>('REFERRAL');

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

  // KYC submission form state
  const [kycData, setKycData] = useState({
    businessName: '',
    pan: '',
    gstin: '',
    aadhaar: '',
    bankAccountNumber: '',
    bankIfsc: '',
    bankBeneficiaryName: '',
  });
  const [kycSubmitting, setKycSubmitting] = useState(false);
  const [kycSuccess, setKycSuccess] = useState(false);
  const [kycError, setKycError] = useState<string | null>(null);

  // Copy link feedback
  const [copiedLink, setCopiedLink] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, analyticsRes, profileRes, casesRes, commRes, treeRes, couponsRes] = await Promise.allSettled([
        partnersApi.getStats(),
        partnersApi.getAnalytics(),
        partnersApi.getProfile(),
        partnersApi.getCases(),
        partnersApi.getCommissions(),
        partnersApi.getReferralTree(),
        partnersApi.getCoupons(),
      ]);

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data?.data || statsRes.value.data || null);
      }
      if (analyticsRes.status === 'fulfilled') {
        setAnalytics(analyticsRes.value.data?.data || analyticsRes.value.data || null);
      }
      if (profileRes.status === 'fulfilled') {
        const p = profileRes.value.data?.data || profileRes.value.data || null;
        setProfile(p);
        if (p) {
          setKycData((prev) => ({
            ...prev,
            businessName: p.businessName || '',
            bankIfsc: p.bankIfsc || '',
            bankBeneficiaryName: p.bankBeneficiaryName || '',
          }));
        }
      }
      if (casesRes.status === 'fulfilled') {
        const items = casesRes.value.data?.data || casesRes.value.data || [];
        setCases(Array.isArray(items) ? items : []);
      }
      if (commRes.status === 'fulfilled') {
        const cItems = commRes.value.data?.data?.data || commRes.value.data?.data || commRes.value.data || [];
        setCommissions(Array.isArray(cItems) ? cItems : []);
      }
      if (treeRes.status === 'fulfilled') {
        setReferralTree(treeRes.value.data?.data || treeRes.value.data || null);
      }
      if (couponsRes.status === 'fulfilled') {
        const cList = couponsRes.value.data?.data || couponsRes.value.data || [];
        setCoupons(Array.isArray(cList) ? cList : []);
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
      setSubmitError(err.message || 'Failed to submit referral. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setKycError(null);
    setKycSuccess(false);

    try {
      setKycSubmitting(true);
      await partnersApi.updateKyc(kycData);
      setKycSuccess(true);
      await fetchData();
    } catch (err: any) {
      setKycError(err.message || 'Failed to submit KYC. Please verify details.');
    } finally {
      setKycSubmitting(false);
    }
  };

  const copyReferralUrl = () => {
    const code = profile?.partnerCode || 'CC-PTR-0001';
    const url = `https://crazycapital.in/?ref=${code}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const tier = profile?.tier || 'SILVER';
  const tierColors: Record<string, { bg: string; text: string; border: string; badge: string }> = {
    PLATINUM: { bg: 'from-purple-900/40 to-indigo-900/40', text: 'text-purple-400', border: 'border-purple-500/30', badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
    GOLD: { bg: 'from-amber-900/40 to-yellow-900/40', text: 'text-amber-400', border: 'border-amber-500/30', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
    SILVER: { bg: 'from-slate-800/60 to-slate-900/60', text: 'text-slate-300', border: 'border-slate-700', badge: 'bg-slate-700/50 text-slate-300 border-slate-600' },
  };

  const currentTierStyle = tierColors[tier] || tierColors.SILVER;
  const progressPct = analytics?.tierProgress?.progressPct ?? 35;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center font-black text-slate-950 text-lg shadow-lg shadow-amber-500/20">
                CC
              </div>
              <span className="font-bold text-lg text-slate-100 hidden sm:inline">Crazy Capital</span>
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-sm font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Partner Ecosystem V2
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={copyReferralUrl}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
              <span>{copiedLink ? 'Copied Link!' : `Code: ${profile?.partnerCode || 'CC-PTR-...'}`}</span>
            </button>
            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Tier Progression Banner */}
        <section className={`p-6 rounded-2xl bg-gradient-to-r ${currentTierStyle.bg} border ${currentTierStyle.border} shadow-2xl relative overflow-hidden`}>
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${currentTierStyle.badge} flex items-center gap-1.5`}>
                  <Award className="w-3.5 h-3.5" />
                  {tier} Partner Tier
                </span>
                {profile?.kycStatus === 'VERIFIED' ? (
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> KYC Verified
                  </span>
                ) : (
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {profile?.kycStatus || 'KYC Pending'}
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
                Welcome, {profile?.businessName || 'Distinguished Partner'}
              </h1>
              <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                Earn industry-leading tiered commissions ({tier === 'PLATINUM' ? '20%' : tier === 'GOLD' ? '15%' : '10%'} base rate) + multi-tier referral overrides on incorporation, compliance & statutory filings nationwide.
              </p>
            </div>

            {/* Milestone Progress to Next Tier */}
            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 min-w-[280px]">
              <div className="flex justify-between items-center text-xs text-slate-400 mb-1.5 font-medium">
                <span>Next Milestone: {analytics?.tierProgress?.nextTier || 'Top Platinum Achieved'}</span>
                <span className="text-amber-400 font-bold">{progressPct}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[11px] text-slate-500 mt-2">
                <span>Conversions: {profile?.lifetimeConversions || 0}</span>
                <span>Lifetime: ₹{(profile?.lifetimeEarnings || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Quick KPI Stat Cards */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl hover:border-slate-700 transition shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Total Accrued</span>
              <Coins className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-slate-100">
              ₹{(analytics?.summary?.totalAccrued || stats?.totalCommissionEarned || 0).toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">All historical commissions</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl hover:border-slate-700 transition shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Ready for Payout</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400">
              ₹{(analytics?.summary?.approvedReady || stats?.pendingCommission || 0).toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-emerald-500/70 mt-1">RazorpayX NEFT/IMPS ready</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl hover:border-slate-700 transition shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Active Referrals</span>
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-black text-blue-400">
              {analytics?.summary?.leadsCount || stats?.totalLeads || 0}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Clients in pipeline</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl hover:border-slate-700 transition shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Conversions</span>
              <CheckCircle2 className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-purple-400">
              {profile?.lifetimeConversions || stats?.convertedLeads || 0}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Converted into paid clients</p>
          </div>
        </section>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 space-x-2 sm:space-x-4 overflow-x-auto pb-px">
          {[
            { id: 'REFERRAL', label: 'Submit & Track Leads', icon: Send },
            { id: 'LINKS', label: 'Multi-Tier Referral Tree', icon: Share2 },
            { id: 'EARNINGS', label: 'Earnings & Slabs', icon: Coins },
            { id: 'COUPONS', label: 'Promotional Coupons', icon: Tag },
            { id: 'KYC', label: 'KYC & Bank Setup', icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition ${
                  active
                    ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: SUBMIT & TRACK CLIENT REFERRALS */}
        {activeTab === 'REFERRAL' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 bg-slate-900/70 border border-slate-800 p-6 rounded-2xl shadow-xl">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-1">
                <Send className="w-5 h-5 text-amber-400" />
                Submit New Client Referral
              </h2>
              <p className="text-xs text-slate-400 mb-6">
                Our central CRM will immediately initiate customer onboarding and attribute full tier commission to you upon conversion.
              </p>

              {submitSuccess && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm mb-6 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">Referral Logged Successfully!</div>
                    <div className="text-xs mt-0.5 text-emerald-400/80">
                      Our enterprise sales desk has received this lead. Tracking is live in your case log.
                    </div>
                  </div>
                </div>
              )}

              {submitError && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm mb-6 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>{submitError}</div>
                </div>
              )}

              <form onSubmit={handleReferralSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="e.g. Ramesh"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="e.g. Sharma"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Client Email (Optional)</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="ramesh@company.in"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Company / Entity Name</label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="Sharma Enterprises Pvt Ltd"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Service Required</label>
                  <select
                    value={formData.serviceInterest}
                    onChange={(e) => setFormData({ ...formData, serviceInterest: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Private Limited Company Incorporation">Private Limited Company Incorporation</option>
                    <option value="Limited Liability Partnership (LLP)">Limited Liability Partnership (LLP)</option>
                    <option value="GST Registration & Filing">GST Registration & Filing</option>
                    <option value="Trademark Registration">Trademark Registration</option>
                    <option value="Accounting & Monthly Bookkeeping">Accounting & Monthly Bookkeeping</option>
                    <option value="Virtual CFO Services">Virtual CFO Services</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Referral Notes</label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Client needs incorporation completed within 5 business days..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition disabled:opacity-50"
                >
                  {submitting ? 'Submitting Referral...' : 'Submit Client Lead'}
                </button>
              </form>
            </div>

            {/* Cases Track Table */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-amber-400" />
                  Your Referred Client Pipeline ({cases.length})
                </h2>
              </div>

              {cases.length === 0 ? (
                <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-12 text-center text-slate-500">
                  <Users className="w-12 h-12 mx-auto mb-3 text-slate-700" />
                  <p className="font-semibold text-slate-400">No client referrals yet</p>
                  <p className="text-xs mt-1">Submit your first lead using the form on the left to start earning.</p>
                </div>
              ) : (
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                  <div className="divide-y divide-slate-800">
                    {cases.map((c, i) => (
                      <div key={i} className="p-4 hover:bg-slate-800/40 transition flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-100 text-sm flex items-center gap-2">
                            {c.customerName}
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                              {c.serviceName}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                            <span>App: {c.applicationNumber || 'Under Intake'}</span>
                            <span>•</span>
                            <span>Stage: {c.currentStage}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                              c.status === 'COMPLETED'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : c.status === 'IN_PROGRESS'
                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            }`}
                          >
                            {c.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: MULTI-TIER REFERRAL TREE & LINKS */}
        {activeTab === 'LINKS' && (
          <div className="space-y-6">
            {/* Affiliate Link Card */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
              <h3 className="text-base font-bold text-slate-100 mb-1 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-amber-400" />
                Your Unique Affiliate Referral Link
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Share this link with prospective business owners. Any client signing up or purchasing via your link is permanently attributed to your account.
              </p>
              <div className="flex items-center gap-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <input
                  type="text"
                  readOnly
                  value={`https://crazycapital.in/?ref=${profile?.partnerCode || 'CC-PTR-0001'}`}
                  className="bg-transparent text-sm text-amber-400 font-mono flex-1 px-2 focus:outline-none"
                />
                <button
                  onClick={copyReferralUrl}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition"
                >
                  {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedLink ? 'Copied' : 'Copy Link'}
                </button>
              </div>
            </div>

            {/* 3-Tier Network Hierarchy */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div className="text-xs font-bold uppercase text-amber-400 tracking-wider mb-1">Tier 1: Direct Clients</div>
                <div className="text-2xl font-black text-slate-100">{tier === 'PLATINUM' ? '20%' : tier === 'GOLD' ? '15%' : '10%'}</div>
                <p className="text-xs text-slate-400 mt-1">Full slab commission on every service completed by your direct referrals.</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div className="text-xs font-bold uppercase text-blue-400 tracking-wider mb-1">Tier 2: Sub-Partner Override</div>
                <div className="text-2xl font-black text-blue-400">+2.5%</div>
                <p className="text-xs text-slate-400 mt-1">Passive override on all business generated by partners onboarded under you.</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div className="text-xs font-bold uppercase text-purple-400 tracking-wider mb-1">Tier 3: Master Hub Override</div>
                <div className="text-2xl font-black text-purple-400">+1.0%</div>
                <p className="text-xs text-slate-400 mt-1">Master partner override across the full downstream nationwide network.</p>
              </div>
            </div>

            {/* Sub-partners in network */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
              <h4 className="text-sm font-bold text-slate-100 mb-4 flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                Affiliated Sub-Partners ({referralTree?.subPartners?.length || 0})
              </h4>
              {!referralTree?.subPartners?.length ? (
                <p className="text-xs text-slate-500">No sub-partners recruited yet. Share your link with CPAs, CAs, and business consultants.</p>
              ) : (
                <div className="divide-y divide-slate-800">
                  {referralTree.subPartners.map((sp: any, idx: number) => (
                    <div key={idx} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-200">{sp.name}</span>
                        <span className="text-slate-500 ml-2">({sp.email})</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">{sp.tier}</span>
                        <span className="text-amber-400 font-bold">{sp.conversions} Conversions</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: EARNINGS & TIER SLABS */}
        {activeTab === 'EARNINGS' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
              <h3 className="text-base font-bold text-slate-100 mb-4 flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-400" />
                Commission Ledger & Disbursement Log
              </h3>
              {commissions.length === 0 ? (
                <p className="text-xs text-slate-500">No commissions recorded yet.</p>
              ) : (
                <div className="divide-y divide-slate-800">
                  {commissions.map((c, idx) => (
                    <div key={idx} className="py-3.5 flex items-center justify-between text-sm">
                      <div>
                        <div className="font-bold text-slate-100 flex items-center gap-2">
                          ₹{Number(c.amount).toLocaleString('en-IN')}
                          <span className="text-xs text-slate-400 font-normal">({Number(c.rate)}% Rate)</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Base: ₹{Number(c.baseAmount).toLocaleString('en-IN')} • Date: {new Date(c.createdAt).toLocaleDateString('en-IN')}
                        </div>
                      </div>
                      <div>
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                            c.status === 'PAID'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : c.status === 'APPROVED'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: PROMOTIONAL COUPONS */}
        {activeTab === 'COUPONS' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-amber-400" />
                  Active Promotional Discount Codes ({coupons.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {coupons.map((cpn, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-amber-500/30 transition">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-mono text-base font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20">
                          {cpn.code}
                        </span>
                        <p className="text-xs text-slate-400 mt-2">{cpn.description || 'Promotional partner discount'}</p>
                      </div>
                      <span className="text-sm font-bold text-slate-100">
                        {cpn.discountType === 'PERCENTAGE' ? `${cpn.discountValue}% OFF` : `₹${cpn.discountValue} FLAT`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-4 pt-3 border-t border-slate-800/60">
                      <span>Redeemed: {cpn.currentUsageCount || 0} times</span>
                      <span className="text-emerald-400 font-medium">Status: {cpn.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: KYC & STATUTORY BANK VERIFICATION */}
        {activeTab === 'KYC' && (
          <div className="max-w-2xl bg-slate-900/70 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                Statutory KYC & Direct Bank Transfer Setup
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Commissions are directly disbursed into this verified bank account via RazorpayX upon automated approval.
              </p>
            </div>

            {kycSuccess && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">KYC Submitted for Review!</div>
                  <div className="text-xs text-emerald-400/80">
                    Your details have been recorded and are undergoing automated statutory matching.
                  </div>
                </div>
              </div>
            )}

            {kycError && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>{kycError}</div>
              </div>
            )}

            <form onSubmit={handleKycSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Business / Firm Trade Name</label>
                <input
                  type="text"
                  value={kycData.businessName}
                  onChange={(e) => setKycData({ ...kycData, businessName: e.target.value })}
                  placeholder="e.g. Aditya Financial Consultants LLP"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">PAN Card Number</label>
                  <input
                    type="text"
                    value={kycData.pan}
                    onChange={(e) => setKycData({ ...kycData, pan: e.target.value.toUpperCase() })}
                    placeholder={profile?.panMasked || 'ABCDE1234F'}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">GSTIN (Optional)</label>
                  <input
                    type="text"
                    value={kycData.gstin}
                    onChange={(e) => setKycData({ ...kycData, gstin: e.target.value.toUpperCase() })}
                    placeholder="09AAACC1206D1ZH"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Aadhaar (12 digits for DigiLocker OTP)</label>
                <input
                  type="password"
                  maxLength={12}
                  value={kycData.aadhaar}
                  onChange={(e) => setKycData({ ...kycData, aadhaar: e.target.value })}
                  placeholder={profile?.aadhaarMasked || '123456789012'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-800 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                  Disbursement Bank Account
                </h4>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Beneficiary Account Name</label>
                  <input
                    type="text"
                    value={kycData.bankBeneficiaryName}
                    onChange={(e) => setKycData({ ...kycData, bankBeneficiaryName: e.target.value })}
                    placeholder="Vikram Aditya"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Bank Account Number</label>
                    <input
                      type="password"
                      value={kycData.bankAccountNumber}
                      onChange={(e) => setKycData({ ...kycData, bankAccountNumber: e.target.value })}
                      placeholder={profile?.bankAccountNumberMasked || '••••••••1234'}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Bank IFSC Code</label>
                    <input
                      type="text"
                      value={kycData.bankIfsc}
                      onChange={(e) => setKycData({ ...kycData, bankIfsc: e.target.value.toUpperCase() })}
                      placeholder="HDFC0001234"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={kycSubmitting}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition disabled:opacity-50"
              >
                {kycSubmitting ? 'Submitting & Verifying...' : 'Save & Verify KYC'}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
