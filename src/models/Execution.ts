import { db } from '../app';
import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

export interface Execution {
    id?: number;
    section_id: number;
    section_name: string;
    start_date?: Date | null;
    end_date?: Date | null;
    executed: number;
    total_budget: number;
   
}

export class ExecutionModel {
    static async findAll(filter: { section_name?: string } = {}): Promise<Execution[]> {
        let query = 'SELECT id, section_id, section_name, start_date, end_date, executed,  total_budget FROM executions';
        const values: any[] = [];
        if (filter.section_name) {
            query += ' WHERE section_name LIKE ?';
            values.push(`%${filter.section_name}%`);
        }
        const [rows] = await db.query<RowDataPacket[]>(query, values);
        return rows.map(row => ({
            ...row,
            start_date: row.start_date && row.start_date !== '0000-00-00' ? new Date(row.start_date) : null,
            end_date: row.end_date && row.end_date !== '0000-00-00' ? new Date(row.end_date) : null,
            
        })) as Execution[];
    }

    static async findById(id: number): Promise<Execution | null> {
        const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM executions WHERE id = ?', [id]);
        if (rows.length === 0) {
            return null;
        }
        const row = rows[0];
        return {
            ...row,
            start_date: row.start_date && row.start_date !== '0000-00-00' ? new Date(row.start_date) : null,
            end_date: row.end_date && row.end_date !== '0000-00-00' ? new Date(row.end_date) : null,
            
        } as Execution;
    }

    static async create(execution: Execution): Promise<number> {
        const query = `
            INSERT INTO executions (section_id, section_name, start_date, end_date, executed,  total_budget)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
            execution.section_id,
            execution.section_name,
            execution.start_date || null,
            execution.end_date || null,
            execution.executed,
            execution.total_budget,
        ];
        const [result] = await db.query<ResultSetHeader>(query, values);
        return result.insertId;
    }

    static async update(id: number, execution: Partial<Execution>): Promise<void> {
        const query = `
            UPDATE executions
            SET section_id = ?, section_name = ?, start_date = ?, end_date = ?, executed = ?, total_budget = ?
            WHERE id = ?
        `;
        const values = [
            execution.section_id,
            execution.section_name,
            execution.start_date || null,
            execution.end_date || null,
            execution.executed,
            execution.total_budget,
            id,
        ];
        await db.query<ResultSetHeader>(query, values);
    }

    static async delete(id: number): Promise<void> {
        await db.query<ResultSetHeader>('DELETE FROM executions WHERE id = ?', [id]);
    }

    static async bulkUpdate(updates: { id: number; section_id: number; section_name: string; start_date?: Date | null; end_date?: Date | null; executed: number;  total_budget: number }[]): Promise<void> {
        const promises = updates.map(update => {
            const query = `
                UPDATE executions
                SET section_id = ?, section_name = ?, start_date = ?, end_date = ?, executed = ?, total_budget = ?
                WHERE id = ?
            `;
            return db.query<ResultSetHeader>(query, [
                update.section_id,
                update.section_name,
                update.start_date || null,
                update.end_date || null,
                update.executed,
                update.total_budget,
                update.id,
            ]);
        });
        await Promise.all(promises);
    }
}