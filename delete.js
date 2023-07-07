export function deleteData({ data, deleted, redis, table }, { key, value }) {
  const index = data.findIndex(obj => obj[key] === value); // 특정 id를 가진 오브젝트의 인덱스를 찾음

  if (index !== -1) {
    deleted.push({ key, value })
    data.splice(index, 1); // 해당 인덱스의 오브젝트를 배열에서 제거
    if (redis) redis.set(table, JSON.stringify(data))
  }
}