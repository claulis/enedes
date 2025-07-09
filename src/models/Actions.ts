import { db } from '../app';

export interface Action {
    id: number;
    task: string;
    responsible: string;
    deadline: Date;
    budget: string;
    status: string;
    progress: number;
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
            query += ' WHERE section IN (?)';
            params.push(sections);
        }

        if (filters.section) {
            query += role === 'admin' ? ' WHERE section = ?' : ' AND section = ?';
            params.push(filters.section);
        }

        if (filters.status) {
            query += role === 'admin' && !filters.section ? ' WHERE status = ?' : ' AND status = ?';
            params.push(filters.status);
        }

        if (filters.search) {
            query += (role === 'admin' && !filters.section && !filters.status ? ' WHERE' : ' AND') + ' (task LIKE ? OR responsible LIKE ? OR description LIKE ?)';
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

    static async create(action: Partial<Action>, tasks: { description: string, completed: boolean }[]): Promise<number> {
        const [result] = await db.query(
            'INSERT INTO action (task, responsible, deadline, budget, status, progress, description, note, priority, section, completed, validated, created_date, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                action.task, action.responsible, action.deadline, action.budget, action.status, action.progress,
                action.description, action.note, action.priority, action.section, action.completed, action.validated,
                action.created_date, action.created_by
            ]
        );
        const actionId = (result as any).insertId;

        for (let i = 0; i < tasks.length; i++) {
            await db.query(
                'INSERT INTO task (action_id, description, completed, `order`) VALUES (?, ?, ?, ?)',
                [actionId, tasks[i].description, tasks[i].completed, i]
            );
        }

        return actionId;
    }

    static async update(id: number, action: Partial<Action>, tasks: { id?: number, description: string, completed: boolean, order: number }[]): Promise<void> {
        await db.query(
            'UPDATE action SET task = ?, responsible = ?, deadline = ?, budget = ?, status = ?, progress = ?, description = ?, note = ?, priority = ?, section = ?, completed = ?, validated = ?, created_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [
                action.task, action.responsible, action.deadline, action.budget, action.status, action.progress,
                action.description, action.note, action.priority, action.section, action.completed, action.validated,
                action.created_date, id
            ]
        );

        // Delete existing tasks
        await db.query('DELETE FROM task WHERE action_id = ?', [id]);

        // Insert updated tasks
        for (let i = 0; i < tasks.length; i++) {
            await db.query(
                'INSERT INTO task (action_id, description, completed, `order`) VALUES (?, ?, ?, ?)',
                [id, tasks[i].description, tasks[i].completed, i]
            );
        }
    }

    static async delete(id: number): Promise<void> {
        await db.query('DELETE FROM action WHERE id = ?', [id]);
        // Tasks are deleted automatically via ON DELETE CASCADE
    }
}