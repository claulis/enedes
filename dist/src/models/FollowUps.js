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
exports.FollowUpModel = void 0;
const app_1 = require("../app");
class FollowUpModel {
    static findByActionId(actionId) {
        return __awaiter(this, void 0, void 0, function* () {
            const [rows] = yield app_1.db.query('SELECT * FROM follow_ups WHERE action_id = ?', [actionId]);
            return rows;
        });
    }
    static findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const [rows] = yield app_1.db.query('SELECT * FROM follow_ups WHERE id = ?', [id]);
            return rows[0] || null;
        });
    }
    static create(followUp) {
        return __awaiter(this, void 0, void 0, function* () {
            const [result] = yield app_1.db.query(`
            INSERT INTO follow_ups (action_id, assigned_to, created_by, title, description, next_steps, obstacles, comments, priority, status, start_date, end_date, new_deadline)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                followUp.action_id,
                followUp.assigned_to,
                followUp.created_by,
                followUp.title,
                followUp.description,
                followUp.next_steps || null,
                followUp.obstacles || null,
                followUp.comments || null,
                followUp.priority || 'medium',
                followUp.status || 'pending',
                followUp.start_date || null,
                followUp.end_date,
                followUp.new_deadline || null
            ]);
            return result.insertId;
        });
    }
    static update(id, followUp) {
        return __awaiter(this, void 0, void 0, function* () {
            yield app_1.db.query(`
            UPDATE follow_ups
            SET action_id = ?, assigned_to = ?, title = ?, description = ?, next_steps = ?, obstacles = ?, comments = ?, priority = ?, status = ?, start_date = ?, end_date = ?, new_deadline = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            `, [
                followUp.action_id,
                followUp.assigned_to,
                followUp.title,
                followUp.description,
                followUp.next_steps || null,
                followUp.obstacles || null,
                followUp.comments || null,
                followUp.priority || 'medium',
                followUp.status || 'pending',
                followUp.start_date || null,
                followUp.end_date,
                followUp.new_deadline || null,
                id
            ]);
        });
    }
    static delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield app_1.db.query('DELETE FROM follow_ups WHERE id = ?', [id]);
        });
    }
}
exports.FollowUpModel = FollowUpModel;
