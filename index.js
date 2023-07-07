import { create } from "./create.js"
import { deleteData } from "./delete.js"
import { select } from "./select.js"
import { update } from "./update.js"
import { batchSave } from "./batchSave.js"

export const createCachero = () => {
  const info = { pool: null, redis: null, data: [], tableName: "", cachedKey: [], count: 0, deleted: [], tableColumns: [] }
  return {
    scheduler,
    setting: (data) => setting(info, data),
    select: (selectData, key) => select(info, selectData, key),
    create: (newData) => { create(info, newData); info.count++; },
    update: (key, newData) => { update(info, key, newData); info.count--; },
    delete: ({ key, value }) => deleteData(info, { key, value }),
    batchSave: (key, preloadData) => batchSave(info, key, preloadData),
  }
}

async function setting(info, data) {
  const { table, preloadData, pool, redis } = data
  info.tableName = table;
  info.pool = pool;
  const columnNameResult = await pool.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = '${table}';
  `)
  info.tableColumns = columnNameResult.rows.map((row) => row.column_name);
  if (preloadData) info.data = [...preloadData];
  if (redis) info.redis = redis;
  const countResult = await pool.query(`SELECT COUNT(*) FROM ${table};`);
  info.count = countResult;
  console.log(`Cachero(${table}) setting completed`)
}

function scheduler(times, fn) {
  const intervalId = setInterval(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    for (let i = 0; i < times.length; i++) {
      const [hour, minute] = times[i];

      if (currentHour === hour && currentMinute === minute) {
        fn();
        break;
      }
    }
  }, 60000);

  const cancel = () => clearInterval(intervalId)

  return { cancel };
}