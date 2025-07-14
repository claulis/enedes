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
exports.TaskAssignmentModel = void 0;
const app_1 = require("../app");
class TaskAssignmentModel {
    static create(assignment) {
        return __awaiter(this, void 0, void 0, function* () {
            const [result] = yield app_1.db.query('INSERT INTO task_assignments (action_id, task_id, collaborator_id, assigned_by, message, priority, status, deadline) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [
                assignment.action_id,
                assignment.task_id,
                assignment.collaborator_id,
                assignment.assigned_by,
                assignment.message,
                assignment.priority || 'medium',
                assignment.status || 'sent',
                assignment.deadline
            ]);
            return result.insertId;
        });
    }
    static findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const [rows] = yield app_1.db.query(`SELECT ta.*, c.name as collaborator_name, at.description as task_description 
             FROM task_assignments ta 
             LEFT JOIN collaborators c ON ta.collaborator_id = c.id 
             LEFT JOIN action_tasks at ON ta.task_id = at.id 
             WHERE ta.id = ?`, [id]);
            if (rows.length === 0)
                return null;
            return Object.assign(Object.assign({}, rows[0]), { deadline: rows[0].deadline ? new Date(rows[0].deadline) : null });
        });
    }
    static findByActionId(actionId) {
        return __awaiter(this, void 0, void 0, function* () {
            const [rows] = yield app_1.db.query(`SELECT ta.*, c.name as collaborator_name, at.description as task_description 
             FROM task_assignments ta 
             LEFT JOIN collaborators c ON ta.collaborator_id = c.id 
             LEFT JOIN action_tasks at ON ta.task_id = at.id 
             WHERE ta.action_id = ?`, [actionId]);
            return rows.map(row => (Object.assign(Object.assign({}, row), { deadline: row.deadline ? new Date(row.deadline) : null })));
        });
    }
    static update(id, assignment) {
        return __awaiter(this, void 0, void 0, function* () {
            yield app_1.db.query('UPDATE task_assignments SET action_id = ?, task_id = ?, collaborator_id = ?, message = ?, priority = ?, status = ?, deadline = ? WHERE id = ?', [
                assignment.action_id,
                assignment.task_id,
                assignment.collaborator_id,
                assignment.message,
                assignment.priority,
                assignment.status,
                assignment.deadline,
                id
            ]);
        });
    }
    static delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield app_1.db.query('DELETE FROM task_assignments WHERE id = ?', [id]);
        });
    }
}
exports.TaskAssignmentModel = TaskAssignmentModel;
