'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileCheck2,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  XCircle,
  X,
  FileUp,
  ExternalLink,
} from 'lucide-react';
import { CustomerShell } from '../../../components/layout/customer-shell';
import { customerPortalApi, documentsApi } from '../../../lib/api';

export default function CustomerVaultPage() {
  const [vaultData, setVaultData] = useState<{
    documents: any[];
    missingRequirements: any[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Upload modal state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [targetAppId, setTargetAppId] = useState<string>('');
  const [targetDocTypeId, setTargetDocTypeId] = useState<string>('');
  const [targetDocName, setTargetDocName] = useState<string>('');
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fetchVault = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await customerPortalApi.getMyVault();
      setVaultData(res.data?.data || res.data || { documents: [], missingRequirements: [] });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load document vault');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVault();
  }, []);

  const handleOpenUpload = (appId: string, docTypeId: string, docName: string) => {
    setTargetAppId(appId);
    setTargetDocTypeId(docTypeId);
    setTargetDocName(docName);
    setFileToUpload(null);
    setUploadError(null);
    setUploadModalOpen(true);
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileToUpload || !targetDocTypeId) {
      setUploadError('Please select a valid document file.');
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);

      await documentsApi.upload(fileToUpload, targetDocTypeId, targetAppId || undefined);
      setUploadModalOpen(false);
      setFileToUpload(null);
      await fetchVault();
    } catch (err: any) {
      setUploadError(err.response?.data?.message || 'Failed to upload document.');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (docId: string, fileName: string) => {
    try {
      const res = await documentsApi.getDownloadUrl(docId);
      const url = res.data?.data?.downloadUrl || res.data?.downloadUrl;
      if (url) {
        window.open(url, '_blank');
      } else {
        alert('Download URL could not be generated.');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to generate download URL');
    }
  };

  return (
    <CustomerShell>
      <div className="space-y-8 max-w-6xl mx-auto pb-12">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Cloudflare R2 Encrypted Vault
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-2 flex items-center gap-2">
              <FileCheck2 className="w-7 h-7 text-indigo-600" />
              Secure Document Vault
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              All compliance documents are stored with strict encryption. Direct bucket URLs are blocked and accessible solely via temporary signed URLs.
            </p>
          </div>

          <button
            onClick={fetchVault}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors self-start md:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Vault
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Missing Documents Checklist Section */}
        {(vaultData?.missingRequirements?.length || 0) > 0 && (
          <div className="bg-amber-50/60 border border-amber-200/80 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <h2 className="text-base font-bold text-amber-950">
                Action Required: {vaultData?.missingRequirements.length} Missing Mandatory Documents
              </h2>
            </div>
            <p className="text-xs text-amber-800">
              Your service filings are currently held at the document verification gate. Please upload the required documents below:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {vaultData?.missingRequirements.map((req, idx) => (
                <div
                  key={`${req.applicationId}-${req.documentTypeId}-${idx}`}
                  className="bg-white p-4 rounded-2xl border border-amber-200/60 shadow-xs flex items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-xs text-slate-900">{req.documentTypeName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      Case: {req.applicationNumber} ({req.serviceName})
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenUpload(req.applicationId, req.documentTypeId, req.documentTypeName)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors whitespace-nowrap"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Uploaded Documents Repository Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Uploaded Document Repository</h2>
              <p className="text-xs text-slate-500">History of all verified and submitted compliance files</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Document Type</th>
                  <th className="py-3.5 px-4">File Name</th>
                  <th className="py-3.5 px-4">Linked Case</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4">Uploaded At</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                      Loading vault documents...
                    </td>
                  </tr>
                ) : (vaultData?.documents?.length || 0) === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No documents uploaded yet in your vault.
                    </td>
                  </tr>
                ) : (
                  vaultData?.documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {doc.documentType.name}
                        <span className="block text-[10px] font-mono font-normal text-slate-400">
                          {doc.documentType.code}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-800 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span className="truncate max-w-[200px]">{doc.fileName}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        {doc.application ? (
                          <div>
                            <span className="font-mono font-bold text-xs text-indigo-600">
                              {doc.application.applicationNumber}
                            </span>
                            <span className="block text-[10px] text-slate-500 truncate max-w-[160px]">
                              {doc.application.serviceName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">General Master Vault</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {doc.status === 'VERIFIED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" /> VERIFIED
                          </span>
                        )}
                        {doc.status === 'PENDING_VERIFICATION' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                            <Clock className="w-3 h-3" /> IN REVIEW
                          </span>
                        )}
                        {doc.status === 'REJECTED' && (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                              <XCircle className="w-3 h-3" /> REJECTED
                            </span>
                            {doc.rejectionReason && (
                              <span className="block text-[10px] text-rose-600 truncate max-w-[140px]" title={doc.rejectionReason}>
                                {doc.rejectionReason}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {new Date(doc.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDownload(doc.id, doc.fileName)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL: Upload Document */}
        {uploadModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-indigo-600" />
                  Upload {targetDocName || 'Document'}
                </h3>
                <button
                  onClick={() => setUploadModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {uploadError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              <form onSubmit={handleFileUpload} className="space-y-4">
                <div className="p-6 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-2 hover:border-indigo-400 transition-colors">
                  <FileUp className="w-8 h-8 text-indigo-500 mx-auto" />
                  <div className="text-xs font-semibold text-slate-700">
                    {fileToUpload ? fileToUpload.name : 'Select file from your device'}
                  </div>
                  <div className="text-[10px] text-slate-400">PDF, PNG, JPEG up to 10MB</div>

                  <input
                    type="file"
                    required
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => setFileToUpload(e.target.files?.[0] || null)}
                    className="mt-2 block w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setUploadModalOpen(false)}
                    disabled={uploading}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading || !fileToUpload}
                    className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {uploading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    Upload to Secure Vault
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </CustomerShell>
  );
}
