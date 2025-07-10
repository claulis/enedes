import { db } from '../app';

export interface FollowUp {
    id: number;
    action_id: number;
    assigned_to: number;
    created_by: number;
    title: string;
    description: string;
    next_steps: string | null;
    obstacles: string | null;
    comments: string | null;
    priority: 'low' | 'medium' | 'high';
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    start_date: Date | null;
    end_date: Date;
    new_deadline: Date | null;
    created_at: Date;
    updated_at: Date;
}

export class FollowUpModel {
    static async findByActionId(actionId: number): Promise<FollowUp[]> {
        const [rows] = await db.query('SELECT * FROM follow_ups WHERE action_id = ?', [actionId]);
        return rows as FollowUp[];
    }

    static async findById(id: number): Promise<FollowUp | null> {
        const [rows] = await db.query('SELECT * FROM follow_ups WHERE id = ?', [id]);
        return (rows as FollowUp[])[0] || null;
    }

    static async create(followUp: Partial<FollowUp>): Promise<number> {
        const [result] = await db.query(
            `
            INSERT INTO follow_ups (action_id, assigned_to, created_by, title, description, next_steps, obstacles, comments, priority, status, start_date, end_date, new_deadline)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
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
            ]
        );
        return (result as any).insertId;
    }

    static async update(id: number, followUp: Partial<FollowUp>): Promise<void> {
        await db.query(
            `
            UPDATE follow_ups
            SET action_id = ?, assigned_to = ?, title = ?, description = ?, next_steps = ?, obstacles = ?, comments = ?, priority = ?, status = ?, start_date = ?, end_date = ?, new_deadline = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            `,
            [
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
            ]
        );
    }

    static async delete(id: number): Promise<void> {
        await db.query('DELETE FROM follow_ups WHERE id = ?', [id]);
    }
}