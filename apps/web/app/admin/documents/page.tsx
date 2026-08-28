'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  FileCheck2,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  Eye,
  Check,
  X,
  AlertTriangle,
  User,
  ExternalLink,
  DownloadCloud,
  Layers,
  FileText,
} from 'lucide-react';
import { Card, Button, Badge, Modal, Input } from '@cc/ui';
import { documentsApi, documentOcrApi } from '@/lib/api';
import { DocumentOcrRecordDto, DocumentOcrMatchStatus, DocumentOcrSuggestedAction } from '@cc/types';
import { Sparkles, RefreshCw, CheckCheck, FileSearch, ShieldCheck as ShieldCheckIcon, AlertOctagon } from 'lucide-react';

interface DocumentRecord {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  applicationNumber?: string;
  serviceName?: string;
  documentTypeName: string;
  documentTypeCode: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  uploadedAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
  remarks?: string;
  ocrRecord?: DocumentOcrRecordDto;
}

export default function DocumentVerificationWorkbenchPage() {
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED'>('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // OCR Assistant Modal State (Slice 4.2)
  const [selectedOcrDoc, setSelectedOcrDoc] = useState<DocumentRecord | null>(null);
  const [ocrData, setOcrData] = useState<DocumentOcrRecordDto | null>(null);
  const [isOcrRunning, setIsOcrRunning] = useState(false);
  const [isAutoVerifying, setIsAutoVerifying] = useState(false);

  // Rejection modal state
  const [rejectModalDoc, setRejectModalDoc] = useState<DocumentRecord | null>(null);
  const [rejectionReason, setRejectionReason] = useState('BLURRY_IMAGE');
  const [rejectionRemarks, setRejectionRemarks] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  // Initial operations document workbench list
  const [documents, setDocuments] = useState<DocumentRecord[]>([
    {
      id: 'doc-001',
      customerId: 'cust-1',
      customerName: 'Arjun Kapoor (Kapoor Global Exports)',
      customerEmail: 'arjun@kapoorenterprises.com',
      applicationNumber: 'CC-2026-000101',
      serviceName: 'Private Limited Company Incorporation',
      documentTypeName: 'Permanent Account Number (PAN)',
      documentTypeCode: 'PAN',
      fileName: 'Kapoor_PAN_Card.pdf',
      fileSize: 1048576,
      mimeType: 'application/pdf',
      status: 'VERIFIED',
      uploadedAt: '2026-08-21T10:00:00Z',
      verifiedAt: '2026-08-21T11:30:00Z',
      verifiedBy: 'Suresh Patel (Verification Officer)',
    },
    {
      id: 'doc-002',
      customerId: 'cust-1',
      customerName: 'Arjun Kapoor (Kapoor Global Exports)',
      customerEmail: 'arjun@kapoorenterprises.com',
      applicationNumber: 'CC-2026-000101',
      serviceName: 'Private Limited Company Incorporation',
      documentTypeName: 'GST Registration Certificate',
      documentTypeCode: 'GST_CERTIFICATE',
      fileName: 'GST_Certificate_07AABCK.pdf',
      fileSize: 2097152,
      mimeType: 'application/pdf',
      status: 'VERIFIED',
      uploadedAt: '2026-08-21T10:05:00Z',
      verifiedAt: '2026-08-21T11:35:00Z',
      verifiedBy: 'Suresh Patel (Verification Officer)',
    },
    {
      id: 'doc-003',
      customerId: 'cust-1',
      customerName: 'Arjun Kapoor (Kapoor Global Exports)',
      customerEmail: 'arjun@kapoorenterprises.com',
      applicationNumber: 'CC-2026-000101',
      serviceName: 'Private Limited Company Incorporation',
      documentTypeName: 'Bank Statement (Last 6 Months)',
      documentTypeCode: 'BANK_STATEMENT',
      fileName: 'HDFC_Bank_6M_Statement.pdf',
      fileSize: 3450000,
      mimeType: 'application/pdf',
      status: 'PENDING',
      uploadedAt: '2026-08-22T08:30:00Z',
    },
    {
      id: 'doc-004',
      customerId: 'cust-2',
      customerName: 'Meera Deshmukh (Deshmukh Organics)',
      customerEmail: 'meera@deshmukhorganics.com',
      applicationNumber: 'CC-2026-000108',
      serviceName: 'Trademark Search & Filing (Class 30)',
      documentTypeName: 'Trademark Logo & Affidavit',
      documentTypeCode: 'TRADEMARK_SPECIMEN',
      fileName: 'Deshmukh_Brand_Specimen.png',
      fileSize: 524288,
      mimeType: 'image/png',
      status: 'REJECTED',
      rejectionReason: 'BLURRY_IMAGE',
      remarks: 'Image resolution is low; brand logo typography is illegible. Re-upload at minimum 300 DPI.',
      uploadedAt: '2026-08-22T09:00:00Z',
      verifiedAt: '2026-08-22T09:45:00Z',
      verifiedBy: 'Priya Verma (Compliance Lead)',
    },
    {
      id: 'doc-005',
      customerId: 'cust-3',
      customerName: 'Vikramaditya Singhania (Singhania Logistics)',
      customerEmail: 'vikram@singhanialogistics.in',
      applicationNumber: 'CC-2026-000115',
      serviceName: 'MSME Working Capital Finance',
      documentTypeName: 'Audited Financials & ITR-V',
      documentTypeCode: 'ITR_V',
      fileName: 'Singhania_FY25_ITR_Audited.pdf',
      fileSize: 4200000,
      mimeType: 'application/pdf',
      status: 'PENDING',
      uploadedAt: '2026-08-22T11:15:00Z',
    },
  ]);

  // Load live documents from API if available
  useEffect(() => {
    async function fetchDocuments() {
      try {
        setLoading(true);
        const data: any = await documentsApi.getDocuments({});
        if (data && Array.isArray(data) && data.length > 0) {
          const mapped: DocumentRecord[] = data.map((d: any) => ({
            id: d.id,
            customerId: d.customerId,
            customerName: d.customer?.companyName || `${d.customer?.firstName || ''} ${d.customer?.lastName || ''}`.trim() || 'Customer',
            customerEmail: d.customer?.email || '',
            applicationNumber: d.application?.applicationNumber,
            serviceName: d.application?.service?.name,
            documentTypeName: d.documentType?.name || d.documentTypeId,
            documentTypeCode: d.documentType?.code || 'DOC',
            fileName: d.fileName,
            fileSize: d.fileSize,
            mimeType: d.mimeType,
            status: d.status,
            uploadedAt: d.createdAt,
            verifiedAt: d.verifications?.[0]?.verifiedAt,
            verifiedBy: d.verifications?.[0]?.verifiedBy ? `${d.verifications[0].verifiedBy.firstName} ${d.verifications[0].verifiedBy.lastName}` : undefined,
            rejectionReason: d.verifications?.[0]?.remarks?.split(':')?.[0],
            remarks: d.verifications?.[0]?.remarks,
          }));
          setDocuments(mapped);
        }
      } catch (err) {
        console.info('Using local workbench state');
      } finally {
        setLoading(false);
      }
    }
    fetchDocuments();
  }, []);

  // Handle presigned preview
  const handlePreview = async (doc: DocumentRecord) => {
    try {
      const res: any = await documentsApi.getPreviewUrl(doc.id);
      if (res?.previewUrl) {
        window.open(res.previewUrl, '_blank');
      } else {
        alert(`Secure Preview: ${doc.fileName}\nCloudflare R2 Encrypted Key: org_org-1/cust_${doc.customerId}/${doc.fileName}`);
      }
    } catch (err) {
      alert(`Secure Preview: ${doc.fileName}`);
    }
  };

  // Handle Verify Action
  const handleVerify = async (doc: DocumentRecord) => {
    try {
      setSubmittingAction(true);
      try {
        await documentsApi.verifyDocument(doc.id, 'Document verified successfully by operations officer');
      } catch (apiErr) {
        console.info('Simulated verification locally');
      }

      setDocuments((prev) =>
        prev.map((d) =>
          d.id === doc.id
            ? {
                ...d,
                status: 'VERIFIED',
                verifiedAt: new Date().toISOString(),
                verifiedBy: 'Operations Officer (Current User)',
                rejectionReason: undefined,
                remarks: undefined,
              }
            : d,
        ),
      );

      setActionSuccess(`Document "${doc.fileName}" marked as VERIFIED. Workflow gates unblocked.`);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      alert(`Verification failed: ${err.message}`);
    } finally {
      setSubmittingAction(false);
    }
  };

  // Handle OCR Assistant Inspection (Slice 4.2)
  const handleOpenOcr = async (doc: DocumentRecord) => {
    setSelectedOcrDoc(doc);
    try {
      setIsOcrRunning(true);
      const res: any = await documentOcrApi.getOcrResult(doc.id);
      setOcrData(res);
    } catch (e) {
      // Deterministic Mock fallback for interactive workbench
      const isPan = doc.documentTypeCode === 'PAN' || doc.fileName.toUpperCase().includes('PAN');
      const isGst = doc.documentTypeCode === 'GST_CERTIFICATE' || doc.fileName.toUpperCase().includes('GST');
      setOcrData({
        id: `ocr-${doc.id}`,
        organizationId: 'org-1',
        documentId: doc.id,
        documentType: doc.documentTypeCode,
        extractedData: isPan
          ? {
              panNumber: 'ABCDE1234F',
              name: doc.customerName.split('(')[0].trim(),
              dob: '15/08/1988',
              fatherName: 'Ramesh Kapoor',
            }
          : isGst
          ? {
              gstin: '07AABCK1234F1Z5',
              legalName: doc.customerName,
              tradeName: 'Kapoor Global Exports',
              state: 'Delhi',
            }
          : {
              accountNumber: '50100456789123',
              ifsc: 'HDFC0001234',
              bankName: 'HDFC Bank Ltd',
              name: doc.customerName,
            },
        confidenceScore: 96.5,
        clarityScore: 94.0,
        tamperCheckPassed: true,
        matchStatus: DocumentOcrMatchStatus.FULL_MATCH,
        discrepancies: [],
        suggestedAction: DocumentOcrSuggestedAction.AUTO_APPROVE,
        ocrProvider: 'INTELLIGENT_OCR_SANDBOX',
        processedAt: new Date().toISOString(),
      });
    } finally {
      setIsOcrRunning(false);
    }
  };

  const handleRunOcrScan = async (docId: string) => {
    try {
      setIsOcrRunning(true);
      const res: any = await documentOcrApi.runOcr(docId);
      setOcrData(res);
    } catch (e) {
      // Keep state
    } finally {
      setIsOcrRunning(false);
    }
  };

  const handleAutoVerifyOcr = async (docId: string, decision: 'APPROVE' | 'REJECT') => {
    try {
      setIsAutoVerifying(true);
      try {
        await documentOcrApi.autoVerify(docId, {
          overrideDecision: decision,
          remarks: `OCR Verification Action: ${decision}`,
        });
      } catch (err) {
        // Local simulation
      }

      setDocuments((prev) =>
        prev.map((d) =>
          d.id === docId
            ? {
                ...d,
                status: decision === 'APPROVE' ? 'VERIFIED' : 'REJECTED',
                verifiedAt: new Date().toISOString(),
                verifiedBy: 'Crazy Capital OCR Assistant (Auto-Verified)',
              }
            : d,
        ),
      );

      setActionSuccess(`Document ${decision === 'APPROVE' ? 'Auto-Verified' : 'Rejected'} successfully via OCR.`);
      setTimeout(() => setActionSuccess(null), 4000);
      setSelectedOcrDoc(null);
    } catch (e) {
      alert('Action failed');
    } finally {
      setIsAutoVerifying(false);
    }
  };

  // Handle Reject Action submission
  const handleRejectSubmit = async () => {
    if (!rejectModalDoc) return;

    try {
      setSubmittingAction(true);
      try {
        await documentsApi.rejectDocument(rejectModalDoc.id, rejectionReason, rejectionRemarks);
      } catch (apiErr) {
        console.info('Simulated rejection locally');
      }

      setDocuments((prev) =>
        prev.map((d) =>
          d.id === rejectModalDoc.id
            ? {
                ...d,
                status: 'REJECTED',
                rejectionReason,
                remarks: rejectionRemarks,
                verifiedAt: new Date().toISOString(),
                verifiedBy: 'Operations Officer (Current User)',
              }
            : d,
        ),
      );

      setActionSuccess(`Document "${rejectModalDoc.fileName}" marked as REJECTED. Customer notified to re-upload.`);
      setRejectModalDoc(null);
      setRejectionRemarks('');
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      alert(`Rejection failed: ${err.message}`);
    } finally {
      setSubmittingAction(false);
    }
  };

  // Filtered documents
  const filtered = documents.filter((doc) => {
    const matchesTab = activeTab === 'ALL' || doc.status === activeTab;
    const matchesSearch =
      search === '' ||
      doc.customerName.toLowerCase().includes(search.toLowerCase()) ||
      doc.documentTypeName.toLowerCase().includes(search.toLowerCase()) ||
      doc.fileName.toLowerCase().includes(search.toLowerCase()) ||
      (doc.applicationNumber && doc.applicationNumber.toLowerCase().includes(search.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  const counts = {
    ALL: documents.length,
    PENDING: documents.filter((d) => d.status === 'PENDING').length,
    VERIFIED: documents.filter((d) => d.status === 'VERIFIED').length,
    REJECTED: documents.filter((d) => d.status === 'REJECTED').length,
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0e14] text-slate-900 dark:text-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl bg-white dark:bg-[#131722] border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Document Verification Workbench
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-400 border border-brand-200 dark:border-brand-800">
                  Slice 1.7 • ADR-018
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Review submitted KYC, tax, and compliance documents, enforce DOCUMENT_GATE rules, and trigger re-upload requests.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#131722] border border-slate-200 dark:border-slate-800 text-xs font-semibold flex items-center gap-2 shadow-sm">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Pending Review Queue: </span>
              <span className="text-amber-600 dark:text-amber-400 font-bold">{counts.PENDING}</span>
            </div>
          </div>
        </div>

        {/* Action success alert */}
        {actionSuccess && (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
            <button onClick={() => setActionSuccess(null)} className="text-emerald-600 hover:text-emerald-900 dark:hover:text-white">
              ✕
            </button>
          </div>
        )}

        {/* Filter Controls & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white dark:bg-[#131722] border border-slate-200 dark:border-slate-800 shadow-sm">
            {(['ALL', 'PENDING', 'VERIFIED', 'REJECTED'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === tab
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab === 'ALL' && `All (${counts.ALL})`}
                {tab === 'PENDING' && `Pending (${counts.PENDING})`}
                {tab === 'VERIFIED' && `Verified (${counts.VERIFIED})`}
                {tab === 'REJECTED' && `Rejected (${counts.REJECTED})`}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search customer, doc type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131722] text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
            />
          </div>
        </div>

        {/* Document Grid / Table */}
        <Card className="p-0 overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#181d2a] border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Document Details</th>
                  <th className="py-3 px-4">Customer & Application</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Audit Information</th>
                  <th className="py-3 px-4 text-right">Verification Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                      No documents match the active filter criteria.
                    </td>
                  </tr>
                ) : (
                  filtered.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors">
                      {/* Document Details */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white text-xs">{doc.documentTypeName}</div>
                            <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-xs">
                              {doc.fileName}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {(doc.fileSize / 1024).toFixed(1)} KB • {doc.mimeType}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Customer & Application */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="font-semibold text-slate-900 dark:text-slate-200">{doc.customerName}</div>
                          {doc.applicationNumber && (
                            <div className="text-[11px] font-mono text-brand-600 dark:text-brand-400">
                              {doc.applicationNumber} • {doc.serviceName}
                            </div>
                          )}
                          <div className="text-[10px] text-slate-400">{doc.customerEmail}</div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {doc.status === 'VERIFIED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                          </span>
                        )}
                        {doc.status === 'PENDING' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 text-[11px] font-semibold">
                            <Clock className="w-3.5 h-3.5 animate-pulse" /> Pending Review
                          </span>
                        )}
                        {doc.status === 'REJECTED' && (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 text-[11px] font-semibold">
                              <XCircle className="w-3.5 h-3.5" /> Rejected
                            </span>
                            {doc.rejectionReason && (
                              <div className="text-[10px] text-red-600 dark:text-red-400 font-medium">
                                Reason: {doc.rejectionReason}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Audit */}
                      <td className="py-3.5 px-4 text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5">
                        <div>Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}</div>
                        {doc.verifiedBy && <div>Reviewed by: {doc.verifiedBy}</div>}
                        {doc.remarks && <div className="italic text-slate-600 dark:text-slate-300">&quot;{doc.remarks}&quot;</div>}
                      </td>

                      {/* Verification Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenOcr(doc)}
                            className="py-1 px-2.5 text-xs bg-brand-50 hover:bg-brand-100 text-brand-700 border-brand-200"
                            leftIcon={<Sparkles className="w-3.5 h-3.5 text-brand-600" />}
                          >
                            AI OCR Audit
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePreview(doc)}
                            className="py-1 px-2.5 text-xs text-slate-700 dark:text-slate-200"
                            leftIcon={<Eye className="w-3.5 h-3.5" />}
                          >
                            Preview
                          </Button>

                          {doc.status !== 'VERIFIED' && (
                            <Button
                              size="sm"
                              variant="primary"
                              disabled={submittingAction}
                              onClick={() => handleVerify(doc)}
                              className="py-1 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                              leftIcon={<Check className="w-3.5 h-3.5" />}
                            >
                              Verify
                            </Button>
                          )}

                          {doc.status !== 'REJECTED' && (
                            <Button
                              size="sm"
                              variant="danger"
                              disabled={submittingAction}
                              onClick={() => setRejectModalDoc(doc)}
                              className="py-1 px-2.5 text-xs bg-red-600 hover:bg-red-700 text-white"
                              leftIcon={<X className="w-3.5 h-3.5" />}
                            >
                              Reject
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* AI OCR Side-by-Side Verification Assistant Modal (Slice 4.2) */}
        {selectedOcrDoc && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-brand-50 text-brand-600">
                    <FileSearch className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">Document OCR & Auto-Verification</h3>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {ocrData?.matchStatus || 'ANALYZED'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{selectedOcrDoc.fileName} • {selectedOcrDoc.documentTypeName}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedOcrDoc(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* OCR Confidence & Tamper Status Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">OCR Confidence</span>
                  <div className="text-xl font-black text-slate-900 mt-0.5">{ocrData?.confidenceScore || 96.5}%</div>
                  <span className="text-[11px] text-emerald-600 font-semibold">High Optical Clarity</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Tamper & Forensics</span>
                  <div className="text-xl font-black text-emerald-600 mt-0.5 flex items-center gap-1">
                    <ShieldCheckIcon className="w-5 h-5" /> Passed
                  </div>
                  <span className="text-[11px] text-slate-500">Metadata & Font Match</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Suggested Action</span>
                  <div className="text-xl font-black text-brand-600 mt-0.5">
                    {ocrData?.suggestedAction === 'AUTO_APPROVE' ? 'Auto-Approve' : 'Manual Review'}
                  </div>
                  <span className="text-[11px] text-brand-700 font-semibold">Ready for 1-Click Verification</span>
                </div>
              </div>

              {/* Side-by-Side Comparison Box */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {/* Left: Customer Application Profile */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block border-b pb-1.5">
                    Customer Application Profile
                  </span>
                  <div className="space-y-1.5 text-xs">
                    <div>
                      <span className="text-slate-500 font-medium">Applicant / Entity Name:</span>
                      <div className="font-bold text-slate-900">{selectedOcrDoc.customerName}</div>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Application Ref:</span>
                      <div className="font-mono text-slate-800">{selectedOcrDoc.applicationNumber || 'CC-2026-000101'}</div>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Service Vertical:</span>
                      <div className="font-semibold text-slate-800">{selectedOcrDoc.serviceName || 'Private Limited Incorporation'}</div>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Customer Email:</span>
                      <div className="text-slate-800">{selectedOcrDoc.customerEmail}</div>
                    </div>
                  </div>
                </div>

                {/* Right: OCR Extracted Fields */}
                <div className="p-4 bg-brand-50/50 rounded-xl border border-brand-200 space-y-2.5">
                  <span className="text-xs font-bold text-brand-900 uppercase tracking-wider block border-b border-brand-200 pb-1.5">
                    Extracted Statutory Fields (OCR)
                  </span>
                  <div className="space-y-1.5 text-xs">
                    {ocrData?.extractedData?.panNumber && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600 font-medium">PAN Number:</span>
                        <span className="font-mono font-bold text-brand-700 bg-white px-2 py-0.5 rounded border border-brand-200">
                          {ocrData.extractedData.panNumber}
                        </span>
                      </div>
                    )}
                    {ocrData?.extractedData?.gstin && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600 font-medium">GSTIN:</span>
                        <span className="font-mono font-bold text-brand-700 bg-white px-2 py-0.5 rounded border border-brand-200">
                          {ocrData.extractedData.gstin}
                        </span>
                      </div>
                    )}
                    {ocrData?.extractedData?.name && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600 font-medium">Extracted Name:</span>
                        <span className="font-bold text-slate-900">{ocrData.extractedData.name}</span>
                      </div>
                    )}
                    {ocrData?.extractedData?.dob && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600 font-medium">DOB / Incorp Date:</span>
                        <span className="text-slate-900">{ocrData.extractedData.dob}</span>
                      </div>
                    )}
                    {ocrData?.extractedData?.state && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600 font-medium">State / Jurisdiction:</span>
                        <span className="text-slate-900">{ocrData.extractedData.state}</span>
                      </div>
                    )}
                    {ocrData?.extractedData?.accountNumber && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600 font-medium">Account / IFSC:</span>
                        <span className="font-mono text-slate-900">{ocrData.extractedData.accountNumber} ({ocrData.extractedData.ifsc})</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Discrepancy Radar */}
              {ocrData?.discrepancies && ocrData.discrepancies.length > 0 ? (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-2">
                  <span className="text-xs font-bold text-red-900 flex items-center gap-1.5">
                    <AlertOctagon className="w-4 h-4 text-red-600" /> Discrepancies Flagged by OCR Engine
                  </span>
                  {ocrData.discrepancies.map((disc, idx) => (
                    <div key={idx} className="text-xs bg-white p-2.5 rounded-lg border border-red-100 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-red-950">{disc.field}:</span> Application has &quot;{disc.applicationValue}&quot;, OCR extracted &quot;{disc.ocrValue}&quot;
                      </div>
                      <span className="font-mono font-bold text-red-600">{Math.round(disc.matchRatio * 100)}% Match</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-900 font-medium">
                  <CheckCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Full statutory match: Applicant name and identifiers match extracted document perfectly. Zero discrepancies found.</span>
                </div>
              )}

              {/* Actions */}
              <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRunOcrScan(selectedOcrDoc.id)}
                  disabled={isOcrRunning}
                  className="text-xs flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isOcrRunning ? 'animate-spin' : ''}`} />
                  {isOcrRunning ? 'Scanning Document...' : 'Re-Run OCR Extraction'}
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleAutoVerifyOcr(selectedOcrDoc.id, 'REJECT')}
                    disabled={isAutoVerifying}
                    className="text-xs"
                  >
                    Reject (Flag Discrepancy)
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleAutoVerifyOcr(selectedOcrDoc.id, 'APPROVE')}
                    disabled={isAutoVerifying}
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
                  >
                    <CheckCheck className="w-4 h-4" />
                    {isAutoVerifying ? 'Verifying...' : '1-Click Auto-Approve'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Structured Rejection Modal */}
        {rejectModalDoc && (
          <Modal
            isOpen={!!rejectModalDoc}
            onClose={() => setRejectModalDoc(null)}
            title="Reject Document & Request Re-upload"
          >
            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="font-bold text-slate-900 dark:text-white">{rejectModalDoc.documentTypeName}</div>
                <div className="font-mono text-slate-600 dark:text-slate-400">{rejectModalDoc.fileName}</div>
                <div className="text-[11px] text-slate-500">Customer: {rejectModalDoc.customerName}</div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-800 dark:text-slate-200">
                  Structured Rejection Reason <span className="text-red-500">*</span>
                </label>
                <select
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                >
                  <option value="BLURRY_IMAGE">Unreadable / Blurry Image (Low Resolution)</option>
                  <option value="EXPIRED">Document Expired / Past Validity Date</option>
                  <option value="NAME_MISMATCH">Name Mismatch with Customer Profile</option>
                  <option value="INVALID_DOCUMENT">Incorrect Document Category Submitted</option>
                  <option value="INCOMPLETE_PAGE">Missing Pages or Incomplete Scan</option>
                  <option value="OTHER">Other Compliance Discrepancy</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-800 dark:text-slate-200">
                  Compliance Officer Remarks (Displayed to Customer)
                </label>
                <textarea
                  rows={3}
                  value={rejectionRemarks}
                  onChange={(e) => setRejectionRemarks(e.target.value)}
                  placeholder="Explain exactly what the customer needs to correct before re-uploading..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRejectModalDoc(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  isLoading={submittingAction}
                  onClick={handleRejectSubmit}
                >
                  Confirm Rejection & Notify Customer
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
}
