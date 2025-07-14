import { db } from '../app';
import bcrypt from 'bcryptjs';
import { RowDataPacket } from 'mysql2/promise';

export interface User {
    id: number;
    username: string;
    name: string;
    password: string; // Changed from password_hash to match database
    email: string;
    phone: string | null;
    department: string | null;
    role: 'general_coordinator' | 'project_coordinator' | 'department_coordinator';
    sections: string[];
    is_active: boolean;
    needs_password_change: boolean;
    last_login: Date | null;
    created_at: Date;
    updated_at: Date;
}

interface UserRow extends RowDataPacket {
    id: number;
    username: string;
    name: string;
    password: string;
    email: string;
    phone: string | null;
    department: string | null;
    role: 'general_coordinator' | 'project_coordinator' | 'department_coordinator';
    is_active: number;
    needs_password_change: number;
    last_login: string | null;
    created_at: string;
    updated_at: string;
}

export class UserModel {
    static async findByUsername(username: string): Promise<User | null> {
        const [rows] = await db.query<UserRow[]>(
            `SELECT u.*, GROUP_CONCAT(s.name) as section_names
             FROM users u
             LEFT JOIN user_sections us ON u.id = us.user_id
             LEFT JOIN sections s ON us.section_id = s.id
             WHERE u.username = ? AND u.is_active = 1
             GROUP BY u.id`,
            [username]
        );
        if (!rows[0]) return null;
        const user = rows[0];
        return {
            id: user.id,
            username: user.username,
            name: user.name,
            password: user.password,
            email: user.email,
            phone: user.phone,
            department: user.department,
            role: user.role,
            sections: user.section_names ? user.section_names.split(',') : [],
            is_active: !!user.is_active,
            needs_password_change: !!user.needs_password_change,
            last_login: user.last_login ? new Date(user.last_login) : null,
            created_at: new Date(user.created_at),
            updated_at: new Date(user.updated_at)
        };
    }

    static async findById(id: number): Promise<User | null> {
        const [rows] = await db.query<UserRow[]>(
            `SELECT u.*, GROUP_CONCAT(s.name) as section_names
             FROM users u
             LEFT JOIN user_sections us ON u.id = us.user_id
             LEFT JOIN sections s ON us.section_id = s.id
             WHERE u.id = ? AND u.is_active = 1
             GROUP BY u.id`,
            [id]
        );
        if (!rows[0]) return null;
        const user = rows[0];
        return {
            id: user.id,
            username: user.username,
            name: user.name,
            password: user.password,
            email: user.email,
            phone: user.phone,
            department: user.department,
            role: user.role,
            sections: user.section_names ? user.section_names.split(',') : [],
            is_active: !!user.is_active,
            needs_password_change: !!user.needs_password_change,
            last_login: user.last_login ? new Date(user.last_login) : null,
            created_at: new Date(user.created_at),
            updated_at: new Date(user.updated_at)
        };
    }

    static async create(user: Partial<User>): Promise<number> {
        if (!user.password) {
            throw new Error('Senha é obrigatória para criar um usuário.');
        }
        const hashedPassword = await bcrypt.hash(user.password, 10);
        const [result] = await db.query(
            'INSERT INTO users (username, name, email, password, phone, department, role, is_active, needs_password_change) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                user.username,
                user.name,
                user.email,
                hashedPassword,
                user.phone ?? null,
                user.department ?? null,
                user.role ?? 'department_coordinator',
                user.is_active ?? true,
                user.needs_password_change ?? true
            ]
        );
        const userId = (result as any).insertId;
        // Insert sections if provided
        if (user.sections && user.sections.length > 0) {
            for (const sectionName of user.sections) {
                const [section] = await db.query('SELECT id FROM sections WHERE name = ?', [sectionName]);
                if ((section as any)[0]) {
                    await db.query('INSERT INTO user_sections (user_id, section_id) VALUES (?, ?)', [userId, (section as any)[0].id]);
                }
            }
        }
        return userId;
    }

    static async update(id: number, user: Partial<User>): Promise<void> {
        const fields: string[] = [];
        const values: any[] = [];
        if (user.username) {
            fields.push('username = ?');
            values.push(user.username);
        }
        if (user.name) {
            fields.push('name = ?');
            values.push(user.name);
        }
        if (user.email) {
            fields.push('email = ?');
            values.push(user.email);
        }
        if (user.password) {
            fields.push('password = ?');
            values.push(await bcrypt.hash(user.password, 10));
        }
        if (user.phone !== undefined) {
            fields.push('phone = ?');
            values.push(user.phone);
        }
        if (user.department !== undefined) {
            fields.push('department = ?');
            values.push(user.department);
        }
        if (user.role) {
            fields.push('role = ?');
            values.push(user.role);
        }
        if (user.is_active !== undefined) {
            fields.push('is_active = ?');
            values.push(user.is_active);
        }
        if (user.needs_password_change !== undefined) {
            fields.push('needs_password_change = ?');
            values.push(user.needs_password_change);
        }
        values.push(id);
        if (fields.length > 0) {
            await db.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
        }
        // Update sections if provided
        if (user.sections) {
            await db.query('DELETE FROM user_sections WHERE user_id = ?', [id]);
            for (const sectionName of user.sections) {
                const [section] = await db.query('SELECT id FROM sections WHERE name = ?', [sectionName]);
                if ((section as any)[0]) {
                    await db.query('INSERT INTO user_sections (user_id, section_id) VALUES (?, ?)', [id, (section as any)[0].id]);
                }
            }
        }
    }
}