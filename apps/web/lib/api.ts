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
    const token = localStorage.getItem('cc_customer_token') || localStorage.getItem('cc_access_token');
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

// Document Vault Services (Slice 1.7 - ADR-018)
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
  deleteDocument: async (id: string) => {
    return apiClient.delete(`/documents/${id}`);
  },
  getDocumentTypes: async () => {
    return apiClient.get('/document-types');
  },
};

// Services & Catalog
export const servicesApi = {
  getServices: async (params?: Record<string, any>) => {
    return apiClient.get('/services', { params });
  },
  getServiceById: async (id: string) => {
    return apiClient.get(`/services/${id}`);
  },
};

// Customer Applications
export const applicationsApi = {
  getApplications: async (params?: Record<string, any>) => {
    return apiClient.get('/applications', { params });
  },
  getApplicationById: async (id: string) => {
    return apiClient.get(`/applications/${id}`);
  },
};

// Public Lead Capture
export const crmApi = {
  createLead: async (data: Record<string, any>) => {
    return apiClient.post('/leads', data);
  },
};

// Billing & Payments (Slice 1.8 - ADR-014)
export const invoicesApi = {
  getInvoices: async (params?: Record<string, any>) => {
    return apiClient.get('/invoices', { params });
  },
  getInvoiceById: async (id: string) => {
    return apiClient.get(`/invoices/${id}`);
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
};

// Customer Notifications (Slice 1.9)
export const notificationsApi = {
  getMyNotifications: async () => {
    return apiClient.get('/notifications/my');
  },
};

// Partner Portal API (Slice 1.9 / ADR-011 / ADR-014)
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
};


