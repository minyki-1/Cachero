"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteData = void 0;
function deleteData(info, condition) {
    const { data, deleted, redis, tableName } = info;
    if (!tableName)
        throw Error("You should setting before use select");
    data.forEach((obj, index) => {
        Object.keys(condition).forEach(key => {
            if (obj[key] && obj[key] === condition[key]) {
                deleted[key].push(condition[key]);
                data.splice(index, 1);
            }
        });
    });
    if (redis)
        redis(tableName, JSON.stringify(data));
}
exports.deleteData = deleteData;
