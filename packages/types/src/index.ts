// ─── Enums ───────────────────────────────────────────────────────────────────

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  BRANCH_MANAGER = 'BRANCH_MANAGER',
  EMPLOYEE = 'EMPLOYEE',
  PARTNER = 'PARTNER',
  CUSTOMER = 'CUSTOMER',
}

export enum LeadStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  QUALIFIED = 'QUALIFIED',
  PROPOSAL = 'PROPOSAL',
  CONVERTED = 'CONVERTED',
  LOST = 'LOST',
}

export enum ApplicationStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REJECTED = 'REJECTED',
}

export enum WorkflowStageType {
  START = 'START',
  PROCESSING = 'PROCESSING',
  APPROVAL = 'APPROVAL',
  COMPLETION = 'COMPLETION',
  REJECTION = 'REJECTION',
}

export enum DocumentStatus {
  PENDING = 'PENDING',
  UPLOADED = 'UPLOADED',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  CAPTURED = 'CAPTURED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

export enum CommissionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PAID = 'PAID',
}

export enum CustomerType {
  INDIVIDUAL = 'INDIVIDUAL',
  BUSINESS = 'BUSINESS',
}

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

// ─── Base Types ───────────────────────────────────────────────────────────────

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors: string[];
}

// ─── Auth Types ───────────────────────────────────────────────────────────────

export interface JwtPayload {
  sub: string;          // userId
  email: string;
  organizationId: string;
  branchId: string | null;
  roles: UserRole[];
  permissions: string[];
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  expiresIn: number;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  mobile: string | null;
  organizationId: string;
  branchId: string | null;
  roles: UserRole[];
  permissions: string[];
  lastLoginAt: string | null;
  createdAt: string;
}

// ─── Scope Context (injected by ScopeInterceptor) ────────────────────────────

export interface RequestScopeContext {
  userId: string;
  organizationId: string;
  branchId: string | null;
  roles: UserRole[];
  permissions: string[];
}

// ─── CRM Domain Types ────────────────────────────────────────────────────────

export enum LeadActivityType {
  CALL = 'CALL',
  EMAIL = 'EMAIL',
  WHATSAPP = 'WHATSAPP',
  MEETING = 'MEETING',
  NOTE = 'NOTE',
  STATUS_CHANGE = 'STATUS_CHANGE',
}

export enum CustomerAddressType {
  REGISTERED = 'REGISTERED',
  BILLING = 'BILLING',
  MAILING = 'MAILING',
}

export interface LeadSourceDto {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LeadActivityDto {
  id: string;
  leadId: string;
  performedById: string | null;
  performedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  activityType: LeadActivityType | string;
  notes: string | null;
  createdAt: string;
}

export interface LeadAssignmentDto {
  id: string;
  leadId: string;
  assignedFrom: string | null;
  assignedTo: string;
  assignedAt: string;
}

export interface LeadDto {
  id: string;
  organizationId: string;
  branchId: string | null;
  sourceId: string | null;
  assignedToId: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  mobile: string;
  companyName: string | null;
  status: LeadStatus | string;
  leadScore: number;
  notes: string | null;
  campaign: string | null;
  convertedToId: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  source?: LeadSourceDto | null;
  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  branch?: {
    id: string;
    name: string;
    code: string;
    city: string | null;
  } | null;
  activities?: LeadActivityDto[];
  assignments?: LeadAssignmentDto[];
}

export interface CreateLeadInput {
  firstName: string;
  lastName: string;
  email?: string | null;
  mobile: string;
  companyName?: string | null;
  sourceCode?: string | null;
  sourceId?: string | null;
  branchId?: string | null;
  notes?: string | null;
  campaign?: string | null;
  leadScore?: number;
}

export interface UpdateLeadInput {
  firstName?: string;
  lastName?: string;
  email?: string | null;
  mobile?: string;
  companyName?: string | null;
  sourceId?: string | null;
  branchId?: string | null;
  notes?: string | null;
  campaign?: string | null;
  leadScore?: number;
}

export interface ChangeLeadStatusInput {
  status: LeadStatus;
  remarks?: string;
}

export interface AssignLeadInput {
  assignedToUserId: string;
  remarks?: string;
}

export interface CreateLeadActivityInput {
  activityType: LeadActivityType | string;
  notes: string;
}

export interface QueryLeadsInput {
  page?: number;
  limit?: number;
  search?: string;
  status?: LeadStatus | string;
  branchId?: string;
  sourceId?: string;
  assignedToId?: string;
  createdAtFrom?: string;
  createdAtTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateLeadSourceInput {
  name: string;
  code: string;
  isActive?: boolean;
}

export interface UpdateLeadSourceInput {
  name?: string;
  code?: string;
  isActive?: boolean;
}

// ─── Customer Domain Types ───────────────────────────────────────────────────

export interface CustomerAddressDto {
  id: string;
  customerId: string;
  type: CustomerAddressType | string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  country: string;
  pincode: string;
  createdAt: string;
}

export interface CustomerContactDto {
  id: string;
  customerId: string;
  name: string;
  mobile: string;
  email: string | null;
  designation: string | null;
  createdAt: string;
}

export interface CustomerDto {
  id: string;
  organizationId: string;
  branchId: string | null;
  customerType: CustomerType | string;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  companyName: string | null;
  pan: string | null;
  gstin: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  branch?: {
    id: string;
    name: string;
    code: string;
  } | null;
  addresses?: CustomerAddressDto[];
  contacts?: CustomerContactDto[];
  applications?: {
    id: string;
    applicationNumber: string;
    serviceId: string;
    status: string;
    createdAt: string;
    service?: {
      name: string;
      slug: string;
    };
  }[];
  documents?: {
    id: string;
    fileName: string;
    status: string;
    createdAt: string;
    documentType?: {
      name: string;
      code: string;
    };
  }[];
  invoices?: {
    id: string;
    invoiceNumber: string;
    amount: string | number;
    status: string;
    createdAt: string;
  }[];
}

export interface ConvertLeadInput {
  customerType?: CustomerType;
  pan?: string;
  gstin?: string;
  companyName?: string;
  address?: {
    type?: CustomerAddressType;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    country?: string;
    pincode: string;
  };
  contact?: {
    name: string;
    mobile: string;
    email?: string;
    designation?: string;
  };
}

export interface CreateCustomerInput {
  customerType: CustomerType;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  companyName?: string;
  pan?: string;
  gstin?: string;
  branchId?: string;
  addresses?: {
    type?: CustomerAddressType;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    country?: string;
    pincode: string;
  }[];
  contacts?: {
    name: string;
    mobile: string;
    email?: string;
    designation?: string;
  }[];
}

export interface UpdateCustomerInput {
  customerType?: CustomerType;
  firstName?: string;
  lastName?: string;
  email?: string;
  mobile?: string;
  companyName?: string;
  pan?: string;
  gstin?: string;
  status?: string;
  branchId?: string;
}

export interface CreateCustomerAddressInput {
  type?: CustomerAddressType;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country?: string;
  pincode: string;
}

export interface CreateCustomerContactInput {
  name: string;
  mobile: string;
  email?: string;
  designation?: string;
}

export interface QueryCustomersInput {
  page?: number;
  limit?: number;
  search?: string;
  customerType?: CustomerType | string;
  status?: string;
  branchId?: string;
  pan?: string;
  gstin?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
