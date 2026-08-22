'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Layers,
  CheckCircle2,
  Clock,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  FileCheck2,
  Receipt,
  FileUp,
  CreditCard,
  User,
  ShieldCheck,
  XCircle,
  Upload,
  X,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { CustomerShell } from '../../../../components/layout/customer-shell';
import { customerPortalApi, documentsApi, paymentsApi } from '../../../../lib/api';
import { CustomerApplicationDetailDto } from '@cc/types';

export default function CustomerApplicationDetailPage() {
  const params = useParams();
  const applicationId = params?.id as string;

  const [detail, setDetail] = useState<CustomerApplicationDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Upload modal state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedDocTypeId, setSelectedDocTypeId] = useState<string>('');
  const [selectedDocName, setSelectedDocName] = useState<string>('');
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Payment state
  const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);

  const fetchDetail = async () => {
    if (!applicationId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await customerPortalApi.getApplicationDetail(applicationId);
      setDetail(res.data?.data || res.data || null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load application details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [applicationId]);

  const handleOpenUpload = (docTypeId: string, docName: string) => {
    setSelectedDocTypeId(docTypeId);
    setSelectedDocName(docName);
    setFileToUpload(null);
    setUploadError(null);
    setUploadModalOpen(true);
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileToUpload || !selectedDocTypeId) {
      setUploadError('Please select a file to upload.');
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);

      await documentsApi.upload(fileToUpload, selectedDocTypeId, applicationId);
      setUploadModalOpen(false);
      setFileToUpload(null);
      await fetchDetail();
    } catch (err: any) {
      setUploadError(err.response?.data?.message || 'Failed to upload document to vault.');
    } finally {
      setUploading(false);
    }
  };

  const handlePayInvoice = async (invoiceId: string) => {
    try {
      setPayingInvoiceId(invoiceId);
      const res = await paymentsApi.createOrder({ invoiceId });
      const order = res.data?.data || res.data;

      // In mock/test gateway or live checkout:
      alert(`Razorpay Order created: ${order.orderId || order.id || 'ORDER_SUCCESS'}. Initiating mock payment completion.`);
      await fetchDetail();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create payment order');
    } finally {
      setPayingInvoiceId(null);
    }
  };

  return (
    <CustomerShell>
      <div className="space-y-8 max-w-6xl mx-auto pb-12">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link href="/customer/applications" className="hover:text-slate-900 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Applications
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-mono">{detail?.applicationNumber || applicationId}</span>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-24 text-center text-slate-400 text-xs">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-600" />
            Loading application cockpit...
          </div>
        ) : !detail ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-500 text-xs">
            Application record not found.
          </div>
        ) : (
          <>
            {/* Header Cockpit Card */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-sm text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">
                      {detail.applicationNumber}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      detail.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : detail.status === 'REJECTED'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {detail.status}
                    </span>
                  </div>
                  <h1 className="text-2xl font-extrabold text-slate-900 mt-2">{detail.service.name}</h1>
                  <p className="text-xs text-slate-500">{detail.service.description}</p>
                </div>

                <button
                  onClick={fetchDetail}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors self-start md:self-auto"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  Refresh Cockpit
                </button>
              </div>

              {/* Operations Specialist & Filing Meta */}
              <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-slate-100 text-xs text-slate-600">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-semibold">Initiated Date</span>
                  <span className="font-medium">
                    {new Date(detail.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-semibold">Operations Specialist</span>
                  <span className="font-medium text-slate-800 flex items-center gap-1.5 mt-0.5">
                    <User className="w-3.5 h-3.5 text-indigo-600" />
                    {detail.assignedTo?.name || 'Crazy Capital Operations Team'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-semibold">Overall Completion</span>
                  <span className="font-bold text-indigo-600">{detail.progressPercent}%</span>
                </div>
              </div>
            </div>

            {/* Workflow Progress Stepper */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-600" />
                    Filing Lifecycle & Stage Stepper
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Sequential verification, government portal submission, and statutory approval milestones.
                  </p>
                </div>
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full">
                  Stage {detail.currentStage.stageOrder} of {detail.stages.length}
                </span>
              </div>

              {/* Visual Stepper Nodes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {detail.stages.map((stage) => {
                  const isDone = stage.isCompleted;
                  const isCurrent = stage.isCurrent;

                  return (
                    <div
                      key={stage.id}
                      className={`p-4 rounded-2xl border text-xs space-y-2 transition-all ${
                        isDone
                          ? 'bg-emerald-50/40 border-emerald-200 text-emerald-950'
                          : isCurrent
                          ? 'bg-indigo-50 border-indigo-300 shadow-xs text-indigo-950 ring-2 ring-indigo-500/20'
                          : 'bg-slate-50/50 border-slate-200 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold uppercase">
                          Step {stage.stageOrder}
                        </span>
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : isCurrent ? (
                          <Clock className="w-4 h-4 text-indigo-600 animate-pulse" />
                        ) : (
                          <div className="w-3 h-3 rounded-full border border-slate-300" />
                        )}
                      </div>

                      <div className="font-bold text-slate-900">{stage.name}</div>
                      <div className="text-[10px]">
                        {isDone ? 'Completed' : isCurrent ? 'In Processing Now' : 'Pending Previous Stages'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Document Checklist Tray */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <FileCheck2 className="w-5 h-5 text-indigo-600" />
                    Required Document Checklist
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Mandatory statutory documents required for government portal submission.
                  </p>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {detail.documents.map((doc) => {
                  const isUploaded = !!doc.uploadedDocument;
                  const isVerified = doc.uploadedDocument?.status === 'VERIFIED';
                  const isRejected = doc.uploadedDocument?.status === 'REJECTED';

                  return (
                    <div
                      key={doc.documentTypeId}
                      className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{doc.name}</span>
                          {doc.isMandatory ? (
                            <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[10px] font-bold">
                              Mandatory
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px]">
                              Optional
                            </span>
                          )}
                        </div>

                        {doc.description && (
                          <p className="text-[11px] text-slate-500">{doc.description}</p>
                        )}

                        {isUploaded && (
                          <div className="text-[11px] text-slate-600 flex items-center gap-2 font-mono mt-1">
                            <FileText className="w-3.5 h-3.5 text-slate-400" />
                            <span>{doc.uploadedDocument?.fileName}</span>
                            <span>•</span>
                            <span>
                              Uploaded {new Date(doc.uploadedDocument!.uploadedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                            </span>
                          </div>
                        )}

                        {isRejected && (
                          <div className="p-2 bg-rose-50 border border-rose-100 rounded-lg text-[11px] text-rose-800 font-medium mt-1">
                            <strong>Rejection Note:</strong> {doc.uploadedDocument?.rejectionReason || 'Document requires clear resubmission.'}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 self-start sm:self-auto">
                        {isVerified && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            VERIFIED
                          </span>
                        )}

                        {isUploaded && !isVerified && !isRejected && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                            <Clock className="w-3.5 h-3.5" />
                            PENDING VERIFICATION
                          </span>
                        )}

                        {(!isUploaded || isRejected) && (
                          <button
                            onClick={() => handleOpenUpload(doc.documentTypeId, doc.name)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            {isRejected ? 'Re-upload Document' : 'Upload Document'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Invoices & Receipts */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-blue-600" />
                    Billing & Tax Invoices
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    GST tax invoices and online payment checkout for this application.
                  </p>
                </div>
              </div>

              {detail.invoices.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs">
                  No invoices generated for this case yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {detail.invoices.map((inv) => (
                    <div
                      key={inv.id}
                      className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-slate-900">{inv.invoiceNumber}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            inv.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {inv.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500">
                          Total Amount: <strong className="text-slate-900 font-mono">₹{Number(inv.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong> (Incl. 18% GST)
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {inv.status === 'PAID' ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            Receipt Verified
                          </span>
                        ) : (
                          <button
                            onClick={() => handlePayInvoice(inv.id)}
                            disabled={payingInvoiceId === inv.id}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            {payingInvoiceId === inv.id ? 'Processing...' : 'Pay Online (Razorpay)'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* MODAL: Upload Document to Vault */}
        {uploadModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-indigo-600" />
                  Upload {selectedDocName}
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
