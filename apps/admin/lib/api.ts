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
    const token = localStorage.getItem('cc_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    // If unwrapped in standard response
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
  verifyDocument: async (id: string, remarks?: string) => {
    return apiClient.patch(`/documents/${id}/verify`, { remarks });
  },
  rejectDocument: async (id: string, rejectionReason: string, remarks?: string) => {
    return apiClient.patch(`/documents/${id}/reject`, { rejectionReason, remarks });
  },
  deleteDocument: async (id: string) => {
    return apiClient.delete(`/documents/${id}`);
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

// Notifications & Alerts API Services (Slice 1.9)
export const notificationsApi = {
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

// Partner Commissions & Payouts API Services (Slice 1.9 / ADR-011 / ADR-014)
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
  recordManualPayout: async (data: {
    commissionId: string;
    referenceNumber: string;
    paymentMethod?: string;
    notes?: string;
  }) => {
    return apiClient.post('/payouts', data);
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
