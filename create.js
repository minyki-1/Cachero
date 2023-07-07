export function create({ data, redis, table }, newData) {
  if (typeof newData === 'object' && newData !== null) {
    const result = data.push(newData)
    if (redis) redis.set(table, JSON.stringify(result))
  } else {
    throw Error("Create require data that is an object");
  }
}