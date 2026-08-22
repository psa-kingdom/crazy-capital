import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Building2,
  TrendingUp,
  FileCheck2,
  Scale,
  Award,
  ArrowRight,
  Sparkles,
  Users2,
  Layers,
} from 'lucide-react';
import { PublicLeadCapture } from '../components/public-lead-capture';

export default function HomePage() {
  const verticals = [
    { title: 'Company Incorporation', desc: 'Pvt Ltd, LLP, Section 8 & OPC with DSC, DIN & PAN in 3–5 days.', icon: Building2, color: 'text-brand-600 bg-brand-50' },
    { title: 'Tax & GST Compliance', desc: 'GST Registration, Monthly GSTR Filing, TDS & Annual Corporate ITR.', icon: FileCheck2, color: 'text-emerald-600 bg-emerald-50' },
    { title: 'Intellectual Property', desc: 'Trademark search, filing, copyright registration and patent advisory.', icon: Award, color: 'text-purple-600 bg-purple-50' },
    { title: 'Business Loans & MSME', desc: 'Unsecured working capital, machinery loans and CGTMSE government schemes.', icon: TrendingUp, color: 'text-amber-600 bg-amber-50' },
    { title: 'Legal & Secretarial', desc: 'Shareholder agreements, ROC annual filings, director changes and audits.', icon: Scale, color: 'text-blue-600 bg-blue-50' },
    { title: 'Startup India & DIPP', desc: 'DPIIT Recognition, 80-IAC Tax Exemption, Seed Fund advisory.', icon: Sparkles, color: 'text-teal-600 bg-teal-50' },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-amber-400 flex items-center justify-center font-black text-white shadow-lg">
              CC
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                Crazy Capital <span className="text-xs">🇮🇳</span>
              </span>
              <span className="text-[10px] text-slate-400 tracking-wider font-semibold uppercase">
                India&apos;s Business Operating System
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold">
            <Link
              href="/documents"
              className="px-3.5 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 transition-colors flex items-center gap-1.5"
            >
              <FileCheck2 className="w-3.5 h-3.5" /> Customer Vault (Slice 1.7)
            </Link>
            <Link
              href="/employee/leads"
              className="px-3.5 py-1.5 rounded-lg bg-brand-600/20 border border-brand-500/30 text-brand-400 hover:bg-brand-600/30 transition-colors flex items-center gap-1.5"
            >
              <Users2 className="w-3.5 h-3.5" /> Employee CRM Portal
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-bold text-amber-400">
                <span>Building India&apos;s Growth Story 🇮🇳</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                One Operating System for All Your Business Services
              </h1>

              <p className="text-base text-slate-300 max-w-xl leading-relaxed">
                Connect your startup, MSME, or enterprise to India&apos;s most reliable network for company registration, GST, taxation, trademarks, and business finance.
              </p>

              {/* Service Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
                {verticals.slice(0, 4).map((v, i) => {
                  const Icon = v.icon;
                  return (
                    <div key={i} className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${v.color} shrink-0 mt-0.5`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-white">{v.title}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">{v.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center gap-6 pt-4 text-xs text-slate-400 border-t border-slate-800">
                <span className="flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> MCA & GSTN Compliant
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> 100% Indian Data Sovereignty
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> 15-Minute Response SLA
                </span>
              </div>
            </div>

            {/* Right Consultation Form */}
            <div className="lg:col-span-5">
              <PublicLeadCapture />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          <p>© 2026 Crazy Capital Financial Technologies Private Limited. All rights reserved.</p>
          <p className="mt-1 text-[11px] text-slate-600">
            Noida • New Delhi • Mumbai • Bengaluru | Unified Business Operating Platform
          </p>
        </div>
      </footer>
    </div>
  );
}
