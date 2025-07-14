import { db } from '../app';

export interface Meta {
    id: number;
    section_id: number;
    goal_description: string;
    indicator: string;
    percentage_completion: number;
    social_goal: string;
    section_name?: string;
}

export class MetaModel {
    static async findAll(): Promise<Meta[]> {
        const [rows] = await db.query(`
            SELECT m.*, s.name as section_name 
            FROM metas m 
            JOIN sections s ON m.section_id = s.id
        `);
        return rows as Meta[];
    }

    static async findById(id: number): Promise<Meta | null> {
        const [rows] = await db.query(`
            SELECT m.*, s.name as section_name 
            FROM metas m 
            JOIN sections s ON m.section_id = s.id 
            WHERE m.id = ?
        `, [id]);
        return (rows as Meta[])[0] || null;
    }
}