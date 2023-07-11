export function deleteData(info, condition) {
  const { data, deleted, redis, table } = info
  data.forEach((obj, index) => {
    Object.keys(condition).forEach(key => {
      if (obj[key] === condition[key]) {
        deleted.push({ [key]: condition[key] })
        data.splice(index, 1);
      }
    })
  });

  if (redis) redis.set(table, JSON.stringify(data))
}