'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  UserCheck,
  Plus,
  Search,
  Filter,
  Building,
  User,
  ShieldCheck,
  Phone,
  Mail,
  ChevronRight,
  Download,
  XCircle,
} from 'lucide-react';
import { Card, Button, Badge } from '@cc/ui';
import { CustomerType } from '@cc/types';
import { customerApi } from '../../lib/api';

interface CustomerItem {
  id: string;
  customerType: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  companyName: string | null;
  pan: string | null;
  gstin: string | null;
  status: string;
  createdAt: string;
  branch?: { id: string; name: string; code: string } | null;
  addressesCount?: number;
  contactsCount?: number;
  applicationsCount?: number;
}

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [customers, setCustomers] = useState<CustomerItem[]>([
    {
      id: 'cust-001',
      customerType: 'BUSINESS',
      firstName: 'Arjun',
      lastName: 'Kapoor',
      email: 'arjun@kapoorenterprises.com',
      mobile: '9822003344',
      companyName: 'Kapoor Global Exports Private Limited',
      pan: 'AABCK1234D',
      gstin: '07AABCK1234D1Z8',
      status: 'ACTIVE',
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      branch: { id: 'b1', name: 'Head Office', code: 'HO' },
      addressesCount: 2,
      contactsCount: 2,
      applicationsCount: 3,
    },
    {
      id: 'cust-002',
      customerType: 'INDIVIDUAL',
      firstName: 'Pooja',
      lastName: 'Mehra',
      email: 'pooja.mehra@gmail.com',
      mobile: '9822003345',
      companyName: null,
      pan: 'BHPPM4567K',
      gstin: null,
      status: 'ACTIVE',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      branch: { id: 'b2', name: 'Noida Branch', code: 'NOIDA_01' },
      addressesCount: 1,
      contactsCount: 1,
      applicationsCount: 1,
    },
    {
      id: 'cust-003',
      customerType: 'BUSINESS',
      firstName: 'Sunil',
      lastName: 'Chopra',
      email: 'sunil@choprafoods.in',
      mobile: '9822003346',
      companyName: 'Chopra Agro Processing Industries LLP',
      pan: 'AABCC8901L',
      gstin: '27AABCC8901L1ZT',
      status: 'ACTIVE',
      createdAt: new Date(Date.now() - 43200000).toISOString(),
      branch: { id: 'b3', name: 'Mumbai Branch', code: 'MUMBAI_01' },
      addressesCount: 2,
      contactsCount: 3,
      applicationsCount: 2,
    },
  ]);

  React.useEffect(() => {
    async function loadCustomers() {
      try {
        const res: any = await customerApi.getCustomers({ limit: 100 });
        if (res && res.data && Array.isArray(res.data)) {
          setCustomers(res.data);
        }
      } catch (err) {
        console.info('Using local customer directory state');
      }
    }
    loadCustomers();
  }, []);

  const [newCustomer, setNewCustomer] = useState({
    customerType: 'INDIVIDUAL',
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    companyName: '',
    pan: '',
    gstin: '',
  });

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.firstName || !newCustomer.lastName || !newCustomer.email || !newCustomer.mobile) {
      alert('Please fill all required customer fields.');
      return;
    }

    try {
      const createdFromApi: any = await customerApi.createCustomer({
        customerType: newCustomer.customerType,
        firstName: newCustomer.firstName.trim(),
        lastName: newCustomer.lastName.trim(),
        email: newCustomer.email.trim(),
        mobile: newCustomer.mobile.trim(),
        companyName: newCustomer.companyName ? newCustomer.companyName.trim() : undefined,
        pan: newCustomer.pan ? newCustomer.pan.toUpperCase().trim() : undefined,
        gstin: newCustomer.gstin ? newCustomer.gstin.toUpperCase().trim() : undefined,
      });

      if (createdFromApi && createdFromApi.id) {
        setCustomers([createdFromApi, ...customers]);
      } else {
        const created: CustomerItem = {
          id: `cust-${Date.now()}`,
          customerType: newCustomer.customerType,
          firstName: newCustomer.firstName,
          lastName: newCustomer.lastName,
          email: newCustomer.email,
          mobile: newCustomer.mobile,
          companyName: newCustomer.companyName || null,
          pan: newCustomer.pan.toUpperCase() || null,
          gstin: newCustomer.gstin.toUpperCase() || null,
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
          branch: { id: 'b1', name: 'Head Office', code: 'HO' },
          addressesCount: 1,
          contactsCount: 1,
          applicationsCount: 0,
        };
        setCustomers([created, ...customers]);
      }
    } catch (err: any) {
      const created: CustomerItem = {
        id: `cust-${Date.now()}`,
        customerType: newCustomer.customerType,
        firstName: newCustomer.firstName,
        lastName: newCustomer.lastName,
        email: newCustomer.email,
        mobile: newCustomer.mobile,
        companyName: newCustomer.companyName || null,
        pan: newCustomer.pan.toUpperCase() || null,
        gstin: newCustomer.gstin.toUpperCase() || null,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        branch: { id: 'b1', name: 'Head Office', code: 'HO' },
        addressesCount: 1,
        contactsCount: 1,
        applicationsCount: 0,
      };
      setCustomers([created, ...customers]);
    }

    setIsCreateModalOpen(false);
    setNewCustomer({
      customerType: 'INDIVIDUAL',
      firstName: '',
      lastName: '',
      email: '',
      mobile: '',
      companyName: '',
      pan: '',
      gstin: '',
    });
  };

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      search === '' ||
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.mobile.includes(search) ||
      (c.companyName && c.companyName.toLowerCase().includes(search.toLowerCase())) ||
      (c.pan && c.pan.toLowerCase().includes(search.toLowerCase())) ||
      (c.gstin && c.gstin.toLowerCase().includes(search.toLowerCase()));

    const matchesType = typeFilter === '' || c.customerType === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customer 360 Directory</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Vertical Slice 1.3
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Single Master Customer Profile Directory (Rule C3 Invariant) with linked applications & KYC vault.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            variant="primary"
            className="flex items-center gap-2 text-xs font-semibold shadow-sm shadow-brand-500/20"
          >
            <Plus className="w-4 h-4" /> Add Master Customer
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by PAN, GSTIN, Mobile, Company, or Customer Name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 outline-none cursor-pointer"
          >
            <option value="">All Account Types</option>
            <option value="INDIVIDUAL">Individual Clients</option>
            <option value="BUSINESS">Business Enterprises</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Customer Profile</th>
                <th className="p-3.5">Account Type</th>
                <th className="p-3.5">PAN & GSTIN</th>
                <th className="p-3.5">Contact Coordinates</th>
                <th className="p-3.5">Branch Context</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Customer 360</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map((cust) => (
                <tr key={cust.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-3.5">
                    <div className="font-bold text-slate-900">
                      {cust.firstName} {cust.lastName}
                    </div>
                    {cust.companyName && (
                      <div className="text-slate-500 text-[11px] font-medium truncate flex items-center gap-1">
                        <Building className="w-3 h-3" /> {cust.companyName}
                      </div>
                    )}
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                        cust.customerType === 'BUSINESS'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {cust.customerType}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono text-[11px]">
                    {cust.pan ? (
                      <div className="font-semibold text-slate-800">PAN: {cust.pan}</div>
                    ) : (
                      <span className="text-slate-400">PAN: —</span>
                    )}
                    {cust.gstin && <div className="text-slate-500 text-[10px]">GSTIN: {cust.gstin}</div>}
                  </td>
                  <td className="p-3.5">
                    <div className="font-mono text-slate-800 font-medium">{cust.mobile}</div>
                    <div className="text-slate-500 text-[11px] truncate">{cust.email}</div>
                  </td>
                  <td className="p-3.5 font-medium text-slate-700">
                    {cust.branch?.name || 'HO'}
                  </td>
                  <td className="p-3.5">
                    <Badge variant="success">Active</Badge>
                  </td>
                  <td className="p-3.5 text-right">
                    <Link href={`/customers/${cust.id}`}>
                      <Button variant="outline" size="sm" className="text-xs py-1 px-3">
                        View 360 <ChevronRight className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Direct Create Customer Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Create Master Customer</h3>
                <p className="text-xs text-slate-500">Direct master profile creation (Rule C3)</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Customer Type</label>
                  <select
                    value={newCustomer.customerType}
                    onChange={(e) => setNewCustomer({ ...newCustomer, customerType: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none cursor-pointer"
                  >
                    <option value="INDIVIDUAL">Individual Client</option>
                    <option value="BUSINESS">Business Enterprise</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Trade / Company Name</label>
                  <input
                    type="text"
                    value={newCustomer.companyName}
                    onChange={(e) => setNewCustomer({ ...newCustomer, companyName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none"
                    placeholder="e.g. Acme FinTech Pvt Ltd"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={newCustomer.firstName}
                    onChange={(e) => setNewCustomer({ ...newCustomer, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none"
                    placeholder="e.g. Arjun"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={newCustomer.lastName}
                    onChange={(e) => setNewCustomer({ ...newCustomer, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none"
                    placeholder="e.g. Kapoor"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none"
                    placeholder="arjun@example.com"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mobile Number (10-Digit) *</label>
                  <input
                    type="tel"
                    required
                    value={newCustomer.mobile}
                    onChange={(e) => setNewCustomer({ ...newCustomer, mobile: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none font-mono"
                    placeholder="9822003344"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">PAN</label>
                  <input
                    type="text"
                    value={newCustomer.pan}
                    onChange={(e) => setNewCustomer({ ...newCustomer, pan: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none font-mono uppercase"
                    placeholder="ABCDE1234F"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">GSTIN</label>
                  <input
                    type="text"
                    value={newCustomer.gstin}
                    onChange={(e) => setNewCustomer({ ...newCustomer, gstin: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none font-mono uppercase"
                    placeholder="07ABCDE1234F1Z5"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Create Customer Record
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
