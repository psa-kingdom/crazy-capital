'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Play,
  RotateCw,
  FileCheck,
  Layers,
  Building2,
  CreditCard,
  Hash,
} from 'lucide-react';
import { identityVerificationApi } from '../../../lib/api';

export default function AdminVerificationQueuePage() {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'QUEUE' | 'TESTER'>('QUEUE');

  // Test form state
  const [testType, setTestType] = useState<'PAN' | 'GST' | 'DIGILOCKER'>('PAN');
  const [testIdentifier, setTestIdentifier] = useState('ABCDE1234F');
  const [testName, setTestName] = useState('VIKRAM ADITYA');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const res = await identityVerificationApi.getQueue();
      const list = res.data?.data || res.data || [];
      setQueue(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load verification queue', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleTestVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setTesting(true);
    setTestResult(null);

    try {
      let res;
      if (testType === 'PAN') {
        res = await identityVerificationApi.verifyPan({ pan: testIdentifier, expectedName: testName });
      } else if (testType === 'GST') {
        res = await identityVerificationApi.verifyGst({ gstin: testIdentifier, expectedTradeName: testName });
      } else {
        res = await identityVerificationApi.verifyDigiLocker({ documentType: 'AADHAAR' });
      }
      setTestResult(res.data?.data || res.data || res);
      await fetchQueue();
    } catch (err: any) {
      setTestResult({ error: err.message });
    } finally {
      setTesting(false);
    }
  };

  const handleRetry = async (id: string) => {
    try {
      await identityVerificationApi.retryVerification(id);
      await fetchQueue();
    } catch (err) {
      console.error('Failed to retry verification', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="font-bold text-lg text-slate-100 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-black">
                CC
              </div>
              <span>Crazy Capital Admin</span>
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-sm font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              DigiLocker, PAN & GST Verification Workbench
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchQueue}
              disabled={loading}
              className="p-2 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* KPI Overview */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Total Verified</div>
            <div className="text-2xl font-black text-emerald-400">
              {queue.filter((q) => q.verificationStatus === 'VERIFIED').length}
            </div>
            <p className="text-xs text-slate-500 mt-1">PAN, GST & DigiLocker</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">DigiLocker Records</div>
            <div className="text-2xl font-black text-blue-400">
              {queue.filter((q) => q.verificationType === 'DIGILOCKER').length}
            </div>
            <p className="text-xs text-slate-500 mt-1">Direct UIDAI/Govt consent</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">PAN Match Rate</div>
            <div className="text-2xl font-black text-amber-400">99.2%</div>
            <p className="text-xs text-amber-500/80 mt-1">NSDL / Surepass gateway</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Failed & Retries</div>
            <div className="text-2xl font-black text-red-400">
              {queue.filter((q) => q.verificationStatus === 'FAILED').length}
            </div>
            <p className="text-xs text-slate-500 mt-1">Manual review queue</p>
          </div>
        </section>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 space-x-4">
          {[
            { id: 'QUEUE', label: `Verification Audit Log (${queue.length})`, icon: ShieldCheck },
            { id: 'TESTER', label: 'Statutory Verification Simulator', icon: Play },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition ${
                  active
                    ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: AUDIT LOG QUEUE */}
        {activeTab === 'QUEUE' && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="divide-y divide-slate-800">
              {queue.length === 0 ? (
                <div className="p-8 text-center text-slate-500">No verification records logged yet.</div>
              ) : (
                queue.map((q) => (
                  <div key={q.id} className="p-5 hover:bg-slate-800/40 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100 text-sm">{q.verifiedName || 'Entity Verified'}</span>
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                          {q.identifierMasked}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {q.verificationType}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                        <span>Provider: {q.provider}</span>
                        <span>•</span>
                        <span>Score: {q.matchScore || 100}%</span>
                        <span>•</span>
                        <span>Logged: {new Date(q.createdAt).toLocaleDateString('en-IN')}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                          q.verificationStatus === 'VERIFIED'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}
                      >
                        {q.verificationStatus}
                      </span>
                      {q.verificationStatus === 'FAILED' && (
                        <button
                          onClick={() => handleRetry(q.id)}
                          className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center gap-1 transition"
                        >
                          <RotateCw className="w-3 h-3" /> Retry
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 2: LIVE SIMULATOR */}
        {activeTab === 'TESTER' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-6 bg-slate-900/70 border border-slate-800 p-6 rounded-2xl">
              <h3 className="text-base font-bold text-slate-100 mb-4 flex items-center gap-2">
                <Play className="w-5 h-5 text-amber-400" />
                Live Statutory API Verification Tester
              </h3>
              <form onSubmit={handleTestVerification} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Verification Gateway</label>
                  <select
                    value={testType}
                    onChange={(e) => {
                      const t = e.target.value as any;
                      setTestType(t);
                      if (t === 'PAN') setTestIdentifier('ABCDE1234F');
                      else if (t === 'GST') setTestIdentifier('09AAACC1206D1ZH');
                      else setTestIdentifier('AADHAAR');
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none"
                  >
                    <option value="PAN">PAN Verification (Income Tax / NSDL / Surepass)</option>
                    <option value="GST">GSTIN Verification (GSTN / State Decoding)</option>
                    <option value="DIGILOCKER">DigiLocker Consent & Aadhaar Extraction</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Identifier / Number</label>
                  <input
                    type="text"
                    required
                    value={testIdentifier}
                    onChange={(e) => setTestIdentifier(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Expected Match Name</label>
                  <input
                    type="text"
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={testing}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition disabled:opacity-50"
                >
                  {testing ? 'Verifying against Gateway...' : 'Execute Live Verification'}
                </button>
              </form>
            </div>

            {/* Test Result Inspector */}
            <div className="lg:col-span-6 bg-slate-900/70 border border-slate-800 p-6 rounded-2xl">
              <h3 className="text-base font-bold text-slate-100 mb-4 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-400" />
                Gateway Response Payload
              </h3>
              {!testResult ? (
                <div className="p-12 text-center text-slate-500 text-xs">Run a test to inspect the sanitized JSON payload.</div>
              ) : (
                <pre className="p-4 rounded-xl bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto border border-slate-800">
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
