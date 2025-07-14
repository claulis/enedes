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
exports.NotificationModel = void 0;
// src/models/Notifications.ts
const app_1 = require("../app");
class NotificationModel {
    static findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const [rows] = yield app_1.db.query('SELECT * FROM notifications WHERE id = ?', [id]);
            return rows[0] || null;
        });
    }
    static findByUserId(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const [rows] = yield app_1.db.query('SELECT * FROM notifications WHERE user_id = ? OR user_id IS NULL ORDER BY created_at DESC', [userId]);
            return rows;
        });
    }
    static create(notification) {
        return __awaiter(this, void 0, void 0, function* () {
            const { user_id, type, title, message, action_id, follow_up_id, is_read } = notification;
            const [result] = yield app_1.db.query('INSERT INTO notifications (user_id, type, title, message, action_id, follow_up_id, is_read) VALUES (?, ?, ?, ?, ?, ?, ?)', [user_id || null, type || 'info', title, message, action_id || null, follow_up_id || null, is_read ? 1 : 0]);
            return result.insertId;
        });
    }
    static update(id, notification) {
        return __awaiter(this, void 0, void 0, function* () {
            const { user_id, type, title, message, action_id, follow_up_id, is_read } = notification;
            yield app_1.db.query('UPDATE notifications SET user_id = ?, type = ?, title = ?, message = ?, action_id = ?, follow_up_id = ?, is_read = ? WHERE id = ?', [user_id || null, type || 'info', title, message, action_id || null, follow_up_id || null, is_read ? 1 : 0, id]);
        });
    }
}
exports.NotificationModel = NotificationModel;
