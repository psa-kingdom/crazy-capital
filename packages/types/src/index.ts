// ─── Enums / Const Maps ────────────────────────────────────────────────────────

export const UserRole = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  BRANCH_MANAGER: 'BRANCH_MANAGER',
  EMPLOYEE: 'EMPLOYEE',
  PARTNER: 'PARTNER',
  CUSTOMER: 'CUSTOMER',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const LeadStatus = {
  NEW: 'NEW',
  CONTACTED: 'CONTACTED',
  QUALIFIED: 'QUALIFIED',
  PROPOSAL: 'PROPOSAL',
  CONVERTED: 'CONVERTED',
  LOST: 'LOST',
} as const;
export type LeadStatus = (typeof LeadStatus)[keyof typeof LeadStatus];

export const ApplicationStatus = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  REJECTED: 'REJECTED',
} as const;
export type ApplicationStatus = (typeof ApplicationStatus)[keyof typeof ApplicationStatus];

export const WorkflowStageType = {
  START: 'START',
  PROCESSING: 'PROCESSING',
  APPROVAL: 'APPROVAL',
  COMPLETION: 'COMPLETION',
  REJECTION: 'REJECTION',
} as const;
export type WorkflowStageType = (typeof WorkflowStageType)[keyof typeof WorkflowStageType];

export const DocumentStatus = {
  PENDING: 'PENDING',
  UPLOADED: 'UPLOADED',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
} as const;
export type DocumentStatus = (typeof DocumentStatus)[keyof typeof DocumentStatus];

export const PaymentStatus = {
  PENDING: 'PENDING',
  CAPTURED: 'CAPTURED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const InvoiceStatus = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  PAID: 'PAID',
  CANCELLED: 'CANCELLED',
} as const;
export type InvoiceStatus = (typeof InvoiceStatus)[keyof typeof InvoiceStatus];

export const CommissionStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  PAID: 'PAID',
} as const;
export type CommissionStatus = (typeof CommissionStatus)[keyof typeof CommissionStatus];

export const CustomerType = {
  INDIVIDUAL: 'INDIVIDUAL',
  BUSINESS: 'BUSINESS',
} as const;
export type CustomerType = (typeof CustomerType)[keyof typeof CustomerType];

export const TaskStatus = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  UNDER_REVIEW: 'UNDER_REVIEW',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  BLOCKED: 'BLOCKED',
} as const;
export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export const BlogPostStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',
} as const;
export type BlogPostStatus = (typeof BlogPostStatus)[keyof typeof BlogPostStatus];

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

export const LeadActivityType = {
  CALL: 'CALL',
  EMAIL: 'EMAIL',
  WHATSAPP: 'WHATSAPP',
  MEETING: 'MEETING',
  NOTE: 'NOTE',
  STATUS_CHANGE: 'STATUS_CHANGE',
} as const;
export type LeadActivityType = (typeof LeadActivityType)[keyof typeof LeadActivityType];

export const CustomerAddressType = {
  REGISTERED: 'REGISTERED',
  BILLING: 'BILLING',
  MAILING: 'MAILING',
} as const;
export type CustomerAddressType = (typeof CustomerAddressType)[keyof typeof CustomerAddressType];

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

export const PricingType = {
  STANDARD: 'STANDARD',
  PARTNER: 'PARTNER',
  PROMOTIONAL: 'PROMOTIONAL',
} as const;
export type PricingType = (typeof PricingType)[keyof typeof PricingType];

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

// ─── Workflow Engine Domain Types (Vertical Slice 1.5 & 2.1 - ADR-012) ─────────────

export const WorkflowRuleType = {
  DOCUMENT_GATE: 'DOCUMENT_GATE',
  PAYMENT_GATE: 'PAYMENT_GATE',
  APPROVAL_GATE: 'APPROVAL_GATE',
  CUSTOM_VALIDATION: 'CUSTOM_VALIDATION',
} as const;
export type WorkflowRuleType = (typeof WorkflowRuleType)[keyof typeof WorkflowRuleType];

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
  ruleConfig: WorkflowRuleConfig | Record<string, any>;
  createdAt?: string;
}

export interface WorkflowTransitionDto {
  id: string;
  workflowId: string;
  fromStageId: string;
  toStageId: string;
  requiresApproval: boolean;
  conditionLabel?: string | null;
  fromStage?: WorkflowStageDto;
  toStage?: WorkflowStageDto;
  createdAt?: string;
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
  warningHours?: number | null;
  department?: string | null;
  canvasX?: number | null;
  canvasY?: number | null;
  rules?: WorkflowRuleDto[];
  fromTransitions?: WorkflowTransitionDto[];
  toTransitions?: WorkflowTransitionDto[];
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkflowDto {
  id: string;
  serviceId: string;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  service?: {
    id: string;
    name: string;
    code: string;
    category?: {
      id: string;
      name: string;
      code: string;
    };
  };
  stages: WorkflowStageDto[];
  transitions: WorkflowTransitionDto[];
  _count?: {
    instances?: number;
    stages?: number;
    transitions?: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkflowNodeDto {
  id: string;
  type: 'start' | 'processing' | 'approval' | 'completion' | 'rejection';
  label: string;
  code: string;
  stageOrder: number;
  stageType?: string;
  slaHours: number | null;
  warningHours?: number | null;
  isStartStage: boolean;
  isEndStage: boolean;
  isMandatory: boolean;
  rulesCount: number;
  rules?: WorkflowRuleDto[];
  position: { x: number; y: number };
}

export interface WorkflowEdgeDto {
  id: string;
  source: string;
  target: string;
  label?: string | null;
  requiresApproval: boolean;
  animated?: boolean;
}

export interface WorkflowGraphDto {
  workflowId: string;
  workflowName: string;
  workflowCode: string;
  serviceId: string;
  serviceName: string;
  isActive: boolean;
  nodes: WorkflowNodeDto[];
  edges: WorkflowEdgeDto[];
  isCyclic: boolean;
  startNodeId: string | null;
  terminalNodeIds: string[];
  validationWarnings: string[];
  validationErrors: string[];
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
  warningHours?: number;
  department?: string;
}

export interface UpdateWorkflowStageInput {
  name?: string;
  code?: string;
  stageOrder?: number;
  stageType?: WorkflowStageType;
  isStartStage?: boolean;
  isEndStage?: boolean;
  isMandatory?: boolean;
  slaHours?: number | null;
  warningHours?: number | null;
  department?: string | null;
}

export interface BulkUpdateWorkflowGraphInput {
  stages: {
    id?: string;
    name: string;
    code: string;
    stageOrder: number;
    stageType: WorkflowStageType;
    isStartStage: boolean;
    isEndStage: boolean;
    isMandatory?: boolean;
    slaHours?: number | null;
    warningHours?: number | null;
    positionX?: number;
    positionY?: number;
  }[];
  transitions: {
    fromStageCode: string;
    toStageCode: string;
    requiresApproval?: boolean;
    conditionLabel?: string;
  }[];
  rules?: {
    stageCode: string;
    ruleType: WorkflowRuleType;
    ruleConfig: Record<string, any>;
  }[];
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

export const ApprovalStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;
export type ApprovalStatus = (typeof ApprovalStatus)[keyof typeof ApprovalStatus];

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
  applicationId?: string;
  workflowStageId?: string;
  title: string;
  description?: string;
  taskType?: TaskType | string;
  priority?: TaskPriority | string;
  department?: string;
  requiredSkill?: string;
  estimatedHours?: number;
  slaHours?: number;
  dueDate?: string;
  assignedToId?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority | string;
  assignedToId?: string;
  dueDate?: string;
  completionNotes?: string;
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

// ─── Domain 8: Payment Gateway & Invoicing (Vertical Slice 1.8) ─────────────

export interface InvoiceDto {
  id: string;
  customerId: string;
  applicationId: string | null;
  invoiceNumber: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  status: InvoiceStatus | string;
  customer?: {
    id: string;
    fullName: string;
    companyName: string | null;
    email: string;
    mobile: string;
    gstin?: string | null;
  };
  application?: {
    id: string;
    applicationNumber: string;
    service?: {
      id: string;
      name: string;
      code: string;
      basePrice: number;
    };
  } | null;
  payments?: PaymentDto[];
  createdAt: string;
  updatedAt: string;
}

export interface PaymentDto {
  id: string;
  invoiceId: string;
  gateway: string;
  gatewayReference: string;
  amount: number;
  status: PaymentStatus | string;
  rawPayload?: any;
  createdAt: string;
}

export interface CreateInvoiceInput {
  customerId: string;
  applicationId?: string;
  baseAmount: number;
  taxAmount?: number;
  notes?: string;
}

export interface UpdateInvoiceStatusInput {
  status: InvoiceStatus | string;
  reason?: string;
}

export interface QueryInvoicesInput {
  page?: number;
  limit?: number;
  customerId?: string;
  applicationId?: string;
  status?: InvoiceStatus | string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface CreatePaymentOrderInput {
  invoiceId: string;
  paymentMethod?: string;
}

export interface RazorpayOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  invoiceId: string;
  invoiceNumber: string;
  customer: {
    name: string;
    email: string;
    mobile: string;
  };
}

export interface VerifyPaymentInput {
  invoiceId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface RecordManualPaymentInput {
  invoiceId: string;
  amount: number;
  paymentMethod: string; // 'BANK_TRANSFER' | 'NEFT' | 'RTGS' | 'CHEQUE' | 'CASH'
  referenceNumber: string; // UTR or Cheque number
  notes?: string;
}

// ─── DOMAIN 10: NOTIFICATION DOMAIN TYPES (SLICE 1.9) ───────────────────────

export type NotificationChannel = 'EMAIL' | 'SMS' | 'WHATSAPP' | 'IN_APP';

export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED' | 'DELIVERED';

export type NotificationProvider = 'RESEND' | 'MSG91' | 'INTERAKT' | 'MOCK';

export type NotificationEventType =
  | 'invoice.created'
  | 'invoice.sent'
  | 'payment.captured'
  | 'payment.failed'
  | 'workflow.stage_changed'
  | 'document.verified'
  | 'document.rejected'
  | 'lead.assigned'
  | 'auth.otp'
  | 'test.dispatch';

export interface NotificationLogDto {
  id: string;
  organizationId: string | null;
  userId: string | null;
  channel: NotificationChannel;
  eventType: NotificationEventType | string;
  recipient: string;
  subject?: string | null;
  body: string;
  status: NotificationStatus;
  provider: NotificationProvider | string;
  providerMessageId?: string | null;
  idempotencyKey?: string | null;
  attempts: number;
  errorMessage?: string | null;
  metadata?: Record<string, any> | null;
  sentAt?: string | null;
  createdAt: string;
}

export interface SendNotificationInput {
  organizationId?: string;
  userId?: string;
  channel: NotificationChannel;
  eventType: NotificationEventType | string;
  recipient: string;
  subject?: string;
  body?: string;
  templateId?: string;
  templateData?: Record<string, any>;
  idempotencyKey?: string;
  metadata?: Record<string, any>;
}

export interface QueryNotificationLogsInput {
  page?: number;
  limit?: number;
  channel?: NotificationChannel;
  status?: NotificationStatus;
  eventType?: string;
  recipient?: string;
  search?: string;
}

export interface TestDispatchNotificationInput {
  channel: NotificationChannel;
  recipient: string;
  eventType?: NotificationEventType | string;
  subject?: string;
  customMessage?: string;
}

// ─── DOMAIN 9: PARTNER & COMMISSION TYPES (Slice 1.9 & Slice 2.5 / ADR-011 / ADR-014) ────

export type PayoutStatus =
  | 'PENDING_PAYOUT'
  | 'PROCESSING'
  | 'PAID'
  | 'FAILED'
  | 'REVERSED';

export type PayoutMethod = 'BANK_TRANSFER' | 'RAZORPAYX' | 'CHEQUE' | 'UPI';

export type PayoutMode = 'IMPS' | 'NEFT' | 'RTGS' | 'UPI' | 'MANUAL';

export type PayoutProviderType = 'RAZORPAYX' | 'MANUAL' | 'MOCK';

export interface CommissionDto {
  id: string;
  applicationId: string;
  serviceId: string;
  partnerId: string;
  baseAmount: number;
  rate: number;
  amount: number;
  status: CommissionStatus;
  approvedById?: string | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  application?: {
    id: string;
    applicationNumber: string;
    status: string;
    customer?: {
      id: string;
      fullName: string;
      email?: string | null;
      mobile: string;
    } | null;
  } | null;
  service?: {
    id: string;
    name: string;
    code?: string;
    basePrice?: number;
  } | null;
  partner?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    mobile?: string | null;
    bankAccountNumber?: string | null;
    bankIfsc?: string | null;
    bankAccountName?: string | null;
    upiId?: string | null;
  } | null;
  approvedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  payouts?: PayoutDto[];
}

export interface PayoutDto {
  id: string;
  payoutReference?: string | null;
  idempotencyKey?: string | null;
  commissionId: string;
  partnerId: string;
  amount: number;
  paymentMethod: PayoutMethod | string;
  provider: PayoutProviderType | string;
  providerPayoutId?: string | null;
  fundAccountId?: string | null;
  contactId?: string | null;
  payoutMode: PayoutMode | string;
  accountNumberMasked?: string | null;
  ifsc?: string | null;
  status: PayoutStatus;
  referenceNumber?: string | null;
  failureReason?: string | null;
  initiatedById?: string | null;
  initiatedByName?: string | null;
  initiatedAt?: string | null;
  paidAt?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt?: string;
  commission?: CommissionDto | null;
  partner?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    mobile?: string | null;
    bankAccountNumber?: string | null;
    bankIfsc?: string | null;
    bankAccountName?: string | null;
    upiId?: string | null;
  } | null;
}

export interface PartnerCaseDto {
  id: string;
  applicationNumber: string;
  serviceName: string;
  customerName: string;
  status: string;
  currentStage?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PartnerStatsDto {
  totalLeads: number;
  convertedLeads: number;
  activeCases: number;
  totalCommissionEarned: number;
  pendingCommission: number;
  approvedCommission: number;
  paidCommission: number;
}

export interface CreatePartnerLeadInput {
  firstName: string;
  lastName: string;
  mobile: string;
  email?: string;
  companyName?: string;
  serviceInterest?: string;
  notes?: string;
}

export interface ApproveCommissionInput {
  notes?: string;
}

export interface RejectCommissionInput {
  reason: string;
}

export interface RecordPayoutInput {
  commissionId: string;
  paymentMethod?: PayoutMethod | string;
  referenceNumber: string; // UTR Number / Bank Transaction ID
  notes?: string;
}

export interface ExecutePayoutInput {
  commissionId: string;
  mode?: PayoutMode;
  notes?: string;
  idempotencyKey?: string;
  bankDetailsOverride?: {
    accountNumber?: string;
    ifsc?: string;
    accountName?: string;
    upiId?: string;
  };
}

export interface RetryPayoutInput {
  notes?: string;
  newMode?: PayoutMode;
}

export interface RazorpayXBalanceDto {
  balance: number;
  currency: string;
  accountNumber: string;
  isSandbox: boolean;
  status: string;
}

export interface PayoutExecutionResultDto {
  payout: PayoutDto;
  isMock: boolean;
  message: string;
}

export interface QueryCommissionsInput {
  page?: number;
  limit?: number;
  status?: CommissionStatus;
  partnerId?: string;
  serviceId?: string;
  search?: string;
}

export interface QueryPayoutsInput {
  page?: number;
  limit?: number;
  status?: PayoutStatus;
  partnerId?: string;
  search?: string;
}

// ─── DOMAIN 11: CUSTOMER SELF-SERVICE PORTAL (Slice 1.11) ───────────────────

export interface CustomerStageProgressDto {
  id: string;
  name: string;
  stageOrder: number;
  stageType: string;
  isCurrent: boolean;
  isCompleted: boolean;
}

export interface CustomerDocumentRequirementDto {
  documentTypeId: string;
  name: string;
  code: string;
  description?: string | null;
  isMandatory: boolean;
  uploadedDocument?: {
    id: string;
    fileName: string;
    fileSize?: number | null;
    fileType?: string | null;
    status: string; // PENDING_VERIFICATION, VERIFIED, REJECTED
    rejectionReason?: string | null;
    uploadedAt: string;
  } | null;
}

export interface CustomerApplicationDetailDto {
  id: string;
  applicationNumber: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  service: {
    id: string;
    name: string;
    slug?: string;
    description?: string | null;
  };
  currentStage: {
    id: string;
    name: string;
    stageOrder: number;
    stageType: string;
  };
  stages: CustomerStageProgressDto[];
  progressPercent: number;
  documents: CustomerDocumentRequirementDto[];
  invoices: InvoiceDto[];
  assignedTo?: {
    name: string;
    email: string;
  } | null;
}

export interface CustomerDashboardDto {
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    mobile: string;
    companyName?: string | null;
  };
  stats: {
    totalApplications: number;
    activeApplications: number;
    completedApplications: number;
    missingDocumentsCount: number;
    unpaidInvoicesCount: number;
    unpaidAmount: number;
  };
  activeApplications: {
    id: string;
    applicationNumber: string;
    serviceName: string;
    status: string;
    currentStageName: string;
    progressPercent: number;
    missingDocsCount: number;
    createdAt: string;
  }[];
  recentInvoices: InvoiceDto[];
}

// ─── DOMAIN 12: OPERATIONAL DASHBOARDS & REPORTING ENGINE (Slice 1.12) ──────

export interface QueryReportFilterInput {
  startDate?: string;
  endDate?: string;
  branchId?: string;
  serviceId?: string;
}

export interface ExecutiveDashboardDto {
  scope: {
    organizationId: string;
    branchId?: string | null;
    branchName?: string | null;
    isOrganizationWide: boolean;
  };
  kpis: {
    totalRevenue: number;
    totalCollected: number;
    pendingCollections: number;
    totalLeads: number;
    convertedLeads: number;
    conversionRate: number;
    totalApplications: number;
    activeApplications: number;
    completedApplications: number;
    totalCommissionsAccrued: number;
    totalCommissionsPaid: number;
  };
  leadsByStatus: { status: string; count: number; percentage: number }[];
  leadsBySource: { source: string; count: number }[];
  applicationsByStatus: { status: string; count: number }[];
  topServices: { id: string; name: string; applicationsCount: number; revenue: number }[];
  recentActivities: {
    type: 'LEAD' | 'APPLICATION' | 'PAYMENT' | 'COMMISSION';
    id: string;
    reference: string;
    description: string;
    amount?: number | null;
    timestamp: string;
  }[];
}

export interface RevenueReportDto {
  summary: {
    totalInvoiced: number;
    totalCollected: number;
    totalTax: number;
    invoicesCount: number;
    paidInvoicesCount: number;
  };
  trend: {
    date: string;
    invoiced: number;
    collected: number;
  }[];
  byService: {
    serviceId: string;
    serviceName: string;
    totalRevenue: number;
    invoicesCount: number;
  }[];
  byBranch: {
    branchId: string;
    branchName: string;
    totalRevenue: number;
    invoicesCount: number;
  }[];
}

export interface LeadsReportDto {
  summary: {
    totalLeads: number;
    convertedLeads: number;
    conversionRate: number;
    avgScore: number;
  };
  byStatus: {
    status: string;
    count: number;
    percentage: number;
  }[];
  bySource: {
    source: string;
    count: number;
    convertedCount: number;
    conversionRate: number;
  }[];
  byEmployee: {
    userId: string;
    name: string;
    email: string;
    assignedCount: number;
    convertedCount: number;
    conversionRate: number;
  }[];
}

export interface OperationsReportDto {
  summary: {
    totalApplications: number;
    inProgress: number;
    completed: number;
    rejected: number;
  };
  byService: {
    serviceId: string;
    serviceName: string;
    count: number;
    completedCount: number;
  }[];
  byStage: {
    stageId: string;
    stageName: string;
    count: number;
  }[];
  documentsStatus: {
    totalUploaded: number;
    verified: number;
    pendingReview: number;
    rejected: number;
  };
}

export interface BranchComparisonReportDto {
  branches: {
    branchId: string;
    branchName: string;
    branchCode: string;
    city: string;
    state: string;
    employeeCount: number;
    leadCount: number;
    convertedLeadCount: number;
    conversionRate: number;
    applicationCount: number;
    completedApplicationCount: number;
    totalRevenue: number;
  }[];
}

export interface ExportReportInput {
  reportType: 'DASHBOARD' | 'REVENUE' | 'LEADS' | 'OPERATIONS' | 'BRANCHES' | 'COMMISSIONS';
  format?: 'csv' | 'json';
  startDate?: string;
  endDate?: string;
  branchId?: string;
}

// ─── DOMAIN 13: CMS & KNOWLEDGE BASE DOMAIN ─────────────────────────────────

export interface BlogCategoryDto {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  sortOrder: number;
  postCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface BlogPostDto {
  id: string;
  organizationId: string;
  categoryId?: string | null;
  category?: BlogCategoryDto | null;
  authorId?: string | null;
  author?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string | null;
  readingTimeMin: number;
  status: BlogPostStatus;
  publishedAt?: string | null;
  tags: string[];
  featured: boolean;
  viewCount: number;
  // SEO Metadata
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
  canonicalUrl?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
  twitterCard?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBlogPostInput {
  title: string;
  slug?: string;
  categoryId?: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  readingTimeMin?: number;
  status?: BlogPostStatus;
  tags?: string[];
  featured?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterCard?: string;
}

export interface UpdateBlogPostInput extends Partial<CreateBlogPostInput> {}

export interface QueryBlogPostsInput {
  page?: number;
  limit?: number;
  search?: string;
  categorySlug?: string;
  tag?: string;
  status?: BlogPostStatus;
  featured?: boolean;
}

export interface CreateBlogCategoryInput {
  name: string;
  slug?: string;
  description?: string;
  icon?: string;
  sortOrder?: number;
}

export interface UpdateBlogCategoryInput extends Partial<CreateBlogCategoryInput> {}

// ─── 14 SERVICE VERTICALS DOMAIN ──────────────────────────────────────────

export interface ServiceProcessStep {
  stepNumber: number;
  title: string;
  description: string;
  estimatedDays: string;
}

export interface ServiceFaq {
  question: string;
  answer: string;
}

export interface ServiceVerticalDto {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  categoryCode: string;
  categoryName: string;
  description: string;
  iconName: string;
  badge?: string;
  startingPriceInr: number;
  governmentFeesNote: string;
  slaTimelineDays: string;
  deliverables: string[];
  features: string[];
  requiredDocuments: {
    name: string;
    mandatory: boolean;
    description: string;
  }[];
  processSteps: ServiceProcessStep[];
  faqs: ServiceFaq[];
  relatedBlogTags: string[];
  isPopular?: boolean;
}

// ─── SLA & 4-TIER AUTO-ESCALATION ENGINE (SLICE 2.2) ──────────────────────────

export type SlaStatus = 'ON_TRACK' | 'WARNING' | 'BREACHED' | 'ESCALATED' | 'COMPLETED';

export type EscalationLevel = 1 | 2 | 3 | 4;

export type EscalationRecipientRole = 'ASSIGNED_EXECUTIVE' | 'TEAM_LEAD' | 'BRANCH_MANAGER' | 'SUPER_ADMIN';

export type EscalationStatus = 'TRIGGERED' | 'ACKNOWLEDGED' | 'RESOLVED';

export interface WorkflowSlaEscalationDto {
  id: string;
  organizationId: string;
  workflowInstanceId: string;
  stageId: string;
  stageName?: string;
  stageCode?: string;
  applicationId: string;
  applicationNumber: string;
  serviceName?: string;
  customerName?: string;
  branchName?: string;
  escalationLevel: number;
  levelName: string;
  recipientUserId?: string | null;
  recipientName?: string | null;
  recipientRole: string;
  recipientEmail?: string | null;
  channels: string[];
  status: string;
  remarks?: string | null;
  triggeredAt: string;
  acknowledgedAt?: string | null;
  resolvedAt?: string | null;
}

export interface ActiveInstanceSlaTrackerDto {
  instanceId: string;
  applicationId: string;
  applicationNumber: string;
  serviceName: string;
  customerName: string;
  branchName?: string;
  currentStageId: string;
  currentStageName: string;
  currentStageCode: string;
  stageType: string;
  department?: string;
  assignedOfficerName?: string;
  assignedOfficerEmail?: string;
  stageEnteredAt: string;
  slaHours: number;
  warningHours: number;
  elapsedHours: number;
  remainingHours: number;
  percentElapsed: number;
  slaStatus: SlaStatus;
  escalationLevel: number;
  activeEscalationLevelName?: string;
  lastSlaCheckAt?: string;
}

export interface SlaDashboardStatsDto {
  totalActiveTracked: number;
  onTrackCount: number;
  warningCount: number;
  breachedCount: number;
  escalatedCount: number;
  escalationsByLevel: {
    level1: number;
    level2: number;
    level3: number;
    level4: number;
  };
  recentEscalations: WorkflowSlaEscalationDto[];
  activeTrackers: ActiveInstanceSlaTrackerDto[];
}

export interface SlaEvaluationResultDto {
  evaluatedCount: number;
  warningTriggeredCount: number;
  breachTriggeredCount: number;
  escalationsCreatedCount: number;
  notificationsDispatchedCount: number;
  durationMs: number;
  timestamp: string;
}

export interface QueryEscalationsInput {
  page?: number;
  limit?: number;
  status?: string;
  escalationLevel?: number;
  branchId?: string;
  stageId?: string;
  search?: string;
}

// ─── INTELLIGENT TASK ENGINE & WORKLOAD BALANCING (SLICE 2.3) ────────────────

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | 'CRITICAL';


export type TaskType =
  | 'STAGE_EXECUTION'
  | 'DOCUMENT_VERIFICATION'
  | 'CUSTOMER_FOLLOWUP'
  | 'GOVT_PORTAL_FILING'
  | 'MANUAL_REVIEW';

export interface TaskAssignmentHistoryDto {
  id: string;
  taskId: string;
  fromUserId?: string | null;
  fromUserName?: string | null;
  toUserId: string;
  toUserName: string;
  assignedById?: string | null;
  assignedByName?: string | null;
  reason?: string | null;
  score?: number | null;
  assignedAt: string;
}

export interface TaskDto {
  id: string;
  organizationId: string;
  branchId?: string | null;
  branchName?: string;
  applicationId: string;
  applicationNumber: string;
  serviceName: string;
  customerName: string;
  customerMobile?: string | null;
  workflowStageId?: string | null;
  workflowStageName?: string;
  workflowStageCode?: string;
  workflowInstanceId?: string | null;
  assignedToId?: string | null;
  assignedToName?: string | null;
  assignedToEmail?: string | null;
  createdById?: string | null;
  createdByName?: string | null;
  title: string;
  description?: string | null;
  taskType: TaskType | string;
  status: TaskStatus | string;
  priority: TaskPriority | string;
  requiredSkill?: string | null;
  department?: string | null;
  estimatedHours?: number;
  slaHours?: number;
  slaDueAt?: string | null;
  slaStatus: SlaStatus | string;
  escalationLevel: number;
  assignmentReason?: string | null;
  assignmentScore?: number | null;
  dueDate?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  completionNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  assignmentHistory?: TaskAssignmentHistoryDto[];
}

export interface EmployeeWorkloadDto {
  userId: string;
  name: string;
  email: string;
  department?: string | null;
  branchId?: string | null;
  branchName?: string;
  role: string;
  skills: string[];
  activeTaskCount: number;
  completedTaskCount: number;
  maxCapacity: number;
  utilizationPercent: number;
  isOverloaded: boolean;
  availableCapacity: number;
  highPriorityTaskCount: number;
  breachedTaskCount: number;
}

export interface RoutingCandidateDto {
  userId: string;
  name: string;
  email: string;
  department?: string | null;
  branchName?: string;
  skills: string[];
  skillMatch: boolean;
  activeTaskCount: number;
  maxCapacity: number;
  utilizationPercent: number;
  suitabilityScore: number;
  reason: string;
}

export interface TaskDashboardStatsDto {
  totalTasks: number;
  pendingCount: number;
  inProgressCount: number;
  completedCount: number;
  overdueBreachedCount: number;
  urgentCriticalCount: number;
  averageCompletionHours: number;
  teamCapacitySummary: {
    totalCapacity: number;
    utilizedCapacity: number;
    averageUtilizationPercent: number;
    overloadedStaffCount: number;
  };
  tasksByDepartment: Record<string, number>;
  tasksByPriority: Record<string, number>;
  employeeWorkloads: EmployeeWorkloadDto[];
  recentTasks: TaskDto[];
}

export interface QueryTasksInput {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  department?: string;
  assignedToId?: string;
  branchId?: string;
  applicationId?: string;
  search?: string;
  isOverdue?: boolean;
}

export interface ReassignTaskInput {
  assignedToId: string;
  reason?: string;
}

export interface AutoAssignTaskResultDto {
  taskId: string;
  assignedToId: string;
  assignedToName: string;
  assignedToEmail: string;
  score: number;
  reason: string;
}

// ─── BRANCH HIERARCHY & REGIONAL OPERATIONS HUBS (SLICE 2.4) ─────────────────

export type BranchType =
  | 'REGIONAL_HUB'
  | 'METRO_BRANCH'
  | 'SATELLITE_OFFICE'
  | 'FRANCHISE_OUTPOST';

export type TargetPeriodType = 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';

export type TargetStatus = 'ON_TRACK' | 'ACHIEVED' | 'AT_RISK' | 'MISSED';

export interface RegionDto {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  description?: string | null;
  regionalManagerId?: string | null;
  regionalManagerName?: string | null;
  regionalManagerEmail?: string | null;
  branchCount: number;
  activeEmployeeCount: number;
  activeCaseCount: number;
  revenueTarget: number;
  achievedRevenue: number;
  revenueAttainmentPercent: number;
  caseTarget: number;
  achievedCases: number;
  caseAttainmentPercent: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  branches?: BranchDto[];
}

export interface BranchDto {
  id: string;
  organizationId: string;
  regionId?: string | null;
  regionName?: string | null;
  regionCode?: string | null;
  branchManagerId?: string | null;
  branchManagerName?: string | null;
  branchManagerEmail?: string | null;
  name: string;
  code: string;
  branchType: BranchType | string;
  addressLine?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  phone?: string | null;
  email?: string | null;
  status: string;
  employeeCount: number;
  activeCaseCount: number;
  completedCaseCount: number;
  revenueTarget: number;
  achievedRevenue: number;
  revenueAttainmentPercent: number;
  caseTarget: number;
  achievedCases: number;
  caseAttainmentPercent: number;
  createdAt: string;
  updatedAt: string;
  manager?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

export interface BranchTargetDto {
  id: string;
  organizationId: string;
  branchId: string;
  branchName: string;
  branchCode: string;
  regionId?: string | null;
  regionName?: string | null;
  targetPeriod: string;
  periodType: TargetPeriodType | string;
  revenueTarget: number;
  caseTarget: number;
  leadTarget?: number;
  achievedRevenue: number;
  achievedCases: number;
  revenueAttainmentPercent: number;
  caseAttainmentPercent: number;
  varianceRevenue: number;
  varianceCases: number;
  status: TargetStatus | string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RegionalRollupDto {
  regionId: string;
  regionName: string;
  regionCode: string;
  regionalManagerName?: string | null;
  branchCount: number;
  revenueTarget: number;
  achievedRevenue: number;
  revenueAttainmentPercent: number;
  caseTarget: number;
  achievedCases: number;
  caseAttainmentPercent: number;
  status: TargetStatus | string;
  branches: BranchTargetDto[];
}

export interface BranchPerformanceMatrixDto {
  targetPeriod: string;
  organizationSummary: {
    totalBranches: number;
    totalRegions: number;
    totalRevenueTarget: number;
    totalAchievedRevenue: number;
    revenueAttainmentPercent: number;
    totalCaseTarget: number;
    totalAchievedCases: number;
    caseAttainmentPercent: number;
    onTrackCount: number;
    achievedCount: number;
    atRiskCount: number;
    missedCount: number;
  };
  regionalRollups: RegionalRollupDto[];
  branchScorecards: BranchDto[];
}

export interface CreateRegionInput {
  name: string;
  code: string;
  description?: string;
  regionalManagerId?: string;
  status?: string;
}

export interface UpdateRegionInput {
  name?: string;
  code?: string;
  description?: string;
  regionalManagerId?: string;
  status?: string;
}

export interface CreateBranchInput {
  name: string;
  code: string;
  regionId?: string;
  branchManagerId?: string;
  branchType?: BranchType | string;
  addressLine?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  status?: string;
}

export interface UpdateBranchInput {
  name?: string;
  code?: string;
  regionId?: string;
  branchManagerId?: string;
  branchType?: BranchType | string;
  addressLine?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  status?: string;
}

export interface SetBranchTargetInput {
  branchId: string;
  targetPeriod: string;
  periodType?: TargetPeriodType | string;
  revenueTarget: number;
  caseTarget: number;
  leadTarget?: number;
  notes?: string;
}

export interface QueryBranchesInput {
  regionId?: string;
  branchType?: string;
  status?: string;
  search?: string;
}

export interface QueryBranchTargetsInput {
  targetPeriod?: string;
  regionId?: string;
  branchId?: string;
  status?: string;
}

// ─── PHASE 3: NATIONWIDE PARTNER ECOSYSTEM & FRANCHISE EXPANSION ─────────────

// Vertical Slice 3.1: Partner Portal V2 & Tiered Commission Slabs
export const PartnerTier = {
  SILVER: 'SILVER',
  GOLD: 'GOLD',
  PLATINUM: 'PLATINUM',
} as const;
export type PartnerTier = (typeof PartnerTier)[keyof typeof PartnerTier];

export const PartnerKycStatus = {
  PENDING_KYC: 'PENDING_KYC',
  UNDER_REVIEW: 'UNDER_REVIEW',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
  SUSPENDED: 'SUSPENDED',
} as const;
export type PartnerKycStatus = (typeof PartnerKycStatus)[keyof typeof PartnerKycStatus];

export const PartnerType = {
  INDIVIDUAL: 'INDIVIDUAL',
  BUSINESS: 'BUSINESS',
  FRANCHISE_AFFILIATE: 'FRANCHISE_AFFILIATE',
} as const;
export type PartnerType = (typeof PartnerType)[keyof typeof PartnerType];

export interface PartnerProfileDto {
  id: string;
  userId: string;
  partnerCode: string;
  partnerType: PartnerType | string;
  tier: PartnerTier | string;
  kycStatus: PartnerKycStatus | string;
  businessName?: string | null;
  panMasked?: string | null;
  gstin?: string | null;
  aadhaarMasked?: string | null;
  digilockerVerifiedAt?: Date | string | null;
  lifetimeEarnings: number;
  lifetimeConversions: number;
  bankAccountNumberMasked?: string | null;
  bankIfsc?: string | null;
  bankBeneficiaryName?: string | null;
  onboardingNotes?: string | null;
  tierPromotedAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface UpdatePartnerKycInput {
  partnerType?: PartnerType | string;
  businessName?: string;
  pan?: string;
  gstin?: string;
  aadhaar?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  bankBeneficiaryName?: string;
}

export interface CommissionSlabRuleDto {
  id: string;
  organizationId: string;
  tier: PartnerTier | string;
  serviceCategoryId?: string | null;
  serviceId?: string | null;
  ratePercentage: number;
  flatBonusAmount: number;
  effectiveFrom: Date | string;
  effectiveTo?: Date | string | null;
  status: string;
  notes?: string | null;
  serviceCategoryName?: string | null;
  serviceName?: string | null;
}

export interface CreateCommissionSlabInput {
  tier: PartnerTier | string;
  serviceCategoryId?: string;
  serviceId?: string;
  ratePercentage: number;
  flatBonusAmount?: number;
  effectiveFrom?: string;
  effectiveTo?: string;
  notes?: string;
}

// Vertical Slice 3.2: Franchise Management & Revenue Sharing
export const FranchiseType = {
  MASTER_FRANCHISE: 'MASTER_FRANCHISE',
  CITY_FRANCHISE: 'CITY_FRANCHISE',
  OUTPOST: 'OUTPOST',
} as const;
export type FranchiseType = (typeof FranchiseType)[keyof typeof FranchiseType];

export const FranchiseStatus = {
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  TERMINATED: 'TERMINATED',
} as const;
export type FranchiseStatus = (typeof FranchiseStatus)[keyof typeof FranchiseStatus];

export const FranchiseSettlementStatus = {
  DRAFT: 'DRAFT',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED: 'APPROVED',
  SETTLED: 'SETTLED',
  DISPUTED: 'DISPUTED',
} as const;
export type FranchiseSettlementStatus = (typeof FranchiseSettlementStatus)[keyof typeof FranchiseSettlementStatus];

export interface FranchiseDto {
  id: string;
  organizationId: string;
  regionId?: string | null;
  branchId?: string | null;
  managerId?: string | null;
  name: string;
  code: string;
  franchiseType: FranchiseType | string;
  legalEntityName?: string | null;
  cinGstin?: string | null;
  primaryContactName?: string | null;
  phone?: string | null;
  email?: string | null;
  addressLine?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  status: FranchiseStatus | string;
  agreementStartDate?: Date | string | null;
  agreementEndDate?: Date | string | null;
  revenueSharePct: number;
  settlementFrequency: string;
  securityDeposit: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  pricingOverridesCount?: number;
}

export interface CreateFranchiseInput {
  name: string;
  code: string;
  regionId?: string;
  branchId?: string;
  managerId?: string;
  franchiseType?: FranchiseType | string;
  legalEntityName?: string;
  cinGstin?: string;
  primaryContactName?: string;
  phone?: string;
  email?: string;
  addressLine?: string;
  city?: string;
  state?: string;
  pincode?: string;
  agreementStartDate?: string;
  agreementEndDate?: string;
  revenueSharePct?: number;
  settlementFrequency?: string;
  securityDeposit?: number;
}

export interface UpdateFranchiseInput {
  name?: string;
  regionId?: string;
  branchId?: string;
  managerId?: string;
  franchiseType?: FranchiseType | string;
  legalEntityName?: string;
  cinGstin?: string;
  primaryContactName?: string;
  phone?: string;
  email?: string;
  addressLine?: string;
  city?: string;
  state?: string;
  pincode?: string;
  status?: FranchiseStatus | string;
  agreementStartDate?: string;
  agreementEndDate?: string;
  revenueSharePct?: number;
  settlementFrequency?: string;
  securityDeposit?: number;
}

export interface SetFranchisePricingOverrideInput {
  franchiseId: string;
  serviceId: string;
  customPrice: number;
  customMinPrice?: number;
  effectiveFrom?: string;
  effectiveTo?: string;
  status?: string;
}

export interface GenerateFranchiseSettlementInput {
  franchiseId: string;
  periodStart: string;
  periodEnd: string;
  notes?: string;
}

// Vertical Slice 3.3: Multi-Tier Referral & Incentive Engine
export const ReferralTierLevel = {
  TIER_1_DIRECT: 'TIER_1_DIRECT',
  TIER_2_PARENT: 'TIER_2_PARENT',
  TIER_3_MASTER: 'TIER_3_MASTER',
} as const;
export type ReferralTierLevel = (typeof ReferralTierLevel)[keyof typeof ReferralTierLevel];

export const ReferralStatus = {
  PENDING: 'PENDING',
  CONVERTED: 'CONVERTED',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
} as const;
export type ReferralStatus = (typeof ReferralStatus)[keyof typeof ReferralStatus];

export const DiscountType = {
  PERCENTAGE: 'PERCENTAGE',
  FIXED_AMOUNT: 'FIXED_AMOUNT',
} as const;
export type DiscountType = (typeof DiscountType)[keyof typeof DiscountType];

export const CouponStatus = {
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  DISABLED: 'DISABLED',
} as const;
export type CouponStatus = (typeof CouponStatus)[keyof typeof CouponStatus];

export interface ReferralAttributionDto {
  id: string;
  referrerId: string;
  referredUserId?: string | null;
  leadId?: string | null;
  applicationId?: string | null;
  referralCode: string;
  tierLevel: ReferralTierLevel | string;
  status: ReferralStatus | string;
  commissionRate?: number | null;
  commissionEarned?: number | null;
  attributedAt: Date | string;
  convertedAt?: Date | string | null;
}

export interface PartnerReferralTreeDto {
  partnerId: string;
  parentPartnerId?: string | null;
  masterPartnerId?: string | null;
  treeDepth: number;
  partnerName?: string;
  parentPartnerName?: string | null;
  masterPartnerName?: string | null;
}

export interface CouponDto {
  id: string;
  code: string;
  description?: string | null;
  discountType: DiscountType | string;
  discountValue: number;
  maxDiscountAmount?: number | null;
  minOrderAmount?: number | null;
  validFrom: Date | string;
  validTo?: Date | string | null;
  maxTotalUsage?: number | null;
  maxUsagePerCustomer: number;
  currentUsageCount: number;
  applicableServiceIds: string[];
  applicableFranchiseIds: string[];
  partnerId?: string | null;
  status: CouponStatus | string;
  createdAt: Date | string;
}

export interface CreateCouponInput {
  code: string;
  description?: string;
  discountType?: DiscountType | string;
  discountValue: number;
  maxDiscountAmount?: number;
  minOrderAmount?: number;
  validFrom?: string;
  validTo?: string;
  maxTotalUsage?: number;
  maxUsagePerCustomer?: number;
  applicableServiceIds?: string[];
  applicableFranchiseIds?: string[];
  partnerId?: string;
}

export interface ValidateCouponInput {
  code: string;
  customerId: string;
  serviceId: string;
  orderAmount: number;
  franchiseId?: string;
}

export interface IncentiveRuleDto {
  id: string;
  organizationId: string;
  name: string;
  targetType: string;
  thresholdValue: number;
  bonusAmount: number;
  period: string;
  applicableTier: string;
  effectiveFrom: Date | string;
  effectiveTo?: Date | string | null;
  status: string;
}

export interface CreateIncentiveRuleInput {
  name: string;
  targetType?: string;
  thresholdValue: number;
  bonusAmount: number;
  period?: string;
  applicableTier?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
}

// Vertical Slice 3.4: DigiLocker & Identity Verification APIs
export const VerificationType = {
  DIGILOCKER: 'DIGILOCKER',
  PAN: 'PAN',
  GSTIN: 'GSTIN',
  AADHAAR_OTP: 'AADHAAR_OTP',
} as const;
export type VerificationType = (typeof VerificationType)[keyof typeof VerificationType];

export const VerificationStatus = {
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
  FAILED: 'FAILED',
} as const;
export type VerificationStatus = (typeof VerificationStatus)[keyof typeof VerificationStatus];

export interface IdentityVerificationRecordDto {
  id: string;
  organizationId: string;
  userId?: string | null;
  partnerId?: string | null;
  franchiseId?: string | null;
  verificationType: VerificationType | string;
  identifierMasked: string;
  provider: string;
  providerReferenceId?: string | null;
  verificationStatus: VerificationStatus | string;
  matchScore?: number | null;
  verifiedName?: string | null;
  failureReason?: string | null;
  verifiedAt?: Date | string | null;
  expiresAt?: Date | string | null;
  createdAt: Date | string;
}

export interface VerifyPanInput {
  pan: string;
  expectedName?: string;
  userId?: string;
  partnerId?: string;
}

export interface VerifyGstInput {
  gstin: string;
  expectedTradeName?: string;
  userId?: string;
  partnerId?: string;
  franchiseId?: string;
}

export interface VerifyDigiLockerInput {
  documentType: string; // AADHAAR, PAN, DRIVING_LICENSE
  authCode?: string;
  userId?: string;
  partnerId?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 4: AUTOMATION, AI & DOCUMENT INTELLIGENCE
// ═══════════════════════════════════════════════════════════════════════════

// Vertical Slice 4.1: AI-Powered Lead Scoring & Priority Queue
export const LeadScoreGrade = {
  A_HOT: 'A_HOT',
  B_WARM: 'B_WARM',
  C_COLD: 'C_COLD',
  D_UNQUALIFIED: 'D_UNQUALIFIED',
} as const;
export type LeadScoreGrade = (typeof LeadScoreGrade)[keyof typeof LeadScoreGrade];

export interface LeadScoreFactor {
  factor: string;
  weight: number;
  contribution: number;
  explanation: string;
}

export interface LeadScoreRecordDto {
  id: string;
  organizationId: string;
  leadId: string;
  score: number;
  grade: LeadScoreGrade | string;
  predictedDealValue?: number | null;
  conversionProbability?: number | null;
  scoreFactors: LeadScoreFactor[];
  recommendedAction?: string | null;
  calculatedAt: Date | string;
}

export interface PriorityQueueItemDto {
  leadId: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  mobile: string;
  companyName?: string | null;
  serviceInterest?: string | null;
  status: string;
  score: number;
  grade: LeadScoreGrade | string;
  conversionProbability: number;
  predictedDealValue: number;
  recommendedAction: string;
  priorityRank: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  sourceName?: string | null;
  assignedToName?: string | null;
  timeInCurrentStatusHours: number;
  createdAt: Date | string;
}

// Vertical Slice 4.2: Document OCR & Automated Verification Assistant
export const DocumentOcrMatchStatus = {
  FULL_MATCH: 'FULL_MATCH',
  PARTIAL_MATCH: 'PARTIAL_MATCH',
  MISMATCH: 'MISMATCH',
  MANUAL_REVIEW_REQUIRED: 'MANUAL_REVIEW_REQUIRED',
} as const;
export type DocumentOcrMatchStatus = (typeof DocumentOcrMatchStatus)[keyof typeof DocumentOcrMatchStatus];

export const DocumentOcrSuggestedAction = {
  AUTO_APPROVE: 'AUTO_APPROVE',
  MANUAL_REVIEW: 'MANUAL_REVIEW',
  REJECT_TAMPERED: 'REJECT_TAMPERED',
  REQUEST_REUPLOAD: 'REQUEST_REUPLOAD',
} as const;
export type DocumentOcrSuggestedAction = (typeof DocumentOcrSuggestedAction)[keyof typeof DocumentOcrSuggestedAction];

export interface OcrDiscrepancy {
  field: string;
  applicationValue: string;
  ocrValue: string;
  matchRatio: number;
}

export interface DocumentOcrExtractedData {
  panNumber?: string;
  name?: string;
  dob?: string;
  fatherName?: string;
  gstin?: string;
  legalName?: string;
  tradeName?: string;
  state?: string;
  accountNumber?: string;
  ifsc?: string;
  bankName?: string;
  address?: string;
  rawText?: string;
}

export interface DocumentOcrRecordDto {
  id: string;
  organizationId: string;
  documentId: string;
  documentType: string;
  extractedData: DocumentOcrExtractedData;
  confidenceScore: number;
  clarityScore?: number | null;
  tamperCheckPassed: boolean;
  matchStatus: DocumentOcrMatchStatus | string;
  discrepancies: OcrDiscrepancy[];
  suggestedAction: DocumentOcrSuggestedAction | string;
  ocrProvider: string;
  processedAt: Date | string;
}

export interface RunDocumentOcrInput {
  documentId: string;
  documentType?: string;
  applicationId?: string;
}

// Vertical Slice 4.3: Crazy Capital AI Operations Copilot
export interface AiCopilotMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  citations?: string[];
  suggestedActions?: string[];
  draftPayload?: {
    channel?: 'EMAIL' | 'WHATSAPP' | 'SMS';
    subject?: string;
    body?: string;
    recipientName?: string;
    recipientContact?: string;
  };
}

export interface AiCopilotSessionDto {
  id: string;
  organizationId: string;
  userId: string;
  title: string;
  contextType: string;
  contextId?: string | null;
  messages: AiCopilotMessage[];
  lastMessageAt: Date | string;
  createdAt: Date | string;
}

export interface ChatCopilotInput {
  sessionId?: string;
  message: string;
  contextType?: 'GENERAL' | 'APPLICATION' | 'LEAD' | 'WORKFLOW' | 'COMPLIANCE_QUERY' | 'CUSTOMER_COMMUNICATION' | string;
  contextId?: string;
}

export interface DraftFollowupInput {
  leadId?: string;
  applicationId?: string;
  channel: 'EMAIL' | 'WHATSAPP' | 'SMS';
  intent: 'DOCUMENT_MISSING' | 'PAYMENT_PENDING' | 'STAGE_UPDATE' | 'WELCOME_PROPOSAL' | 'GENERAL';
  customInstructions?: string;
}

export interface ComplianceKnowledgeItem {
  id: string;
  topic: string;
  category: string;
  summary: string;
  keyRequirements: string[];
  applicableActs: string[];
  statutoryTimelines: string;
  penaltiesForNonCompliance?: string;
}

// Vertical Slice 4.4: Predictive Revenue & Turnaround Analytics
export interface PredictiveForecastRecordDto {
  id: string;
  organizationId: string;
  branchId?: string | null;
  forecastPeriod: string;
  predictedRevenue: number;
  confidenceIntervalLow: number;
  confidenceIntervalHigh: number;
  predictedConversions: number;
  predictedPartnerPayouts: number;
  predictedAvgTurnaroundHours: number;
  predictedBottleneckStageId?: string | null;
  slaBreachRiskCount: number;
  factors?: Record<string, any> | null;
  generatedAt: Date | string;
}

export interface PredictiveRevenueForecastDto {
  period: string;
  baseRevenue: number;
  optimisticRevenue: number;
  conservativeRevenue: number;
  projectedConversions: number;
  projectedPartnerCommissions: number;
  historicalComparisonPct: number;
}

export interface PredictiveTurnaroundForecastDto {
  overallAvgHours: number;
  fastestStageName: string;
  fastestStageHours: number;
  slowestStageName: string;
  slowestStageHours: number;
  stagesAtRiskCount: number;
}

export interface PredictiveBottleneckDto {
  stageId: string;
  stageName: string;
  serviceName: string;
  currentActiveCount: number;
  avgHoursSpent: number;
  slaTargetHours: number;
  breachRiskProbability: number;
  bottleneckSeverity: 'HIGH' | 'MEDIUM' | 'LOW';
  recommendedIntervention: string;
}
