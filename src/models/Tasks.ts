import { db } from '../app';

export interface Task {
    id: number;
    action_id: number;
    description: string;
    completed: boolean;
    order_index: number;
    created_at: Date;
    updated_at: Date;
}

export class TaskModel {
    static async findByActionId(actionId: number): Promise<Task[]> {
        const [rows] = await db.query('SELECT * FROM action_tasks WHERE action_id = ? ORDER BY order_index', [actionId]);
        return rows as Task[];
    }

    static async findById(id: number): Promise<Task | null> {
        const [rows] = await db.query('SELECT * FROM action_tasks WHERE id = ?', [id]);
        return (rows as Task[])[0] || null;
    }

    static async update(id: number, task: Partial<Task>): Promise<void> {
        await db.query(
            'UPDATE action_tasks SET description = ?, completed = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [task.description, task.completed, id]
        );
    }

    static async delete(id: number): Promise<void> {
        await db.query('DELETE FROM action_tasks WHERE id = ?', [id]);
    }
}