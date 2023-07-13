export function deleteData(info, condition) {
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
