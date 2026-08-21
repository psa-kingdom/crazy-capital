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

// Workflow Engine API Services (ADR-012)
export const workflowsApi = {
  createWorkflow: async (data: Record<string, any>) => {
    return apiClient.post('/workflows', data);
  },
  getWorkflowById: async (id: string) => {
    return apiClient.get(`/workflows/${id}`);
  },
  getWorkflowByServiceId: async (serviceId: string) => {
    return apiClient.get(`/services/${serviceId}/workflow`);
  },
  updateWorkflow: async (id: string, data: Record<string, any>) => {
    return apiClient.patch(`/workflows/${id}`, data);
  },
  addStage: async (workflowId: string, data: Record<string, any>) => {
    return apiClient.post(`/workflows/${workflowId}/stages`, data);
  },
  addTransition: async (workflowId: string, data: Record<string, any>) => {
    return apiClient.post(`/workflows/${workflowId}/transitions`, data);
  },
  addRule: async (stageId: string, data: Record<string, any>) => {
    return apiClient.post(`/workflows/stages/${stageId}/rules`, data);
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

