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

// ─── Service Catalog Domain Types (Vertical Slice 1.4) ───────────────────────

export enum PricingType {
  STANDARD = 'STANDARD',
  PARTNER = 'PARTNER',
  PROMOTIONAL = 'PROMOTIONAL',
}

export interface DocumentTypeDto {
  id: string;
  name: string;
  code: string;
  description: string | null;
  createdAt: string;
}

export interface ServiceCategoryDto {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  parent?: ServiceCategoryDto | null;
  children?: ServiceCategoryDto[];
  services?: ServiceDto[];
  createdAt: string;
  updatedAt: string;
}

export interface ServicePricingDto {
  id: string;
  serviceId: string;
  pricingType: PricingType | string;
  amount: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  createdAt: string;
}

export interface ServiceDocumentDto {
  id: string;
  serviceId: string;
  documentTypeId: string;
  isMandatory: boolean;
  documentType?: DocumentTypeDto;
}

export interface ServiceDto {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  category?: ServiceCategoryDto;
  pricing?: ServicePricingDto[];
  requiredDocuments?: ServiceDocumentDto[];
  workflow?: WorkflowDto | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateServiceCategoryInput {
  parentId?: string | null;
  name: string;
  slug?: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateServiceCategoryInput {
  parentId?: string | null;
  name?: string;
  slug?: string;
  description?: string;
  isActive?: boolean;
}

export interface CreateServiceInput {
  categoryId: string;
  name: string;
  slug?: string;
  description?: string;
  isActive?: boolean;
  standardPrice?: number;
  partnerPrice?: number;
  requiredDocumentTypeIds?: { documentTypeId: string; isMandatory?: boolean }[];
}

export interface UpdateServiceInput {
  categoryId?: string;
  name?: string;
  slug?: string;
  description?: string;
  isActive?: boolean;
}

export interface CreateServicePricingInput {
  pricingType: PricingType | string;
  amount: number;
  effectiveFrom?: string;
  effectiveTo?: string;
}

export interface CreateServiceDocumentInput {
  documentTypeId: string;
  isMandatory?: boolean;
}

export interface QueryServicesInput {
  page?: number;
  limit?: number;
  categoryId?: string;
  isActive?: boolean;
  search?: string;
}

// ─── Workflow Engine Domain Types (Vertical Slice 1.5 - ADR-012) ─────────────

export enum WorkflowRuleType {
  DOCUMENT_GATE = 'DOCUMENT_GATE',
  PAYMENT_GATE = 'PAYMENT_GATE',
  APPROVAL_GATE = 'APPROVAL_GATE',
}

export interface WorkflowRuleConfig {
  mandatoryDocumentTypeIds?: string[];
  requireAllVerified?: boolean;
  minPaymentPercentage?: number;
  requiredRole?: UserRole | string;
  [key: string]: any;
}

export interface WorkflowRuleDto {
  id: string;
  stageId: string;
  ruleType: WorkflowRuleType | string;
  ruleConfig: WorkflowRuleConfig;
}

export interface WorkflowTransitionDto {
  id: string;
  workflowId: string;
  fromStageId: string;
  toStageId: string;
  requiresApproval: boolean;
  fromStage?: WorkflowStageDto;
  toStage?: WorkflowStageDto;
  createdAt: string;
}

export interface WorkflowStageDto {
  id: string;
  workflowId: string;
  name: string;
  code: string;
  stageOrder: number;
  stageType: WorkflowStageType | string;
  isStartStage: boolean;
  isEndStage: boolean;
  isMandatory: boolean;
  slaHours: number | null;
  rules?: WorkflowRuleDto[];
  fromTransitions?: WorkflowTransitionDto[];
  toTransitions?: WorkflowTransitionDto[];
  createdAt: string;
}

export interface WorkflowDto {
  id: string;
  serviceId: string;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  stages?: WorkflowStageDto[];
  transitions?: WorkflowTransitionDto[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkflowInput {
  serviceId: string;
  name: string;
  code?: string;
  description?: string;
  isActive?: boolean;
  stages?: {
    name: string;
    code: string;
    stageOrder: number;
    stageType?: WorkflowStageType;
    isStartStage?: boolean;
    isEndStage?: boolean;
    isMandatory?: boolean;
    slaHours?: number;
  }[];
}

export interface CreateWorkflowStageInput {
  name: string;
  code: string;
  stageOrder: number;
  stageType?: WorkflowStageType;
  isStartStage?: boolean;
  isEndStage?: boolean;
  isMandatory?: boolean;
  slaHours?: number;
}

export interface CreateWorkflowTransitionInput {
  fromStageId: string;
  toStageId: string;
  requiresApproval?: boolean;
}

export interface CreateWorkflowRuleInput {
  ruleType: WorkflowRuleType | string;
  ruleConfig: WorkflowRuleConfig;
}

export interface WorkflowHistoryDto {
  id: string;
  workflowInstanceId: string;
  fromStageId: string;
  toStageId: string;
  performedById: string | null;
  remarks: string | null;
  fromStage?: WorkflowStageDto;
  toStage?: WorkflowStageDto;
  performedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  createdAt: string;
}

export interface WorkflowInstanceDto {
  id: string;
  workflowId: string;
  applicationId: string;
  currentStageId: string;
  currentStage?: WorkflowStageDto;
  workflow?: WorkflowDto;
  startedAt: string;
  completedAt: string | null;
  history?: WorkflowHistoryDto[];
}

export interface TransitionWorkflowInstanceInput {
  targetStageId: string;
  remarks?: string;
}

// ─── Application Lifecycle Domain Types (Vertical Slice 1.6) ────────────────

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface TaskDto {
  id: string;
  applicationId: string;
  workflowStageId: string | null;
  assignedToId: string | null;
  title: string;
  description: string | null;
  status: TaskStatus | string;
  dueDate: string | null;
  completedAt: string | null;
  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  createdAt: string;
}

export interface ApprovalDto {
  id: string;
  workflowInstanceId: string;
  stageId: string;
  requestedById: string;
  approvedById: string | null;
  status: ApprovalStatus | string;
  remarks: string | null;
  createdAt: string;
  decidedAt: string | null;
}

export interface ApplicationActivityDto {
  id: string;
  applicationId: string;
  performedById: string | null;
  activityType: string;
  notes: string | null;
  performedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  createdAt: string;
}

export interface ApplicationDto {
  id: string;
  organizationId: string;
  branchId: string | null;
  customerId: string;
  serviceId: string;
  applicationNumber: string;
  status: ApplicationStatus | string;
  assignedToId: string | null;
  customer?: CustomerDto;
  service?: ServiceDto;
  branch?: {
    id: string;
    name: string;
    code: string;
    city: string;
  } | null;
  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    mobile: string;
  } | null;
  workflowInstance?: WorkflowInstanceDto | null;
  tasks?: TaskDto[];
  activities?: ApplicationActivityDto[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateApplicationInput {
  customerId: string;
  serviceId: string;
  branchId?: string;
  assignedToId?: string;
  notes?: string;
}

export interface AssignApplicationInput {
  assignedToUserId: string;
  remarks?: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  workflowStageId?: string;
  assignedToId?: string;
  dueDate?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  assignedToId?: string;
  dueDate?: string;
}

export interface CreateApplicationActivityInput {
  activityType: string;
  notes: string;
}

export interface QueryApplicationsInput {
  page?: number;
  limit?: number;
  customerId?: string;
  serviceId?: string;
  branchId?: string;
  assignedToId?: string;
  status?: ApplicationStatus | string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ─── Domain 7: Document Types & Secure Vault ─────────────────────────────────

export interface DocumentTypeDto {
  id: string;
  name: string;
  code: string;
  description: string | null;
  createdAt: string;
}

export interface DocumentDto {
  id: string;
  organizationId: string;
  branchId: string | null;
  customerId: string;
  applicationId: string | null;
  documentTypeId: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  status: DocumentStatus;
  uploadedById: string | null;
  createdAt: string;
  updatedAt: string;
  documentType?: DocumentTypeDto;
  verifications?: DocumentVerificationDto[];
}

export interface DocumentVerificationDto {
  id: string;
  documentId: string;
  verifiedById: string | null;
  status: 'VERIFIED' | 'REJECTED';
  remarks: string | null;
  verifiedAt: string;
  verifiedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface PresignedUploadResponse {
  uploadUrl: string;
  documentId: string;
  storageKey: string;
  expiresInSeconds: number;
}

export interface PresignedDownloadResponse {
  downloadUrl: string;
  fileName: string;
  mimeType: string;
  expiresInSeconds: number;
}

export interface RequestPresignedUploadInput {
  customerId: string;
  applicationId?: string;
  documentTypeId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export interface ConfirmUploadInput {
  fileSize?: number;
  checksumSha256?: string;
}

export interface VerifyDocumentInput {
  remarks?: string;
}

export interface RejectDocumentInput {
  rejectionReason: string;
}

export interface QueryDocumentsInput {
  page?: number;
  limit?: number;
  customerId?: string;
  applicationId?: string;
  documentTypeId?: string;
  status?: DocumentStatus;
  search?: string;
}


