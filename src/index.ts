import { create } from "./create.js"
import { deleteData } from "./delete.js"
import { select } from "./select.js"
import { update } from "./update.js"
import { batchSave } from "./batchSave.js"
import { ICacheInfo, QueryForm, SettingParams } from "./types.js"

export const createCachero = <T>() => {
  const info:ICacheInfo<T> = {
    queryRunner: null,
    redis: null,
    data: [],
    tableName: null,
    cachedKey: [],
    count: 0,
    deleted: {},
    tableColumns: [],
    refKey:null
  };

  return {
    /** 
     * @Tip Scheduler can set multiple time zones -
     * [[1,0],[12,0]] = 01:00, 12:00
     * */
    scheduler: (times:number[][], preloadData:T[]) => scheduler<T>(info, times, preloadData),

    /** You should setting before use select | create | update | delete*/
    setting: (data:SettingParams<T>) => setting<T>(info, data),

    /** @Tip Recommend importing columns of all data at once for data reuse*/
    select: (queryForm:QueryForm = {column:["*"]}, key:string | null = null) => select<T>(info, queryForm, key),

    /** @Tip Newly created data can be delivered immediately*/
    create: (newData:T) => { create<T>(info, newData); info.count++; },

    /** @Tip Updated data will be applied immediately*/
    update: (newData:T[]) => { update<T>(info, newData); info.count--; },
    delete: (condition:{[key:string]: T[keyof T]}) => deleteData(info, condition),
    batchSave: (preloadData:T[]) => batchSave(info, preloadData),
  }
}

async function setting<T>(info:ICacheInfo<T>, data:SettingParams<T>) {
  const { table, preloadData, queryRunner, redis, refKey } = data
  if(!queryRunner || !table || !refKey) throw Error("You should setting information");
  info.tableName = table;
  info.queryRunner = queryRunner;
  info.refKey = refKey;
  const columnNameResult = await queryRunner(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = '${table}';
  `)
  info.tableColumns = columnNameResult.rows.map(({column_name}:{column_name:string}) => column_name);
  if (preloadData) info.data = [...preloadData];
  if (redis) info.redis = redis;
  const countResult = await queryRunner(`SELECT COUNT(*) FROM ${table};`);
  info.count = countResult;
  console.log(`Cachero(${table}) setting completed`)
}

function scheduler<T>(info:ICacheInfo<T>, times:number[][], preloadData:T[]) {
  const intervalId = setInterval(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    for (let i = 0; i < times.length; i++) {
      const [hour, minute] = times[i];

      if (currentHour === hour && currentMinute === minute) {
        batchSave(info, preloadData);
        break;
      }
    }
  }, 60000);

  const cancel = () => clearInterval(intervalId)

  return { cancel };
}