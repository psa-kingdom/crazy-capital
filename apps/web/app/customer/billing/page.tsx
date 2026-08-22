'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Receipt,
  CreditCard,
  CheckCircle2,
  Clock,
  Download,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  Building2,
  Sparkles,
} from 'lucide-react';
import { CustomerShell } from '../../../components/layout/customer-shell';
import { customerPortalApi, paymentsApi } from '../../../lib/api';
import { InvoiceDto } from '@cc/types';

export default function CustomerBillingPage() {
  const [invoices, setInvoices] = useState<InvoiceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await customerPortalApi.getMyBilling();
      const items = res.data?.data || res.data || [];
      setInvoices(Array.isArray(items) ? items : []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load billing history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handlePay = async (invoiceId: string) => {
    try {
      setPayingId(invoiceId);
      const res = await paymentsApi.createOrder({ invoiceId });
      const order = res.data?.data || res.data;
      alert(`Razorpay Payment Order generated: ${order.orderId || order.id || 'ORDER_SUCCESS'}. Processing payment verification.`);
      await fetchInvoices();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Payment initiation failed');
    } finally {
      setPayingId(null);
    }
  };

  const totalInvoiced = invoices.reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);
  const paidTotal = invoices
    .filter((inv) => inv.status === 'PAID')
    .reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);
  const unpaidTotal = invoices
    .filter((inv) => inv.status !== 'PAID')
    .reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);

  return (
    <CustomerShell>
      <div className="space-y-8 max-w-6xl mx-auto pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                GST Tax Invoicing & Online Checkout
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-2 flex items-center gap-2">
              <Receipt className="w-7 h-7 text-blue-600" />
              Invoices & Payment History
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              View all statutory GST invoices, fee receipts, and settle pending payments securely via Razorpay (UPI, Netbanking, Cards).
            </p>
          </div>

          <button
            onClick={fetchInvoices}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors self-start md:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Invoices
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Invoiced</span>
              <Receipt className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">
              ₹{totalInvoiced.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
            <span className="text-xs text-slate-400 mt-1 block">{invoices.length} total invoices</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 bg-emerald-50/20 shadow-xs">
            <div className="flex items-center justify-between text-emerald-700">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Paid</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-emerald-800 mt-2">
              ₹{paidTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
            <span className="text-xs text-emerald-700 mt-1 block">Settled & verified</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-blue-200/80 bg-blue-50/20 shadow-xs">
            <div className="flex items-center justify-between text-blue-700">
              <span className="text-xs font-semibold uppercase tracking-wider">Pending Settlement</span>
              <CreditCard className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-800 mt-2">
              ₹{unpaidTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
            <span className="text-xs text-blue-700 mt-1 block">Awaiting payment</span>
          </div>
        </div>

        {/* Main Invoices Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Billing Statement</h2>
              <p className="text-xs text-slate-500">Itemized breakdown of service fees and statutory GST</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Invoice Ref</th>
                  <th className="py-3.5 px-4">Generated Date</th>
                  <th className="py-3.5 px-4 text-right">Subtotal</th>
                  <th className="py-3.5 px-4 text-right">18% GST</th>
                  <th className="py-3.5 px-4 text-right">Total Amount</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                      Loading billing records...
                    </td>
                  </tr>
                ) : invoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No invoices found on your account.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {inv.invoiceNumber}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {new Date(inv.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                        ₹{(Number(inv.amount) - Number(inv.taxAmount || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                        ₹{Number(inv.taxAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                        ₹{Number(inv.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {inv.status === 'PAID' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" /> PAID
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                            <Clock className="w-3 h-3" /> PENDING
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {inv.status === 'PAID' ? (
                          <span className="text-[11px] text-emerald-700 font-semibold flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Receipt Generated
                          </span>
                        ) : (
                          <button
                            onClick={() => handlePay(inv.id)}
                            disabled={payingId === inv.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            {payingId === inv.id ? 'Processing...' : 'Pay Now'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </CustomerShell>
  );
}
