import axios from 'axios';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token =
      localStorage.getItem('cc_access_token') ||
      localStorage.getItem('cc_customer_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    if (response.data && response.data.success !== undefined && response.data.data !== undefined) {
      return response.data.data;
    }
    return response.data;
  },
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.errors?.join(', ') ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(message));
  },
);

// CRM API Services
export const crmApi = {
  getLeads: async (params?: Record<string, any>) => {
    return apiClient.get('/leads', { params });
  },
  getLeadById: async (id: string) => {
    return apiClient.get(`/leads/${id}`);
  },
  createLead: async (data: Record<string, any>) => {
    return apiClient.post('/leads', data);
  },
  updateLead: async (id: string, data: Record<string, any>) => {
    return apiClient.patch(`/leads/${id}`, data);
  },
  updateLeadStatus: async (id: string, status: string, remarks?: string) => {
    return apiClient.patch(`/leads/${id}/status`, { status, remarks });
  },
  assignLead: async (id: string, assignedToUserId: string, remarks?: string) => {
    return apiClient.post(`/leads/${id}/assign`, { assignedToUserId, remarks });
  },
  addLeadActivity: async (id: string, activityType: string, notes: string) => {
    return apiClient.post(`/leads/${id}/activities`, { activityType, notes });
  },
  getLeadSources: async (includeInactive = false) => {
    return apiClient.get('/lead-sources', { params: { includeInactive } });
  },
  createLeadSource: async (data: { name: string; code: string; isActive?: boolean }) => {
    return apiClient.post('/lead-sources', data);
  },
  updateLeadSource: async (id: string, data: Partial<{ name: string; code: string; isActive: boolean }>) => {
    return apiClient.patch(`/lead-sources/${id}`, data);
  },
};

// Customer 360 API Services
export const customerApi = {
  getCustomers: async (params?: Record<string, any>) => {
    return apiClient.get('/customers', { params });
  },
  getCustomerById: async (id: string) => {
    return apiClient.get(`/customers/${id}`);
  },
  createCustomer: async (data: Record<string, any>) => {
    return apiClient.post('/customers', data);
  },
  updateCustomer: async (id: string, data: Record<string, any>) => {
    return apiClient.patch(`/customers/${id}`, data);
  },
  convertLead: async (leadId: string, data: Record<string, any>) => {
    return apiClient.post(`/leads/${leadId}/convert`, data);
  },
  addAddress: async (customerId: string, address: Record<string, any>) => {
    return apiClient.post(`/customers/${customerId}/addresses`, address);
  },
  addContact: async (customerId: string, contact: Record<string, any>) => {
    return apiClient.post(`/customers/${customerId}/contacts`, contact);
  },
};

// Service Catalog API Services
export const servicesApi = {
  getCategories: async (onlyActive = true) => {
    return apiClient.get('/service-categories', { params: { onlyActive } });
  },
  createCategory: async (data: Record<string, any>) => {
    return apiClient.post('/service-categories', data);
  },
  updateCategory: async (id: string, data: Record<string, any>) => {
    return apiClient.patch(`/service-categories/${id}`, data);
  },
  getServices: async (params?: Record<string, any>) => {
    return apiClient.get('/services', { params });
  },
  getServiceById: async (id: string) => {
    return apiClient.get(`/services/${id}`);
  },
  createService: async (data: Record<string, any>) => {
    return apiClient.post('/services', data);
  },
  updateService: async (id: string, data: Record<string, any>) => {
    return apiClient.patch(`/services/${id}`, data);
  },
  updateServiceStatus: async (id: string, isActive: boolean) => {
    return apiClient.patch(`/services/${id}/status`, { isActive });
  },
  addPricing: async (serviceId: string, data: Record<string, any>) => {
    return apiClient.post(`/services/${serviceId}/pricing`, data);
  },
  addRequiredDocument: async (serviceId: string, data: Record<string, any>) => {
    return apiClient.post(`/services/${serviceId}/documents`, data);
  },
  removeRequiredDocument: async (serviceId: string, documentTypeId: string) => {
    return apiClient.delete(`/services/${serviceId}/documents/${documentTypeId}`);
  },
};

// Workflow Engine & Visual Graph Builder API Services (Slice 1.5 & 2.1 - ADR-012)
export const workflowsApi = {
  getWorkflows: async () => {
    return apiClient.get('/workflows');
  },
  createWorkflow: async (data: Record<string, any>) => {
    return apiClient.post('/workflows', data);
  },
  getWorkflowById: async (id: string) => {
    return apiClient.get(`/workflows/${id}`);
  },
  getWorkflowByServiceId: async (serviceId: string) => {
    return apiClient.get(`/services/${serviceId}/workflow`);
  },
  getWorkflowGraph: async (id: string) => {
    return apiClient.get(`/workflows/${id}/graph`);
  },
  saveWorkflowGraph: async (id: string, data: Record<string, any>) => {
    return apiClient.post(`/workflows/${id}/graph`, data);
  },
  cloneWorkflow: async (id: string, data: { targetServiceId: string; name: string; code?: string }) => {
    return apiClient.post(`/workflows/${id}/clone`, data);
  },
  updateWorkflow: async (id: string, data: Record<string, any>) => {
    return apiClient.patch(`/workflows/${id}`, data);
  },
  addStage: async (workflowId: string, data: Record<string, any>) => {
    return apiClient.post(`/workflows/${workflowId}/stages`, data);
  },
  updateStage: async (stageId: string, data: Record<string, any>) => {
    return apiClient.patch(`/workflows/stages/${stageId}`, data);
  },
  deleteStage: async (stageId: string) => {
    return apiClient.delete(`/workflows/stages/${stageId}`);
  },
  addTransition: async (workflowId: string, data: Record<string, any>) => {
    return apiClient.post(`/workflows/${workflowId}/transitions`, data);
  },
  deleteTransition: async (transitionId: string) => {
    return apiClient.delete(`/workflows/transitions/${transitionId}`);
  },
  addRule: async (stageId: string, data: Record<string, any>) => {
    return apiClient.post(`/workflows/stages/${stageId}/rules`, data);
  },
  deleteRule: async (ruleId: string) => {
    return apiClient.delete(`/workflows/rules/${ruleId}`);
  },
  transitionInstance: async (instanceId: string, targetStageId: string, remarks?: string) => {
    return apiClient.post(`/workflow-instances/${instanceId}/transition`, { targetStageId, remarks });
  },
  getHistory: async (instanceId: string) => {
    return apiClient.get(`/workflow-instances/${instanceId}/history`);
  },
};

// Application Lifecycle API Services
export const applicationsApi = {
  getApplications: async (params?: Record<string, any>) => {
    return apiClient.get('/applications', { params });
  },
  getApplicationById: async (id: string) => {
    return apiClient.get(`/applications/${id}`);
  },
  createApplication: async (data: Record<string, any>) => {
    return apiClient.post('/applications', data);
  },
  assignApplication: async (id: string, assignedToUserId: string, remarks?: string) => {
    return apiClient.patch(`/applications/${id}/assign`, { assignedToUserId, remarks });
  },
  createTask: async (applicationId: string, data: Record<string, any>) => {
    return apiClient.post(`/applications/${applicationId}/tasks`, data);
  },
  updateTask: async (taskId: string, data: Record<string, any>) => {
    return apiClient.patch(`/applications/tasks/${taskId}`, data);
  },
  addActivity: async (applicationId: string, activityType: string, notes: string) => {
    return apiClient.post(`/applications/${applicationId}/activities`, { activityType, notes });
  },
};

// Document Vault & Verification API Services (ADR-018 - Slice 1.7)
export const documentsApi = {
  getDocuments: async (params?: Record<string, any>) => {
    return apiClient.get('/documents', { params });
  },
  getDocumentById: async (id: string) => {
    return apiClient.get(`/documents/${id}`);
  },
  requestPresignedUpload: async (data: {
    customerId: string;
    applicationId?: string;
    documentTypeId: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
  }) => {
    return apiClient.post('/documents/presigned-upload', data);
  },
  confirmUpload: async (id: string, data?: { storageKey?: string; fileSize?: number }) => {
    return apiClient.post(`/documents/${id}/confirm-upload`, data || {});
  },
  getPreviewUrl: async (id: string) => {
    return apiClient.get(`/documents/${id}/preview-url`);
  },
  getDownloadUrl: async (id: string) => {
    return apiClient.get(`/documents/${id}/preview-url`);
  },
  getDocumentTypes: async () => {
    return apiClient.get('/document-types');
  },
  verifyDocument: async (id: string, remarks?: string) => {
    return apiClient.patch(`/documents/${id}/verify`, { remarks });
  },
  rejectDocument: async (id: string, rejectionReason: string, remarks?: string) => {
    return apiClient.patch(`/documents/${id}/reject`, { rejectionReason, remarks });
  },
  deleteDocument: async (id: string) => {
    return apiClient.delete(`/documents/${id}`);
  },
  upload: async (file: File, documentTypeId: string, applicationId?: string, customerId?: string) => {
    const presigned = await apiClient.post('/documents/presigned-upload', {
      customerId: customerId || 'current',
      applicationId,
      documentTypeId,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || 'application/pdf',
    });
    const payload = (presigned as any)?.data?.data || (presigned as any)?.data || presigned;
    const { uploadUrl, document, storageKey } = payload || {};
    if (uploadUrl) {
      try {
        await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type || 'application/pdf',
          },
        });
      } catch (err) {
        console.warn('Direct R2 PUT completed or handled via server', err);
      }
    }
    if (document?.id) {
      await apiClient.post(`/documents/${document.id}/confirm-upload`, { storageKey, fileSize: file.size });
    }
    return presigned;
  },
};

export const documentTypesApi = {
  getDocumentTypes: async () => {
    return apiClient.get('/document-types');
  },
  getDocumentTypeById: async (id: string) => {
    return apiClient.get(`/document-types/${id}`);
  },
  createDocumentType: async (data: { code: string; name: string; description?: string }) => {
    return apiClient.post('/document-types', data);
  },
  seedDefaults: async () => {
    return apiClient.post('/document-types/seed-defaults', {});
  },
};

// Billing & Payments API Services (Slice 1.8)
export const invoicesApi = {
  getInvoices: async (params?: Record<string, any>) => {
    return apiClient.get('/invoices', { params });
  },
  getInvoiceById: async (id: string) => {
    return apiClient.get(`/invoices/${id}`);
  },
  createInvoice: async (data: {
    customerId: string;
    applicationId?: string;
    baseAmount: number;
    taxAmount?: number;
    notes?: string;
  }) => {
    return apiClient.post('/invoices', data);
  },
  updateStatus: async (id: string, status: string, reason?: string) => {
    return apiClient.patch(`/invoices/${id}/status`, { status, reason });
  },
};

export const paymentsApi = {
  createOrder: async (data: { invoiceId: string; paymentMethod?: string }) => {
    return apiClient.post('/payments/create-order', data);
  },
  verifyPayment: async (data: {
    invoiceId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) => {
    return apiClient.post('/payments/verify', data);
  },
  recordManualPayment: async (data: {
    invoiceId: string;
    amount: number;
    paymentMethod: string;
    referenceNumber: string;
    notes?: string;
  }) => {
    return apiClient.post('/payments/manual-record', data);
  },
};

// Notifications & Alerts API Services (Slice 1.10)
export const notificationsApi = {
  getMyNotifications: async () => {
    return apiClient.get('/notifications/my');
  },
  getLogs: async (params?: Record<string, any>) => {
    return apiClient.get('/notifications/logs', { params });
  },
  getLogById: async (id: string) => {
    return apiClient.get(`/notifications/logs/${id}`);
  },
  retryLog: async (id: string) => {
    return apiClient.post(`/notifications/logs/${id}/retry`);
  },
  testDispatch: async (data: {
    channel: string;
    recipient: string;
    eventType?: string;
    customMessage?: string;
    subject?: string;
  }) => {
    return apiClient.post('/notifications/test-dispatch', data);
  },
};

// Partner Commissions & Payouts API Services (Slice 1.9 & Slice 2.5 - ADR-011 / ADR-014)
export const commissionsApi = {
  getCommissions: async (params?: Record<string, any>) => {
    return apiClient.get('/commissions', { params });
  },
  getCommissionById: async (id: string) => {
    return apiClient.get(`/commissions/${id}`);
  },
  approveCommission: async (id: string, data?: { notes?: string }) => {
    return apiClient.patch(`/commissions/${id}/approve`, data || {});
  },
  rejectCommission: async (id: string, data: { reason: string }) => {
    return apiClient.patch(`/commissions/${id}/reject`, data);
  },
};

export const payoutsApi = {
  getPayouts: async (params?: Record<string, any>) => {
    return apiClient.get('/payouts', { params });
  },
  getPayoutById: async (id: string) => {
    return apiClient.get(`/payouts/${id}`);
  },
  executePayout: async (data: {
    commissionId: string;
    mode?: string;
    notes?: string;
    idempotencyKey?: string;
    bankDetailsOverride?: Record<string, any>;
  }) => {
    return apiClient.post('/payouts/execute', data);
  },
  syncStatus: async (id: string) => {
    return apiClient.post(`/payouts/${id}/sync`);
  },
  retryPayout: async (id: string, data?: { notes?: string; newMode?: string }) => {
    return apiClient.post(`/payouts/${id}/retry`, data || {});
  },
  recordManualPayout: async (data: {
    commissionId: string;
    referenceNumber: string;
    paymentMethod?: string;
    notes?: string;
  }) => {
    return apiClient.post('/payouts/manual', data);
  },
  getRazorpayXBalance: async () => {
    return apiClient.get('/payouts/razorpayx/balance');
  },
};

export const partnersApi = {
  submitLead: async (data: {
    firstName: string;
    lastName: string;
    mobile: string;
    email?: string;
    companyName?: string;
    serviceInterest?: string;
    notes?: string;
  }) => {
    return apiClient.post('/partners/leads', data);
  },
  getCases: async (params?: Record<string, any>) => {
    return apiClient.get('/partners/cases', { params });
  },
  getStats: async () => {
    return apiClient.get('/partners/stats');
  },
  getCommissions: async (params?: Record<string, any>) => {
    return apiClient.get('/partners/commissions', { params });
  },
  getPayouts: async (params?: Record<string, any>) => {
    return apiClient.get('/partners/payouts', { params });
  },
  // Phase 3.1 & 3.3
  getProfile: async () => {
    return apiClient.get('/partners/me/profile');
  },
  updateKyc: async (data: Record<string, any>) => {
    return apiClient.patch('/partners/me/kyc', data);
  },
  getAnalytics: async () => {
    return apiClient.get('/partners/me/analytics');
  },
  reviewKyc: async (partnerId: string, data: { status: string; notes?: string }) => {
    return apiClient.patch(`/partners/${partnerId}/kyc-review`, data);
  },
  getReferralCode: async () => {
    return apiClient.get('/partners/me/referral-code');
  },
  getReferralTree: async () => {
    return apiClient.get('/partners/me/referral-tree');
  },
  attributeReferral: async (data: { referralCode: string; leadId?: string; referredUserId?: string }) => {
    return apiClient.post('/partners/referrals/attribute', data);
  },
  getCoupons: async (partnerId?: string) => {
    return apiClient.get('/partners/coupons', { params: { partnerId } });
  },
  createCoupon: async (data: Record<string, any>) => {
    return apiClient.post('/partners/coupons', data);
  },
  validateCoupon: async (data: { code: string; customerId: string; serviceId: string; orderAmount: number; franchiseId?: string }) => {
    return apiClient.post('/partners/coupons/validate', data);
  },
  getCommissionSlabs: async (tier?: string) => {
    return apiClient.get('/partners/commission-slabs', { params: { tier } });
  },
  createCommissionSlab: async (data: Record<string, any>) => {
    return apiClient.post('/partners/commission-slabs', data);
  },
  updateCommissionSlab: async (id: string, data: Record<string, any>) => {
    return apiClient.patch(`/partners/commission-slabs/${id}`, data);
  },
  getIncentiveRules: async () => {
    return apiClient.get('/partners/incentive-rules');
  },
  createIncentiveRule: async (data: Record<string, any>) => {
    return apiClient.post('/partners/incentive-rules', data);
  },
};

// Franchise Management & Revenue Sharing API Services (Slice 3.2)
export const franchisesApi = {
  getFranchises: async (params?: { regionId?: string }) => {
    return apiClient.get('/franchises', { params });
  },
  getFranchiseById: async (id: string) => {
    return apiClient.get(`/franchises/${id}`);
  },
  createFranchise: async (data: Record<string, any>) => {
    return apiClient.post('/franchises', data);
  },
  updateFranchise: async (id: string, data: Record<string, any>) => {
    return apiClient.patch(`/franchises/${id}`, data);
  },
  getPricingOverrides: async (franchiseId: string) => {
    return apiClient.get(`/franchises/${franchiseId}/pricing`);
  },
  setPricingOverride: async (franchiseId: string, data: Record<string, any>) => {
    return apiClient.post(`/franchises/${franchiseId}/pricing/override`, data);
  },
  getSettlements: async (franchiseId: string) => {
    return apiClient.get(`/franchises/${franchiseId}/settlements`);
  },
  generateSettlement: async (franchiseId: string, data: { periodStart: string; periodEnd: string; notes?: string }) => {
    return apiClient.post(`/franchises/${franchiseId}/settlements/generate`, data);
  },
  approveSettlement: async (settlementId: string) => {
    return apiClient.patch(`/franchises/settlements/${settlementId}/approve`);
  },
};

// Identity & Statutory Verification API Services (Slice 3.4)
export const identityVerificationApi = {
  verifyPan: async (data: { pan: string; expectedName?: string; userId?: string; partnerId?: string }) => {
    return apiClient.post('/identity-verification/pan', data);
  },
  verifyGst: async (data: { gstin: string; expectedTradeName?: string; userId?: string; partnerId?: string; franchiseId?: string }) => {
    return apiClient.post('/identity-verification/gst', data);
  },
  verifyDigiLocker: async (data: { documentType: string; authCode?: string; userId?: string; partnerId?: string }) => {
    return apiClient.post('/identity-verification/digilocker', data);
  },
  getQueue: async (params?: { status?: string }) => {
    return apiClient.get('/identity-verification/queue', { params });
  },
  retryVerification: async (id: string) => {
    return apiClient.post(`/identity-verification/${id}/retry`);
  },
};

// Customer Self-Service Portal API (Slice 1.11)
export const customerPortalApi = {
  getDashboard: async () => {
    return apiClient.get('/customer-portal/dashboard');
  },
  getMyApplications: async () => {
    return apiClient.get('/customer-portal/applications');
  },
  getApplicationDetail: async (id: string) => {
    return apiClient.get(`/customer-portal/applications/${id}`);
  },
  getMyVault: async () => {
    return apiClient.get('/customer-portal/vault');
  },
  getMyBilling: async () => {
    return apiClient.get('/customer-portal/billing');
  },
};

// Operational Dashboards & Reporting API Services (Slice 1.12)
export const reportsApi = {
  getDashboard: async (params?: Record<string, any>) => {
    return apiClient.get('/reports/dashboard', { params });
  },
  getRevenue: async (params?: Record<string, any>) => {
    return apiClient.get('/reports/revenue', { params });
  },
  getLeads: async (params?: Record<string, any>) => {
    return apiClient.get('/reports/leads', { params });
  },
  getOperations: async (params?: Record<string, any>) => {
    return apiClient.get('/reports/operations', { params });
  },
  getBranches: async (params?: Record<string, any>) => {
    return apiClient.get('/reports/branches', { params });
  },
  exportReport: async (data: {
    reportType: string;
    format?: 'csv' | 'json';
    startDate?: string;
    endDate?: string;
    branchId?: string;
  }) => {
    return apiClient.post('/reports/export', data, {
      responseType: 'blob',
    });
  },
};

// CMS & Knowledge Base API Services (Slice 1.13)
export const cmsApi = {
  getAdminPosts: async (params?: Record<string, any>) => {
    return apiClient.get('/cms/admin/posts', { params });
  },
  getPublicPosts: async (params?: Record<string, any>) => {
    return apiClient.get('/cms/posts', { params });
  },
  getCategories: async () => {
    return apiClient.get('/cms/categories');
  },
  createPost: async (data: Record<string, any>) => {
    return apiClient.post('/cms/posts', data);
  },
  updatePost: async (id: string, data: Record<string, any>) => {
    return apiClient.patch(`/cms/posts/${id}`, data);
  },
  deletePost: async (id: string) => {
    return apiClient.delete(`/cms/posts/${id}`);
  },
  createCategory: async (data: Record<string, any>) => {
    return apiClient.post('/cms/categories', data);
  },
};

// SLA & 4-Tier Auto-Escalation API Services (Slice 2.2)
export const slaApi = {
  getDashboard: async () => {
    return apiClient.get('/sla/dashboard');
  },
  getEscalations: async (params?: Record<string, any>) => {
    return apiClient.get('/sla/escalations', { params });
  },
  evaluateSla: async (data?: { instanceId?: string; referenceTime?: string }) => {
    return apiClient.post('/sla/evaluate', data || {});
  },
  acknowledgeEscalation: async (id: string, data?: { remarks?: string }) => {
    return apiClient.patch(`/sla/escalations/${id}/acknowledge`, data || {});
  },
  resolveEscalation: async (id: string, data?: { remarks?: string }) => {
    return apiClient.patch(`/sla/escalations/${id}/resolve`, data || {});
  },
};

// Intelligent Task Engine & Workload Balancing API Services (Slice 2.3)
export const tasksApi = {
  getDashboard: async () => {
    return apiClient.get('/tasks/dashboard');
  },
  getTasks: async (params?: Record<string, any>) => {
    return apiClient.get('/tasks', { params });
  },
  getTaskById: async (id: string) => {
    return apiClient.get(`/tasks/${id}`);
  },
  getCandidates: async (id: string) => {
    return apiClient.get(`/tasks/${id}/candidates`);
  },
  createTask: async (data: Record<string, any>) => {
    return apiClient.post('/tasks', data);
  },
  updateTask: async (id: string, data: Record<string, any>) => {
    return apiClient.patch(`/tasks/${id}`, data);
  },
  reassignTask: async (id: string, data: { assignedToId: string; reason?: string }) => {
    return apiClient.patch(`/tasks/${id}/reassign`, data);
  },
  completeTask: async (id: string, data?: { completionNotes?: string }) => {
    return apiClient.patch(`/tasks/${id}/complete`, data || {});
  },
};

// Branch Hierarchy & Regional Operations Hubs API Services (Slice 2.4)
export const branchesApi = {
  getRegions: async () => {
    return apiClient.get('/branches/regions');
  },
  getRegionById: async (id: string) => {
    return apiClient.get(`/branches/regions/${id}`);
  },
  createRegion: async (data: Record<string, any>) => {
    return apiClient.post('/branches/regions', data);
  },
  updateRegion: async (id: string, data: Record<string, any>) => {
    return apiClient.patch(`/branches/regions/${id}`, data);
  },
  deleteRegion: async (id: string) => {
    return apiClient.delete(`/branches/regions/${id}`);
  },
  getBranches: async (params?: Record<string, any>) => {
    return apiClient.get('/branches', { params });
  },
  getBranchById: async (id: string) => {
    return apiClient.get(`/branches/${id}`);
  },
  createBranch: async (data: Record<string, any>) => {
    return apiClient.post('/branches', data);
  },
  updateBranch: async (id: string, data: Record<string, any>) => {
    return apiClient.patch(`/branches/${id}`, data);
  },
  getTargets: async (params?: Record<string, any>) => {
    return apiClient.get('/branches/targets', { params });
  },
  setTarget: async (data: Record<string, any>) => {
    return apiClient.post('/branches/targets', data);
  },
  getPerformance: async (targetPeriod?: string) => {
    return apiClient.get('/branches/performance', {
      params: targetPeriod ? { targetPeriod } : {},
    });
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 4: AUTOMATION, AI & DOCUMENT INTELLIGENCE
// ═══════════════════════════════════════════════════════════════════════════

// Vertical Slice 4.1: AI-Powered Lead Scoring & Priority Queue
export const leadScoringApi = {
  getPriorityQueue: async (params?: { minScore?: number; grade?: string; priorityRank?: string; limit?: number; offset?: number }) => {
    return apiClient.get('/leads/priority-queue', { params });
  },
  recalculateScore: async (leadId: string) => {
    return apiClient.post(`/leads/${leadId}/recalculate-score`);
  },
  getScoreBreakdown: async (leadId: string) => {
    return apiClient.get(`/leads/${leadId}/score-breakdown`);
  },
};

// Vertical Slice 4.2: Document OCR & Automated Verification Assistant
export const documentOcrApi = {
  runOcr: async (documentId: string) => {
    return apiClient.post(`/documents/${documentId}/ocr`);
  },
  getOcrResult: async (documentId: string) => {
    return apiClient.get(`/documents/${documentId}/ocr`);
  },
  autoVerify: async (documentId: string, data?: { remarks?: string; overrideDecision?: 'APPROVE' | 'REJECT' }) => {
    return apiClient.patch(`/documents/${documentId}/auto-verify`, data || {});
  },
};

// Vertical Slice 4.3: Crazy Capital AI Operations Copilot
export const copilotApi = {
  chat: async (data: { sessionId?: string; message: string; contextType?: string; contextId?: string }) => {
    return apiClient.post('/copilot/chat', data);
  },
  draftFollowup: async (data: {
    leadId?: string;
    applicationId?: string;
    channel: 'EMAIL' | 'WHATSAPP' | 'SMS';
    intent: 'DOCUMENT_MISSING' | 'PAYMENT_PENDING' | 'STAGE_UPDATE' | 'WELCOME_PROPOSAL' | 'GENERAL';
    customInstructions?: string;
  }) => {
    return apiClient.post('/copilot/draft-followup', data);
  },
  suggestNextAction: async (applicationId: string) => {
    return apiClient.get(`/copilot/suggest-action/${applicationId}`);
  },
  searchKnowledge: async (q?: string) => {
    return apiClient.get('/copilot/knowledge', { params: q ? { q } : {} });
  },
};

// Vertical Slice 4.4: Predictive Revenue & Turnaround Analytics
export const predictiveReportsApi = {
  getRevenueForecast: async (params?: { period?: string; branchId?: string }) => {
    return apiClient.get('/reports/predictive/revenue', { params });
  },
  getTurnaroundForecast: async (params?: { branchId?: string }) => {
    return apiClient.get('/reports/predictive/turnaround', { params });
  },
  getBottleneckRadar: async () => {
    return apiClient.get('/reports/predictive/bottlenecks');
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 5: NATIONAL SCALE PLATFORM & ENTERPRISE MULTI-TENANT SAAS
// ═══════════════════════════════════════════════════════════════════════════

// Vertical Slice 5.1: Mobile Applications (iOS & Android) Bridge
export const mobileApi = {
  registerDevice: async (data: {
    deviceToken: string;
    platform?: 'IOS' | 'ANDROID' | 'WEB_PUSH';
    deviceModel?: string;
    osVersion?: string;
    appVersion?: string;
    biometricEnabled?: boolean;
    biometricPublicKey?: string;
    pushPreferences?: Record<string, boolean>;
  }) => {
    return apiClient.post('/mobile/devices/register', data);
  },
  revokeDevice: async (deviceToken: string) => {
    return apiClient.post('/mobile/devices/revoke', { deviceToken });
  },
  getDevices: async () => {
    return apiClient.get('/mobile/devices');
  },
  getBiometricChallenge: async () => {
    return apiClient.post('/mobile/biometric/challenge');
  },
  verifyBiometric: async (data: { challengeNonce: string; signature: string; deviceToken: string }) => {
    return apiClient.post('/mobile/biometric/verify', data);
  },
  getCustomerSummary: async () => {
    return apiClient.get('/mobile/customer/summary');
  },
  getPartnerSummary: async () => {
    return apiClient.get('/mobile/partner/summary');
  },
};

// Vertical Slice 5.2: Multi-Tenant SaaS & White-Label Theming
export const saasApi = {
  resolveTenant: async (params: { host?: string; subdomain?: string }) => {
    return apiClient.get('/saas/tenant/resolve', { params });
  },
  getBranding: async () => {
    return apiClient.get('/saas/branding');
  },
  updateBranding: async (data: {
    themeConfig?: Record<string, any>;
    invoiceConfig?: Record<string, any>;
    emailConfig?: Record<string, any>;
  }) => {
    return apiClient.patch('/saas/branding', data);
  },
  listTenants: async () => {
    return apiClient.get('/saas/tenants');
  },
  createTenant: async (data: Record<string, any>) => {
    return apiClient.post('/saas/tenants', data);
  },
  verifyCustomDomain: async (data: { tenantId: string; customDomain: string }) => {
    return apiClient.post('/saas/domains/verify', data);
  },
};

// Vertical Slice 5.3: Public Developer API & Webhooks Platform
export const developerApi = {
  listKeys: async () => {
    return apiClient.get('/developer/keys');
  },
  createKey: async (data: {
    name: string;
    environment?: 'LIVE' | 'SANDBOX';
    scopes: string[];
    rateLimitPerMin?: number;
    expiresInDays?: number;
  }) => {
    return apiClient.post('/developer/keys', data);
  },
  revokeKey: async (keyId: string) => {
    return apiClient.delete(`/developer/keys/${keyId}`);
  },
  listWebhooks: async () => {
    return apiClient.get('/developer/webhooks');
  },
  createWebhook: async (data: { name: string; targetUrl: string; events: string[] }) => {
    return apiClient.post('/developer/webhooks', data);
  },
  updateWebhook: async (id: string, data: Record<string, any>) => {
    return apiClient.patch(`/developer/webhooks/${id}`, data);
  },
  deleteWebhook: async (id: string) => {
    return apiClient.delete(`/developer/webhooks/${id}`);
  },
  testWebhook: async (id: string) => {
    return apiClient.post(`/developer/webhooks/${id}/test`);
  },
  getDeliveries: async (subscriptionId: string) => {
    return apiClient.get(`/developer/webhooks/${subscriptionId}/deliveries`);
  },
  getUsageStats: async () => {
    return apiClient.get('/developer/usage');
  },
};

// Vertical Slice 5.4: Government Systems Direct Integrations
export const governmentApi = {
  lookupMcaCompany: async (name: string, checkAvailability = true) => {
    return apiClient.get('/integrations/government/mca/company-lookup', {
      params: { name, checkAvailability },
    });
  },
  lookupGstnTaxpayer: async (gstin: string) => {
    return apiClient.get(`/integrations/government/gstn/lookup/${gstin}`);
  },
  initiateAaConsent: async (data: {
    customerId: string;
    mobile: string;
    vpa?: string;
    fipId: string;
    statementMonthsCount?: number;
  }) => {
    return apiClient.post('/integrations/government/account-aggregator/consent', data);
  },
  getAaStatementData: async (consentId: string) => {
    return apiClient.get(`/integrations/government/account-aggregator/consent/${consentId}`);
  },
  getHealth: async () => {
    return apiClient.get('/integrations/government/health');
  },
  getAuditLogs: async () => {
    return apiClient.get('/integrations/government/logs');
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 6: ENTERPRISE COMPLIANCE, SUBSCRIPTIONS & TELEMETRY
// ═══════════════════════════════════════════════════════════════════════════

// Vertical Slice 6.1: Immutable Audit Log Vault & Regulatory DPDP Compliance
export const complianceApi = {
  getAuditLogs: async (params?: Record<string, any>) => {
    return apiClient.get('/compliance/audit-logs', { params });
  },
  createExport: async (data: {
    exportType: string;
    format?: string;
    dateRangeFrom?: string;
    dateRangeTo?: string;
    targetUserId?: string;
    filters?: Record<string, any>;
  }) => {
    return apiClient.post('/compliance/exports', data);
  },
  listExports: async () => {
    return apiClient.get('/compliance/exports');
  },
  executeDataErasure: async (targetUserId: string) => {
    return apiClient.post('/compliance/data-erasure', { targetUserId });
  },
};

// Vertical Slice 6.2: Open Banking & Recurring UPI/e-Mandate Subscriptions
export const mandatesApi = {
  createMandate: async (data: {
    customerId: string;
    serviceId?: string;
    planName: string;
    frequency: string;
    amount: number;
    paymentMethod?: string;
    vpaOrAccount?: string;
    startDate?: string;
  }) => {
    return apiClient.post('/mandates', data);
  },
  listMandates: async (customerId?: string) => {
    return apiClient.get('/mandates', { params: { customerId } });
  },
  executeDebit: async (mandateId: string, data?: { amountOverride?: number; description?: string }) => {
    return apiClient.post(`/mandates/${mandateId}/debit`, data || {});
  },
  updateStatus: async (mandateId: string, data: { status: 'ACTIVE' | 'PAUSED' | 'CANCELLED'; reason?: string }) => {
    return apiClient.patch(`/mandates/${mandateId}/status`, data);
  },
};

// Vertical Slice 6.4: Unified Synthetic Health & Telemetry Diagnostics
export const telemetryApi = {
  getHealth: async () => {
    return apiClient.get('/telemetry/health');
  },
  recordProbe: async (data: {
    serviceName: string;
    endpoint: string;
    statusCode: number;
    latencyMs: number;
    status?: string;
    errorMessage?: string;
  }) => {
    return apiClient.post('/telemetry/probes', data);
  },
  getProbeHistory: async (serviceName?: string, limit?: number) => {
    return apiClient.get('/telemetry/probes', { params: { serviceName, limit } });
  },
};



