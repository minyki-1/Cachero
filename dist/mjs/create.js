export function create(info, newData) {
    const { data, redis, tableName } = info;
    if (!tableName)
        throw Error("You should setting before use select");
    const result = data.push(newData);
    if (redis)
        redis(tableName, JSON.stringify(result));
}
