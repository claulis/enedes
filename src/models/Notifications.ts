import { db } from '../app';

export interface Notification {
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

export class NotificationModel {
    static async findByUserId(userId: number, limit: number = 10): Promise<Notification[]> {
        const [rows] = await db.query(
            'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
            [userId, limit]
        );
        return rows as Notification[];
    }

    static async markAsRead(id: number): Promise<void> {
        await db.query('UPDATE notifications SET is_read = 1 WHERE id = ?', [id]);
    }
}