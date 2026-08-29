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
  BookOpen,
  Receipt,
  Landmark,
  UserCheck,
  HeartHandshake,
  BadgePercent,
  UtensilsCrossed,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { SERVICE_VERTICALS } from '../data/service-verticals';
import { PublicLeadCapture } from '../components/public-lead-capture';

const iconMap: Record<string, any> = {
  Building2,
  Users2,
  UserCheck,
  HeartHandshake,
  FileCheck2,
  Receipt,
  Landmark,
  Award,
  ShieldCheck,
  Sparkles,
  BadgePercent,
  Scale,
  TrendingUp,
  UtensilsCrossed,
};

import { ThemeToggle } from '../lib/theme-context';
import { NotificationCentre } from '../components/notifications/notification-centre';

export default function HomePage() {
  const popularServices = SERVICE_VERTICALS.filter((s) => s.isPopular);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors duration-200">
      {/* Top Navbar */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-amber-400 flex items-center justify-center font-black text-white shadow-lg shadow-brand-500/20">
                CC
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                  Crazy Capital <span className="text-xs">🇮🇳</span>
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 tracking-wider font-semibold uppercase">
                  India&apos;s Business Operating System
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-xs font-semibold">
            <Link
              href="/blog"
              className="hidden md:flex px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5 text-brand-500 dark:text-brand-400" /> Knowledge Center
            </Link>

            <Link
              href="/customer"
              className="px-3 py-1.5 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 dark:hover:bg-emerald-500/30 transition-colors flex items-center gap-1.5"
            >
              <FileCheck2 className="w-3.5 h-3.5" /> Customer Portal
            </Link>

            <Link
              href="/partner"
              className="hidden sm:flex px-3 py-1.5 rounded-lg bg-brand-600/10 dark:bg-brand-600/20 border border-brand-500/20 dark:border-brand-500/30 text-brand-700 dark:text-brand-400 hover:bg-brand-600/20 dark:hover:bg-brand-600/30 transition-colors items-center gap-1.5"
            >
              <Users2 className="w-3.5 h-3.5" /> Partner Hub
            </Link>

            {/* Yin/Yang Theme Switcher */}
            <ThemeToggle />

            {/* Interactive Notification Centre */}
            <NotificationCentre />

            {/* Admin Login Button */}
            <Link
              href="/admin"
              className="px-3.5 py-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors font-bold shadow-xs flex items-center gap-1.5"
            >
              Admin Login ➔
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 md:py-18 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-bold text-amber-400">
                <Sparkles className="w-3.5 h-3.5" /> Building India&apos;s Growth Story 🇮🇳
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
                One Operating System for All 14 Corporate & Financial Verticals
              </h1>

              <p className="text-base text-slate-300 max-w-xl leading-relaxed">
                Seamlessly launch, protect, fund, and scale your business across India with verified statutory workflows, fast SLAs, and dedicated compliance officers.
              </p>

              {/* Quick Popular Services Badges */}
              <div className="pt-2 space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Featured Quick-Launch Services</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {popularServices.slice(0, 4).map((serv) => {
                    const Icon = iconMap[serv.iconName] || Building2;
                    return (
                      <Link
                        key={serv.slug}
                        href={`/services/${serv.slug}`}
                        className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:border-brand-500/60 hover:bg-slate-800 transition-all flex items-start gap-3 group"
                      >
                        <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400 group-hover:bg-brand-600 group-hover:text-white transition-colors shrink-0 mt-0.5">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-xs text-white group-hover:text-brand-400 transition-colors truncate">
                            {serv.title}
                          </div>
                          <div className="text-[11px] text-emerald-400 font-medium flex items-center justify-between mt-0.5">
                            <span>From ₹{serv.startingPriceInr.toLocaleString('en-IN')}</span>
                            <span className="text-[10px] text-slate-400">{serv.slaTimelineDays}</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center gap-6 pt-3 text-xs text-slate-400 border-t border-slate-800">
                <span className="flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> MCA SPICe+ & GSTN Certified
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> 100% Indian Data Sovereignty
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <Clock className="w-4 h-4 text-emerald-400" /> 15-Minute Response SLA
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

      {/* 14 Service Verticals Master Directory */}
      <section className="py-16 bg-slate-900 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Complete Catalog of 14 Service Verticals
            </h2>
            <p className="text-sm text-slate-400">
              End-to-end transparent pricing, guaranteed statutory SLA turnaround times, and direct compliance officer assignment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICE_VERTICALS.map((service) => {
              const Icon = iconMap[service.iconName] || Building2;
              return (
                <Link
                  key={service.slug}
                  href={`/services/${service.slug}`}
                  className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/70 hover:border-brand-500/60 hover:bg-slate-800/90 transition-all flex flex-col justify-between space-y-5 group shadow-lg"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-400 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                        <Icon className="w-5 h-5" />
                      </div>
                      {service.badge && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold border border-amber-500/30">
                          {service.badge}
                        </span>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {service.categoryName}
                      </span>
                      <h3 className="text-base font-bold text-white group-hover:text-brand-400 transition-colors mt-0.5 leading-snug">
                        {service.title}
                      </h3>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {service.subtitle}
                    </p>
                  </div>

                  <div className="border-t border-slate-700/60 pt-4 flex items-center justify-between text-xs">
                    <div>
                      <div className="text-[10px] text-slate-500">Starting Fee</div>
                      <div className="font-bold text-white">
                        ₹{service.startingPriceInr.toLocaleString('en-IN')}{' '}
                        <span className="text-[10px] text-slate-400 font-normal">+ GST</span>
                      </div>
                    </div>
                    <span className="text-brand-400 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Explore Service <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-10 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center font-bold text-white text-xs">
                CC
              </div>
              <span className="font-bold text-white">Crazy Capital Technologies Private Limited 🇮🇳</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/" className="hover:text-slate-300">All Services</Link>
              <Link href="/blog" className="hover:text-slate-300">Knowledge Center</Link>
              <Link href="/customer" className="hover:text-slate-300">Customer Portal</Link>
              <Link href="/partner" className="hover:text-slate-300">Partner Growth Hub</Link>
            </div>
          </div>
          <div className="border-t border-slate-800/80 pt-4 text-center text-[11px] text-slate-600">
            Noida • New Delhi • Mumbai • Bengaluru | India&apos;s Business Operating Platform
          </div>
        </div>
      </footer>
    </div>
  );
}
