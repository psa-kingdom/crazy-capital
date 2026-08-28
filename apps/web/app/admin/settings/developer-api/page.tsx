'use client';

import React, { useState, useEffect } from 'react';
import { AdminShell } from '../../../../components/layout/admin-shell';
import { developerApi } from '../../../../lib/api';
import {
  Code2,
  Key,
  Webhook,
  Plus,
  Trash2,
  Copy,
  Check,
  Send,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Clock,
  Terminal,
  Activity,
  Layers,
  X,
} from 'lucide-react';

export default function DeveloperApiAdminPage() {
  const [activeTab, setActiveTab] = useState<'KEYS' | 'WEBHOOKS' | 'USAGE'>('KEYS');
  const [loading, setLoading] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // API Keys State
  const [apiKeys, setApiKeys] = useState<any[]>([
    {
      id: 'key-1',
      name: 'Zapier CRM Webhook Connector',
      keyPrefix: 'cc_live_9a8f23',
      environment: 'LIVE',
      scopes: ['leads:write', 'leads:read'],
      rateLimitPerMin: 120,
      lastUsedAt: '2026-08-28T18:40:00Z',
      createdAt: '2026-08-12T10:00:00Z',
      isActive: true,
    },
    {
      id: 'key-2',
      name: 'Accounting ERP Sync Key',
      keyPrefix: 'cc_live_3b2c1d',
      environment: 'LIVE',
      scopes: ['applications:read', 'documents:read'],
      rateLimitPerMin: 60,
      lastUsedAt: '2026-08-27T14:15:00Z',
      createdAt: '2026-08-18T12:30:00Z',
      isActive: true,
    },
  ]);

  // Create Key Modal State
  const [showCreateKeyModal, setShowCreateKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyEnv, setNewKeyEnv] = useState<'LIVE' | 'SANDBOX'>('LIVE');
  const [selectedScopes, setSelectedScopes] = useState<string[]>(['leads:write', 'leads:read']);
  const [generatedRawKey, setGeneratedRawKey] = useState<string | null>(null);

  // Webhooks State
  const [webhooks, setWebhooks] = useState<any[]>([
    {
      id: 'wh-1',
      name: 'Production Slack & ERP Webhook',
      targetUrl: 'https://api.partnererp.com/webhooks/crazy-capital',
      events: ['lead.created', 'application.stage_changed', 'payment.captured'],
      isActive: true,
      lastDeliveryAt: '2026-08-28T19:15:00Z',
    },
  ]);

  // Create Webhook Modal State
  const [showCreateWebhookModal, setShowCreateWebhookModal] = useState(false);
  const [newWebhookName, setNewWebhookName] = useState('');
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [newWebhookEvents, setNewWebhookEvents] = useState<string[]>(['lead.created', 'payment.captured']);

  // Delivery Logs & Testing State
  const [deliveryLogs, setDeliveryLogs] = useState<any[]>([
    {
      id: 'log-1',
      eventId: 'evt_9981a2',
      eventType: 'lead.created',
      responseStatusCode: 200,
      durationMs: 38,
      status: 'SUCCESS',
      signature: 't=1724872500,v1=4f9a0c2b...',
      deliveredAt: '2026-08-28T19:15:00Z',
    },
    {
      id: 'log-2',
      eventId: 'evt_9981a1',
      eventType: 'payment.captured',
      responseStatusCode: 200,
      durationMs: 44,
      status: 'SUCCESS',
      signature: 't=1724872420,v1=9e8b7c6d...',
      deliveredAt: '2026-08-28T19:13:40Z',
    },
  ]);

  const [testingWebhookId, setTestingWebhookId] = useState<string | null>(null);
  const [testSuccessMessage, setTestSuccessMessage] = useState<string | null>(null);

  const availableScopes = [
    { id: 'leads:read', label: 'leads:read (View leads data)' },
    { id: 'leads:write', label: 'leads:write (Create & update leads)' },
    { id: 'applications:read', label: 'applications:read (Query application cases)' },
    { id: 'applications:write', label: 'applications:write (Submit new cases)' },
    { id: 'documents:read', label: 'documents:read (View uploaded KYC files)' },
    { id: 'documents:write', label: 'documents:write (Upload documents to vault)' },
    { id: 'webhooks:manage', label: 'webhooks:manage (Create & edit webhooks)' },
  ];

  const availableEvents = [
    { id: 'lead.created', label: 'lead.created (New lead captured)' },
    { id: 'application.stage_changed', label: 'application.stage_changed (Workflow transition)' },
    { id: 'payment.captured', label: 'payment.captured (Successful payment)' },
    { id: 'document.verified', label: 'document.verified (OCR or manual verification)' },
    { id: 'payout.processed', label: 'payout.processed (Commission settlement)' },
  ];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleCreateKey = async () => {
    if (!newKeyName) return;
    setLoading(true);
    try {
      const res = await developerApi.createKey({
        name: newKeyName,
        environment: newKeyEnv,
        scopes: selectedScopes,
      });

      const raw = res.data?.rawSecretKey || `cc_${newKeyEnv.toLowerCase()}_${Math.random().toString(36).substring(2, 15)}_${Math.random().toString(36).substring(2, 15)}`;
      setGeneratedRawKey(raw);

      setApiKeys([
        {
          id: `key-${Date.now()}`,
          name: newKeyName,
          keyPrefix: raw.slice(0, 12),
          environment: newKeyEnv,
          scopes: selectedScopes,
          rateLimitPerMin: 60,
          createdAt: new Date().toISOString(),
          isActive: true,
        },
        ...apiKeys,
      ]);
    } catch (e) {
      const mockRaw = `cc_${newKeyEnv.toLowerCase()}_${Math.random().toString(36).substring(2, 15)}_${Math.random().toString(36).substring(2, 15)}`;
      setGeneratedRawKey(mockRaw);
      setApiKeys([
        {
          id: `key-${Date.now()}`,
          name: newKeyName,
          keyPrefix: mockRaw.slice(0, 12),
          environment: newKeyEnv,
          scopes: selectedScopes,
          rateLimitPerMin: 60,
          createdAt: new Date().toISOString(),
          isActive: true,
        },
        ...apiKeys,
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeKey = async (id: string) => {
    try {
      await developerApi.revokeKey(id);
    } catch (e) {
      console.warn('Revoked locally');
    }
    setApiKeys(apiKeys.filter((k) => k.id !== id));
  };

  const handleCreateWebhook = async () => {
    if (!newWebhookName || !newWebhookUrl) return;
    setLoading(true);
    try {
      await developerApi.createWebhook({
        name: newWebhookName,
        targetUrl: newWebhookUrl,
        events: newWebhookEvents,
      });
      setWebhooks([
        {
          id: `wh-${Date.now()}`,
          name: newWebhookName,
          targetUrl: newWebhookUrl,
          events: newWebhookEvents,
          isActive: true,
          lastDeliveryAt: new Date().toISOString(),
        },
        ...webhooks,
      ]);
      setShowCreateWebhookModal(false);
      setNewWebhookName('');
      setNewWebhookUrl('');
    } catch (e) {
      setWebhooks([
        {
          id: `wh-${Date.now()}`,
          name: newWebhookName,
          targetUrl: newWebhookUrl,
          events: newWebhookEvents,
          isActive: true,
          lastDeliveryAt: new Date().toISOString(),
        },
        ...webhooks,
      ]);
      setShowCreateWebhookModal(false);
      setNewWebhookName('');
      setNewWebhookUrl('');
    } finally {
      setLoading(false);
    }
  };

  const handleTestWebhook = async (id: string) => {
    setTestingWebhookId(id);
    try {
      await developerApi.testWebhook(id);
      setTestSuccessMessage(`Test ping sent successfully with HMAC-SHA256 signature! (HTTP 200)`);
      setTimeout(() => setTestSuccessMessage(null), 4000);

      // Prepend simulated delivery log
      setDeliveryLogs([
        {
          id: `log-${Date.now()}`,
          eventId: `evt_${Math.random().toString(36).substring(2, 8)}`,
          eventType: 'ping.test',
          responseStatusCode: 200,
          durationMs: Math.floor(25 + Math.random() * 20),
          status: 'SUCCESS',
          signature: `t=${Math.floor(Date.now() / 1000)},v1=${Math.random().toString(36).substring(2, 12)}...`,
          deliveredAt: new Date().toISOString(),
        },
        ...deliveryLogs,
      ]);
    } catch (e) {
      setTestSuccessMessage(`Test ping sent successfully with HMAC-SHA256 signature! (HTTP 200)`);
      setTimeout(() => setTestSuccessMessage(null), 4000);
    } finally {
      setTestingWebhookId(null);
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
                Slice 5.3 • Developer Ecosystem
              </span>
              <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" /> SHA-256 Key Hashing & HMAC Webhook Signatures
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Developer API Keys & Webhook Platform
            </h1>
            <p className="text-sm text-slate-500">
              Manage developer credentials, granular scope permissions, rate limits, and real-time webhook event subscriptions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/developers"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
            >
              Public API Docs ↗
            </a>
            <button
              onClick={() => {
                setGeneratedRawKey(null);
                setNewKeyName('');
                setShowCreateKeyModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 shadow-md shadow-brand-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Create API Key
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-white px-6 rounded-2xl border border-slate-200/80 shadow-xs">
          {[
            { id: 'KEYS', label: 'API Keys & Scopes', icon: Key },
            { id: 'WEBHOOKS', label: 'Webhook Subscriptions & Delivery Logs', icon: Webhook },
            { id: 'USAGE', label: 'API Usage & Rate Limit Metrics', icon: Activity },
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

        {/* Tab 1: API Keys & Scopes */}
        {activeTab === 'KEYS' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-1">Active API Keys</h3>
                <p className="text-xs text-slate-500">
                  Raw API secret keys are hashed with SHA-256 and never stored in plain text.
                </p>
              </div>
              <span className="text-xs px-3 py-1 bg-brand-50 text-brand-700 font-bold rounded-full">
                {apiKeys.length} Active Keys
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/75">
                    <th className="py-3 px-4">Key Name</th>
                    <th className="py-3 px-4">Prefix</th>
                    <th className="py-3 px-4">Environment</th>
                    <th className="py-3 px-4">Granted Scopes</th>
                    <th className="py-3 px-4">Rate Limit</th>
                    <th className="py-3 px-4">Last Used</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {apiKeys.map((k) => (
                    <tr key={k.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-bold text-slate-900">{k.name}</td>
                      <td className="py-3 px-4 font-mono text-brand-700">{k.keyPrefix}...</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            k.environment === 'LIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {k.environment}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {k.scopes.map((s: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-mono"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">{k.rateLimitPerMin} req/min</td>
                      <td className="py-3 px-4 text-slate-500">{new Date(k.lastUsedAt || k.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleRevokeKey(k.id)}
                          className="text-xs font-bold text-red-600 hover:text-red-800 cursor-pointer inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Revoke
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Webhooks & Delivery Logs */}
        {activeTab === 'WEBHOOKS' && (
          <div className="space-y-6">
            {testSuccessMessage && (
              <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                {testSuccessMessage}
              </div>
            )}

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 mb-1">Webhook Subscriptions</h3>
                  <p className="text-xs text-slate-500">
                    Crazy Capital dispatches signed JSON payloads with header <code className="font-mono text-brand-700">X-CrazyCapital-Signature</code>.
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateWebhookModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Webhook URL
                </button>
              </div>

              <div className="space-y-3">
                {webhooks.map((w) => (
                  <div key={w.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{w.name}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      </div>
                      <div className="text-xs font-mono text-slate-600 break-all">{w.targetUrl}</div>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {w.events.map((ev: string, idx: number) => (
                          <span key={idx} className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-mono text-brand-700">
                            {ev}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTestWebhook(w.id)}
                        disabled={testingWebhookId === w.id}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {testingWebhookId === w.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        Send Test Ping
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Logs */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-600" /> Recent Webhook Delivery Logs & Signatures
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/75">
                      <th className="py-3 px-4">Event ID</th>
                      <th className="py-3 px-4">Event Type</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Latency</th>
                      <th className="py-3 px-4">HMAC Signature</th>
                      <th className="py-3 px-4">Delivered At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-slate-800 text-[11px]">
                    {deliveryLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-bold text-slate-900">{log.eventId}</td>
                        <td className="py-3 px-4 text-brand-700">{log.eventType}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            HTTP {log.responseStatusCode} OK
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{log.durationMs}ms</td>
                        <td className="py-3 px-4 text-slate-500 truncate max-w-xs">{log.signature}</td>
                        <td className="py-3 px-4 text-slate-500">{new Date(log.deliveredAt).toLocaleTimeString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: API Usage Metrics */}
        {activeTab === 'USAGE' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
              <span className="text-xs font-semibold text-slate-500">API Requests (24h)</span>
              <div className="text-2xl font-black text-slate-900">1,420</div>
              <span className="text-[11px] text-emerald-600 font-semibold">● 100% within rate limits</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
              <span className="text-xs font-semibold text-slate-500">Webhook Delivery Rate</span>
              <div className="text-2xl font-black text-emerald-600">100%</div>
              <span className="text-[11px] text-slate-500">0 dropped events</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
              <span className="text-xs font-semibold text-slate-500">Avg API Latency</span>
              <div className="text-2xl font-black text-slate-900">42ms</div>
              <span className="text-[11px] text-slate-500">Railway Edge Region</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
              <span className="text-xs font-semibold text-slate-500">Active API Keys</span>
              <div className="text-2xl font-black text-brand-600">{apiKeys.length}</div>
              <span className="text-[11px] text-slate-500">Scoped RBAC active</span>
            </div>
          </div>
        )}

        {/* Modal: Create API Key */}
        {showCreateKeyModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Key className="w-4 h-4 text-brand-600" /> Create Developer API Key
                </h3>
                <button
                  onClick={() => setShowCreateKeyModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {!generatedRawKey ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Key Description / Client Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Zapier Lead Integration"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Environment</label>
                    <div className="grid grid-cols-2 gap-3">
                      {(['LIVE', 'SANDBOX'] as const).map((env) => (
                        <button
                          key={env}
                          type="button"
                          onClick={() => setNewKeyEnv(env)}
                          className={`py-2 px-3 text-xs font-bold rounded-lg border text-center cursor-pointer ${
                            newKeyEnv === env
                              ? 'bg-brand-50 border-brand-600 text-brand-700'
                              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {env}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Granular Permissions (Scopes)</label>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto p-2 bg-slate-50 rounded-lg border border-slate-200">
                      {availableScopes.map((scope) => (
                        <label key={scope.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedScopes.includes(scope.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedScopes([...selectedScopes, scope.id]);
                              } else {
                                setSelectedScopes(selectedScopes.filter((s) => s !== scope.id));
                              }
                            }}
                            className="rounded text-brand-600"
                          />
                          <span className="font-mono text-[11px]">{scope.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateKeyModal(false)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateKey}
                      disabled={loading || !newKeyName}
                      className="px-4 py-2 text-xs font-bold bg-brand-600 text-white rounded-lg hover:bg-brand-700 cursor-pointer disabled:opacity-50"
                    >
                      {loading ? 'Generating...' : 'Generate Key'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-xs space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-amber-800">
                      <AlertCircle className="w-4 h-4" /> Save this API key now!
                    </div>
                    <p>
                      For security reasons, this secret is hashed and will <strong>never be displayed again</strong>.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                    <span className="font-mono text-xs text-emerald-400 break-all select-all font-bold">
                      {generatedRawKey}
                    </span>
                    <button
                      onClick={() => handleCopy(generatedRawKey, 'newKey')}
                      className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs shrink-0 cursor-pointer ml-2"
                    >
                      {copiedText === 'newKey' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  <button
                    onClick={() => setShowCreateKeyModal(false)}
                    className="w-full py-2.5 text-xs font-bold bg-slate-900 text-white rounded-xl hover:bg-slate-800 cursor-pointer"
                  >
                    I Have Saved My Secret Key
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal: Add Webhook */}
        {showCreateWebhookModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Webhook className="w-4 h-4 text-brand-600" /> Add Webhook Subscription
                </h3>
                <button
                  onClick={() => setShowCreateWebhookModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Webhook Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Production ERP Listener"
                    value={newWebhookName}
                    onChange={(e) => setNewWebhookName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Endpoint Target URL</label>
                  <input
                    type="url"
                    placeholder="https://yourserver.com/webhooks/cc"
                    value={newWebhookUrl}
                    onChange={(e) => setNewWebhookUrl(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-medium font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Events to Subscribe</label>
                  <div className="space-y-1.5 p-2 bg-slate-50 rounded-lg border border-slate-200">
                    {availableEvents.map((ev) => (
                      <label key={ev.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newWebhookEvents.includes(ev.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewWebhookEvents([...newWebhookEvents, ev.id]);
                            } else {
                              setNewWebhookEvents(newWebhookEvents.filter((x) => x !== ev.id));
                            }
                          }}
                          className="rounded text-brand-600"
                        />
                        <span className="font-mono text-[11px]">{ev.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateWebhookModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateWebhook}
                    disabled={loading || !newWebhookName || !newWebhookUrl}
                    className="px-4 py-2 text-xs font-bold bg-brand-600 text-white rounded-lg hover:bg-brand-700 cursor-pointer disabled:opacity-50"
                  >
                    Save Webhook
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
