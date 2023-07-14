import { ICacheInfo } from "types";

// TODO: Update 전에 데이터가 없을 경우 어떻게 할지
export function update<T>(info:ICacheInfo<T>, newData:T | T[]) {
  const { data, redis, tableName, refKey } = info
  if(!tableName || !refKey) throw Error("You should setting before use select");
  const updateData:T | T[] = JSON.parse(JSON.stringify(newData))
  if (Array.isArray(updateData)) {
    updateData.forEach(value => {
      if(!(value as Object).hasOwnProperty(refKey)) throw Error(`New data for update must have ${String(refKey)} value`);
      mergeData<T>(data, refKey, value);
    });
  } else {
    if(!(updateData as Object).hasOwnProperty(refKey)) throw Error(`New data for update must have ${String(refKey)} value`);
    mergeData<T>(data, refKey, updateData);
  }

  if (redis) redis.set(tableName, JSON.stringify(data))
}

function mergeData<T>(data:T[], key:keyof T, updateData:T) {
  const existingObjIndex = data.findIndex(obj => obj[key] === updateData[key]);
  if (existingObjIndex !== -1) {
    return data[existingObjIndex] = { ...data[existingObjIndex], ...updateData }; // 이미 있는 오브젝트를 덮어씌우면서 새로운 키를 추가
  } else {
    return data.push(updateData); // 새로운 오브젝트를 추가
  }
}