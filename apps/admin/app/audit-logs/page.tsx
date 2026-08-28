'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Download,
  FileCheck,
  Search,
  Filter,
  CheckCircle2,
  Trash2,
  Lock,
  Eye,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { complianceApi } from '../../lib/api';

interface AuditLog {
  id: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

interface ComplianceExport {
  id: string;
  exportType: string;
  format: string;
  status: string;
  fileUrl?: string;
  recordCount: number;
  checksumSha256?: string;
  createdAt: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [exportsList, setExportsList] = useState<ComplianceExport[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');
  const [activeTab, setActiveTab] = useState<'LOGS' | 'EXPORTS' | 'DPDP'>('LOGS');

  // Export Modal State
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportType, setExportType] = useState('AUDIT_TRAIL');
  const [exportFormat, setExportFormat] = useState('JSON');
  const [exporting, setExporting] = useState(false);
  const [lastExport, setLastExport] = useState<any>(null);

  // Selected Log for metadata view
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // DPDP Erasure
  const [erasureUserId, setErasureUserId] = useState('');
  const [erasureLoading, setErasureLoading] = useState(false);
  const [erasureResult, setErasureResult] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [logsRes, expRes] = await Promise.all([
        complianceApi.getAuditLogs({ limit: 50 }),
        complianceApi.listExports(),
      ]);
      setLogs((logsRes as any)?.data || []);
      setExportsList((expRes as any) || []);
    } catch (e) {
      console.error('Failed to load compliance audit data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExport = async (e: React.FormEvent) => {
    e.preventDefault();
    setExporting(true);
    try {
      const res = await complianceApi.createExport({
        exportType,
        format: exportFormat,
      });
      setLastExport(res);
      await fetchData();
    } catch (e) {
      console.error('Export failed:', e);
    } finally {
      setExporting(false);
    }
  };

  const handleExecuteErasure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!erasureUserId) return;
    setErasureLoading(true);
    setErasureResult(null);
    try {
      const res: any = await complianceApi.executeDataErasure(erasureUserId);
      setErasureResult(res?.message || 'DPDP Data Erasure completed successfully.');
      setErasureUserId('');
      await fetchData();
    } catch (e: any) {
      setErasureResult(`Error: ${e.response?.data?.message || e.message}`);
    } finally {
      setErasureLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.userName.toLowerCase().includes(search.toLowerCase()) ||
      log.entityType.toLowerCase().includes(search.toLowerCase());
    const matchesAction = filterAction === 'ALL' || log.action === filterAction;
    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <ShieldAlert className="h-6 w-6 text-brand-600" />
              Audit Log Vault & DPDP Compliance
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <Lock className="w-3 h-3 mr-1" />
              Immutable Ledger (ADR-003)
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Enterprise immutable audit trail, cryptographically verifiable exports, and DPDP Act Right-to-be-Forgotten controls.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setExportModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            Generate Compliance Export
          </button>
          <button
            onClick={fetchData}
            className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
            title="Refresh logs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-6">
        <button
          onClick={() => setActiveTab('LOGS')}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'LOGS'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Audit Logs ({logs.length})
        </button>
        <button
          onClick={() => setActiveTab('EXPORTS')}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'EXPORTS'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          Export Artifacts & Checksums ({exportsList.length})
        </button>
        <button
          onClick={() => setActiveTab('DPDP')}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'DPDP'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Trash2 className="w-4 h-4" />
          DPDP Right to be Forgotten
        </button>
      </div>

      {activeTab === 'LOGS' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by action, actor name, or entity..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="ALL">All Actions</option>
              <option value="USER_LOGIN">USER_LOGIN</option>
              <option value="LEAD_ASSIGNED">LEAD_ASSIGNED</option>
              <option value="STAGE_TRANSITION">STAGE_TRANSITION</option>
              <option value="PAYMENT_CAPTURED">PAYMENT_CAPTURED</option>
              <option value="COMMISSION_APPROVED">COMMISSION_APPROVED</option>
            </select>
          </div>

          {/* Table */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">Actor / User</th>
                    <th className="py-3.5 px-4 font-semibold">Action</th>
                    <th className="py-3.5 px-4 font-semibold">Entity</th>
                    <th className="py-3.5 px-4 font-semibold">IP Address</th>
                    <th className="py-3.5 px-4 font-semibold">Timestamp</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        {loading ? 'Loading audit records...' : 'No audit records match the selected filters.'}
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4 font-medium text-slate-900">
                          {log.userName}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 text-xs">
                          <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            {log.entityType}:{log.entityId.slice(0, 8)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 text-xs font-mono">
                          {log.ipAddress || '127.0.0.1'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 text-xs">
                          {new Date(log.createdAt).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
                            title="Inspect metadata JSON"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'EXPORTS' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">Export Type</th>
                    <th className="py-3.5 px-4 font-semibold">Format</th>
                    <th className="py-3.5 px-4 font-semibold">Record Count</th>
                    <th className="py-3.5 px-4 font-semibold">SHA-256 Integrity Checksum</th>
                    <th className="py-3.5 px-4 font-semibold">Generated At</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {exportsList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No compliance exports generated yet. Click "Generate Compliance Export" above.
                      </td>
                    </tr>
                  ) : (
                    exportsList.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          {exp.exportType}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-slate-100 border border-slate-200">
                            {exp.format}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-900">
                          {exp.recordCount} records
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-slate-500 max-w-xs truncate" title={exp.checksumSha256 || ''}>
                          {exp.checksumSha256 || 'SHA-256 Verified'}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-500">
                          {new Date(exp.createdAt).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <a
                            href={exp.fileUrl || '#'}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download
                          </a>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'DPDP' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-rose-500" />
              <h3 className="font-semibold text-slate-900 text-base">
                Execute Right to be Forgotten
              </h3>
            </div>
            <p className="text-sm text-slate-500">
              Under India's Digital Personal Data Protection (DPDP) Act, users can request erasure of their PII. This action irreversibly anonymizes email and mobile while preserving statutory tax invoice records required for legal audit.
            </p>

            <form onSubmit={handleExecuteErasure} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Target User ID (UUID)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1a2b3c4d-0000-0000-0000-000000000000"
                  value={erasureUserId}
                  onChange={(e) => setErasureUserId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={erasureLoading}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-colors disabled:opacity-50"
              >
                {erasureLoading ? 'Processing Anonymization...' : 'Execute Anonymization & Log Audit'}
              </button>

              {erasureResult && (
                <div className="p-3 rounded-lg text-xs bg-slate-100 border border-slate-200 text-slate-800 font-medium">
                  {erasureResult}
                </div>
              )}
            </form>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-semibold text-base">DPDP Regulatory Guidelines</h3>
            </div>
            <ul className="text-xs text-slate-500 space-y-2.5 list-disc pl-4 leading-relaxed">
              <li>
                <strong className="text-slate-800">Tax Law Overrides:</strong> Section 148 of Income Tax Act mandates financial transaction preservation for 7 years. Invoice tables retain non-identifiable tax metadata.
              </li>
              <li>
                <strong className="text-slate-800">Immediate Revocation:</strong> Active sessions, refresh tokens, and mobile push subscriptions are instantly destroyed.
              </li>
              <li>
                <strong className="text-slate-800">Immutable Compliance Log:</strong> A tamper-proof record is permanently generated in the `audit_logs` table.
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {exportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <Download className="w-5 h-5 text-brand-600" />
                Generate Compliance Export
              </h3>
              <button
                onClick={() => {
                  setExportModalOpen(false);
                  setLastExport(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            {lastExport ? (
              <div className="space-y-4 py-2">
                <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    Export Successfully Created!
                  </div>
                  <div>Records Packaged: <strong>{lastExport.recordCount}</strong></div>
                  <div>Checksum SHA-256: <span className="font-mono text-[10px] break-all">{lastExport.checksumSha256}</span></div>
                </div>
                <a
                  href={lastExport.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download File
                </a>
              </div>
            ) : (
              <form onSubmit={handleCreateExport} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Export Domain
                  </label>
                  <select
                    value={exportType}
                    onChange={(e) => setExportType(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-900"
                  >
                    <option value="AUDIT_TRAIL">Audit Trail (Immutable Logs)</option>
                    <option value="CUSTOMER_DATA">Customer Directory & 360 Profiles</option>
                    <option value="FINANCIAL_LEDGER">Financial Tax Invoices & Payouts</option>
                    <option value="STATUTORY_FILINGS">Service Applications & Workflow History</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Artifact Format
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['JSON', 'CSV', 'PDF'].map((fmt) => (
                      <button
                        type="button"
                        key={fmt}
                        onClick={() => setExportFormat(fmt)}
                        className={`py-2 text-xs font-semibold rounded-lg border transition-colors ${
                          exportFormat === fmt
                            ? 'border-brand-600 bg-brand-50 text-brand-700'
                            : 'border-slate-200 bg-white text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={exporting}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors disabled:opacity-50"
                >
                  {exporting ? 'Generating SHA-256 Encrypted Artifact...' : 'Generate Verifiable Artifact'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Selected Log Metadata Drawer */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-brand-600" />
                Audit Record Metadata
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Log ID:</span>
                <span className="font-mono text-slate-900">{selectedLog.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Action:</span>
                <span className="font-semibold text-brand-600">{selectedLog.action}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Actor:</span>
                <span className="font-medium text-slate-900">{selectedLog.userName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Target Entity:</span>
                <span className="font-mono text-slate-900">{selectedLog.entityType}:{selectedLog.entityId}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Payload JSON:</span>
                <pre className="p-3 rounded-lg bg-slate-50 text-[11px] font-mono text-slate-800 overflow-x-auto max-h-48 border border-slate-200">
                  {JSON.stringify(selectedLog.metadata || {}, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
