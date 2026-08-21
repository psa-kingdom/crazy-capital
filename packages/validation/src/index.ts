import { z } from 'zod';

// --- Auth Validation Schemas ---
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  mobile: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number')
    .optional()
    .nullable(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// --- Common / Pagination ---
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

// --- Common Formats (India) ---
export const indianMobileRegex = /^[6-9]\d{9}$/;
export const indianPanRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
export const indianGstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
export const indianPincodeRegex = /^[1-9][0-9]{5}$/;

// --- CRM / Lead Validation Schemas ---

export const leadStatusEnum = z.enum([
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'PROPOSAL',
  'CONVERTED',
  'LOST',
]);

export const leadActivityTypeEnum = z.enum([
  'CALL',
  'EMAIL',
  'WHATSAPP',
  'MEETING',
  'NOTE',
  'STATUS_CHANGE',
]);

export const createLeadSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address').optional().nullable(),
  mobile: z.string().regex(indianMobileRegex, 'Mobile must be a valid 10-digit Indian number'),
  companyName: z.string().optional().nullable(),
  sourceCode: z.string().optional().nullable(),
  sourceId: z.string().uuid('Invalid source ID format').optional().nullable(),
  branchId: z.string().uuid('Invalid branch ID format').optional().nullable(),
  notes: z.string().optional().nullable(),
  campaign: z.string().optional().nullable(),
  leadScore: z.coerce.number().int().min(0).max(100).default(0),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;

export const updateLeadSchema = createLeadSchema.partial();
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;

export const changeLeadStatusSchema = z.object({
  status: leadStatusEnum,
  remarks: z.string().optional(),
});

export type ChangeLeadStatusInput = z.infer<typeof changeLeadStatusSchema>;

export const assignLeadSchema = z.object({
  assignedToUserId: z.string().uuid('Invalid assigned user ID'),
  remarks: z.string().optional(),
});

export type AssignLeadInput = z.infer<typeof assignLeadSchema>;

export const createLeadActivitySchema = z.object({
  activityType: leadActivityTypeEnum,
  notes: z.string().min(1, 'Notes are required for activity log'),
});

export type CreateLeadActivityInput = z.infer<typeof createLeadActivitySchema>;

export const queryLeadsSchema = paginationSchema.extend({
  status: leadStatusEnum.optional(),
  branchId: z.string().uuid().optional(),
  sourceId: z.string().uuid().optional(),
  assignedToId: z.string().uuid().optional(),
  createdAtFrom: z.string().datetime({ offset: true }).or(z.string()).optional(),
  createdAtTo: z.string().datetime({ offset: true }).or(z.string()).optional(),
});

export type QueryLeadsInput = z.infer<typeof queryLeadsSchema>;

export const createLeadSourceSchema = z.object({
  name: z.string().min(1, 'Lead source name is required'),
  code: z.string().min(1, 'Lead source code is required').toUpperCase(),
  isActive: z.boolean().default(true),
});

export type CreateLeadSourceInput = z.infer<typeof createLeadSourceSchema>;

export const updateLeadSourceSchema = createLeadSourceSchema.partial();
export type UpdateLeadSourceInput = z.infer<typeof updateLeadSourceSchema>;

// --- Customer 360 Validation Schemas ---

export const customerTypeEnum = z.enum(['INDIVIDUAL', 'BUSINESS']);
export const customerAddressTypeEnum = z.enum(['REGISTERED', 'BILLING', 'MAILING']);

export const customerAddressSchema = z.object({
  type: customerAddressTypeEnum.default('REGISTERED'),
  addressLine1: z.string().min(1, 'Address Line 1 is required'),
  addressLine2: z.string().optional().nullable(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  country: z.string().default('India'),
  pincode: z.string().regex(indianPincodeRegex, 'Invalid 6-digit Indian PIN code'),
});

export const customerContactSchema = z.object({
  name: z.string().min(1, 'Contact person name is required'),
  mobile: z.string().regex(indianMobileRegex, 'Invalid Indian mobile number'),
  email: z.string().email('Invalid email').optional().nullable(),
  designation: z.string().optional().nullable(),
});

export const convertLeadSchema = z.object({
  customerType: customerTypeEnum.default('INDIVIDUAL'),
  companyName: z.string().optional().nullable(),
  pan: z.string().regex(indianPanRegex, 'Invalid PAN number format (e.g. ABCDE1234F)').optional().nullable(),
  gstin: z.string().regex(indianGstinRegex, 'Invalid GSTIN format (e.g. 07AAAAA0000A1Z5)').optional().nullable(),
  address: customerAddressSchema.optional(),
  contact: customerContactSchema.optional(),
});

export type ConvertLeadInput = z.infer<typeof convertLeadSchema>;

export const createCustomerSchema = z.object({
  customerType: customerTypeEnum.default('INDIVIDUAL'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email address is required'),
  mobile: z.string().regex(indianMobileRegex, 'Valid 10-digit Indian mobile is required'),
  companyName: z.string().optional().nullable(),
  pan: z.string().regex(indianPanRegex, 'Invalid PAN format').optional().nullable(),
  gstin: z.string().regex(indianGstinRegex, 'Invalid GSTIN format').optional().nullable(),
  branchId: z.string().uuid().optional().nullable(),
  addresses: z.array(customerAddressSchema).optional(),
  contacts: z.array(customerContactSchema).optional(),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;

export const updateCustomerSchema = createCustomerSchema.partial();
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;

export const queryCustomersSchema = paginationSchema.extend({
  customerType: customerTypeEnum.optional(),
  status: z.string().optional(),
  branchId: z.string().uuid().optional(),
  pan: z.string().optional(),
  gstin: z.string().optional(),
});

export type QueryCustomersInput = z.infer<typeof queryCustomersSchema>;

// ─── Service Catalog Validation Schemas (Vertical Slice 1.4) ─────────────────

export const pricingTypeEnum = z.enum(['STANDARD', 'PARTNER', 'PROMOTIONAL']);

export const createServiceCategorySchema = z.object({
  parentId: z.string().uuid().optional().nullable(),
  name: z.string().min(2, 'Category name must be at least 2 characters'),
  slug: z.string().optional(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const updateServiceCategorySchema = createServiceCategorySchema.partial();

export const createServicePricingSchema = z.object({
  pricingType: pricingTypeEnum.default('STANDARD'),
  amount: z.number().nonnegative('Amount must be zero or positive'),
  effectiveFrom: z.string().optional(),
  effectiveTo: z.string().optional().nullable(),
});

export const createServiceDocumentSchema = z.object({
  documentTypeId: z.string().uuid('Valid Document Type ID is required'),
  isMandatory: z.boolean().default(true),
});

export const createServiceSchema = z.object({
  categoryId: z.string().uuid('Valid Category ID is required'),
  name: z.string().min(2, 'Service name must be at least 2 characters'),
  slug: z.string().optional(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  standardPrice: z.number().nonnegative().optional(),
  partnerPrice: z.number().nonnegative().optional(),
  requiredDocumentTypeIds: z
    .array(
      z.object({
        documentTypeId: z.string().uuid(),
        isMandatory: z.boolean().default(true),
      }),
    )
    .optional(),
});

export const updateServiceSchema = createServiceSchema.partial();

export const queryServicesSchema = paginationSchema.extend({
  categoryId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
});

// ─── Workflow Engine Validation Schemas (Vertical Slice 1.5 - ADR-012) ───────

export const workflowStageTypeEnum = z.enum(['START', 'PROCESSING', 'APPROVAL', 'COMPLETION', 'REJECTION']);
export const workflowRuleTypeEnum = z.enum(['DOCUMENT_GATE', 'PAYMENT_GATE', 'APPROVAL_GATE']);

export const createWorkflowStageSchema = z.object({
  name: z.string().min(1, 'Stage name is required'),
  code: z.string().min(1, 'Stage code is required'),
  stageOrder: z.number().int().positive('Stage order must be a positive integer'),
  stageType: workflowStageTypeEnum.default('PROCESSING'),
  isStartStage: z.boolean().default(false),
  isEndStage: z.boolean().default(false),
  isMandatory: z.boolean().default(true),
  slaHours: z.number().int().positive().optional().nullable(),
});

export const createWorkflowTransitionSchema = z.object({
  fromStageId: z.string().uuid('Valid From Stage ID is required'),
  toStageId: z.string().uuid('Valid To Stage ID is required'),
  requiresApproval: z.boolean().default(false),
});

export const createWorkflowRuleSchema = z.object({
  ruleType: workflowRuleTypeEnum,
  ruleConfig: z.record(z.any()),
});

export const createWorkflowSchema = z.object({
  serviceId: z.string().uuid('Valid Service ID is required'),
  name: z.string().min(2, 'Workflow name must be at least 2 characters'),
  code: z.string().optional(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  stages: z.array(createWorkflowStageSchema).optional(),
});

export const updateWorkflowSchema = createWorkflowSchema.partial();

export const transitionWorkflowInstanceSchema = z.object({
  targetStageId: z.string().uuid('Target stage ID is required'),
  remarks: z.string().optional().nullable(),
});

// ─── Application Lifecycle Validation Schemas (Vertical Slice 1.6) ───────────

export const applicationStatusEnum = z.enum([
  'DRAFT',
  'SUBMITTED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'REJECTED',
]);

export const taskStatusEnum = z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']);
export const approvalStatusEnum = z.enum(['PENDING', 'APPROVED', 'REJECTED']);

export const createApplicationSchema = z.object({
  customerId: z.string().uuid('Valid Customer ID is required'),
  serviceId: z.string().uuid('Valid Service ID is required'),
  branchId: z.string().uuid().optional().nullable(),
  assignedToId: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const assignApplicationSchema = z.object({
  assignedToUserId: z.string().uuid('Valid Employee User ID is required'),
  remarks: z.string().optional().nullable(),
});

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional().nullable(),
  workflowStageId: z.string().uuid().optional().nullable(),
  assignedToId: z.string().uuid().optional().nullable(),
  dueDate: z.string().optional().nullable(),
});

export const updateTaskSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional().nullable(),
  status: taskStatusEnum.optional(),
  assignedToId: z.string().uuid().optional().nullable(),
  dueDate: z.string().optional().nullable(),
});

export const createApplicationActivitySchema = z.object({
  activityType: z.string().default('NOTE'),
  notes: z.string().min(1, 'Activity notes are required'),
});

export const queryApplicationsSchema = paginationSchema.extend({
  customerId: z.string().uuid().optional(),
  serviceId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  assignedToId: z.string().uuid().optional(),
  status: applicationStatusEnum.optional(),
});

// ─── Domain 7: Document Types & Vault Schemas ────────────────────────────────

export const documentStatusEnum = z.enum(['PENDING', 'UPLOADED', 'VERIFIED', 'REJECTED']);

export const allowedMimeTypes = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/jpg',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export const createDocumentTypeSchema = z.object({
  name: z.string().min(2, 'Document type name is required'),
  code: z.string().min(2, 'Document type code is required').regex(/^[A-Z0-9_]+$/, 'Code must be uppercase alphanumeric and underscores'),
  description: z.string().optional().nullable(),
});

export const requestPresignedUploadSchema = z.object({
  customerId: z.string().uuid('Valid Customer ID is required'),
  applicationId: z.string().uuid().optional().nullable(),
  documentTypeId: z.string().uuid('Valid Document Type ID is required'),
  fileName: z.string().min(1, 'File name is required').max(255, 'File name is too long'),
  fileSize: z.number().int().positive('File size must be positive').max(15 * 1024 * 1024, 'File size cannot exceed 15MB'),
  mimeType: z.string().refine((val) => allowedMimeTypes.includes(val), {
    message: 'Unsupported file type. Allowed: PDF, JPG, PNG, DOC, DOCX',
  }),
});

export const confirmUploadSchema = z.object({
  fileSize: z.number().int().positive().optional(),
  checksumSha256: z.string().optional(),
});

export const verifyDocumentSchema = z.object({
  remarks: z.string().optional().nullable(),
});

export const rejectDocumentSchema = z.object({
  rejectionReason: z.string().min(3, 'Structured rejection reason is required'),
});

export const queryDocumentsSchema = paginationSchema.extend({
  customerId: z.string().uuid().optional(),
  applicationId: z.string().uuid().optional(),
  documentTypeId: z.string().uuid().optional(),
  status: documentStatusEnum.optional(),
});

