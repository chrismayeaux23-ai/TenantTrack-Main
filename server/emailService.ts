import { Resend } from 'resend';

// Replit Resend connector — fetches API key from connector service
async function getResendClient(): Promise<{ client: Resend; fromEmail: string } | null> {
  try {
    const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
    const xReplitToken = process.env.REPL_IDENTITY
      ? 'repl ' + process.env.REPL_IDENTITY
      : process.env.WEB_REPL_RENEWAL
      ? 'depl ' + process.env.WEB_REPL_RENEWAL
      : null;

    if (!hostname || !xReplitToken) {
      // Fallback to manual API key env var
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) return null;
      return {
        client: new Resend(apiKey),
        fromEmail: process.env.EMAIL_FROM || 'TenantTrack Dispatch <dispatch@tenant-track.com>',
      };
    }

    const data = await fetch(
      `https://${hostname}/api/v2/connection?include_secrets=true&connector_names=resend`,
      {
        headers: {
          Accept: 'application/json',
          'X-Replit-Token': xReplitToken,
        },
      }
    ).then(res => res.json()).then((d: any) => d.items?.[0]);

    if (!data?.settings?.api_key) return null;

    return {
      client: new Resend(data.settings.api_key),
      fromEmail: data.settings.from_email || process.env.EMAIL_FROM || 'TenantTrack <notifications@tenant-track.com>',
    };
  } catch (err) {
    console.error('Failed to get Resend client:', err);
    return null;
  }
}

const APP_URL = process.env.APP_URL || 'https://www.tenant-track.com';

export async function sendNewRequestEmail(opts: {
  landlordEmail: string;
  landlordName: string;
  tenantName: string;
  propertyName: string;
  unitNumber: string;
  issueType: string;
  urgency: string;
  description: string;
  trackingCode: string;
}) {
  const resend = await getResendClient();
  if (!resend) return;
  try {
    await resend.client.emails.send({
      from: resend.fromEmail,
      to: opts.landlordEmail,
      subject: `🔔 New ${opts.urgency} request: ${opts.issueType} at ${opts.propertyName} Unit ${opts.unitNumber}`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#0f1a12;color:#f0faf2;padding:32px;border-radius:12px">
          <h2 style="color:#4ade80;margin-top:0">New Maintenance Request</h2>
          <p>Hi ${opts.landlordName},</p>
          <p>A tenant submitted a new maintenance request through TenantTrack.</p>
          <table style="width:100%;border-collapse:collapse;margin:20px 0">
            <tr><td style="padding:8px;color:#94a3b8;width:140px">Property</td><td style="padding:8px;color:#f0faf2">${opts.propertyName}</td></tr>
            <tr style="background:#1a2e1e"><td style="padding:8px;color:#94a3b8">Unit</td><td style="padding:8px;color:#f0faf2">${opts.unitNumber}</td></tr>
            <tr><td style="padding:8px;color:#94a3b8">Tenant</td><td style="padding:8px;color:#f0faf2">${opts.tenantName}</td></tr>
            <tr style="background:#1a2e1e"><td style="padding:8px;color:#94a3b8">Issue</td><td style="padding:8px;color:#f0faf2">${opts.issueType}</td></tr>
            <tr><td style="padding:8px;color:#94a3b8">Urgency</td><td style="padding:8px;color:${opts.urgency === 'Emergency' ? '#f87171' : opts.urgency === 'High' ? '#fb923c' : '#4ade80'}">${opts.urgency}</td></tr>
            <tr style="background:#1a2e1e"><td style="padding:8px;color:#94a3b8;vertical-align:top">Description</td><td style="padding:8px;color:#f0faf2">${opts.description}</td></tr>
          </table>
          <p style="color:#94a3b8;font-size:13px">Tracking code: <strong style="color:#4ade80">${opts.trackingCode}</strong></p>
          <a href="${APP_URL}" style="display:inline-block;background:#22c55e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:8px">View in Dashboard →</a>
          <p style="color:#4b5563;font-size:12px;margin-top:24px">You're receiving this because you're a TenantTrack landlord.</p>
        </div>
      `,
    });
    console.log(`New request email sent to ${opts.landlordEmail}`);
  } catch (err) {
    console.error('Failed to send new request email:', err);
  }
}

export async function sendStatusUpdateEmail(opts: {
  tenantEmail: string;
  tenantName: string;
  propertyName: string;
  unitNumber: string;
  issueType: string;
  newStatus: string;
  trackingCode: string;
}) {
  const resend = await getResendClient();
  if (!resend) return;
  const statusColor = opts.newStatus === 'Completed' ? '#4ade80' : opts.newStatus === 'In-Progress' ? '#facc15' : '#94a3b8';
  try {
    await resend.client.emails.send({
      from: resend.fromEmail,
      to: opts.tenantEmail,
      subject: `Update on your maintenance request — ${opts.newStatus}`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#0f1a12;color:#f0faf2;padding:32px;border-radius:12px">
          <h2 style="color:#4ade80;margin-top:0">Request Status Update</h2>
          <p>Hi ${opts.tenantName},</p>
          <p>Your maintenance request has been updated.</p>
          <table style="width:100%;border-collapse:collapse;margin:20px 0">
            <tr><td style="padding:8px;color:#94a3b8;width:140px">Property</td><td style="padding:8px;color:#f0faf2">${opts.propertyName}</td></tr>
            <tr style="background:#1a2e1e"><td style="padding:8px;color:#94a3b8">Unit</td><td style="padding:8px;color:#f0faf2">${opts.unitNumber}</td></tr>
            <tr><td style="padding:8px;color:#94a3b8">Issue</td><td style="padding:8px;color:#f0faf2">${opts.issueType}</td></tr>
            <tr style="background:#1a2e1e"><td style="padding:8px;color:#94a3b8">New Status</td><td style="padding:8px;color:${statusColor};font-weight:600">${opts.newStatus}</td></tr>
          </table>
          <p style="color:#94a3b8;font-size:13px">Tracking code: <strong style="color:#4ade80">${opts.trackingCode}</strong></p>
          <a href="${APP_URL}/track/${opts.trackingCode}" style="display:inline-block;background:#22c55e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:8px">Track Your Request →</a>
          <p style="color:#4b5563;font-size:12px;margin-top:24px">No account needed — use your tracking code to view updates anytime.</p>
        </div>
      `,
    });
    console.log(`Status update email sent to ${opts.tenantEmail}`);
  } catch (err) {
    console.error('Failed to send status update email:', err);
  }
}

export async function sendStaffAssignmentEmail(opts: {
  staffEmail: string;
  staffName: string;
  propertyName: string;
  unitNumber: string;
  issueType: string;
  urgency: string;
  description: string;
  tenantName: string;
  tenantPhone: string;
}) {
  const resend = await getResendClient();
  if (!resend) return;
  try {
    await resend.client.emails.send({
      from: resend.fromEmail,
      to: opts.staffEmail,
      subject: `🔧 Assigned: ${opts.issueType} at ${opts.propertyName} Unit ${opts.unitNumber}`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#0f1a12;color:#f0faf2;padding:32px;border-radius:12px">
          <h2 style="color:#4ade80;margin-top:0">Maintenance Request Assigned</h2>
          <p>Hi ${opts.staffName},</p>
          <p>A maintenance request has been assigned to you.</p>
          <table style="width:100%;border-collapse:collapse;margin:20px 0">
            <tr><td style="padding:8px;color:#94a3b8;width:140px">Property</td><td style="padding:8px;color:#f0faf2">${opts.propertyName}</td></tr>
            <tr style="background:#1a2e1e"><td style="padding:8px;color:#94a3b8">Unit</td><td style="padding:8px;color:#f0faf2">${opts.unitNumber}</td></tr>
            <tr><td style="padding:8px;color:#94a3b8">Issue</td><td style="padding:8px;color:#f0faf2">${opts.issueType}</td></tr>
            <tr style="background:#1a2e1e"><td style="padding:8px;color:#94a3b8">Urgency</td><td style="padding:8px;color:${opts.urgency === 'Emergency' ? '#f87171' : opts.urgency === 'High' ? '#fb923c' : '#4ade80'}">${opts.urgency}</td></tr>
            <tr><td style="padding:8px;color:#94a3b8;vertical-align:top">Description</td><td style="padding:8px;color:#f0faf2">${opts.description}</td></tr>
            <tr style="background:#1a2e1e"><td style="padding:8px;color:#94a3b8">Tenant</td><td style="padding:8px;color:#f0faf2">${opts.tenantName} — ${opts.tenantPhone}</td></tr>
          </table>
          <a href="${APP_URL}" style="display:inline-block;background:#22c55e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:8px">View Details →</a>
        </div>
      `,
    });
    console.log(`Staff assignment email sent to ${opts.staffEmail}`);
  } catch (err) {
    console.error('Failed to send staff assignment email:', err);
  }
}

export async function sendVendorDispatchEmail(opts: {
  vendorEmail: string;
  vendorName: string;
  propertyName: string;
  unitNumber: string;
  issueType: string;
  urgency: string;
  description: string;
  magicToken: string;
}) {
  const resend = await getResendClient();
  if (!resend) return;
  const portalUrl = `${APP_URL}/vendor-portal/${opts.magicToken}`;
  try {
    await resend.client.emails.send({
      from: resend.fromEmail,
      to: opts.vendorEmail,
      subject: `🔧 New Job Assignment: ${opts.issueType} at ${opts.propertyName} Unit ${opts.unitNumber}`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#0d1117;color:#e6edf3;padding:32px;border-radius:12px">
          <h2 style="color:#f97316;margin-top:0">New Job Assignment</h2>
          <p>Hi ${opts.vendorName},</p>
          <p>You've been assigned a new maintenance job through TenantTrack.</p>
          <table style="width:100%;border-collapse:collapse;margin:20px 0">
            <tr><td style="padding:8px;color:#8b949e;width:140px">Property</td><td style="padding:8px;color:#e6edf3">${opts.propertyName}</td></tr>
            <tr style="background:#161b22"><td style="padding:8px;color:#8b949e">Unit</td><td style="padding:8px;color:#e6edf3">${opts.unitNumber}</td></tr>
            <tr><td style="padding:8px;color:#8b949e">Issue</td><td style="padding:8px;color:#e6edf3">${opts.issueType}</td></tr>
            <tr style="background:#161b22"><td style="padding:8px;color:#8b949e">Urgency</td><td style="padding:8px;color:${opts.urgency === 'Emergency' ? '#f87171' : opts.urgency === 'High' ? '#fb923c' : '#4ade80'}">${opts.urgency}</td></tr>
            <tr><td style="padding:8px;color:#8b949e;vertical-align:top">Description</td><td style="padding:8px;color:#e6edf3">${opts.description}</td></tr>
          </table>
          <p style="color:#8b949e;font-size:14px;margin-bottom:16px">Please respond to this job by clicking the button below:</p>
          <a href="${portalUrl}" style="display:inline-block;background:#f97316;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600">View & Respond to Job →</a>
          <p style="color:#484f58;font-size:12px;margin-top:24px">This link is unique to you. Do not share it.</p>
        </div>
      `,
    });
    console.log(`Vendor dispatch email sent to ${opts.vendorEmail}`);
  } catch (err) {
    console.error('Failed to send vendor dispatch email:', err);
  }
}

export async function sendVendorReminderEmail(opts: {
  vendorEmail: string;
  vendorName: string;
  propertyName: string;
  unitNumber: string;
  issueType: string;
  scheduledDate: string;
  magicToken: string;
}) {
  const resend = await getResendClient();
  if (!resend) return;
  const portalUrl = `${APP_URL}/vendor-portal/${opts.magicToken}`;
  try {
    await resend.client.emails.send({
      from: resend.fromEmail,
      to: opts.vendorEmail,
      subject: `⏰ Reminder: ${opts.issueType} job at ${opts.propertyName} — ${opts.scheduledDate}`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#0d1117;color:#e6edf3;padding:32px;border-radius:12px">
          <h2 style="color:#f97316;margin-top:0">Job Reminder</h2>
          <p>Hi ${opts.vendorName},</p>
          <p>This is a reminder about your upcoming maintenance job.</p>
          <table style="width:100%;border-collapse:collapse;margin:20px 0">
            <tr><td style="padding:8px;color:#8b949e;width:140px">Property</td><td style="padding:8px;color:#e6edf3">${opts.propertyName}</td></tr>
            <tr style="background:#161b22"><td style="padding:8px;color:#8b949e">Unit</td><td style="padding:8px;color:#e6edf3">${opts.unitNumber}</td></tr>
            <tr><td style="padding:8px;color:#8b949e">Issue</td><td style="padding:8px;color:#e6edf3">${opts.issueType}</td></tr>
            <tr style="background:#161b22"><td style="padding:8px;color:#8b949e">Scheduled</td><td style="padding:8px;color:#f97316;font-weight:600">${opts.scheduledDate}</td></tr>
          </table>
          <a href="${portalUrl}" style="display:inline-block;background:#f97316;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600">View Job Details →</a>
        </div>
      `,
    });
    console.log(`Vendor reminder email sent to ${opts.vendorEmail}`);
  } catch (err) {
    console.error('Failed to send vendor reminder email:', err);
  }
}

export async function sendTenantVendorScheduledEmail(opts: {
  tenantEmail: string;
  tenantName: string;
  propertyName: string;
  unitNumber: string;
  issueType: string;
  vendorName: string;
  scheduledDate: string;
  trackingCode: string;
}) {
  const resend = await getResendClient();
  if (!resend) return;
  try {
    await resend.client.emails.send({
      from: resend.fromEmail,
      to: opts.tenantEmail,
      subject: `✅ Vendor scheduled for your ${opts.issueType} request`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#0d1117;color:#e6edf3;padding:32px;border-radius:12px">
          <h2 style="color:#4ade80;margin-top:0">Vendor Scheduled</h2>
          <p>Hi ${opts.tenantName},</p>
          <p>A vendor has been scheduled for your maintenance request.</p>
          <table style="width:100%;border-collapse:collapse;margin:20px 0">
            <tr><td style="padding:8px;color:#8b949e;width:140px">Property</td><td style="padding:8px;color:#e6edf3">${opts.propertyName}</td></tr>
            <tr style="background:#161b22"><td style="padding:8px;color:#8b949e">Unit</td><td style="padding:8px;color:#e6edf3">${opts.unitNumber}</td></tr>
            <tr><td style="padding:8px;color:#8b949e">Issue</td><td style="padding:8px;color:#e6edf3">${opts.issueType}</td></tr>
            <tr style="background:#161b22"><td style="padding:8px;color:#8b949e">Vendor</td><td style="padding:8px;color:#e6edf3">${opts.vendorName}</td></tr>
            <tr><td style="padding:8px;color:#8b949e">Scheduled</td><td style="padding:8px;color:#4ade80;font-weight:600">${opts.scheduledDate}</td></tr>
          </table>
          <a href="${APP_URL}/track/${opts.trackingCode}" style="display:inline-block;background:#22c55e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Track Your Request →</a>
          <p style="color:#484f58;font-size:12px;margin-top:24px">No account needed — use your tracking code to view updates anytime.</p>
        </div>
      `,
    });
    console.log(`Tenant vendor scheduled email sent to ${opts.tenantEmail}`);
  } catch (err) {
    console.error('Failed to send tenant vendor scheduled email:', err);
  }
}

export async function sendLandlordAlertEmail(opts: {
  landlordEmail: string;
  alertType: string;
  requestId: number;
  vendorName: string;
  message: string;
}) {
  const resend = await getResendClient();
  if (!resend) return;
  const alertColor = opts.alertType.includes('decline') || opts.alertType.includes('no-response') ? '#f87171' : '#fb923c';
  try {
    await resend.client.emails.send({
      from: resend.fromEmail,
      to: opts.landlordEmail,
      subject: `⚠️ Dispatch Alert: ${opts.vendorName} — ${opts.alertType.replace(/-/g, ' ')}`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#0d1117;color:#e6edf3;padding:32px;border-radius:12px">
          <h2 style="color:${alertColor};margin-top:0">Dispatch Alert</h2>
          <p>${opts.message}</p>
          <p style="color:#8b949e;font-size:13px">Request #${opts.requestId}</p>
          <a href="${APP_URL}" style="display:inline-block;background:#f97316;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:12px">View in Dashboard →</a>
        </div>
      `,
    });
    console.log(`Landlord alert email sent to ${opts.landlordEmail}`);
  } catch (err) {
    console.error('Failed to send landlord alert email:', err);
  }
}
