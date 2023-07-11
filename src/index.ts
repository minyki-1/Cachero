import { create } from "./create.js"
import { deleteData } from "./delete.js"
import { select } from "./select.js"
import { update } from "./update.js"
import { batchSave } from "./batchSave.js"
import { ICacheInfo, QueryForm, SettingParams } from "./types.js"

export const createCachero = <T=Object>() => {
  const info:ICacheInfo<T> = {
    queryRunner: null,
    redis: null,
    data: [],
    tableName: null,
    cachedKey: [],
    count: 0,
    deleted: {},
    tableColumns: [],
  };

  return {
    /** 
     * @Tip Scheduler can set multiple time zones -
     * [[1,0],[12,0]] = 01:00, 12:00
     * */
    scheduler: (times:number[][], key:keyof T, preloadData:T[]) => scheduler<T>(info, times, key, preloadData),

    /** You should setting before use select | create | update | delete*/
    setting: (data:SettingParams<T>) => setting(info, data),

    /** @Tip Recommend importing columns of all data at once for data reuse*/
    select: (queryForm:QueryForm = {column:["*"]}, key:string | null = null) => select(info, queryForm, key),

    /** @Tip Newly created data can be delivered immediately*/
    create: (newData:T[]) => { create(info, newData); info.count++; },

    /** @Tip Updated data will be applied immediately*/
    update: (key:string, newData:T[]) => { update(info, key, newData); info.count--; },
    delete: (condition:keyof T) => deleteData(info, condition),
    batchSave: (key:string, preloadData:T[]) => batchSave(info, key, preloadData),
  }
}

async function setting<T>(info:ICacheInfo<T>, data:SettingParams<T>) {
  const { table, preloadData, queryRunner, redis } = data
  info.tableName = table;
  info.queryRunner = queryRunner;
  const columnNameResult = await queryRunner(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = '${table}';
  `)
  info.tableColumns = columnNameResult.rows.map((row) => row.column_name);
  if (preloadData) info.data = [...preloadData];
  if (redis) info.redis = redis;
  const countResult = await queryRunner(`SELECT COUNT(*) FROM ${table};`);
  info.count = countResult;
  console.log(`Cachero(${table}) setting completed`)
}

function scheduler<T>(info:ICacheInfo<T>, times:number[][], key:keyof T, preloadData:T[]) {
  const intervalId = setInterval(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    for (let i = 0; i < times.length; i++) {
      const [hour, minute] = times[i];

      if (currentHour === hour && currentMinute === minute) {
        batchSave(info, key, preloadData);
        break;
      }
    }
  }, 60000);

  const cancel = () => clearInterval(intervalId)

  return { cancel };
}
