import { ICacheInfo } from "types";

export function deleteData<T>(info:ICacheInfo<T>, condition:{[key:string]: T[keyof T]}) {
  const { data, deleted, redis, tableName } = info
  if(!tableName) throw Error("You should setting before use select");
  data.forEach((obj, index) => {
    Object.keys(condition).forEach(key => {
      if (obj[key as keyof T] && obj[key as keyof T] === condition[key]) {
        if(Array.isArray(deleted[key])) deleted[key].push(condition[key]);
        else deleted[key] = [condition[key]]
        data.splice(index, 1);
      }
    })
  });

  if (redis) redis.set(tableName, JSON.stringify(data))
}