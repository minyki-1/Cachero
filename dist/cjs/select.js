"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.select = void 0;
const select = (info, queryForm, key) => __awaiter(void 0, void 0, void 0, function* () {
    const { data, count, cachedKey, tableName, queryRunner, refKey } = info;
    if (!queryRunner || !tableName || !refKey)
        throw Error("You should setting before use select");
    checkQueryFormVaild(tableName, queryForm);
    const cachedKeyValid = key ? info.cachedKey.includes(key) : false;
    const { column, order, where, offset, limit } = queryForm;
    if (cachedKeyValid || data.length === count) {
        let resultData = JSON.parse(JSON.stringify(data));
        if (column && resultData)
            resultData = interpretColumn(info, column, resultData);
        if (order && resultData)
            resultData = interpretOrder(order, resultData);
        if (where && resultData)
            resultData = interpretWhere(resultData, where);
        if (offset && resultData)
            resultData = resultData === null || resultData === void 0 ? void 0 : resultData.slice(offset);
        if (limit && resultData)
            resultData = resultData === null || resultData === void 0 ? void 0 : resultData.slice(0, limit);
        if (resultData && resultData.length > 0)
            return resultData;
    }
    const result = yield selectQueryRun(info, queryForm);
    if (key && !info.cachedKey.includes(key))
        cachedKey.push(key);
    return result;
});
exports.select = select;
function interpretOrder(orderForm, data) {
    return data === null || data === void 0 ? void 0 : data.sort((a, b) => compareData(a, b, orderForm));
}
function compareData(a, b, keys, index = 0) {
    const keyArray = keys[index].split(" ");
    const order = keyArray.length === 2 ? keyArray[1] : "ASC";
    const key = keyArray[0];
    const x = a[key];
    const y = b[key];
    if (a[key] === b[key]) {
        if (index < keys.length - 1) {
            return compareData(a, b, keys, index + 1);
        }
        else {
            return 0;
        }
    }
    const isNumber = typeof x === 'number' && typeof y === 'number';
    const isString = typeof x === 'string' && typeof y === 'string';
    const isDate = isString && isDateString(x) && isDateString(y);
    if (isNumber) {
        if (order === "DESC")
            return y - x;
        else
            return x - y;
    }
    else if (isDate) {
        if (order === "DESC")
            return new Date(y).getTime() - new Date(x).getTime();
        else
            return new Date(x).getTime() - new Date(y).getTime();
    }
    else {
        if (order === "DESC") {
            if (x > y)
                return -1;
            else if (x < y)
                return 1;
            else
                return 0;
        }
        else {
            if (x < y)
                return -1;
            else if (x > y)
                return 1;
            else
                return 0;
        }
    }
}
function interpretColumn(info, columnForm, data) {
    const { tableName, tableColumns } = info;
    const columnList = [];
    columnForm.forEach((column) => {
        const dotResult = column.match(/\.(\w+)/);
        const isIncludeNotTableName = column.includes(".*") && tableName && !column.includes(tableName);
        const isIncludeAS = column.includes(" AS ") ? " AS " : null || column.includes(" as ") ? " as " : null;
        let resultColumn = column;
        if (isIncludeAS) {
            resultColumn = column.split(isIncludeAS)[1];
        }
        else if (column === `${tableName}.*` || column === "*") {
            return columnList.push(...tableColumns);
        }
        else if (isIncludeNotTableName) {
            throw Error(`You can't send column like this: anotherTable.*`);
        }
        else if (dotResult && dotResult.length > 1) {
            resultColumn = dotResult[1];
        }
        if (columnList.includes(resultColumn))
            throw Error("Wrong Column Selected");
        return columnList.push(resultColumn);
    });
    let isIncorrectColumn = false;
    const result = data.map((obj) => {
        const filteredObj = {};
        columnList.forEach((key) => {
            if (key in obj) {
                filteredObj[key] = obj[key];
            }
            else {
                isIncorrectColumn = true;
            }
        });
        return filteredObj;
    });
    if (isIncorrectColumn)
        return [];
    return result;
}
function getWhereQuery(queryProps, where) {
    if (!where)
        return "";
    return "WHERE " + where.result.map((condition) => {
        if (condition === "&&" || condition === "||")
            return condition;
        if (!(condition in where) || where[condition].length !== 3)
            throw Error("Result contains undefined conditions");
        const [key, operator, value] = where[condition];
        const operatorIsIN = operator === "IN" || operator === "NOT IN";
        if (operatorIsIN && Array.isArray(value)) {
            const result = value.map((valueData) => {
                queryProps.push(valueData);
                return `$${queryProps.length}`;
            }).join(',');
            return result;
        }
        queryProps.push(value);
        return `${key} ${operator} $${queryProps.length}`;
    }).join(" ");
}
function selectQueryRun(info, queryForm) {
    return __awaiter(this, void 0, void 0, function* () {
        const { queryRunner, tableName, deleted, data, redis, refKey } = info;
        if (!queryRunner || !tableName || !refKey)
            throw Error("You should setting before use select");
        const { where, join, column, order, limit, offset } = queryForm;
        const queryProps = [];
        const whereQuery = getWhereQuery(queryProps, where);
        const joinQuery = join ? "JOIN " + join : "";
        const columnQuery = column ? column.join(", ") : '*';
        const orderQuery = order ? "ORDER BY " + order.join(", ") : "";
        const limitQuery = limit ? "LIMIT " + limit : "";
        const offsetQuery = offset ? "OFFSET " + offset : "";
        const result = yield queryRunner(`
    SELECT ${columnQuery}
    FROM ${tableName}
    ${joinQuery}
    ${whereQuery}
    ${orderQuery}
    ${limitQuery}
    ${offsetQuery};
  `, queryProps);
        for (const [key, value] of Object.entries(deleted)) {
            result.rows.forEach((data, index) => {
                if (value.includes(data[key]))
                    delete result.rows[index];
            });
        }
        const selectResult = JSON.parse(JSON.stringify(result.rows));
        selectResult.forEach(newObj => {
            const existingObjIndex = data.findIndex(obj => obj[refKey] === newObj[refKey]);
            if (existingObjIndex !== -1) {
                data[existingObjIndex] = Object.assign(Object.assign({}, data[existingObjIndex]), newObj);
            }
            else {
                data.push(newObj);
            }
        });
        if (redis)
            redis(tableName, JSON.stringify(data));
        return result.rows;
    });
}
function checkQueryFormVaild(tableName, queryForm) {
    const { column } = queryForm;
    column === null || column === void 0 ? void 0 : column.forEach((column) => {
        if (column.includes(".*") && !column.includes(tableName)) {
            throw Error(`You can't send column like this: anotherTable.*`);
        }
    });
}
function isDateString(inputString) {
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    const timestampPattern = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
    const timestampWithTimeZonePattern = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} [+-]\d{2}:\d{2}$/;
    const dateTest = datePattern.test(inputString);
    const timestampTest = timestampPattern.test(inputString);
    const timestampWithTimeZone = timestampWithTimeZonePattern.test(inputString);
    if (dateTest || timestampTest || timestampWithTimeZone)
        return true;
    return false;
}
function evaluateCondition(condition, data) {
    const [condKey, operator, value] = condition;
    if (condKey.includes(" AS ") || condKey.includes(" as "))
        throw Error("Where's condition cannot contain 'AS'");
    const key = condKey.split('.')[0];
    const dataValue = data[key];
    function checkLikeData() {
        if (typeof value !== "string")
            return false;
        const checkEndData = dataValue[0] === "%";
        const checkStartData = dataValue[dataValue.length - 1] === "%";
        const onlyValue = value.replace(/\%/g, '');
        const isEndsWith = dataValue.endsWith(onlyValue);
        const isStartsWith = dataValue.startsWith(onlyValue);
        if (checkEndData && !checkStartData)
            return isEndsWith;
        else if (!checkEndData && checkStartData)
            return isStartsWith;
        else
            return isEndsWith && isStartsWith;
    }
    switch (operator) {
        case '=':
            return data[key] == value;
        case '==':
            return data[key] == value;
        case '!=':
            return data[key] != value;
        case '<>':
            return data[key] != value;
        case '>':
            return data[key] > value;
        case '<':
            return data[key] < value;
        case '>=':
            return data[key] >= value;
        case '<=':
            return data[key] <= value;
        case 'IN':
            if (!Array.isArray(value))
                throw Error("In or Not In operator must give the array a value");
            return value.includes(dataValue);
        case 'NOT IN':
            if (!Array.isArray(value))
                throw Error("In or Not In operator must give the array a value");
            return !value.includes(dataValue);
        case 'ILIKE':
            return checkLikeData();
        case 'LIKE':
            return checkLikeData();
        default:
            return false;
    }
}
function interpretWhere(data, conditions) {
    if (!conditions)
        return data;
    return data === null || data === void 0 ? void 0 : data.filter((filterData) => {
        const totalCondition = {};
        Object.keys(conditions).forEach((key) => {
            if (key === "result")
                return;
            totalCondition[key] = evaluateCondition(conditions[key], filterData);
        });
        const resultConition = conditions.result.map((result) => {
            if (result === "&&" || result === "||")
                return result;
            else if (result in totalCondition)
                return String(totalCondition[result]);
            throw Error("Result contains undefined conditions");
        }).join(" ");
        return eval(resultConition);
    });
}
