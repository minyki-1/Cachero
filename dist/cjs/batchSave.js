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
exports.batchSave = void 0;
function batchSave(info, preloadData) {
    return __awaiter(this, void 0, void 0, function* () {
        const { data, cachedKey } = info;
        upsertData(info);
        deleteData(info);
        data.splice(0, data.length);
        cachedKey.splice(0, cachedKey.length);
        if (preloadData && Array.isArray(preloadData))
            data.push(...preloadData);
    });
}
exports.batchSave = batchSave;
function upsertData(info) {
    return __awaiter(this, void 0, void 0, function* () {
        const { queryRunner, tableName, tableColumns, data, refKey } = info;
        if (!queryRunner || !tableName || !refKey)
            throw Error("You should setting before use select");
        const upsertQuery = `
    INSERT INTO ${tableName} (${tableColumns.join(", ")})
    VALUES
      ${data.map((_, index) => `(${tableColumns.map((_, key) => `$${(index * tableColumns.length) + (key + 1)}`).join(', ')})`).join(', ')}
    ON CONFLICT (${String(refKey)}) DO UPDATE
    SET
      ${tableColumns.map((column) => `${column} = COALESCE(EXCLUDED.${column}, ${tableName}.${column}`).join(", ")}
  `;
        const queryValues = [];
        data.forEach((value) => {
            tableColumns.forEach((column) => {
                queryValues.push(value[column]);
            });
        });
        yield queryRunner.query(upsertQuery, queryValues);
    });
}
function deleteData(info) {
    return __awaiter(this, void 0, void 0, function* () {
        const { deleted, tableName, queryRunner } = info;
        if (!queryRunner || !tableName)
            throw Error("You should setting before use select");
        const deleteQuery = `
    DELETE FROM ${tableName}
    WHERE ${Object.keys(deleted).map((key, index1) => `${key} IN (${deleted[key].map((_, index2) => `$${(index1 * deleted[key].length) + (index2 + 1)}`).join(', ')})`).join(' OR ')};
  `;
        const queryValues = [];
        Object.keys(deleted).forEach((key) => {
            queryValues.push(...deleted[key]);
        });
        yield queryRunner.query(deleteQuery, queryValues);
    });
}
