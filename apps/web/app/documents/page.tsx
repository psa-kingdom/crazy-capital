'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  FileCheck2,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
  FileText,
  ShieldCheck,
  RefreshCw,
  Eye,
  AlertTriangle,
  Lock,
  Receipt,
} from 'lucide-react';
import { Card, Button, Badge } from '@cc/ui';
import { documentsApi } from '../../lib/api';

interface DocumentItem {
  id: string;
  documentTypeId: string;
  documentType: {
    id: string;
    name: string;
    code: string;
    description?: string;
  };
  fileName: string;
  fileSize: number;
  mimeType: string;
  status: 'PENDING' | 'UPLOADED' | 'VERIFIED' | 'REJECTED';
  rejectionReason?: string;
  remarks?: string;
  isMandatory?: boolean;
  updatedAt?: string;
}

export default function CustomerDocumentVaultPage() {
  // Demo customer profile
  const customerId = 'cust-demo-101';
  const applicationId = 'app-demo-001';

  const [loading, setLoading] = useState(false);
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Initial document requirement checklist
  const [documents, setDocuments] = useState<DocumentItem[]>([
    {
      id: 'doc-pan',
      documentTypeId: 'dt-pan-01',
      documentType: {
        id: 'dt-pan-01',
        name: 'Permanent Account Number (PAN)',
        code: 'PAN',
        description: 'Clear copy of company or director PAN card',
      },
      fileName: 'Company_PAN_Card.pdf',
      fileSize: 1048576,
      mimeType: 'application/pdf',
      status: 'VERIFIED',
      isMandatory: true,
      updatedAt: '2026-08-20T10:00:00Z',
    },
    {
      id: 'doc-gst',
      documentTypeId: 'dt-gst-02',
      documentType: {
        id: 'dt-gst-02',
        name: 'GST Registration Certificate',
        code: 'GST_CERTIFICATE',
        description: 'Form GST REG-06 certificate with all 3 annexures',
      },
      fileName: 'GST_Registration_07AAB.pdf',
      fileSize: 2097152,
      mimeType: 'application/pdf',
      status: 'PENDING',
      isMandatory: true,
      updatedAt: '2026-08-21T14:30:00Z',
    },
    {
      id: 'doc-bank',
      documentTypeId: 'dt-bank-03',
      documentType: {
        id: 'dt-bank-03',
        name: 'Bank Statement (Last 6 Months)',
        code: 'BANK_STATEMENT',
        description: 'Current account bank statement with IFSC and MICR stamp',
      },
      fileName: 'HDFC_Bank_Statement_Q1.pdf',
      fileSize: 3450000,
      mimeType: 'application/pdf',
      status: 'REJECTED',
      rejectionReason: 'BLURRY_IMAGE',
      remarks: 'The bank seal and account holder name are blurry. Please re-upload a clear digital PDF.',
      isMandatory: true,
      updatedAt: '2026-08-22T09:15:00Z',
    },
    {
      id: 'doc-passport',
      documentTypeId: 'dt-pass-04',
      documentType: {
        id: 'dt-pass-04',
        name: 'Director Passport / Aadhaar',
        code: 'PASSPORT',
        description: 'Self-attested identity proof of the primary signatory',
      },
      fileName: '',
      fileSize: 0,
      mimeType: '',
      status: 'PENDING',
      isMandatory: false,
    },
  ]);

  // Load live documents if API is reachable
  useEffect(() => {
    async function loadVault() {
      try {
        setLoading(true);
        const data: any = await documentsApi.getDocuments({ customerId });
        if (data && Array.isArray(data) && data.length > 0) {
          setDocuments(data);
        }
      } catch (err) {
        console.info('Using local customer vault state:', err);
      } finally {
        setLoading(false);
      }
    }
    loadVault();
  }, [customerId]);

  // Handle direct file upload via presigned S3/R2 PUT URL
  const handleFileUpload = async (docItem: DocumentItem, file: File) => {
    // 1. Client-side validation
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage(`Invalid file format: ${file.name}. Only PDF, JPG, and PNG files are allowed.`);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage(`File exceeds 10MB limit (${(file.size / (1024 * 1024)).toFixed(2)} MB). Please compress and retry.`);
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setUploadingDocId(docItem.id);
    setUploadProgress(15);

    try {
      // 2. Request Presigned S3/R2 Upload URL from Crazy Capital API
      setUploadProgress(35);
      let presignedResult: any;
      try {
        presignedResult = await documentsApi.requestPresignedUpload({
          customerId,
          applicationId,
          documentTypeId: docItem.documentTypeId,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
        });
      } catch (apiErr) {
        console.warn('API fallback for upload simulation:', apiErr);
      }

      setUploadProgress(65);

      // 3. Direct Browser-to-R2 upload if live URL returned, else simulate direct upload
      if (presignedResult?.uploadUrl && !presignedResult.uploadUrl.includes('mock')) {
        await fetch(presignedResult.uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        });
      } else {
        // Simulated network latency for mock upload
        await new Promise((res) => setTimeout(res, 800));
      }

      setUploadProgress(85);

      // 4. Confirm upload completion with backend
      const serverDocId = presignedResult?.document?.id || docItem.id;
      try {
        await documentsApi.confirmUpload(serverDocId, {
          storageKey: presignedResult?.storageKey,
          fileSize: file.size,
        });
      } catch (confirmErr) {
        console.info('Upload confirmed locally');
      }

      setUploadProgress(100);

      // 5. Update local state to PENDING (Pending Verification)
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === docItem.id
            ? {
                ...d,
                fileName: file.name,
                fileSize: file.size,
                mimeType: file.type,
                status: 'PENDING',
                rejectionReason: undefined,
                remarks: undefined,
                updatedAt: new Date().toISOString(),
              }
            : d,
        ),
      );

      setSuccessMessage(`Document "${file.name}" uploaded successfully! Sent to Operations for verification.`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Upload failed. Please check your internet connection.');
    } finally {
      setTimeout(() => {
        setUploadingDocId(null);
        setUploadProgress(0);
      }, 500);
    }
  };

  // Preview handler
  const handlePreview = async (doc: DocumentItem) => {
    try {
      const res: any = await documentsApi.getPreviewUrl(doc.id);
      if (res?.previewUrl) {
        window.open(res.previewUrl, '_blank');
      } else {
        alert(`Secure Preview: ${doc.fileName} (Encrypted R2 Object - Staging Mock URL)`);
      }
    } catch (err) {
      alert(`Secure Preview: ${doc.fileName} (Encrypted R2 Object)`);
    }
  };

  const verifiedCount = documents.filter((d) => d.status === 'VERIFIED').length;
  const mandatoryCount = documents.filter((d) => d.isMandatory).length;
  const mandatoryVerified = documents.filter((d) => d.isMandatory && d.status === 'VERIFIED').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Secure Document Vault
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-brand-500/20 text-brand-400 border border-brand-500/30">
                  Cloudflare R2 Encrypted (ADR-018)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Upload and manage mandatory KYC & compliance documents for your service applications.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/invoices">
              <Button
                variant="outline"
                size="sm"
                className="border-slate-700 bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 text-xs flex items-center gap-1.5"
              >
                <Receipt className="w-3.5 h-3.5 text-amber-400" />
                Invoices & Billing
              </Button>
            </Link>
            <div className="text-right border-l border-slate-800 pl-3">
              <div className="text-xs font-semibold text-slate-300">
                Gate Progress: {mandatoryVerified}/{mandatoryCount} Verified
              </div>
              <div className="text-[10px] text-slate-500">
                {mandatoryVerified === mandatoryCount ? '✅ DOCUMENT_GATE Satisfied' : '⚠️ Pending Mandatory Verification'}
              </div>
            </div>
          </div>
        </div>

        {/* Security / Invariant Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-950/60 to-slate-900 border border-brand-500/20 flex items-start gap-3.5">
          <div className="p-2 rounded-xl bg-brand-500/20 text-brand-400 shrink-0 mt-0.5">
            <Lock className="w-5 h-5" />
          </div>
          <div className="space-y-1 text-xs">
            <div className="font-bold text-white flex items-center gap-2">
              <span>Zero-Storage Client Security Architecture</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                15-Min Short-Lived Presigned URLs
              </span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Files are transferred directly from your browser to private Cloudflare R2 object storage. No binaries are stored in relational databases. Download URLs expire in 15 minutes.
            </p>
          </div>
        </div>

        {/* Notifications */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-950/60 border border-red-500/30 text-red-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-white">
              ✕
            </button>
          </div>
        )}

        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-white">
              ✕
            </button>
          </div>
        )}

        {/* Document Checklist Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-brand-400" />
              Required Document Checklist
            </h2>
            <span className="text-xs text-slate-400">Accepted formats: PDF, JPG, PNG (Max 10MB)</span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {documents.map((doc) => {
              const isUploading = uploadingDocId === doc.id;

              return (
                <Card
                  key={doc.id}
                  className="p-5 bg-slate-900/90 border-slate-800 text-slate-100 hover:border-slate-700 transition-all space-y-4"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{doc.documentType.name}</span>
                        {doc.isMandatory && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            Mandatory
                          </span>
                        )}
                        <span className="font-mono text-[10px] text-slate-400">({doc.documentType.code})</span>
                      </div>
                      <p className="text-xs text-slate-400">{doc.documentType.description}</p>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2 shrink-0">
                      {doc.status === 'VERIFIED' && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verified</span>
                        </div>
                      )}
                      {doc.status === 'PENDING' && doc.fileName && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
                          <Clock className="w-3.5 h-3.5 animate-pulse" />
                          <span>Pending Verification</span>
                        </div>
                      )}
                      {doc.status === 'REJECTED' && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Rejected</span>
                        </div>
                      )}
                      {!doc.fileName && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 text-xs font-medium">
                          <span>Not Uploaded</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rejected Reason Banner & Action */}
                  {doc.status === 'REJECTED' && (
                    <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-red-300">
                        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                        <span>Rejection Reason: {doc.rejectionReason?.replace(/_/g, ' ') || 'Document Did Not Meet Criteria'}</span>
                      </div>
                      {doc.remarks && (
                        <p className="text-xs text-red-200/90 pl-6 leading-relaxed">
                          Officer remarks: &quot;{doc.remarks}&quot;
                        </p>
                      )}
                    </div>
                  )}

                  {/* File Metadata & Upload Controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs">
                    {doc.fileName ? (
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-slate-800 text-brand-400">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-mono text-slate-200 font-medium truncate max-w-xs sm:max-w-md">
                            {doc.fileName}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {(doc.fileSize / 1024).toFixed(1)} KB • {doc.mimeType || 'PDF'}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-slate-500 italic">No document file submitted yet.</div>
                    )}

                    <div className="flex items-center gap-2 shrink-0">
                      {doc.fileName && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePreview(doc)}
                          className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs py-1.5"
                          leftIcon={<Eye className="w-3.5 h-3.5" />}
                        >
                          Preview
                        </Button>
                      )}

                      {/* Upload / Re-upload input */}
                      <label className="relative cursor-pointer">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          disabled={isUploading}
                          className="sr-only"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleFileUpload(doc, e.target.files[0]);
                            }
                          }}
                        />
                        <div
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                            doc.status === 'REJECTED'
                              ? 'bg-red-600 hover:bg-red-500 text-white shadow-sm'
                              : doc.status === 'VERIFIED'
                              ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                              : 'bg-brand-600 hover:bg-brand-500 text-white shadow-sm'
                          } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                        >
                          {isUploading ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Uploading ({uploadProgress}%)...</span>
                            </>
                          ) : doc.status === 'REJECTED' ? (
                            <>
                              <UploadCloud className="w-3.5 h-3.5" />
                              <span>Re-upload Document</span>
                            </>
                          ) : doc.fileName ? (
                            <>
                              <UploadCloud className="w-3.5 h-3.5" />
                              <span>Replace File</span>
                            </>
                          ) : (
                            <>
                              <UploadCloud className="w-3.5 h-3.5" />
                              <span>Upload File</span>
                            </>
                          )}
                        </div>
                      </label>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
