import { NotificationChannel, NotificationEventType } from '@cc/types';

export interface CompiledTemplate {
  subject?: string;
  body: string;
  html?: string;
  templateId?: string;
  templateData?: Record<string, any>;
}

export function compileNotificationTemplate(
  eventType: NotificationEventType | string,
  channel: NotificationChannel,
  data: Record<string, any> = {},
): CompiledTemplate {
  const customerName = data.customerName || data.name || 'Valued Customer';
  const appNumber = data.applicationNumber || data.caseNumber || 'CC-2026';
  const invoiceNumber = data.invoiceNumber || 'INV-2026';
  const serviceName = data.serviceName || 'Professional Service';
  const amount = data.amount !== undefined ? `₹${Number(data.amount).toLocaleString('en-IN')}` : '₹0';

  // Helper for branded HTML email wrapper
  const wrapHtmlEmail = (title: string, headline: string, bodyContentHtml: string, actionButtonHtml?: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #334155; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
    .brand { font-size: 20px; font-weight: 800; letter-spacing: 0.5px; margin-bottom: 8px; color: #fbbf24; }
    .content { padding: 32px 24px; font-size: 14px; line-height: 1.6; color: #334155; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .btn { display: inline-block; background: #4f46e5; color: #ffffff !important; font-weight: 600; padding: 12px 28px; border-radius: 8px; text-decoration: none; margin-top: 16px; }
    .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">CRAZY CAPITAL</div>
      <h2 style="margin:0; font-size:18px; font-weight:600;">${headline}</h2>
    </div>
    <div class="content">
      <p>Dear <strong>${customerName}</strong>,</p>
      ${bodyContentHtml}
      ${actionButtonHtml || ''}
    </div>
    <div class="footer">
      <p>Crazy Capital Financial & Corporate Advisory Pvt Ltd<br>Noida Electronic City, Uttar Pradesh 201309</p>
      <p style="margin:0; color:#94a3b8;">This is an automated system notification. Please do not reply directly to this email.</p>
    </div>
  </div>
</body>
</html>
  `;

  switch (eventType) {
    case 'invoice.created':
    case 'invoice.sent': {
      const subject = `Invoice ${invoiceNumber} from Crazy Capital for ${serviceName}`;
      const body = `Dear ${customerName}, your tax invoice ${invoiceNumber} for ${serviceName} (${amount}) has been generated. Please review and complete payment to proceed with your filing.`;
      const html = wrapHtmlEmail(
        `Invoice ${invoiceNumber}`,
        `Tax Invoice Generated — ${invoiceNumber}`,
        `
        <p>Your official GST tax invoice for <strong>${serviceName}</strong> has been generated and is ready for payment.</p>
        <div class="card">
          <table style="width:100%; font-size:13px;">
            <tr><td><strong>Invoice Number:</strong></td><td style="text-align:right; font-family:monospace;">${invoiceNumber}</td></tr>
            <tr><td><strong>Service:</strong></td><td style="text-align:right;">${serviceName}</td></tr>
            <tr><td><strong>Total Amount:</strong></td><td style="text-align:right; font-weight:bold; color:#4f46e5; font-size:16px;">${amount}</td></tr>
          </table>
        </div>
        <p>Kindly settle the invoice to unlock the next processing stage.</p>
        `,
        `<div style="text-align:center;"><a href="https://crazycapital.in/invoices" class="btn">View & Pay Invoice</a></div>`,
      );
      return {
        subject,
        body,
        html,
        templateId: 'crazy_capital_invoice_sent',
        templateData: { customerName, invoiceNumber, amount, serviceName },
      };
    }

    case 'payment.captured': {
      const subject = `Payment Confirmed: ${invoiceNumber} (Crazy Capital)`;
      const body = `Dear ${customerName}, we have received your payment of ${amount} for invoice ${invoiceNumber}. Thank you for choosing Crazy Capital!`;
      const html = wrapHtmlEmail(
        `Payment Receipt — ${invoiceNumber}`,
        `Payment Successful & Reconciled!`,
        `
        <p>We are pleased to confirm that your payment for invoice <strong>${invoiceNumber}</strong> has been successfully received and verified.</p>
        <div class="card" style="background:#ecfdf5; border-color:#a7f3d0;">
          <table style="width:100%; font-size:13px; color:#065f46;">
            <tr><td><strong>Invoice Ref:</strong></td><td style="text-align:right; font-family:monospace;">${invoiceNumber}</td></tr>
            <tr><td><strong>Amount Paid:</strong></td><td style="text-align:right; font-weight:bold; font-size:16px;">${amount}</td></tr>
            <tr><td><strong>Gateway Ref:</strong></td><td style="text-align:right; font-family:monospace;">${data.gatewayReference || 'CAPTURED'}</td></tr>
            <tr><td><strong>Status:</strong></td><td style="text-align:right; font-weight:bold;">SETTLED</td></tr>
          </table>
        </div>
        <p>Our operations team has been notified and your service application is moving to the next processing stage immediately.</p>
        `,
        `<div style="text-align:center;"><a href="https://crazycapital.in/invoices" class="btn" style="background:#059669;">Download Tax Receipt</a></div>`,
      );
      return {
        subject,
        body,
        html,
        templateId: 'crazy_capital_payment_receipt',
        templateData: { customerName, invoiceNumber, amount },
      };
    }

    case 'payment.failed': {
      const subject = `Action Required: Payment Failed for ${invoiceNumber}`;
      const body = `Dear ${customerName}, your payment attempt of ${amount} for invoice ${invoiceNumber} could not be processed. Please retry using another payment method.`;
      const html = wrapHtmlEmail(
        `Payment Failed — ${invoiceNumber}`,
        `Payment Attempt Unsuccessful`,
        `
        <p>Your recent payment attempt of <strong>${amount}</strong> for invoice <strong>${invoiceNumber}</strong> was not completed.</p>
        <div class="card" style="background:#fef2f2; border-color:#fecaca;">
          <p style="margin:0; color:#991b1b; font-size:13px;">Reason: ${data.errorMessage || 'Transaction cancelled or declined by issuing bank.'}</p>
        </div>
        <p>No funds were debited. Please retry your payment using UPI, NetBanking, or a different card.</p>
        `,
        `<div style="text-align:center;"><a href="https://crazycapital.in/invoices" class="btn" style="background:#dc2626;">Retry Payment</a></div>`,
      );
      return {
        subject,
        body,
        html,
        templateId: 'crazy_capital_payment_failed',
        templateData: { customerName, invoiceNumber, amount },
      };
    }

    case 'workflow.stage_changed': {
      const stageName = data.stageName || data.toStageName || 'In Progress';
      const subject = `Application Update: ${appNumber} moved to ${stageName}`;
      const body = `Dear ${customerName}, your application ${appNumber} (${serviceName}) has advanced to stage: "${stageName}".`;
      const html = wrapHtmlEmail(
        `Application Update — ${appNumber}`,
        `Application Status Update`,
        `
        <p>Your application for <strong>${serviceName}</strong> has made progress!</p>
        <div class="card">
          <table style="width:100%; font-size:13px;">
            <tr><td><strong>Case Number:</strong></td><td style="text-align:right; font-family:monospace;">${appNumber}</td></tr>
            <tr><td><strong>Current Stage:</strong></td><td style="text-align:right; font-weight:bold; color:#4f46e5;">${stageName}</td></tr>
            <tr><td><strong>Service:</strong></td><td style="text-align:right;">${serviceName}</td></tr>
          </table>
        </div>
        <p>Our dedicated operations team is actively working on the documentation and government filing.</p>
        `,
        `<div style="text-align:center;"><a href="https://crazycapital.in/applications" class="btn">Track Application Progress</a></div>`,
      );
      return {
        subject,
        body,
        html,
        templateId: 'crazy_capital_stage_update',
        templateData: { customerName, appNumber, stageName, serviceName },
      };
    }

    case 'document.verified': {
      const docName = data.documentTypeName || data.fileName || 'KYC Document';
      const subject = `Document Approved: ${docName} (${appNumber})`;
      const body = `Dear ${customerName}, your document "${docName}" for application ${appNumber} has been verified and approved.`;
      const html = wrapHtmlEmail(
        `Document Approved — ${appNumber}`,
        `Document Verified & Approved`,
        `
        <p>We are pleased to inform you that your document <strong>${docName}</strong> for application <strong>${appNumber}</strong> has been successfully reviewed and verified by our compliance team.</p>
        `,
        `<div style="text-align:center;"><a href="https://crazycapital.in/documents" class="btn">View Document Vault</a></div>`,
      );
      return {
        subject,
        body,
        html,
        templateId: 'crazy_capital_doc_verified',
        templateData: { customerName, docName, appNumber },
      };
    }

    case 'document.rejected': {
      const docName = data.documentTypeName || data.fileName || 'KYC Document';
      const remarks = data.remarks || 'Document image is blurred or expired.';
      const subject = `Action Required: Document Resubmission for ${appNumber}`;
      const body = `Dear ${customerName}, your document "${docName}" requires resubmission. Reason: ${remarks}. Please upload a clear copy.`;
      const html = wrapHtmlEmail(
        `Document Action Required — ${appNumber}`,
        `Document Resubmission Required`,
        `
        <p>During compliance verification for application <strong>${appNumber}</strong>, our team identified an issue with <strong>${docName}</strong>:</p>
        <div class="card" style="background:#fffbeb; border-color:#fde68a;">
          <p style="margin:0; color:#92400e; font-size:13px;"><strong>Reason for Rejection:</strong> ${remarks}</p>
        </div>
        <p>Please upload a clear, valid document through your Document Vault to avoid filing delays.</p>
        `,
        `<div style="text-align:center;"><a href="https://crazycapital.in/documents" class="btn" style="background:#d97706;">Re-upload Document</a></div>`,
      );
      return {
        subject,
        body,
        html,
        templateId: 'crazy_capital_doc_rejected',
        templateData: { customerName, docName, remarks, appNumber },
      };
    }

    case 'lead.assigned': {
      const leadName = data.leadName || 'New Prospect';
      const phone = data.phone || data.mobile || 'N/A';
      const subject = `New Lead Assigned: ${leadName} (${serviceName})`;
      const body = `Hello ${customerName}, a new lead "${leadName}" (${phone}) for "${serviceName}" has been assigned to you.`;
      const html = wrapHtmlEmail(
        `New Lead Assigned`,
        `New CRM Lead Assigned to You`,
        `
        <p>You have been assigned a new prospect in the Crazy Capital CRM:</p>
        <div class="card">
          <table style="width:100%; font-size:13px;">
            <tr><td><strong>Lead Name:</strong></td><td style="text-align:right; font-weight:bold;">${leadName}</td></tr>
            <tr><td><strong>Contact:</strong></td><td style="text-align:right;">${phone}</td></tr>
            <tr><td><strong>Service Interest:</strong></td><td style="text-align:right;">${serviceName}</td></tr>
          </table>
        </div>
        `,
        `<div style="text-align:center;"><a href="https://admin.crazycapital.in/leads" class="btn">Open Lead in CRM</a></div>`,
      );
      return {
        subject,
        body,
        html,
        templateId: 'crazy_capital_lead_assigned',
        templateData: { customerName, leadName, phone, serviceName },
      };
    }

    case 'auth.otp': {
      const otpCode = data.otpCode || '123456';
      const subject = `Your Crazy Capital Verification Code: ${otpCode}`;
      const body = `Your Crazy Capital OTP is ${otpCode}. Valid for 10 minutes. Do not share this code with anyone.`;
      const html = wrapHtmlEmail(
        `Verification Code`,
        `Your Login Verification Code`,
        `
        <p>Please use the following One-Time Password (OTP) to complete your verification:</p>
        <div style="text-align:center; margin:24px 0;">
          <div style="display:inline-block; font-size:32px; font-weight:800; letter-spacing:6px; color:#4f46e5; background:#eef2ff; border:2px dashed #6366f1; border-radius:12px; padding:12px 32px;">${otpCode}</div>
        </div>
        <p style="color:#64748b; font-size:12px; text-align:center;">This code will expire in 10 minutes.</p>
        `,
      );
      return {
        subject,
        body,
        html,
        templateId: 'crazy_capital_otp',
        templateData: { otpCode },
      };
    }

    case 'test.dispatch':
    default: {
      const customMsg = data.customMessage || 'This is a test notification from the Crazy Capital Dispatch Matrix.';
      const subject = data.subject || 'Crazy Capital Staging Test Notification';
      const body = `Crazy Capital Test Dispatch (${channel}): ${customMsg}`;
      const html = wrapHtmlEmail(
        `Staging Test Dispatch`,
        `Staging Notification Matrix Test`,
        `
        <p>This is a synthetic test message dispatched from the Crazy Capital Notification Matrix.</p>
        <div class="card">
          <p style="margin:0; font-family:monospace; font-size:13px;">${customMsg}</p>
        </div>
        <p>Timestamp: ${new Date().toISOString()}</p>
        `,
      );
      return {
        subject,
        body,
        html,
        templateId: 'crazy_capital_generic_alert',
        templateData: { message: customMsg },
      };
    }
  }
}
