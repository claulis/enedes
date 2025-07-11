import { db } from '../app';
import { TaskModel } from './Tasks';

export interface Action {
    id: number;
    section_id: number;
    task: string;
    description: string | null;
    responsible: string;
    budget: string | null;
    deadline: Date;
    priority: 'low' | 'medium' | 'high';
    status: 'pendente' | 'em_andamento' | 'alerta' | 'concluida' | 'atrasado';
    progress: number;
    completed: boolean;
    validated: boolean;
    note: string | null;
    created_by: number | null;
    created_at: Date;
    updated_at: Date;
    section_name?: string;
}

export interface TaskData {
    id?: number;
    description: string;
    completed: boolean;
    order_index: number;
}

export class ActionModel {
    static async findAll(userId: number, role: string, sections: string[], filters: { section?: string; status?: string; priority?: string; search?: string }): Promise<Action[]> {
        let query = `
            SELECT a.*, s.name as section_name
            FROM actions a
            JOIN sections s ON a.section_id = s.id
        `;
        const params: any[] = [];

        if (role !== 'general_coordinator' && role !== 'project_coordinator') {
            query += ' WHERE s.name IN (?) AND (a.created_by = ? OR EXISTS (SELECT 1 FROM user_sections us WHERE us.user_id = ? AND us.section_id = a.section_id))';
            params.push(sections, userId, userId);
        } else {
            query += ' WHERE 1=1';
        }

        if (filters.section) {
            query += ' AND s.name = ?';
            params.push(filters.section);
        }

        if (filters.status && filters.status !== 'Todos') {
            query += ' AND a.status = ?';
            params.push(filters.status);
        }

        if (filters.priority && filters.priority !== 'Todos') {
            query += ' AND a.priority = ?';
            params.push(filters.priority);
        }

        if (filters.search) {
            query += ' AND (a.task LIKE ? OR a.responsible LIKE ? OR a.description LIKE ?)';
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        query += ' ORDER BY a.created_at DESC';
        const [rows] = await db.query(query, params);
        return rows as Action[];
    }

    static async findById(id: number): Promise<Action | null> {
        const [rows] = await db.query(`
            SELECT a.*, s.name as section_name
            FROM actions a
            JOIN sections s ON a.section_id = s.id
            WHERE a.id = ?
        `, [id]);
        return (rows as Action[])[0] || null;
    }

    static async create(action: Partial<Action>, tasks: TaskData[]): Promise<number> {
        const [result] = await db.query(
            `
            INSERT INTO actions (section_id, task, description, responsible, budget, deadline, priority, status, progress, completed, validated, note, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                action.section_id,
                action.task || '',
                action.description || null,
                action.responsible || '',
                action.budget || null,
                action.deadline || new Date(),
                action.priority || 'medium',
                action.status || 'pendente',
                action.progress || 0,
                action.completed || false,
                action.validated || false,
                action.note || null,
                action.created_by || null
            ]
        );
        const actionId = (result as any).insertId;

        for (const task of tasks) {
            if (task.description && task.description.trim()) {
                await db.query(
                    'INSERT INTO action_tasks (action_id, description, completed, order_index, created_at) VALUES (?, ?, ?, ?, ?)',
                    [actionId, task.description.trim(), task.completed, task.order_index, new Date()]
                );
            }
        }

        return actionId;
    }

    static async update(id: number, action: Partial<Action>, tasks: TaskData[]): Promise<void> {
        await db.query(
            `
            UPDATE actions
            SET section_id = ?, task = ?, description = ?, responsible = ?, budget = ?, deadline = ?, priority = ?, status = ?, progress = ?, completed = ?, validated = ?, note = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            `,
            [
                action.section_id,
                action.task || '',
                action.description || null,
                action.responsible || '',
                action.budget || null,
                action.deadline || new Date(),
                action.priority || 'medium',
                action.status || 'pendente',
                action.progress || 0,
                action.completed || false,
                action.validated || false,
                action.note || null,
                id
            ]
        );

        // Buscar tarefas existentes no banco
        const existingTasks = await TaskModel.findByActionId(id);
        const existingTaskIds = existingTasks.map(task => task.id);
        const submittedTaskIds = tasks.filter(task => task.id).map(task => task.id!);

        // Excluir tarefas que não estão no formulário
        const tasksToDelete = existingTaskIds.filter(id => !submittedTaskIds.includes(id));
        for (const taskId of tasksToDelete) {
            await db.query('DELETE FROM action_tasks WHERE id = ?', [taskId]);
        }

        // Atualizar ou inserir tarefas
        for (const task of tasks) {
            if (task.description && task.description.trim()) {
                if (task.id) {
                    // Atualizar tarefa existente
                    await db.query(
                        'UPDATE action_tasks SET description = ?, completed = ?, order_index = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                        [task.description.trim(), task.completed, task.order_index, task.id]
                    );
                } else {
                    // Inserir nova tarefa
                    await db.query(
                        'INSERT INTO action_tasks (action_id, description, completed, order_index, created_at) VALUES (?, ?, ?, ?, ?)',
                        [id, task.description.trim(), task.completed, task.order_index, new Date()]
                    );
                }
            }
        }
    }

    static async delete(id: number): Promise<void> {
        await db.query('DELETE FROM action_tasks WHERE action_id = ?', [id]);
        await db.query('DELETE FROM actions WHERE id = ?', [id]);
    }
}