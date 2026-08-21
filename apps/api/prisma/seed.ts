import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding for Crazy Capital...');

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
    }).catch(() => {}); // ignore duplicate in repeated seed
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
  console.log(`✅ Roles seeded.`);

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
    // Admin permissions
    { code: 'user.manage', name: 'Manage Users & Roles', module: 'user' },
    { code: 'report.view', name: 'View Reports & Dashboards', module: 'report' },
    { code: 'report.export', name: 'Export Reports', module: 'report' },
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
  console.log(`✅ Permissions seeded.`);

  // 6. Assign Permissions to Roles
  // Super Admin & Admin get all permissions
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

  // Branch Manager gets branch-level permissions (no commission.approve)
  const branchManagerPerms = ['lead.create', 'lead.view', 'lead.update', 'lead.assign', 'customer.create', 'customer.view', 'customer.update', 'workflow.transition', 'document.upload', 'document.verify', 'payment.view', 'commission.view', 'report.view'];
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

  // 7. Super Admin User
  const passwordHash = await argon2.hash('Admin@CrazyCapital2026!');
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
      passwordHash,
      status: 'ACTIVE',
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: roles['SUPER_ADMIN']! } },
    update: {},
    create: { userId: adminUser.id, roleId: roles['SUPER_ADMIN']! },
  });
  console.log(`✅ Super Admin created: admin@crazycapital.in / Admin@CrazyCapital2026!`);

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

  for (const s of leadSourcesData) {
    await prisma.leadSource.upsert({
      where: { code: s.code },
      update: {},
      create: s,
    });
  }
  console.log(`✅ 10 Lead Sources seeded (ADR-013).`);

  // 9. Document Types
  const docTypes = [
    { name: 'PAN Card', code: 'PAN', description: 'Permanent Account Number Card' },
    { name: 'Aadhaar Card', code: 'AADHAAR', description: 'UIDAI Aadhaar Card' },
    { name: 'GST Certificate', code: 'GST_CERTIFICATE', description: 'GST Registration Certificate' },
    { name: 'Passport', code: 'PASSPORT', description: 'Passport Identity Proof' },
    { name: 'ITR-V Acknowledgement', code: 'ITR_V', description: 'Income Tax Return Verification' },
    { name: 'Bank Statement', code: 'BANK_STATEMENT', description: 'Last 6 Months Bank Statement' },
  ];

  for (const d of docTypes) {
    await prisma.documentType.upsert({
      where: { code: d.code },
      update: {},
      create: d,
    });
  }
  console.log(`✅ Document types seeded.`);

  // 10. Sample Employees
  const empPassword = await argon2.hash('Employee@2026!');
  const employeesData = [
    { firstName: 'Amit', lastName: 'Kumar', email: 'amit.kumar@crazycapital.in', mobile: '9811001101', branchCode: 'HO', roleCode: 'BRANCH_MANAGER' },
    { firstName: 'Priya', lastName: 'Verma', email: 'priya.verma@crazycapital.in', mobile: '9811001102', branchCode: 'NOIDA_01', roleCode: 'EMPLOYEE' },
    { firstName: 'Suresh', lastName: 'Nair', email: 'suresh.nair@crazycapital.in', mobile: '9811001103', branchCode: 'DELHI_01', roleCode: 'EMPLOYEE' },
    { firstName: 'Ananya', lastName: 'Deshmukh', email: 'ananya.d@crazycapital.in', mobile: '9811001104', branchCode: 'MUMBAI_01', roleCode: 'EMPLOYEE' },
  ];

  const employees: Record<string, any> = {};
  for (const emp of employeesData) {
    const user = await prisma.user.upsert({
      where: { email: emp.email },
      update: {},
      create: {
        organizationId: org.id,
        branchId: branches[emp.branchCode] || branches['HO'],
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email,
        mobile: emp.mobile,
        passwordHash: empPassword,
        status: 'ACTIVE',
      },
    });
    employees[emp.email] = user;

    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: roles[emp.roleCode]! } },
      update: {},
      create: { userId: user.id, roleId: roles[emp.roleCode]! },
    });
  }
  console.log(`✅ ${employeesData.length} Employees seeded.`);

  // 11. Sample Leads & Activity Timelines
  const leadSources = await prisma.leadSource.findMany();
  const sourceMap = Object.fromEntries(leadSources.map((s) => [s.code, s.id]));

  const sampleLeads = [
    {
      firstName: 'Rajesh',
      lastName: 'Gupta',
      email: 'rajesh.gupta@apextech.in',
      mobile: '9876543210',
      companyName: 'Apex Technologies Pvt Ltd',
      status: 'NEW',
      leadScore: 85,
      sourceId: sourceMap['WEBSITE'],
      branchId: branches['HO'],
      notes: 'Interested in Private Limited Incorporation & GST Registration package.',
      campaign: 'GOOGLE_ADS_Q3',
      assignedToId: employees['priya.verma@crazycapital.in']?.id,
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
      assignedToId: employees['ananya.d@crazycapital.in']?.id,
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
      assignedToId: employees['suresh.nair@crazycapital.in']?.id,
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
      assignedToId: employees['amit.kumar@crazycapital.in']?.id,
    },
    {
      firstName: 'Kavita',
      lastName: 'Reddy',
      email: 'kavita@reddyfoods.in',
      mobile: '9876543214',
      companyName: 'Reddy Organic Foods Pvt Ltd',
      status: 'LOST',
      leadScore: 30,
      sourceId: sourceMap['COLD_CALL'],
      branchId: branches['BLR_01'],
      notes: 'Opted for local CA firm due to existing relationship.',
      assignedToId: employees['priya.verma@crazycapital.in']?.id,
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

      // Add activities
      await prisma.leadActivity.create({
        data: {
          leadId: createdLead.id,
          performedById: adminUser.id,
          activityType: 'NOTE',
          notes: `Inquiry received: ${l.notes}`,
        },
      });

      if (l.status !== 'NEW') {
        await prisma.leadActivity.create({
          data: {
            leadId: createdLead.id,
            performedById: l.assignedToId || adminUser.id,
            activityType: 'CALL',
            notes: 'Follow-up discovery phone call completed with client.',
          },
        });
        await prisma.leadActivity.create({
          data: {
            leadId: createdLead.id,
            performedById: l.assignedToId || adminUser.id,
            activityType: 'STATUS_CHANGE',
            notes: `Status transitioned to ${l.status}`,
          },
        });
      }

      if (l.assignedToId) {
        await prisma.leadAssignment.create({
          data: {
            leadId: createdLead.id,
            assignedFrom: adminUser.id,
            assignedTo: l.assignedToId,
          },
        });
      }
    }
  }
  console.log(`✅ Sample Leads & Timelines seeded.`);

  // 12. Sample Customers & Customer 360 Records
  const sampleCustomer = await prisma.customer.upsert({
    where: { organizationId_mobile: { organizationId: org.id, mobile: '9822003344' } },
    update: {},
    create: {
      organizationId: org.id,
      branchId: branches['HO'],
      customerType: 'BUSINESS',
      firstName: 'Arjun',
      lastName: 'Kapoor',
      email: 'arjun@kapoorenterprises.com',
      mobile: '9822003344',
      companyName: 'Kapoor Global Exports Private Limited',
      pan: 'AABCK1234D',
      gstin: '07AABCK1234D1Z8',
      status: 'ACTIVE',
    },
  });

  await prisma.customerAddress.createMany({
    data: [
      {
        customerId: sampleCustomer.id,
        type: 'REGISTERED',
        addressLine1: 'Plot 45, Okhla Industrial Area Phase III',
        addressLine2: 'Near Crown Plaza',
        city: 'New Delhi',
        state: 'Delhi',
        country: 'India',
        pincode: '110020',
      },
      {
        customerId: sampleCustomer.id,
        type: 'BILLING',
        addressLine1: 'Corporate Tower B, 8th Floor, Express Trade Towers',
        city: 'Noida',
        state: 'Uttar Pradesh',
        country: 'India',
        pincode: '201301',
      },
    ],
    skipDuplicates: true,
  });

  await prisma.customerContact.createMany({
    data: [
      {
        customerId: sampleCustomer.id,
        name: 'Arjun Kapoor',
        mobile: '9822003344',
        email: 'arjun@kapoorenterprises.com',
        designation: 'Director & CEO',
      },
      {
        customerId: sampleCustomer.id,
        name: 'Meenakshi Sundaram',
        mobile: '9822003355',
        email: 'meenakshi@kapoorenterprises.com',
        designation: 'Chief Financial Officer',
      },
    ],
    skipDuplicates: true,
  });
  console.log(`✅ Sample Customer 360 records seeded (Kapoor Global Exports).`);

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
