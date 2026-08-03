const http = require('http');

const CONFIG = {
  orgId: 'd6b9ea2a-7e1e-4b9a-9e1e-5a0a38d7b384',
  services: {
    organization: { host: process.env.SEED_ORG_HOST || 'localhost', port: 7010 },
    booking: { host: process.env.SEED_BOOKING_HOST || 'localhost', port: 7040 },
    realtime: { host: process.env.SEED_REALTIME_HOST || 'localhost', port: Number(process.env.SEED_REALTIME_PORT || 7030) },
    emailSync: { host: process.env.SEED_EMAIL_SYNC_HOST || 'localhost', port: 7160 },
    integrations: { host: process.env.SEED_INTEGRATIONS_HOST || 'localhost', port: 7140 },
    odoo: { host: process.env.SEED_ODOO_HOST || 'localhost', port: 7200 },
  },
  keycloak: {
    url: process.env.KEYCLOAK_URL || 'http://keycloak:8080',
    adminUser: process.env.KEYCLOAK_ADMIN || 'admin',
    adminPass: process.env.KEYCLOAK_PASS || 'admin',
    realm: 'mymanager',
  },
  users: [
    {
      username: 'org-owner',
      role: 'org_owner',
      email: 'owner@example.com',
      displayName: 'Olivia Grant',
      title: 'Founder & CEO',
    },
    {
      username: 'org-admin',
      role: 'org_admin',
      email: 'admin@example.com',
      displayName: 'Ava Chen',
      title: 'Operations Director',
    },
    {
      username: 'org-staff',
      role: 'org_staff',
      email: 'staff@example.com',
      displayName: 'Noah Patel',
      title: 'Customer Success Lead',
    },
    {
      username: 'org-viewer',
      role: 'org_viewer',
      email: 'viewer@example.com',
      displayName: 'Mia Torres',
      title: 'Executive Analyst',
    },
  ],
};

const REQUEST_TIMEOUT_MS = 5000;

const DEMO = {
  organization: {
    name: 'Northstar Industrial Demo',
    email: 'hello@northstar-demo.com',
    phone: '+1-555-0100',
    address: '450 Market Street, Suite 900, San Francisco, CA',
    website: 'https://northstar-demo.example',
    timezone: 'America/New_York',
    branding: {
      logo: 'https://images.example.com/northstar/logo.png',
      primaryColor: '#0f172a',
      secondaryColor: '#f97316',
      accentColor: '#14b8a6',
    },
  },
  crm: {
    teams: [
      {
        key: 'sales',
        name: 'Sales',
        description: 'Enterprise and mid-market revenue team.',
        members: ['org-owner', 'org-admin'],
      },
      {
        key: 'support',
        name: 'Support',
        description: 'Customer support and service desk.',
        members: ['org-staff'],
      },
      {
        key: 'ops',
        name: 'Operations',
        description: 'Internal delivery, logistics, and fulfillment.',
        members: ['org-admin', 'org-viewer'],
      },
    ],
    pipelines: [
      {
        key: 'enterprise',
        name: 'Enterprise Sales',
        description: 'Long-cycle deals with multiple stakeholders.',
        stages: [
          { key: 'discovery', name: 'Discovery', probability: 15, color: '#94a3b8' },
          { key: 'proposal', name: 'Proposal', probability: 45, color: '#38bdf8' },
          { key: 'negotiation', name: 'Negotiation', probability: 70, color: '#f59e0b' },
          { key: 'closed_won', name: 'Closed Won', probability: 100, color: '#22c55e' },
        ],
      },
      {
        key: 'retail',
        name: 'Retail Growth',
        description: 'Faster-moving opportunities and partner deals.',
        stages: [
          { key: 'qualified', name: 'Qualified', probability: 20, color: '#60a5fa' },
          { key: 'demo', name: 'Demo', probability: 50, color: '#a855f7' },
          { key: 'closed_won', name: 'Closed Won', probability: 100, color: '#16a34a' },
        ],
      },
    ],
    customFields: [
      { key: 'industry', name: 'Industry', entity: 'contact', type: 'select', options: ['Manufacturing', 'SaaS', 'Retail'] },
      { key: 'arr', name: 'Annual Recurring Revenue', entity: 'lead', type: 'number' },
      { key: 'pipeline_priority', name: 'Pipeline Priority', entity: 'lead', type: 'select', options: ['High', 'Medium', 'Low'] },
    ],
    automationRules: [
      { key: 'new_high_value_lead', name: 'Notify on high value lead', trigger: 'lead.created', action: 'slack.notification' },
      { key: 'stale_opportunity', name: 'Escalate stale opportunity', trigger: 'lead.stale', action: 'email.followup' },
    ],
  },
  locations: [
    {
      name: 'Northstar HQ',
      email: 'hq@northstar-demo.com',
      phone: '+1-555-0101',
      street: '450 Market Street',
      city: 'San Francisco',
      state: 'CA',
      zip_code: '94105',
      country: 'USA',
    },
    {
      name: 'East Coast Fulfillment',
      email: 'east@northstar-demo.com',
      phone: '+1-555-0102',
      street: '88 Harbor Road',
      city: 'Jersey City',
      state: 'NJ',
      zip_code: '07302',
      country: 'USA',
    },
    {
      name: 'Remote Support Hub',
      email: 'support@northstar-demo.com',
      phone: '+1-555-0103',
      street: 'Remote-first',
      city: 'Austin',
      state: 'TX',
      zip_code: '73301',
      country: 'USA',
    },
  ],
  goals: [
    { user: 'org-owner', title: 'Close 3 enterprise deals', category: 'Revenue', progress: 78 },
    { user: 'org-admin', title: 'Launch onboarding automation', category: 'Operations', progress: 62 },
    { user: 'org-staff', title: 'Reduce first response time under 5 minutes', category: 'Support', progress: 84 },
    { user: 'org-viewer', title: 'Publish weekly executive dashboard', category: 'Analytics', progress: 41 },
  ],
  habits: [
    { user: 'org-owner', title: 'Morning pipeline review', momentum: ['2026-07-28', '2026-07-29', '2026-08-01'] },
    { user: 'org-admin', title: 'Daily operations standup', momentum: ['2026-07-28', '2026-07-30', '2026-08-02'] },
    { user: 'org-staff', title: 'End-of-day customer follow-up block', momentum: ['2026-07-27', '2026-07-29', '2026-08-01'] },
    { user: 'org-viewer', title: 'Weekly board review', momentum: ['2026-07-26', '2026-08-02'] },
  ],
  onboarding: [
    { user: 'org-owner', tourStepId: 'workspace', tourCompleted: true },
    { user: 'org-owner', tourStepId: 'crm', tourCompleted: true },
    { user: 'org-admin', tourStepId: 'workspace', tourCompleted: true },
    { user: 'org-staff', tourStepId: 'support', tourCompleted: false },
  ],
  bookingTypes: [
    {
      title: 'Executive Strategy Call',
      slug: 'executive-strategy-call',
      description: '60-minute strategy call for enterprise prospects.',
      durationMinutes: 60,
      bufferMinutes: 15,
      color: '#0f172a',
      price: 250,
      isActive: true,
      availabilities: [
        { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' },
      ],
    },
    {
      title: 'Product Demo',
      slug: 'product-demo',
      description: 'Fast demo for product evaluation and procurement teams.',
      durationMinutes: 30,
      bufferMinutes: 10,
      color: '#14b8a6',
      price: 0,
      isActive: true,
      availabilities: [
        { dayOfWeek: 1, startTime: '10:00', endTime: '16:00' },
        { dayOfWeek: 4, startTime: '10:00', endTime: '16:00' },
        { dayOfWeek: 5, startTime: '10:00', endTime: '14:00' },
      ],
    },
  ],
  appointments: [
    {
      bookingTypeSlug: 'executive-strategy-call',
      contactName: 'Acme Manufacturing',
      contactEmail: 'procurement@acme-manufacturing.com',
      startOffsetDays: 2,
      startTime: '10:00',
      notes: 'Discuss rollout scope, implementation timeline, and stakeholder map.',
      status: 'CONFIRMED',
    },
    {
      bookingTypeSlug: 'product-demo',
      contactName: 'Summit Retail Group',
      contactEmail: 'ops@summit-retail.com',
      startOffsetDays: 4,
      startTime: '14:30',
      notes: 'Walk through catalog sync and ecommerce fulfillment integration.',
      status: 'PENDING',
    },
    {
      bookingTypeSlug: 'executive-strategy-call',
      contactName: 'Brightline Logistics',
      contactEmail: 'sales@brightline-logistics.com',
      startOffsetDays: 6,
      startTime: '15:00',
      notes: 'Follow-up on proposal and security review.',
      status: 'PENDING',
    },
  ],
  email: {
    templates: [
      {
        key: 'welcome',
        name: 'Welcome Onboarding',
        subject: 'Welcome, {{firstName}}',
        body: '<p>Hi {{firstName}},</p><p>Welcome to Northstar. We are ready to get started.</p>',
        category: 'onboarding',
      },
      {
        key: 'demo_followup',
        name: 'Demo Follow-up',
        subject: 'Thanks for the demo, {{firstName}}',
        body: '<p>Hi {{firstName}},</p><p>Thanks for taking the time to review the demo. Here are the next steps.</p>',
        category: 'sales',
      },
      {
        key: 'support_update',
        name: 'Support Update',
        subject: 'Update on ticket {{ticketNumber}}',
        body: '<p>Hi {{firstName}},</p><p>Your support request is in progress and we will share an update shortly.</p>',
        category: 'support',
      },
    ],
    sequences: [
      {
        key: 'lead_nurture',
        name: 'Lead Nurture Sequence',
        description: 'Short sequence for warm enterprise leads.',
        steps: [
          { stepNumber: 1, type: 'email', delayDays: 0, templateKey: 'welcome' },
          { stepNumber: 2, type: 'email', delayDays: 2, templateKey: 'demo_followup' },
          { stepNumber: 3, type: 'task', delayDays: 4 },
        ],
      },
      {
        key: 'support_checkin',
        name: 'Support Check-in Sequence',
        description: 'Follow-up sequence for active support contacts.',
        steps: [
          { stepNumber: 1, type: 'email', delayDays: 0, templateKey: 'support_update' },
          { stepNumber: 2, type: 'wait', delayDays: 1 },
          { stepNumber: 3, type: 'task', delayDays: 2 },
        ],
      },
    ],
  },
  realtime: {
    widget: {
      widgetName: 'Northstar Demo Widget',
      primaryColor: '#0f172a',
      headerTitle: 'Talk to Northstar',
      greetingMessage: 'Hi, I am the Northstar demo assistant. How can I help?',
      offlineMessage: 'Leave a message and we will reply soon.',
      position: 'right',
      showPowerBy: false,
      enabled: true,
    },
    livechatContacts: [
      {
        name: 'Elena Brooks',
        email: 'elena@acme-manufacturing.com',
        phone: '+15550121',
        avatar: 'https://images.example.com/avatars/elena.png',
      },
      {
        name: 'Jordan Lee',
        email: 'jordan@summit-retail.com',
        phone: '+15550122',
        avatar: 'https://images.example.com/avatars/jordan.png',
      },
    ],
    inboxThreads: [
      {
        provider: 'whatsapp',
        contactMobile: '+15550121',
        contactName: 'Elena Brooks',
        messages: [
          'Hi, we need a rollout timeline for the enterprise package.',
          'We also want to confirm implementation support and training.',
        ],
        replies: [
          'Absolutely. I will send you a rollout summary today.',
        ],
      },
      {
        provider: 'telegram',
        contactMobile: '+15550122',
        contactName: 'Jordan Lee',
        messages: [
          'Can I see the onboarding checklist and integration steps?',
          'We are comparing your ecommerce and POS workflows.',
        ],
        replies: [
          'Yes. I have attached the checklist and demo notes.',
        ],
      },
    ],
  },
  integrations: {
    connections: [
      { provider: 'odoo', accessToken: 'odoo-access-token', refreshToken: 'odoo-refresh-token', accountName: 'Northstar Odoo' },
      { provider: 'google', accessToken: 'google-access-token', refreshToken: 'google-refresh-token', accountName: 'Northstar Google Workspace' },
      { provider: 'zoom', accessToken: 'zoom-access-token', refreshToken: 'zoom-refresh-token', accountName: 'Northstar Zoom' },
      { provider: 'shopify', accessToken: 'shopify-access-token', accountName: 'northstar-demo.myshopify.com' },
      { provider: 'meta', accessToken: 'meta-access-token', accountName: 'Northstar Meta' },
      { provider: 'whatsapp', accessToken: 'whatsapp-access-token', accountName: 'Northstar WhatsApp' },
      { provider: 'telegram', accessToken: 'telegram-access-token', accountName: 'Northstar Telegram' },
    ],
    google: { accessToken: 'google-access-token', refreshToken: 'google-refresh-token' },
    zoom: { accessToken: 'zoom-access-token', refreshToken: 'zoom-refresh-token', accountId: 'acct-northstar-zoom' },
    shopify: { shopDomain: 'northstar-demo.myshopify.com', accessToken: 'shopify-access-token', scope: 'read_products,write_products' },
    facebook: { accessToken: 'fb-access-token', pageId: 'northstar-demo-page', pageName: 'Northstar Industrial' },
    instagram: { accessToken: 'ig-access-token', accountId: 'northstar-demo-ig' },
    linkedin: { accessToken: 'linkedin-access-token', companyId: 'northstar-company' },
    tiktok: { accessToken: 'tiktok-access-token', openId: 'northstar-open-id' },
    meta: { wabaId: 'waba-001', accessToken: 'meta-access-token', businessPhoneNumberId: 'phone-001', appId: 'app-001', loginType: 'manual' },
    voice: { provider: 'elevenlabs', apiKey: 'voice-api-key', voiceId: 'voice-demo', settings: { speed: 1, stability: 0.7 } },
    whatsapp: [
      { name: 'Sales Desk', instanceId: 'wa-sales-demo', status: 'connected', phone: '+15550121' },
      { name: 'Support Desk', instanceId: 'wa-support-demo', status: 'connected', phone: '+15550122' },
    ],
    telegram: [
      { name: 'Ops Alerts', sessionId: 'tg-ops-demo', status: 'connected', phone: '+15550123' },
    ],
    images: [
      {
        name: 'Hero Banner',
        url: 'https://images.example.com/northstar/hero.jpg',
        thumbnail: 'https://images.example.com/northstar/hero-thumb.jpg',
        mimeType: 'image/jpeg',
        size: 245000,
        category: 'marketing',
        tags: ['hero', 'banner', 'sales'],
      },
      {
        name: 'Support Screenshot',
        url: 'https://images.example.com/northstar/support.png',
        thumbnail: 'https://images.example.com/northstar/support-thumb.png',
        mimeType: 'image/png',
        size: 145000,
        category: 'support',
        tags: ['support', 'widget'],
      },
    ],
  },
  odoo: {
    contacts: [
      {
        name: 'Acme Manufacturing',
        email: 'procurement@acme-manufacturing.com',
        phone: '+1-555-2010',
        is_company: true,
        street: '10 Foundry Way',
        city: 'Oakland',
        country: 'USA',
      },
      {
        name: 'Summit Retail Group',
        email: 'ops@summit-retail.com',
        phone: '+1-555-2020',
        is_company: true,
        street: '1200 Commerce Blvd',
        city: 'Chicago',
        country: 'USA',
      },
      {
        name: 'Elena Brooks',
        email: 'elena@acme-manufacturing.com',
        phone: '+1-555-2030',
        is_company: false,
        city: 'Oakland',
        country: 'USA',
      },
      {
        name: 'Jordan Lee',
        email: 'jordan@summit-retail.com',
        phone: '+1-555-2040',
        is_company: false,
        city: 'Chicago',
        country: 'USA',
      },
    ],
    companies: [
      {
        name: 'Acme Manufacturing',
        email: 'procurement@acme-manufacturing.com',
        phone: '+1-555-2010',
        city: 'Oakland',
        country: 'USA',
      },
      {
        name: 'Summit Retail Group',
        email: 'ops@summit-retail.com',
        phone: '+1-555-2020',
        city: 'Chicago',
        country: 'USA',
      },
    ],
    crmLeads: [
      {
        name: 'Acme Warehouse Automation',
        contact_name: 'Elena Brooks',
        email_from: 'elena@acme-manufacturing.com',
        planned_revenue: 82000,
        probability: 64,
      },
      {
        name: 'Summit Retail Rollout',
        contact_name: 'Jordan Lee',
        email_from: 'jordan@summit-retail.com',
        planned_revenue: 54000,
        probability: 48,
      },
    ],
    crmActivities: [
      { summary: 'Discovery call', note: 'Review integration scope and timeline.' },
      { summary: 'Pricing follow-up', note: 'Send revised proposal and implementation estimate.' },
    ],
    supportTickets: [
      {
        subject: 'Warehouse device sync lag',
        description: 'Devices are reporting late inventory counts in the evening.',
        priority: 'high',
        status: 'open',
      },
      {
        subject: 'Portal access request',
        description: 'Customer requested updated portal access and billing contacts.',
        priority: 'medium',
        status: 'in_progress',
      },
    ],
    knowledge: [
      {
        category: 'Getting Started',
        article: { title: 'Welcome to the Northstar portal', body: 'Use the workspace dashboard to review leads, bookings, and support in one place.', isPublic: true },
      },
      {
        category: 'Billing',
        article: { title: 'How to update payment details', body: 'Navigate to the billing section and confirm the account owner before making changes.', isPublic: true },
      },
    ],
    projects: [
      { name: 'Warehouse Rollout', description: 'Deploy scanners, dashboards, and support workflow.' },
      { name: 'Retail Pilot', description: 'Validate ecommerce and POS integration for the pilot store.' },
    ],
    projectCards: [
      { title: 'Kickoff meeting', description: 'Align stakeholders and launch scope.' },
      { title: 'Data import', description: 'Import catalog, pricing, and customer lists.' },
      { title: 'Training session', description: 'Train operations and support teams.' },
    ],
    employees: [
      { name: 'Sarah Connor', work_email: 'sarah@northstar-demo.com', job_title: 'Implementation Manager' },
      { name: 'Kyle Reese', work_email: 'kyle@northstar-demo.com', job_title: 'Support Engineer' },
      { name: 'Dana Scully', work_email: 'dana@northstar-demo.com', job_title: 'Finance Lead' },
    ],
    departments: [
      { name: 'Implementation' },
      { name: 'Support' },
      { name: 'Finance' },
    ],
    jobs: [
      { name: 'Implementation Manager' },
      { name: 'Support Engineer' },
      { name: 'Finance Lead' },
    ],
    scores: [
      { scope: 'lead', category: 'engagement', name: 'Opened pricing email', weight: 15, condition: { event: 'email.opened' } },
      { scope: 'contact', category: 'intent', name: 'Booked demo', weight: 30, condition: { event: 'appointment.created' } },
      { scope: 'lead', category: 'fit', name: 'Company size > 100', weight: 20, condition: { companySize: '100+' } },
    ],
    posSeed: { shopId: 'northstar-flagship', count: 6 },
  },
};

function unwrap(response) {
  if (response && typeof response === 'object' && 'data' in response) {
    return response.data;
  }
  return response;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

async function getAdminToken() {
  const data = new URLSearchParams({
    client_id: 'admin-cli',
    username: CONFIG.keycloak.adminUser,
    password: CONFIG.keycloak.adminPass,
    grant_type: 'password',
  }).toString();

  return new Promise((resolve, reject) => {
    const url = new URL(`${CONFIG.keycloak.url}/realms/master/protocol/openid-connect/token`);
    const req = http.request({
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(data),
      },
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(body).access_token);
        } else {
          reject(new Error(`Token failed: ${res.statusCode} ${body}`));
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function getUserIdByEmail(token, email) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${CONFIG.keycloak.url}/admin/realms/${CONFIG.keycloak.realm}/users?email=${encodeURIComponent(email)}`);
    const req = http.request({
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        if (res.statusCode === 200) {
          const users = JSON.parse(body);
          resolve(users[0]?.id || null);
        } else {
          reject(new Error(`Lookup failed: ${res.statusCode} ${body}`));
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function request(serviceName, method, path, data, headers = {}, allowedStatuses = [200, 201, 202, 204, 409]) {
  return new Promise((resolve) => {
    const body = data !== undefined ? JSON.stringify(data) : '';
    const service = CONFIG.services[serviceName];
    const req = http.request({
      hostname: service.host,
      port: service.port,
      path,
      method,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Org-Id': CONFIG.orgId,
        ...headers,
        ...(body ? { 'Content-Length': Buffer.byteLength(body) } : {}),
      },
    }, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => (responseBody += chunk));
      res.on('end', () => {
        const status = res.statusCode || 0;
        const ok = allowedStatuses.includes(status);
        let parsed = responseBody;
        if (responseBody) {
          try {
            parsed = JSON.parse(responseBody);
          } catch (_err) {
            parsed = responseBody;
          }
        } else {
          parsed = null;
        }

        resolve({
          ok,
          status,
          data: parsed,
          body: responseBody,
        });
      });
    });
    req.setTimeout(REQUEST_TIMEOUT_MS, () => {
      req.destroy(new Error(`Request timed out after ${REQUEST_TIMEOUT_MS}ms`));
    });
    req.on('error', (error) => resolve({ ok: false, status: 0, error: error.message, data: null, body: '' }));
    if (body) req.write(body);
    req.end();
  });
}

async function send(serviceName, method, path, data, headers = {}, allowedStatuses) {
  const result = await request(serviceName, method, path, data, headers, allowedStatuses);
  if (!result.ok) {
    const suffix = result.body ? ` - ${result.body}` : '';
    throw new Error(`${serviceName.toUpperCase()} ${method} ${path} failed (${result.status})${suffix}`);
  }
  return unwrap(result.data);
}

async function maybeSend(serviceName, method, path, data, headers = {}, allowedStatuses) {
  const result = await request(serviceName, method, path, data, headers, allowedStatuses);
  return unwrap(result.data);
}

async function waitForService(serviceName, path, headers = {}, timeoutMs = 120000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const result = await request(serviceName, 'GET', path, undefined, headers, [200]);
    if (result.ok) {
      return true;
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(`Timed out waiting for ${serviceName} at ${path}`);
}

function userHeader(userId) {
  return { 'X-User-Id': userId };
}

function userHeaders(userId, extra = {}) {
  return { 'X-User-Id': userId, ...extra };
}

function parseList(value) {
  const data = unwrap(value);
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.items)) return data.items;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
}

function isoAtOffset(days, timeString) {
  const [hours, minutes] = String(timeString).split(':').map((part) => Number(part));
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

async function seedOrganization(owner, admin, staff, viewer) {
  console.log('\n--- Organization ---');
  await waitForService('organization', '/health');
  await send('organization', 'GET', '/v1/organizations', undefined, userHeader(owner.id));
  await send('organization', 'PUT', '/v1/organizations', DEMO.organization, userHeader(owner.id));
  await send('organization', 'PUT', '/v1/settings/crm', DEMO.crm, userHeader(owner.id));

  for (const user of [owner, admin, staff, viewer]) {
    await maybeSend('organization', 'POST', '/v1/memberships', {
      userId: user.id,
      role: user.role,
      metadata: {
        username: user.username,
        displayName: user.displayName,
        title: user.title,
      },
    }, userHeader(owner.id));
  }

  for (const location of DEMO.locations) {
    await maybeSend('organization', 'POST', '/v1/locations', location, userHeader(owner.id));
  }

  for (const goal of DEMO.goals) {
    const user = CONFIG.users.find((item) => item.username === goal.user);
    if (!user) continue;
    await maybeSend('organization', 'POST', '/v1/goals', {
      title: goal.title,
      category: goal.category,
      progress: goal.progress,
      metadata: { showcase: true },
    }, userHeader(user.id));
  }

  for (const habit of DEMO.habits) {
    const user = CONFIG.users.find((item) => item.username === habit.user);
    if (!user) continue;
    await maybeSend('organization', 'POST', '/v1/habits', {
      title: habit.title,
      momentum: habit.momentum,
      metadata: { showcase: true },
    }, userHeader(user.id));
  }

  for (const status of DEMO.onboarding) {
    const user = CONFIG.users.find((item) => item.username === status.user);
    if (!user) continue;
    await maybeSend('organization', 'POST', '/v1/onboarding/status', {
      tourStepId: status.tourStepId,
      tourCompleted: status.tourCompleted,
    }, userHeader(user.id), [200, 201, 409]);
  }

  for (const team of DEMO.crm.teams) {
    const teamOwner = team.members
      .map((username) => CONFIG.users.find((item) => item.username === username))
      .filter(Boolean);
    await maybeSend('organization', 'POST', '/v1/teams', {
      name: team.name,
      description: team.description,
      members: teamOwner.map((item) => item.id),
      managerUserId: teamOwner[0]?.id,
    }, userHeader(owner.id));
  }

  for (const pipeline of DEMO.crm.pipelines) {
    await maybeSend('organization', 'POST', '/v1/crm/pipelines', {
      name: pipeline.name,
      description: pipeline.description,
      stages: pipeline.stages,
    }, userHeader(owner.id));
  }

  for (const field of DEMO.crm.customFields) {
    await maybeSend('organization', 'POST', '/v1/crm/custom-fields', {
      name: field.name,
      entity: field.entity,
      type: field.type,
      required: false,
      options: field.options,
    }, userHeader(owner.id));
  }

  await maybeSend('organization', 'PUT', '/v1/crm/automation', {
    automationRules: DEMO.crm.automationRules,
  }, userHeader(owner.id));

  const workspace = await send('organization', 'GET', '/v1/workspace', undefined, userHeader(owner.id));
  console.log(`✅ Organization workspace seeded (${workspace?.stats?.membersTotal || 0} members)`);
}

async function seedBooking(owner) {
  console.log('\n--- Booking ---');
  await waitForService('booking', '/v1/booking-types', userHeader(owner.id));
  const existingTypes = parseList(await maybeSend('booking', 'GET', '/v1/booking-types', undefined, userHeader(owner.id)));
  const bookingTypeBySlug = new Map(existingTypes.map((item) => [item.slug, item]));

  for (const bookingType of DEMO.bookingTypes) {
    let seededType = bookingTypeBySlug.get(bookingType.slug);
    if (!seededType) {
      const payload = {
        ...bookingType,
        availabilities: (bookingType.availabilities || []).map((availability) => ({
          ...availability,
          bookingTypeId: bookingType.slug,
        })),
      };
      seededType = await send('booking', 'POST', '/v1/booking-types', payload, userHeader(owner.id));
    }

    for (const availability of bookingType.availabilities || []) {
      await maybeSend('booking', 'POST', '/v1/availability', {
        bookingTypeId: seededType.id,
        dayOfWeek: availability.dayOfWeek,
        startTime: availability.startTime,
        endTime: availability.endTime,
      }, userHeader(owner.id));
    }
  }

  const bookingTypeList = parseList(await send('booking', 'GET', '/v1/booking-types', undefined, userHeader(owner.id)));
  const bookingTypeIds = new Map(bookingTypeList.map((item) => [item.slug, item.id]));

  for (const appointment of DEMO.appointments) {
    const bookingTypeId = bookingTypeIds.get(appointment.bookingTypeSlug);
    if (!bookingTypeId) continue;
    const startTime = isoAtOffset(appointment.startOffsetDays, appointment.startTime);
    const start = new Date(startTime);
    const durationMinutes = DEMO.bookingTypes.find((item) => item.slug === appointment.bookingTypeSlug)?.durationMinutes || 30;
    const endTime = new Date(start.getTime() + durationMinutes * 60000).toISOString();
    await maybeSend('booking', 'POST', '/v1/appointments', {
      bookingTypeId,
      startTime,
      endTime,
      contactId: appointment.contactEmail,
      notes: appointment.notes,
      status: appointment.status,
    }, userHeader(owner.id));
  }

  const appointments = parseList(await send('booking', 'GET', '/v1/appointments', undefined, userHeader(owner.id)));
  console.log(`✅ Booking seeded (${bookingTypeList.length} booking types, ${appointments.length} appointments)`);
}

async function seedIntegrations(owner) {
  console.log('\n--- Integrations ---');
  await waitForService('integrations', '/health');
  for (const connection of DEMO.integrations.connections) {
    await maybeSend('integrations', 'POST', '/v1/integrations/connect', connection, userHeader(owner.id));
  }

  await maybeSend('integrations', 'POST', '/v1/integrations/google/connect', DEMO.integrations.google, userHeader(owner.id));
  await maybeSend('integrations', 'POST', '/v1/integrations/zoom/connect', DEMO.integrations.zoom, userHeader(owner.id));
  await maybeSend('integrations', 'POST', '/v1/integrations/shopify/connect', DEMO.integrations.shopify, userHeader(owner.id));
  await maybeSend('integrations', 'POST', '/v1/integrations/facebook/connect', DEMO.integrations.facebook, userHeader(owner.id));
  await maybeSend('integrations', 'POST', '/v1/integrations/instagram/connect', DEMO.integrations.instagram, userHeader(owner.id));
  await maybeSend('integrations', 'POST', '/v1/integrations/linkedin/connect', DEMO.integrations.linkedin, userHeader(owner.id));
  await maybeSend('integrations', 'POST', '/v1/integrations/tiktok/connect', DEMO.integrations.tiktok, userHeader(owner.id));
  await maybeSend('integrations', 'POST', '/v1/integrations/odoo/connect', {
    baseUrl: 'http://odoo:8069',
    db: 'northstar',
    username: 'admin',
    password: 'password',
    isActive: true,
  }, userHeader(owner.id));
  await maybeSend('integrations', 'POST', '/v1/integrations/easypost/connect', {
    apiKey: 'easypost-demo-key',
    isActive: true,
  }, userHeader(owner.id));
  await maybeSend('integrations', 'PUT', '/v1/integrations/meta', DEMO.integrations.meta, userHeader(owner.id));
  await maybeSend('integrations', 'PUT', '/v1/integrations/voice', DEMO.integrations.voice, userHeader(owner.id));
  await maybeSend('integrations', 'PUT', '/v1/integrations/settings', {
    timezone: 'America/New_York',
    apiKey: 'northstar-integration-api-key',
    fcmData: { projectId: 'northstar-demo' },
  }, userHeader(owner.id));

  for (const instance of DEMO.integrations.whatsapp) {
    await maybeSend('integrations', 'POST', '/v1/integrations/whatsapp/instances', instance, userHeader(owner.id));
  }

  for (const session of DEMO.integrations.telegram) {
    await maybeSend('integrations', 'POST', '/v1/integrations/telegram/sessions', session, userHeader(owner.id));
  }

  for (const image of DEMO.integrations.images) {
    await maybeSend('integrations', 'POST', '/v1/image-library', image, userHeader(owner.id));
  }

  const zoomMeeting = await maybeSend('integrations', 'POST', '/v1/integrations/zoom/create-meeting', {
    topic: 'Northstar Enterprise Demo',
    startTime: isoAtOffset(1, '11:00'),
    duration: 45,
    joinUrl: 'https://zoom.example.com/join/northstar-demo',
    password: '246810',
  }, userHeader(owner.id));
  await maybeSend('integrations', 'POST', '/v1/integrations/zoom/create-meeting', {
    topic: 'Implementation Kickoff',
    startTime: isoAtOffset(3, '09:30'),
    duration: 60,
    joinUrl: 'https://zoom.example.com/join/northstar-kickoff',
    password: '135790',
  }, userHeader(owner.id));

  const connections = parseList(await send('integrations', 'GET', '/v1/integrations', undefined, userHeader(owner.id)));
  const zoomMeetings = parseList(await send('integrations', 'GET', '/v1/integrations/zoom/meetings', undefined, userHeader(owner.id)));
  const whatsappInstances = parseList(await send('integrations', 'GET', '/v1/integrations/whatsapp/instances', undefined, userHeader(owner.id)));
  console.log(`✅ Integrations seeded (${connections.length} connections, ${zoomMeetings.length} meetings, ${whatsappInstances.length} WhatsApp instances)`);
  return { zoomMeeting };
}

async function seedRealtime(owner, admin, staff) {
  console.log('\n--- Realtime ---');
  await waitForService('realtime', '/health');

  for (const contact of DEMO.realtime.livechatContacts) {
    await maybeSend('realtime', 'POST', '/v1/livechat/contact', contact, userHeaders(owner.id));
  }

  await maybeSend('realtime', 'POST', '/v1/livechat/widget-setting', DEMO.realtime.widget, userHeaders(owner.id));

  const inboxResponses = [];
  for (let index = 0; index < DEMO.realtime.inboxThreads.length; index += 1) {
    const thread = DEMO.realtime.inboxThreads[index];
    const firstMessage = thread.messages[0];
    const secondMessage = thread.messages[1];
    const response = await send('realtime', 'POST', `/v1/inbox/webhook/demo-${index + 1}`, {
      organizationId: CONFIG.orgId,
      provider: thread.provider,
      contactMobile: thread.contactMobile,
      contactName: thread.contactName,
      content: firstMessage,
      type: 'text',
      metadata: { source: 'seed', thread: index + 1 },
    }, {});
    inboxResponses.push(response);

    if (secondMessage) {
      await send('realtime', 'POST', '/v1/inbox/send_text', {
        conversationId: response.conversationId,
        content: secondMessage,
      }, userHeaders(admin.id));
    }

    for (const reply of thread.replies || []) {
      await send('realtime', 'POST', '/v1/inbox/send_text', {
        conversationId: response.conversationId,
        content: reply,
      }, userHeaders(staff.id));
    }

    await maybeSend('realtime', 'POST', '/v1/agent/add_agent', {
      userId: admin.id,
      displayName: admin.displayName,
      email: admin.email,
      status: 'available',
      metadata: { title: admin.title },
    }, userHeaders(owner.id));

    await maybeSend('realtime', 'POST', '/v1/agent/add_agent', {
      userId: staff.id,
      displayName: staff.displayName,
      email: staff.email,
      status: 'available',
      metadata: { title: staff.title },
    }, userHeaders(owner.id));

    await maybeSend('realtime', 'POST', '/v1/agent/update_agent_in_chat', {
      conversationId: response.conversationId,
      agentId: admin.id,
    }, userHeaders(admin.id));
  }

  for (let i = 0; i < inboxResponses.length; i += 1) {
    const conversationId = inboxResponses[i]?.conversationId;
    if (!conversationId) continue;
    await maybeSend('realtime', 'POST', '/v1/agent/create_task', {
      title: i === 0 ? 'Prepare enterprise proposal' : 'Follow up with retail pilot',
      description: 'Seeded task for the showcase inbox.',
      conversationId,
      priority: i === 0 ? 'high' : 'normal',
      dueAt: isoAtOffset(2 + i, '16:00'),
      metadata: { showcase: true },
    }, userHeaders(admin.id));
  }

  const chatsAndContacts = await send('realtime', 'GET', '/v1/livechat/chats-and-contacts', undefined, userHeaders(owner.id));
  const conversations = parseList(await send('realtime', 'GET', '/v1/omni/conversations', undefined, userHeaders(owner.id)));
  console.log(`✅ Realtime seeded (${parseList(chatsAndContacts?.chats).length} chats, ${conversations.length} conversations)`);
}

async function seedEmail(owner) {
  console.log('\n--- Email Sync ---');
  await waitForService('emailSync', '/health');
  for (const template of DEMO.email.templates) {
    await maybeSend('emailSync', 'POST', '/api/v1/email/templates', {
      name: template.name,
      subject: template.subject,
      body: template.body,
      category: template.category,
    }, userHeader(owner.id));
  }

  const templateList = parseList(await send('emailSync', 'GET', '/api/v1/email/templates', undefined, userHeader(owner.id)));
  const templateIdByKey = new Map();
  for (const template of DEMO.email.templates) {
    const key = template.key;
    const listItem = templateList.find((item) => item.name === template.name);
    if (listItem?.id) templateIdByKey.set(key, listItem.id);
  }

  const sequenceIds = new Map();
  for (const sequence of DEMO.email.sequences) {
    const steps = sequence.steps.map((step) => ({
      stepNumber: step.stepNumber,
      type: step.type,
      delayDays: step.delayDays,
      ...(step.templateKey ? { templateId: templateIdByKey.get(step.templateKey) } : {}),
    }));

    const created = await maybeSend('emailSync', 'POST', '/api/v1/email/sequences', {
      name: sequence.name,
      description: sequence.description,
      steps,
      isActive: true,
    }, userHeader(owner.id));
    if (created?.id) sequenceIds.set(sequence.key, created.id);
  }

  const sequenceList = parseList(await send('emailSync', 'GET', '/api/v1/email/sequences', undefined, userHeader(owner.id)));
  const sequenceByName = new Map(sequenceList.map((item) => [item.name, item.id]));

  const enrollments = [
    {
      sequenceKey: 'lead_nurture',
      contactEmail: 'elena@acme-manufacturing.com',
      contactId: 'odoo-contact-elena',
      dealId: 'lead-acme-automation',
      firstName: 'Elena',
      lastName: 'Brooks',
      companyName: 'Acme Manufacturing',
      dealName: 'Acme Warehouse Automation',
    },
    {
      sequenceKey: 'support_checkin',
      contactEmail: 'jordan@summit-retail.com',
      contactId: 'odoo-contact-jordan',
      dealId: 'lead-summit-retail',
      firstName: 'Jordan',
      lastName: 'Lee',
      companyName: 'Summit Retail Group',
      dealName: 'Summit Retail Rollout',
    },
  ];

  for (const enrollment of enrollments) {
    const sequenceId = sequenceIds.get(enrollment.sequenceKey) || sequenceByName.get(
      DEMO.email.sequences.find((item) => item.key === enrollment.sequenceKey)?.name || '',
    );
    if (!sequenceId) continue;
    await maybeSend('emailSync', 'POST', `/api/v1/email/sequences/${sequenceId}/enroll`, {
      contactEmail: enrollment.contactEmail,
      contactId: enrollment.contactId,
      dealId: enrollment.dealId,
      firstName: enrollment.firstName,
      lastName: enrollment.lastName,
      companyName: enrollment.companyName,
      dealName: enrollment.dealName,
    }, userHeader(owner.id));
  }

  const sequences = parseList(await send('emailSync', 'GET', '/api/v1/email/sequences', undefined, userHeader(owner.id)));
  console.log(`✅ Email sync seeded (${templateList.length} templates, ${sequences.length} sequences)`);
}

async function seedOdoo(owner, staff) {
  console.log('\n--- Odoo ---');

  const companyIds = new Map();
  for (const company of DEMO.odoo.companies) {
    const created = await maybeSend('odoo', 'POST', '/v1/odoo/contacts/companies', {
      name: company.name,
      email: company.email,
      phone: company.phone,
      city: company.city,
      country: company.country,
    }, userHeaders(owner.id));
    if (created?.id) companyIds.set(company.name, created.id);
  }

  const createdContacts = new Map();
  for (const contact of DEMO.odoo.contacts) {
    const created = await maybeSend('odoo', 'POST', '/v1/odoo/contacts', contact, userHeaders(staff.id));
    if (created?.id) createdContacts.set(contact.name, created.id);
  }

  for (const [contactName, contactId] of createdContacts.entries()) {
    if (companyIds.has(contactName)) continue;
    const companyId = companyIds.get(contactName) || null;
    if (companyId) {
      await maybeSend('odoo', 'POST', `/v1/odoo/contacts/${contactId}/link-company`, { companyId }, userHeaders(owner.id));
    }
  }

  for (const contactName of ['Elena Brooks', 'Jordan Lee']) {
    const contactId = createdContacts.get(contactName);
    if (!contactId) continue;
    await maybeSend('odoo', 'POST', `/v1/odoo/contacts/${contactId}/pets`, {
      name: contactName === 'Elena Brooks' ? 'Milo' : 'Nova',
      breed: contactName === 'Elena Brooks' ? 'Golden Retriever' : 'Corgi',
      age: '3',
    }, userHeaders(staff.id));
    await maybeSend('odoo', 'POST', `/v1/odoo/contacts/${contactId}/files`, {
      name: `${contactName} onboarding.pdf`,
      size: '2.4 MB',
      url: 'https://files.example.com/onboarding.pdf',
      type: 'application/pdf',
    }, userHeaders(staff.id));
    await maybeSend('odoo', 'POST', `/v1/odoo/contacts/${contactId}/tasks`, {
      title: 'Call back with rollout proposal',
      dueDate: '2026-08-07',
      priority: 'High',
    }, userHeaders(staff.id));
    await maybeSend('odoo', 'POST', `/v1/odoo/contacts/${contactId}/activities`, {
      type: 'note',
      title: 'Discovery summary',
      content: 'Confirmed rollout scope, security review, and implementation milestones.',
      author: staff.displayName,
      color: 'info',
    }, userHeaders(staff.id));
    await maybeSend('odoo', 'POST', `/v1/odoo/contacts/${contactId}/clock-in`, {
      status: 'Approved',
    }, userHeaders(staff.id));
  }

  for (const lead of DEMO.odoo.crmLeads) {
    const created = await maybeSend('odoo', 'POST', '/v1/odoo/crm', lead, userHeaders(owner.id));
  }

  for (const activity of DEMO.odoo.crmActivities) {
    await maybeSend('odoo', 'POST', '/v1/odoo/crm/activities', {
      ...activity,
      activity_type: 'todo',
    }, userHeaders(owner.id));
  }

  const projectIds = [];
  for (const project of DEMO.odoo.projects) {
    const created = await maybeSend('odoo', 'POST', '/v1/odoo/projects/v1/projects', project, userHeaders(owner.id));
    if (created?.id) projectIds.push(created.id);
  }

  for (const projectId of projectIds) {
    const board = await maybeSend('odoo', 'POST', `/v1/odoo/projects/v1/projects/${projectId}/boards`, {
      name: `Board ${projectId}`,
    }, userHeaders(owner.id));
    const boardId = board?.id ? String(board.id) : `board-${projectId}`;
    const columns = ['Backlog', 'In Progress', 'Done'];
    for (let index = 0; index < columns.length; index += 1) {
      await maybeSend('odoo', 'POST', `/v1/odoo/projects/v1/boards/${boardId}/columns`, {
        name: columns[index],
        sequence: index + 1,
      }, userHeaders(owner.id));
    }

    for (const card of DEMO.odoo.projectCards) {
      await maybeSend('odoo', 'POST', `/v1/odoo/projects/v1/boards/${boardId}/cards`, {
        name: card.title,
        description: card.description,
        stage: 'Backlog',
      }, userHeaders(owner.id));
    }
  }

  for (const ticket of DEMO.odoo.supportTickets) {
    const created = await maybeSend('odoo', 'POST', '/v1/odoo/support/tickets', {
      ...ticket,
      assigneeUserId: staff.id,
      customerContactId: createdContacts.get('Elena Brooks') || createdContacts.get('Jordan Lee'),
    }, userHeaders(staff.id));
    const ticketId = created?.id;
    if (!ticketId) continue;

    await maybeSend('odoo', 'POST', `/v1/odoo/support/tickets/${ticketId}/notes`, {
      body: 'Internal triage note for the demo showcase.',
    }, userHeaders(staff.id));

    await maybeSend('odoo', 'POST', `/v1/odoo/support/tickets/${ticketId}/replies`, {
      body: 'We are reviewing this and will update you shortly.',
      visibleToCustomer: true,
    }, userHeaders(owner.id));
  }

  for (const entry of DEMO.odoo.knowledge) {
    const category = await maybeSend('odoo', 'POST', '/v1/odoo/support/kb/categories', {
      name: entry.category,
      description: `${entry.category} articles for the showcase demo.`,
    }, userHeaders(owner.id));
    await maybeSend('odoo', 'POST', '/v1/odoo/support/kb/articles', {
      title: entry.article.title,
      body: entry.article.body,
      isPublic: entry.article.isPublic,
      categoryId: category?.id,
    }, userHeaders(owner.id));
  }

  for (const employee of DEMO.odoo.employees) {
    await maybeSend('odoo', 'POST', '/v1/odoo/employees', employee, userHeaders(owner.id));
  }

  for (const department of DEMO.odoo.departments) {
    await maybeSend('odoo', 'POST', '/v1/odoo/employees/departments', department, userHeaders(owner.id));
  }

  for (const job of DEMO.odoo.jobs) {
    await maybeSend('odoo', 'POST', '/v1/odoo/employees/jobs', job, userHeaders(owner.id));
  }

  await maybeSend('odoo', 'POST', '/v1/odoo/employees/attendance', {
    employee_id: 1,
    check_in: isoAtOffset(-1, '08:45'),
    check_out: isoAtOffset(-1, '17:20'),
    status: 'present',
  }, userHeaders(owner.id));

  await maybeSend('odoo', 'POST', '/v1/odoo/employees/shifts', {
    employee_id: 1,
    name: 'Morning Support Shift',
    start: isoAtOffset(1, '08:00'),
    end: isoAtOffset(1, '16:00'),
  }, userHeaders(owner.id));

  for (const rule of DEMO.odoo.scores) {
    await maybeSend('odoo', 'POST', '/v1/odoo/scores/rules', rule, userHeaders(owner.id));
  }

  await maybeSend('odoo', 'POST', '/v1/odoo/pos/seed/ecommerce-orders', DEMO.odoo.posSeed, userHeaders(owner.id));

  const contacts = parseList(await send('odoo', 'GET', '/v1/odoo/contacts', undefined, userHeaders(owner.id)));
  const leads = parseList(await send('odoo', 'GET', '/v1/odoo/crm', undefined, userHeaders(owner.id)));
  const tickets = parseList(await send('odoo', 'GET', '/v1/odoo/support/tickets', undefined, userHeaders(owner.id)));
  console.log(`✅ Odoo seeded (${contacts.length} contacts, ${leads.length} leads, ${tickets.length} tickets)`);
}

async function seed() {
  console.log('🚀 Starting showcase seeding...');

  const token = await getAdminToken();
  for (const user of CONFIG.users) {
    user.id = await getUserIdByEmail(token, user.email);
    if (!user.id) {
      throw new Error(`Unable to resolve Keycloak user for ${user.email}`);
    }
    console.log(`🆔 Resolved ${user.username} to ${user.id}`);
  }

  const [owner, admin, staff, viewer] = CONFIG.users;

  await waitForService('organization', '/health');
  await waitForService('emailSync', '/health');
  await waitForService('integrations', '/health');
  await waitForService('realtime', '/health');
  await waitForService('booking', '/v1/booking-types', userHeader(owner.id));

  await seedOrganization(owner, admin, staff, viewer);
  await seedBooking(owner);
  await seedIntegrations(owner);
  await seedRealtime(owner, admin, staff);
  await seedEmail(owner);
  await seedOdoo(owner, staff);

  console.log('\n✅ Showcase seeding completed successfully.');
}

seed().then(() => process.exit(0)).catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
