'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Receipt,
  CheckCircle2,
  Clock,
  ArrowLeft,
  CreditCard,
  Building2,
  ShieldCheck,
  Download,
  Printer,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Lock,
  XCircle,
  FileText,
} from 'lucide-react';
import { Card, Button, Badge } from '@cc/ui';
import { invoicesApi, paymentsApi } from '../../lib/api';

interface CustomerInvoice {
  id: string;
  customerId: string;
  applicationId: string | null;
  invoiceNumber: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'CANCELLED';
  application?: {
    id: string;
    applicationNumber: string;
    service?: {
      id: string;
      name: string;
      code: string;
      basePrice: number;
    };
  } | null;
  payments?: {
    id: string;
    gateway: string;
    gatewayReference: string;
    amount: number;
    status: string;
    createdAt: string;
  }[];
  createdAt: string;
}

export default function CustomerInvoicesPage() {
  const [invoices, setInvoices] = useState<CustomerInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'UNPAID' | 'PAID'>('ALL');

  // Checkout modal states
  const [selectedInvoice, setSelectedInvoice] = useState<CustomerInvoice | null>(null);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [paying, setPaying] = useState(false);
  const [lastPaymentRef, setLastPaymentRef] = useState('');

  const mockCustomerInvoices: CustomerInvoice[] = [
    {
      id: 'inv-demo-001',
      customerId: 'cust-demo-101',
      applicationId: 'app-demo-001',
      invoiceNumber: 'INV-2026-000001',
      amount: 14999,
      taxAmount: 2699.82,
      totalAmount: 17698.82,
      status: 'SENT',
      application: {
        id: 'app-demo-001',
        applicationNumber: 'CC-2026-000001',
        service: {
          id: 'srv-1',
          name: 'Private Limited Company Incorporation',
          code: 'PVT_LTD_INC',
          basePrice: 14999,
        },
      },
      payments: [],
      createdAt: new Date(Date.now() - 43200000).toISOString(),
    },
    {
      id: 'inv-demo-002',
      customerId: 'cust-demo-101',
      applicationId: 'app-demo-002',
      invoiceNumber: 'INV-2026-000002',
      amount: 4999,
      taxAmount: 899.82,
      totalAmount: 5898.82,
      status: 'PAID',
      application: {
        id: 'app-demo-002',
        applicationNumber: 'CC-2026-000002',
        service: {
          id: 'srv-2',
          name: 'GST Registration & State Tax Setup',
          code: 'GST_REG',
          basePrice: 4999,
        },
      },
      payments: [
        {
          id: 'pay-001',
          gateway: 'RAZORPAY',
          gatewayReference: 'pay_NmK987xYz12345',
          amount: 5898.82,
          status: 'CAPTURED',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
      ],
      createdAt: new Date(Date.now() - 172800000).toISOString(),
    },
  ];

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res: any = await invoicesApi.getInvoices();
      if (res && res.data && res.data.length > 0) {
        setInvoices(res.data);
      } else {
        setInvoices(mockCustomerInvoices);
      }
    } catch (err) {
      setInvoices(mockCustomerInvoices);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const filteredInvoices = invoices.filter((inv) => {
    if (filter === 'UNPAID') return inv.status === 'SENT' || inv.status === 'DRAFT';
    if (filter === 'PAID') return inv.status === 'PAID';
    return true;
  });

  const totalOutstanding = invoices
    .filter((inv) => inv.status === 'SENT' || inv.status === 'DRAFT')
    .reduce((sum, inv) => sum + inv.totalAmount, 0);

  const handleInitiatePayment = async (inv: CustomerInvoice) => {
    setSelectedInvoice(inv);
    setIsCheckoutModalOpen(true);
  };

  const handleExecutePayment = async () => {
    if (!selectedInvoice) return;
    setPaying(true);

    try {
      // 1. Create order on backend
      const orderRes: any = await paymentsApi.createOrder({
        invoiceId: selectedInvoice.id,
      });

      const orderId = orderRes?.orderId || `order_mock_${Date.now()}`;
      const mockPaymentId = `pay_rzp_${Date.now()}`;
      const mockSignature = `mock_sig_${orderId}_${mockPaymentId}`;

      // 2. Verify payment on backend
      await paymentsApi.verifyPayment({
        invoiceId: selectedInvoice.id,
        razorpayOrderId: orderId,
        razorpayPaymentId: mockPaymentId,
        razorpaySignature: mockSignature,
      });

      setLastPaymentRef(mockPaymentId);

      // 3. Update local state
      setInvoices(
        invoices.map((item) =>
          item.id === selectedInvoice.id
            ? {
                ...item,
                status: 'PAID',
                payments: [
                  ...(item.payments || []),
                  {
                    id: `pay-${Date.now()}`,
                    gateway: 'RAZORPAY',
                    gatewayReference: mockPaymentId,
                    amount: item.totalAmount,
                    status: 'CAPTURED',
                    createdAt: new Date().toISOString(),
                  },
                ],
              }
            : item,
        ),
      );

      setIsCheckoutModalOpen(false);
      setIsSuccessModalOpen(true);
    } catch (err: any) {
      alert(`Payment processing failed: ${err.message}`);
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Header Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-700 via-indigo-600 to-amber-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                CC
              </div>
              <span className="font-bold text-slate-900 tracking-tight">Customer Portal</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/documents">
              <Button variant="outline" size="sm" className="text-xs">
                Document Vault
              </Button>
            </Link>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-2 text-xs text-slate-600 font-medium bg-slate-100 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Rajesh Sharma (Sharma Tech)
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-brand-950 p-6 sm:p-8 text-white shadow-xl">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-amber-300 text-xs font-semibold">
                <Receipt className="w-3.5 h-3.5" />
                GST Compliant Invoicing (ADR-014)
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Billing & Payment Center
              </h1>
              <p className="text-sm text-slate-300">
                View your official tax invoices, settle pending professional fees securely via
                Razorpay, and download receipts for accounting.
              </p>
            </div>

            {/* Total Balance Card */}
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-5 sm:min-w-[240px] text-right">
              <span className="text-xs font-medium text-slate-300 uppercase tracking-wider block">
                Total Outstanding
              </span>
              <div className="text-3xl font-extrabold text-white font-mono mt-1">
                ₹{totalOutstanding.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-amber-300 mt-1">
                {totalOutstanding > 0 ? 'Pending payment settlement' : 'All invoices settled'}
              </p>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {[
              { key: 'ALL', label: 'All Invoices' },
              { key: 'UNPAID', label: 'Unpaid / Pending' },
              { key: 'PAID', label: 'Settled Receipts' },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setFilter(t.key as any)}
                className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
                  filter === t.key
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={fetchInvoices}
            className="text-xs text-slate-500 flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Invoices List */}
        <div className="space-y-4">
          {filteredInvoices.length === 0 ? (
            <Card className="p-12 text-center text-slate-400 bg-white border-slate-200">
              <Receipt className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="text-sm font-medium">No invoices found in this category.</p>
            </Card>
          ) : (
            filteredInvoices.map((inv) => (
              <Card
                key={inv.id}
                className="p-5 sm:p-6 border-slate-200 bg-white hover:border-brand-300 transition-all shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-3 rounded-xl ${
                        inv.status === 'PAID'
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-amber-50 text-amber-600'
                      }`}
                    >
                      <Receipt className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-bold text-sm text-slate-900">
                          {inv.invoiceNumber}
                        </span>
                        {inv.status === 'PAID' ? (
                          <Badge variant="success" className="text-xs flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Paid & Settled
                          </Badge>
                        ) : (
                          <Badge variant="warning" className="text-xs flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Awaiting Payment
                          </Badge>
                        )}
                      </div>

                      <h3 className="text-base font-semibold text-slate-900 mt-1">
                        {inv.application?.service?.name || 'Professional Business Consultation'}
                      </h3>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-2 font-mono">
                        {inv.application && <span>Case: {inv.application.applicationNumber}</span>}
                        <span>
                          Issued:{' '}
                          {new Date(inv.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        <span>SAC: 998311</span>
                      </div>
                    </div>
                  </div>

                  {/* Pricing and Action */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                    <div className="text-right">
                      <div className="text-xl font-bold font-mono text-slate-900">
                        ₹{inv.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        (₹{inv.amount.toLocaleString('en-IN')} + ₹{inv.taxAmount.toLocaleString('en-IN')} 18% GST)
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedInvoice(inv);
                          setIsReceiptModalOpen(true);
                        }}
                        className="text-xs"
                      >
                        <FileText className="w-3.5 h-3.5 mr-1" />
                        Tax Receipt
                      </Button>

                      {inv.status !== 'PAID' && (
                        <Button
                          size="sm"
                          onClick={() => handleInitiatePayment(inv)}
                          className="bg-brand-600 hover:bg-brand-700 text-white text-xs shadow-md shadow-brand-500/20 flex items-center gap-1.5"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          Pay Now
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </main>

      {/* Razorpay Checkout Simulation Modal */}
      {isCheckoutModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100">
            {/* Razorpay Brand Header */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-white text-blue-700 flex items-center justify-center font-bold text-xs">
                  ₹
                </div>
                <div>
                  <h4 className="font-bold text-sm">Crazy Capital Checkout</h4>
                  <p className="text-xs text-blue-200">Secured by Razorpay Payments</p>
                </div>
              </div>
              <button
                onClick={() => setIsCheckoutModalOpen(false)}
                className="text-blue-200 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Order Summary */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Invoice Reference:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {selectedInvoice.invoiceNumber}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Service:</span>
                  <span className="font-medium text-slate-800">
                    {selectedInvoice.application?.service?.name}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Base Fee:</span>
                  <span className="font-mono">₹{selectedInvoice.amount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>18% GST (CGST + SGST):</span>
                  <span className="font-mono">₹{selectedInvoice.taxAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-900 text-sm">
                  <span>Payable Amount:</span>
                  <span className="font-mono text-brand-700">
                    ₹{selectedInvoice.totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Select Payment Method
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-lg border-2 border-brand-500 bg-brand-50/40 text-slate-900 font-semibold flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-brand-600" />
                    UPI / Cards / NetBanking
                  </div>
                  <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 flex items-center gap-2 opacity-70">
                    <Building2 className="w-4 h-4 text-slate-500" />
                    Corporate NetBanking
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  onClick={handleExecutePayment}
                  disabled={paying}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold shadow-lg shadow-emerald-600/20 text-sm flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {paying ? 'Processing Payment...' : `Pay ₹${selectedInvoice.totalAmount.toLocaleString('en-IN')} Securely`}
                </Button>
                <p className="text-[11px] text-center text-slate-400 mt-2 flex items-center justify-center gap-1">
                  <Lock className="w-3 h-3" /> 256-bit SSL Encrypted Payment Gateway
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md shadow-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">Payment Successful!</h3>
              <p className="text-xs text-slate-500 mt-1">
                Your payment of ₹{selectedInvoice?.totalAmount.toLocaleString('en-IN')} was
                successfully captured and reconciled.
              </p>
              <div className="p-2.5 rounded-lg bg-slate-50 font-mono text-xs text-slate-700 mt-3">
                Transaction ID: {lastPaymentRef}
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <Button
                onClick={() => {
                  setIsSuccessModalOpen(false);
                  setIsReceiptModalOpen(true);
                }}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white"
              >
                View Official Tax Receipt
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsSuccessModalOpen(false)}
                className="w-full text-xs"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tax Receipt Modal */}
      {isReceiptModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-100 my-8">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-xs uppercase tracking-wide">
                  Receipt: {selectedInvoice.invoiceNumber}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="p-1 rounded bg-slate-800 text-xs text-slate-300 hover:text-white px-2 flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print
                </button>
                <button
                  onClick={() => setIsReceiptModalOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-700">
              <div className="flex justify-between border-b pb-4">
                <div>
                  <h4 className="font-bold text-slate-900 text-base">CRAZY CAPITAL</h4>
                  <p className="text-slate-500">Corporate & Financial Advisory</p>
                  <p className="font-mono text-[11px] text-slate-600">GSTIN: 09AAACC9876Q1Z5</p>
                </div>
                <div className="text-right">
                  <Badge variant={selectedInvoice.status === 'PAID' ? 'success' : 'warning'}>
                    {selectedInvoice.status}
                  </Badge>
                  <div className="font-mono font-bold mt-1 text-slate-900">
                    ₹{selectedInvoice.totalAmount.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              <div className="space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-500">Service:</span>
                  <span className="font-semibold text-slate-900">
                    {selectedInvoice.application?.service?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Base Price:</span>
                  <span className="font-mono">₹{selectedInvoice.amount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">18% GST:</span>
                  <span className="font-mono">₹{selectedInvoice.taxAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
