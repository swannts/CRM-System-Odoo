import { test } from 'node:test';
import assert from 'node:assert/strict';
import { collectPages } from '../src/pagination.ts';
test('collects all pages even if the server returns fewer rows than requested', async () => {
  const data = Array.from({ length: 235 }, (_, id) => ({ id }));
  const result = await collectPages(async page => ({ data: data.slice((page - 1) * 50, page * 50), total: data.length }));
  assert.deepEqual(result, data);
});
test('rejects missing pages and changing totals instead of returning partial metrics', async () => {
  await assert.rejects(collectPages(async () => ({ data: [], total: 1 })), /Incomplete/);
  await assert.rejects(collectPages(async page => ({ data: [{ id: page }], total: page === 1 ? 3 : 4 })), /Records changed/);
});
test('rejects upstream failure', async () => {
  await assert.rejects(collectPages(async () => { throw new Error('Odoo offline'); }), /Odoo offline/);
});
