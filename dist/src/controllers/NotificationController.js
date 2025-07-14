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
exports.NotificationController = void 0;
const app_1 = require("../app");
class NotificationController {
    static getNotifications(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = req.session.user;
            if (!user) {
                return res.redirect('/');
            }
            try {
                const [notifications] = yield app_1.db.query(`
                SELECT * FROM notifications 
                WHERE user_id IS NULL OR user_id = ?
                ORDER BY created_at DESC
            `, [user.id]);
                res.render('notifications', { user, notifications, error: null });
            }
            catch (error) {
                console.error('Error fetching notifications:', error);
                res.render('notifications', { user, notifications: [], error: 'Erro ao carregar notificações.' });
            }
        });
    }
    static getNewNotification(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = req.session.user;
            if (!user) {
                return res.redirect('/');
            }
            try {
                const [users] = yield app_1.db.query('SELECT id, name FROM users WHERE is_active = 1');
                const [actions] = yield app_1.db.query('SELECT id, task FROM actions');
                res.render('notification-new', { user, users, actions, error: null });
            }
            catch (error) {
                console.error('Error fetching data for new notification:', error);
                res.render('notification-new', { user, users: [], actions: [], error: 'Erro ao carregar dados.' });
            }
        });
    }
    static createNotification(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = req.session.user;
            if (!user) {
                return res.redirect('/');
            }
            const { type, title, message, user_id, action_id } = req.body;
            try {
                yield app_1.db.query(`
                INSERT INTO notifications (user_id, type, title, message, action_id, created_at)
                VALUES (?, ?, ?, ?, ?, NOW())
            `, [user_id || null, type, title, message, action_id || null]);
                res.redirect('/notifications');
            }
            catch (error) {
                console.error('Error creating notification:', error);
                const [users] = yield app_1.db.query('SELECT id, name FROM users WHERE is_active = 1');
                const [actions] = yield app_1.db.query('SELECT id, task FROM actions');
                res.render('notification-new', {
                    user,
                    users,
                    actions,
                    error: 'Erro ao criar notificação.'
                });
            }
        });
    }
    static updateNotifications(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = req.session.user;
            if (!user) {
                return res.redirect('/');
            }
            const notifications = req.body.notifications;
            if (!notifications) {
                console.log('No notifications data received');
                return res.render('notifications', {
                    user,
                    notifications: [],
                    error: 'Nenhum dado de notificação recebido.'
                });
            }
            console.log('Received notifications:', JSON.stringify(notifications, null, 2));
            try {
                for (const [id, data] of Object.entries(notifications)) {
                    const { type, title, message, is_read } = data;
                    console.log(`Updating notification ID ${id}:`, { type, title, message, is_read });
                    yield app_1.db.query(`
                    UPDATE notifications 
                    SET type = ?, title = ?, message = ?, is_read = ?
                    WHERE id = ?
                `, [type, title, message, is_read === 'on' ? 1 : 0, id]);
                }
                res.redirect('/notifications');
            }
            catch (error) {
                console.error('Error updating notifications:', error);
                const [notifications] = yield app_1.db.query(`
                SELECT * FROM notifications 
                WHERE user_id IS NULL OR user_id = ?
                ORDER BY created_at DESC
            `, [user.id]);
                res.render('notifications', {
                    user,
                    notifications,
                    error: 'Erro ao atualizar notificações.'
                });
            }
        });
    }
    static deleteNotification(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = req.session.user;
            if (!user) {
                return res.redirect('/');
            }
            const notificationId = parseInt(req.params.id);
            try {
                yield app_1.db.query('DELETE FROM notifications WHERE id = ?', [notificationId]);
                res.redirect('/notifications');
            }
            catch (error) {
                console.error('Error deleting notification:', error);
                res.redirect('/notifications');
            }
        });
    }
    static markAsRead(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = req.session.user;
            if (!user) {
                return res.redirect('/');
            }
            const notificationId = parseInt(req.params.id);
            try {
                yield app_1.db.query('UPDATE notifications SET is_read = 1 WHERE id = ?', [notificationId]);
                res.redirect('/dashboard');
            }
            catch (error) {
                console.error('Error marking notification as read:', error);
                res.redirect('/dashboard');
            }
        });
    }
}
exports.NotificationController = NotificationController;
