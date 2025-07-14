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
exports.ActionModel = void 0;
const app_1 = require("../app");
const Tasks_1 = require("./Tasks");
class ActionModel {
    static findAll(userId, role, sections, filters) {
        return __awaiter(this, void 0, void 0, function* () {
            let query = `
            SELECT a.*, s.name as section_name
            FROM actions a
            JOIN sections s ON a.section_id = s.id
        `;
            const params = [];
            if (role !== 'general_coordinator' && role !== 'project_coordinator') {
                query += ' WHERE s.name IN (?) AND (a.created_by = ? OR EXISTS (SELECT 1 FROM user_sections us WHERE us.user_id = ? AND us.section_id = a.section_id))';
                params.push(sections, userId, userId);
            }
            else {
                query += ' WHERE 1=1';
            }
            if (filters.section) {
                query += ' AND s.name = ?';
                params.push(filters.section);
            }
            if (filters.status && filters.status !== 'Todos') {
                query += ' AND a.status = ?';
                params.push(filters.status);
            }
            if (filters.priority && filters.priority !== 'Todos') {
                query += ' AND a.priority = ?';
                params.push(filters.priority);
            }
            if (filters.search) {
                query += ' AND (a.task LIKE ? OR a.responsible LIKE ? OR a.description LIKE ?)';
                const searchTerm = `%${filters.search}%`;
                params.push(searchTerm, searchTerm, searchTerm);
            }
            query += ' ORDER BY a.created_at DESC';
            const [rows] = yield app_1.db.query(query, params);
            return rows;
        });
    }
    static findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const [rows] = yield app_1.db.query(`
            SELECT a.*, s.name as section_name
            FROM actions a
            JOIN sections s ON a.section_id = s.id
            WHERE a.id = ?
        `, [id]);
            return rows[0] || null;
        });
    }
    static create(action, tasks) {
        return __awaiter(this, void 0, void 0, function* () {
            const [result] = yield app_1.db.query(`
            INSERT INTO actions (section_id, task, description, responsible, budget, deadline, priority, status, progress, completed, validated, note, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                action.section_id,
                action.task || '',
                action.description || null,
                action.responsible || '',
                action.budget || null,
                action.deadline || new Date(),
                action.priority || 'medium',
                action.status || 'pendente',
                action.progress || 0,
                action.completed || false,
                action.validated || false,
                action.note || null,
                action.created_by || null
            ]);
            const actionId = result.insertId;
            for (const task of tasks) {
                if (task.description && task.description.trim()) {
                    yield app_1.db.query('INSERT INTO action_tasks (action_id, description, completed, order_index, created_at) VALUES (?, ?, ?, ?, ?)', [actionId, task.description.trim(), task.completed, task.order_index, new Date()]);
                }
            }
            return actionId;
        });
    }
    static update(id, action, tasks) {
        return __awaiter(this, void 0, void 0, function* () {
            yield app_1.db.query(`
            UPDATE actions
            SET section_id = ?, task = ?, description = ?, responsible = ?, budget = ?, deadline = ?, priority = ?, status = ?, progress = ?, completed = ?, validated = ?, note = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            `, [
                action.section_id,
                action.task || '',
                action.description || null,
                action.responsible || '',
                action.budget || null,
                action.deadline || new Date(),
                action.priority || 'medium',
                action.status || 'pendente',
                action.progress || 0,
                action.completed || false,
                action.validated || false,
                action.note || null,
                id
            ]);
            // Buscar tarefas existentes no banco
            const existingTasks = yield Tasks_1.TaskModel.findByActionId(id);
            const existingTaskIds = existingTasks.map(task => task.id);
            const submittedTaskIds = tasks.filter(task => task.id).map(task => task.id);
            // Excluir tarefas que não estão no formulário
            const tasksToDelete = existingTaskIds.filter(id => !submittedTaskIds.includes(id));
            for (const taskId of tasksToDelete) {
                yield app_1.db.query('DELETE FROM action_tasks WHERE id = ?', [taskId]);
            }
            // Atualizar ou inserir tarefas
            for (const task of tasks) {
                if (task.description && task.description.trim()) {
                    if (task.id) {
                        // Atualizar tarefa existente
                        yield app_1.db.query('UPDATE action_tasks SET description = ?, completed = ?, order_index = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [task.description.trim(), task.completed, task.order_index, task.id]);
                    }
                    else {
                        // Inserir nova tarefa
                        yield app_1.db.query('INSERT INTO action_tasks (action_id, description, completed, order_index, created_at) VALUES (?, ?, ?, ?, ?)', [id, task.description.trim(), task.completed, task.order_index, new Date()]);
                    }
                }
            }
        });
    }
    static delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield app_1.db.query('DELETE FROM action_tasks WHERE action_id = ?', [id]);
            yield app_1.db.query('DELETE FROM actions WHERE id = ?', [id]);
        });
    }
}
exports.ActionModel = ActionModel;
