"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.update = void 0;
function update(info, newData) {
    const { data, redis, tableName, refKey } = info;
    if (!tableName || !refKey)
        throw Error("You should setting before use select");
    const updateData = JSON.parse(JSON.stringify(newData));
    if (Array.isArray(updateData)) {
        updateData.forEach(newData => {
            mergeData(data, refKey, newData);
        });
    }
    else {
        mergeData(data, refKey, updateData);
    }
    if (redis)
        redis(tableName, JSON.stringify(data));
}
exports.update = update;
function mergeData(data, key, updateData) {
    const existingObjIndex = data.findIndex(obj => obj[key] === updateData[key]);
    if (existingObjIndex !== -1) {
        return data[existingObjIndex] = Object.assign(Object.assign({}, data[existingObjIndex]), updateData); // 이미 있는 오브젝트를 덮어씌우면서 새로운 키를 추가
    }
    else {
        return data.push(updateData); // 새로운 오브젝트를 추가
    }
}
