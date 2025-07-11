import { Request, Response } from 'express';
import { db } from '../app';
import { User } from '../models/Users';
import {Collaborator} from '../models/Collaborators';

export class CollaboratorController {
    static async getCollaborators(req: Request, res: Response) {
        const user: User | undefined = req.session.user;
        if (!user) {
            return res.redirect('/');
        }

        const { search = '', sort = 'name', order = 'ASC' } = req.query;
        const validSortColumns = ['id', 'name', 'email', 'phone', 'department', 'position', 'is_active'];
        const sortColumn = validSortColumns.includes(sort as string) ? sort : 'name';
        const sortOrder = order === 'DESC' ? 'DESC' : 'ASC';
        const searchTerm = `%${search}%`;

        try {
            const [collaborators] = await db.query(`
                SELECT * FROM collaborators 
                WHERE name LIKE ? 
                ORDER BY ${sortColumn} ${sortOrder}
            `, [searchTerm]);

            res.render('collaborators', { 
                user, 
                collaborators, 
                search, 
                sort, 
                order, 
                error: null 
            });
        } catch (error) {
            console.error('Error fetching collaborators:', error);
            res.render('collaborators', { 
                user, 
                collaborators: [], 
                search, 
                sort, 
                order, 
                error: 'Erro ao carregar colaboradores.' 
            });
        }
    }

    static async createCollaborator(req: Request, res: Response) {
        const user: User | undefined = req.session.user;
        if (!user) {
            return res.redirect('/');
        }

        const { name, email, phone, department, position, skills, is_active } = req.body;

        if (!name || !email) {
            return res.render('collaborators', { 
                user, 
                collaborators: (await db.query('SELECT * FROM collaborators WHERE is_active = 1'))[0], 
                search: req.query.search || '', 
                sort: req.query.sort || 'name', 
                order: req.query.order || 'ASC', 
                error: 'Nome e email são obrigatórios.' 
            });
        }

        try {
            const skillsArray = skills ? JSON.stringify(skills.split(',').map((s: string) => s.trim())) : '[]';
            await db.query(`
                INSERT INTO collaborators (name, email, phone, department, position, skills, is_active, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            `, [name, email, phone || null, department || null, position || null, skillsArray, is_active === 'on' ? 1 : 0]);

            res.redirect('/collaborators');
        } catch (error) {
            console.error('Error creating collaborator:', error);
            res.render('collaborators', { 
                user, 
                collaborators: (await db.query('SELECT * FROM collaborators WHERE is_active = 1'))[0], 
                search: req.query.search || '', 
                sort: req.query.sort || 'name', 
                order: req.query.order || 'ASC', 
                error: 'Erro ao criar colaborador.' 
            });
        }
    }

    static async updateCollaborator(req: Request, res: Response) {
        const user: User | undefined = req.session.user;
        if (!user) {
            return res.redirect('/');
        }

        const { id } = req.params;
        const { name, email, phone, department, position, skills, is_active } = req.body;

        if (!name || !email) {
            return res.redirect('/collaborators?error=Nome+e+email+são+obrigatórios');
        }

        try {
            const skillsArray = skills ? JSON.stringify(skills.split(',').map((s: string) => s.trim())) : '[]';
            await db.query(`
                UPDATE collaborators 
                SET name = ?, email = ?, phone = ?, department = ?, position = ?, skills = ?, is_active = ?, updated_at = NOW()
                WHERE id = ?
            `, [name, email, phone || null, department || null, position || null, skillsArray, is_active === 'on' ? 1 : 0, id]);

            res.redirect('/collaborators');
        } catch (error) {
            console.error('Error updating collaborator:', error);
            res.redirect('/collaborators?error=Erro+ao+atualizar+colaborador');
        }
    }

    static async deleteCollaborator(req: Request, res: Response) {
        const user: User | undefined = req.session.user;
        if (!user) {
            return res.redirect('/');
        }

        const { id } = req.params;

        try {
            await db.query('Delete from collaborators WHERE id = ?', [id]);
            res.redirect('/collaborators');
        } catch (error) {
            console.error('Error deleting collaborator:', error);
            res.redirect('/collaborators?error=Erro+ao+excluir+colaborador');
        }
    }
}