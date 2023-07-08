async function batchSave(info, key, preloadData) {
  const { data, cachedKey } = info

  upsertData(info, key)

  deleteData(info)

  data.splice(0, data.length)
  cachedKey.splice(0, cachedKey.length)

  if (preloadData && Array.isArray(preloadData)) data.push(...preloadData)
}

async function upsertData({ tableName, tableColumns, data, pool }, key) {
  const upsertQuery = `
    INSERT INTO ${tableName} (${tableColumns.join(", ")})
    VALUES
      ${data.map((_, index) => `(${tableColumns.map((_, key) => `$${(index * tableColumns.length) + (key + 1)}`).join(', ')})`).join(', ')}
    ON CONFLICT (${key}) DO UPDATE
    SET
      ${tableColumns.map((column) => `${column} = COALESCE(EXCLUDED.${column}, ${tableName}.${column}`).join(", ")}
  `;

  const queryValues = []
  data.forEach((value) => {
    tableColumns.forEach((column) => {
      queryValues.push(value[column])
    })
  })

  await pool.query(upsertQuery, queryValues);
}

async function deleteData({ deleted, tableName, pool }) {
  const deleteData = {}
  deleted.forEach(({ key, value }) => {
    if (key in deleteData) deleteData[key].push(value)
    else deleteData[key] = [value]
  })
  const deleteQuery = `
    DELETE FROM ${tableName}
    WHERE ${Object.keys(deleteData).map((key, index1) => `${key} IN (${deleteData[key].map((_, index2) => `$${(index1 * deleteData[key].length) + (index2 + 1)}`).join(', ')})`).join(' OR ')};
  `
  const queryValues = []
  Object.keys(deleteData).forEach((key) => {
    queryValues.push(...deleteData[key])
  })

  await pool.query(deleteQuery, queryValues);
}

exports.batchSave = batchSave