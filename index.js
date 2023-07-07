import { create } from "./create.js"
import { deleteData } from "./delete.js"
import { select } from "./select.js"
import { update } from "./update.js"

export const createCachero = () => {
  const info = { pool: null, redis: null, data: [], table: "", cachedKey: [], count: 0, deleted: [], tableColumns: [] }
  return {
    select: (selectData, key) => select(info, selectData, key),
    create: (newData) => { create(info, newData); info.count++; },
    update: (key, newData) => { update(info, key, newData); info.count--; },
    delete: ({ key, value }) => deleteData(info, { key, value }),
    setting: async ({ table, preloadData, pool, redis }) => {
      info.table = table;
      info.pool = pool;
      const columnNameResult = await pool.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = '${info.table}';
      `)
      info.tableColumns = columnNameResult.rows.map((row) => row.column_name);
      if (preloadData) info.data = [...preloadData];
      if (redis) info.redis = redis;
      const countResult = await pool.query(`SELECT COUNT(*) FROM ${info.table};`);
      info.count = countResult;
      console.log(`Cachero(${table}) setting completed`)
    }
  }
}