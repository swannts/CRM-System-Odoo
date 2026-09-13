import { Injectable, Scope, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { INITIAL_MOCK_DATA } from './odoo-mock.constants.js';

@Injectable({ scope: Scope.REQUEST })
export class OdooClientService {
  private readonly logger = new Logger(OdooClientService.name);
  private url: string;
  private db: string;
  private password: string;
  private uid: number | null = null;
  private readonly nodeEnv: string;
  private readonly isProduction: boolean;
  private readonly allowMockFallback: boolean;

  // Shared in-memory store for UID and mock data
  private static authCache = new Map<string, number>();
  private static mockStore: Record<string, any[]> = { ...INITIAL_MOCK_DATA };

  constructor(private configService: ConfigService) {
    this.nodeEnv = this.configService.get<string>('NODE_ENV') || process.env.NODE_ENV || 'development';
    this.isProduction = this.nodeEnv === 'production';
    const explicitMockFlag =
      this.configService.get<string>('ODOO_ALLOW_MOCK_FALLBACK') ?? process.env.ODOO_ALLOW_MOCK_FALLBACK;
    this.allowMockFallback = explicitMockFlag === undefined ? !this.isProduction : explicitMockFlag === 'true';

    this.url =
      this.configService.get<string>('ODOO_BASE_URL') ||
      'http://odoo-demo:8069';
    this.db = this.configService.get<string>('ODOO_DB') || 'demo';
    this.password = this.configService.get<string>('ODOO_PASSWORD') || 'admin';
  }

  /**
   * Internal JSON-RPC caller
   */
  private async jsonRpcCall(
    service: 'common' | 'object',
    method: string,
    args: any[],
  ) {
    const payload = {
      jsonrpc: '2.0',
      method: 'call',
      params: {
        service,
        method,
        args,
      },
      id: Math.floor(Math.random() * 1000000),
    };

    const startTime = Date.now();
    try {
      if (!this.isProduction) {
        this.logger.debug(`Sending JSON-RPC call: ${service}.${method}`);
      }
      const response = await axios.post(`${this.url}/jsonrpc`, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000, // Increased timeout for production hardening
      });

      const duration = Date.now() - startTime;
      if (response.data?.error) {
        this.logger.error(`Odoo error in ${service}.${method} (${duration}ms): ${JSON.stringify(response.data.error)}`);
        throw new Error(response.data.error.message || 'Odoo JSON-RPC Error');
      }

      if (!this.isProduction) {
        this.logger.debug(`JSON-RPC call ${service}.${method} succeeded in ${duration}ms`);
      }
      return response.data?.result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `JSON-RPC error at ${service}.${method} after ${duration}ms: ${errorMessage}`,
      );
      throw error;
    }
  }

  async authenticate(username?: string, password?: string): Promise<number> {
    const targetUser =
      username ||
      this.configService.get<string>('ODOO_USERNAME') ||
      'admin';
    const targetPass = password || this.password;

    try {
      const isMockHost = this.url.includes('odoo-demo') || this.url.includes('localhost');
      if (!isMockHost) {
        // Check cache first
        const cacheKey = `${this.db}:${targetUser}:${targetPass}`;
        if (OdooClientService.authCache.has(cacheKey)) {
          const cachedUid = OdooClientService.authCache.get(cacheKey)!;
          this.uid = cachedUid;
          return cachedUid;
        }

        this.logger.log(`Attempting Odoo authentication for database: ${this.db}`);
        const uid = await this.jsonRpcCall('common', 'authenticate', [
          this.db,
          targetUser,
          targetPass,
          {},
        ]);

        if (!uid || typeof uid !== 'number') {
          throw new Error(
            'Authentication failed: Invalid credentials or database',
          );
        }

        this.logger.log(`Odoo authenticated successfully, UID: ${uid}`);
        this.uid = uid;
        OdooClientService.authCache.set(cacheKey, uid);
        return uid;
      }

      if (!this.allowMockFallback) {
        throw new Error('Mock Odoo host is not allowed without ODOO_ALLOW_MOCK_FALLBACK=true');
      }
      this.uid = 1;
      return 1;
    } catch (error) {
      if (!this.allowMockFallback) {
        throw error;
      }
      this.logger.warn('Odoo authentication failed; using mock fallback mode.');
      this.uid = 1;
      return 1;
    }
  }

  async execute(
    model: string,
    method: string,
    args: any[],
    kwargs: any = {},
  ): Promise<any> {
    if (!this.uid) await this.authenticate();

    if (!this.isProduction) {
      this.logger.debug(`Odoo Execute: ${model}.${method}`);
    }

    try {
      const isMockHost = this.url.includes('odoo-demo') || this.url.includes('localhost');
      if (!isMockHost) {
        return await this.jsonRpcCall('object', 'execute_kw', [
          this.db,
          this.uid,
          this.password,
          model,
          method,
          args,
          kwargs,
        ]);
      }
      if (!this.allowMockFallback) {
        throw new Error('Mock Odoo execution is disabled in this environment');
      }
      return this.handleMockExecute(model, method, args, kwargs);
    } catch (error) {
      if (!this.allowMockFallback) {
        throw error;
      }
      this.logger.warn(`Odoo call failed for ${model}.${method}; using mock fallback mode.`);
      return this.handleMockExecute(model, method, args, kwargs);
    }
  }

  async searchRead(
    model: string,
    domain: any[] = [],
    fields: string[] = [],
    options: any = {},
  ): Promise<any[]> {
    return this.execute(model, 'search_read', [domain], {
      fields,
      ...options,
    });
  }

  private normalizeComparable(value: any): any {
    if (Array.isArray(value)) {
      return value[0];
    }
    return value;
  }

  private evaluateCondition(record: any, condition: any[]): boolean {
    const [field, operator, rawValue] = condition;
    const left = this.normalizeComparable(record?.[field]);
    const right =
      operator === 'in' ? rawValue : this.normalizeComparable(rawValue);

    switch (operator) {
      case '=':
        return left === right;
      case '!=':
        return left !== right;
      case '>':
        return Number(left ?? 0) > Number(right ?? 0);
      case '>=':
        return Number(left ?? 0) >= Number(right ?? 0);
      case '<':
        return Number(left ?? 0) < Number(right ?? 0);
      case '<=':
        return Number(left ?? 0) <= Number(right ?? 0);
      case 'in':
        return Array.isArray(rawValue) ? rawValue.includes(left) : false;
      case '=ilike':
        return String(left ?? '').toLowerCase() === String(right ?? '').toLowerCase();
      case 'ilike': {
        const leftText = String(left ?? '').toLowerCase();
        const pattern = String(right ?? '')
          .toLowerCase()
          .replaceAll('%', '');
        return leftText.includes(pattern);
      }
      default:
        return true;
    }
  }

  private filterByDomain(records: any[], domain: any[]): any[] {
    if (!Array.isArray(domain) || domain.length === 0) {
      return records;
    }

    const MAX_RECURSION = 100;
    const MAX_ITERATIONS = 1000;

    return records.filter((record) => {
      let cursor = 0;
      let iterations = 0;

      const evalNode = (depth = 0): boolean => {
        if (depth > MAX_RECURSION) {
          this.logger.error('Domain recursion limit exceeded');
          return true;
        }

        if (cursor >= domain.length) {
          return true;
        }

        const token = domain[cursor++];

        if (token === '|') {
          const left = evalNode(depth + 1);
          const right = evalNode(depth + 1);
          return left || right;
        }

        if (token === '&') {
          const left = evalNode(depth + 1);
          const right = evalNode(depth + 1);
          return left && right;
        }

        if (token === '!') {
          return !evalNode(depth + 1);
        }

        if (Array.isArray(token)) {
          return this.evaluateCondition(record, token);
        }

        return true;
      };

      // Odoo domains without explicit operators are AND-ed.
      let result = true;
      while (cursor < domain.length && iterations < MAX_ITERATIONS) {
        iterations++;
        result = result && evalNode();
      }

      if (iterations >= MAX_ITERATIONS) {
        this.logger.error('Domain iteration limit exceeded');
      }

      return result;
    });
  }

  private handleMockExecute(
    model: string,
    method: string,
    args: any[],
    kwargs: any,
  ): any {
    if (!OdooClientService.mockStore[model]) {
      OdooClientService.mockStore[model] = [];
    }

    const store = OdooClientService.mockStore[model];

    switch (method) {
      case 'search_count':
        return this.filterByDomain(store, args?.[0] ?? []).length;

      case 'search_read':
        const domain = args?.[0] ?? [];
        const filtered = this.filterByDomain(store, domain);
        const offset = kwargs.offset || 0;
        const limit = kwargs.limit || 100;
        return filtered.slice(offset, offset + limit);

      case 'create':
        const newId = store.length + 1001;
        const newRecord = {
          id: newId,
          ...args[0],
          create_date: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          priority: args[0].priority || '0',
          kanban_state: args[0].kanban_state || 'normal',
        };
        store.unshift(newRecord);
        return newId;

      case 'write':
        const idsToUpdate = args[0];
        const updateData = args[1];
        idsToUpdate.forEach((id: number) => {
          const index = store.findIndex((item) => item.id === id);
          if (index !== -1) {
            store[index] = {
              ...store[index],
              ...updateData,
              write_date: new Date().toISOString(),
            };
          }
        });
        return true;

      case 'unlink':
        const idsToDelete = args[0];
        OdooClientService.mockStore[model] = store.filter(
          (item) => !idsToDelete.includes(item.id),
        );
        return true;

      case 'read_group':
        // Simplified read_group for mock data
        // Args: domain, fields, groupby, offset, limit, orderby, lazy
        const rgDomain = args[0] || [];
        const rgFields = args[1] || [];
        const rgGroupby = args[2] || [];
        
        const filteredRecords = this.filterByDomain(store, rgDomain);
        
        // Very basic grouping (only support single groupby for now)
        if (rgGroupby.length > 0) {
          const groupField = rgGroupby[0].split(':')[0];
          const groups: Record<string, any> = {};
          
          filteredRecords.forEach(rec => {
            let key = rec[groupField];
            // Handle dates (month grouping)
            if (rgGroupby[0].endsWith(':month') && key) {
              key = new Date(key).toLocaleString('default', { month: 'short', year: 'numeric' });
            }
            key = String(key || 'Other');
            
            if (!groups[key]) {
              groups[key] = { [groupField]: key, [`${groupField}_count`]: 0 };
              rgFields.forEach((f: string) => {
                if (f.endsWith(':sum')) groups[key][f.split(':')[0]] = 0;
                if (f.endsWith(':count')) groups[key][f.split(':')[0]] = 0;
              });
            }
            
            groups[key][`${groupField}_count`]++;
            rgFields.forEach((f: string) => {
              if (f.endsWith(':sum')) {
                const fn = f.split(':')[0];
                groups[key][fn] += Number(rec[fn] || 0);
              }
              if (f.endsWith(':count')) {
                const fn = f.split(':')[0];
                groups[key][fn]++;
              }
            });
          });
          
          return Object.values(groups);
        }
        return [];

      case 'action_post':
        return true;

      case '_render_qweb_pdf':
        // Return a dummy PDF base64
        return [
          'JVBERi0xLjEKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDAKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPj4KZW5kb2JqCjMgMCBvYmoKPDAKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQovUmVzb3VyY2VzIDw8Pj4KL0NvbnRlbnRzIDQgMCBSCj4+CmVuZG9iago0IDAgb2JqCjw8Ci9MZW5ndGggMAo+PgpzdHJlYW0KZW5kc3RyZWFtCmVuZG9iagp4cmVmCjAgNQowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTggMDAwMDAgbiAKMDAwMDAwMDA2NiAwMDAwMCBuIAowMDAwMDAwMTIxIDAwMDAwIG4gCjAwMDAwMDAyMzEgMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSA1Ci9Sb290IDEgMCBSCj4+CnN0YXJ0eHJlZgoyNzIKJSVFT0Y=',
          'pdf',
        ];

      default:
        return Array.isArray(store) ? store : [];
    }
  }
}
