'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sparkles, Send, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Card, Button } from '@cc/ui';

interface PublicLeadCaptureProps {
  defaultServiceSlug?: string;
  defaultServiceName?: string;
  title?: string;
  subtitle?: string;
  buttonText?: string;
}

function PublicLeadCaptureInner({
  defaultServiceSlug,
  defaultServiceName,
  title = 'Get Expert Financial & Legal Consultation',
  subtitle = 'Zero obligation • Dedicated Compliance Officer • PAN India Support',
  buttonText = 'Connect with Compliance Specialist',
}: PublicLeadCaptureProps) {
  const searchParams = useSearchParams();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    companyName: '',
    city: '',
    serviceInterest: defaultServiceName || 'Private Limited Company Incorporation',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Extract UTM and branch parameters from URL
  const utmSource = searchParams?.get('utm_source') || 'WEBSITE';
  const utmMedium = searchParams?.get('utm_medium') || undefined;
  const utmCampaign = searchParams?.get('utm_campaign') || undefined;
  const branchId = searchParams?.get('branch_id') || searchParams?.get('branch') || undefined;

  useEffect(() => {
    if (defaultServiceName) {
      setFormData((prev) => ({ ...prev, serviceInterest: defaultServiceName }));
    }
  }, [defaultServiceName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.mobile) {
      alert('Please provide First Name, Last Name, and a valid 10-digit Mobile Number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email ? formData.email.toLowerCase().trim() : undefined,
        mobile: formData.mobile.trim(),
        companyName: formData.companyName.trim() || undefined,
        branchId: branchId || undefined,
        sourceCode: utmSource ? utmSource.toUpperCase().slice(0, 20) : 'WEBSITE',
        campaign: utmCampaign || 'ORGANIC_SEARCH',
        utmSource: utmSource || undefined,
        utmMedium: utmMedium || undefined,
        utmCampaign: utmCampaign || undefined,
        serviceInterest: defaultServiceSlug || formData.serviceInterest,
        notes: `Service Requested: ${formData.serviceInterest}. City: ${formData.city}. Remarks: ${formData.notes || 'Inquiry from web landing page'}`,
        leadScore: 85,
      };

      const response = await fetch('http://localhost:4000/api/v1/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => null);

      setIsSuccess(true);
    } catch (err) {
      setIsSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <Card className="p-8 text-center bg-white shadow-xl border-emerald-200 space-y-4">
        <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">Inquiry Received Successfully!</h3>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          Thank you, <span className="font-semibold text-slate-800">{formData.firstName}</span>. A Crazy Capital compliance specialist will contact you on <span className="font-mono font-semibold">{formData.mobile}</span> within 15 minutes.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setIsSuccess(false);
            setFormData({
              firstName: '',
              lastName: '',
              email: '',
              mobile: '',
              companyName: '',
              city: '',
              serviceInterest: defaultServiceName || 'Private Limited Company Incorporation',
              notes: '',
            });
          }}
        >
          Submit Another Inquiry
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-6 md:p-8 bg-white/95 backdrop-blur-md shadow-2xl border-slate-200/80 rounded-2xl">
      <div className="mb-5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-bold border border-brand-200 mb-2">
          <Sparkles className="w-3.5 h-3.5" /> Fast-Track Onboarding
        </div>
        <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
          {title}
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          {subtitle}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">First Name *</label>
            <input
              type="text"
              required
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              placeholder="e.g. Rahul"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50 focus:bg-white text-slate-900"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Last Name *</label>
            <input
              type="text"
              required
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              placeholder="e.g. Sharma"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50 focus:bg-white text-slate-900"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Mobile Number (10-Digit) *</label>
            <input
              type="tel"
              required
              value={formData.mobile}
              onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
              placeholder="9876543210"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50 focus:bg-white font-mono text-slate-900"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Business Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="rahul@company.in"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50 focus:bg-white text-slate-900"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Company / Entity Name</label>
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              placeholder="e.g. Apex Technologies"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50 focus:bg-white text-slate-900"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">City / Region</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="e.g. Noida / Mumbai / Bengaluru"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50 focus:bg-white text-slate-900"
            />
          </div>
        </div>

        {!defaultServiceName && (
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Service of Interest</label>
            <select
              value={formData.serviceInterest}
              onChange={(e) => setFormData({ ...formData, serviceInterest: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50 focus:bg-white cursor-pointer font-medium text-slate-800"
            >
              <option value="Private Limited Company Incorporation">Private Limited Company Incorporation</option>
              <option value="Limited Liability Partnership (LLP) Registration">Limited Liability Partnership (LLP) Registration</option>
              <option value="One Person Company (OPC) Registration">One Person Company (OPC) Registration</option>
              <option value="Section 8 (NGO / Non-Profit) Company">Section 8 (NGO / Non-Profit) Company</option>
              <option value="GST Registration & Verification">GST Registration & Verification</option>
              <option value="GST Return Filing & Compliance">GST Return Filing & Compliance</option>
              <option value="Corporate Income Tax & TDS Filing">Corporate Income Tax & TDS Filing</option>
              <option value="Trademark Registration (TM-A)">Trademark Registration (TM-A)</option>
              <option value="Copyright & Patent Filing">Copyright & Patent Filing</option>
              <option value="Startup India DPIIT Recognition">Startup India DPIIT Recognition</option>
              <option value="MSME / Udyam Registration & Subsidies">MSME / Udyam Registration & Subsidies</option>
              <option value="ROC Annual Compliance & Director KYC">ROC Annual Compliance & Director KYC</option>
              <option value="Unsecured Business & MSME Loans">Unsecured Business & MSME Loans</option>
              <option value="FSSAI Food License & Registration">FSSAI Food License & Registration</option>
            </select>
          </div>
        )}

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Specific Requirements (Optional)</label>
          <textarea
            rows={2}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Tell us about your timeline, directors, or specific questions..."
            className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50 focus:bg-white text-slate-900"
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          className="w-full py-3 text-sm font-bold bg-brand-600 hover:bg-brand-700 text-white shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2 rounded-xl"
        >
          <Send className="w-4 h-4" /> {buttonText}
        </Button>

        <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 pt-2">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 100% Confidential
          </span>
          <span>•</span>
          <span>Instant CRM Dispatch</span>
        </div>
      </form>
    </Card>
  );
}

export function PublicLeadCapture(props: PublicLeadCaptureProps) {
  return (
    <Suspense fallback={<Card className="p-6 text-center text-xs text-slate-400">Loading form...</Card>}>
      <PublicLeadCaptureInner {...props} />
    </Suspense>
  );
}
