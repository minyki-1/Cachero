import { ICacheInfo, QueryForm } from "./types";

export const select = async <T = Object>(info:ICacheInfo<T>, queryForm:QueryForm, key:string | null) => {
  const { data, count,cachedKey } = info;

  checkQueryFormVaild(info, queryForm)

  const cachedKeyValid = key ? info.cachedKey.includes(key) : false;

  if (cachedKeyValid || data.length === count) {
    let resultData:T[] = JSON.parse(JSON.stringify(data));

    if ("column" in queryForm && resultData) resultData = interpretColumn<T>(info, queryForm.column, resultData)

    if ("order" in queryForm && resultData) resultData = interpretOrder<T>(queryForm.order, resultData)

    if ("where" in queryForm && resultData) resultData = interpretWhere(resultData, queryForm.where)

    if ("offset" in queryForm && resultData) resultData = resultData?.slice(queryForm.offset)

    if ("limit" in queryForm && resultData) resultData = resultData?.slice(0, queryForm.limit)

    if (resultData && resultData.length > 0) return resultData
  }
  const result = await selectQueryResult(info, queryForm)
  cachedKey.push(key)
  return result
}

function interpretOrder<T>(orderForm:QueryForm["order"], data:T[]) {
  return data?.sort((a, b) => compareData<T>(a, b, orderForm));
}

function compareData<T>(a:T, b:T, keys:QueryForm["order"], index = 0) {
  const keyArray = keys[index].split(" ")
  const order = keyArray.length === 2 ? keyArray[1] : "ASC"
  const key = keyArray[0];
  const x = a[key];
  const y = b[key];

  if (a[key] === b[key]) {
    if (index < keys.length - 1) {
      return compareData(a, b, keys, index + 1);
    } else {
      return 0;
    }
  }

  if (typeof x === 'number' && typeof y === 'number') {
    if (order === "DESC") return y - x;
    else return x - y;
  } else if (isDateString(x) && isDateString(y)) {
    // @ts-ignore
    if (order === "DESC") return new Date(y) - new Date(x);
    // @ts-ignore
    else return new Date(x) - new Date(y);
  }
  else {
    if (order === "DESC") {
      if (x > y) return -1;
      else if (x < y) return 1;
      else return 0;
    } else {
      if (x < y) return -1;
      else if (x > y) return 1;
      else return 0;
    }
  }
}

function interpretColumn<T>(info:ICacheInfo<T>, columnForm:QueryForm["column"], data:T[]) {
  const { tableName, tableColumns } = info
  const columnList:string[] = []

  columnForm.forEach((column) => {
    const dotResult = column.match(/\.(\w+)/);
    const isIncludeNotTableName = column.includes(".*") && !column.includes(tableName);
    const isIncludeAS = column.includes(" AS ") ? " AS " : null || column.includes(" as ") ? " as " : null
    let resultColumn = column;
    if (isIncludeAS) {
      resultColumn = column.split(isIncludeAS)[1]
    } else if (column === `${tableName}.*` || column === "*") {
      return columnList.push(...tableColumns)
    } else if (isIncludeNotTableName) {
      throw Error(`You can't send column like this: anotherTable.*`);
    } else if (dotResult && dotResult.length > 1) {
      resultColumn = dotResult[1]
    }
    if (columnList.includes(resultColumn)) throw Error("Wrong Column Selected");
    return columnList.push(resultColumn)
  })

  let isIncorrectColumn = false
  const result:T[] = data.map((obj) => {
    const filteredObj:any = {};
    columnList.forEach((key) => {
      if (obj.hasOwnProperty(key)) {
        filteredObj[key] = obj[key];
      } else {
        isIncorrectColumn = true
      }
    });
    return filteredObj;
  });

  if (isIncorrectColumn) return [];
  return result
}

async function selectQueryResult<T>(info:ICacheInfo<T>, queryForm:QueryForm) {
  const { queryRunner, tableName, deleted, data, redis } = info
  const queryProps:any[] = []
  const where = queryForm.where ? "WHERE " + queryForm.where.result.map((condition) => {
    if (condition === "&&" || condition === "||") return condition
    if (!(condition in queryForm.where) || queryForm.where[condition].length !== 3) throw Error("Result contains undefined conditions")
    const [key, operator, value] = queryForm.where[condition]
    if (operator === "IN" || operator === "NOT IN") {
      return key + operator + `(${Array.isArray(value) ? value.map((valueData) => {
        queryProps.push(valueData);
        return `$${queryProps.length}`;
      }).join(',') : () => {
        queryProps.push(value);
        return `$${queryProps.length}`;
      }})`
    } else {
      queryProps.push(value)
      return `${key} ${operator} $${queryProps.length}`
    }
  }).join(" ") : ""

  const join = queryForm.join ? "JOIN " + queryForm.join : ""
  const columnList = queryForm.column ? queryForm.column.join(", ") : '*'
  const order = queryForm.order ? "ORDER BY " + queryForm.order.join(", ") : ""
  const limit = queryForm.limit ? "LIMIT " + queryForm.limit : ""
  const offset = queryForm.offset ? "OFFSET " + queryForm.offset : ""
  const result:{rows:T[]} = await queryRunner(`
    SELECT ${columnList}
    FROM ${tableName}
    ${join}
    ${where}
    ${order}
    ${limit}
    ${offset};
  `, queryProps);

  for (const [key, value] of Object.entries(deleted)) {
    result.rows.forEach((resultData, index) => {
      if (resultData[key] === value) delete result.rows[index]
    })
  }
  // TODO: Select할때 가져오는 데이터를 병합할때 기준이되는 값을 어떻게 할지 
  const selectResult:T[] = JSON.parse(JSON.stringify(result.rows))
  selectResult.forEach(newObj => {
    const existingObjIndex = data.findIndex(obj => obj.id === newObj.id);
    if (existingObjIndex !== -1) {
      data[existingObjIndex] = { ...data[existingObjIndex], ...newObj }; // 이미 있는 오브젝트를 덮어씌우면서 새로운 키를 추가
    } else {
      data.push(newObj); // 새로운 오브젝트를 추가
    }
  });
  if (redis) redis(tableName, JSON.stringify(data))
  return result.rows
}

function checkQueryFormVaild({ tableName }, queryForm) {
  queryForm.column.forEach((column) => {
    if (column.includes(".*") && !column.includes(tableName)) {
      throw Error(`You can't send column like this: anotherTable.*`);
    }
  })
}

function isDateString(inputString) {
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  const timestampPattern = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
  const timestampWithTimeZonePattern = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} [+-]\d{2}:\d{2}$/;
  const dateTest = datePattern.test(inputString)
  const timestampTest = timestampPattern.test(inputString)
  const timestampWithTimeZone = timestampWithTimeZonePattern.test(inputString)
  if (dateTest || timestampTest || timestampWithTimeZone) return true
  return false
}


function evaluateCondition(condition, item) {
  const [condKey, operator, value] = condition;

  if (condKey.includes(" AS ") || condKey.includes(" as ")) throw Error("Where's condition cannot contain 'AS'");

  const key = condKey.split('.')[0]

  function checkLikeData() {
    const checkEndData = item[key][0] === "%";
    const checkStartData = item[key][item[key].length - 1] === "%";
    const onlyValue = value.replace(/\%/g, '');
    const isEndsWith = item[key].endsWith(onlyValue)
    const isStartsWith = item[key].startsWith(onlyValue)

    if (checkEndData && !checkStartData) return isEndsWith
    else if (!checkEndData && checkStartData) return isStartsWith
    else return isEndsWith && isStartsWith
  }
  switch (operator) {
    case '=':
      return item[key] == value;
    case '==':
      return item[key] == value;
    case '!=':
      return item[key] != value;
    case '<>':
      return item[key] != value;
    case '>':
      return item[key] > value;
    case '<':
      return item[key] < value;
    case '>=':
      return item[key] >= value;
    case '<=':
      return item[key] <= value;
    case 'IN':
      return value.includes(item[key]);
    case 'NOT IN':
      return !value.includes(item[key]);
    case 'ILIKE':
      return checkLikeData()
    case 'LIKE':
      return checkLikeData()
    default:
      return true;
  }
}

function interpretWhere(data, conditions) {
  return data?.filter((filterData) => {
    const totalCondition = {}
    Object.keys(conditions).forEach((key) => {
      if (key === "result") return;
      totalCondition[key] = evaluateCondition(conditions[key], filterData)
    })
    const resultCon = conditions.result.map((result) => {
      if (result === "&&" || result === "||") return result
      else if (result in totalCondition) return String(totalCondition[result])
      throw Error("Result contains undefined conditions")
    }).join(" ")
    return eval(resultCon)
  })
}