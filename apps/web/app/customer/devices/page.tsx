'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { mobileApi } from '../../../lib/api';
import {
  Smartphone,
  ShieldCheck,
  Bell,
  Trash2,
  Plus,
  CheckCircle2,
  Fingerprint,
  RefreshCw,
  ArrowLeft,
  Key,
} from 'lucide-react';

export default function CustomerDevicesPage() {
  const [devices, setDevices] = useState<any[]>([
    {
      id: 'dev-1',
      deviceModel: 'Apple iPhone 15 Pro',
      platform: 'IOS',
      osVersion: 'iOS 18.1',
      appVersion: '1.5.0',
      biometricEnabled: true,
      isActive: true,
      lastActiveAt: '2026-08-28T20:10:00Z',
    },
    {
      id: 'dev-2',
      deviceModel: 'Samsung Galaxy S24 Ultra',
      platform: 'ANDROID',
      osVersion: 'Android 15',
      appVersion: '1.4.2',
      biometricEnabled: true,
      isActive: true,
      lastActiveAt: '2026-08-27T11:30:00Z',
    },
  ]);

  const [leadAlerts, setLeadAlerts] = useState(true);
  const [statusUpdates, setStatusUpdates] = useState(true);
  const [marketing, setMarketing] = useState(false);
  const [savedPrefs, setSavedPrefs] = useState(false);

  const handleRevoke = (id: string) => {
    setDevices(devices.filter((d) => d.id !== id));
  };

  const handleSavePrefs = () => {
    setSavedPrefs(true);
    setTimeout(() => setSavedPrefs(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/customer" className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-brand-600">
            <ArrowLeft className="w-4 h-4" /> Back to Customer Portal
          </Link>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200">
            Slice 5.1 • Mobile Device Management
          </span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Smartphone className="w-6 h-6 text-brand-600" /> Active Mobile Devices & Push Preferences
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Manage your registered mobile smartphones, FaceID/Biometric credentials, and push notifications.
            </p>
          </div>

          {/* Devices List */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-800">Trusted Mobile Devices</h2>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {devices.map((device) => (
                <div key={device.id} className="p-4 bg-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{device.deviceModel}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {device.platform}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {device.osVersion} • App v{device.appVersion} • Last active {new Date(device.lastActiveAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {device.biometricEnabled && (
                      <span className="hidden sm:flex items-center gap-1 text-[11px] text-brand-700 font-bold bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-200">
                        <Fingerprint className="w-3.5 h-3.5" /> Biometrics Active
                      </span>
                    )}
                    <button
                      onClick={() => handleRevoke(device.id)}
                      className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 cursor-pointer transition-colors"
                      title="Revoke Device"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Push Notification Preferences */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Bell className="w-4 h-4 text-brand-600" /> Push Notification Preferences
            </h2>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <div>
                  <span className="block text-xs font-bold text-slate-800">Case & Application Stage Alerts</span>
                  <span className="block text-[11px] text-slate-500">Receive real-time push alerts on MCA/GST filings</span>
                </div>
                <input
                  type="checkbox"
                  checked={statusUpdates}
                  onChange={(e) => setStatusUpdates(e.target.checked)}
                  className="rounded text-brand-600 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <div>
                  <span className="block text-xs font-bold text-slate-800">Direct Compliance Reminders</span>
                  <span className="block text-[11px] text-slate-500">Alerts for pending KYC document re-uploads</span>
                </div>
                <input
                  type="checkbox"
                  checked={leadAlerts}
                  onChange={(e) => setLeadAlerts(e.target.checked)}
                  className="rounded text-brand-600 w-4 h-4"
                />
              </label>
            </div>

            <div className="flex items-center justify-between pt-2">
              {savedPrefs ? (
                <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Preferences saved!
                </span>
              ) : (
                <span></span>
              )}
              <button
                onClick={handleSavePrefs}
                className="px-4 py-2 bg-brand-600 text-white text-xs font-bold rounded-xl hover:bg-brand-700 cursor-pointer"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
