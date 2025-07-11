
// src/models/Notifications.ts
import { db } from '../app';
import { RowDataPacket } from 'mysql2/promise';

// Interface for database query results
export interface Notification extends RowDataPacket {
    id: number;
    user_id: number | null;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    action_id: number | null;
    follow_up_id: number | null;
    is_read: boolean;
    created_at: Date;
}

// Interface for creating/updating notifications (no RowDataPacket)
export interface NotificationInput {
    user_id?: number | null;
    type?: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    action_id?: number | null;
    follow_up_id?: number | null;
    is_read?: boolean;
}

export class NotificationModel {
    static async findById(id: number): Promise<Notification | null> {
        const [rows] = await db.query<Notification[]>('SELECT * FROM notifications WHERE id = ?', [id]);
        return rows[0] || null;
    }

    static async findByUserId(userId: number): Promise<Notification[]> {
        const [rows] = await db.query<Notification[]>(
            'SELECT * FROM notifications WHERE user_id = ? OR user_id IS NULL ORDER BY created_at DESC',
            [userId]
        );
        return rows;
    }

    static async create(notification: NotificationInput): Promise<number> {
        const { user_id, type, title, message, action_id, follow_up_id, is_read } = notification;
        const [result] = await db.query(
            'INSERT INTO notifications (user_id, type, title, message, action_id, follow_up_id, is_read) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [user_id || null, type || 'info', title, message, action_id || null, follow_up_id || null, is_read ? 1 : 0]
        );
        return (result as any).insertId;
    }

    static async update(id: number, notification: NotificationInput): Promise<void> {
        const { user_id, type, title, message, action_id, follow_up_id, is_read } = notification;
        await db.query(
            'UPDATE notifications SET user_id = ?, type = ?, title = ?, message = ?, action_id = ?, follow_up_id = ?, is_read = ? WHERE id = ?',
            [user_id || null, type || 'info', title, message, action_id || null, follow_up_id || null, is_read ? 1 : 0, id]
        );
    }
}
