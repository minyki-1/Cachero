import { ICacheInfo } from "types";

export function create<T>(info:ICacheInfo<T>, newData:T) {
  const { data, redis, tableName } = info
  if(!tableName) throw Error("You should setting before use select");
  const result = data.push(newData)
  if (redis) redis(tableName, JSON.stringify(result))
}