import { collectPages } from './pagination.js';
import {
  createServiceApp,
  createRateLimiter,
  requireOrganizationMembership,
  verifyAccessToken,
} from "@mymanager/node-service-kit";
import { API_ROUTER_CONFIG } from "./config.js";

const authRateLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: { success: false, error: "Too many login attempts, please try again in a minute." }
});

const { app, logger } = createServiceApp({
  serviceName: "api-router-service",
  jsonLimit: "50mb",
  urlEncodedLimit: "50mb",
  enableCors: false
});

app.use("/api/auth/sign-in", authRateLimiter);

import type { Request, Response } from "express";

async function identityOr401(req: Request, res: Response): Promise<{ orgId: string; userId: string; token: Record<string, any> } | null> {
  const orgId = req.header("X-Org-Id") || null;
  if (!orgId) {
    res.status(401).json({ message: "Missing selected organization." });
    return null;
  }
  try {
    const token = await verifyAccessToken(req.header("Authorization"), {
      issuer: process.env.KEYCLOAK_ISSUER,
      audience: process.env.KEYCLOAK_CLIENT_ID || "mymanager-web",
    });
    if (typeof token.sub !== "string") throw new Error("Token has no subject");
    const membership = await requireOrganizationMembership({
      orgId,
      userId: token.sub,
      authorization: req.header("Authorization"),
    });
    if (!membership) {
      res.status(403).json({ message: "User is not an active member of this organization." });
      return null;
    }
    return { orgId, userId: token.sub, token };
  } catch {
    res.status(401).json({ message: "Invalid or expired access token." });
    return null;
  }
}

function notImplemented(res: Response, meta: { module: string; path: string; method: string; hint: string }) {
  res.status(501).json({ message: "API not implemented in microservices yet.", ...meta });
}

async function proxyTo(req: Request, res: Response, opts: { baseUrl: string; targetPath: string; method?: string; body?: any }) {
  try {
    const url = new URL(opts.targetPath, opts.baseUrl);

    const headers = new Headers();
    const hopByHop = new Set(["connection", "keep-alive", "proxy-authenticate", "proxy-authorization", "te", "trailer", "transfer-encoding", "upgrade", "host"]);
    const callerIdentityHeaders = new Set(["x-user-id", "x-user-role", "x-user-roles", "x-user-email", "x-user-name"]);

    for (const [k, v] of Object.entries(req.headers)) {
      if (!k) continue;
      if (hopByHop.has(k.toLowerCase())) continue;
      if (callerIdentityHeaders.has(k.toLowerCase())) continue;
      // fetch must calculate length from the serialized or transformed body.
      if (k.toLowerCase() === "content-length") continue;
      headers.set(k, Array.isArray(v) ? v.join(",") : String(v));
    }

    const method = opts.method || req.method;
    const init: RequestInit = { method, headers };

    if (!["GET", "HEAD"].includes(method)) {
      const body = opts.body !== undefined ? opts.body : req.body;
      if (req.is("application/json") || opts.body !== undefined) {
        init.body = JSON.stringify(body ?? {});
        headers.set("content-type", "application/json");
      } else if (req.is("application/x-www-form-urlencoded")) {
        init.body = new URLSearchParams(body ?? {}).toString();
        headers.set("content-type", "application/x-www-form-urlencoded");
      } else {
        res.status(415).json({ message: "Unsupported Content-Type for proxy." });
        return;
      }
    }

    const upstream = await fetch(url, init);
    res.status(upstream.status);

    upstream.headers.forEach((value: string, key: string) => {
      if (hopByHop.has(key.toLowerCase())) return;
      res.setHeader(key, value);
    });

    const buf = Buffer.from(await upstream.arrayBuffer());
    res.send(buf);
  } catch (error: any) {
    logger.error({ err: error, baseUrl: opts.baseUrl, targetPath: opts.targetPath }, "Proxy request failed");
    if (!res.headersSent) {
      res.status(502).json({
        message: "Upstream service unavailable",
        target: opts.targetPath,
      });
    }
  }
}

function withQuery(req: Request, targetPath: string) {
  const query = new URLSearchParams(req.query as Record<string, string>).toString();
  return query ? `${targetPath}?${query}` : targetPath;
}

type CompatEmployeeRow = {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  totalShifts: number;
  displaySummary: string;
  categories: Array<{ _id: string; name: string }>;
};

function toCompatEmployeeRow(raw: any): CompatEmployeeRow {
  const id = String(raw?.uuid ?? raw?.id ?? "");
  const contactTypes = Array.isArray(raw?.contactType)
    ? raw.contactType
    : (raw?.contactType ? [raw.contactType] : []);

  return {
    _id: id,
    fullName: String(raw?.fullName ?? raw?.name ?? "Unnamed employee"),
    email: String(raw?.email ?? ""),
    phone: String(raw?.phone ?? ""),
    totalShifts: 0,
    displaySummary: "0 shifts",
    categories: contactTypes.map((name: string, idx: number) => ({
      _id: `${id}-cat-${idx}`,
      name: String(name),
    })),
  };
}

async function getCompatEmployeesFromOdoo(req: Request): Promise<CompatEmployeeRow[]> {
  const headers = {
    Authorization: req.header("Authorization") ?? "",
    "X-Org-Id": req.header("X-Org-Id") ?? "",
  };

  let page = 1;
  let totalPages = 1;
  const rows: any[] = [];

  do {
    const query = new URLSearchParams({
      page: String(page),
      pageSize: "200",
      type: "employee",
      search: String(req.query.search ?? ""),
    });

    const upstream = await fetch(toAbsoluteUrl(API_ROUTER_CONFIG.odooIntegrationBaseUrl, `/v1/odoo/contacts?${query.toString()}`), {
      method: "GET",
      headers,
    });

    if (!upstream.ok) {
      throw new Error(`Odoo contacts compat failed with status ${upstream.status}`);
    }

    const payload = await upstream.json();
    const batch = Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload)
        ? payload
        : [];

    rows.push(...batch);
    totalPages = Number(payload?.totalPages ?? 1);
    page += 1;
  } while (page <= totalPages);

  return rows.map(toCompatEmployeeRow);
}

function getForwardHeaders(req: Request) {
  return {
    Authorization: req.header("Authorization") ?? "",
    "X-Org-Id": req.header("X-Org-Id") ?? "",
  };
}

async function fetchUpstreamJson(req: Request, url: string, timeoutMs: number = 15000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const upstream = await fetch(url, {
      method: "GET",
      headers: getForwardHeaders(req),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!upstream.ok) {
      throw new Error(`Upstream failed (${upstream.status}) for ${url}`);
    }

    return await upstream.json();
  } catch (error: any) {
    clearTimeout(timeoutId);
    logger.error({ err: error, url, timeoutMs }, "Upstream fetch failed");
    if (error.name === "AbortError") {
      throw new Error(`Upstream request timed out after ${timeoutMs}ms for ${url}`);
    }
    throw error;
  }
}

async function fetchCollection(req: Request, source: string) {
  return collectPages(async (page, pageSize) => {
    const url = new URL(source);
    url.searchParams.set("page", String(page));
    url.searchParams.set("pageSize", String(pageSize));
    return fetchUpstreamJson(req, url.toString());
  });
}

async function fetchCollectionSafe(req: Request, source: string) {
  try { return { ok: true, data: { data: await fetchCollection(req, source) }, error: null as string | null }; }
  catch (error: any) { return { ok: false, data: { data: [] as any[] }, error: String(error?.message || 'Collection unavailable') }; }
}

async function fetchUpstreamJsonSafe(req: Request, url: string) {
  try {
    const data = await fetchUpstreamJson(req, url);
    return { ok: true as const, data, error: null as string | null };
  } catch (error: any) {
    return { ok: false as const, data: null, error: String(error?.message ?? "Unknown upstream error") };
  }
}

function toAbsoluteUrl(baseUrl: string, pathOrUrl: string) {
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) return pathOrUrl;
  return new URL(pathOrUrl, baseUrl).toString();
}

async function odooWriteInvoice(req: Request, invoiceId: number, payload: Record<string, unknown>) {
  const upstream = await fetch(toAbsoluteUrl(API_ROUTER_CONFIG.odooIntegrationBaseUrl, `/v1/odoo/invoices/${invoiceId}`), {
    method: "PUT",
    headers: {
      ...getForwardHeaders(req),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!upstream.ok) {
    const body = await upstream.text();
    throw new Error(`Odoo invoice update failed (${upstream.status}): ${body}`);
  }

  return upstream.json();
}

async function fetchAllOdooInvoicesForGraph(req: Request, opts?: { months?: number; maxPages?: number }) {
  const months = Math.max(1, Math.min(24, Number(opts?.months ?? 6)));
  const maxPages = Math.max(1, Math.min(50, Number(opts?.maxPages ?? 20)));
  const pageSize = 100;
  const rows: any[] = [];

  for (let page = 1; page <= maxPages; page += 1) {
    const query = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    const upstream = await fetchUpstreamJsonSafe(req, toAbsoluteUrl(API_ROUTER_CONFIG.odooIntegrationBaseUrl, `/v1/odoo/invoices?${query.toString()}`));
    if (!upstream.ok) throw new Error(upstream.error || "Invoice source unavailable");

    const batch = Array.isArray(upstream.data?.data) ? upstream.data.data : [];
    rows.push(...batch);
    if (rows.length >= Number(upstream.data?.total ?? 0)) break;
    if (!batch.length || page === maxPages) throw new Error("Invoice graph would be incomplete; narrow the date range");
  }

  const startDate = new Date();
  startDate.setDate(1);
  startDate.setMonth(startDate.getMonth() - (months - 1));
  const startTime = startDate.getTime();

  return rows.filter((inv) => {
    const rawDate = inv?.invoice_date || inv?.create_date || inv?.invoice_date_due;
    if (!rawDate) return false;
    const d = new Date(rawDate);
    if (Number.isNaN(d.getTime())) return false;
    return d.getTime() >= startTime;
  });
}

async function fetchMagentoOrders(req: Request, query: URLSearchParams = new URLSearchParams()) {
  void req;
  void query;
  return {
    ok: false,
    data: { data: { items: [] as any[] } },
    error: "Magento integration service is disabled.",
  };
}

function toNum(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function invoiceTotals(invoices: any[]) {
  const totalInvoiced = invoices.reduce((sum, inv) => sum + toNum(inv?.amount_total), 0);
  const totalOutstanding = invoices.reduce((sum, inv) => sum + toNum(inv?.amount_residual), 0);
  const totalPaid = Math.max(0, totalInvoiced - totalOutstanding);
  return { totalInvoiced, totalOutstanding, totalPaid };
}

const domainRoutes: Record<string, string> = {
  "community": API_ROUTER_CONFIG.communityServiceBaseUrl,
  "community-group": API_ROUTER_CONFIG.communityServiceBaseUrl,
  "community-members": API_ROUTER_CONFIG.communityServiceBaseUrl,
  "community-post": API_ROUTER_CONFIG.communityServiceBaseUrl,
  "community-profile": API_ROUTER_CONFIG.communityServiceBaseUrl,
  "community-settings": API_ROUTER_CONFIG.communityServiceBaseUrl,
  "community-events": API_ROUTER_CONFIG.communityServiceBaseUrl,
  "community-badges": API_ROUTER_CONFIG.communityServiceBaseUrl,
  "community-activity": API_ROUTER_CONFIG.communityServiceBaseUrl,
  "community-points": API_ROUTER_CONFIG.communityServiceBaseUrl,
  "document": API_ROUTER_CONFIG.documentsServiceBaseUrl,
  "documents": API_ROUTER_CONFIG.documentsServiceBaseUrl,
  "document-recipient": API_ROUTER_CONFIG.documentsServiceBaseUrl,
  "document-signature": API_ROUTER_CONFIG.documentsServiceBaseUrl,
  "upload": API_ROUTER_CONFIG.documentsServiceBaseUrl,
  "payment": API_ROUTER_CONFIG.paymentsServiceBaseUrl,
  "payments": API_ROUTER_CONFIG.paymentsServiceBaseUrl,
  "payment-cards": API_ROUTER_CONFIG.paymentsServiceBaseUrl,
  "deposit": API_ROUTER_CONFIG.paymentsServiceBaseUrl,
  "employee": API_ROUTER_CONFIG.employeesServiceBaseUrl,
  "employees": API_ROUTER_CONFIG.employeesServiceBaseUrl,
  "employee-schedule": API_ROUTER_CONFIG.employeesServiceBaseUrl,
  "employee-timeoff-request": API_ROUTER_CONFIG.employeesServiceBaseUrl,
  "employee-attendance": API_ROUTER_CONFIG.employeesServiceBaseUrl
};

const deprecatedCommerceModules = new Set([
  "shopv2",
  "cart",
  "product",
  "product-category",
  "category",
  "coupon",
]);

async function handleApiCompat(req: Request, res: Response) {
  const moduleParam = req.params.module;
  const module = Array.isArray(moduleParam) ? moduleParam[0] : moduleParam;
  const rest = req.params[0] ? `/${req.params[0]}` : "";

  if (module === "public" && req.method === "GET" && rest === "/help-center/articles") {
    return notImplemented(res, {
      module,
      method: req.method,
      path: rest,
      hint: "Public help-center articles endpoint has no upstream implementation.",
    });
  }

  if (module === "auth") {
    if (req.method === "POST" && rest === "/sign-in") {
      try {
        const { email, password } = req.body;
        const body = new URLSearchParams({
          grant_type: "password",
          client_id: API_ROUTER_CONFIG.keycloakClientId,
          username: email,
          password: password,
          scope: "openid profile email"
        });

        const response = await fetch(API_ROUTER_CONFIG.keycloakTokenUrl, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: body.toString()
        });

        if (!response.ok) {
          const errorData = await response.json();
          return res.status(response.status).json(errorData);
        }

        const data = await response.json();
        return res.json({
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          expiresIn: data.expires_in
        });
      } catch (err) {
        logger.error({ err }, "Auth sign-in failed");
        return res.status(500).json({ message: "Internal Auth Error" });
      }
    }

    if (req.method === "GET" && rest === "/me") {
      const ident = await identityOr401(req, res);
      if (!ident) return;

      return res.json({
        user: {
          id: ident.userId,
          orgId: ident.orgId,
          email: typeof ident.token.email === "string" ? ident.token.email : null,
          name: typeof ident.token.name === "string" ? ident.token.name : null,
          role: null,
        },
      });
    }
  }

  if (module === "inbox" && /^\/webhook\/[^/]+$/.test(rest)) {
    return proxyTo(req, res, {
      baseUrl: API_ROUTER_CONFIG.realtimeServiceBaseUrl,
      targetPath: `/v1/inbox${rest}`
    });
  }

  // Only these booking operations are public; management remains authenticated.
  if (module === "booking") {
    if (req.method === "GET" && /^\/public\/booking-types\/[^/]+$/.test(rest)) {
      return proxyTo(req, res, { baseUrl: API_ROUTER_CONFIG.bookingServiceBaseUrl, targetPath: `/v1/booking-types/${encodeURIComponent(rest.split('/')[3])}` });
    }
    if (req.method === "GET" && rest === "/available-slots") {
      return proxyTo(req, res, { baseUrl: API_ROUTER_CONFIG.bookingServiceBaseUrl, targetPath: withQuery(req, "/v1/appointments/available-slots") });
    }
    if (req.method === "POST" && rest === "/appointments/user") {
      return proxyTo(req, res, { baseUrl: API_ROUTER_CONFIG.bookingServiceBaseUrl, targetPath: "/v1/appointments/public" });
    }
  }

  const ident = await identityOr401(req, res);
  if (!ident) return;

  try {
    if (module === "form-builder") {
      const targetPath = withQuery(req, `/v1/odoo/form-builder${rest}`);
      return proxyTo(req, res, { baseUrl: API_ROUTER_CONFIG.odooIntegrationBaseUrl, targetPath });
    }

    if (module === "webbuilder") {
      const targetPath = withQuery(req, `/v1/odoo/webbuilder${rest}`);
      return proxyTo(req, res, { baseUrl: API_ROUTER_CONFIG.odooIntegrationBaseUrl, targetPath });
    }

    if (module === "reputation") {
      const targetPath = withQuery(req, `/v1/odoo/reputation${rest}`);
      return proxyTo(req, res, { baseUrl: API_ROUTER_CONFIG.odooIntegrationBaseUrl, targetPath });
    }

    if (deprecatedCommerceModules.has(module)) {
      return res.status(410).json({
        message: "Deprecated commerce compatibility module.",
        module,
        canonical: "/api/odoo/*",
        storefront: "Magento integration is disabled in this environment.",
      });
    }

    if (module === "employee-schedule" && req.method === "GET") {
      if (rest === "/get-contacts-with-categories-and-shifts" || rest === "/get-employee-category-schedule-data") {
        const data = await getCompatEmployeesFromOdoo(req);
        return res.json({ data, total: data.length });
      }

      if (rest === "/get-all") {
        return notImplemented(res, { module, method: req.method, path: rest, hint: "Employee schedule list compatibility endpoint has no upstream implementation." });
      }
    }

    if (module === "employees") {
      const targetPath = withQuery(req, `/v1/odoo/employees${rest}`);
      return proxyTo(req, res, { baseUrl: API_ROUTER_CONFIG.odooIntegrationBaseUrl, targetPath });
    }

    if (domainRoutes[module]) {
      return proxyTo(req, res, { baseUrl: domainRoutes[module], targetPath: `/api/${module}${rest}` });
    }

    if (module === "contact") {
      const targetPath = withQuery(req, `/v1/odoo/contacts${rest}`);
      return proxyTo(req, res, { baseUrl: API_ROUTER_CONFIG.odooIntegrationBaseUrl, targetPath });
    }

    if (module === "phonebook") {
      if (req.method === "POST" && rest === "/add") {
        return proxyTo(req, res, {
          baseUrl: API_ROUTER_CONFIG.odooIntegrationBaseUrl,
          targetPath: "/v1/odoo/contacts",
        });
      }

      if (req.method === "POST" && rest === "/import_contacts") {
        const contacts = Array.isArray(req.body?.contacts) ? req.body.contacts : [];
        if (!contacts.length) {
          return res.status(400).json({ message: "contacts array is required" });
        }

        const results: Array<{ ok: boolean; data?: any; error?: string; input?: any }> = [];
        for (const item of contacts) {
          try {
            const payload = {
              name: String(item?.name || item?.fullName || "").trim(),
              email: item?.email ? String(item.email) : undefined,
              phone: item?.phone ? String(item.phone) : undefined,
              mobile: item?.mobile ? String(item.mobile) : undefined,
              company: item?.company ? String(item.company) : undefined,
              jobTitle: item?.jobTitle ? String(item.jobTitle) : undefined,
              notes: item?.notes ? String(item.notes) : undefined,
            };

            if (!payload.name) {
              results.push({ ok: false, error: "name is required", input: item });
              continue;
            }

            const upstream = await fetch(
              toAbsoluteUrl(API_ROUTER_CONFIG.odooIntegrationBaseUrl, "/v1/odoo/contacts"),
              {
                method: "POST",
                headers: {
                  ...getForwardHeaders(req),
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
              }
            );

            if (!upstream.ok) {
              const text = await upstream.text();
              results.push({ ok: false, error: `upstream ${upstream.status}: ${text}`, input: item });
              continue;
            }

            const data = await upstream.json();
            results.push({ ok: true, data });
          } catch (error: any) {
            results.push({ ok: false, error: String(error?.message || error), input: item });
          }
        }

        const created = results.filter((r) => r.ok).length;
        const failed = results.length - created;
        return res.status(created > 0 ? 200 : 502).json({
          imported: created,
          failed,
          total: results.length,
          results,
        });
      }

      if (req.method === "GET" && rest === "/get_uid_contacts") {
        return proxyTo(req, res, {
          baseUrl: API_ROUTER_CONFIG.odooIntegrationBaseUrl,
          targetPath: withQuery(req, "/v1/odoo/contacts"),
        });
      }

      return notImplemented(res, {
        module,
        method: req.method,
        path: rest,
        hint: "Implemented: add, import_contacts, get_uid_contacts",
      });
    }

    if (module === "odoo") {
      const targetPath = withQuery(req, `/v1/odoo${rest}`);
      return proxyTo(req, res, { baseUrl: API_ROUTER_CONFIG.odooIntegrationBaseUrl, targetPath });
    }

    if (module === "marketing") {
      const targetPath = withQuery(req, `/v1/marketing${rest}`);
      return proxyTo(req, res, { baseUrl: API_ROUTER_CONFIG.odooIntegrationBaseUrl, targetPath });
    }

    if (module === "user") {
      if (req.method === "POST" && rest === "/update_meta") {
        return proxyTo(req, res, {
          baseUrl: API_ROUTER_CONFIG.integrationsServiceBaseUrl,
          targetPath: "/v1/integrations/meta",
          method: "PUT"
        });
      }

      if ((req.method === "POST" || req.method === "PUT" || req.method === "PATCH") && rest === "/update_profile") {
        return proxyTo(req, res, {
          baseUrl: API_ROUTER_CONFIG.organizationServiceBaseUrl,
          targetPath: "/v1/compat/user/update_profile",
          method: "POST",
          body: req.body || {}
        });
      }

      if (req.method === "POST" && rest === "/return_media_url") {
        const mediaUrl = String(req.body?.mediaUrl || req.body?.url || req.body?.imageUrl || '').trim();
        const dataUrl = String(req.body?.dataUrl || '').trim();
        const fallbackName = String(req.body?.name || req.body?.fileName || 'media').trim();

        if (mediaUrl) {
          return res.json({ success: true, data: { mediaUrl }, media_url: mediaUrl });
        }

        if (dataUrl.startsWith("data:")) {
          const safeName = fallbackName.replace(/[^a-zA-Z0-9._-]/g, "_");
          const generated = `/uploads/${safeName}`;
          return res.json({ success: true, data: { mediaUrl: generated }, media_url: generated });
        }

        return res.status(400).json({
          success: false,
          message: "mediaUrl/url/imageUrl or dataUrl is required"
        });
      }

      return notImplemented(res, {
        module,
        method: req.method,
        path: rest,
        hint: "Implemented: update_meta, update_profile, return_media_url",
      });
    }

    if (module === "qr") {
      if (req.method === "POST" && rest === "/gen_qr") {
        return proxyTo(req, res, {
          baseUrl: API_ROUTER_CONFIG.integrationsServiceBaseUrl,
          targetPath: "/v1/integrations/whatsapp/instances",
          method: "POST",
          body: { name: req.body?.name || req.body?.instanceName || "WhatsApp Instance" }
        });
      }

      if (req.method === "GET" && rest === "/get_all") {
        return proxyTo(req, res, {
          baseUrl: API_ROUTER_CONFIG.integrationsServiceBaseUrl,
          targetPath: "/v1/integrations/whatsapp/instances"
        });
      }

      if (req.method === "POST" && rest === "/del_instance") {
        const instanceId = String(req.body?.instanceId || req.body?.id || '').trim();
        if (!instanceId) return res.status(400).json({ success: false, message: 'instanceId is required' });
        return proxyTo(req, res, {
          baseUrl: API_ROUTER_CONFIG.integrationsServiceBaseUrl,
          targetPath: `/v1/integrations/whatsapp/instances/${encodeURIComponent(instanceId)}`,
          method: "DELETE"
        });
      }

      if (req.method === "POST" && rest === "/change_instance_status") {
        const instanceId = String(req.body?.instanceId || req.body?.id || '').trim();
        if (!instanceId) return res.status(400).json({ success: false, message: 'instanceId is required' });
        return proxyTo(req, res, {
          baseUrl: API_ROUTER_CONFIG.integrationsServiceBaseUrl,
          targetPath: `/v1/integrations/whatsapp/status/${encodeURIComponent(instanceId)}`,
          method: "GET"
        });
      }

      return notImplemented(res, {
        module,
        method: req.method,
        path: rest,
        hint: "Implemented: gen_qr, get_all, del_instance, change_instance_status",
      });
    }

    if (module === "telegram") {
      if (req.method === "POST" && rest === "/send_otp") {
        return proxyTo(req, res, {
          baseUrl: API_ROUTER_CONFIG.integrationsServiceBaseUrl,
          targetPath: "/v1/integrations/telegram/send-otp"
        });
      }

      if (req.method === "POST" && rest === "/verify_otp") {
        return proxyTo(req, res, {
          baseUrl: API_ROUTER_CONFIG.integrationsServiceBaseUrl,
          targetPath: "/v1/integrations/telegram/verify-otp"
        });
      }

      if (req.method === "GET" && rest === "/sessions") {
        return proxyTo(req, res, {
          baseUrl: API_ROUTER_CONFIG.integrationsServiceBaseUrl,
          targetPath: "/v1/integrations/telegram/sessions"
        });
      }

      if ((req.method === "GET" || req.method === "DELETE") && /^\/delete_session\/[^/]+$/.test(rest)) {
        const sessionId = rest.split("/")[2];
        return proxyTo(req, res, {
          baseUrl: API_ROUTER_CONFIG.integrationsServiceBaseUrl,
          targetPath: `/v1/integrations/telegram/sessions/${encodeURIComponent(sessionId)}`,
          method: "DELETE"
        });
      }

      return notImplemented(res, {
        module,
        method: req.method,
        path: rest,
        hint: "Implemented: send_otp, verify_otp, sessions, delete_session/:sessionId",
      });
    }

    if (module === "chat_flow") {
      if (req.method === "POST" && rest === "/insert_flow_beta") {
        return proxyTo(req, res, {
          baseUrl: API_ROUTER_CONFIG.organizationServiceBaseUrl,
          targetPath: "/v1/compat/chat_flow/insert_flow_beta",
        });
      }
      if (req.method === "GET" && rest === "/get_flows_beta") {
        return proxyTo(req, res, {
          baseUrl: API_ROUTER_CONFIG.organizationServiceBaseUrl,
          targetPath: "/v1/compat/chat_flow/get_flows_beta",
        });
      }
      return notImplemented(res, { module, method: req.method, path: rest, hint: "Implemented: insert_flow_beta, get_flows_beta" });
    }

    if (module === "chatbot") {
      if (req.method === "POST" && rest === "/add_beta_chatbot") {
        return proxyTo(req, res, {
          baseUrl: API_ROUTER_CONFIG.organizationServiceBaseUrl,
          targetPath: "/v1/compat/chatbot/add_beta_chatbot",
        });
      }
      return notImplemented(res, { module, method: req.method, path: rest, hint: "Implemented: add_beta_chatbot" });
    }

    if (module === "wa_call") {
      if (req.method === "POST" && rest === "/insert_flow") {
        return proxyTo(req, res, {
          baseUrl: API_ROUTER_CONFIG.organizationServiceBaseUrl,
          targetPath: "/v1/compat/wa_call/insert_flow",
        });
      }
      if (req.method === "POST" && rest === "/create_broadcast") {
        return proxyTo(req, res, {
          baseUrl: API_ROUTER_CONFIG.organizationServiceBaseUrl,
          targetPath: "/v1/compat/wa_call/create_broadcast",
        });
      }
      return notImplemented(res, { module, method: req.method, path: rest, hint: "Implemented: insert_flow, create_broadcast" });
    }

    if (module === "broadcast") {
      if (req.method === "POST" && rest === "/create_template_campaign") {
        return proxyTo(req, res, {
          baseUrl: API_ROUTER_CONFIG.organizationServiceBaseUrl,
          targetPath: "/v1/compat/broadcast/create_template_campaign",
        });
      }
      if (req.method === "GET" && rest === "/dashboard") {
        return proxyTo(req, res, {
          baseUrl: API_ROUTER_CONFIG.organizationServiceBaseUrl,
          targetPath: "/v1/compat/broadcast/dashboard",
        });
      }
      return notImplemented(res, { module, method: req.method, path: rest, hint: "Implemented: create_template_campaign, dashboard" });
    }

    if (module === "templet") {
      if (req.method === "POST" && rest === "/add_new") {
        return proxyTo(req, res, {
          baseUrl: API_ROUTER_CONFIG.organizationServiceBaseUrl,
          targetPath: "/v1/compat/templet/add_new",
        });
      }
      return notImplemented(res, { module, method: req.method, path: rest, hint: "Implemented: add_new" });
    }

    if (module === "inbox") {
      if (req.method === "GET" && rest === "/get_chats") {
        return proxyTo(req, res, {
          baseUrl: API_ROUTER_CONFIG.realtimeServiceBaseUrl,
          targetPath: withQuery(req, "/v1/inbox/get_chats")
        });
      }
      if (req.method === "POST" && rest === "/get_convo") {
        return proxyTo(req, res, {
          baseUrl: API_ROUTER_CONFIG.realtimeServiceBaseUrl,
          targetPath: "/v1/inbox/get_convo"
        });
      }
      if (req.method === "POST" && rest === "/send_text") {
        return proxyTo(req, res, {
          baseUrl: API_ROUTER_CONFIG.realtimeServiceBaseUrl,
          targetPath: "/v1/inbox/send_text"
        });
      }
      if (req.method === "POST" && rest === "/send_image") {
        return proxyTo(req, res, {
          baseUrl: API_ROUTER_CONFIG.realtimeServiceBaseUrl,
          targetPath: "/v1/inbox/send_image"
        });
      }
      return notImplemented(res, {
        module,
        method: req.method,
        path: rest,
        hint: "Implemented: get_chats, get_convo, send_text, send_image, webhook/:uid",
      });
    }

    if (module === "ai") {
      if (req.method === "POST" && rest === "/translate") {
        return proxyTo(req, res, {
          baseUrl: API_ROUTER_CONFIG.realtimeServiceBaseUrl,
          targetPath: "/v1/omni/ai/translate"
        });
      }
      if (req.method === "POST" && rest === "/suggest_reply") {
        return proxyTo(req, res, {
          baseUrl: API_ROUTER_CONFIG.realtimeServiceBaseUrl,
          targetPath: "/v1/omni/ai/suggest-reply"
        });
      }
      return notImplemented(res, {
        module,
        method: req.method,
        path: rest,
        hint: "Implemented: translate, suggest_reply",
      });
    }

    if (module === "agent") {
      if (req.method === "POST" && rest === "/add_agent") {
        return proxyTo(req, res, {
          baseUrl: API_ROUTER_CONFIG.realtimeServiceBaseUrl,
          targetPath: "/v1/agent/add_agent"
        });
      }

      if (req.method === "POST" && rest === "/update_agent_in_chat") {
        return proxyTo(req, res, {
          baseUrl: API_ROUTER_CONFIG.realtimeServiceBaseUrl,
          targetPath: "/v1/agent/update_agent_in_chat"
        });
      }

      if (req.method === "GET" && rest === "/get_my_assigned_chats") {
        return proxyTo(req, res, {
          baseUrl: API_ROUTER_CONFIG.realtimeServiceBaseUrl,
          targetPath: withQuery(req, "/v1/agent/get_my_assigned_chats")
        });
      }

      if (req.method === "GET" && rest === "/get_my_task") {
        return proxyTo(req, res, {
          baseUrl: API_ROUTER_CONFIG.realtimeServiceBaseUrl,
          targetPath: withQuery(req, "/v1/agent/get_my_task")
        });
      }

      if (req.method === "POST" && rest === "/create_task") {
        return proxyTo(req, res, {
          baseUrl: API_ROUTER_CONFIG.realtimeServiceBaseUrl,
          targetPath: "/v1/agent/create_task"
        });
      }

      if ((req.method === "PATCH" || req.method === "POST") && rest === "/update_task") {
        return proxyTo(req, res, {
          baseUrl: API_ROUTER_CONFIG.realtimeServiceBaseUrl,
          targetPath: "/v1/agent/update_task",
          method: "PATCH"
        });
      }

      if (req.method === "POST" && rest === "/complete_task") {
        return proxyTo(req, res, {
          baseUrl: API_ROUTER_CONFIG.realtimeServiceBaseUrl,
          targetPath: "/v1/agent/complete_task"
        });
      }

      if ((req.method === "DELETE" || req.method === "POST") && rest === "/delete_task") {
        return proxyTo(req, res, {
          baseUrl: API_ROUTER_CONFIG.realtimeServiceBaseUrl,
          targetPath: "/v1/agent/delete_task",
          method: "DELETE"
        });
      }

      return notImplemented(res, {
        module,
        method: req.method,
        path: rest,
        hint: "Implemented: add_agent, update_agent_in_chat, get_my_assigned_chats, get_my_task, create_task, update_task, complete_task, delete_task",
      });
    }

    if (module === "image-library") {
      if (req.method === "GET" && (rest === "" || rest === "/")) {
        return proxyTo(req, res, {
          baseUrl: API_ROUTER_CONFIG.integrationsServiceBaseUrl,
          targetPath: withQuery(req, "/v1/image-library"),
        });
      }

      if (req.method === "POST" && (rest === "" || rest === "/")) {
        return proxyTo(req, res, {
          baseUrl: API_ROUTER_CONFIG.integrationsServiceBaseUrl,
          targetPath: "/v1/image-library",
        });
      }

      if (req.method === "DELETE" && /^\/[^/]+$/.test(rest)) {
        const id = rest.slice(1);
        return proxyTo(req, res, {
          baseUrl: API_ROUTER_CONFIG.integrationsServiceBaseUrl,
          targetPath: `/v1/image-library/${id}`,
        });
      }
    }

    if (module === "billing") {
      if (req.method === "GET" && rest === "/graph") {
        const targetPath = withQuery(req, "/v1/odoo/billing/graph");
        return proxyTo(req, res, { baseUrl: API_ROUTER_CONFIG.odooIntegrationBaseUrl, targetPath });
      }

      if (req.method === "GET" && rest === "/summary") {
        const targetPath = withQuery(req, "/v1/odoo/billing/summary");
        return proxyTo(req, res, { baseUrl: API_ROUTER_CONFIG.odooIntegrationBaseUrl, targetPath });
      }

      if (req.method === "GET" && rest === "/invoices") {
        return proxyTo(req, res, { baseUrl: API_ROUTER_CONFIG.odooIntegrationBaseUrl, targetPath: withQuery(req, "/v1/odoo/invoices") });
      }

      if (req.method === "POST" && rest === "/invoices") {
        return proxyTo(req, res, { baseUrl: API_ROUTER_CONFIG.odooIntegrationBaseUrl, targetPath: "/v1/odoo/invoices" });
      }

      if (req.method === "GET" && /^\/invoices\/\d+$/.test(rest)) {
        const id = rest.split("/")[2];
        return proxyTo(req, res, { baseUrl: API_ROUTER_CONFIG.odooIntegrationBaseUrl, targetPath: `/v1/odoo/invoices/${id}` });
      }

      if (req.method === "PUT" && /^\/invoices\/\d+$/.test(rest)) {
        const id = rest.split("/")[2];
        return proxyTo(req, res, { baseUrl: API_ROUTER_CONFIG.odooIntegrationBaseUrl, targetPath: `/v1/odoo/invoices/${id}` });
      }

      if (req.method === "DELETE" && /^\/invoices\/\d+$/.test(rest)) {
        const id = rest.split("/")[2];
        return proxyTo(req, res, { baseUrl: API_ROUTER_CONFIG.odooIntegrationBaseUrl, targetPath: `/v1/odoo/invoices/${id}` });
      }

      if (req.method === "POST" && /^\/invoices\/\d+\/post$/.test(rest)) {
        const id = rest.split("/")[2];
        return proxyTo(req, res, { baseUrl: API_ROUTER_CONFIG.odooIntegrationBaseUrl, targetPath: `/v1/odoo/invoices/${id}/post` });
      }

      if (req.method === "GET" && /^\/invoices\/\d+\/download$/.test(rest)) {
        const id = rest.split("/")[2];
        return proxyTo(req, res, { baseUrl: API_ROUTER_CONFIG.odooIntegrationBaseUrl, targetPath: `/v1/odoo/invoices/${id}/download` });
      }

      if (req.method === "GET" && rest === "/magento/orders") {
        const query = new URLSearchParams(req.query as Record<string, string>);
        const result = await fetchMagentoOrders(req, query);
        return res.status(result.ok ? 200 : 502).json(result.ok ? result.data : { message: result.error });
      }

      if (req.method === "GET" && /^\/magento\/orders\/[^/]+$/.test(rest)) {
        return res.status(410).json({ message: "Magento integration is disabled." });
      }

      if (req.method === "GET" && /^\/magento\/customers\/[^/]+\/orders$/.test(rest)) {
        return res.status(410).json({ message: "Magento integration is disabled." });
      }

      if (req.method === "GET" && rest === "/reconciliation") {
        const [odooInvoicesRes, magentoOrdersRes] = await Promise.all([
          fetchUpstreamJsonSafe(req, toAbsoluteUrl(API_ROUTER_CONFIG.odooIntegrationBaseUrl, "/v1/odoo/invoices?page=1&pageSize=200")),
          fetchMagentoOrders(req, new URLSearchParams({ pageSize: "200", currentPage: "1" })),
        ]);
        const invoices = Array.isArray(odooInvoicesRes.data?.data) ? odooInvoicesRes.data.data : [];
        const magentoOrders = Array.isArray(magentoOrdersRes.data?.data?.items) ? magentoOrdersRes.data.data.items : [];
        const magentoByRef = new Map(magentoOrders.map((o: any) => [String(o?.increment_id ?? o?.entity_id ?? ""), o]));

        const rows = invoices.map((invoice: any) => {
          const invoiceRef = String(invoice?.invoice_origin ?? invoice?.ref ?? "");
          const order = invoiceRef ? magentoByRef.get(invoiceRef) : undefined;
          return {
            invoiceId: invoice?.id,
            invoiceNumber: invoice?.name,
            invoiceTotal: toNum(invoice?.amount_total),
            residual: toNum(invoice?.amount_residual),
            invoiceStatus: invoice?.state,
            paymentStatus: invoice?.payment_state,
            magentoOrderRef: invoiceRef || null,
            magentoOrderId: order?.entity_id ?? null,
            magentoGrandTotal: toNum(order?.grand_total ?? 0),
            matched: Boolean(order),
          };
        });

        return res.json({
          data: rows,
          meta: {
            matched: rows.filter((r: any) => r.matched).length,
            unmatched: rows.filter((r: any) => !r.matched).length,
          },
        });
      }

      if (req.method === "POST" && rest === "/reconciliation/link") {
        const invoiceIdRaw = req.body?.invoiceId;
        const magentoOrderRefRaw = req.body?.magentoOrderRef;
        const invoiceId = Number(invoiceIdRaw);
        const magentoOrderRef = String(magentoOrderRefRaw ?? "").trim();

        if (!Number.isFinite(invoiceId) || invoiceId <= 0) {
          return res.status(400).json({ message: "invoiceId is required and must be a positive number." });
        }
        if (!magentoOrderRef) {
          return res.status(400).json({ message: "magentoOrderRef is required." });
        }

        // Persist reconciliation marker directly on the Odoo invoice.
        // `invoice_origin` is commonly used to keep source document reference.
        const result = await odooWriteInvoice(req, invoiceId, {
          invoice_origin: magentoOrderRef,
          ref: `Magento ${magentoOrderRef}`,
        });

        return res.status(200).json({
          applied: true,
          invoiceId,
          magentoOrderRef,
          result,
        });
      }

      if (req.method === "POST" && rest === "/reconciliation/unlink") {
        const invoiceIdRaw = req.body?.invoiceId;
        const invoiceId = Number(invoiceIdRaw);

        if (!Number.isFinite(invoiceId) || invoiceId <= 0) {
          return res.status(400).json({ message: "invoiceId is required and must be a positive number." });
        }

        // Clear only the reconciliation reference fields.
        const result = await odooWriteInvoice(req, invoiceId, {
          invoice_origin: false,
          ref: false,
        });

        return res.status(200).json({
          applied: true,
          invoiceId,
          result,
        });
      }

      return notImplemented(res, {
        module,
        method: req.method,
        path: rest,
        hint: "Implemented: invoices CRUD/post/download, summary, magento orders, reconciliation",
      });
    }

    if (module === "invoice") {
      return res.status(410).json({
        message: "Deprecated billing compatibility module.",
        module,
        canonical: "/api/odoo/invoices",
      });
    }

    if (module === "booking") {
      if (["PATCH", "DELETE"].includes(req.method) && /^\/booking-types\/[^/]+$/.test(rest)) {
        return proxyTo(req, res, { baseUrl: API_ROUTER_CONFIG.bookingServiceBaseUrl, targetPath: `/v1${rest}` });
      }
      if (req.method === "PATCH" && /^\/appointments\/[^/]+$/.test(rest)) {
        return proxyTo(req, res, { baseUrl: API_ROUTER_CONFIG.bookingServiceBaseUrl, targetPath: `/v1${rest}` });
      }

      if (req.method === "GET" && rest === "/booking-types") return proxyTo(req, res, { baseUrl: API_ROUTER_CONFIG.bookingServiceBaseUrl, targetPath: "/v1/booking-types" });
      if (req.method === "GET" && /^\/booking-types\/[^/]+$/.test(rest)) {
        const bookingTypeIdOrLink = rest.split("/")[2];
        return proxyTo(req, res, {
          baseUrl: API_ROUTER_CONFIG.bookingServiceBaseUrl,
          targetPath: `/v1/booking-types/${encodeURIComponent(bookingTypeIdOrLink)}`,
        });
      }
      if (req.method === "GET" && /^\/public\/booking-types\/[^/]+$/.test(rest)) {
        const bookingTypeLink = rest.split("/")[3];
        return proxyTo(req, res, {
          baseUrl: API_ROUTER_CONFIG.bookingServiceBaseUrl,
          targetPath: `/v1/booking-types/${encodeURIComponent(bookingTypeLink)}`,
        });
      }
      if (req.method === "POST" && rest === "/booking-types") return proxyTo(req, res, { baseUrl: API_ROUTER_CONFIG.bookingServiceBaseUrl, targetPath: "/v1/booking-types" });
      if (req.method === "GET" && rest === "/appointments") return proxyTo(req, res, { baseUrl: API_ROUTER_CONFIG.bookingServiceBaseUrl, targetPath: "/v1/appointments" });
      if (req.method === "POST" && rest === "/appointments") return proxyTo(req, res, { baseUrl: API_ROUTER_CONFIG.bookingServiceBaseUrl, targetPath: "/v1/appointments" });
      if (req.method === "POST" && rest === "/appointments/user") return proxyTo(req, res, { baseUrl: API_ROUTER_CONFIG.bookingServiceBaseUrl, targetPath: "/v1/appointments/public" });
      if (req.method === "GET" && rest === "/available-slots") return proxyTo(req, res, { baseUrl: API_ROUTER_CONFIG.bookingServiceBaseUrl, targetPath: `/v1/appointments/available-slots?${new URLSearchParams(req.query as any).toString()}` });
      if (req.method === "DELETE" && rest.startsWith("/appointments/")) {
        const id = rest.split("/").pop();
        return proxyTo(req, res, { baseUrl: API_ROUTER_CONFIG.bookingServiceBaseUrl, targetPath: `/v1/appointments/${id}` });
      }
      return notImplemented(res, { module, method: req.method, path: rest, hint: "booking-types & appointments" });
    }

    if (module === "calendar") {
      const odooCalendarBase = API_ROUTER_CONFIG.odooIntegrationBaseUrl;
      const bookingBase = API_ROUTER_CONFIG.bookingServiceBaseUrl;
      const query = new URLSearchParams(req.query as Record<string, string>).toString();
      const withQuery = (path: string) => (query ? `${path}?${query}` : path);

      if (req.method === "GET" && rest === "/summary") {
        return proxyTo(req, res, { baseUrl: odooCalendarBase, targetPath: withQuery("/v1/odoo/calendar/summary") });
      }

      if (req.method === "GET" && rest === "/events") {
        return proxyTo(req, res, { baseUrl: odooCalendarBase, targetPath: withQuery("/v1/odoo/calendar/events") });
      }
      if (req.method === "POST" && rest === "/events") {
        return proxyTo(req, res, { baseUrl: odooCalendarBase, targetPath: "/v1/odoo/calendar/events" });
      }
      if (req.method === "GET" && /^\/events\/[^/]+$/.test(rest)) {
        const id = rest.split("/")[2];
        return proxyTo(req, res, { baseUrl: odooCalendarBase, targetPath: `/v1/odoo/calendar/events/${id}` });
      }
      if (req.method === "PATCH" && /^\/events\/[^/]+$/.test(rest)) {
        const id = rest.split("/")[2];
        return proxyTo(req, res, { baseUrl: odooCalendarBase, targetPath: `/v1/odoo/calendar/events/${id}` });
      }
      if (req.method === "DELETE" && /^\/events\/[^/]+$/.test(rest)) {
        const id = rest.split("/")[2];
        return proxyTo(req, res, { baseUrl: odooCalendarBase, targetPath: `/v1/odoo/calendar/events/${id}` });
      }
      if (req.method === "POST" && /^\/events\/[^/]+\/cancel$/.test(rest)) {
        const id = rest.split("/")[2];
        return proxyTo(req, res, { baseUrl: odooCalendarBase, targetPath: `/v1/odoo/calendar/events/${id}/cancel` });
      }
      if (req.method === "POST" && /^\/events\/[^/]+\/complete$/.test(rest)) {
        const id = rest.split("/")[2];
        return proxyTo(req, res, { baseUrl: odooCalendarBase, targetPath: `/v1/odoo/calendar/events/${id}/complete` });
      }
      if (req.method === "POST" && /^\/events\/[^/]+\/respond$/.test(rest)) {
        const id = rest.split("/")[2];
        return proxyTo(req, res, { baseUrl: odooCalendarBase, targetPath: `/v1/odoo/calendar/events/${id}/respond` });
      }

      if (req.method === "GET" && rest === "/availability") {
        return proxyTo(req, res, { baseUrl: bookingBase, targetPath: withQuery("/v1/availability") });
      }
      if (req.method === "POST" && rest === "/availability") {
        return proxyTo(req, res, { baseUrl: bookingBase, targetPath: "/v1/availability" });
      }
      if (req.method === "PATCH" && /^\/availability\/[^/]+$/.test(rest)) {
        const id = rest.split("/")[2];
        return proxyTo(req, res, { baseUrl: bookingBase, targetPath: `/v1/availability/${id}` });
      }
      if (req.method === "DELETE" && /^\/availability\/[^/]+$/.test(rest)) {
        const id = rest.split("/")[2];
        return proxyTo(req, res, { baseUrl: bookingBase, targetPath: `/v1/availability/${id}` });
      }
      if (req.method === "GET" && rest === "/available-slots") {
        if (req.query?.bookingTypeId && req.query?.date) {
          return proxyTo(req, res, { baseUrl: bookingBase, targetPath: withQuery("/v1/appointments/available-slots") });
        }
        return proxyTo(req, res, { baseUrl: odooCalendarBase, targetPath: withQuery("/v1/odoo/calendar/available-slots") });
      }

      if (req.method === "GET" && rest === "/booking-links") {
        return proxyTo(req, res, { baseUrl: odooCalendarBase, targetPath: withQuery("/v1/odoo/calendar/booking-links") });
      }
      if (req.method === "POST" && rest === "/booking-links") {
        return proxyTo(req, res, { baseUrl: odooCalendarBase, targetPath: "/v1/odoo/calendar/booking-links" });
      }
      if (req.method === "GET" && /^\/booking-links\/[^/]+$/.test(rest)) {
        const id = rest.split("/")[2];
        return proxyTo(req, res, { baseUrl: odooCalendarBase, targetPath: `/v1/odoo/calendar/booking-links/${id}` });
      }
      if (req.method === "PATCH" && /^\/booking-links\/[^/]+$/.test(rest)) {
        const id = rest.split("/")[2];
        return proxyTo(req, res, { baseUrl: odooCalendarBase, targetPath: `/v1/odoo/calendar/booking-links/${id}` });
      }
      if (req.method === "DELETE" && /^\/booking-links\/[^/]+$/.test(rest)) {
        const id = rest.split("/")[2];
        return proxyTo(req, res, { baseUrl: odooCalendarBase, targetPath: `/v1/odoo/calendar/booking-links/${id}` });
      }
      if (req.method === "GET" && /^\/booking-links\/[^/]+\/slots$/.test(rest)) {
        const id = rest.split("/")[2];
        const bookingTypeId = String(req.query?.bookingTypeId || id);
        const qs = new URLSearchParams({ ...(req.query as Record<string, string>), bookingTypeId }).toString();
        return proxyTo(req, res, { baseUrl: bookingBase, targetPath: `/v1/appointments/available-slots?${qs}` });
      }

      if (req.method === "GET" && rest === "/reminders") {
        return proxyTo(req, res, { baseUrl: odooCalendarBase, targetPath: withQuery("/v1/odoo/calendar/reminders") });
      }
      if (req.method === "POST" && rest === "/reminders") {
        return proxyTo(req, res, { baseUrl: odooCalendarBase, targetPath: "/v1/odoo/calendar/reminders" });
      }
      if (req.method === "PATCH" && /^\/reminders\/[^/]+$/.test(rest)) {
        const id = rest.split("/")[2];
        return proxyTo(req, res, { baseUrl: odooCalendarBase, targetPath: `/v1/odoo/calendar/reminders/${id}` });
      }
      if (req.method === "DELETE" && /^\/reminders\/[^/]+$/.test(rest)) {
        const id = rest.split("/")[2];
        return proxyTo(req, res, { baseUrl: odooCalendarBase, targetPath: `/v1/odoo/calendar/reminders/${id}` });
      }

      if (req.method === "GET" && rest === "/settings") {
        return proxyTo(req, res, { baseUrl: odooCalendarBase, targetPath: "/v1/odoo/calendar/settings" });
      }
      if (req.method === "PATCH" && rest === "/settings") {
        return proxyTo(req, res, { baseUrl: odooCalendarBase, targetPath: "/v1/odoo/calendar/settings" });
      }

      return notImplemented(res, { module, method: req.method, path: rest, hint: "calendar events implemented; advanced features return unavailable if not supported" });
    }


    if (module === "scoring") {
      if (req.method === "GET" && (rest === "/models" || rest === "/hot-leads")) {
        const query = new URLSearchParams(req.query as Record<string, string>).toString();
        const targetPath = rest === "/models"
          ? "/api/v1/scoring/models"
          : `/api/v1/scoring/leads/hot${query ? `?${query}` : ""}`;
        return proxyTo(req, res, { baseUrl: API_ROUTER_CONFIG.scoringServiceBaseUrl, targetPath });
      }

      if (req.method === "POST" && rest === "/models") {
        return proxyTo(req, res, { baseUrl: API_ROUTER_CONFIG.scoringServiceBaseUrl, targetPath: "/api/v1/scoring/models" });
      }

      if (req.method === "POST" && rest === "/calculate") {
        return proxyTo(req, res, { baseUrl: API_ROUTER_CONFIG.scoringServiceBaseUrl, targetPath: "/api/v1/scoring/calculate" });
      }

      if (req.method === "POST" && rest === "/sync") {
        return proxyTo(req, res, { baseUrl: API_ROUTER_CONFIG.scoringServiceBaseUrl, targetPath: "/api/v1/scoring/sync" });
      }

      if (req.method === "POST" && rest.startsWith("/sync/contacts/")) {
        const contactId = rest.split("/").pop();
        return proxyTo(req, res, { baseUrl: API_ROUTER_CONFIG.scoringServiceBaseUrl, targetPath: `/api/v1/scoring/sync/contacts/${contactId}` });
      }

      if (req.method === "GET" && rest.startsWith("/contacts/") && rest.endsWith("/score")) {
        const contactId = rest.split("/")[2];
        const query = new URLSearchParams(req.query as Record<string, string>).toString();
        const targetPath = query
          ? `/api/v1/scoring/contacts/${contactId}/score?${query}`
          : `/api/v1/scoring/contacts/${contactId}/score`;
        return proxyTo(req, res, { baseUrl: API_ROUTER_CONFIG.scoringServiceBaseUrl, targetPath });
      }

      return notImplemented(res, {
        module,
        method: req.method,
        path: rest,
        hint: "Implemented: GET /models, POST /models, POST /calculate, POST /sync, POST /sync/contacts/:contactId, GET /contacts/:contactId/score, GET /hot-leads"
      });
    }

    if (module === "business") {
      return res.status(410).json({
        message: "Deprecated business-report compatibility module.",
        module,
        canonical: "/api/odoo/invoices (derive reporting from Odoo data)",
      });
    }

    if (module === "lead") {
      if (req.method === "GET" && rest === "/hot") {
        const query = new URLSearchParams(req.query as Record<string, string>).toString();
        const targetPath = query
          ? `/api/v1/scoring/leads/hot?${query}`
          : "/api/v1/scoring/leads/hot";
        return proxyTo(req, res, { baseUrl: API_ROUTER_CONFIG.scoringServiceBaseUrl, targetPath });
      }

      if (req.method === "GET" && rest.startsWith("/score/")) {
        const contactId = rest.split("/").pop();
        const query = new URLSearchParams(req.query as Record<string, string>).toString();
        const targetPath = query
          ? `/api/v1/scoring/contacts/${contactId}/score?${query}`
          : `/api/v1/scoring/contacts/${contactId}/score`;
        return proxyTo(req, res, { baseUrl: API_ROUTER_CONFIG.scoringServiceBaseUrl, targetPath });
      }

      return notImplemented(res, {
        module,
        method: req.method,
        path: rest,
        hint: "Implemented: GET /hot, GET /score/:contactId"
      });
    }

    if (module === "finance-category") {
      return proxyTo(req, res, { baseUrl: API_ROUTER_CONFIG.financeServiceBaseUrl, targetPath: withQuery(req, `/api/finance-category${rest}`) });
    }

    if (module === "finance-dashboard") {
      return proxyTo(req, res, { baseUrl: API_ROUTER_CONFIG.financeServiceBaseUrl, targetPath: withQuery(req, `/api/finance-dashboard${rest}`) });
    }

    if (module === "finance-kanban") {
      return proxyTo(req, res, { baseUrl: API_ROUTER_CONFIG.financeServiceBaseUrl, targetPath: withQuery(req, `/api/finance-kanban${rest}`) });
    }

    if (module === "super-admin-finance") {
      return proxyTo(req, res, { baseUrl: API_ROUTER_CONFIG.financeServiceBaseUrl, targetPath: withQuery(req, `/api/super-admin-finance${rest}`) });
    }

    if (module === "sales-dashboard") {
      const odooOrdersUrl = toAbsoluteUrl(API_ROUTER_CONFIG.odooIntegrationBaseUrl, "/v1/odoo/sales/orders?pageSize=100&page=1");
      const crmQuery = new URLSearchParams(req.query as Record<string, string>);
      if (!crmQuery.has("pageSize")) crmQuery.set("pageSize", "100");
      if (!crmQuery.has("page")) crmQuery.set("page", "1");
      const odooCrmUrl = toAbsoluteUrl(API_ROUTER_CONFIG.odooIntegrationBaseUrl, `/v1/odoo/crm?${crmQuery.toString()}`);
      const normalizeSalesStage = (rawStage: unknown): string => {
        const raw =
          typeof rawStage === "object" && rawStage !== null
            ? (rawStage as any).status ?? (rawStage as any).name ?? ""
            : rawStage;
        const s = String(raw ?? "").toLowerCase();
        if (!s) return "new";
        if (s.includes("qual")) return "qualified";
        if (s.includes("prop") || s.includes("quote")) return "proposal";
        if (s.includes("nego")) return "negotiation";
        if (s.includes("won")) return "won";
        if (s.includes("lost")) return "lost";
        if (s.includes("new")) return "new";
        return "new";
      };
      const stageIdOf = (lead: any) => Number(lead?.stageId ?? lead?.stage?.id ?? (Array.isArray(lead?.stage_id) ? lead.stage_id[0] : 0)) || undefined;
      const stageLabelOf = (lead: any) => lead?.stageName ?? lead?.stage?.name ?? (Array.isArray(lead?.stage_id) ? lead.stage_id[1] : "");
      const partnerNameOf = (lead: any) => lead?.customerName ?? lead?.companyName ?? lead?.partner?.name ?? (Array.isArray(lead?.partner_id) ? lead.partner_id[1] : "");
      const normalizeOpportunityRow = (lead: any) => {
        const expectedRevenue = Number(lead?.expectedRevenue ?? lead?.expected_revenue ?? lead?.planned_revenue ?? 0);
        const probability = Number(lead?.probability ?? 0);
        const stage = normalizeSalesStage(lead?.stageStatus ?? lead?.status ?? lead?.stage ?? stageLabelOf(lead));
        const nextActivityTitle = String(lead?.nextActivity?.title ?? lead?.nextActivity?.summary ?? lead?.activity_summary ?? "").trim();
        const nextActivityDueDate = String(lead?.nextActivity?.dueDate ?? lead?.nextActivity?.deadline ?? lead?.activity_date_deadline ?? "").trim();

        return {
          id: String(lead?.id ?? lead?.odooId ?? ""),
          odooId: Number(lead?.odooId ?? lead?.id ?? 0) || undefined,
          name: String(lead?.name ?? "Untitled opportunity"),
          customerName: String(partnerNameOf(lead)),
          companyName: String(lead?.companyName ?? partnerNameOf(lead)),
          email: String(lead?.email ?? lead?.email_from ?? ""),
          phone: String(lead?.phone ?? ""),
          stage,
          stageId: stageIdOf(lead),
          probability,
          expectedRevenue,
          weightedValue: Number(lead?.weightedValue ?? (expectedRevenue * probability) / 100),
          recurringRevenue: Number(lead?.recurringRevenue ?? lead?.recurring_revenue_monthly ?? 0) || undefined,
          assignedTo: String(lead?.assignedTo ?? lead?.user?.name ?? (Array.isArray(lead?.user_id) ? lead.user_id[1] : "")),
          priority: String(lead?.priority ?? "medium"),
          source: String(lead?.source ?? (String(lead?.type ?? "").toLowerCase() === "lead" ? "manual" : "odoo")),
          status: stage,
          expectedCloseDate: String(lead?.expectedCloseDate ?? lead?.expectedClose ?? lead?.date_deadline ?? ""),
          createdAt: String(lead?.createdAt ?? lead?.create_date ?? ""),
          updatedAt: String(lead?.updatedAt ?? lead?.write_date ?? ""),
          nextActivity: nextActivityTitle || nextActivityDueDate ? {
            id: String(lead?.nextActivity?.id ?? lead?.nextActivity?.odooId ?? `lead-${String(lead?.id ?? "")}-next-activity`),
            type: String(lead?.nextActivity?.type ?? (Array.isArray(lead?.activity_type_id) ? lead.activity_type_id[1] : "todo")).toLowerCase(),
            title: nextActivityTitle || "Follow-up",
            dueDate: nextActivityDueDate || undefined,
            state: lead?.nextActivity?.state ?? lead?.activity_state ?? "planned",
            overdue: (lead?.nextActivity?.overdue ?? lead?.activity_state === "overdue") === true,
          } : undefined,
          linkedMagentoOrderIds: Array.isArray(lead?.linkedMagentoOrderIds) ? lead.linkedMagentoOrderIds : [],
        };
      };

      if (req.method === "GET" && rest === "/summary") {
        const [magentoRes, odooRes, crmRes] = await Promise.all([
          fetchMagentoOrders(req, new URLSearchParams({ pageSize: "100", currentPage: "1" })),
          fetchUpstreamJsonSafe(req, odooOrdersUrl),
          fetchUpstreamJsonSafe(req, odooCrmUrl),
        ]);

        const magentoItems = Array.isArray(magentoRes.data?.data?.items) ? magentoRes.data.data.items : [];
        const odooItems = Array.isArray(odooRes.data?.data) ? odooRes.data.data : [];
        const crmItems = Array.isArray(crmRes.data?.data) ? crmRes.data.data : [];

        const magentoRevenue = magentoItems.reduce((sum: number, order: any) => sum + Number(order?.grand_total ?? 0), 0);
        const odooRevenue = odooItems.reduce((sum: number, order: any) => sum + Number(order?.amount_total ?? 0), 0);

        const totalOrders = magentoItems.length + odooItems.length;
        const totalRevenue = magentoRevenue + odooRevenue;
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        const hotLeads = crmItems.filter((lead: any) => Number(lead?.probability ?? 0) >= 70).length;
        const opportunities = crmItems.length;

        return res.json({
          data: {
            totalOrders,
            totalRevenue,
            avgOrderValue,
            hotLeads,
            opportunities,
            sources: {
              magentoOrders: magentoItems.length,
              odooOrders: odooItems.length,
            },
            upstream: {
              magento: { ok: magentoRes.ok, error: magentoRes.error },
              odooSales: { ok: odooRes.ok, error: odooRes.error },
              odooCrm: { ok: crmRes.ok, error: crmRes.error },
            },
          },
        });
      }

      if (req.method === "GET" && rest === "/orders") {
        const [magentoRes, odooRes] = await Promise.all([
          fetchMagentoOrders(req, new URLSearchParams({ pageSize: "100", currentPage: "1" })),
          fetchUpstreamJsonSafe(req, odooOrdersUrl),
        ]);

        const magentoItems = Array.isArray(magentoRes.data?.data?.items) ? magentoRes.data.data.items : [];
        const odooItems = Array.isArray(odooRes.data?.data) ? odooRes.data.data : [];

        const normalizedMagento = magentoItems.map((order: any) => ({
          id: String(order?.entity_id ?? order?.increment_id ?? ""),
          ref: String(order?.increment_id ?? order?.entity_id ?? ""),
          customer: String(order?.customer_firstname && order?.customer_lastname
            ? `${order.customer_firstname} ${order.customer_lastname}`
            : order?.customer_email ?? "Magento Customer"),
          amount: Number(order?.grand_total ?? 0),
          status: String(order?.status ?? "unknown"),
          date: String(order?.created_at ?? ""),
          source: "magento",
        }));

        const normalizedOdoo = odooItems.map((order: any) => ({
          id: String(order?.id ?? ""),
          ref: String(order?.name ?? order?.id ?? ""),
          customer: String(Array.isArray(order?.partner_id) ? order.partner_id[1] : "Odoo Customer"),
          amount: Number(order?.amount_total ?? 0),
          status: String(order?.state ?? "unknown"),
          date: String(order?.date_order ?? ""),
          source: "odoo",
        }));

        const rows = [...normalizedMagento, ...normalizedOdoo]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return res.json({
          data: rows,
          meta: {
            upstream: {
              magento: { ok: magentoRes.ok, error: magentoRes.error },
              odooSales: { ok: odooRes.ok, error: odooRes.error },
            },
          },
        });
      }

      if (req.method === "GET" && rest === "/leads") {
        const crmRes = await fetchUpstreamJsonSafe(req, odooCrmUrl);
        const crmItems = Array.isArray(crmRes.data?.data) ? crmRes.data.data : [];
        const rows = crmItems.map((lead: any) => ({
          id: String(lead?.id ?? ""),
          name: String(lead?.name ?? "Unnamed lead"),
          stage: String(stageLabelOf(lead) || "Unstaged"),
          priority: Number(lead?.probability ?? 0) >= 70 ? "high" : "normal",
          expectedRevenue: Number(lead?.expectedRevenue ?? lead?.expected_revenue ?? lead?.planned_revenue ?? 0),
          type: String(lead?.type ?? "opportunity"),
          email: String(lead?.email ?? lead?.email_from ?? ""),
          phone: String(lead?.phone ?? ""),
        }));
        return res.json({
          data: rows,
          meta: {
            upstream: {
              odooCrm: { ok: crmRes.ok, error: crmRes.error },
            },
          },
        });
      }

      if (req.method === "GET" && /^\/opportunities\/\d+\/timeline$/.test(rest)) {
        const id = rest.split("/")[2];
        const targetPath = `/v1/odoo/crm/${id}/timeline`;
        return proxyTo(req, res, { baseUrl: API_ROUTER_CONFIG.odooIntegrationBaseUrl, targetPath });
      }

      if (req.method === "GET" && rest === "/opportunities") {
        const crmRes = await fetchUpstreamJsonSafe(req, odooCrmUrl);
        const crmItems = Array.isArray(crmRes.data?.data) ? crmRes.data.data : [];
        const rows = crmItems.map(normalizeOpportunityRow);

        return res.json({
          data: rows,
          meta: {
            upstream: {
              odooCrm: { ok: crmRes.ok, error: crmRes.error },
            },
          },
        });
      }

      if (req.method === "GET" && rest === "/activities") {
        const activityUrl = toAbsoluteUrl(API_ROUTER_CONFIG.odooIntegrationBaseUrl, withQuery(req, "/v1/odoo/crm/activities"));
        const crmRes = await fetchUpstreamJsonSafe(req, activityUrl);
        const crmItems = Array.isArray(crmRes.data?.data) ? crmRes.data.data : Array.isArray(crmRes.data) ? crmRes.data : [];

        const rows = crmItems
          .filter((activity: any) => String(activity?.summary ?? "").trim() || String(activity?.date_deadline ?? "").trim())
          .map((activity: any) => {
            const activityType = String(Array.isArray(activity?.activity_type_id) ? activity.activity_type_id[1] : "todo").toLowerCase();
            const dueDate = String(activity?.date_deadline ?? "").trim();
            const isDone = String(activity?.state ?? "").toLowerCase() === "done";
            return {
              id: String(activity?.id ?? ""),
              opportunityId: String(activity?.res_id ?? ""),
              type: activityType.includes("mail")
                ? "email"
                : activityType.includes("call")
                  ? "call"
                  : activityType.includes("meet")
                    ? "meeting"
                    : "todo",
              title: String(activity?.summary ?? "Follow-up"),
              dueDate: dueDate || undefined,
              completed: isDone,
              createdAt: String(activity?.create_date ?? ""),
            };
          });

        return res.json({
          data: rows,
          meta: {
            upstream: {
              odooCrm: { ok: crmRes.ok, error: crmRes.error },
            },
          },
        });
      }

      if (req.method === "GET" && rest === "/analytics") {
        const [magentoRes, odooRes, crmRes] = await Promise.all([
          fetchMagentoOrders(req, new URLSearchParams({ pageSize: "100", currentPage: "1" })),
          fetchUpstreamJsonSafe(req, odooOrdersUrl),
          fetchUpstreamJsonSafe(req, odooCrmUrl),
        ]);

        const magentoItems = Array.isArray(magentoRes.data?.data?.items) ? magentoRes.data.data.items : [];
        const odooItems = Array.isArray(odooRes.data?.data) ? odooRes.data.data : [];
        const crmItems = Array.isArray(crmRes.data?.data) ? crmRes.data.data : [];

        const allOrders = [
          ...magentoItems.map((order: any) => ({
            amount: Number(order?.grand_total ?? 0),
            date: String(order?.created_at ?? ""),
            source: "magento",
          })),
          ...odooItems.map((order: any) => ({
            amount: Number(order?.amount_total ?? 0),
            date: String(order?.date_order ?? ""),
            source: "odoo",
          })),
        ].filter((item) => Number.isFinite(item.amount));

        const revenueByMonth = new Map<string, number>();
        allOrders.forEach((order) => {
          const d = order.date ? new Date(order.date) : null;
          if (!d || Number.isNaN(d.getTime())) return;
          const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
          revenueByMonth.set(key, (revenueByMonth.get(key) ?? 0) + order.amount);
        });
        const revenueCategories = Array.from(revenueByMonth.keys()).sort();
        const revenueValues = revenueCategories.map((k) => Number(revenueByMonth.get(k)?.toFixed(2) ?? 0));

        const stageBuckets = new Map<string, { value: number; count: number }>();
        crmItems.forEach((lead: any) => {
          const stage = normalizeSalesStage(lead?.stageStatus ?? lead?.status ?? lead?.stage ?? stageLabelOf(lead));
          const value = Number(lead?.expectedRevenue ?? lead?.expected_revenue ?? lead?.planned_revenue ?? 0);
          const current = stageBuckets.get(stage) ?? { value: 0, count: 0 };
          current.value += Number.isFinite(value) ? value : 0;
          current.count += 1;
          stageBuckets.set(stage, current);
        });
        const stageOrder = ["new", "qualified", "proposal", "negotiation", "won", "lost"];
        const pipelineByStage = stageOrder
          .filter((stage) => stageBuckets.has(stage))
          .map((stage) => {
            const bucket = stageBuckets.get(stage)!;
            return { stage, value: Number(bucket.value.toFixed(2)), count: bucket.count };
          });

        const leadsCount = crmItems.filter((lead: any) => String(lead?.type ?? "").toLowerCase() === "lead").length;
        const opportunitiesCount = crmItems.length;
        const ordersCount = allOrders.length;

        const sourceBreakdown = [
          { source: "magento", value: magentoItems.length },
          { source: "odoo", value: odooItems.length },
        ];

        const wonCount = pipelineByStage.find((item) => item.stage === "won")?.count ?? 0;
        const lostCount = pipelineByStage.find((item) => item.stage === "lost")?.count ?? 0;

        return res.json({
          data: {
            revenueTrend: {
              categories: revenueCategories,
              series: [{ name: "Revenue", data: revenueValues }],
            },
            pipelineByStage,
            funnel: [
              { label: "Leads", value: leadsCount },
              { label: "Opportunities", value: opportunitiesCount },
              { label: "Orders", value: ordersCount },
            ],
            sourceBreakdown,
            winLoss: [
              { label: "Won", value: wonCount },
              { label: "Lost", value: lostCount },
            ],
          },
          meta: {
            upstream: {
              magento: { ok: magentoRes.ok, error: magentoRes.error },
              odooSales: { ok: odooRes.ok, error: odooRes.error },
              odooCrm: { ok: crmRes.ok, error: crmRes.error },
            },
          },
        });
      }

      if (req.method === "POST" && rest === "/opportunities") {
        return proxyTo(req, res, { baseUrl: API_ROUTER_CONFIG.odooIntegrationBaseUrl, targetPath: "/v1/odoo/crm" });
      }

      if (req.method === "PATCH" && /^\/opportunities\/[^/]+$/.test(rest)) {
        const id = rest.split("/")[2];
        return proxyTo(req, res, { baseUrl: API_ROUTER_CONFIG.odooIntegrationBaseUrl, targetPath: `/v1/odoo/crm/${id}`, method: "PUT" });
      }

      if (req.method === "DELETE" && /^\/opportunities\/[^/]+$/.test(rest)) {
        const id = rest.split("/")[2];
        return proxyTo(req, res, { baseUrl: API_ROUTER_CONFIG.odooIntegrationBaseUrl, targetPath: `/v1/odoo/crm/${id}` });
      }

      if (req.method === "GET" && /^\/opportunities\/[^/]+\/timeline$/.test(rest)) {
        const id = rest.split("/")[2];
        return proxyTo(req, res, {
          baseUrl: API_ROUTER_CONFIG.odooIntegrationBaseUrl,
          targetPath: `/v1/odoo/crm/${id}/timeline`,
        });
      }

      if (req.method === "PATCH" && /^\/opportunities\/[^/]+\/stage$/.test(rest)) {
        const id = rest.split("/")[2];
        const { stage, stageId } = req.body || {};

        if (stageId) {
          return proxyTo(req, res, {
            baseUrl: API_ROUTER_CONFIG.odooIntegrationBaseUrl,
            targetPath: `/v1/odoo/crm/${id}`,
            method: "PUT",
            body: { stage_id: Number(stageId) },
          });
        }

        const nextStage = String(stage || "").toLowerCase();
        // Fetch Odoo stages to find the one matching our label
        const stagesRes = await fetchUpstreamJsonSafe(req, toAbsoluteUrl(API_ROUTER_CONFIG.odooIntegrationBaseUrl, "/v1/odoo/crm/stages"));
        const stages = Array.isArray(stagesRes.data) ? stagesRes.data : [];

        const targetStage = nextStage === "won"
          ? stages.find((s: any) => s?.is_won === true) ?? stages.find((s: any) => String(s.name).toLowerCase().includes("won"))
          : stages.find((s: any) => {
          const label = String(s.name).toLowerCase();
          if (nextStage === "new" && label.includes("new")) return true;
          if (nextStage === "qualified" && label.includes("qual")) return true;
          if (nextStage === "proposal" && (label.includes("prop") || label.includes("quote"))) return true;
          if (nextStage === "negotiation" && label.includes("nego")) return true;
          if (nextStage === "lost" && label.includes("lost")) return true;
          return false;
        });

        if (!targetStage) {
          if (nextStage === "lost") {
            return proxyTo(req, res, {
              baseUrl: API_ROUTER_CONFIG.odooIntegrationBaseUrl,
              targetPath: `/v1/odoo/crm/${id}`,
              method: "PUT",
              body: { active: false },
            });
          }
          return res.status(400).json({ message: `Could not find Odoo stage for label: ${nextStage}` });
        }

        return proxyTo(req, res, {
          baseUrl: API_ROUTER_CONFIG.odooIntegrationBaseUrl,
          targetPath: `/v1/odoo/crm/${id}`,
          method: "PUT",
          body: { stage_id: targetStage.id },
        });
      }

      if (req.method === "POST" && /^\/opportunities\/[^/]+\/activities$/.test(rest)) {
        const id = rest.split("/")[2];
        return proxyTo(req, res, {
          baseUrl: API_ROUTER_CONFIG.odooIntegrationBaseUrl,
          targetPath: "/v1/odoo/crm/activities",
          body: { ...req.body, res_id: Number(id) },
        });
      }

      if (req.method === "PATCH" && /^\/activities\/[^/]+\/complete$/.test(rest)) {
        const id = rest.split("/")[2];
        return proxyTo(req, res, {
          baseUrl: API_ROUTER_CONFIG.odooIntegrationBaseUrl,
          targetPath: `/v1/odoo/crm/activities/${id}/complete`,
          method: "POST",
        });
      }

      if (req.method === "POST" && /^\/opportunities\/[^/]+\/notes$/.test(rest)) {
        const id = rest.split("/")[2];
        return proxyTo(req, res, {
          baseUrl: API_ROUTER_CONFIG.odooIntegrationBaseUrl,
          targetPath: `/v1/odoo/crm/${id}/notes`,
        });
      }

      if (req.method === "DELETE" && /^\/activities\/[^/]+$/.test(rest)) {
        const id = rest.split("/")[2];
        return proxyTo(req, res, {
          baseUrl: API_ROUTER_CONFIG.odooIntegrationBaseUrl,
          targetPath: `/v1/odoo/crm/activities/${id}`,
        });
      }

      if (req.method === "POST" && /^\/sync\/magento-to-odoo\/(preview|run)$/.test(rest)) {
        return res.status(410).json({
          message: "Magento-to-Odoo sales sync is disabled. Odoo is the source of truth for CRM sales data.",
          module,
          path: rest,
        });
      }

      if (req.method === "POST" && /^\/orders\/[^/]+\/link-opportunity$/.test(rest)) {
        return res.status(410).json({
          message: "Magento order linking is disabled. Manage sales links in Odoo.",
          module,
          path: rest,
        });
      }

      return notImplemented(res, {
        module,
        method: req.method,
        path: rest,
        hint: "Implemented: summary, orders, leads, opportunities CRUD/archive/stage, timeline, notes, activities CRUD/complete, analytics. Disabled: Magento sync and order linking.",
      });
    }

    if (module === "dashboard") {
      const range = String(req.query.range ?? "30d");
      const monthsByRange: Record<string, number> = { "7d": 1, "30d": 1, "90d": 3, "180d": 6 };
      const months = monthsByRange[range] ?? 1;

      const odooOrdersUrl = toAbsoluteUrl(API_ROUTER_CONFIG.odooIntegrationBaseUrl, "/v1/odoo/sales/orders?pageSize=100&page=1");
      const odooCrmUrl = toAbsoluteUrl(API_ROUTER_CONFIG.odooIntegrationBaseUrl, "/v1/odoo/crm?pageSize=100&page=1");
      const contactsAnalyticsUrl = toAbsoluteUrl(API_ROUTER_CONFIG.odooIntegrationBaseUrl, "/v1/odoo/contacts/analytics");
      const bookingsUrl = toAbsoluteUrl(API_ROUTER_CONFIG.bookingServiceBaseUrl, "/v1/appointments");

      if (req.method === "GET" && rest === "/overview") {
        const [billingSummaryRes, contactsAnalyticsRes, magentoRes, odooRes, crmRes, bookingsRes] = await Promise.all([
          fetchCollectionSafe(req, toAbsoluteUrl(API_ROUTER_CONFIG.odooIntegrationBaseUrl, "/v1/odoo/invoices")),
          fetchUpstreamJsonSafe(req, contactsAnalyticsUrl),
          fetchMagentoOrders(req, new URLSearchParams({ pageSize: "100", currentPage: "1" })),
          fetchCollectionSafe(req, odooOrdersUrl),
          fetchCollectionSafe(req, odooCrmUrl),
          fetchUpstreamJsonSafe(req, bookingsUrl),
        ]);

        if (![billingSummaryRes, contactsAnalyticsRes, odooRes, crmRes, bookingsRes].every(source => source.ok)) {
          return res.status(503).json({ message: "Dashboard sources are unavailable. Please retry." });
        }
        const invoices = Array.isArray(billingSummaryRes.data?.data) ? billingSummaryRes.data.data : [];
        const contactsAnalytics = contactsAnalyticsRes.data ?? {};
        const magentoItems = Array.isArray(magentoRes.data?.data?.items) ? magentoRes.data.data.items : [];
        const odooItems = Array.isArray(odooRes.data?.data) ? odooRes.data.data : [];
        const crmItems = Array.isArray(crmRes.data?.data) ? crmRes.data.data : [];
        const bookings = Array.isArray(bookingsRes.data) ? bookingsRes.data : [];
        const totals = invoiceTotals(invoices);
        const overdueCount = invoices.filter((inv: any) => {
          const dueDate = String(inv?.invoice_date_due ?? "");
          return dueDate && toNum(inv?.amount_residual) > 0 && new Date(dueDate).getTime() < Date.now();
        }).length;
        const totalRevenue = magentoItems.reduce((sum: number, order: any) => sum + Number(order?.grand_total ?? 0), 0)
          + odooItems.reduce((sum: number, order: any) => sum + Number(order?.amount_total ?? 0), 0);

        return res.json({
          data: {
            range,
            kpis: {
              contactsTotal: Number(contactsAnalytics?.totalContacts ?? 0),
              leadsTotal: crmItems.filter((lead: any) => lead.type === "lead").length,
              opportunitiesTotal: crmItems.filter((lead: any) => lead.type === "opportunity").length,
              revenueTotal: Number(totals.totalInvoiced ?? totalRevenue),
              outstandingTotal: Number(totals.totalOutstanding ?? 0),
              orderCount: magentoItems.length + odooItems.length,
              bookingCount: bookings.length,
              overdueCount,
            },
            sourceStatus: {
              odooContacts: { ok: contactsAnalyticsRes.ok, error: contactsAnalyticsRes.error },
              odooBilling: { ok: billingSummaryRes.ok, error: billingSummaryRes.error },
              odooSales: { ok: odooRes.ok, error: odooRes.error },
              odooCrm: { ok: crmRes.ok, error: crmRes.error },
              magento: { ok: magentoRes.ok, error: magentoRes.error },
              bookings: { ok: bookingsRes.ok, error: bookingsRes.error },
            },
          },
        });
      }

      if (req.method === "GET" && rest === "/graphs") {
        const metric = String(req.query.metric ?? "revenue");
        if (metric === "revenue") {
          const invoices = await fetchAllOdooInvoicesForGraph(req, { months, maxPages: 20 });
          const monthKeys: string[] = [];
          const cursor = new Date();
          cursor.setDate(1);
          for (let i = months - 1; i >= 0; i -= 1) {
            const d = new Date(cursor.getFullYear(), cursor.getMonth() - i, 1);
            monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
          }
          const monthly = monthKeys.map((key) => {
            const items = invoices.filter((inv: any) => {
              const rawDate = inv?.invoice_date || inv?.create_date || inv?.invoice_date_due;
              if (!rawDate) return false;
              const d = new Date(rawDate);
              return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` === key;
            });
            const invoiced = items.reduce((sum: number, inv: any) => sum + toNum(inv?.amount_total), 0);
            const outstanding = items.reduce((sum: number, inv: any) => sum + toNum(inv?.amount_residual), 0);
            const paid = Math.max(0, invoiced - outstanding);
            return { key, invoiced, paid, outstanding, count: items.length };
          });
          return res.json({
            data: {
              metric,
              categories: monthKeys,
              series: [
                { name: "Invoiced", data: monthly.map((m) => m.invoiced) },
                { name: "Paid", data: monthly.map((m) => m.paid) },
                { name: "Outstanding", data: monthly.map((m) => m.outstanding) },
              ],
            },
          });
        }

        if (metric === "contacts") {
          const contactsAnalytics = await fetchUpstreamJsonSafe(req, contactsAnalyticsUrl);
          const monthly = Array.isArray(contactsAnalytics.data?.monthlyCreated) ? contactsAnalytics.data.monthlyCreated : [];
          return res.json({
            data: {
              metric,
              categories: monthly.map((item: any) => item.month),
              series: [{ name: "Contacts", data: monthly.map((item: any) => Number(item.count ?? 0)) }],
              meta: { upstream: { odooContacts: { ok: contactsAnalytics.ok, error: contactsAnalytics.error } } },
            },
          });
        }

        if (metric === "orders") {
          const [magentoRes, odooRes] = await Promise.all([
            fetchMagentoOrders(req, new URLSearchParams({ pageSize: "100", currentPage: "1" })),
            fetchCollectionSafe(req, odooOrdersUrl),
          ]);
          const magentoItems = Array.isArray(magentoRes.data?.data?.items) ? magentoRes.data.data.items : [];
          const odooItems = Array.isArray(odooRes.data?.data) ? odooRes.data.data : [];
          const bucket = new Map<string, number>();
          [...magentoItems, ...odooItems].forEach((order: any) => {
            const status = String(order?.status ?? order?.state ?? "unknown").toLowerCase();
            bucket.set(status, (bucket.get(status) ?? 0) + 1);
          });
          return res.json({
            data: {
              metric,
              categories: Array.from(bucket.keys()),
              series: [{ name: "Orders", data: Array.from(bucket.values()) }],
            },
          });
        }

        if (metric === "pipeline") {
          const crmRes = await fetchCollectionSafe(req, odooCrmUrl);
          const crmItems = Array.isArray(crmRes.data?.data) ? crmRes.data.data : [];
          const bucket = new Map<string, number>();
          crmItems.forEach((lead: any) => {
            const stage = String(Array.isArray(lead?.stage_id) ? lead.stage_id[1] : "Unstaged");
            bucket.set(stage, (bucket.get(stage) ?? 0) + 1);
          });
          return res.json({
            data: {
              metric,
              categories: Array.from(bucket.keys()),
              series: [{ name: "Pipeline", data: Array.from(bucket.values()) }],
            },
          });
        }

        if (metric === "bookings") {
          const bookingsRes = await fetchUpstreamJsonSafe(req, bookingsUrl);
          const bookings = Array.isArray(bookingsRes.data) ? bookingsRes.data : [];
          const bucket = new Map<string, number>();
          bookings.forEach((b: any) => {
            const raw = b?.startTime;
            if (!raw) return;
            const d = new Date(raw);
            const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            bucket.set(key, (bucket.get(key) ?? 0) + 1);
          });
          return res.json({
            data: {
              metric,
              categories: Array.from(bucket.keys()),
              series: [{ name: "Bookings", data: Array.from(bucket.values()) }],
            },
          });
        }

        return res.status(400).json({ message: "Unsupported graph metric." });
      }

      if (req.method === "GET" && rest === "/activity") {
        const limit = Math.max(1, Math.min(50, Number(req.query.limit ?? 12)));
        const [contactsRes, magentoRes, invoicesRes, bookingsRes] = await Promise.all([
          fetchUpstreamJsonSafe(req, toAbsoluteUrl(API_ROUTER_CONFIG.odooIntegrationBaseUrl, "/v1/odoo/contacts?page=1&pageSize=30")),
          fetchMagentoOrders(req, new URLSearchParams({ pageSize: "100", currentPage: "1" })),
          fetchUpstreamJsonSafe(req, toAbsoluteUrl(API_ROUTER_CONFIG.odooIntegrationBaseUrl, "/v1/odoo/invoices?page=1&pageSize=30")),
          fetchUpstreamJsonSafe(req, bookingsUrl),
        ]);
        const items: any[] = [];
        (Array.isArray(contactsRes.data?.data) ? contactsRes.data.data : []).forEach((c: any) => {
          items.push({ id: `contact-${c.id}`, type: "contact", title: `New contact: ${c.name ?? "Contact"}`, subtitle: c.email ?? c.phone ?? "", timestamp: c.create_date || c.createdAt || null });
        });
        (Array.isArray(invoicesRes.data?.data) ? invoicesRes.data.data : []).forEach((inv: any) => {
          items.push({ id: `invoice-${inv.id}`, type: "invoice", title: `Invoice ${inv.name ?? inv.id}`, subtitle: `${toNum(inv.amount_total).toFixed(2)} • ${inv.state ?? "draft"}`, timestamp: inv.create_date || inv.invoice_date || null });
        });
        (Array.isArray(magentoRes.data?.data?.items) ? magentoRes.data.data.items : []).forEach((order: any) => {
          items.push({ id: `order-${order.entity_id ?? order.increment_id}`, type: "order", title: `Order ${order.increment_id ?? order.entity_id}`, subtitle: order.customer_email ?? "", timestamp: order.created_at || null });
        });
        (Array.isArray(bookingsRes.data) ? bookingsRes.data : []).forEach((b: any) => {
          items.push({ id: `booking-${b.id}`, type: "booking", title: `Appointment ${b.status ?? "scheduled"}`, subtitle: b.email ?? b.name ?? "", timestamp: b.createdAt || b.startTime || null });
        });
        const rows = items
          .filter((i) => i.timestamp)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, limit);
        return res.json({ data: rows });
      }

      if (req.method === "GET" && rest === "/attention") {
        const [billingSummaryRes, reconciliationRes, bookingsRes] = await Promise.all([
          fetchCollectionSafe(req, toAbsoluteUrl(API_ROUTER_CONFIG.odooIntegrationBaseUrl, "/v1/odoo/invoices")),
          fetchCollectionSafe(req, toAbsoluteUrl(API_ROUTER_CONFIG.odooIntegrationBaseUrl, "/v1/odoo/invoices")),
          fetchUpstreamJsonSafe(req, bookingsUrl),
        ]);
        const invoices = Array.isArray(billingSummaryRes.data?.data) ? billingSummaryRes.data.data : [];
        const overdueCount = invoices.filter((inv: any) => {
          const dueDate = String(inv?.invoice_date_due ?? "");
          return dueDate && toNum(inv?.amount_residual) > 0 && new Date(dueDate).getTime() < Date.now();
        }).length;
        const bookings = Array.isArray(bookingsRes.data) ? bookingsRes.data : [];
        const reconciliationInvoices = Array.isArray(reconciliationRes.data?.data) ? reconciliationRes.data.data : [];
        const unmatchedCount = reconciliationInvoices.filter((inv: any) => !inv?.invoice_origin && !inv?.ref).length;
        return res.json({
          data: [
            { id: "overdue", severity: overdueCount > 0 ? "error" : "success", title: "Overdue invoices", count: overdueCount, actionUrl: "/dashboard/billing/" },
            { id: "unmatched", severity: unmatchedCount > 0 ? "warning" : "success", title: "Unmatched invoice/order links", count: unmatchedCount, actionUrl: "/dashboard/billing/?view=graph" },
            { id: "bookings", severity: "info", title: "Upcoming appointments", count: bookings.length, actionUrl: "/dashboard/calendar/" },
          ],
        });
      }

      return notImplemented(res, {
        module,
        method: req.method,
        path: rest,
        hint: "Implemented: GET /overview, GET /graphs, GET /activity, GET /attention",
      });
    }

    // Fallback: proxy to legacy monolith
    const path = `/api/${module}${rest}`;
    logger.info({ module, path }, "Proxying unmigrated route to legacy monolith");
    return proxyTo(req, res, { baseUrl: API_ROUTER_CONFIG.monolithBaseUrl, targetPath: path });
  } catch (err) {
    logger.error({ err, module, rest }, "api-router-service failed");
    res.status(502).json({ message: "Upstream error", module, path: rest });
  }
}

app.all("/api/:module", (req, res) => {
  void handleApiCompat(req, res).catch((err) => {
    logger.error({ err, path: req.path }, "Unhandled API router error");
    if (!res.headersSent) {
      res.status(502).json({ message: "Upstream error", module: req.params.module, path: req.path });
    }
  });
});
app.all("/api/:module/*", (req, res) => {
  void handleApiCompat(req, res).catch((err) => {
    logger.error({ err, path: req.path }, "Unhandled API router error");
    if (!res.headersSent) {
      res.status(502).json({ message: "Upstream error", module: req.params.module, path: req.path });
    }
  });
});

const port = Number(process.env.PORT || 7001);
app.listen(port, "0.0.0.0", () => logger.info({ port }, "api-router-service listening (TS)"));
