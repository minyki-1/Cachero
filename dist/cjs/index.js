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
exports.createCachero = void 0;
const create_js_1 = require("./create.js");
const delete_js_1 = require("./delete.js");
const select_js_1 = require("./select.js");
const update_js_1 = require("./update.js");
const batchSave_js_1 = require("./batchSave.js");
const createCachero = () => {
    const info = {
        queryRunner: null,
        redis: null,
        data: [],
        tableName: null,
        cachedKey: [],
        count: 0,
        deleted: {},
        tableColumns: [],
        refKey: null
    };
    return {
        /**
         * @Tip Scheduler can set multiple time zones -
         * [[1,0],[12,0]] = 01:00, 12:00
         * */
        scheduler: (times, preloadData) => scheduler(info, times, preloadData),
        /** You should setting before use select | create | update | delete*/
        setting: (data) => setting(info, data),
        /** @Tip Recommend importing columns of all data at once for data reuse*/
        select: (queryForm = { column: ["*"] }, key = null) => (0, select_js_1.select)(info, queryForm, key),
        /** @Tip Newly created data can be delivered immediately*/
        create: (newData) => { (0, create_js_1.create)(info, newData); info.count++; },
        /** @Tip Updated data will be applied immediately*/
        update: (newData) => { (0, update_js_1.update)(info, newData); info.count--; },
        delete: (condition) => (0, delete_js_1.deleteData)(info, condition),
        batchSave: (preloadData) => (0, batchSave_js_1.batchSave)(info, preloadData),
    };
};
exports.createCachero = createCachero;
function setting(info, data) {
    return __awaiter(this, void 0, void 0, function* () {
        const { table, preloadData, queryRunner, redis, refKey } = data;
        if (!queryRunner || !table || !refKey)
            throw Error("You should setting information");
        info.tableName = table;
        info.queryRunner = queryRunner;
        info.refKey = refKey;
        const columnNameResult = yield queryRunner.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = '${table}';
  `);
        info.tableColumns = columnNameResult.rows.map(({ column_name }) => column_name);
        if (preloadData)
            info.data = [...preloadData];
        if (redis)
            info.redis = redis;
        const countResult = yield queryRunner.query(`SELECT COUNT(*) FROM ${table};`);
        info.count = countResult;
        console.log(`Cachero(${table}) setting completed`);
    });
}
function scheduler(info, times, preloadData) {
    const intervalId = setInterval(() => {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        for (let i = 0; i < times.length; i++) {
            const [hour, minute] = times[i];
            if (currentHour === hour && currentMinute === minute) {
                (0, batchSave_js_1.batchSave)(info, preloadData);
                break;
            }
        }
    }, 60000);
    const cancel = () => clearInterval(intervalId);
    return { cancel };
}
