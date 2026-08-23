import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seeding for Crazy Capital...');

  // 1. Organization
  const org = await prisma.organization.upsert({
    where: { code: 'CC_INDIA' },
    update: {},
    create: {
      name: 'Crazy Capital',
      legalName: 'Crazy Capital Financial Technologies Private Limited',
      code: 'CC_INDIA',
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Organization created: ${org.name} (${org.id})`);

  // 2. Branches
  const branchData = [
    { name: 'Head Office', code: 'HO', city: 'Noida', state: 'Uttar Pradesh' },
    { name: 'Noida Branch', code: 'NOIDA_01', city: 'Noida', state: 'Uttar Pradesh' },
    { name: 'Delhi Branch', code: 'DELHI_01', city: 'New Delhi', state: 'Delhi' },
    { name: 'Mumbai Branch', code: 'MUMBAI_01', city: 'Mumbai', state: 'Maharashtra' },
    { name: 'Bangalore Branch', code: 'BLR_01', city: 'Bengaluru', state: 'Karnataka' },
  ];

  const branches: Record<string, string> = {};
  for (const b of branchData) {
    const branch = await prisma.branch.upsert({
      where: { organizationId_code: { organizationId: org.id, code: b.code } },
      update: {},
      create: {
        organizationId: org.id,
        name: b.name,
        code: b.code,
        city: b.city,
        state: b.state,
      },
    });
    branches[b.code] = branch.id;
  }
  console.log(`✅ Created ${Object.keys(branches).length} branches.`);

  // 3. Departments
  const departments = ['Sales & Business Development', 'Operations & Fulfillment', 'Finance & Accounts', 'Legal & Compliance'];
  for (const deptName of departments) {
    await prisma.department.create({
      data: {
        organizationId: org.id,
        branchId: branches['HO'],
        name: deptName,
      },
    }).catch(() => {});
  }

  // 4. Roles
  const rolesData = [
    { name: 'Super Admin', code: 'SUPER_ADMIN', description: 'Full system access across all organizations and branches' },
    { name: 'Admin', code: 'ADMIN', description: 'Organization administrator with governance, config, and commission approval access' },
    { name: 'Branch Manager', code: 'BRANCH_MANAGER', description: 'Manages branch operations, employees, and branch reports' },
    { name: 'Employee', code: 'EMPLOYEE', description: 'Operations executive processing assigned leads and workflows' },
    { name: 'Partner', code: 'PARTNER', description: 'External channel / referral partner submitting leads and viewing commissions' },
    { name: 'Customer', code: 'CUSTOMER', description: 'Client using portals for service tracking, documents, and payments' },
  ];

  const roles: Record<string, string> = {};
  for (const r of rolesData) {
    const role = await prisma.role.upsert({
      where: { code: r.code },
      update: {},
      create: r,
    });
    roles[r.code] = role.id;
  }

  // 5. Permissions
  const permissionsList = [
    // Lead permissions
    { code: 'lead.create', name: 'Create Lead', module: 'lead' },
    { code: 'lead.view', name: 'View Lead', module: 'lead' },
    { code: 'lead.update', name: 'Update Lead', module: 'lead' },
    { code: 'lead.assign', name: 'Assign Lead', module: 'lead' },
    { code: 'lead.delete', name: 'Delete Lead', module: 'lead' },
    // Customer permissions
    { code: 'customer.create', name: 'Create Customer', module: 'customer' },
    { code: 'customer.view', name: 'View Customer', module: 'customer' },
    { code: 'customer.update', name: 'Update Customer', module: 'customer' },
    // Service & Workflow permissions
    { code: 'service.manage', name: 'Manage Services', module: 'service' },
    { code: 'workflow.manage', name: 'Manage Workflows', module: 'workflow' },
    { code: 'workflow.transition', name: 'Execute Workflow Stage Transition', module: 'workflow' },
    // Document permissions
    { code: 'document.upload', name: 'Upload Documents', module: 'document' },
    { code: 'document.verify', name: 'Verify Documents', module: 'document' },
    // Payment permissions
    { code: 'payment.create', name: 'Create Payment / Invoice', module: 'payment' },
    { code: 'payment.view', name: 'View Payment Details', module: 'payment' },
    // Commission permissions (ADR-011)
    { code: 'commission.view', name: 'View Commissions', module: 'commission' },
    { code: 'commission.approve', name: 'Approve or Reject Commissions', module: 'commission' },
    // Admin & Reporting permissions (Slice 1.12)
    { code: 'user.manage', name: 'Manage Users & Roles', module: 'user' },
    { code: 'report.view', name: 'View Reports & Dashboards', module: 'report' },
    { code: 'report.export', name: 'Export Reports', module: 'report' },
    // CMS permissions (Slice 1.13)
    { code: 'cms.view', name: 'View CMS Articles', module: 'cms' },
    { code: 'cms.manage', name: 'Manage CMS Articles & Categories', module: 'cms' },
  ];

  const permissionIds: Record<string, string> = {};
  for (const p of permissionsList) {
    const perm = await prisma.permission.upsert({
      where: { code: p.code },
      update: {},
      create: p,
    });
    permissionIds[p.code] = perm.id;
  }

  // 6. Assign Permissions to Roles
  for (const permId of Object.values(permissionIds)) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: roles['SUPER_ADMIN']!, permissionId: permId } },
      update: {},
      create: { roleId: roles['SUPER_ADMIN']!, permissionId: permId },
    });
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: roles['ADMIN']!, permissionId: permId } },
      update: {},
      create: { roleId: roles['ADMIN']!, permissionId: permId },
    });
  }

  // Branch Manager permissions (includes report.view and report.export)
  const branchManagerPerms = ['lead.create', 'lead.view', 'lead.update', 'lead.assign', 'customer.create', 'customer.view', 'customer.update', 'workflow.transition', 'document.upload', 'document.verify', 'payment.view', 'commission.view', 'report.view', 'report.export'];
  for (const code of branchManagerPerms) {
    if (permissionIds[code]) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: roles['BRANCH_MANAGER']!, permissionId: permissionIds[code]! } },
        update: {},
        create: { roleId: roles['BRANCH_MANAGER']!, permissionId: permissionIds[code]! },
      });
    }
  }

  // Employee permissions
  const employeePerms = ['lead.create', 'lead.view', 'lead.update', 'customer.create', 'customer.view', 'customer.update', 'workflow.transition', 'document.upload', 'document.verify'];
  for (const code of employeePerms) {
    if (permissionIds[code]) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: roles['EMPLOYEE']!, permissionId: permissionIds[code]! } },
        update: {},
        create: { roleId: roles['EMPLOYEE']!, permissionId: permissionIds[code]! },
      });
    }
  }

  // Partner permissions
  const partnerPerms = ['lead.create', 'lead.view', 'commission.view'];
  for (const code of partnerPerms) {
    if (permissionIds[code]) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: roles['PARTNER']!, permissionId: permissionIds[code]! } },
        update: {},
        create: { roleId: roles['PARTNER']!, permissionId: permissionIds[code]! },
      });
    }
  }

  // 7. Seed Demo Users for Local Testing & QA
  const adminPasswordHash = await argon2.hash('Admin@CrazyCapital2026!');
  const bmPasswordHash = await argon2.hash('BranchManager@2026!');
  const empPasswordHash = await argon2.hash('Employee@2026!');
  const partnerPasswordHash = await argon2.hash('Partner@2026!');
  const customerPasswordHash = await argon2.hash('Customer@2026!');

  // Super Admin
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@crazycapital.in' },
    update: {},
    create: {
      organizationId: org.id,
      branchId: branches['HO'],
      firstName: 'Super',
      lastName: 'Admin',
      email: 'admin@crazycapital.in',
      mobile: '9999999999',
      passwordHash: adminPasswordHash,
      status: 'ACTIVE',
    },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: roles['SUPER_ADMIN']! } },
    update: {},
    create: { userId: adminUser.id, roleId: roles['SUPER_ADMIN']! },
  });

  // Branch Manager - Noida
  const bmNoidaUser = await prisma.user.upsert({
    where: { email: 'bm.noida@crazycapital.in' },
    update: {},
    create: {
      organizationId: org.id,
      branchId: branches['NOIDA_01'],
      firstName: 'Vikram',
      lastName: 'Sharma',
      email: 'bm.noida@crazycapital.in',
      mobile: '9811001100',
      passwordHash: bmPasswordHash,
      status: 'ACTIVE',
    },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: bmNoidaUser.id, roleId: roles['BRANCH_MANAGER']! } },
    update: {},
    create: { userId: bmNoidaUser.id, roleId: roles['BRANCH_MANAGER']! },
  });

  // Branch Manager - HO
  const bmHoUser = await prisma.user.upsert({
    where: { email: 'amit.kumar@crazycapital.in' },
    update: {},
    create: {
      organizationId: org.id,
      branchId: branches['HO'],
      firstName: 'Amit',
      lastName: 'Kumar',
      email: 'amit.kumar@crazycapital.in',
      mobile: '9811001101',
      passwordHash: bmPasswordHash,
      status: 'ACTIVE',
    },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: bmHoUser.id, roleId: roles['BRANCH_MANAGER']! } },
    update: {},
    create: { userId: bmHoUser.id, roleId: roles['BRANCH_MANAGER']! },
  });

  // Employees
  const empPriya = await prisma.user.upsert({
    where: { email: 'priya.verma@crazycapital.in' },
    update: {},
    create: {
      organizationId: org.id,
      branchId: branches['NOIDA_01'],
      firstName: 'Priya',
      lastName: 'Verma',
      email: 'priya.verma@crazycapital.in',
      mobile: '9811001102',
      passwordHash: empPasswordHash,
      status: 'ACTIVE',
    },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: empPriya.id, roleId: roles['EMPLOYEE']! } },
    update: {},
    create: { userId: empPriya.id, roleId: roles['EMPLOYEE']! },
  });

  const empSuresh = await prisma.user.upsert({
    where: { email: 'suresh.nair@crazycapital.in' },
    update: {},
    create: {
      organizationId: org.id,
      branchId: branches['DELHI_01'],
      firstName: 'Suresh',
      lastName: 'Nair',
      email: 'suresh.nair@crazycapital.in',
      mobile: '9811001103',
      passwordHash: empPasswordHash,
      status: 'ACTIVE',
    },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: empSuresh.id, roleId: roles['EMPLOYEE']! } },
    update: {},
    create: { userId: empSuresh.id, roleId: roles['EMPLOYEE']! },
  });

  // Partner User
  const partnerUser = await prisma.user.upsert({
    where: { email: 'partner@apexadvisors.in' },
    update: {},
    create: {
      organizationId: org.id,
      branchId: branches['HO'],
      firstName: 'Karan',
      lastName: 'Malhotra',
      email: 'partner@apexadvisors.in',
      mobile: '9811998877',
      passwordHash: partnerPasswordHash,
      status: 'ACTIVE',
    },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: partnerUser.id, roleId: roles['PARTNER']! } },
    update: {},
    create: { userId: partnerUser.id, roleId: roles['PARTNER']! },
  });

  // Customer Portal User
  const customerUser = await prisma.user.upsert({
    where: { email: 'client@kapoorenterprises.com' },
    update: {},
    create: {
      organizationId: org.id,
      branchId: branches['HO'],
      firstName: 'Arjun',
      lastName: 'Kapoor',
      email: 'client@kapoorenterprises.com',
      mobile: '9822003344',
      passwordHash: customerPasswordHash,
      status: 'ACTIVE',
    },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: customerUser.id, roleId: roles['CUSTOMER']! } },
    update: {},
    create: { userId: customerUser.id, roleId: roles['CUSTOMER']! },
  });

  console.log(`✅ Seeded all QA Demo Users (Admin, Branch Managers, Employees, Partner, Customer).`);

  // 8. Lead Sources (ADR-013)
  const leadSourcesData = [
    { name: 'Website', code: 'WEBSITE' },
    { name: 'WhatsApp', code: 'WHATSAPP' },
    { name: 'Partner Referral', code: 'PARTNER_REFERRAL' },
    { name: 'Walk-in', code: 'WALK_IN' },
    { name: 'Cold Call', code: 'COLD_CALL' },
    { name: 'Social Media', code: 'SOCIAL_MEDIA' },
    { name: 'Email Campaign', code: 'EMAIL_CAMPAIGN' },
    { name: 'Event / Exhibition', code: 'EVENT' },
    { name: 'Employee Referral', code: 'EMPLOYEE_REFERRAL' },
    { name: 'Direct Call', code: 'DIRECT_CALL' },
  ];

  const sourceMap: Record<string, string> = {};
  for (const s of leadSourcesData) {
    const src = await prisma.leadSource.upsert({
      where: { code: s.code },
      update: {},
      create: s,
    });
    sourceMap[s.code] = src.id;
  }

  // 9. Document Types
  const docTypesData = [
    { name: 'PAN Card', code: 'PAN', description: 'Permanent Account Number Card' },
    { name: 'Aadhaar Card', code: 'AADHAAR', description: 'UIDAI Aadhaar Card' },
    { name: 'GST Certificate', code: 'GST_CERTIFICATE', description: 'GST Registration Certificate' },
    { name: 'Passport', code: 'PASSPORT', description: 'Passport Identity Proof' },
    { name: 'ITR-V Acknowledgement', code: 'ITR_V', description: 'Income Tax Return Verification' },
    { name: 'Bank Statement', code: 'BANK_STATEMENT', description: 'Last 6 Months Bank Statement' },
  ];

  const docTypes: Record<string, string> = {};
  for (const d of docTypesData) {
    const dt = await prisma.documentType.upsert({
      where: { code: d.code },
      update: {},
      create: d,
    });
    docTypes[d.code] = dt.id;
  }

  // 10. Service Categories, Services & Workflows (ADR-012)
  const categoryCorp = await prisma.serviceCategory.upsert({
    where: { slug: 'corporate-incorporation' },
    update: {},
    create: {
      name: 'Corporate Incorporation',
      slug: 'corporate-incorporation',
      description: 'Company registration and corporate structurings',
      isActive: true,
    },
  });

  const categoryTax = await prisma.serviceCategory.upsert({
    where: { slug: 'tax-compliance' },
    update: {},
    create: {
      name: 'Tax & Compliance',
      slug: 'tax-compliance',
      description: 'Statutory GST, TDS, and MCA filings',
      isActive: true,
    },
  });

  const categoryIP = await prisma.serviceCategory.upsert({
    where: { slug: 'intellectual-property' },
    update: {},
    create: {
      name: 'Intellectual Property',
      slug: 'intellectual-property',
      description: 'Trademarks, Copyrights, and Patents',
      isActive: true,
    },
  });

  // Services
  const srvPvt = await prisma.service.upsert({
    where: { slug: 'private-limited-company' },
    update: {},
    create: {
      categoryId: categoryCorp.id,
      name: 'Private Limited Company Incorporation',
      slug: 'private-limited-company',
      description: 'Full incorporation package with SPICe+, PAN, TAN, and Certificate of Incorporation',
      isActive: true,
    },
  });

  await prisma.servicePricing.create({
    data: { serviceId: srvPvt.id, pricingType: 'STANDARD', amount: 15000 },
  }).catch(() => {});

  const srvGst = await prisma.service.upsert({
    where: { slug: 'gst-registration' },
    update: {},
    create: {
      categoryId: categoryTax.id,
      name: 'GST Registration & Verification',
      slug: 'gst-registration',
      description: 'GSTIN allotment with jurisdiction tax officer verification',
      isActive: true,
    },
  });

  await prisma.servicePricing.create({
    data: { serviceId: srvGst.id, pricingType: 'STANDARD', amount: 5000 },
  }).catch(() => {});

  const srvTm = await prisma.service.upsert({
    where: { slug: 'trademark-filing' },
    update: {},
    create: {
      categoryId: categoryIP.id,
      name: 'Trademark Registration (TM-A)',
      slug: 'trademark-filing',
      description: 'Brand name and logo trademark registration with IPO India',
      isActive: true,
    },
  });

  await prisma.servicePricing.create({
    data: { serviceId: srvTm.id, pricingType: 'STANDARD', amount: 8000 },
  }).catch(() => {});

  // Workflow Template for Pvt Ltd (ADR-012)
  let workflowPvt = await prisma.workflow.findUnique({
    where: { serviceId: srvPvt.id },
  });

  if (!workflowPvt) {
    workflowPvt = await prisma.workflow.create({
      data: {
        serviceId: srvPvt.id,
        name: 'Pvt Ltd Incorporation Workflow',
        code: 'WF_PVT_LTD',
        description: 'Sequential 4-stage MCA incorporation workflow',
        isActive: true,
      },
    });

    const st1 = await prisma.workflowStage.create({
      data: { workflowId: workflowPvt.id, name: 'Document Collection', code: 'ST_DOC_COLLECT', stageOrder: 1, isStartStage: true, stageType: 'START', slaHours: 24 },
    });
    const st2 = await prisma.workflowStage.create({
      data: { workflowId: workflowPvt.id, name: 'MCA SPICe+ Filing', code: 'ST_MCA_FILING', stageOrder: 2, stageType: 'PROCESSING', slaHours: 48 },
    });
    const st3 = await prisma.workflowStage.create({
      data: { workflowId: workflowPvt.id, name: 'Officer Compliance Review', code: 'ST_OFFICER_REVIEW', stageOrder: 3, stageType: 'PROCESSING', slaHours: 24 },
    });
    const st4 = await prisma.workflowStage.create({
      data: { workflowId: workflowPvt.id, name: 'Delivered & Completed', code: 'ST_DELIVERED', stageOrder: 4, isEndStage: true, stageType: 'COMPLETION' },
    });

    await prisma.workflowTransition.createMany({
      data: [
        { workflowId: workflowPvt.id, fromStageId: st1.id, toStageId: st2.id },
        { workflowId: workflowPvt.id, fromStageId: st2.id, toStageId: st3.id },
        { workflowId: workflowPvt.id, fromStageId: st3.id, toStageId: st4.id },
      ],
      skipDuplicates: true,
    });
  }

  // 11. Sample Customers
  const customerKapoor = await prisma.customer.upsert({
    where: { organizationId_mobile: { organizationId: org.id, mobile: '9822003344' } },
    update: {},
    create: {
      organizationId: org.id,
      branchId: branches['HO'],
      customerType: 'BUSINESS',
      firstName: 'Arjun',
      lastName: 'Kapoor',
      email: 'client@kapoorenterprises.com',
      mobile: '9822003344',
      companyName: 'Kapoor Global Exports Private Limited',
      pan: 'AABCK1234D',
      gstin: '07AABCK1234D1Z8',
      status: 'ACTIVE',
    },
  });

  const customerNoida = await prisma.customer.upsert({
    where: { organizationId_mobile: { organizationId: org.id, mobile: '9811882233' } },
    update: {},
    create: {
      organizationId: org.id,
      branchId: branches['NOIDA_01'],
      customerType: 'BUSINESS',
      firstName: 'Rakesh',
      lastName: 'Bansal',
      email: 'rakesh@bansaltech.in',
      mobile: '9811882233',
      companyName: 'Bansal Tech Logistics LLP',
      pan: 'AABCB5678E',
      status: 'ACTIVE',
    },
  });

  // 12. Sample Applications & Workflow Instances (Slice 1.6 / 1.11)
  const app1 = await prisma.application.upsert({
    where: { applicationNumber: 'CC-2026-000101' },
    update: {},
    create: {
      organizationId: org.id,
      branchId: branches['HO'],
      customerId: customerKapoor.id,
      serviceId: srvPvt.id,
      applicationNumber: 'CC-2026-000101',
      status: 'IN_PROGRESS',
      assignedToId: empPriya.id,
      partnerId: partnerUser.id,
    },
  });

  const stages = await prisma.workflowStage.findMany({ where: { workflowId: workflowPvt.id }, orderBy: { stageOrder: 'asc' } });
  if (stages.length > 0) {
    await prisma.workflowInstance.upsert({
      where: { applicationId: app1.id },
      update: {},
      create: {
        workflowId: workflowPvt.id,
        applicationId: app1.id,
        currentStageId: stages[1]?.id || stages[0].id,
      },
    });
  }

  const app2 = await prisma.application.upsert({
    where: { applicationNumber: 'CC-2026-000102' },
    update: {},
    create: {
      organizationId: org.id,
      branchId: branches['NOIDA_01'],
      customerId: customerNoida.id,
      serviceId: srvGst.id,
      applicationNumber: 'CC-2026-000102',
      status: 'COMPLETED',
      assignedToId: empPriya.id,
    },
  });

  // 13. Sample Invoices & Payments (Slice 1.8)
  const inv1 = await prisma.invoice.upsert({
    where: { invoiceNumber: 'INV-2026-000001' },
    update: {},
    create: {
      customerId: customerKapoor.id,
      applicationId: app1.id,
      invoiceNumber: 'INV-2026-000001',
      amount: 17700,
      taxAmount: 2700, // 18% GST on 15,000
      status: 'PAID',
    },
  });

  await prisma.payment.upsert({
    where: { gatewayReference: 'pay_RZP_TEST_001' },
    update: {},
    create: {
      invoiceId: inv1.id,
      gateway: 'RAZORPAY',
      gatewayReference: 'pay_RZP_TEST_001',
      amount: 17700,
      status: 'CAPTURED',
    },
  });

  const inv2 = await prisma.invoice.upsert({
    where: { invoiceNumber: 'INV-2026-000002' },
    update: {},
    create: {
      customerId: customerNoida.id,
      applicationId: app2.id,
      invoiceNumber: 'INV-2026-000002',
      amount: 5900,
      taxAmount: 900, // 18% GST on 5,000
      status: 'PAID',
    },
  });

  await prisma.payment.upsert({
    where: { gatewayReference: 'pay_RZP_TEST_002' },
    update: {},
    create: {
      invoiceId: inv2.id,
      gateway: 'RAZORPAY',
      gatewayReference: 'pay_RZP_TEST_002',
      amount: 5900,
      status: 'CAPTURED',
    },
  });

  await prisma.invoice.upsert({
    where: { invoiceNumber: 'INV-2026-000003' },
    update: {},
    create: {
      customerId: customerKapoor.id,
      invoiceNumber: 'INV-2026-000003',
      amount: 9440,
      taxAmount: 1440,
      status: 'SENT',
    },
  });

  // 14. Partner Commissions & Payouts (Slice 1.9)
  const comm1 = await prisma.commission.create({
    data: {
      applicationId: app1.id,
      serviceId: srvPvt.id,
      partnerId: partnerUser.id,
      baseAmount: 15000,
      rate: 10,
      amount: 1500,
      status: 'PAID',
      approvedById: adminUser.id,
      approvedAt: new Date(),
    },
  }).catch(() => {});

  if (comm1) {
    await prisma.payout.create({
      data: {
        commissionId: comm1.id,
        partnerId: partnerUser.id,
        amount: 1500,
        paymentMethod: 'BANK_TRANSFER',
        status: 'PAID',
        referenceNumber: 'UTR-HDFC-2026-981122',
        paidAt: new Date(),
        notes: 'Monthly partner referral settlement',
      },
    }).catch(() => {});
  }

  // 15. Sample Documents (Slice 1.7)
  await prisma.document.createMany({
    data: [
      {
        organizationId: org.id,
        branchId: branches['HO'],
        customerId: customerKapoor.id,
        applicationId: app1.id,
        documentTypeId: docTypes['PAN']!,
        fileName: 'kapoor_pan_card.pdf',
        filePath: 'staging/documents/kapoor_pan_card.pdf',
        fileSize: 245000,
        mimeType: 'application/pdf',
        status: 'VERIFIED',
      },
      {
        organizationId: org.id,
        branchId: branches['HO'],
        customerId: customerKapoor.id,
        applicationId: app1.id,
        documentTypeId: docTypes['GST_CERTIFICATE']!,
        fileName: 'gst_certificate.pdf',
        filePath: 'staging/documents/gst_certificate.pdf',
        fileSize: 512000,
        mimeType: 'application/pdf',
        status: 'VERIFIED',
      },
      {
        organizationId: org.id,
        branchId: branches['NOIDA_01'],
        customerId: customerNoida.id,
        applicationId: app2.id,
        documentTypeId: docTypes['BANK_STATEMENT']!,
        fileName: 'bansal_bank_stmt.pdf',
        filePath: 'staging/documents/bansal_bank_stmt.pdf',
        fileSize: 1024000,
        mimeType: 'application/pdf',
        status: 'PENDING',
      },
    ],
    skipDuplicates: true,
  });

  // 16. Sample CRM Inbound Leads (Slice 1.2)
  const sampleLeads = [
    {
      firstName: 'Rajesh',
      lastName: 'Gupta',
      email: 'rajesh.gupta@apextech.in',
      mobile: '9876543210',
      companyName: 'Apex Technologies Pvt Ltd',
      status: 'CONVERTED',
      leadScore: 90,
      sourceId: sourceMap['WEBSITE'],
      branchId: branches['HO'],
      notes: 'Converted to Private Limited Incorporation & GST Registration package.',
      campaign: 'GOOGLE_ADS_Q3',
      assignedToId: empPriya.id,
    },
    {
      firstName: 'Sneha',
      lastName: 'Patel',
      email: 'sneha@patelconsulting.com',
      mobile: '9876543211',
      companyName: 'Patel Legal Advisory',
      status: 'CONTACTED',
      leadScore: 70,
      sourceId: sourceMap['WHATSAPP'],
      branchId: branches['MUMBAI_01'],
      notes: 'Initial WhatsApp outreach completed; sent company registration checklist.',
      campaign: 'WHATSAPP_CAMPAIGN',
      assignedToId: empSuresh.id,
    },
    {
      firstName: 'Vikram',
      lastName: 'Mehta',
      email: 'vikram@mehtalogistics.in',
      mobile: '9876543212',
      companyName: 'Mehta Logistics India LLP',
      status: 'QUALIFIED',
      leadScore: 92,
      sourceId: sourceMap['PARTNER_REFERRAL'],
      branchId: branches['DELHI_01'],
      notes: 'High ticket size: MSME Loan syndication + Trademark Filing.',
      campaign: 'PARTNER_MEET_AUG',
      assignedToId: empSuresh.id,
    },
    {
      firstName: 'Deepak',
      lastName: 'Singhania',
      email: 'deepak@singhaniagroup.com',
      mobile: '9876543213',
      companyName: 'Singhania Industrial Corp',
      status: 'PROPOSAL',
      leadScore: 95,
      sourceId: sourceMap['DIRECT_CALL'],
      branchId: branches['HO'],
      notes: 'Custom annual corporate compliance retainer quote sent.',
      assignedToId: bmHoUser.id,
    },
    {
      firstName: 'Kavita',
      lastName: 'Reddy',
      email: 'kavita@reddyfoods.in',
      mobile: '9876543214',
      companyName: 'Reddy Organic Foods Pvt Ltd',
      status: 'NEW',
      leadScore: 50,
      sourceId: sourceMap['COLD_CALL'],
      branchId: branches['BLR_01'],
      notes: 'Inquiry received via inbound inquiry line.',
      assignedToId: empPriya.id,
    },
  ];

  for (const l of sampleLeads) {
    const existing = await prisma.lead.findFirst({
      where: { organizationId: org.id, mobile: l.mobile },
    });
    if (!existing) {
      const createdLead = await prisma.lead.create({
        data: {
          organizationId: org.id,
          ...l,
        },
      });

      await prisma.leadActivity.create({
        data: {
          leadId: createdLead.id,
          performedById: adminUser.id,
          activityType: 'NOTE',
          notes: `Inquiry recorded: ${l.notes}`,
        },
      });
    }
  }

  // 17. Seed CMS Categories and Blog Articles (Vertical Slice 1.13)
  const categoriesData = [
    {
      name: 'Company Incorporation',
      slug: 'incorporation-guide',
      description: 'Comprehensive guides and regulatory updates on registering startups and corporate entities in India.',
      icon: 'Building2',
      sortOrder: 1,
    },
    {
      name: 'Tax & GST Compliance',
      slug: 'gst-taxation',
      description: 'GST filing tutorials, input tax credit optimization, corporate income tax strategies, and TDS compliance.',
      icon: 'FileCheck2',
      sortOrder: 2,
    },
    {
      name: 'Intellectual Property',
      slug: 'trademark-ip',
      description: 'Trademark search, TM-A filing procedures, copyright protection, and patent registration insights.',
      icon: 'Award',
      sortOrder: 3,
    },
    {
      name: 'Startup & MSME Growth',
      slug: 'startup-funding',
      description: 'DPIIT Startup India recognition, Section 80-IAC tax holidays, MSME Udyam registration, and working capital loans.',
      icon: 'TrendingUp',
      sortOrder: 4,
    },
    {
      name: 'Corporate Legal & ROC',
      slug: 'compliance-legal',
      description: 'ROC annual filing checklists, director KYC requirements, shareholder agreements, and board resolutions.',
      icon: 'Scale',
      sortOrder: 5,
    },
  ];

  const catMap: Record<string, string> = {};
  for (const c of categoriesData) {
    const cat = await prisma.blogCategory.upsert({
      where: { slug: c.slug },
      update: {},
      create: {
        organizationId: org.id,
        ...c,
      },
    });
    catMap[c.slug] = cat.id;
  }

  const articlesData = [
    {
      title: 'How to Register a Private Limited Company in India (2026 Step-by-Step Guide)',
      slug: 'how-to-register-pvt-ltd-company-india',
      categoryId: catMap['incorporation-guide'],
      authorId: adminUser.id,
      excerpt: 'Learn the complete end-to-end MCA SPICe+ procedure, required documents, DIN & DSC requirements, and statutory timelines for Pvt Ltd incorporation.',
      content: `# How to Register a Private Limited Company in India (2026 Guide)

Starting a private limited company is the most preferred route for high-growth startups and businesses looking to raise venture capital, protect personal assets through limited liability, and establish credibility in India.

---

## 1. Key Advantages of a Private Limited Company
- **Limited Liability Protection**: Shareholders are only liable up to their unpaid share capital.
- **Separate Legal Entity**: The company can own property, incur debt, and sue or be sued in its own name.
- **Unbroken Continuity**: The company exists perpetually regardless of changes in directors or shareholding.
- **Ease of Raising Equity**: Preferred corporate structure for angel investors, VCs, and bank debt financing.

---

## 2. Minimum Requirements
1. **Minimum 2 Directors** (at least one must be an Indian Resident).
2. **Minimum 2 Shareholders** (can be the same as directors).
3. **Digital Signature Certificates (DSC - Class 3)** for all proposed directors.
4. **Registered Office Address** in India with utility bill and NOC from property owner.

---

## 3. The 4-Stage MCA SPICe+ Process

### Step 1: Name Reservation (SPICe+ Part A)
Submit two unique name choices adhering to MCA naming guidelines (e.g. *Crazy Capital Technologies Private Limited*).

### Step 2: SPICe+ Part B Integrated Application
Filing of integrated web forms for:
- Director Identification Number (DIN) allocation (up to 3 directors).
- Articles of Association (e-AOA / INC-34) and Memorandum of Association (e-MOA / INC-33).
- Mandatory PAN and TAN allotment.
- EPFO and ESIC registration.
- Professional Tax registration (for applicable states).
- Bank Current Account opening selection.

### Step 3: AGILE-PRO-S Compliance & Scrutiny
Central Registration Centre (CRC) officers review the submitted documents, affidavits (INC-9), and proof of registered office (INC-22).

### Step 4: Certificate of Incorporation (COI) Issuance
Upon approval, MCA issues the Certificate of Incorporation containing the **Corporate Identification Number (CIN)**, PAN, and TAN.

---

## 4. Required Checklist for Directors
- Self-attested PAN Card.
- Identity Proof (Voter ID / Passport / Driving License).
- Address Proof (Bank Statement / Electricity Bill not older than 2 months).
- Passport-size photograph.

*Crazy Capital simplifies your incorporation with dedicated compliance managers and a 3 to 5 business day delivery timeline.*`,
      coverImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
      readingTimeMin: 6,
      status: 'PUBLISHED',
      publishedAt: new Date('2026-08-01T10:00:00Z'),
      tags: ['Incorporation', 'MCA', 'Pvt Ltd', 'Startup India'],
      featured: true,
      viewCount: 384,
      metaTitle: 'How to Register a Pvt Ltd Company in India (2026) | Crazy Capital',
      metaDescription: 'Step-by-step guide to incorporating a Private Limited Company with MCA SPICe+, DIN, DSC, PAN, and TAN in 3-5 days.',
      metaKeywords: 'pvt ltd registration, company incorporation india, spice plus mca, digital signature certificate',
      canonicalUrl: 'https://crazycapital.in/blog/how-to-register-pvt-ltd-company-india',
      ogTitle: 'How to Register a Pvt Ltd Company in India (2026 Guide)',
      ogDescription: 'Complete step-by-step breakdown of SPICe+ incorporation, fees, timelines, and document checklists.',
      ogImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
      twitterCard: 'summary_large_image',
    },
    {
      title: 'GST Registration Guide: Mandatory Thresholds, Exemption Limits & Process',
      slug: 'gst-registration-thresholds-and-process',
      categoryId: catMap['gst-taxation'],
      authorId: adminUser.id,
      excerpt: 'Understand when GST registration becomes mandatory, inter-state supply rules, voluntary registration benefits, and verification workflows.',
      content: `# GST Registration in India: Thresholds, Documents & Online Procedure

The Goods and Services Tax (GST) is a comprehensive destination-based indirect tax levied on the manufacture, sale, and consumption of goods and services throughout India.

---

## 1. Who Must Register for GST?
- **Goods Suppliers**: Aggregate annual turnover exceeding ₹40 Lakhs (₹20 Lakhs for Special Category States).
- **Service Providers**: Aggregate annual turnover exceeding ₹20 Lakhs (₹10 Lakhs for Special Category States).
- **Inter-State Suppliers**: Any entity supplying goods across state borders, regardless of turnover.
- **E-Commerce Sellers**: Sellers operating on marketplaces like Amazon, Flipkart, or Zepto.
- **Casual Taxable Persons & NRIs**: Persons making taxable supplies occasionally in a territory.

---

## 2. Benefits of Voluntary GST Registration
Even if your revenue is below the statutory threshold, voluntary GST registration empowers you to:
1. Claim **Input Tax Credit (ITC)** on business expenses and equipment purchases.
2. Expand sales seamlessly across state borders.
3. Onboard as an approved vendor for corporate B2B clients who mandate GST invoices.
4. Establish formal financial credentials for MSME bank loans.

---

## 3. Documents Required for GST Application
- **Proprietor / Partner / Director**: PAN, Aadhaar, and Photo.
- **Business Proof**: Certificate of Incorporation, Partnership Deed, or Trade License.
- **Bank Account Proof**: Cancelled Cheque or Bank Statement showing Name and IFSC.
- **Premises Proof**: Electricity Bill / Property Tax Receipt along with Rent Agreement & Landlord NOC.

---

## 4. Aadhaar Authentication & Fast-Track Approval
Applicants completing biometric or OTP-based Aadhaar authentication receive approval within **3 to 7 working days** without physical site inspection.`,
      coverImage: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80',
      readingTimeMin: 5,
      status: 'PUBLISHED',
      publishedAt: new Date('2026-08-05T11:00:00Z'),
      tags: ['GST', 'Taxation', 'Compliance', 'ITC'],
      featured: false,
      viewCount: 245,
      metaTitle: 'GST Registration Guide: Thresholds & Process | Crazy Capital',
      metaDescription: 'Comprehensive guide to GST registration thresholds, voluntary filing benefits, mandatory documents, and Aadhaar authentication.',
      metaKeywords: 'gst registration, gst threshold, input tax credit, gstr-1, gst certificate',
      canonicalUrl: 'https://crazycapital.in/blog/gst-registration-thresholds-and-process',
      ogTitle: 'GST Registration Guide: Mandatory Thresholds & Online Process',
      ogDescription: 'Everything you need to know about GST registration criteria, documentation, and ITC benefits.',
      ogImage: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80',
      twitterCard: 'summary_large_image',
    },
    {
      title: 'Trademark Registration in India: Protecting Your Brand with TM-A Filing',
      slug: 'trademark-registration-tma-filing-guide',
      categoryId: catMap['trademark-ip'],
      authorId: adminUser.id,
      excerpt: 'Protect your brand name, logo, and slogan from infringement. Learn about the 45 Nice classes, public search techniques, and TM-A examination workflows.',
      content: `# Trademark Registration in India: Protecting Your Brand Identity

In today's competitive digital economy, your brand name, logo, and tagline are among your most valuable intellectual assets. Registering a trademark gives you exclusive statutory ownership and legal recourse against copycats.

---

## 1. What Can Be Registered as a Trademark?
- **Word Marks**: Brand names, personal names, abbreviations (e.g. *Crazy Capital*).
- **Device Marks / Logos**: Unique graphic representations and brand symbols.
- **Taglines & Slogans**: Catchy business mottos.
- **Sound & Shape Marks**: Distinctive audio jingles or unique product packaging shapes.

---

## 2. The 45 Trademark Classes (Nice Classification)
Trademarks are categorized into 45 distinct classes:
- **Classes 1 to 34**: Physical Goods (e.g. Class 9 for Software/Hardware, Class 25 for Apparel).
- **Classes 35 to 45**: Commercial Services (e.g. Class 35 for Advertising & Business Management, Class 36 for Financial & Real Estate Services).

---

## 3. Step-by-Step TM-A Registration Lifecycle
1. **Comprehensive Trademark Search**: Checking phonetically and visually similar existing marks on the IP India registry.
2. **TM-A Application Filing**: Filing online with user affidavit, logo representation, and class selection.
3. **Symbol Usage**: You can legally use the **™ symbol** immediately upon receiving the filing receipt.
4. **Examination by IP Officer**: The examiner reviews the mark for absolute (Section 9) or relative (Section 11) grounds of refusal.
5. **Publication in Trademark Journal**: The mark is published for 4 months for public opposition scrutiny.
6. **Registration & Certificate**: If no opposition is filed, the Registrar issues the Certificate, granting the prestigious **® symbol** valid for 10 years.`,
      coverImage: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1200&q=80',
      readingTimeMin: 5,
      status: 'PUBLISHED',
      publishedAt: new Date('2026-08-10T14:00:00Z'),
      tags: ['Trademark', 'Intellectual Property', 'TM-A', 'Brand Protection'],
      featured: true,
      viewCount: 198,
      metaTitle: 'Trademark Registration in India (TM-A Guide) | Crazy Capital',
      metaDescription: 'Protect your brand name and logo with TM-A filing. Learn about the 45 Nice classes, IP search, and examination stages.',
      metaKeywords: 'trademark registration, tm-a, ip india, brand copyright, trademark classes',
      canonicalUrl: 'https://crazycapital.in/blog/trademark-registration-tma-filing-guide',
      ogTitle: 'Trademark Registration in India: TM-A Filing & Brand Protection',
      ogDescription: 'Secure your brand name and logo across the 45 Nice classes with expert legal guidance.',
      ogImage: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1200&q=80',
      twitterCard: 'summary_large_image',
    },
  ];

  for (const a of articlesData) {
    const existing = await prisma.blogPost.findUnique({
      where: { slug: a.slug },
    });
    if (!existing) {
      await prisma.blogPost.create({
        data: {
          organizationId: org.id,
          ...a,
        },
      });
    }
  }

  console.log(`✅ Sample Leads, Invoices, Workflows, Applications, Documents, and CMS Knowledge Base seeded successfully!`);
  console.log('🎉 Comprehensive database seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
