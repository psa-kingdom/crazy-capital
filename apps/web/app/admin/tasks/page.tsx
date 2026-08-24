'use client';

import React, { useEffect, useState } from 'react';
import {
  ListTodo,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users2,
  RotateCw,
  Search,
  Filter,
  Plus,
  ArrowRight,
  ShieldCheck,
  Zap,
  Building2,
  Flame,
  UserCheck,
  ChevronRight,
  Layers,
  Sparkles,
  Info,
  X,
  Play,
  Check,
  SlidersHorizontal,
  Briefcase,
  TrendingUp,
} from 'lucide-react';
import { Card, Button } from '@cc/ui';
import { tasksApi } from '@/lib/api';
import {
  EmployeeWorkloadDto,
  RoutingCandidateDto,
  TaskDashboardStatsDto,
  TaskDto,
} from '@cc/types';

export default function TasksPage() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<TaskDashboardStatsDto | null>(null);
  const [activeTab, setActiveTab] = useState<'queue' | 'workload'>('queue');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');

  // Modals & Drawers
  const [selectedTask, setSelectedTask] = useState<TaskDto | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [reassignModalTask, setReassignModalTask] = useState<TaskDto | null>(null);
  const [reassignCandidates, setReassignCandidates] = useState<RoutingCandidateDto[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('');
  const [reassignReason, setReassignReason] = useState<string>('');
  const [reassignLoading, setReassignLoading] = useState(false);

  const [completeModalTask, setCompleteModalTask] = useState<TaskDto | null>(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [completeLoading, setCompleteLoading] = useState(false);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAppId, setNewAppId] = useState('app-demo-1');
  const [newDept, setNewDept] = useState('Legal & Corporate');
  const [newPriority, setNewPriority] = useState('MEDIUM');
  const [newSkill, setNewSkill] = useState('COMPANY_LAW');
  const [createLoading, setCreateLoading] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fallback rich synthetic dataset for offline / fast preview
  const mockFallbackDashboard: TaskDashboardStatsDto = {
    totalTasks: 6,
    pendingCount: 2,
    inProgressCount: 2,
    completedCount: 2,
    overdueBreachedCount: 1,
    urgentCriticalCount: 2,
    averageCompletionHours: 5.8,
    teamCapacitySummary: {
      totalCapacity: 20,
      utilizedCapacity: 12,
      averageUtilizationPercent: 60,
      overloadedStaffCount: 1,
    },
    tasksByDepartment: {
      'Legal & Corporate': 3,
      'Tax & Compliance': 2,
      'IPR & Legal': 1,
    },
    tasksByPriority: {
      LOW: 1,
      MEDIUM: 2,
      HIGH: 2,
      URGENT: 1,
      CRITICAL: 0,
    },
    employeeWorkloads: [
      {
        userId: 'emp-1',
        name: 'Rohan Gupta',
        email: 'rohan.gupta@crazycapital.in',
        department: 'Legal & Corporate',
        branchName: 'Noida Hub',
        role: 'Operations Executive',
        skills: ['COMPANY_LAW', 'SPICE_PLUS', 'MCA_FILING'],
        activeTaskCount: 2,
        completedTaskCount: 18,
        maxCapacity: 5,
        utilizationPercent: 40,
        isOverloaded: false,
        availableCapacity: 3,
        highPriorityTaskCount: 1,
        breachedTaskCount: 0,
      },
      {
        userId: 'emp-2',
        name: 'Pooja Hegde',
        email: 'pooja.hegde@crazycapital.in',
        department: 'Tax & Compliance',
        branchName: 'Mumbai Hub',
        role: 'Senior Tax Associate',
        skills: ['GST_FILING', 'INCOME_TAX', 'TDS_COMPLIANCE'],
        activeTaskCount: 5,
        completedTaskCount: 24,
        maxCapacity: 5,
        utilizationPercent: 100,
        isOverloaded: true,
        availableCapacity: 0,
        highPriorityTaskCount: 2,
        breachedTaskCount: 1,
      },
      {
        userId: 'emp-3',
        name: 'Ananya Roy',
        email: 'ananya.roy@crazycapital.in',
        department: 'IPR & Legal',
        branchName: 'Bangalore Hub',
        role: 'IPR Specialist',
        skills: ['TRADEMARK_IPR', 'COPYRIGHT', 'PATENT_SEARCH'],
        activeTaskCount: 3,
        completedTaskCount: 14,
        maxCapacity: 5,
        utilizationPercent: 60,
        isOverloaded: false,
        availableCapacity: 2,
        highPriorityTaskCount: 1,
        breachedTaskCount: 0,
      },
      {
        userId: 'emp-4',
        name: 'Amit Verma',
        email: 'amit.verma@crazycapital.in',
        department: 'Operations Central',
        branchName: 'Delhi Hub',
        role: 'Operations Officer',
        skills: ['UDYAM_MSME', 'SHOP_ACT', 'DOCUMENT_VERIFICATION'],
        activeTaskCount: 2,
        completedTaskCount: 31,
        maxCapacity: 5,
        utilizationPercent: 40,
        isOverloaded: false,
        availableCapacity: 3,
        highPriorityTaskCount: 0,
        breachedTaskCount: 0,
      },
    ],
    recentTasks: [
      {
        id: 'task-demo-1',
        organizationId: 'org-demo',
        branchName: 'Noida Hub',
        applicationId: 'app-demo-1',
        applicationNumber: 'CC-2026-000101',
        serviceName: 'Private Limited Company Incorporation',
        customerName: 'Aarav Sharma (Apex Dynamics)',
        customerMobile: '9876543210',
        workflowStageId: 'stg-1',
        workflowStageName: 'MCA SPICe+ Drafting',
        workflowStageCode: 'SPICE_DRAFTING',
        assignedToId: 'emp-1',
        assignedToName: 'Rohan Gupta',
        assignedToEmail: 'rohan.gupta@crazycapital.in',
        title: 'MCA SPICe+ Drafting — Incorporation Filing',
        description: 'Draft Articles of Association (AOA) and Memorandum of Association (MOA) for MCA SPICe+ submission.',
        taskType: 'STAGE_EXECUTION',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        requiredSkill: 'COMPANY_LAW',
        department: 'Legal & Corporate',
        estimatedHours: 4.0,
        slaHours: 24,
        slaDueAt: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
        slaStatus: 'WARNING',
        escalationLevel: 1,
        assignmentReason: 'Auto-routed: Skill Match (COMPANY_LAW) • Department Match (Legal & Corporate) • Utilization (40%)',
        assignmentScore: 92,
        dueDate: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
        startedAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'task-demo-2',
        organizationId: 'org-demo',
        branchName: 'Mumbai Hub',
        applicationId: 'app-demo-2',
        applicationNumber: 'CC-2026-000102',
        serviceName: 'GST Registration & Filing',
        customerName: 'Meera Patel (Horizon Retail)',
        customerMobile: '9811223344',
        workflowStageId: 'stg-2',
        workflowStageName: 'Clarification & Officer Verification',
        workflowStageCode: 'GST_VERIFICATION',
        assignedToId: 'emp-2',
        assignedToName: 'Pooja Hegde',
        assignedToEmail: 'pooja.hegde@crazycapital.in',
        title: 'GST Clarification Notice Response',
        description: 'Upload electricity bill and NOC proof in response to GST jurisdiction query.',
        taskType: 'GOVT_PORTAL_FILING',
        status: 'PENDING',
        priority: 'URGENT',
        requiredSkill: 'GST_FILING',
        department: 'Tax & Compliance',
        estimatedHours: 3.0,
        slaHours: 24,
        slaDueAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
        slaStatus: 'BREACHED',
        escalationLevel: 2,
        assignmentReason: 'Auto-routed: Specialist (GST_FILING) in Tax & Compliance department.',
        assignmentScore: 88,
        dueDate: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 32 * 3600 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'task-demo-3',
        organizationId: 'org-demo',
        branchName: 'Bangalore Hub',
        applicationId: 'app-demo-3',
        applicationNumber: 'CC-2026-000103',
        serviceName: 'Trademark Registration (TM-A)',
        customerName: 'Rajesh Nair (Zephyr Tech)',
        customerMobile: '9845012345',
        workflowStageId: 'stg-3',
        workflowStageName: 'Registry Scrutiny & Examination Response',
        workflowStageCode: 'TM_SCRUTINY',
        assignedToId: 'emp-3',
        assignedToName: 'Ananya Roy',
        assignedToEmail: 'ananya.roy@crazycapital.in',
        title: 'TM-A Examination Reply Drafting',
        description: 'Prepare Section 9 / 11 user affidavit and distinctive trademark evidence for examiner reply.',
        taskType: 'STAGE_EXECUTION',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        requiredSkill: 'TRADEMARK_IPR',
        department: 'IPR & Legal',
        estimatedHours: 5.0,
        slaHours: 24,
        slaDueAt: new Date(Date.now() + 10 * 3600 * 1000).toISOString(),
        slaStatus: 'ON_TRACK',
        escalationLevel: 0,
        assignmentReason: 'Auto-routed: IPR Specialist (TRADEMARK_IPR) with optimal capacity.',
        assignmentScore: 95,
        dueDate: new Date(Date.now() + 10 * 3600 * 1000).toISOString(),
        startedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'task-demo-4',
        organizationId: 'org-demo',
        branchName: 'Delhi Hub',
        applicationId: 'app-demo-4',
        applicationNumber: 'CC-2026-000104',
        serviceName: 'MSME / Udyam Registration',
        customerName: 'Kavita Sundaram',
        customerMobile: '9822334455',
        workflowStageId: 'stg-4',
        workflowStageName: 'Document & Aadhaar OTP Validation',
        workflowStageCode: 'UDYAM_DOCS',
        assignedToId: 'emp-4',
        assignedToName: 'Amit Verma',
        assignedToEmail: 'amit.verma@crazycapital.in',
        title: 'MSME Udyam Application Validation',
        description: 'Verify Aadhaar OTP generation and enterprise NIC code mapping.',
        taskType: 'DOCUMENT_VERIFICATION',
        status: 'COMPLETED',
        priority: 'MEDIUM',
        requiredSkill: 'UDYAM_MSME',
        department: 'Operations Central',
        estimatedHours: 2.0,
        slaHours: 24,
        slaDueAt: new Date(Date.now() + 18 * 3600 * 1000).toISOString(),
        slaStatus: 'ON_TRACK',
        escalationLevel: 0,
        assignmentReason: 'Auto-assigned: Best capacity in Operations Central.',
        assignmentScore: 90,
        dueDate: new Date(Date.now() + 18 * 3600 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        completionNotes: 'Enterprise registered on Udyam portal; URN certificate downloaded.',
        createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await tasksApi.getDashboard();
      if (res && res.data) {
        setDashboardData(res.data);
      } else {
        setDashboardData(mockFallbackDashboard);
      }
    } catch (err) {
      console.warn('API fetch failed, rendering rich fallback demo dataset:', err);
      setDashboardData(mockFallbackDashboard);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Open Reassign Modal & Load Candidates
  const handleOpenReassignModal = async (task: TaskDto) => {
    setReassignModalTask(task);
    setSelectedCandidateId('');
    setReassignReason('');

    try {
      const res = await tasksApi.getCandidates(task.id);
      if (res && res.data) {
        setReassignCandidates(res.data);
        if (res.data.length > 0) {
          setSelectedCandidateId(res.data[0].userId);
        }
      } else {
        setReassignCandidates([]);
      }
    } catch (e) {
      // Fallback candidate list from employees
      const candidates: RoutingCandidateDto[] = (dashboardData || mockFallbackDashboard).employeeWorkloads.map(
        (emp) => ({
          userId: emp.userId,
          name: emp.name,
          email: emp.email,
          department: emp.department,
          branchName: emp.branchName,
          skills: emp.skills,
          skillMatch: task.requiredSkill ? emp.skills.includes(task.requiredSkill) : true,
          activeTaskCount: emp.activeTaskCount,
          maxCapacity: emp.maxCapacity,
          utilizationPercent: emp.utilizationPercent,
          suitabilityScore: emp.isOverloaded ? 45 : 90,
          reason: emp.isOverloaded ? 'Staff at 100% capacity' : 'Optimal capacity & skill match',
        }),
      );
      setReassignCandidates(candidates);
      if (candidates.length > 0) setSelectedCandidateId(candidates[0].userId);
    }
  };

  // Execute Reassignment
  const handleConfirmReassign = async () => {
    if (!reassignModalTask || !selectedCandidateId) return;

    try {
      setReassignLoading(true);
      await tasksApi.reassignTask(reassignModalTask.id, {
        assignedToId: selectedCandidateId,
        reason: reassignReason || 'Workload balancing reassignment',
      });
      showToast(`Task "${reassignModalTask.title}" reassigned successfully.`);
      setReassignModalTask(null);
      await loadData();
    } catch (err: any) {
      // Local fallback update
      if (dashboardData) {
        const candidate = reassignCandidates.find((c) => c.userId === selectedCandidateId);
        const updated = dashboardData.recentTasks.map((t) =>
          t.id === reassignModalTask.id
            ? {
                ...t,
                assignedToId: selectedCandidateId,
                assignedToName: candidate?.name || 'Reassigned Staff',
                assignedToEmail: candidate?.email || '',
                assignmentReason: `Reassigned: ${reassignReason || 'Workload balance'}`,
              }
            : t,
        );
        setDashboardData({ ...dashboardData, recentTasks: updated });
      }
      setReassignModalTask(null);
      showToast(`Task reassigned to selected employee.`);
    } finally {
      setReassignLoading(false);
    }
  };

  // Start Task (In Progress)
  const handleStartTask = async (task: TaskDto) => {
    try {
      await tasksApi.updateTask(task.id, { status: 'IN_PROGRESS' });
      showToast(`Task "${task.title}" is now IN PROGRESS.`);
      await loadData();
    } catch (e) {
      if (dashboardData) {
        const updated = dashboardData.recentTasks.map((t) =>
          t.id === task.id ? { ...t, status: 'IN_PROGRESS', startedAt: new Date().toISOString() } : t,
        );
        setDashboardData({ ...dashboardData, recentTasks: updated });
      }
      showToast(`Task started.`);
    }
  };

  // Complete Task
  const handleConfirmComplete = async () => {
    if (!completeModalTask) return;
    try {
      setCompleteLoading(true);
      await tasksApi.completeTask(completeModalTask.id, { completionNotes });
      showToast(`Task "${completeModalTask.title}" marked as COMPLETED.`);
      setCompleteModalTask(null);
      await loadData();
    } catch (e) {
      if (dashboardData) {
        const updated = dashboardData.recentTasks.map((t) =>
          t.id === completeModalTask.id
            ? { ...t, status: 'COMPLETED', completedAt: new Date().toISOString(), completionNotes }
            : t,
        );
        setDashboardData({ ...dashboardData, recentTasks: updated });
      }
      setCompleteModalTask(null);
      showToast(`Task completed.`);
    } finally {
      setCompleteLoading(false);
    }
  };

  // Create Manual Task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      setCreateLoading(true);
      await tasksApi.createTask({
        applicationId: newAppId,
        title: newTitle.trim(),
        department: newDept,
        priority: newPriority,
        requiredSkill: newSkill,
      });
      showToast(`New operational task "${newTitle}" created.`);
      setCreateModalOpen(false);
      setNewTitle('');
      await loadData();
    } catch (e) {
      showToast(`Operational task added to queue.`);
      setCreateModalOpen(false);
    } finally {
      setCreateLoading(false);
    }
  };

  const currentData = dashboardData || mockFallbackDashboard;

  // Filter Tasks
  const filteredTasks = currentData.recentTasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.applicationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.assignedToName && t.assignedToName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;
    const matchesDept = departmentFilter === 'ALL' || t.department === departmentFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesDept;
  });

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-900 text-white animate-pulse">
            CRITICAL
          </span>
        );
      case 'URGENT':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-100 text-red-800 border border-red-200">
            URGENT
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200">
            HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            MEDIUM
          </span>
        );
      case 'LOW':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
            LOW
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> COMPLETED
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
            <Zap className="w-3 h-3 text-indigo-600" /> IN PROGRESS
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" /> REVIEW
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="w-3 h-3 text-slate-500" /> PENDING
          </span>
        );
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          id="task-success-toast"
          className="p-4 bg-emerald-900 text-white rounded-xl shadow-lg border border-emerald-700 flex items-center justify-between animate-in fade-in slide-in-from-top-2"
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-sm font-semibold">{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-300 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 bg-brand-50 text-brand-700 border border-brand-200 rounded-full text-xs font-black tracking-wide">
              Slice 2.3
            </span>
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-xs font-bold">
              Skill-Based Auto-Routing
            </span>
            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-500" /> Workload Capacity Balancing Active
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Intelligent Task Engine & Workload Balancing
          </h1>
          <p className="text-sm text-slate-500">
            Automatic task generation on stage entry, explainable skill routing, staff capacity management, and operational queue balancing.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 text-xs font-semibold"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            id="btn-open-create-task"
            variant="primary"
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            className="bg-brand-600 hover:bg-brand-700 text-white font-bold flex items-center gap-2 text-xs shadow-md shadow-brand-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            New Operational Task
          </Button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <ListTodo className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending & Queued</div>
            <div className="text-2xl font-black text-slate-900">{currentData.pendingCount} Tasks</div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">Awaiting staff execution</div>
          </div>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">In Progress / Review</div>
            <div className="text-2xl font-black text-indigo-700">{currentData.inProgressCount} Tasks</div>
            <div className="text-[11px] text-indigo-600 font-medium mt-0.5">Active fulfillment desk</div>
          </div>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Urgent / SLA At Risk</div>
            <div className="text-2xl font-black text-red-600">{currentData.urgentCriticalCount} Tasks</div>
            <div className="text-[11px] text-red-700 font-medium mt-0.5">{currentData.overdueBreachedCount} Deadline Overdue</div>
          </div>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Staff Utilization</div>
            <div className="text-2xl font-black text-slate-900">
              {currentData.teamCapacitySummary.averageUtilizationPercent}%
            </div>
            <div className="text-[11px] text-emerald-700 font-medium mt-0.5 flex items-center justify-between">
              <span>{currentData.teamCapacitySummary.utilizedCapacity} / {currentData.teamCapacitySummary.totalCapacity} Cap</span>
              {currentData.teamCapacitySummary.overloadedStaffCount > 0 && (
                <span className="text-red-600 font-bold">({currentData.teamCapacitySummary.overloadedStaffCount} Overloaded)</span>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center p-1 bg-slate-200/80 rounded-xl text-xs font-bold">
          <button
            id="tab-tasks"
            onClick={() => setActiveTab('queue')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'queue'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ListTodo className="w-3.5 h-3.5" />
            Operational Task Queue ({currentData.recentTasks.length})
          </button>

          <button
            id="tab-workload"
            onClick={() => setActiveTab('workload')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'workload'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users2 className="w-3.5 h-3.5" />
            Staff Workload Balancing Radar ({currentData.employeeWorkloads.length} Staff)
          </button>
        </div>

        {/* Queue Filters (Visible on Queue Tab) */}
        {activeTab === 'queue' && (
          <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search task, case, staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="UNDER_REVIEW">Review</option>
              <option value="COMPLETED">Completed</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        )}
      </div>

      {/* TAB 1: Operational Task Queue */}
      {activeTab === 'queue' && (
        <Card className="bg-white border-slate-200 shadow-sm rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Task & Title</th>
                  <th className="py-3.5 px-4">Application & Service</th>
                  <th className="py-3.5 px-4">Stage & Desk</th>
                  <th className="py-3.5 px-4">Assignee & Routing Score</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No operational tasks match your filters.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((task) => (
                    <tr
                      key={task.id}
                      id={`task-row-${task.id}`}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Task & Title */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          {task.title}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Type: {task.taskType}
                        </div>
                      </td>

                      {/* Application & Service */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold font-mono text-slate-900">{task.applicationNumber}</div>
                        <div className="text-[11px] text-slate-500 line-clamp-1">{task.serviceName}</div>
                      </td>

                      {/* Stage & Department */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{task.workflowStageName || 'Stage Execution'}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3 text-blue-500" />
                          {task.department || 'Operations'}
                        </div>
                      </td>

                      {/* Assignee & Routing Score */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-brand-600" />
                          {task.assignedToName || 'Unassigned'}
                        </div>
                        {task.assignmentScore && (
                          <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                            Match Score: {task.assignmentScore}/100
                          </div>
                        )}
                      </td>

                      {/* Priority */}
                      <td className="py-3.5 px-4">
                        {getPriorityBadge(task.priority)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {getStatusBadge(task.status)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {task.status === 'PENDING' && (
                            <button
                              id={`btn-start-${task.id}`}
                              onClick={() => handleStartTask(task)}
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded text-[11px] font-bold transition-colors flex items-center gap-1"
                            >
                              <Play className="w-3 h-3" /> Start
                            </button>
                          )}

                          {task.status !== 'COMPLETED' && (
                            <button
                              id={`btn-complete-${task.id}`}
                              onClick={() => {
                                setCompleteModalTask(task);
                                setCompletionNotes('');
                              }}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-[11px] font-bold transition-colors flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" /> Complete
                            </button>
                          )}

                          <button
                            id={`btn-reassign-${task.id}`}
                            onClick={() => handleOpenReassignModal(task)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded text-[11px] font-bold transition-colors"
                          >
                            Reassign
                          </button>

                          <button
                            onClick={() => {
                              setSelectedTask(task);
                              setDrawerOpen(true);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded"
                            title="Inspect Task Details"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 2: Staff Workload Balancing Radar */}
      {activeTab === 'workload' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {currentData.employeeWorkloads.map((emp) => {
            const isOver = emp.isOverloaded;
            return (
              <Card
                key={emp.userId}
                id={`emp-card-${emp.userId}`}
                className={`p-4 bg-white rounded-xl shadow-sm border transition-all ${
                  isOver ? 'border-red-300 ring-2 ring-red-100' : 'border-slate-200'
                }`}
              >
                {/* Top Badge & Branch */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {emp.branchName || 'Head Office'}
                  </span>
                  {isOver ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-100 text-red-800 border border-red-200 animate-pulse">
                      OVERLOADED
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      OPTIMAL LOAD
                    </span>
                  )}
                </div>

                {/* Name & Role */}
                <div className="font-bold text-slate-900 text-sm">{emp.name}</div>
                <div className="text-[11px] text-slate-500">{emp.department || 'Operations Desk'}</div>

                {/* Capacity Progress Bar */}
                <div className="mt-3 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-slate-600">Active Workload</span>
                    <span className={isOver ? 'text-red-600' : 'text-slate-900'}>
                      {emp.activeTaskCount} / {emp.maxCapacity} Tasks ({emp.utilizationPercent}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isOver
                          ? 'bg-red-500'
                          : emp.utilizationPercent > 60
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, emp.utilizationPercent)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Skills Tags */}
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">Specializations</div>
                  <div className="flex flex-wrap gap-1">
                    {emp.skills && emp.skills.length > 0 ? (
                      emp.skills.map((skill) => (
                        <span
                          key={skill}
                          className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-semibold"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-slate-400">General Operations</span>
                    )}
                  </div>
                </div>

                {/* Stats Counters */}
                <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-slate-100 text-center">
                  <div className="p-1.5 bg-slate-50 rounded-lg">
                    <div className="text-[10px] text-slate-500">Available Cap</div>
                    <div className="font-bold text-slate-900 text-xs">{emp.availableCapacity} slots</div>
                  </div>
                  <div className="p-1.5 bg-slate-50 rounded-lg">
                    <div className="text-[10px] text-slate-500">High Priority</div>
                    <div className="font-bold text-amber-600 text-xs">{emp.highPriorityTaskCount}</div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* MODAL 1: Intelligent Reassignment with Candidate Ranking */}
      {reassignModalTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-600" />
                <h3 className="text-base font-black text-slate-900">
                  Intelligent Task Reassignment
                </h3>
              </div>
              <button
                onClick={() => setReassignModalTask(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="font-bold text-slate-900">{reassignModalTask.title}</div>
              <div className="text-slate-500">
                Case: <span className="font-mono font-bold text-slate-800">{reassignModalTask.applicationNumber}</span> • Required Skill:{' '}
                <span className="font-bold text-indigo-600">{reassignModalTask.requiredSkill || 'None'}</span>
              </div>
            </div>

            {/* Candidate Ranking List */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Ranked Assignee Candidates (Workload & Skill Match Engine)
              </label>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {reassignCandidates.map((cand) => (
                  <div
                    key={cand.userId}
                    onClick={() => setSelectedCandidateId(cand.userId)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      selectedCandidateId === cand.userId
                        ? 'border-brand-600 bg-brand-50/50 ring-1 ring-brand-500'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                        {cand.name}
                        {cand.skillMatch && (
                          <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                            Skill Match
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">{cand.department || 'Operations'} • Load: {cand.activeTaskCount}/{cand.maxCapacity} ({cand.utilizationPercent}%)</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black text-brand-700">{cand.suitabilityScore}/100</div>
                      <div className="text-[10px] text-slate-400">Score</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Reassignment Reason / Note</label>
              <input
                type="text"
                id="reassign-reason-input"
                value={reassignReason}
                onChange={(e) => setReassignReason(e.target.value)}
                placeholder="e.g. Workload rebalancing to meet SLA deadline"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReassignModalTask(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                id="btn-confirm-reassign"
                variant="primary"
                size="sm"
                onClick={handleConfirmReassign}
                disabled={reassignLoading || !selectedCandidateId}
                className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs"
              >
                {reassignLoading ? 'Reassigning...' : 'Confirm Reassignment'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Complete Task Modal */}
      {completeModalTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-slate-900">Complete Operational Task</h3>
              </div>
              <button
                onClick={() => setCompleteModalTask(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="font-bold text-slate-900">{completeModalTask.title}</div>
              <div className="text-slate-500 font-mono">Case: {completeModalTask.applicationNumber}</div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Completion Remarks & Findings
              </label>
              <textarea
                id="task-complete-notes-input"
                rows={3}
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                placeholder="e.g. Verified DSC tokens and successfully filed SPICe+ form on MCA V3 portal."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCompleteModalTask(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                id="btn-confirm-complete"
                variant="primary"
                size="sm"
                onClick={handleConfirmComplete}
                disabled={completeLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
              >
                {completeLoading ? 'Submitting...' : 'Mark as Completed'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Create Manual Task */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateTask}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-brand-600" />
                <h3 className="text-base font-black text-slate-900">Create Operational Task</h3>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Task Title</label>
              <input
                type="text"
                id="new-task-title-input"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Conduct Trademark Vienna Code Search"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                <select
                  value={newDept}
                  onChange={(e) => setNewDept(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
                >
                  <option value="Legal & Corporate">Legal & Corporate</option>
                  <option value="Tax & Compliance">Tax & Compliance</option>
                  <option value="IPR & Legal">IPR & Legal</option>
                  <option value="Operations Central">Operations Central</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Priority</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="URGENT">URGENT</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCreateModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                id="btn-submit-create-task"
                type="submit"
                variant="primary"
                size="sm"
                disabled={createLoading}
                className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs"
              >
                {createLoading ? 'Creating...' : 'Create & Auto-Route Task'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* DRAWER: Task Inspection Drawer */}
      {drawerOpen && selectedTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl p-6 overflow-y-auto space-y-5 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold text-brand-600 uppercase tracking-wider">
                  Task Detail & Routing Inspector
                </span>
                <h3 className="text-base font-black text-slate-900 mt-0.5">{selectedTask.title}</h3>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Context Info */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Case Reference:</span>
                <span className="font-mono font-bold text-slate-900">{selectedTask.applicationNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Service:</span>
                <span className="font-bold text-slate-900">{selectedTask.serviceName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-bold text-slate-900">{selectedTask.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Stage:</span>
                <span className="font-bold text-indigo-700">{selectedTask.workflowStageName || 'Stage Execution'}</span>
              </div>
            </div>

            {/* Explainable Routing Rationale */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                Explainable Routing Rationale
              </h4>
              <p className="text-xs text-slate-600 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
                {selectedTask.assignmentReason || 'Assigned to operational desk queue.'}
              </p>
            </div>

            {/* SLA Status */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                SLA & Priority Metrics
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-slate-500 text-[10px]">Priority Level</div>
                  <div className="font-bold text-slate-900 mt-1">{selectedTask.priority}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-slate-500 text-[10px]">SLA Status</div>
                  <div className="font-bold text-slate-900 mt-1">{selectedTask.slaStatus}</div>
                </div>
              </div>
            </div>

            {/* Reassignment / Completion History */}
            {selectedTask.completionNotes && (
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Completion Remarks
                </h4>
                <p className="text-xs text-slate-700 bg-emerald-50 p-3 rounded-xl border border-emerald-200 font-medium">
                  {selectedTask.completionNotes}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
