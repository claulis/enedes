import { Request, Response } from 'express';
import { db } from '../app';
import { User } from '../models/Users';
import { Meta } from '../models/Metas';
import { RowDataPacket } from 'mysql2/promise';

export class MetaController {
    static async getMetas(req: Request, res: Response) {
        const user: User | undefined = req.session.user;
        if (!user) {
            return res.redirect('/');
        }

        const { search = '', sort = 'goal_description', order = 'ASC' } = req.query;
        const validSortColumns = ['id', 'goal_description', 'indicator', 'percentage_completion', 'social_goal', 'section_id'];
        const sortColumn = validSortColumns.includes(sort as string) ? sort : 'goal_description';
        const sortOrder = order === 'DESC' ? 'DESC' : 'ASC';
        const searchTerm = `%${search}%`;

        try {
            const [metas] = await db.query(`
                SELECT m.*, s.name as section_name 
                FROM metas m 
                JOIN sections s ON m.section_id = s.id
                WHERE m.goal_description LIKE ? OR m.indicator LIKE ? OR m.social_goal LIKE ?
                ORDER BY ${sortColumn} ${sortOrder}
            `, [searchTerm, searchTerm, searchTerm]);

            const [sections] = await db.query('SELECT id, name FROM sections WHERE is_active = 1');

            res.render('metas', { 
                user, 
                metas, 
                sections,
                search, 
                sort, 
                order, 
                error: null 
            });
        } catch (error) {
            console.error('Error fetching metas:', error);
            res.render('metas', { 
                user, 
                metas: [], 
                sections: [],
                search, 
                sort, 
                order, 
                error: 'Erro ao carregar metas.' 
            });
        }
    }

    static async createMeta(req: Request, res: Response) {
        const user: User | undefined = req.session.user;
        if (!user) {
            return res.redirect('/');
        }

        const { section_id, goal_description, indicator, percentage_completion, social_goal } = req.body;

        if (!section_id || !goal_description || !indicator || !percentage_completion || !social_goal) {
            return res.render('metas', { 
                user, 
                metas: (await db.query(`
                    SELECT m.*, s.name as section_name 
                    FROM metas m 
                    JOIN sections s ON m.section_id = s.id
                    WHERE is_active = 1
                `))[0], 
                sections: (await db.query('SELECT id, name FROM sections WHERE is_active = 1'))[0],
                search: req.query.search || '', 
                sort: req.query.sort || 'goal_description', 
                order: req.query.order || 'ASC', 
                error: 'Todos os campos são obrigatórios.' 
            });
        }

        try {
            await db.query(`
                INSERT INTO metas (section_id, goal_description, indicator, percentage_completion, social_goal)
                VALUES (?, ?, ?, ?, ?)
            `, [section_id, goal_description, indicator, percentage_completion, social_goal]);

            res.redirect('/metas');
        } catch (error) {
            console.error('Error creating meta:', error);
            res.render('metas', { 
                user, 
                metas: (await db.query(`
                    SELECT m.*, s.name as section_name 
                    FROM metas m 
                    JOIN sections s ON m.section_id = s.id
                    WHERE is_active = 1
                `))[0], 
                sections: (await db.query('SELECT id, name FROM sections WHERE is_active = 1'))[0],
                search: req.query.search || '', 
                sort: req.query.sort || 'goal_description', 
                order: req.query.order || 'ASC', 
                error: 'Erro ao criar meta.' 
            });
        }
    }

    static async updateMeta(req: Request, res: Response): Promise<void> {
        const user: User | undefined = req.session.user;
        if (!user) {
            return res.redirect('/');
        }

        const { id } = req.params;
        const { section_id, goal_description, indicator, percentage_completion, social_goal } = req.body;
       
        if (!section_id || !goal_description || !indicator || !percentage_completion || !social_goal) {
            return res.redirect('/metas?error=Todos+os+campos+são+obrigatórios');
        }
        

        try {
            await db.query(`
                UPDATE metas 
                SET section_id = ?, goal_description = ?, indicator = ?, percentage_completion = ?, social_goal = ?
                WHERE id = ?
            `, [section_id, goal_description, indicator, percentage_completion, social_goal, id]);

            res.redirect('/metas');
        } catch (error) {
            console.error('Error updating meta:', error);
            res.redirect('/metas?error=Erro+ao+atualizar+meta');
        }
    }

    static async deleteMeta(req: Request, res: Response) {
        const user: User | undefined = req.session.user;
        if (!user) {
            return res.redirect('/');
        }

        const { id } = req.params;

        try {
            await db.query('DELETE FROM metas WHERE id = ?', [id]);
            res.redirect('/metas');
        } catch (error) {
            console.error('Error deleting meta:', error);
            res.redirect('/metas?error=Erro+ao+excluir+meta');
        }
    }
}