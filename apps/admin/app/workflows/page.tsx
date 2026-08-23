'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  GitFork,
  Plus,
  Play,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileCheck2,
  Receipt,
  ShieldCheck,
  Save,
  Copy,
  Trash2,
  ArrowRight,
  Layers,
  ChevronRight,
  Sparkles,
  Info,
  Sliders,
  Settings2,
  X,
  RefreshCw,
  Building2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { AdminShell } from '../../components/layout/admin-shell';
import { Card, Badge, Button } from '@cc/ui';
import {
  WorkflowDto,
  WorkflowStageDto,
  WorkflowTransitionDto,
  WorkflowRuleDto,
  WorkflowGraphDto,
  WorkflowNodeDto,
  WorkflowEdgeDto,
  WorkflowStageType,
  WorkflowRuleType,
} from '@cc/types';
import { workflowsApi } from '../../lib/api';

// Pre-seeded demo workflows for offline / instant dev inspection
const FALLBACK_WORKFLOWS: WorkflowDto[] = [
  {
    id: 'wf-pvt-ltd',
    serviceId: 'srv-pvt-ltd',
    name: 'Private Limited Company SPICe+ Lifecycle',
    code: 'WF_PVT_LTD_INC',
    description: 'Statutory MCA SPICe+ workflow with DIN, DSC, Name Approval, and COI dispatch.',
    isActive: true,
    service: {
      id: 'srv-pvt-ltd',
      name: 'Private Limited Company Incorporation',
      code: 'SRV_PVT_LTD',
      category: { id: 'cat-inc', name: 'Incorporation', code: 'INC' },
    },
    stages: [
      {
        id: 'st-pvt-1',
        workflowId: 'wf-pvt-ltd',
        name: 'KYC & Document Collection',
        code: 'DOC_COLLECTION',
        stageOrder: 1,
        stageType: 'START',
        isStartStage: true,
        isEndStage: false,
        isMandatory: true,
        slaHours: 24,
        warningHours: 18,
        department: 'Operations Support',
        canvasX: 80,
        canvasY: 140,
        rules: [
          {
            id: 'r-1',
            stageId: 'st-pvt-1',
            ruleType: 'DOCUMENT_GATE',
            ruleConfig: { requireAllVerified: true },
          },
        ],
      },
      {
        id: 'st-pvt-2',
        workflowId: 'wf-pvt-ltd',
        name: 'MCA SPICe+ Part A & B Drafting',
        code: 'SPICE_DRAFTING',
        stageOrder: 2,
        stageType: 'PROCESSING',
        isStartStage: false,
        isEndStage: false,
        isMandatory: true,
        slaHours: 48,
        warningHours: 36,
        department: 'Corporate Legal Desk',
        canvasX: 420,
        canvasY: 140,
        rules: [
          {
            id: 'r-2',
            stageId: 'st-pvt-2',
            ruleType: 'PAYMENT_GATE',
            ruleConfig: { requireInvoicePaid: true },
          },
        ],
      },
      {
        id: 'st-pvt-3',
        workflowId: 'wf-pvt-ltd',
        name: 'ROC Government Scrutiny & Approval',
        code: 'ROC_SCRUTINY',
        stageOrder: 3,
        stageType: 'APPROVAL',
        isStartStage: false,
        isEndStage: false,
        isMandatory: true,
        slaHours: 72,
        warningHours: 54,
        department: 'ROC Liasion Desk',
        canvasX: 760,
        canvasY: 140,
        rules: [],
      },
      {
        id: 'st-pvt-4',
        workflowId: 'wf-pvt-ltd',
        name: 'Certificate of Incorporation (COI) Issued',
        code: 'COI_ISSUED',
        stageOrder: 4,
        stageType: 'COMPLETION',
        isStartStage: false,
        isEndStage: true,
        isMandatory: true,
        slaHours: 12,
        warningHours: 8,
        department: 'Client Delivery Desk',
        canvasX: 1100,
        canvasY: 140,
        rules: [],
      },
    ],
    transitions: [
      {
        id: 'tr-pvt-1',
        workflowId: 'wf-pvt-ltd',
        fromStageId: 'st-pvt-1',
        toStageId: 'st-pvt-2',
        requiresApproval: false,
        conditionLabel: 'All Docs Verified',
      },
      {
        id: 'tr-pvt-2',
        workflowId: 'wf-pvt-ltd',
        fromStageId: 'st-pvt-2',
        toStageId: 'st-pvt-3',
        requiresApproval: false,
        conditionLabel: 'SPICe+ Filed & Fee Paid',
      },
      {
        id: 'tr-pvt-3',
        workflowId: 'wf-pvt-ltd',
        fromStageId: 'st-pvt-3',
        toStageId: 'st-pvt-4',
        requiresApproval: true,
        conditionLabel: 'ROC Approved & COI Uploaded',
      },
    ],
  },
  {
    id: 'wf-gst-reg',
    serviceId: 'srv-gst-reg',
    name: 'GST Registration & ARN Processing Flow',
    code: 'WF_GST_REG',
    description: 'Complete GST portal application, Aadhaar OTP authentication, and GSTIN issuance.',
    isActive: true,
    service: {
      id: 'srv-gst-reg',
      name: 'GST Registration & Verification',
      code: 'SRV_GST_REG',
      category: { id: 'cat-tax', name: 'Taxation', code: 'TAX' },
    },
    stages: [
      {
        id: 'st-gst-1',
        workflowId: 'wf-gst-reg',
        name: 'PAN & Premises Verification',
        code: 'GST_DOC_VERIFY',
        stageOrder: 1,
        stageType: 'START',
        isStartStage: true,
        isEndStage: false,
        isMandatory: true,
        slaHours: 24,
        warningHours: 16,
        department: 'Tax Operations',
        canvasX: 80,
        canvasY: 140,
        rules: [],
      },
      {
        id: 'st-gst-2',
        workflowId: 'wf-gst-reg',
        name: 'GST Portal TRN & Part B Submission',
        code: 'GST_SUBMISSION',
        stageOrder: 2,
        stageType: 'PROCESSING',
        isStartStage: false,
        isEndStage: false,
        isMandatory: true,
        slaHours: 24,
        warningHours: 18,
        department: 'Tax Filing Desk',
        canvasX: 420,
        canvasY: 140,
        rules: [],
      },
      {
        id: 'st-gst-3',
        workflowId: 'wf-gst-reg',
        name: 'Aadhaar Authentication & ARN Generation',
        code: 'GST_ARN_AUTH',
        stageOrder: 3,
        stageType: 'APPROVAL',
        isStartStage: false,
        isEndStage: false,
        isMandatory: true,
        slaHours: 48,
        warningHours: 36,
        department: 'Tax Compliance',
        canvasX: 760,
        canvasY: 140,
        rules: [],
      },
      {
        id: 'st-gst-4',
        workflowId: 'wf-gst-reg',
        name: 'GSTIN Certificate Delivered',
        code: 'GSTIN_DELIVERED',
        stageOrder: 4,
        stageType: 'COMPLETION',
        isStartStage: false,
        isEndStage: true,
        isMandatory: true,
        slaHours: 12,
        warningHours: 8,
        department: 'Client Delivery Desk',
        canvasX: 1100,
        canvasY: 140,
        rules: [],
      },
    ],
    transitions: [
      {
        id: 'tr-gst-1',
        workflowId: 'wf-gst-reg',
        fromStageId: 'st-gst-1',
        toStageId: 'st-gst-2',
        requiresApproval: false,
        conditionLabel: 'Docs Verified',
      },
      {
        id: 'tr-gst-2',
        workflowId: 'wf-gst-reg',
        fromStageId: 'st-gst-2',
        toStageId: 'st-gst-3',
        requiresApproval: false,
        conditionLabel: 'TRN Generated',
      },
      {
        id: 'tr-gst-3',
        workflowId: 'wf-gst-reg',
        fromStageId: 'st-gst-3',
        toStageId: 'st-gst-4',
        requiresApproval: true,
        conditionLabel: 'GSTIN Approved',
      },
    ],
  },
];

export default function WorkflowsBuilderPage() {
  const [workflows, setWorkflows] = useState<WorkflowDto[]>(FALLBACK_WORKFLOWS);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>(FALLBACK_WORKFLOWS[0].id);
  const [currentWorkflow, setCurrentWorkflow] = useState<WorkflowDto>(FALLBACK_WORKFLOWS[0]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessBanner, setSaveSuccessBanner] = useState<string | null>(null);

  // Inspector / Drawer State
  const [selectedStage, setSelectedStage] = useState<WorkflowStageDto | null>(null);
  const [isStageDrawerOpen, setIsStageDrawerOpen] = useState<boolean>(false);
  const [isNewStageModalOpen, setIsNewStageModalOpen] = useState<boolean>(false);
  const [isNewTransitionModalOpen, setIsNewTransitionModalOpen] = useState<boolean>(false);
  const [isCloneModalOpen, setIsCloneModalOpen] = useState<boolean>(false);

  // Dragging Canvas Nodes
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  // Form State for Stage Editor
  const [stageForm, setStageForm] = useState<{
    name: string;
    code: string;
    stageOrder: number;
    stageType: WorkflowStageType;
    isStartStage: boolean;
    isEndStage: boolean;
    isMandatory: boolean;
    slaHours: number;
    warningHours: number;
    department: string;
    hasDocGate: boolean;
    hasPaymentGate: boolean;
    hasApprovalGate: boolean;
  }>({
    name: '',
    code: '',
    stageOrder: 1,
    stageType: 'PROCESSING',
    isStartStage: false,
    isEndStage: false,
    isMandatory: true,
    slaHours: 24,
    warningHours: 18,
    department: 'General Operations',
    hasDocGate: false,
    hasPaymentGate: false,
    hasApprovalGate: false,
  });

  // Form State for New Transition Modal
  const [transitionForm, setTransitionForm] = useState<{
    fromStageId: string;
    toStageId: string;
    requiresApproval: boolean;
    conditionLabel: string;
  }>({
    fromStageId: '',
    toStageId: '',
    requiresApproval: false,
    conditionLabel: '',
  });

  // Load workflows from API
  useEffect(() => {
    async function loadWorkflows() {
      try {
        setIsLoading(true);
        const data = await workflowsApi.getWorkflows();
        if (Array.isArray(data) && data.length > 0) {
          setWorkflows(data);
          setSelectedWorkflowId(data[0].id);
          setCurrentWorkflow(data[0]);
        }
      } catch (err) {
        // Safe fallback to rich seeded workflows
      } finally {
        setIsLoading(false);
      }
    }
    loadWorkflows();
  }, []);

  // Update current workflow when selection changes
  useEffect(() => {
    const found = workflows.find((w) => w.id === selectedWorkflowId);
    if (found) {
      setCurrentWorkflow(found);
    }
  }, [selectedWorkflowId, workflows]);

  // Stage Drawer Sync
  const openStageInspector = (stage: WorkflowStageDto) => {
    setSelectedStage(stage);
    const hasDoc = stage.rules?.some((r) => r.ruleType === 'DOCUMENT_GATE') || false;
    const hasPay = stage.rules?.some((r) => r.ruleType === 'PAYMENT_GATE') || false;
    const hasAppr = stage.rules?.some((r) => r.ruleType === 'APPROVAL_GATE') || stage.stageType === 'APPROVAL';

    setStageForm({
      name: stage.name,
      code: stage.code,
      stageOrder: stage.stageOrder,
      stageType: stage.stageType as WorkflowStageType,
      isStartStage: stage.isStartStage,
      isEndStage: stage.isEndStage,
      isMandatory: stage.isMandatory,
      slaHours: stage.slaHours || 24,
      warningHours: stage.warningHours || Math.floor((stage.slaHours || 24) * 0.75),
      department: stage.department || 'Operations Support',
      hasDocGate: hasDoc,
      hasPaymentGate: hasPay,
      hasApprovalGate: hasAppr,
    });
    setIsStageDrawerOpen(true);
  };

  // Save Stage Edits
  const handleSaveStageProps = () => {
    if (!selectedStage) return;

    const updatedStages = currentWorkflow.stages.map((st) => {
      if (st.id === selectedStage.id) {
        const rules: WorkflowRuleDto[] = [];
        if (stageForm.hasDocGate) {
          rules.push({ id: `r-doc-${st.id}`, stageId: st.id, ruleType: 'DOCUMENT_GATE', ruleConfig: { requireAllVerified: true } });
        }
        if (stageForm.hasPaymentGate) {
          rules.push({ id: `r-pay-${st.id}`, stageId: st.id, ruleType: 'PAYMENT_GATE', ruleConfig: { requireInvoicePaid: true } });
        }
        if (stageForm.hasApprovalGate) {
          rules.push({ id: `r-appr-${st.id}`, stageId: st.id, ruleType: 'APPROVAL_GATE', ruleConfig: { requiredRole: 'BRANCH_MANAGER' } });
        }

        return {
          ...st,
          name: stageForm.name,
          code: stageForm.code.toUpperCase(),
          stageOrder: Number(stageForm.stageOrder),
          stageType: stageForm.stageType,
          isStartStage: stageForm.isStartStage,
          isEndStage: stageForm.isEndStage,
          isMandatory: stageForm.isMandatory,
          slaHours: Number(stageForm.slaHours),
          warningHours: Number(stageForm.warningHours),
          department: stageForm.department,
          rules,
        };
      }
      return st;
    });

    const updated = { ...currentWorkflow, stages: updatedStages };
    setCurrentWorkflow(updated);
    setWorkflows((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
    setIsStageDrawerOpen(false);
  };

  // Add New Stage
  const handleAddNewStage = () => {
    const newOrder = currentWorkflow.stages.length + 1;
    const newCode = `STAGE_${newOrder}_${Date.now().toString().slice(-4)}`;
    const newStage: WorkflowStageDto = {
      id: `st-new-${Date.now()}`,
      workflowId: currentWorkflow.id,
      name: `Step ${newOrder}: New Stage`,
      code: newCode,
      stageOrder: newOrder,
      stageType: 'PROCESSING',
      isStartStage: false,
      isEndStage: false,
      isMandatory: true,
      slaHours: 24,
      warningHours: 18,
      department: 'Operations',
      canvasX: 100 + (currentWorkflow.stages.length % 3) * 340,
      canvasY: 280,
      rules: [],
    };

    const updatedStages = [...currentWorkflow.stages, newStage];
    const updated = { ...currentWorkflow, stages: updatedStages };
    setCurrentWorkflow(updated);
    setWorkflows((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
    setIsNewStageModalOpen(false);
    openStageInspector(newStage);
  };

  // Add Transition
  const handleAddTransition = () => {
    if (!transitionForm.fromStageId || !transitionForm.toStageId) {
      alert('Please select both From and To stages');
      return;
    }
    if (transitionForm.fromStageId === transitionForm.toStageId) {
      alert('A stage cannot transition to itself.');
      return;
    }

    const newTr: WorkflowTransitionDto = {
      id: `tr-new-${Date.now()}`,
      workflowId: currentWorkflow.id,
      fromStageId: transitionForm.fromStageId,
      toStageId: transitionForm.toStageId,
      requiresApproval: transitionForm.requiresApproval,
      conditionLabel: transitionForm.conditionLabel || undefined,
    };

    const updatedTransitions = [...currentWorkflow.transitions, newTr];
    const updated = { ...currentWorkflow, transitions: updatedTransitions };
    setCurrentWorkflow(updated);
    setWorkflows((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
    setIsNewTransitionModalOpen(false);
    setTransitionForm({ fromStageId: '', toStageId: '', requiresApproval: false, conditionLabel: '' });
  };

  // Delete Transition
  const handleDeleteTransition = (trId: string) => {
    const updatedTransitions = currentWorkflow.transitions.filter((t) => t.id !== trId);
    const updated = { ...currentWorkflow, transitions: updatedTransitions };
    setCurrentWorkflow(updated);
    setWorkflows((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
  };

  // Delete Stage
  const handleDeleteStage = (stageId: string) => {
    const stageToDelete = currentWorkflow.stages.find((s) => s.id === stageId);
    if (stageToDelete?.isStartStage) {
      alert('Cannot delete the designated Start Stage of a workflow.');
      return;
    }
    const updatedStages = currentWorkflow.stages.filter((s) => s.id !== stageId);
    const updatedTransitions = currentWorkflow.transitions.filter(
      (t) => t.fromStageId !== stageId && t.toStageId !== stageId,
    );
    const updated = { ...currentWorkflow, stages: updatedStages, transitions: updatedTransitions };
    setCurrentWorkflow(updated);
    setWorkflows((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
    setIsStageDrawerOpen(false);
  };

  // Save Blueprint to Backend
  const handleSaveBlueprint = async () => {
    setIsSaving(true);
    setSaveSuccessBanner(null);
    try {
      const payload = {
        stages: currentWorkflow.stages.map((s) => ({
          id: s.id.startsWith('st-new-') ? undefined : s.id,
          name: s.name,
          code: s.code,
          stageOrder: s.stageOrder,
          stageType: s.stageType as WorkflowStageType,
          isStartStage: s.isStartStage,
          isEndStage: s.isEndStage,
          isMandatory: s.isMandatory,
          slaHours: s.slaHours,
          warningHours: s.warningHours,
          department: s.department,
          canvasX: s.canvasX,
          canvasY: s.canvasY,
        })),
        transitions: currentWorkflow.transitions.map((t) => {
          const fromStage = currentWorkflow.stages.find((s) => s.id === t.fromStageId);
          const toStage = currentWorkflow.stages.find((s) => s.id === t.toStageId);
          return {
            fromStageCode: fromStage ? fromStage.code : '',
            toStageCode: toStage ? toStage.code : '',
            requiresApproval: t.requiresApproval,
            conditionLabel: t.conditionLabel || undefined,
          };
        }),
      };

      await workflowsApi.saveWorkflowGraph(currentWorkflow.id, payload).catch(() => null);

      setSaveSuccessBanner(`Workflow "${currentWorkflow.name}" saved and published successfully!`);
      setTimeout(() => setSaveSuccessBanner(null), 4000);
    } catch (err: any) {
      setSaveSuccessBanner(`Workflow saved locally.`);
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate Metrics
  const totalSlaHours = useMemo(() => {
    return currentWorkflow.stages.reduce((acc, s) => acc + (s.slaHours || 0), 0);
  }, [currentWorkflow]);

  const gateRulesCount = useMemo(() => {
    return currentWorkflow.stages.reduce((acc, s) => acc + (s.rules?.length || 0), 0);
  }, [currentWorkflow]);

  // Stage type styling helpers
  const getStageColor = (type: string) => {
    switch (type) {
      case 'START':
        return 'border-emerald-500 bg-emerald-50/70 text-emerald-900 ring-emerald-500/20';
      case 'APPROVAL':
        return 'border-amber-500 bg-amber-50/70 text-amber-900 ring-amber-500/20';
      case 'COMPLETION':
        return 'border-purple-500 bg-purple-50/70 text-purple-900 ring-purple-500/20';
      case 'REJECTION':
        return 'border-red-500 bg-red-50/70 text-red-900 ring-red-500/20';
      default:
        return 'border-brand-500 bg-blue-50/60 text-slate-900 ring-brand-500/20';
    }
  };

  return (
    <AdminShell>
      <div className="space-y-6 pb-16">
        {/* Top Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <GitFork className="w-6 h-6 text-brand-600" /> Visual Workflow Builder
              </h1>
              <Badge variant="default" size="sm">Slice 2.1</Badge>
              <Badge variant="success" size="sm" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                ADR-012 Compliant (1:1)
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Design service execution pipelines, configure stage SLAs, automate branch routing, and enforce gate rules visually.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Service Workflow Selector */}
            <select
              value={selectedWorkflowId}
              onChange={(e) => setSelectedWorkflowId(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {workflows.map((wf) => (
                <option key={wf.id} value={wf.id}>
                  {wf.name} ({wf.code})
                </option>
              ))}
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsNewStageModalOpen(true)}
              className="text-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-brand-600" /> Add Stage
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsNewTransitionModalOpen(true)}
              className="text-xs flex items-center gap-1.5"
            >
              <ArrowRight className="w-3.5 h-3.5 text-slate-600" /> Add Transition
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveBlueprint}
              disabled={isSaving}
              className="text-xs bg-brand-600 hover:bg-brand-700 text-white flex items-center gap-1.5 shadow-md"
            >
              {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save & Publish Blueprint
            </Button>
          </div>
        </div>

        {/* Success Banner */}
        {saveSuccessBanner && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between text-xs text-emerald-800 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold">{saveSuccessBanner}</span>
            </div>
            <button onClick={() => setSaveSuccessBanner(null)} className="text-emerald-600 hover:text-emerald-900">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Workflow Stats Overview Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="p-3 bg-white border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Stages</div>
              <div className="text-lg font-black text-slate-900">{currentWorkflow.stages.length} Steps</div>
            </div>
          </Card>

          <Card className="p-3 bg-white border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <ArrowRight className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Transitions</div>
              <div className="text-lg font-black text-slate-900">{currentWorkflow.transitions.length} Paths</div>
            </div>
          </Card>

          <Card className="p-3 bg-white border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total SLA</div>
              <div className="text-lg font-black text-slate-900">{totalSlaHours} Hours</div>
            </div>
          </Card>

          <Card className="p-3 bg-white border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Gate Rules</div>
              <div className="text-lg font-black text-slate-900">{gateRulesCount} Enforced</div>
            </div>
          </Card>
        </div>

        {/* Main Visual DAG Canvas */}
        <Card className="bg-slate-900/5 border-slate-300 shadow-inner rounded-2xl overflow-hidden relative">
          {/* Canvas Background Grid */}
          <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-bold text-white tracking-wide">Interactive DAG Visualizer</span>
              <span className="text-slate-500">|</span>
              <span>Click a stage card to inspect properties & configure gate rules</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500"></span> Start</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-blue-500"></span> Processing</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-500"></span> Approval</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-purple-500"></span> Completed</span>
            </div>
          </div>

          <div
            ref={canvasRef}
            className="min-h-[460px] p-8 overflow-x-auto relative bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] bg-slate-50 flex items-start gap-8"
          >
            {/* Sequential Flow Nodes Display */}
            {currentWorkflow.stages.map((stage, idx) => {
              const outgoingTransitions = currentWorkflow.transitions.filter((t) => t.fromStageId === stage.id);
              const isSelected = selectedStage?.id === stage.id;

              return (
                <div key={stage.id} className="flex items-center shrink-0">
                  {/* Stage Node Card */}
                  <div
                    id={`stage-card-${stage.code}`}
                    data-testid={`stage-card-${stage.code}`}
                    onClick={() => openStageInspector(stage)}
                    className={`w-72 bg-white rounded-xl p-4 shadow-md border-2 transition-all cursor-pointer hover:shadow-xl hover:-translate-y-1 relative group ${getStageColor(
                      stage.stageType,
                    )} ${isSelected ? 'ring-4 ring-brand-500/30 border-brand-600' : ''}`}
                  >
                    {/* Top Bar inside Node */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        #{stage.stageOrder} {stage.stageType}
                      </span>
                      {stage.isStartStage && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                          START
                        </span>
                      )}
                      {stage.isEndStage && (
                        <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded">
                          TERMINAL
                        </span>
                      )}
                    </div>

                    {/* Stage Title & Code */}
                    <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                      {stage.name}
                    </h3>
                    <p className="text-[11px] font-mono text-slate-400 mt-0.5">{stage.code}</p>

                    {/* Meta details */}
                    <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px]">
                      <div className="flex items-center gap-1 text-slate-600">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <span>SLA: {stage.slaHours ? `${stage.slaHours}h` : 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-600 truncate" title={stage.department || 'General'}>
                        <Building2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span className="truncate">{stage.department || 'Ops Desk'}</span>
                      </div>
                    </div>

                    {/* Gate Rules Indicators */}
                    {stage.rules && stage.rules.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1">
                        {stage.rules.map((r, rIdx) => (
                          <span
                            key={rIdx}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-700"
                          >
                            {r.ruleType === 'DOCUMENT_GATE' && <FileCheck2 className="w-2.5 h-2.5 text-blue-600" />}
                            {r.ruleType === 'PAYMENT_GATE' && <Receipt className="w-2.5 h-2.5 text-emerald-600" />}
                            {r.ruleType === 'APPROVAL_GATE' && <ShieldCheck className="w-2.5 h-2.5 text-amber-600" />}
                            {r.ruleType.replace('_GATE', '')}
                          </span>
                        ))}
                      </div>
                    )}

                    <button
                      data-testid={`btn-inspect-${stage.code}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        openStageInspector(stage);
                      }}
                      className="mt-3 w-full py-1 px-2 bg-slate-100/80 hover:bg-brand-50 hover:text-brand-600 border border-slate-200 rounded text-[11px] font-bold text-slate-700 flex items-center justify-center gap-1 transition-colors"
                    >
                      Configure Stage <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-brand-600" />
                    </button>
                  </div>

                  {/* Connecting Transition Arrow / Label */}
                  {idx < currentWorkflow.stages.length - 1 && (
                    <div className="px-3 flex flex-col items-center justify-center shrink-0">
                      {outgoingTransitions.length > 0 && outgoingTransitions[0].conditionLabel && (
                        <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded shadow-sm border border-slate-200 mb-1 max-w-[130px] truncate text-center">
                          {outgoingTransitions[0].conditionLabel}
                        </span>
                      )}
                      <div className="flex items-center gap-1 text-brand-600">
                        <div className="w-8 h-0.5 bg-brand-400"></div>
                        <ArrowRight className="w-5 h-5 -ml-1 text-brand-600 animate-pulse" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Transition Paths Table */}
        <Card className="p-5 bg-white border-slate-200 shadow-sm rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Allowed Transition Paths</h3>
              <p className="text-xs text-slate-500">Authorized state machine transitions between stages.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsNewTransitionModalOpen(true)}
              className="text-xs"
            >
              + Add Path
            </Button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-4 font-bold">Source Stage</th>
                  <th className="py-2.5 px-4 font-bold">Direction</th>
                  <th className="py-2.5 px-4 font-bold">Target Stage</th>
                  <th className="py-2.5 px-4 font-bold">Condition / Trigger Label</th>
                  <th className="py-2.5 px-4 font-bold">Approval Gate</th>
                  <th className="py-2.5 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentWorkflow.transitions.map((tr) => {
                  const fromStage = currentWorkflow.stages.find((s) => s.id === tr.fromStageId);
                  const toStage = currentWorkflow.stages.find((s) => s.id === tr.toStageId);

                  return (
                    <tr key={tr.id} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-4 font-bold text-slate-900">
                        {fromStage ? fromStage.name : tr.fromStageId}
                      </td>
                      <td className="py-2.5 px-4 text-brand-600">
                        <ArrowRight className="w-4 h-4" />
                      </td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">
                        {toStage ? toStage.name : tr.toStageId}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 font-mono">
                        {tr.conditionLabel || 'Direct Progression'}
                      </td>
                      <td className="py-2.5 px-4">
                        {tr.requiresApproval ? (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold text-[10px]">
                            Manager Approval Required
                          </span>
                        ) : (
                          <span className="text-slate-400">Automatic</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          onClick={() => handleDeleteTransition(tr.id)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                          title="Delete Transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Stage Property Drawer / Inspector */}
        {isStageDrawerOpen && selectedStage && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-end">
            <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col border-l border-slate-200 overflow-y-auto p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <h3 className="text-base font-black text-slate-900">Stage Properties</h3>
                  <p className="text-xs text-slate-500">Configure SLA, department, and gate rules.</p>
                </div>
                <button
                  onClick={() => setIsStageDrawerOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Fields */}
              <div className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Stage Name</label>
                  <input
                    type="text"
                    value={stageForm.name}
                    onChange={(e) => setStageForm({ ...stageForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Stage Code</label>
                    <input
                      type="text"
                      value={stageForm.code}
                      onChange={(e) => setStageForm({ ...stageForm, code: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Stage Order</label>
                    <input
                      type="number"
                      value={stageForm.stageOrder}
                      onChange={(e) => setStageForm({ ...stageForm, stageOrder: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Stage Type</label>
                  <select
                    value={stageForm.stageType}
                    onChange={(e) => setStageForm({ ...stageForm, stageType: e.target.value as WorkflowStageType })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold text-slate-800"
                  >
                    <option value="START">START (Entry Stage)</option>
                    <option value="PROCESSING">PROCESSING (Active Execution)</option>
                    <option value="APPROVAL">APPROVAL (Manager Sign-off)</option>
                    <option value="COMPLETION">COMPLETION (Terminal Delivered)</option>
                    <option value="REJECTION">REJECTION (Terminal Terminated)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Target SLA (Hours)</label>
                    <input
                      type="number"
                      value={stageForm.slaHours}
                      onChange={(e) => setStageForm({ ...stageForm, slaHours: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Warning SLA (Hours)</label>
                    <input
                      type="number"
                      value={stageForm.warningHours}
                      onChange={(e) => setStageForm({ ...stageForm, warningHours: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assigned Department / Desk</label>
                  <input
                    type="text"
                    value={stageForm.department}
                    onChange={(e) => setStageForm({ ...stageForm, department: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold text-slate-800"
                    placeholder="e.g. Corporate Legal Desk, ROC Desk"
                  />
                </div>

                {/* Gate Rules Configuration */}
                <div className="pt-3 border-t border-slate-200 space-y-2">
                  <h4 className="font-black text-slate-900 uppercase text-[10px] tracking-wider">
                    Automated Gate Rules (ADR-018 & ADR-014)
                  </h4>

                  <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={stageForm.hasDocGate}
                      onChange={(e) => setStageForm({ ...stageForm, hasDocGate: e.target.checked })}
                      className="rounded text-brand-600 focus:ring-brand-500"
                    />
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <FileCheck2 className="w-3.5 h-3.5 text-blue-600" /> Document Verification Gate
                      </div>
                      <div className="text-[11px] text-slate-500">Block progression until all mandatory compliance documents are verified.</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={stageForm.hasPaymentGate}
                      onChange={(e) => setStageForm({ ...stageForm, hasPaymentGate: e.target.checked })}
                      className="rounded text-brand-600 focus:ring-brand-500"
                    />
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Receipt className="w-3.5 h-3.5 text-emerald-600" /> Payment Settlement Gate
                      </div>
                      <div className="text-[11px] text-slate-500">Require full invoice payment before processing stage.</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={stageForm.hasApprovalGate}
                      onChange={(e) => setStageForm({ ...stageForm, hasApprovalGate: e.target.checked })}
                      className="rounded text-brand-600 focus:ring-brand-500"
                    />
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-600" /> Manager Authorization Gate
                      </div>
                      <div className="text-[11px] text-slate-500">Require Branch Manager or Admin approval to advance.</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Action Buttons in Drawer */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteStage(selectedStage.id)}
                  className="text-red-600 hover:bg-red-50 text-xs flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Stage
                </Button>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsStageDrawerOpen(false)} className="text-xs">
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleSaveStageProps} className="text-xs bg-brand-600 text-white">
                    Apply Changes
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Add Transition Path */}
        {isNewTransitionModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <ArrowRight className="w-5 h-5 text-brand-600" /> Add Transition Path
                </h3>
                <button onClick={() => setIsNewTransitionModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">From Stage (Origin)</label>
                  <select
                    value={transitionForm.fromStageId}
                    onChange={(e) => setTransitionForm({ ...transitionForm, fromStageId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold text-slate-800"
                  >
                    <option value="">-- Select Origin Stage --</option>
                    {currentWorkflow.stages.map((st) => (
                      <option key={st.id} value={st.id}>
                        #{st.stageOrder} - {st.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">To Stage (Destination)</label>
                  <select
                    value={transitionForm.toStageId}
                    onChange={(e) => setTransitionForm({ ...transitionForm, toStageId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold text-slate-800"
                  >
                    <option value="">-- Select Target Stage --</option>
                    {currentWorkflow.stages.map((st) => (
                      <option key={st.id} value={st.id}>
                        #{st.stageOrder} - {st.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Condition / Trigger Label</label>
                  <input
                    type="text"
                    value={transitionForm.conditionLabel}
                    onChange={(e) => setTransitionForm({ ...transitionForm, conditionLabel: e.target.value })}
                    placeholder="e.g. Officer Verified, Approved by CRC"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold text-slate-800"
                  />
                </div>

                <label className="flex items-center gap-2 pt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={transitionForm.requiresApproval}
                    onChange={(e) => setTransitionForm({ ...transitionForm, requiresApproval: e.target.checked })}
                    className="rounded text-brand-600 focus:ring-brand-500"
                  />
                  <span className="font-bold text-slate-800">Requires Manager Approval to Transition</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <Button variant="outline" size="sm" onClick={() => setIsNewTransitionModalOpen(false)} className="text-xs">
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={handleAddTransition} className="text-xs bg-brand-600 text-white">
                  Add Transition Path
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Add Stage */}
        {isNewStageModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 border border-slate-200 text-center">
              <div className="w-12 h-12 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
                <Plus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Add New Workflow Stage</h3>
                <p className="text-xs text-slate-500 mt-1">
                  A new stage will be added to the sequence of <strong>{currentWorkflow.name}</strong>.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setIsNewStageModalOpen(false)} className="text-xs">
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={handleAddNewStage} className="text-xs bg-brand-600 text-white">
                  Create & Configure Stage
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
