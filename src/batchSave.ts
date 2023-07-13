import { ICacheInfo } from "types"

export async function batchSave<T>(info:ICacheInfo<T>, preloadData?:T[]) {
  const { data, cachedKey } = info

  upsertData<T>(info)

  deleteData(info)

  data.splice(0, data.length)
  cachedKey.splice(0, cachedKey.length)

  if (preloadData && Array.isArray(preloadData)) data.push(...preloadData)
}

async function upsertData<T>(info:ICacheInfo<T>) {
  const {queryRunner, tableName, tableColumns, data, refKey} = info

  if(!queryRunner || !tableName || !refKey) throw Error("You should setting before use select");

  const upsertQuery = `
    INSERT INTO ${tableName} (${tableColumns.join(", ")})
    VALUES
      ${data.map((_, index) => `(${tableColumns.map((_, key) => `$${(index * tableColumns.length) + (key + 1)}`).join(', ')})`).join(', ')}
    ON CONFLICT (${String(refKey)}) DO UPDATE
    SET
      ${tableColumns.map((column) => `${column} = COALESCE(EXCLUDED.${column}, ${tableName}.${column}`).join(", ")}
  `;

  const queryValues:T[keyof T][] = []
  data.forEach((value) => {
    tableColumns.forEach((column) => {
      queryValues.push(value[column as keyof T])
    })
  })

  await queryRunner.query(upsertQuery, queryValues);
}

async function deleteData<T>(info:ICacheInfo<T>) {
  const { deleted, tableName, queryRunner } = info
  if(!queryRunner || !tableName) throw Error("You should setting before use select");
  const deleteQuery = `
    DELETE FROM ${tableName}
    WHERE ${Object.keys(deleted).map((key, index1) => `${key} IN (${deleted[key].map((_, index2) => `$${(index1 * deleted[key].length) + (index2 + 1)}`).join(', ')})`).join(' OR ')};
  `
  const queryValues:T[keyof T][] = []
  Object.keys(deleted).forEach((key) => {
    queryValues.push(...deleted[key])
  })

  await queryRunner.query(deleteQuery, queryValues);
}
