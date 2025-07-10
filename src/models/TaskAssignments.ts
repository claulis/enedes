import { db } from '../app';
import { RowDataPacket } from 'mysql2/promise';

export interface TaskAssignment {
    id?: number;
    action_id: number;
    task_id: number;
    collaborator_id: number;
    assigned_by: number;
    message?: string | null;
    priority?: 'low' | 'medium' | 'high';
    status?: 'sent' | 'accepted' | 'in_progress' | 'completed' | 'rejected';
    deadline?: Date | null;
    collaborator_name?: string;
    task_description?: string;
}

export class TaskAssignmentModel {
    static async create(assignment: Partial<TaskAssignment>): Promise<number> {
        const [result] = await db.query(
            'INSERT INTO task_assignments (action_id, task_id, collaborator_id, assigned_by, message, priority, status, deadline) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
                assignment.action_id,
                assignment.task_id,
                assignment.collaborator_id,
                assignment.assigned_by,
                assignment.message,
                assignment.priority || 'medium',
                assignment.status || 'sent',
                assignment.deadline
            ]
        );
        return (result as any).insertId;
    }

    static async findById(id: number): Promise<TaskAssignment | null> {
        const [rows] = await db.query<RowDataPacket[]>(
            `SELECT ta.*, c.name as collaborator_name, at.description as task_description 
             FROM task_assignments ta 
             LEFT JOIN collaborators c ON ta.collaborator_id = c.id 
             LEFT JOIN action_tasks at ON ta.task_id = at.id 
             WHERE ta.id = ?`,
            [id]
        );
        if (rows.length === 0) return null;
        return {
            ...rows[0],
            deadline: rows[0].deadline ? new Date(rows[0].deadline) : null
        } as TaskAssignment;
    }

    static async findByActionId(actionId: number): Promise<TaskAssignment[]> {
        const [rows] = await db.query<RowDataPacket[]>(
            `SELECT ta.*, c.name as collaborator_name, at.description as task_description 
             FROM task_assignments ta 
             LEFT JOIN collaborators c ON ta.collaborator_id = c.id 
             LEFT JOIN action_tasks at ON ta.task_id = at.id 
             WHERE ta.action_id = ?`,
            [actionId]
        );
        return rows.map(row => ({
            ...row,
            deadline: row.deadline ? new Date(row.deadline) : null
        })) as TaskAssignment[];
    }

    static async update(id: number, assignment: Partial<TaskAssignment>): Promise<void> {
        await db.query(
            'UPDATE task_assignments SET action_id = ?, task_id = ?, collaborator_id = ?, message = ?, priority = ?, status = ?, deadline = ? WHERE id = ?',
            [
                assignment.action_id,
                assignment.task_id,
                assignment.collaborator_id,
                assignment.message,
                assignment.priority,
                assignment.status,
                assignment.deadline,
                id
            ]
        );
    }

    static async delete(id: number): Promise<void> {
        await db.query('DELETE FROM task_assignments WHERE id = ?', [id]);
    }
}