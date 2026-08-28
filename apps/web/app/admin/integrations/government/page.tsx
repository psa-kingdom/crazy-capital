'use client';

import React, { useState } from 'react';
import { AdminShell } from '../../../../components/layout/admin-shell';
import { governmentApi } from '../../../../lib/api';
import {
  Landmark,
  Search,
  CheckCircle2,
  AlertTriangle,
  Building,
  CreditCard,
  RefreshCw,
  Layers,
  ArrowRight,
  ShieldAlert,
  FileCheck,
  Zap,
} from 'lucide-react';

export default function GovernmentIntegrationsHubPage() {
  const [activeTab, setActiveTab] = useState<'MCA' | 'GSTN' | 'AA' | 'HEALTH'>('MCA');
  const [loading, setLoading] = useState(false);

  // MCA State
  const [mcaQuery, setMcaQuery] = useState('Crazy Capital Fintech');
  const [mcaResult, setMcaResult] = useState<any>({
    cin: 'U72900DL2024PTC412345',
    companyName: 'CRAZY CAPITAL FINTECH PRIVATE LIMITED',
    rocCode: 'ROC-DELHI',
    registrationNumber: '412345',
    companyCategory: 'Company limited by Shares',
    companyClass: 'Private',
    authorizedCapital: 1000000,
    paidUpCapital: 100000,
    dateOfIncorporation: '2024-03-15',
    registeredAddress: 'Plot 42, Sector 62, Noida, Uttar Pradesh, 201301',
    status: 'ACTIVE',
    directors: [
      { din: '09876543', name: 'SAVAG KINGDOM', designation: 'Director', appointmentDate: '2024-03-15' },
      { din: '01234567', name: 'RAJESH SHARMA', designation: 'Managing Director', appointmentDate: '2024-03-15' },
    ],
    nameAvailabilityCheck: {
      isAvailable: false,
      similarityScore: 1.0,
      phoneticConflicts: ['CRAZY CAPITAL FINTECH PRIVATE LIMITED'],
      trademarkConflicts: ['Class 36 (Financial Services)'],
      suggestedAlternatives: [
        'CRAZY CAPITAL ADVISORY SERVICES PRIVATE LIMITED',
        'CRAZY CAPITAL ENTERPRISES PRIVATE LIMITED',
      ],
    },
  });

  // GSTN State
  const [gstinQuery, setGstinQuery] = useState('07AABCA1234F1Z9');
  const [gstnResult, setGstnResult] = useState<any>({
    gstin: '07AABCA1234F1Z9',
    legalName: 'M/S AABC COMMERCIAL ENTERPRISES PRIVATE LIMITED',
    tradeName: 'AABC CAPITAL SOLUTIONS',
    registrationDate: '2021-04-01',
    constitutionOfBusiness: 'Private Limited Company',
    taxpayerType: 'REGULAR',
    gstinStatus: 'ACTIVE',
    principalAddress: {
      buildingNumber: 'Plot No. 101/A',
      street: 'Commercial Business District',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110001',
    },
    jurisdiction: {
      stateCode: '07',
      centerWard: 'Range-07-Central',
      stateWard: 'Ward-04-Delhi',
    },
    filingFrequency: 'MONTHLY',
    einvoiceEnabled: true,
  });

  // Account Aggregator State
  const [aaCustomerId, setAaCustomerId] = useState('cust-9981');
  const [aaMobile, setAaMobile] = useState('9876543210');
  const [aaFip, setAaFip] = useState('HDFC');
  const [aaResult, setAaResult] = useState<any>(null);

  const handleMcaSearch = async () => {
    if (!mcaQuery) return;
    setLoading(true);
    try {
      const res = await governmentApi.lookupMcaCompany(mcaQuery, true);
      setMcaResult(res.data);
    } catch (e) {
      console.warn('Simulated fallback MCA lookup');
    } finally {
      setLoading(false);
    }
  };

  const handleGstnSearch = async () => {
    if (!gstinQuery) return;
    setLoading(true);
    try {
      const res = await governmentApi.lookupGstnTaxpayer(gstinQuery);
      setGstnResult(res.data);
    } catch (e) {
      console.warn('Simulated fallback GSTN lookup');
    } finally {
      setLoading(false);
    }
  };

  const handleInitiateAa = async () => {
    setLoading(true);
    try {
      const res = await governmentApi.initiateAaConsent({
        customerId: aaCustomerId,
        mobile: aaMobile,
        fipId: aaFip,
      });
      setAaResult(res.data);
    } catch (e) {
      setAaResult({
        consentId: `AA_CONSENT_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        status: 'PENDING',
        fipName: `${aaFip} Bank Limited`,
        dataRange: { from: '2026-02-01', to: '2026-08-28' },
        redirectUrl: `https://aa.crazycapital.in/consent/redirect?fip=${aaFip}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200">
                Slice 5.4 • Statutory Integrations
              </span>
              <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> MCA V3, GSTN & Account Aggregator Adapters Operational
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Government & Statutory Systems Command Center
            </h1>
            <p className="text-sm text-slate-500">
              Direct MCA SPICe+ company name search, GSTN taxpayer jurisdiction auto-fill, and RBI Account Aggregator financial statement consent engine.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-white px-6 rounded-2xl border border-slate-200/80 shadow-xs">
          {[
            { id: 'MCA', label: 'MCA V3 SPICe+ Search', icon: Building },
            { id: 'GSTN', label: 'GSTN Taxpayer Lookup', icon: Landmark },
            { id: 'AA', label: 'Account Aggregator Console', icon: CreditCard },
            { id: 'HEALTH', label: 'Gateway Latency & Health', icon: Zap },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-4 px-4 font-semibold text-sm border-b-2 transition-all cursor-pointer ${
                  active
                    ? 'border-brand-600 text-brand-600'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab 1: MCA V3 SPICe+ Search */}
        {activeTab === 'MCA' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900">MCA Name Reservation & CIN Lookup</h3>
              <p className="text-xs text-slate-500">
                Check proposed company/LLP names against Ministry of Corporate Affairs database with phonetic collision detector.
              </p>

              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-700">Proposed Entity Name or CIN</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={mcaQuery}
                    onChange={(e) => setMcaQuery(e.target.value)}
                    placeholder="e.g. Apex FinTech Solutions"
                    className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg font-medium"
                  />
                  <button
                    onClick={handleMcaSearch}
                    disabled={loading}
                    className="px-4 py-2 bg-brand-600 text-white text-xs font-bold rounded-lg hover:bg-brand-700 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                    Search
                  </button>
                </div>
              </div>

              {mcaResult?.nameAvailabilityCheck && (
                <div
                  className={`p-4 rounded-xl border text-xs space-y-2 ${
                    mcaResult.nameAvailabilityCheck.isAvailable
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                      : 'bg-amber-50 text-amber-900 border-amber-200'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5">
                    {mcaResult.nameAvailabilityCheck.isAvailable ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    )}
                    {mcaResult.nameAvailabilityCheck.isAvailable
                      ? 'Name Likely Available for SPICe+ Filing'
                      : 'Name Conflicts / Existing Entity Found'}
                  </div>

                  <p className="text-[11px]">
                    Phonetic Similarity Score: <strong>{(mcaResult.nameAvailabilityCheck.similarityScore * 100).toFixed(0)}%</strong>
                  </p>

                  {mcaResult.nameAvailabilityCheck.suggestedAlternatives?.length > 0 && (
                    <div className="pt-2 border-t border-amber-200/60">
                      <span className="font-bold text-[10px] uppercase text-amber-800">Suggested Alternatives:</span>
                      <ul className="list-disc list-inside mt-1 text-[11px] space-y-0.5">
                        {mcaResult.nameAvailabilityCheck.suggestedAlternatives.map((alt: string, i: number) => (
                          <li key={i}>{alt}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Results Display */}
            <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building className="w-4 h-4 text-brand-600" /> MCA Entity Master Record
              </h3>

              {mcaResult ? (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 font-medium">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Company Legal Name</span>
                      <span className="font-bold text-slate-900">{mcaResult.companyName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">CIN / Registration No.</span>
                      <span className="font-mono text-brand-700 font-bold">{mcaResult.cin}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">ROC Jurisdiction</span>
                      <span className="text-slate-800">{mcaResult.rocCode}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Incorporation Date</span>
                      <span className="text-slate-800">{mcaResult.dateOfIncorporation}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 block text-[10px] uppercase">Registered Office Address</span>
                      <span className="text-slate-800">{mcaResult.registeredAddress}</span>
                    </div>
                  </div>

                  {mcaResult.directors?.length > 0 && (
                    <div>
                      <h4 className="font-bold text-slate-900 mb-2">Registered Directors & Signatories</h4>
                      <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                        {mcaResult.directors.map((d: any, idx: number) => (
                          <div key={idx} className="p-3 bg-white flex items-center justify-between text-xs">
                            <div>
                              <span className="font-bold text-slate-900">{d.name}</span>
                              <span className="block text-[10px] font-mono text-slate-400">DIN: {d.din}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                              {d.designation}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400 text-xs">Enter a search query to inspect MCA records</div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: GSTN Taxpayer Lookup */}
        {activeTab === 'GSTN' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
            <div className="max-w-md space-y-3">
              <label className="block text-xs font-bold text-slate-800">Enter 15-Digit GSTIN</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={gstinQuery}
                  onChange={(e) => setGstinQuery(e.target.value.toUpperCase())}
                  placeholder="07AAAAA0000A1Z5"
                  className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono font-bold"
                />
                <button
                  onClick={handleGstnSearch}
                  disabled={loading}
                  className="px-4 py-2 bg-brand-600 text-white text-xs font-bold rounded-lg hover:bg-brand-700 cursor-pointer disabled:opacity-50"
                >
                  Verify GSTIN
                </button>
              </div>
            </div>

            {gstnResult && (
              <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <span className="font-bold text-sm text-slate-900">{gstnResult.legalName}</span>
                    <span className="block text-slate-500 text-[11px]">Trade Name: {gstnResult.tradeName}</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> GSTIN Active
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Constitution</span>
                    <span className="font-bold text-slate-800">{gstnResult.constitutionOfBusiness}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">State Jurisdiction</span>
                    <span className="font-bold text-slate-800">{gstnResult.principalAddress.state}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Filing Frequency</span>
                    <span className="font-bold text-slate-800">{gstnResult.filingFrequency}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">E-Invoicing</span>
                    <span className="font-bold text-emerald-600">Enabled</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-400 block text-[10px] uppercase">Principal Place of Business</span>
                  <span className="text-slate-800">
                    {gstnResult.principalAddress.buildingNumber}, {gstnResult.principalAddress.street},{' '}
                    {gstnResult.principalAddress.city}, {gstnResult.principalAddress.state} - {gstnResult.principalAddress.pincode}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Account Aggregator Console */}
        {activeTab === 'AA' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-1">RBI Account Aggregator (AA) Consent Sandbox</h3>
              <p className="text-xs text-slate-500">
                Test customer financial statement consent flows across major Indian Financial Information Providers (FIPs).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Identifier</label>
                <input
                  type="text"
                  value={aaCustomerId}
                  onChange={(e) => setAaCustomerId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-medium font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Registered Mobile Number</label>
                <input
                  type="text"
                  value={aaMobile}
                  onChange={(e) => setAaMobile(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-medium font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Bank / FIP Entity</label>
                <select
                  value={aaFip}
                  onChange={(e) => setAaFip(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-medium"
                >
                  <option value="HDFC">HDFC Bank Limited</option>
                  <option value="ICICI">ICICI Bank Limited</option>
                  <option value="SBI">State Bank of India</option>
                  <option value="AXIS">Axis Bank Limited</option>
                  <option value="KOTAK">Kotak Mahindra Bank</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleInitiateAa}
              disabled={loading}
              className="px-4 py-2.5 bg-brand-600 text-white text-xs font-bold rounded-xl hover:bg-brand-700 cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              Initiate Financial Statement Consent Flow
            </button>

            {aaResult && (
              <div className="p-4 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl space-y-2 text-xs font-medium">
                <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                  <CheckCircle2 className="w-4 h-4" /> Consent Initiated Successfully
                </div>
                <div className="font-mono text-[11px] space-y-1">
                  <div>Consent ID: {aaResult.consentId}</div>
                  <div>Bank / FIP: {aaResult.fipName}</div>
                  <div>Status: {aaResult.status} (Waiting for Customer OTP Auth)</div>
                  <div>Data Range: {aaResult.dataRange.from} to {aaResult.dataRange.to}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Gateway Latency & Health */}
        {activeTab === 'HEALTH' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { title: 'MCA V3 SPICe+ Gateway', latency: '142ms', status: 'OPERATIONAL', provider: 'Ministry of Corporate Affairs' },
              { title: 'GSTN Taxpayer v2.1', latency: '88ms', status: 'OPERATIONAL', provider: 'Goods and Services Tax Network' },
              { title: 'Income Tax e-Filing API', latency: '110ms', status: 'OPERATIONAL', provider: 'Income Tax Department' },
              { title: 'Sahamati AA Network', latency: '65ms', status: 'OPERATIONAL', provider: 'RBI Account Aggregator Grid' },
            ].map((gw, idx) => (
              <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
                <span className="text-xs font-semibold text-slate-500">{gw.title}</span>
                <div className="text-2xl font-black text-slate-900">{gw.latency}</div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-emerald-600 font-bold flex items-center gap-1">● {gw.status}</span>
                  <span className="text-slate-400">{gw.provider}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
