/** Fetch all pages or fail explicitly; never label a truncated page as a total. */
export async function collectPages(load: (page: number, pageSize: number) => Promise<{ data: any[]; total: number }>, maxPages = 1000) {
  const rows: any[] = [];
  const pageSize = 100;
  let expected: number | undefined;
  for (let page = 1; page <= maxPages; page += 1) {
    const response = await load(page, pageSize);
    if (!Array.isArray(response.data) || !Number.isInteger(response.total) || response.total < 0) throw new Error('Invalid upstream pagination response');
    if (expected !== undefined && response.total !== expected) throw new Error('Records changed while loading the dashboard; retry');
    expected = response.total;
    rows.push(...response.data);
    if (rows.length === expected) return rows;
    if (!response.data.length || rows.length > expected) throw new Error('Incomplete upstream pagination response');
  }
  throw new Error('Dashboard result exceeds the aggregation limit; narrow the date range');
}
