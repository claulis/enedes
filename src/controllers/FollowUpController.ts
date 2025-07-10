import { Request, Response } from 'express';
import { FollowUpModel, FollowUp } from '../models/FollowUps';
import { FollowUpAttachmentModel } from '../models/FolloUpAttachments'; // Fixed typo
import { ActionModel } from '../models/Actions';
import { CollaboratorModel } from '../models/Collaborators';
import { User } from '../models/Users';
import { upload } from '../config/filestorage';
import path from 'path';

declare module 'express-session' {
    interface SessionData {
        user?: User;
    }
}

export class FollowUpController {
    static async getNewFollowUp(req: Request, res: Response) {
        const user: User | undefined = req.session.user;
        if (!user) {
            return res.redirect('/');
        }

        const actionId = parseInt(req.params.actionId);
        try {
            const action = await ActionModel.findById(actionId);
            if (!action || (user.role !== 'general_coordinator' && user.role !== 'project_coordinator' && !user.sections.includes(action.section_name!))) {
                return res.render('follow-up-form', { user, action: null, collaborators: [], error: 'Acesso não autorizado.' });
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
                const action = await ActionModel.findById(actionId);
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

                const followUp: Partial<FollowUp> = {
                    action_id: parseInt(action_id),
                    assigned_to: parseInt(assigned_to),
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
                const action = await ActionModel.findById(actionId);
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
        try {
            const followUp = await FollowUpModel.findById(followUpId);
            if (!followUp) {
                return res.render('follow-up-form', { user, action: null, collaborators: [], followUp: null, attachments: [], error: 'Follow-up não encontrado.' });
            }
            const action = await ActionModel.findById(followUp.action_id);
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
                const followUp = await FollowUpModel.findById(followUpId);
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

                const followUp: Partial<FollowUp> = {
                    action_id: parseInt(action_id),
                    assigned_to: parseInt(assigned_to),
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