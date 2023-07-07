export function update({ data, redis, table }, key, newData) {
  const updateData = JSON.parse(JSON.stringify(newData))
  if (Array.isArray(updateData)) {
    updateData.forEach(newData => {
      mergeData(data, key, newData);
    });
  } else if (typeof updateData === 'object' && updateData !== null) {
    mergeData(data, key, updateData);
  } else {
    throw Error("Update require data that is an object or array");
  }

  if (redis) redis.set(table, JSON.stringify(data))
}

function mergeData(data, key, updateData) {
  const existingObjIndex = data.findIndex(obj => obj[key] === updateData[key]);
  if (existingObjIndex !== -1) {
    return data[existingObjIndex] = { ...data[existingObjIndex], ...updateData }; // 이미 있는 오브젝트를 덮어씌우면서 새로운 키를 추가
  } else {
    return data.push(updateData); // 새로운 오브젝트를 추가
  }
}