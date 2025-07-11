import { Request, Response } from 'express';
import { db } from '../app';
import { User } from '../models/Users';
import { Notification } from '../models/Notifications';

export class NotificationController {
    static async getNotifications(req: Request, res: Response) {
        const user: User | undefined = req.session.user;
        if (!user) {
            return res.redirect('/');
        }

        try {
            const [notifications] = await db.query(`
                SELECT * FROM notifications 
                WHERE user_id IS NULL OR user_id = ?
                ORDER BY created_at DESC
            `, [user.id]);

            res.render('notifications', { user, notifications, error: null });
        } catch (error) {
            console.error('Error fetching notifications:', error);
            res.render('notifications', { user, notifications: [], error: 'Erro ao carregar notificações.' });
        }
    }

    static async getNewNotification(req: Request, res: Response) {
        const user: User | undefined = req.session.user;
        if (!user) {
            return res.redirect('/');
        }

        try {
            const [users] = await db.query('SELECT id, name FROM users WHERE is_active = 1');
            const [actions] = await db.query('SELECT id, task FROM actions');
            res.render('notification-new', { user, users, actions, error: null });
        } catch (error) {
            console.error('Error fetching data for new notification:', error);
            res.render('notification-new', { user, users: [], actions: [], error: 'Erro ao carregar dados.' });
        }
    }

    static async createNotification(req: Request, res: Response) {
        const user: User | undefined = req.session.user;
        if (!user) {
            return res.redirect('/');
        }

        const { type, title, message, user_id, action_id } = req.body;

        try {
            await db.query(`
                INSERT INTO notifications (user_id, type, title, message, action_id, created_at)
                VALUES (?, ?, ?, ?, ?, NOW())
            `, [user_id || null, type, title, message, action_id || null]);

            res.redirect('/notifications');
        } catch (error) {
            console.error('Error creating notification:', error);
            const [users] = await db.query('SELECT id, name FROM users WHERE is_active = 1');
            const [actions] = await db.query('SELECT id, task FROM actions');
            res.render('notification-new', { 
                user, 
                users, 
                actions, 
                error: 'Erro ao criar notificação.' 
            });
        }
    }

    static async updateNotifications(req: Request, res: Response) {
        const user: User | undefined = req.session.user;
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
                const { type, title, message, is_read } = data as any;
                console.log(`Updating notification ID ${id}:`, { type, title, message, is_read });
                await db.query(`
                    UPDATE notifications 
                    SET type = ?, title = ?, message = ?, is_read = ?
                    WHERE id = ?
                `, [type, title, message, is_read === 'on' ? 1 : 0, id]);
            }
            res.redirect('/notifications');
        } catch (error) {
            console.error('Error updating notifications:', error);
            const [notifications] = await db.query(`
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
    }

    static async deleteNotification(req: Request, res: Response) {
        const user: User | undefined = req.session.user;
        if (!user) {
            return res.redirect('/');
        }

        const notificationId = parseInt(req.params.id);
        try {
            await db.query('DELETE FROM notifications WHERE id = ?', [notificationId]);
            res.redirect('/notifications');
        } catch (error) {
            console.error('Error deleting notification:', error);
            res.redirect('/notifications');
        }
    }

    static async markAsRead(req: Request, res: Response) {
        const user: User | undefined = req.session.user;
        if (!user) {
            return res.redirect('/');
        }

        const notificationId = parseInt(req.params.id);
        try {
            await db.query('UPDATE notifications SET is_read = 1 WHERE id = ?', [notificationId]);
            res.redirect('/dashboard');
        } catch (error) {
            console.error('Error marking notification as read:', error);
            res.redirect('/dashboard');
        }
    }
}