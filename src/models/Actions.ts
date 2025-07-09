import { db } from '../app';

export interface Action {
    id: number;
    task: string;
    responsible: string;
    deadline: Date;
    budget: string;
    status: string;
    description: string;
    note: string;
    priority: string;
    section: string;
    completed: boolean;
    validated: boolean;
    created_date: Date;
    created_at: Date;
    updated_at: Date;
    created_by: number;
}

export class ActionModel {
    static async findAll(userId: number, role: string, sections: string[], filters: { section?: string, status?: string, search?: string }): Promise<Action[]> {
        let query = 'SELECT * FROM action';
        const params: any[] = [];

        if (role !== 'admin') {
            query += ' WHERE section IN (?) AND created_by = ?';
            params.push(sections, userId);
        } else {
            query += ' WHERE 1=1';
        }

        if (filters.section) {
            query += ' AND section = ?';
            params.push(filters.section);
        }

        if (filters.status && filters.status !== 'Todos') {
            query += ' AND status = ?';
            params.push(filters.status);
        }

        if (filters.search) {
            query += ' AND (task LIKE ? OR responsible LIKE ? OR description LIKE ?)';
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        query += ' ORDER BY created_at DESC';
        const [rows] = await db.query(query, params);
        return rows as Action[];
    }

    static async findById(id: number): Promise<Action | null> {
        const [rows] = await db.query('SELECT * FROM action WHERE id = ?', [id]);
        return (rows as Action[])[0] || null;
    }

    static async create(action: Partial<Action>, tasks: { description: string, completed: boolean, order: number }[]): Promise<number> {
        const [result] = await db.query(
            'INSERT INTO action (task, responsible, deadline, budget, status, description, note, priority, section, completed, validated, created_date, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                action.task || '',
                action.responsible || '',
                action.deadline || new Date(),
                action.budget || '',
                action.status || 'pendente',
                action.description || '',
                action.note || '',
                action.priority || 'medium',
                action.section || '',
                action.completed || false,
                action.validated || false,
                action.created_date || new Date(),
                action.created_by || 0
            ]
        );
        const actionId = (result as any).insertId;

        for (const task of tasks) {
            if (task.description) {
                await db.query(
                    'INSERT INTO task (action_id, description, completed, `order`, created_at) VALUES (?, ?, ?, ?, ?)',
                    [actionId, task.description, task.completed, task.order, new Date()]
                );
            }
        }

        return actionId;
    }

    static async update(id: number, action: Partial<Action>, tasks: { description: string, completed: boolean, order: number }[]): Promise<void> {
        await db.query(
            'UPDATE action SET task = ?, responsible = ?, deadline = ?, budget = ?, status = ?, description = ?, note = ?, priority = ?, section = ?, completed = ?, validated = ?, created_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [
                action.task || '',
                action.responsible || '',
                action.deadline || new Date(),
                action.budget || '',
                action.status || 'pendente',
                action.description || '',
                action.note || '',
                action.priority || 'medium',
                action.section || '',
                action.completed || false,
                action.validated || false,
                action.created_date || new Date(),
                id
            ]
        );

        await db.query('DELETE FROM task WHERE action_id = ?', [id]);

        for (const task of tasks) {
            if (task.description) {
                await db.query(
                    'INSERT INTO task (action_id, description, completed, `order`, created_at) VALUES (?, ?, ?, ?, ?)',
                    [id, task.description, task.completed, task.order, new Date()]
                );
            }
        }
    }

    static async delete(id: number): Promise<void> {
        await db.query('DELETE FROM task WHERE action_id = ?', [id]);
        await db.query('DELETE FROM action WHERE id = ?', [id]);
    }
}