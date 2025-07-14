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
exports.TaskModel = void 0;
const app_1 = require("../app");
class TaskModel {
    static findByActionId(actionId) {
        return __awaiter(this, void 0, void 0, function* () {
            const [rows] = yield app_1.db.query('SELECT * FROM action_tasks WHERE action_id = ? ORDER BY order_index', [actionId]);
            return rows;
        });
    }
    static findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const [rows] = yield app_1.db.query('SELECT * FROM action_tasks WHERE id = ?', [id]);
            return rows[0] || null;
        });
    }
    static update(id, task) {
        return __awaiter(this, void 0, void 0, function* () {
            yield app_1.db.query('UPDATE action_tasks SET description = ?, completed = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [task.description, task.completed, id]);
        });
    }
    static delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield app_1.db.query('DELETE FROM action_tasks WHERE id = ?', [id]);
        });
    }
}
exports.TaskModel = TaskModel;
