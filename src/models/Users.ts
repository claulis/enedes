import { db } from '../app';

export interface User {
    id: number;
    username: string;
    password_hash: string;
    name: string;
    role: string;
    sections: string;
    created_at: Date;
    is_active: boolean;
}

export class UserModel {
    static async findByUsername(username: string): Promise<User | null> {
        const [rows] = await db.query('SELECT * FROM user WHERE username = ? AND is_active = 1', [username]);
        return (rows as User[])[0] || null;
    }

    static async findById(id: number): Promise<User | null> {
        const [rows] = await db.query('SELECT * FROM user WHERE id = ?', [id]);
        return (rows as User[])[0] || null;
    }
}