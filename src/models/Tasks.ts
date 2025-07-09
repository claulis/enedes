import { db } from '../app';

export interface Task {
    id: number;
    action_id: number;
    description: string;
    completed: boolean;
    order: number;
    created_at: Date;
}

export class TaskModel {
    static async findByActionId(actionId

: number): Promise<Task[]> {
        const [rows] = await db.query('SELECT * FROM task WHERE action_id = ? ORDER BY `order`', [actionId]);
        return rows as Task[];
    }

    static async findById(id: number): Promise<Task | null> {
        const [rows] = await db.query('SELECT * FROM task WHERE id = ?', [id]);
        return (rows as Task[])[0] || null;
    }

    static async update(id: number, task: Partial<Task>): Promise<void> {
        await db.query(
            'UPDATE task SET description = ?, completed = ? WHERE id = ?',
            [task.description,	task.completed, id]
        );
    }

    static async delete(id: number): Promise<void> {
        await db.query('DELETE FROM task WHERE id = ?', [id]);
    }
}