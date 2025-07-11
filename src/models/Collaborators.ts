import { db } from '../app';

export interface Collaborator {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    department: string | null;
    position: string | null;
    skills: string[] | null;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}

export class CollaboratorModel {
    static async findAll(): Promise<Collaborator[]> {
        const [rows] = await db.query('SELECT * FROM collaborators');
        return (rows as Collaborator[]).map(row => ({
            ...row,
            skills: row.skills ? JSON.parse(row.skills as any) : null
        }));
    }

    static async findById(id: number): Promise<Collaborator | null> {
        const [rows] = await db.query('SELECT * FROM collaborators WHERE id = ?', [id]);
        const collaborator = (rows as Collaborator[])[0];
        if (collaborator && collaborator.skills) {
            collaborator.skills = JSON.parse(collaborator.skills as any);
        }
        return collaborator || null;
    }
}