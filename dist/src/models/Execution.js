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
exports.ExecutionModel = void 0;
const app_1 = require("../app");
class ExecutionModel {
    static findAll() {
        return __awaiter(this, arguments, void 0, function* (filter = {}) {
            let query = 'SELECT id, section_id, section_name, start_date, end_date, executed,  total_budget FROM executions';
            const values = [];
            if (filter.section_name) {
                query += ' WHERE section_name LIKE ?';
                values.push(`%${filter.section_name}%`);
            }
            const [rows] = yield app_1.db.query(query, values);
            return rows.map(row => (Object.assign(Object.assign({}, row), { start_date: row.start_date && row.start_date !== '0000-00-00' ? new Date(row.start_date) : null, end_date: row.end_date && row.end_date !== '0000-00-00' ? new Date(row.end_date) : null })));
        });
    }
    static findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const [rows] = yield app_1.db.query('SELECT * FROM executions WHERE id = ?', [id]);
            if (rows.length === 0) {
                return null;
            }
            const row = rows[0];
            return Object.assign(Object.assign({}, row), { start_date: row.start_date && row.start_date !== '0000-00-00' ? new Date(row.start_date) : null, end_date: row.end_date && row.end_date !== '0000-00-00' ? new Date(row.end_date) : null });
        });
    }
    static create(execution) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = `
            INSERT INTO executions (section_id, section_name, start_date, end_date, executed,  total_budget)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
            const values = [
                execution.section_id,
                execution.section_name,
                execution.start_date || null,
                execution.end_date || null,
                execution.executed,
                execution.total_budget,
            ];
            const [result] = yield app_1.db.query(query, values);
            return result.insertId;
        });
    }
    static update(id, execution) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = `
            UPDATE executions
            SET section_id = ?, section_name = ?, start_date = ?, end_date = ?, executed = ?, total_budget = ?
            WHERE id = ?
        `;
            const values = [
                execution.section_id,
                execution.section_name,
                execution.start_date || null,
                execution.end_date || null,
                execution.executed,
                execution.total_budget,
                id,
            ];
            yield app_1.db.query(query, values);
        });
    }
    static delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield app_1.db.query('DELETE FROM executions WHERE id = ?', [id]);
        });
    }
    static bulkUpdate(updates) {
        return __awaiter(this, void 0, void 0, function* () {
            const promises = updates.map(update => {
                const query = `
                UPDATE executions
                SET section_id = ?, section_name = ?, start_date = ?, end_date = ?, executed = ?, total_budget = ?
                WHERE id = ?
            `;
                return app_1.db.query(query, [
                    update.section_id,
                    update.section_name,
                    update.start_date || null,
                    update.end_date || null,
                    update.executed,
                    update.total_budget,
                    update.id,
                ]);
            });
            yield Promise.all(promises);
        });
    }
}
exports.ExecutionModel = ExecutionModel;
