import { Request, Response } from 'express';
import { FollowUpModel, FollowUp } from '../models/FollowUps';
import { FollowUpAttachmentModel } from '../models/FolloUpAttachments';
import { ActionModel } from '../models/Actions';
import { CollaboratorModel } from '../models/Collaborators';
import { User } from '../models/Users';
import { upload } from '../config/filestorage';
import { db } from '../app';
import { RowDataPacket } from 'mysql2/promise';

declare module 'express-session' {
    interface SessionData {
        user?: User;
    }
}

interface ActionRow extends RowDataPacket {
    id: number;
    name: string;
}

interface CollaboratorRow extends RowDataPacket {
    id: number;
    name: string;
}

interface FollowUpRow extends RowDataPacket {
    id: number;
    title: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    priority: 'low' | 'medium' | 'high';
    start_date: string | null;
    end_date: string;
    created_at: string;
    action_id: number;
    assigned_to: number; // Added to match view
    action_name: string;
    section_name: string;
    collaborator_name: string;
    collaborator_email: string;
    created_by_name: string;
    days_until_deadline: number;
}

interface CountRow extends RowDataPacket {
    total: number;
}

interface SectionRow extends RowDataPacket {
    section_id: number;
}

export class FollowUpController {
    static async getFollowUps(req: Request, res: Response) {
        const user: User | undefined = req.session.user;
        if (!user) {
            return res.redirect('/');
        }

        const { action_id, assigned_to, search = '', sort = 'created_at', order = 'DESC', page = '1' } = req.query;
        const pageSize = 10;
        const offset = (parseInt(page as string) - 1) * pageSize;
        const validSortColumns = ['id', 'title', 'status', 'priority', 'start_date', 'end_date', 'created_at', 'action_name', 'collaborator_name'];
        const sortColumn = validSortColumns.includes(sort as string) ? sort : 'created_at';
        const sortOrder = order === 'ASC' ? 'ASC' : 'DESC';
        const searchTerm = `%${search}%`;

        try {
            // Fetch actions and collaborators for filter dropdowns
            const [actions] = await db.query<ActionRow[]>('SELECT id, task AS name FROM actions WHERE status != "concluida"');
            const [collaborators] = await db.query<CollaboratorRow[]>('SELECT id, name FROM collaborators WHERE is_active = 1');

            // Build query with filters
            let query = `
                SELECT * FROM follow_ups_detailed2
                WHERE title LIKE ? OR description LIKE ?
            `;
            const queryParams: any[] = [searchTerm, searchTerm];

            if (action_id && !isNaN(parseInt(action_id as string))) {
                query += ' AND action_id = ?';
                queryParams.push(parseInt(action_id as string));
            }
            if (assigned_to && !isNaN(parseInt(assigned_to as string))) {
                query += ' AND assigned_to = ?';
                queryParams.push(parseInt(assigned_to as string));
            }

            // Apply user role/section restrictions
            if (user.role !== 'general_coordinator' && user.role !== 'project_coordinator') {
                const [userSections] = await db.query<SectionRow[]>('SELECT section_id FROM user_sections WHERE user_id = ?', [user.id]);
                const sectionIds = userSections.map((s) => s.section_id);
                if (sectionIds.length > 0) {
                    query += ` AND section_id IN (${sectionIds.map(() => '?').join(',')})`;
                    queryParams.push(...sectionIds);
                } else {
                    query += ' AND 1=0'; // No access if no sections assigned
                }
            }

            query += ` ORDER BY ${sortColumn} ${sortOrder} LIMIT ? OFFSET ?`;
            queryParams.push(pageSize, offset);

            // Fetch follow-ups
            const [followUps] = await db.query<FollowUpRow[]>(query, queryParams);

            // Get total count for pagination
            let countQuery = 'SELECT COUNT(*) as total FROM follow_ups_detailed2 WHERE title LIKE ? OR description LIKE ?';
            const countParams: any[] = [searchTerm, searchTerm];
            if (action_id && !isNaN(parseInt(action_id as string))) {
                countQuery += ' AND action_id = ?';
                countParams.push(parseInt(action_id as string));
            }
            if (assigned_to && !isNaN(parseInt(assigned_to as string))) {
                countQuery += ' AND assigned_to = ?';
                countParams.push(parseInt(assigned_to as string));
            }
            if (user.role !== 'general_coordinator' && user.role !== 'project_coordinator') {
                const [userSections] = await db.query<SectionRow[]>('SELECT section_id FROM user_sections WHERE user_id = ?', [user.id]);
                const sectionIds = userSections.map((s) => s.section_id);
                if (sectionIds.length > 0) {
                    countQuery += ` AND section_id IN (${sectionIds.map(() => '?').join(',')})`;
                    countParams.push(...sectionIds);
                } else {
                    countQuery += ' AND 1=0';
                }
            }
            const [countResult] = await db.query<CountRow[]>(countQuery, countParams);
            const totalItems = countResult[0]?.total || 0;
            const totalPages = Math.ceil(totalItems / pageSize);

            res.render('follow-ups', {
                user,
                followUps,
                actions,
                collaborators,
                action_id: action_id || '',
                assigned_to: assigned_to || '',
                search,
                sort,
                order,
                page: parseInt(page as string) || 1,
                totalPages,
                totalItems,
                error: null
            });
        } catch (error) {
            console.error('Error fetching follow-ups:', error);
            res.render('follow-ups', {
                user,
                followUps: [],
                actions: [],
                collaborators: [],
                action_id: action_id || '',
                assigned_to: assigned_to || '',
                search,
                sort,
                order,
                page: 1,
                totalPages: 1,
                totalItems: 0,
                error: 'Erro ao carregar follow-ups. Verifique a conexão com o banco de dados ou os filtros aplicados.'
            });
        }
    }

    static async getNewFollowUp(req: Request, res: Response) {
        const user: User | undefined = req.session.user;
        if (!user) {
            return res.redirect('/');
        }

        const actionId = parseInt(req.params.actionId);
        if (isNaN(actionId)) {
            return res.render('follow-up-form', { user, action: null, collaborators: [], error: 'ID da ação inválido.' });
        }

        try {
            const action = await ActionModel.findById(actionId);
            if (!action || (user.role !== 'general_coordinator' && user.role !== 'project_coordinator' && !user.sections.includes(action.section_name!))) {
                return res.render('follow-up-form', { user, action: null, collaborators: [], error: 'Acesso não autorizado ou ação não encontrada.' });
            }
            const collaborators = await CollaboratorModel.findAll();
            res.render('follow-up-form', { user, action, collaborators, followUp: null, attachments: [], error: null });
        } catch (error) {
            console.error('Error fetching new follow-up form:', error);
            res.render('follow-up-form', { user, action: null, collaborators: [], attachments: [], error: 'Erro ao carregar formulário.' });
        }
    }

    static async createFollowUp(req: Request, res: Response) {
        const user: User | undefined = req.session.user;
        if (!user) {
            return res.redirect('/');
        }

        upload.array('attachments')(req, res, async (err: any) => {
            if (err) {
                console.error('Error uploading files:', err.message);
                const actionId = parseInt(req.body.action_id);
                const action = isNaN(actionId) ? null : await ActionModel.findById(actionId);
                const collaborators = await CollaboratorModel.findAll();
                return res.render('follow-up-form', {
                    user,
                    action,
                    collaborators,
                    followUp: null,
                    attachments: [],
                    error: err.message.includes('Tipo de arquivo não permitido')
                        ? err.message
                        : 'Erro ao fazer upload dos arquivos. Verifique os formatos e tente novamente.'
                });
            }

            const { action_id, assigned_to, title, description, next_steps, obstacles, comments, priority, status, start_date, end_date, new_deadline } = req.body;

            try {
                if (!action_id || !title || !description || !assigned_to || !end_date) {
                    throw new Error('Campos obrigatórios não preenchidos.');
                }

                const actionId = parseInt(action_id);
                const assignedToId = parseInt(assigned_to);
                if (isNaN(actionId) || isNaN(assignedToId)) {
                    throw new Error('ID da ação ou colaborador inválido.');
                }

                const followUp: Partial<FollowUp> = {
                    action_id: actionId,
                    assigned_to: assignedToId,
                    created_by: user.id,
                    title,
                    description,
                    next_steps: next_steps || null,
                    obstacles: obstacles || null,
                    comments: comments || null,
                    priority: priority || 'medium',
                    status: status || 'pending',
                    start_date: start_date ? new Date(start_date) : null,
                    end_date: new Date(end_date),
                    new_deadline: new_deadline ? new Date(new_deadline) : null
                };

                const followUpId = await FollowUpModel.create(followUp);

                if (req.files && Array.isArray(req.files)) {
                    for (const file of req.files) {
                        await FollowUpAttachmentModel.create({
                            follow_up_id: followUpId,
                            filename: file.filename,
                            original_name: file.originalname,
                            file_size: file.size,
                            mime_type: file.mimetype,
                            file_path: file.path,
                            uploaded_by: user.id
                        });
                    }
                }

                res.redirect(`/action/edit/${action_id}`);
            } catch (error: any) {
                console.error('Error creating follow-up:', error.message);
                const actionId = parseInt(action_id);
                const action = isNaN(actionId) ? null : await ActionModel.findById(actionId);
                const collaborators = await CollaboratorModel.findAll();
                res.render('follow-up-form', {
                    user,
                    action,
                    collaborators,
                    followUp: null,
                    attachments: [],
                    error: error.message || 'Erro ao criar follow-up. Verifique os dados e tente novamente.'
                });
            }
        });
    }

    static async getEditFollowUp(req: Request, res: Response) {
        const user: User | undefined = req.session.user;
        if (!user) {
            return res.redirect('/');
        }

        const followUpId = parseInt(req.params.id);
        if (isNaN(followUpId)) {
            return res.render('follow-up-form', { user, action: null, collaborators: [], followUp: null, attachments: [], error: 'ID do follow-up inválido.' });
        }

        try {
            const followUp = await FollowUpModel.findById(followUpId);
            if (!followUp) {
                return res.render('follow-up-form', { user, action: null, collaborators: [], followUp: null, attachments: [], error: 'Follow-up não encontrado.' });
            }
            const action = await ActionModel.findById(followUp.action_id);
            if (!action) {
                return res.render('follow-up-form', { user, action: null, collaborators: [], followUp, attachments: [], error: 'Ação associada não encontrada.' });
            }
            const collaborators = await CollaboratorModel.findAll();
            const attachments = await FollowUpAttachmentModel.findByFollowUpId(followUpId);
            res.render('follow-up-form', { user, action, collaborators, followUp, attachments, error: null });
        } catch (error) {
            console.error('Error fetching follow-up for edit:', error);
            res.render('follow-up-form', { user, action: null, collaborators: [], followUp: null, attachments: [], error: 'Erro ao carregar follow-up.' });
        }
    }

    static async updateFollowUp(req: Request, res: Response) {
        const user: User | undefined = req.session.user;
        if (!user) {
            return res.redirect('/');
        }

        upload.array('attachments')(req, res, async (err: any) => {
            if (err) {
                console.error('Error uploading files:', err.message);
                const followUpId = parseInt(req.params.id);
                const followUp = isNaN(followUpId) ? null : await FollowUpModel.findById(followUpId);
                const action = followUp ? await ActionModel.findById(followUp.action_id) : null;
                const collaborators = await CollaboratorModel.findAll();
                const attachments = followUp ? await FollowUpAttachmentModel.findByFollowUpId(followUpId) : [];
                return res.render('follow-up-form', {
                    user,
                    action,
                    collaborators,
                    followUp,
                    attachments,
                    error: err.message.includes('Tipo de arquivo não permitido')
                        ? err.message
                        : 'Erro ao fazer upload dos arquivos. Verifique os formatos e tente novamente.'
                });
            }

            const followUpId = parseInt(req.params.id);
            const { action_id, assigned_to, title, description, next_steps, obstacles, comments, priority, status, start_date, end_date, new_deadline } = req.body;

            try {
                if (!action_id || !title || !description || !assigned_to || !end_date) {
                    throw new Error('Campos obrigatórios não preenchidos.');
                }

                const actionId = parseInt(action_id);
                const assignedToId = parseInt(assigned_to);
                if (isNaN(actionId) || isNaN(assignedToId)) {
                    throw new Error('ID da ação ou colaborador inválido.');
                }

                const followUp: Partial<FollowUp> = {
                    action_id: actionId,
                    assigned_to: assignedToId,
                    title,
                    description,
                    next_steps: next_steps || null,
                    obstacles: obstacles || null,
                    comments: comments || null,
                    priority: priority || 'medium',
                    status: status || 'pending',
                    start_date: start_date ? new Date(start_date) : null,
                    end_date: new Date(end_date),
                    new_deadline: new_deadline ? new Date(new_deadline) : null
                };

                await FollowUpModel.update(followUpId, followUp);

                if (req.files && Array.isArray(req.files)) {
                    for (const file of req.files) {
                        await FollowUpAttachmentModel.create({
                            follow_up_id: followUpId,
                            filename: file.filename,
                            original_name: file.originalname,
                            file_size: file.size,
                            mime_type: file.mimetype,
                            file_path: file.path,
                            uploaded_by: user.id
                        });
                    }
                }

                res.redirect(`/action/edit/${action_id}`);
            } catch (error: any) {
                console.error('Error updating follow-up:', error.message);
                const followUp = await FollowUpModel.findById(followUpId);
                const action = followUp ? await ActionModel.findById(followUp.action_id) : null;
                const collaborators = await CollaboratorModel.findAll();
                const attachments = await FollowUpAttachmentModel.findByFollowUpId(followUpId);
                res.render('follow-up-form', {
                    user,
                    action,
                    collaborators,
                    followUp,
                    attachments,
                    error: error.message || 'Erro ao atualizar follow-up. Verifique os dados e tente novamente.'
                });
            }
        });
    }

    static async deleteFollowUp(req: Request, res: Response) {
        const user: User | undefined = req.session.user;
        if (!user) {
            return res.redirect('/');
        }

        const followUpId = parseInt(req.params.id);
        if (isNaN(followUpId)) {
            return res.redirect('/dashboard');
        }

        try {
            const followUp = await FollowUpModel.findById(followUpId);
            if (!followUp) {
                return res.redirect('/dashboard');
            }
            const attachments = await FollowUpAttachmentModel.findByFollowUpId(followUpId);
            for (const attachment of attachments) {
                await FollowUpAttachmentModel.delete(attachment.id);
            }
            await FollowUpModel.delete(followUpId);
            res.redirect(`/action/edit/${followUp.action_id}`);
        } catch (error) {
            console.error('Error deleting follow-up:', error);
            res.redirect('/dashboard');
        }
    }

    static async getFollowUp(req: Request, res: Response) {
        const user: User | undefined = req.session.user;
        if (!user) {
            return res.redirect('/');
        }

        const followUpId = parseInt(req.params.id);
        if (isNaN(followUpId)) {
            return res.render('follow-up-view', { user, followUp: null, action: null, collaborator: null, attachments: [], error: 'ID do follow-up inválido.' });
        }

        try {
            const followUp = await FollowUpModel.findById(followUpId);
            if (!followUp) {
                return res.render('follow-up-view', { user, followUp: null, action: null, collaborator: null, attachments: [], error: 'Follow-up não encontrado.' });
            }
            const action = await ActionModel.findById(followUp.action_id);
            const collaborator = await CollaboratorModel.findById(followUp.assigned_to);
            const attachments = await FollowUpAttachmentModel.findByFollowUpId(followUpId);
            res.render('follow-up-view', { user, followUp, action, collaborator, attachments, error: null });
        } catch (error) {
            console.error('Error fetching follow-up:', error);
            res.render('follow-up-view', { user, followUp: null, action: null, collaborator: null, attachments: [], error: 'Erro ao carregar follow-up.' });
        }
    }
}
