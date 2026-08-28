'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Code2,
  Terminal,
  Key,
  Webhook,
  ShieldCheck,
  Zap,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  BookOpen,
  Send,
  Layers,
} from 'lucide-react';

export default function DeveloperPortalPage() {
  const [selectedLang, setSelectedLang] = useState<'curl' | 'node' | 'python'>('curl');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const codeSnippets = {
    curl: `curl -X POST https://api.crazycapital.in/api/v1/leads \\
  -H "Authorization: Bearer cc_live_9a8f23b1c04d5e6f" \\
  -H "Content-Type: application/json" \\
  -d '{
    "firstName": "Aditya",
    "lastName": "Sharma",
    "mobile": "9876543210",
    "email": "aditya@sharmaenterprises.in",
    "companyName": "Sharma Tech Solutions Pvt Ltd",
    "sourceCode": "API_INTEGRATION"
  }'`,
    node: `import axios from 'axios';

const response = await axios.post(
  'https://api.crazycapital.in/api/v1/leads',
  {
    firstName: 'Aditya',
    lastName: 'Sharma',
    mobile: '9876543210',
    email: 'aditya@sharmaenterprises.in',
    companyName: 'Sharma Tech Solutions Pvt Ltd',
    sourceCode: 'API_INTEGRATION',
  },
  {
    headers: {
      Authorization: 'Bearer cc_live_9a8f23b1c04d5e6f',
      'Content-Type': 'application/json',
    },
  }
);

console.log('Lead Created:', response.data);`,
    python: `import requests

url = "https://api.crazycapital.in/api/v1/leads"
headers = {
    "Authorization": "Bearer cc_live_9a8f23b1c04d5e6f",
    "Content-Type": "application/json"
}
payload = {
    "firstName": "Aditya",
    "lastName": "Sharma",
    "mobile": "9876543210",
    "email": "aditya@sharmaenterprises.in",
    "companyName": "Sharma Tech Solutions Pvt Ltd",
    "sourceCode": "API_INTEGRATION"
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`,
  };

  const webhookVerifySnippet = `import crypto from 'crypto';

function verifyCrazyCapitalWebhook(rawBody, signatureHeader, secret) {
  // signatureHeader format: "t=1724500000,v1=abcdef012345..."
  const parts = Object.fromEntries(
    signatureHeader.split(',').map((p) => p.split('='))
  );
  
  const timestamp = parts.t;
  const signature = parts.v1;
  
  // Recompute HMAC-SHA256 signature
  const expected = crypto
    .createHmac('sha256', secret)
    .update(\`\${timestamp}.\${rawBody}\`)
    .digest('hex');
    
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-brand-500 selection:text-white">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center font-bold text-white text-sm">
                CC
              </div>
              <span className="font-extrabold text-lg tracking-tight text-white">
                Crazy Capital <span className="text-brand-400 font-mono text-xs">/dev</span>
              </span>
            </Link>
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-brand-950 text-brand-400 border border-brand-800">
              API v1.0 • REST & Webhooks
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/settings/developer-api"
              className="px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all shadow-md shadow-brand-600/30 flex items-center gap-1.5"
            >
              <Key className="w-3.5 h-3.5" /> Manage API Keys
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-brand-400 font-mono">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> High-Performance Financial Infrastructure API
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              Build with India's Modern Financial Services OS
            </h1>
            <p className="text-base text-slate-400 leading-relaxed max-w-2xl">
              Programmatically create leads, trigger compliance workflows, verify statutory identities (MCA, GSTN, PAN), and listen to real-time events via secure HMAC-SHA256 webhooks.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <a
                href="#endpoints"
                className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-lg shadow-brand-600/25 transition-all flex items-center gap-2"
              >
                <BookOpen className="w-4 h-4" /> Explore Endpoints
              </a>
              <a
                href="#webhooks"
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-bold text-sm transition-all flex items-center gap-2"
              >
                <Webhook className="w-4 h-4" /> Webhook Guide
              </a>
            </div>
          </div>

          {/* Quick API Snippet Box */}
          <div className="lg:col-span-5 bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="font-mono text-xs text-slate-300 font-bold">Quickstart Request</span>
              </div>
              <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px] font-mono">
                {(['curl', 'node', 'python'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setSelectedLang(lang)}
                    className={`px-2.5 py-1 rounded cursor-pointer ${
                      selectedLang === lang ? 'bg-brand-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <pre className="p-4 bg-slate-950 rounded-xl text-xs font-mono text-slate-200 overflow-x-auto border border-slate-800/80 leading-relaxed">
                <code>{codeSnippets[selectedLang]}</code>
              </pre>
              <button
                onClick={() => handleCopy(codeSnippets[selectedLang], 'quickstart')}
                className="absolute top-2 right-2 p-1.5 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 cursor-pointer"
              >
                {copiedSection === 'quickstart' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Endpoints Reference Grid */}
      <section id="endpoints" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 border-t border-slate-900">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Core REST Endpoints</h2>
          <p className="text-xs text-slate-400 mt-1">All requests require Bearer token authentication in the Authorization header.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { method: 'POST', path: '/api/v1/leads', scope: 'leads:write', desc: 'Create CRM lead with automated 5-factor AI lead scoring' },
            { method: 'GET', path: '/api/v1/applications', scope: 'applications:read', desc: 'Query active application statuses, stage SLAs, and requirements' },
            { method: 'POST', path: '/api/v1/documents/upload-url', scope: 'documents:write', desc: 'Generate presigned Cloudflare R2 upload URL for KYC vault' },
            { method: 'GET', path: '/api/v1/integrations/government/mca/company-lookup', scope: 'system:view', desc: 'Search MCA V3 registry & check SPICe+ name availability' },
            { method: 'GET', path: '/api/v1/integrations/government/gstn/lookup/:gstin', scope: 'system:view', desc: 'Query GSTN taxpayer principal address, filing status & trade name' },
            { method: 'POST', path: '/api/v1/integrations/government/account-aggregator/consent', scope: 'system:manage', desc: 'Initiate RBI Account Aggregator consent for financial statements' },
          ].map((ep, idx) => (
            <div key={idx} className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 hover:border-slate-700 transition-all space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded ${
                      ep.method === 'POST'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-sky-950 text-sky-400 border border-sky-800'
                    }`}
                  >
                    {ep.method}
                  </span>
                  <span className="font-mono text-xs font-bold text-white">{ep.path}</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                  {ep.scope}
                </span>
              </div>
              <p className="text-xs text-slate-400">{ep.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Webhooks Architecture & HMAC Verification */}
      <section id="webhooks" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 border-t border-slate-900">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Webhook className="w-6 h-6 text-brand-400" /> Outbound Webhooks & HMAC Signing
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Crazy Capital sends HMAC-SHA256 signed payloads on every key lifecycle event. Verify every payload using your signing secret.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-200">Supported Webhook Events</h3>
            <div className="space-y-2 text-xs">
              {[
                { event: 'lead.created', desc: 'Triggered when a lead is captured from Web, Mobile, or API' },
                { event: 'application.stage_changed', desc: 'Triggered when a case transitions between workflow stages' },
                { event: 'payment.captured', desc: 'Triggered upon successful online payment confirmation' },
                { event: 'document.verified', desc: 'Triggered when AI OCR or human reviewer verifies a document' },
                { event: 'payout.processed', desc: 'Triggered when partner commission payout is settled' },
              ].map((ev, i) => (
                <div key={i} className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between">
                  <span className="font-mono font-bold text-brand-400">{ev.event}</span>
                  <span className="text-slate-400 text-[11px]">{ev.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200">Node.js Signature Verification</h3>
              <button
                onClick={() => handleCopy(webhookVerifySnippet, 'webhookSnippet')}
                className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 cursor-pointer font-mono"
              >
                {copiedSection === 'webhookSnippet' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                Copy Code
              </button>
            </div>
            <pre className="p-4 bg-slate-950 rounded-xl text-xs font-mono text-emerald-400 overflow-x-auto border border-slate-800/80 leading-relaxed">
              <code>{webhookVerifySnippet}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-8 text-center text-xs text-slate-600 font-mono">
        Crazy Capital Developer Ecosystem • Designed & Engineered in India 🇮🇳
      </footer>
    </div>
  );
}
