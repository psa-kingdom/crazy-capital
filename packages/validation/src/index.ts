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

// ─── Domain 12: Phase 3 Nationwide Partner Ecosystem & Franchise Schemas ─────

// Vertical Slice 3.1: Partner Portal V2 & Tiered Commission Slabs
export const partnerTierEnum = z.enum(['SILVER', 'GOLD', 'PLATINUM']);
export const partnerKycStatusEnum = z.enum(['PENDING_KYC', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'SUSPENDED']);
export const partnerTypeEnum = z.enum(['INDIVIDUAL', 'BUSINESS', 'FRANCHISE_AFFILIATE']);

export const updatePartnerKycSchema = z.object({
  partnerType: partnerTypeEnum.optional(),
  businessName: z.string().max(255).optional().nullable(),
  pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format (e.g. ABCDE1234F)').optional().nullable(),
  gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN format').optional().nullable(),
  aadhaar: z.string().regex(/^[0-9]{12}$/, 'Aadhaar must be a 12-digit numeric identifier').optional().nullable(),
  bankAccountNumber: z.string().min(9).max(18).optional().nullable(),
  bankIfsc: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code format').optional().nullable(),
  bankBeneficiaryName: z.string().min(2).max(100).optional().nullable(),
});

export const createCommissionSlabSchema = z.object({
  tier: partnerTierEnum,
  serviceCategoryId: z.string().uuid().optional().nullable(),
  serviceId: z.string().uuid().optional().nullable(),
  ratePercentage: z.number().min(0).max(100, 'Commission rate percentage must be between 0 and 100'),
  flatBonusAmount: z.number().min(0).default(0),
  effectiveFrom: z.string().datetime().or(z.string()).optional(),
  effectiveTo: z.string().datetime().or(z.string()).optional().nullable(),
  notes: z.string().optional().nullable(),
});

// Vertical Slice 3.2: Franchise Management & Revenue Sharing
export const franchiseTypeEnum = z.enum(['MASTER_FRANCHISE', 'CITY_FRANCHISE', 'OUTPOST']);
export const franchiseStatusEnum = z.enum(['PENDING_APPROVAL', 'ACTIVE', 'SUSPENDED', 'TERMINATED']);

export const createFranchiseSchema = z.object({
  name: z.string().min(2, 'Franchise name is required'),
  code: z.string().min(2, 'Franchise code is required').regex(/^[A-Z0-9_-]+$/, 'Code must be alphanumeric with dashes or underscores'),
  regionId: z.string().uuid().optional().nullable(),
  branchId: z.string().uuid().optional().nullable(),
  managerId: z.string().uuid().optional().nullable(),
  franchiseType: franchiseTypeEnum.default('CITY_FRANCHISE'),
  legalEntityName: z.string().max(255).optional().nullable(),
  cinGstin: z.string().max(50).optional().nullable(),
  primaryContactName: z.string().min(2).optional().nullable(),
  phone: z.string().min(10).optional().nullable(),
  email: z.string().email().optional().nullable(),
  addressLine: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  pincode: z.string().optional().nullable(),
  agreementStartDate: z.string().optional().nullable(),
  agreementEndDate: z.string().optional().nullable(),
  revenueSharePct: z.number().min(0).max(100).default(70.0),
  settlementFrequency: z.enum(['MONTHLY', 'WEEKLY']).default('MONTHLY'),
  securityDeposit: z.number().min(0).default(0),
});

export const updateFranchiseSchema = createFranchiseSchema.partial().extend({
  status: franchiseStatusEnum.optional(),
});

export const setFranchisePricingOverrideSchema = z.object({
  franchiseId: z.string().uuid('Valid Franchise ID is required'),
  serviceId: z.string().uuid('Valid Service ID is required'),
  customPrice: z.number().positive('Custom price must be positive'),
  customMinPrice: z.number().positive().optional().nullable(),
  effectiveFrom: z.string().optional(),
  effectiveTo: z.string().optional().nullable(),
  status: z.string().default('ACTIVE'),
});

export const generateFranchiseSettlementSchema = z.object({
  franchiseId: z.string().uuid('Valid Franchise ID is required'),
  periodStart: z.string().min(1, 'Period start is required'),
  periodEnd: z.string().min(1, 'Period end is required'),
  notes: z.string().optional().nullable(),
});

// Vertical Slice 3.3: Multi-Tier Referral & Incentive Engine
export const createCouponSchema = z.object({
  code: z.string().min(3, 'Coupon code must be at least 3 characters').regex(/^[A-Z0-9_-]+$/, 'Coupon code must be uppercase alphanumeric'),
  description: z.string().optional().nullable(),
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']).default('PERCENTAGE'),
  discountValue: z.number().positive('Discount value must be positive'),
  maxDiscountAmount: z.number().positive().optional().nullable(),
  minOrderAmount: z.number().min(0).optional().nullable(),
  validFrom: z.string().optional(),
  validTo: z.string().optional().nullable(),
  maxTotalUsage: z.number().int().positive().optional().nullable(),
  maxUsagePerCustomer: z.number().int().positive().default(1),
  applicableServiceIds: z.array(z.string().uuid()).default([]),
  applicableFranchiseIds: z.array(z.string().uuid()).default([]),
  partnerId: z.string().uuid().optional().nullable(),
});

export const validateCouponSchema = z.object({
  code: z.string().min(1, 'Coupon code is required'),
  customerId: z.string().uuid('Customer ID is required'),
  serviceId: z.string().uuid('Service ID is required'),
  orderAmount: z.number().positive('Order amount must be positive'),
  franchiseId: z.string().uuid().optional().nullable(),
});

export const createIncentiveRuleSchema = z.object({
  name: z.string().min(2, 'Incentive rule name is required'),
  targetType: z.enum(['CONVERSIONS_COUNT', 'REVENUE_VOLUME']).default('CONVERSIONS_COUNT'),
  thresholdValue: z.number().positive('Threshold value must be positive'),
  bonusAmount: z.number().positive('Bonus amount must be positive'),
  period: z.enum(['MONTHLY', 'QUARTERLY']).default('MONTHLY'),
  applicableTier: z.enum(['ALL', 'SILVER', 'GOLD', 'PLATINUM']).default('ALL'),
  effectiveFrom: z.string().optional(),
  effectiveTo: z.string().optional().nullable(),
});

// Vertical Slice 3.4: DigiLocker & Identity Verification APIs
export const verifyPanSchema = z.object({
  pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format'),
  expectedName: z.string().optional().nullable(),
  userId: z.string().uuid().optional().nullable(),
  partnerId: z.string().uuid().optional().nullable(),
});

export const verifyGstSchema = z.object({
  gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN format'),
  expectedTradeName: z.string().optional().nullable(),
  userId: z.string().uuid().optional().nullable(),
  partnerId: z.string().uuid().optional().nullable(),
  franchiseId: z.string().uuid().optional().nullable(),
});

export const verifyDigiLockerSchema = z.object({
  documentType: z.enum(['AADHAAR', 'PAN', 'DRIVING_LICENSE', 'PASSPORT']),
  authCode: z.string().optional().nullable(),
  userId: z.string().uuid().optional().nullable(),
  partnerId: z.string().uuid().optional().nullable(),
});

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 4: AUTOMATION, AI & DOCUMENT INTELLIGENCE
// ═══════════════════════════════════════════════════════════════════════════

// Vertical Slice 4.1: AI-Powered Lead Scoring & Priority Queue
export const recalculateLeadScoreSchema = z.object({
  leadId: z.string().uuid('Valid Lead ID is required'),
});

export const priorityQueueFilterSchema = z.object({
  minScore: z.coerce.number().min(0).max(100).optional(),
  grade: z.enum(['A_HOT', 'B_WARM', 'C_COLD', 'D_UNQUALIFIED', 'ALL']).optional(),
  priorityRank: z.enum(['URGENT', 'HIGH', 'MEDIUM', 'LOW', 'ALL']).optional(),
  limit: z.coerce.number().int().positive().max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

// Vertical Slice 4.2: Document OCR & Automated Verification Assistant
export const runDocumentOcrSchema = z.object({
  documentId: z.string().uuid('Valid Document ID is required'),
  documentType: z.string().optional(),
  applicationId: z.string().uuid().optional().nullable(),
});

export const autoVerifyDocumentOcrSchema = z.object({
  documentId: z.string().uuid('Valid Document ID is required'),
  remarks: z.string().optional().nullable(),
  overrideDecision: z.enum(['APPROVE', 'REJECT']).optional(),
});

// Vertical Slice 4.3: Crazy Capital AI Operations Copilot
export const chatCopilotSchema = z.object({
  sessionId: z.string().uuid().optional().nullable(),
  message: z.string().min(1, 'Message cannot be empty'),
  contextType: z.enum(['GENERAL', 'APPLICATION', 'LEAD', 'WORKFLOW', 'COMPLIANCE_QUERY', 'CUSTOMER_COMMUNICATION']).default('GENERAL'),
  contextId: z.string().optional().nullable(),
});

export const draftFollowupSchema = z.object({
  leadId: z.string().uuid().optional().nullable(),
  applicationId: z.string().uuid().optional().nullable(),
  channel: z.enum(['EMAIL', 'WHATSAPP', 'SMS']),
  intent: z.enum(['DOCUMENT_MISSING', 'PAYMENT_PENDING', 'STAGE_UPDATE', 'WELCOME_PROPOSAL', 'GENERAL']),
  customInstructions: z.string().max(500).optional().nullable(),
});

// Vertical Slice 4.4: Predictive Revenue & Turnaround Analytics
export const predictiveForecastQuerySchema = z.object({
  period: z.string().default('NEXT_30_DAYS'),
  branchId: z.string().uuid().optional().nullable(),
});

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 5: NATIONAL SCALE PLATFORM & ENTERPRISE MULTI-TENANT SAAS
// ═══════════════════════════════════════════════════════════════════════════

// ─── Vertical Slice 5.1: Mobile Applications (iOS & Android) Bridge ─────────

export const registerMobileDeviceSchema = z.object({
  deviceToken: z.string().min(10, 'Valid device push token is required'),
  platform: z.enum(['IOS', 'ANDROID', 'WEB_PUSH']).default('ANDROID'),
  deviceModel: z.string().max(100).optional().nullable(),
  osVersion: z.string().max(50).optional().nullable(),
  appVersion: z.string().max(50).optional().nullable(),
  biometricEnabled: z.boolean().default(false),
  biometricPublicKey: z.string().optional().nullable(),
  pushPreferences: z
    .object({
      leadAlerts: z.boolean().default(true),
      statusUpdates: z.boolean().default(true),
      commissionAlerts: z.boolean().default(true),
      marketing: z.boolean().default(false),
    })
    .optional(),
});

export const revokeMobileDeviceSchema = z.object({
  deviceToken: z.string().min(1, 'Device token is required'),
});

export const verifyBiometricAuthSchema = z.object({
  challengeNonce: z.string().min(16, 'Valid challenge nonce is required'),
  signature: z.string().min(1, 'Cryptographic biometric signature is required'),
  deviceToken: z.string().min(1, 'Device token is required'),
});

export const updateMobilePushPreferencesSchema = z.object({
  leadAlerts: z.boolean().optional(),
  statusUpdates: z.boolean().optional(),
  commissionAlerts: z.boolean().optional(),
  marketing: z.boolean().optional(),
});

// ─── Vertical Slice 5.2: Multi-Tenant SaaS & White-Label Theming ───────────

export const tenantThemeConfigSchema = z.object({
  primaryColor: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Valid hex color required'),
  secondaryColor: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Valid hex color required'),
  accentColor: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Valid hex color required'),
  logoUrl: z.string().min(1, 'Logo URL is required'),
  faviconUrl: z.string().optional(),
  fontHeading: z.string().default('Manrope'),
  fontBody: z.string().default('Inter'),
  borderRadius: z.string().default('0.75rem'),
  darkThemeEnabled: z.boolean().default(false),
  customCss: z.string().max(5000).optional(),
});

export const tenantInvoiceConfigSchema = z.object({
  legalName: z.string().min(2, 'Legal entity name is required'),
  tradeName: z.string().optional(),
  gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN').optional().nullable(),
  pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN').optional().nullable(),
  address: z.string().optional(),
  invoicePrefix: z.string().min(2).max(10).default('CC-'),
  footerNote: z.string().max(300).optional(),
  authorizedSignatoryUrl: z.string().optional(),
});

export const tenantEmailConfigSchema = z.object({
  fromName: z.string().min(2, 'From name is required'),
  fromEmail: z.string().email('Valid from email required'),
  replyTo: z.string().email('Valid reply-to email required').optional(),
  headerHtml: z.string().optional(),
  footerHtml: z.string().optional(),
});

export const createTenantSchema = z.object({
  name: z.string().min(2, 'Tenant name is required'),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase alphanumeric characters and dashes'),
  subdomain: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Subdomain must contain only lowercase alphanumeric characters and dashes'),
  customDomain: z.string().regex(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Invalid domain format').optional().nullable(),
  planType: z.enum(['STARTER', 'PROFESSIONAL', 'ENTERPRISE']).default('ENTERPRISE'),
  themeConfig: tenantThemeConfigSchema,
  invoiceConfig: tenantInvoiceConfigSchema.optional(),
  emailConfig: tenantEmailConfigSchema.optional(),
});

export const updateTenantBrandingSchema = z.object({
  themeConfig: tenantThemeConfigSchema.partial().optional(),
  invoiceConfig: tenantInvoiceConfigSchema.partial().optional(),
  emailConfig: tenantEmailConfigSchema.partial().optional(),
});

export const verifyDomainSchema = z.object({
  tenantId: z.string().uuid('Valid Tenant ID is required'),
  customDomain: z.string().min(3, 'Domain name is required'),
});

// ─── Vertical Slice 5.3: Public Developer API & Webhooks Platform ──────────

export const apiKeyScopeEnum = z.enum([
  'leads:read',
  'leads:write',
  'applications:read',
  'applications:write',
  'documents:read',
  'documents:write',
  'services:read',
  'webhooks:manage',
]);

export const createApiKeySchema = z.object({
  name: z.string().min(2, 'API key name is required'),
  environment: z.enum(['LIVE', 'SANDBOX']).default('LIVE'),
  scopes: z.array(apiKeyScopeEnum).min(1, 'At least one scope must be selected'),
  rateLimitPerMin: z.number().int().min(10).max(1000).default(60),
  expiresInDays: z.number().int().positive().optional().nullable(),
});

export const createWebhookSubscriptionSchema = z.object({
  name: z.string().min(2, 'Webhook name is required'),
  targetUrl: z.string().url('Target URL must be a valid HTTP/HTTPS URL'),
  events: z.array(z.string()).min(1, 'At least one event must be selected'),
});

export const updateWebhookSubscriptionSchema = z.object({
  name: z.string().min(2).optional(),
  targetUrl: z.string().url().optional(),
  events: z.array(z.string()).min(1).optional(),
  isActive: z.boolean().optional(),
});

// ─── Vertical Slice 5.4: Government Systems Direct Integrations ────────────

export const mcaCompanyLookupQuerySchema = z.object({
  name: z.string().min(2, 'Company or LLP name search string required'),
  checkAvailability: z.coerce.boolean().default(true),
});

export const gstnLookupQuerySchema = z.object({
  gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN format'),
});

export const initiateAaConsentSchema = z.object({
  customerId: z.string().uuid('Valid customer ID required'),
  mobile: z.string().regex(indianMobileRegex, 'Valid 10-digit mobile required'),
  vpa: z.string().optional().nullable(),
  fipId: z.string().min(2, 'Financial Institution ID required'),
  statementMonthsCount: z.number().int().min(1).max(24).default(6),
});

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 6: ENTERPRISE COMPLIANCE, SUBSCRIPTIONS & TELEMETRY
// ═══════════════════════════════════════════════════════════════════════════

// ─── Vertical Slice 6.1: Immutable Audit Log Vault & DPDP Compliance ───────

export const createComplianceExportSchema = z.object({
  exportType: z.enum(['AUDIT_TRAIL', 'CUSTOMER_DATA', 'FINANCIAL_LEDGER', 'STATUTORY_FILINGS']),
  format: z.enum(['JSON', 'CSV', 'PDF']).default('JSON'),
  dateRangeFrom: z.string().optional(),
  dateRangeTo: z.string().optional(),
  targetUserId: z.string().uuid().optional().nullable(),
  filters: z.record(z.any()).optional(),
});

export const queryAuditLogsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  action: z.string().optional(),
  entityType: z.string().optional(),
  userId: z.string().uuid().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
});

// ─── Vertical Slice 6.2: Open Banking & Recurring Mandate Subscriptions ───

export const createSubscriptionMandateSchema = z.object({
  customerId: z.string().uuid('Customer ID is required'),
  serviceId: z.string().uuid().optional().nullable(),
  planName: z.string().min(2, 'Plan name is required'),
  frequency: z.enum(['MONTHLY', 'QUARTERLY', 'ANNUALLY']).default('MONTHLY'),
  amount: z.number().positive('Amount must be positive'),
  paymentMethod: z.enum(['UPI_AUTOPAY', 'ENACH_NETBANKING', 'CREDIT_CARD']).default('UPI_AUTOPAY'),
  vpaOrAccount: z.string().optional().nullable(),
  startDate: z.string().optional(),
});

export const executeMandateDebitSchema = z.object({
  mandateId: z.string().uuid('Mandate ID is required'),
  amountOverride: z.number().positive().optional(),
  description: z.string().max(200).optional(),
});

export const updateSubscriptionMandateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'PAUSED', 'CANCELLED']),
  reason: z.string().max(300).optional(),
});

// ─── Vertical Slice 6.4: System Health & Telemetry Probes ───────────────────

export const recordTelemetryProbeSchema = z.object({
  serviceName: z.string().min(2),
  endpoint: z.string().min(1),
  statusCode: z.number().int(),
  latencyMs: z.number().int().min(0),
  status: z.enum(['HEALTHY', 'DEGRADED', 'DOWN']).default('HEALTHY'),
  errorMessage: z.string().optional().nullable(),
  region: z.string().default('ap-south-1'),
});





