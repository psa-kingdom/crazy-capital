import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import {
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
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  HelpCircle,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { getServiceBySlug, getAllServiceSlugs, SERVICE_VERTICALS } from '../../../data/service-verticals';
import { PublicLeadCapture } from '../../../components/public-lead-capture';

interface Props {
  params: Promise<{ slug: string }>;
}

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

export async function generateStaticParams() {
  return getAllServiceSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const service = getServiceBySlug(slug);

  if (!service) {
    return {
      title: 'Service Not Found | Crazy Capital',
    };
  }

  const title = `${service.title} in India | Crazy Capital`;
  const description = service.description;
  const canonicalUrl = `https://crazycapital.in/services/${service.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'Crazy Capital — India’s Business Operating System',
      type: 'website',
      locale: 'en_IN',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function ServiceVerticalPage({ params }: Props) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);

  if (!service) {
    notFound();
  }

  const IconComponent = iconMap[service.iconName] || Building2;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 group">
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
            </Link>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <Link
              href="/blog"
              className="text-slate-300 hover:text-white transition-colors"
            >
              Knowledge Center
            </Link>
            <Link
              href="/customer"
              className="px-3.5 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
            >
              Customer Portal
            </Link>
          </div>
        </div>
      </header>

      {/* Breadcrumb Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 text-xs text-slate-400">
          <Link href="/" className="hover:text-slate-200">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-slate-400">Services</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-brand-400 font-medium">{service.categoryName}</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-white font-semibold truncate">{service.title}</span>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 md:py-16 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Left Info Column */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-brand-500/20 border border-brand-500/30 text-brand-400 text-xs font-bold">
                  {service.categoryName}
                </span>
                {service.badge && (
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold">
                    ★ {service.badge}
                  </span>
                )}
                <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1">
                  <Clock className="w-3 h-3 text-emerald-400" /> SLA: {service.slaTimelineDays}
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                {service.title}
              </h1>

              <p className="text-base text-slate-300 leading-relaxed max-w-2xl">
                {service.subtitle}
              </p>

              {/* Pricing Callout Card */}
              <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Starting Professional Fee</div>
                  <div className="text-3xl font-black text-white flex items-baseline gap-1">
                    ₹{service.startingPriceInr.toLocaleString('en-IN')}
                    <span className="text-xs font-normal text-slate-400">+ 18% GST</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{service.governmentFeesNote}</div>
                </div>
                <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-2 rounded-xl border border-emerald-500/20">
                  <ShieldCheck className="w-4 h-4 shrink-0" /> Money-Back SLA Guarantee
                </div>
              </div>

              {/* Key Features */}
              <div className="space-y-2.5 pt-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Why Choose Crazy Capital?</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {service.features.map((feat, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Lead Capture Card */}
            <div className="lg:col-span-5 sticky top-24">
              <PublicLeadCapture
                defaultServiceSlug={service.slug}
                defaultServiceName={service.title}
                title={`Fast-Track ${service.title}`}
                subtitle={`Dedicated compliance officer • Starts at ₹${service.startingPriceInr.toLocaleString('en-IN')}`}
                buttonText="Start Registration Online"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Deliverables & Process Section */}
      <section className="py-14 bg-slate-900 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Deliverables Grid */}
          <div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight mb-6 flex items-center gap-2">
              <FileText className="w-6 h-6 text-brand-400" /> What You Receive in the Package
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {service.deliverables.map((deliv, i) => (
                <div key={i} className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <span className="text-xs font-semibold text-slate-200">{deliv}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 4-Step Process Stepper */}
          <div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight mb-6 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-amber-400" /> Step-by-Step Execution Lifecycle
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {service.processSteps.map((step) => (
                <div key={step.stepNumber} className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="w-7 h-7 rounded-lg bg-brand-600 text-white flex items-center justify-center text-xs font-black">
                      0{step.stepNumber}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      {step.estimatedDays}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-white pt-1">{step.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Required Documents Checklist */}
          <div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight mb-6 flex items-center gap-2">
              <Shield className="w-6 h-6 text-purple-400" /> Mandatory Documents Checklist
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {service.requiredDocuments.map((doc, i) => (
                <div key={i} className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-800 text-purple-400 shrink-0">
                    <FileCheck2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white">{doc.name}</span>
                      {doc.mandatory ? (
                        <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-1.5 py-0.2 rounded border border-red-500/20">Mandatory</span>
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-400 bg-slate-700 px-1.5 py-0.2 rounded">Optional</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">{doc.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FAQs Accordion / List */}
          {service.faqs && service.faqs.length > 0 && (
            <div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight mb-6 flex items-center gap-2">
                <HelpCircle className="w-6 h-6 text-blue-400" /> Frequently Asked Questions
              </h2>
              <div className="space-y-3">
                {service.faqs.map((faq, i) => (
                  <div key={i} className="p-5 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-1.5">
                    <div className="font-bold text-xs text-white flex items-center gap-2">
                      <span className="text-brand-400">Q.</span> {faq.question}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed pl-4">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            © 2026 Crazy Capital Technologies Pvt Ltd. All rights reserved. 🇮🇳
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-slate-300">All Services</Link>
            <Link href="/blog" className="hover:text-slate-300">Knowledge Center</Link>
            <Link href="/customer" className="hover:text-slate-300">Customer Portal</Link>
            <Link href="/partner" className="hover:text-slate-300">Partner Growth Hub</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
