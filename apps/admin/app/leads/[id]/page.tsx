'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Phone,
  Mail,
  Building,
  Calendar,
  Clock,
  User,
  UserCheck,
  Tag,
  Sparkles,
  Send,
  MessageSquare,
  PhoneCall,
  Video,
  FileText,
  UserPlus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import { Card, Button, Badge } from '@cc/ui';
import { LeadActivityType, LeadStatus } from '@cc/types';
import { crmApi, customerApi } from '../../../lib/api';

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.id as string;

  const [lead, setLead] = useState({
    id: leadId,
    firstName: 'Rajesh',
    lastName: 'Gupta',
    email: 'rajesh.gupta@apextech.in',
    mobile: '9876543210',
    companyName: 'Apex Technologies Pvt Ltd',
    status: 'QUALIFIED' as LeadStatus,
    leadScore: 85,
    notes: 'Interested in Private Limited Incorporation & GST Registration package. Needs quote by Friday.',
    campaign: 'GOOGLE_ADS_Q3',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    source: { name: 'Website', code: 'WEBSITE' },
    branch: { name: 'Head Office', code: 'HO', city: 'Noida' },
    assignedTo: { id: 'u1', firstName: 'Priya', lastName: 'Verma', email: 'priya.verma@crazycapital.in' },
  });

  const [activities, setActivities] = useState([
    {
      id: 'act-3',
      activityType: LeadActivityType.STATUS_CHANGE,
      notes: 'Status transitioned from CONTACTED to QUALIFIED — Budget and requirements confirmed.',
      performedBy: { firstName: 'Priya', lastName: 'Verma' },
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: 'act-2',
      activityType: LeadActivityType.CALL,
      notes: 'Outbound discovery call completed with Rajesh. 3 directors, capital size ₹10 Lakhs. Sent service proposal brochure.',
      performedBy: { firstName: 'Priya', lastName: 'Verma' },
      createdAt: new Date(Date.now() - 28800000).toISOString(),
    },
    {
      id: 'act-1',
      activityType: LeadActivityType.NOTE,
      notes: 'Inquiry captured via Website Landing Page consultation form.',
      performedBy: { firstName: 'System', lastName: 'Inbound' },
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ]);

  // Modal states
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  // New activity form
  const [activityType, setActivityType] = useState<LeadActivityType>(LeadActivityType.NOTE);
  const [activityNotes, setActivityNotes] = useState('');

  // Conversion form state
  const [convertForm, setConvertForm] = useState({
    customerType: 'BUSINESS',
    companyName: lead.companyName || '',
    pan: 'AABCA1234F',
    gstin: '07AABCA1234F1Z5',
    addressLine1: 'Tower A, Sector 62',
    city: 'Noida',
    state: 'Uttar Pradesh',
    pincode: '201309',
    contactName: `${lead.firstName} ${lead.lastName}`,
    contactMobile: lead.mobile,
  });

  const employees = [
    { id: 'u1', name: 'Priya Verma', role: 'Operations Executive (NOIDA)' },
    { id: 'u2', name: 'Amit Kumar', role: 'Branch Manager (HO)' },
    { id: 'u3', name: 'Suresh Nair', role: 'Operations Executive (DELHI)' },
    { id: 'u4', name: 'Ananya Deshmukh', role: 'Operations Executive (MUMBAI)' },
  ];

  React.useEffect(() => {
    async function loadLead() {
      try {
        const data: any = await crmApi.getLeadById(leadId);
        if (data && data.id) {
          setLead(data);
          if (data.activities && Array.isArray(data.activities)) {
            setActivities(data.activities);
          }
        }
      } catch (err) {
        console.info('Using local lead detail state');
      }
    }
    loadLead();
  }, [leadId]);

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityNotes.trim()) return;

    try {
      await crmApi.addLeadActivity(leadId, activityType, activityNotes.trim());
    } catch (err) {
      console.warn('API offline, adding locally');
    }

    const newAct = {
      id: `act-${Date.now()}`,
      activityType,
      notes: activityNotes.trim(),
      performedBy: { firstName: 'Super', lastName: 'Admin' },
      createdAt: new Date().toISOString(),
    };

    setActivities([newAct, ...activities]);
    setActivityNotes('');
  };

  const handleAssign = async (empId: string) => {
    const selected = employees.find((e) => e.id === empId);
    if (!selected) return;

    try {
      await crmApi.assignLead(leadId, empId, `Assigned to ${selected.name}`);
    } catch (err) {
      console.warn('API offline, updating locally');
    }

    setLead({
      ...lead,
      assignedTo: { id: selected.id, firstName: selected.name.split(' ')[0], lastName: selected.name.split(' ')[1], email: 'staff@crazycapital.in' },
    });

    const assignAct = {
      id: `act-${Date.now()}`,
      activityType: LeadActivityType.NOTE,
      notes: `Lead re-assigned to ${selected.name} (${selected.role})`,
      performedBy: { firstName: 'Super', lastName: 'Admin' },
      createdAt: new Date().toISOString(),
    };
    setActivities([assignAct, ...activities]);
    setIsAssignModalOpen(false);
  };

  const handleConvertLead = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await customerApi.convertLead(leadId, {
        customerType: convertForm.customerType,
        companyName: convertForm.companyName || undefined,
        pan: convertForm.pan || undefined,
        gstin: convertForm.gstin || undefined,
        address: {
          type: 'REGISTERED',
          addressLine1: convertForm.addressLine1,
          city: convertForm.city,
          state: convertForm.state,
          pincode: convertForm.pincode,
          country: 'India',
        },
        contact: {
          name: convertForm.contactName,
          mobile: convertForm.contactMobile,
        },
      });
    } catch (err: any) {
      console.warn('Conversion API offline, demonstrating locally', err.message);
    }

    setLead({ ...lead, status: LeadStatus.CONVERTED });

    const convAct = {
      id: `act-${Date.now()}`,
      activityType: LeadActivityType.STATUS_CHANGE,
      notes: `Lead successfully converted to master Customer profile (PAN: ${convertForm.pan}). Rule C3 Master Customer profile created.`,
      performedBy: { firstName: 'Super', lastName: 'Admin' },
      createdAt: new Date().toISOString(),
    };
    setActivities([convAct, ...activities]);
    setIsConvertModalOpen(false);

    alert(`🎉 Lead converted to Customer! Redirecting to Customer 360 profile...`);
    router.push('/customers');
  };

  const handleStatusTransition = async (newStatus: LeadStatus) => {
    try {
      await crmApi.updateLeadStatus(leadId, newStatus, `Status transitioned to ${newStatus}`);
    } catch (err: any) {
      console.warn('Status update API offline, updating locally', err.message);
    }

    setLead({ ...lead, status: newStatus });
    const transAct = {
      id: `act-${Date.now()}`,
      activityType: LeadActivityType.STATUS_CHANGE,
      notes: `Status transitioned to ${newStatus}`,
      performedBy: { firstName: 'Super', lastName: 'Admin' },
      createdAt: new Date().toISOString(),
    };
    setActivities([transAct, ...activities]);
    setIsStatusModalOpen(false);
  };

  const getActivityIcon = (type: LeadActivityType | string) => {
    switch (type) {
      case LeadActivityType.CALL:
        return <PhoneCall className="w-4 h-4 text-blue-600" />;
      case LeadActivityType.EMAIL:
        return <Mail className="w-4 h-4 text-purple-600" />;
      case LeadActivityType.WHATSAPP:
        return <MessageSquare className="w-4 h-4 text-emerald-600" />;
      case LeadActivityType.MEETING:
        return <Video className="w-4 h-4 text-amber-600" />;
      case LeadActivityType.STATUS_CHANGE:
        return <RefreshCw className="w-4 h-4 text-teal-600" />;
      default:
        return <FileText className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/leads"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">
                {lead.firstName} {lead.lastName}
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                {lead.status}
              </span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
                Score {lead.leadScore}/100
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {lead.companyName || 'Individual Client'} • Captured on {new Date(lead.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAssignModalOpen(true)}
            className="text-xs font-semibold"
          >
            <UserPlus className="w-3.5 h-3.5 mr-1.5" /> Reassign
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsStatusModalOpen(true)}
            className="text-xs font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Update Status
          </Button>

          {lead.status !== 'CONVERTED' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsConvertModalOpen(true)}
              className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-500/20"
            >
              <UserCheck className="w-3.5 h-3.5 mr-1.5" /> Convert to Customer 360
            </Button>
          )}
        </div>
      </div>

      {/* State Machine Visualizer */}
      <Card className="p-4 bg-white border-slate-200">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          State Machine Progression (Vertical Slice 1.2)
        </div>
        <div className="flex items-center justify-between max-w-3xl mx-auto overflow-x-auto py-2">
          {(['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'CONVERTED'] as LeadStatus[]).map((st, idx, arr) => {
            const isCompleted = ['NEW', 'CONTACTED', 'QUALIFIED'].includes(st);
            const isCurrent = lead.status === st;
            return (
              <React.Fragment key={st}>
                <div className="flex flex-col items-center shrink-0">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      isCurrent
                        ? 'bg-brand-600 text-white ring-4 ring-brand-100 shadow-md'
                        : isCompleted
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isCompleted && !isCurrent ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>
                  <span
                    className={`text-[11px] font-semibold mt-1.5 ${
                      isCurrent ? 'text-brand-700 font-bold' : isCompleted ? 'text-slate-700' : 'text-slate-400'
                    }`}
                  >
                    {st}
                  </span>
                </div>
                {idx < arr.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 ${
                      isCompleted ? 'bg-emerald-400' : 'bg-slate-200'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </Card>

      {/* Main Grid: Details + Timeline Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Lead Profile & Assignment */}
        <div className="space-y-6">
          {/* Contact Details Card */}
          <Card className="p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Lead Master Information
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> Mobile Phone
                </span>
                <span className="font-mono font-bold text-slate-900">{lead.mobile}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Email
                </span>
                <span className="text-slate-900 font-medium">{lead.email || '—'}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5" /> Company Entity
                </span>
                <span className="text-slate-900 font-semibold">{lead.companyName || '—'}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" /> Lead Source
                </span>
                <span className="px-2 py-0.5 bg-brand-50 text-brand-700 font-semibold rounded">
                  {lead.source?.name}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5" /> Assigned Branch
                </span>
                <span className="text-slate-900 font-medium">{lead.branch?.name}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Assigned Executive
                </span>
                <span className="font-semibold text-slate-900">
                  {lead.assignedTo ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}` : 'Unassigned'}
                </span>
              </div>
            </div>

            {lead.notes && (
              <div className="pt-3 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Inquiry Note</span>
                <p className="text-xs text-slate-700 mt-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100 italic">
                  "{lead.notes}"
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Activity Feed & Composer */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Activity Composer */}
          <Card className="p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Log Timeline Activity</h3>
            <form onSubmit={handleAddActivity} className="space-y-3">
              <div className="flex items-center gap-2">
                {(
                  [
                    { type: LeadActivityType.NOTE, label: 'Note', icon: FileText },
                    { type: LeadActivityType.CALL, label: 'Call Log', icon: PhoneCall },
                    { type: LeadActivityType.WHATSAPP, label: 'WhatsApp', icon: MessageSquare },
                    { type: LeadActivityType.MEETING, label: 'Meeting', icon: Video },
                    { type: LeadActivityType.EMAIL, label: 'Email', icon: Mail },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.type}
                    type="button"
                    onClick={() => setActivityType(t.type)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      activityType === t.type
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <t.icon className="w-3 h-3" /> {t.label}
                  </button>
                ))}
              </div>

              <textarea
                rows={2}
                value={activityNotes}
                onChange={(e) => setActivityNotes(e.target.value)}
                placeholder="Type activity details, customer discussion notes, or next action items..."
                className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50 focus:bg-white"
              />

              <div className="flex justify-end">
                <Button type="submit" size="sm" variant="primary" className="text-xs font-semibold">
                  <Send className="w-3.5 h-3.5 mr-1.5" /> Post to Timeline
                </Button>
              </div>
            </form>
          </Card>

          {/* Chronological Activity Feed */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Activity History & Audit Trail</h3>

            <div className="space-y-3">
              {activities.map((act) => (
                <div
                  key={act.id}
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-start gap-3"
                >
                  <div className="p-2 rounded-xl bg-slate-100 shrink-0 mt-0.5">
                    {getActivityIcon(act.activityType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900">
                        {act.performedBy.firstName} {act.performedBy.lastName}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 mt-1 leading-relaxed">{act.notes}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Convert to Customer Modal */}
      {isConvertModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-emerald-600" />
                  Convert Lead to Master Customer 360
                </h3>
                <p className="text-xs text-slate-500">Atomic transaction enforcing Rule C3 Single Master Profile</p>
              </div>
              <button onClick={() => setIsConvertModalOpen(false)} className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConvertLead} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Customer Type</label>
                  <select
                    value={convertForm.customerType}
                    onChange={(e) => setConvertForm({ ...convertForm, customerType: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none cursor-pointer"
                  >
                    <option value="INDIVIDUAL">Individual Client</option>
                    <option value="BUSINESS">Business Entity / Company</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Company Trade Name</label>
                  <input
                    type="text"
                    value={convertForm.companyName}
                    onChange={(e) => setConvertForm({ ...convertForm, companyName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">PAN Number</label>
                  <input
                    type="text"
                    value={convertForm.pan}
                    onChange={(e) => setConvertForm({ ...convertForm, pan: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none font-mono uppercase"
                    placeholder="ABCDE1234F"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">GSTIN Number</label>
                  <input
                    type="text"
                    value={convertForm.gstin}
                    onChange={(e) => setConvertForm({ ...convertForm, gstin: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none font-mono uppercase"
                    placeholder="07ABCDE1234F1Z5"
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <span className="font-bold text-slate-900 block mb-2">Registered Address</span>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={convertForm.addressLine1}
                    onChange={(e) => setConvertForm({ ...convertForm, addressLine1: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none"
                    placeholder="Address Line 1"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={convertForm.city}
                      onChange={(e) => setConvertForm({ ...convertForm, city: e.target.value })}
                      className="px-3 py-2 border border-slate-200 rounded-lg outline-none"
                      placeholder="City"
                    />
                    <input
                      type="text"
                      value={convertForm.state}
                      onChange={(e) => setConvertForm({ ...convertForm, state: e.target.value })}
                      className="px-3 py-2 border border-slate-200 rounded-lg outline-none"
                      placeholder="State"
                    />
                    <input
                      type="text"
                      value={convertForm.pincode}
                      onChange={(e) => setConvertForm({ ...convertForm, pincode: e.target.value })}
                      className="px-3 py-2 border border-slate-200 rounded-lg outline-none font-mono"
                      placeholder="PIN Code"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsConvertModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                  Execute Atomic Conversion
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reassign Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Reassign Lead</h3>
              <button onClick={() => setIsAssignModalOpen(false)} className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-4 space-y-2">
              {employees.map((emp) => (
                <button
                  key={emp.id}
                  onClick={() => handleAssign(emp.id)}
                  className="w-full p-3 rounded-xl border border-slate-200 hover:border-brand-500 hover:bg-brand-50/50 text-left flex items-center justify-between transition-colors"
                >
                  <div>
                    <div className="font-bold text-xs text-slate-900">{emp.name}</div>
                    <div className="text-[11px] text-slate-500">{emp.role}</div>
                  </div>
                  <UserPlus className="w-4 h-4 text-slate-400" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Select Next Status</h3>
              <button onClick={() => setIsStatusModalOpen(false)} className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-4 space-y-2">
              {(['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'LOST'] as LeadStatus[]).map((st) => (
                <button
                  key={st}
                  onClick={() => handleStatusTransition(st)}
                  className="w-full p-3 rounded-xl border border-slate-200 hover:border-brand-500 hover:bg-brand-50/50 text-left flex items-center justify-between transition-colors text-xs font-bold text-slate-800"
                >
                  <span>{st}</span>
                  {lead.status === st && <span className="text-[10px] text-brand-600 font-semibold">Current</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
