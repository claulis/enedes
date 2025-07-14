
import { Request, Response } from 'express';
import { ActionModel, Action } from '../models/Actions';
import { TaskModel } from '../models/Tasks';
import { User } from '../models/Users';
import { CollaboratorModel } from '../models/Collaborators';
import { NotificationModel } from '../models/Notifications';
import { ExecutionModel} from '../models/Execution';
import { ActionAttachmentModel } from '../models/ActionAttachments';
import { FollowUpModel } from '../models/FollowUps';
import { TaskAssignmentModel } from '../models/TaskAssignments';
import { db } from '../app';
import { RowDataPacket } from 'mysql2/promise';

declare module 'express-session' {
    interface SessionData {
        user?: User;
    }
}

interface SectionRow extends RowDataPacket {
    name: string;
}

interface StatsRow extends RowDataPacket {
    total_actions: number;
    completed_actions: number;
    unread_notifications: number;
}

interface SectionIdRow extends RowDataPacket {
    id: number;
}

export class ActionController {
    static async getDashboard(req: Request, res: Response) {
        const user: User | undefined = req.session.user;
        if (!user) {
            return res.redirect('/');
        }

        const sections = user.role === 'general_coordinator' || user.role === 'project_coordinator' ? (
            (await db.query<SectionRow[]>('SELECT name FROM sections WHERE is_active = 1'))[0].map(s => s.name)
        ) : user.sections;

        const filters = {
            section: req.query.section as string,
            status: req.query.status as string || '',
            priority: req.query.priority as string || '',
            search: req.query.search as string
        };

        try {
            const [actions,executions, notifications, stats] = await Promise.all([
                ActionModel.findAll(user.id, user.role, sections, filters),
                ExecutionModel.findAll(),
                NotificationModel.findByUserId(user.id),
                db.query<StatsRow[]>('SELECT * FROM user_dashboard WHERE user_id = ?', [user.id])
            ]);

            const actionDetails = await Promise.all(actions.map(async action => ({
                ...action,
                tasks: await TaskModel.findByActionId(action.id),
                attachments: await ActionAttachmentModel.findByActionId(action.id),
                followUps: await FollowUpModel.findByActionId(action.id),
                assignments: await TaskAssignmentModel.findByActionId(action.id)
            })));

            const userStats = stats[0][0] || { total_actions: 0, completed_actions: 0, unread_notifications: 0 };
            res.render('dashboard', {
                user,
                sections,
                actions: actionDetails,
                executions,
                notifications,
                stats: userStats,
                filters,
                error: null
            });
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            res.render('dashboard', {
                user,
                sections,
                actions: [],
                notifications: [],
                stats: null,
                filters,
                error: 'Erro ao carregar o dashboard.'
            });
        }
    }

    static async getNewAction(req: Request, res: Response) {
        const user: User | undefined = req.session.user;
        if (!user) {
            return res.redirect('/');
        }

        const sections = user.role === 'general_coordinator' || user.role === 'project_coordinator' ? (
            (await db.query<SectionRow[]>('SELECT name FROM sections WHERE is_active = 1'))[0].map(s => s.name)
        ) : user.sections;

        const collaborators = await CollaboratorModel.findAll();
        res.render('action-form', { user, sections, collaborators, error: null });
    }

    static async createAction(req: Request, res: Response) {
        const user: User | undefined = req.session.user;
        if (!user) {
            return res.redirect('/');
        }

        const { task, responsible, deadline, budget, status, description, note, priority, section, completed, validated, tasks } = req.body;

        try {
            const [sectionResult] = await db.query<SectionIdRow[]>('SELECT id FROM sections WHERE name = ?', [section]);
            if (!sectionResult[0]) throw new Error('Seção inválida');

            const tasksData = Array.isArray(tasks) ? tasks.map((t: any, i: number) => ({
                id: t.id ? parseInt(t.id) : undefined,
                description: t.description || '',
                completed: t.completed === 'on' || t.completed === true,
                order_index: i
            })).filter(t => t.description.trim()) : [];

            const action: Partial<Action> = {
                section_id: sectionResult[0].id,
                task,
                responsible,
                deadline: new Date(deadline),
                budget: budget || null,
                status: status || 'pendente',
                description: description || null,
                note: note || null,
                priority: priority || 'medium',
                completed: completed === 'on',
                validated: validated === 'on',
                progress: 0,
                created_by: user.id
            };

            const actionId = await ActionModel.create(action, tasksData);

            if (req.files && Array.isArray(req.files)) {
                for (const file of req.files) {
                    await ActionAttachmentModel.create({
                        action_id: actionId,
                        filename: file.filename,
                        original_name: file.originalname,
                        file_size: file.size,
                        mime_type: file.mimetype,
                        file_path: file.path,
                        uploaded_by: user.id
                    });
                }
            }

            res.redirect('/dashboard');
        } catch (error) {
            console.error('Error creating action:', error);
            const sections = user.role === 'general_coordinator' || user.role === 'project_coordinator' ? (
                (await db.query<SectionRow[]>('SELECT name FROM sections WHERE is_active = 1'))[0].map(s => s.name)
            ) : user.sections;
            const collaborators = await CollaboratorModel.findAll();
            res.render('action-form', { user, sections, collaborators, error: 'Erro ao criar ação. Verifique os dados e tente novamente.' });
        }
    }

    static async getEditAction(req: Request, res: Response) {
        const user: User | undefined = req.session.user;
        if (!user) {
            return res.redirect('/');
        }

        const actionId = parseInt(req.params.id);
        try {
            const action = await ActionModel.findById(actionId);
            if (!action) {
                return res.render('action-edit', { user, action: null, tasks: [], sections: [], collaborators: [], attachments: [], followUps: [], assignments: [], error: 'Ação não encontrada.' });
            }
            const [tasks, attachments, collaborators, followUps, assignments] = await Promise.all([
                TaskModel.findByActionId(actionId),
                ActionAttachmentModel.findByActionId(actionId),
                CollaboratorModel.findAll(),
                FollowUpModel.findByActionId(actionId),
                TaskAssignmentModel.findByActionId(actionId)
            ]);
            const sections = user.role === 'general_coordinator' || user.role === 'project_coordinator' ? (
                (await db.query<SectionRow[]>('SELECT name FROM sections WHERE is_active = 1'))[0].map(s => s.name)
            ) : user.sections;
            res.render('action-edit', { user, action, tasks, sections, collaborators, attachments, followUps, assignments, error: null });
        } catch (error) {
            console.error('Error fetching action for edit:', error);
            res.render('action-edit', { user, action: null, tasks: [], sections: [], collaborators: [], attachments: [], followUps: [], assignments: [], error: 'Erro ao carregar a ação para edição.' });
        }
    }

    static async updateAction(req: Request, res: Response) {
        const user: User | undefined = req.session.user;
        if (!user) {
            return res.redirect('/');
        }

        const actionId = parseInt(req.params.id);
        const { task, responsible, deadline, budget, status, description, note, priority, section, completed, validated, tasks } = req.body;

        try {
            const [sectionResult] = await db.query<SectionIdRow[]>('SELECT id FROM sections WHERE name = ?', [section]);
            if (!sectionResult[0]) throw new Error('Seção inválida');

            const tasksData = Array.isArray(tasks) ? tasks.map((t: any, i: number) => ({
                id: t.id ? parseInt(t.id) : undefined,
                description: t.description || '',
                completed: t.completed === 'on' || t.completed === true,
                order_index: i
            })).filter(t => t.description.trim()) : [];

            const action: Partial<Action> = {
                section_id: sectionResult[0].id,
                task,
                responsible,
                deadline: new Date(deadline),
                budget: budget || null,
                status: status || 'pendente',
                description: description || null,
                note: note || null,
                priority: priority || 'medium',
                completed: completed === 'on',
                validated: validated === 'on',
                progress: 0
            };

            await ActionModel.update(actionId, action, tasksData);

            if (req.files && Array.isArray(req.files)) {
                for (const file of req.files) {
                    await ActionAttachmentModel.create({
                        action_id: actionId,
                        filename: file.filename,
                        original_name: file.originalname,
                        file_size: file.size,
                        mime_type: file.mimetype,
                        file_path: file.path,
                        uploaded_by: user.id
                    });
                }
            }

            res.redirect('/dashboard');
        } catch (error) {
            console.error('Error updating action:', error);
            const action = await ActionModel.findById(actionId);
            const [tasks, attachments, collaborators, followUps, assignments] = await Promise.all([
                TaskModel.findByActionId(actionId),
                ActionAttachmentModel.findByActionId(actionId),
                CollaboratorModel.findAll(),
                FollowUpModel.findByActionId(actionId),
                TaskAssignmentModel.findByActionId(actionId)
            ]);
            const sections = user.role === 'general_coordinator' || user.role === 'project_coordinator' ? (
                (await db.query<SectionRow[]>('SELECT name FROM sections WHERE is_active = 1'))[0].map(s => s.name)
            ) : user.sections;
            res.render('action-edit', { user, action: action || null, tasks: tasks || [], sections, collaborators, attachments, followUps, assignments, error: 'Erro ao atualizar ação. Tente novamente.' });
        }
    }

    static async deleteAction(req: Request, res: Response) {
        const user: User | undefined = req.session.user;
        if (!user) {
            return res.redirect('/');
        }

        const actionId = parseInt(req.params.id);
        try {
            const attachments = await ActionAttachmentModel.findByActionId(actionId);
            for (const attachment of attachments) {
                await ActionAttachmentModel.delete(attachment.id);
            }
            await ActionModel.delete(actionId);
            res.redirect('/dashboard');
        } catch (error) {
            console.error('Error deleting action:', error);
            res.redirect('/dashboard');
        }
    }

    static async getEditTask(req: Request, res: Response) {
        const user: User | undefined = req.session.user;
        if (!user) {
            return res.redirect('/');
        }

        const taskId = parseInt(req.params.id);
        try {
            const task = await TaskModel.findById(taskId);
            if (!task) {
                return res.render('task-edit', { user, task: null, error: 'Tarefa não encontrada.' });
            }
            const action = await ActionModel.findById(task.action_id);
            if (!action || (user.role !== 'general_coordinator' && user.role !== 'project_coordinator' && !user.sections.includes(action.section_name!))) {
                return res.render('task-edit', { user, task: null, error: 'Acesso não autorizado.' });
            }
            res.render('task-edit', { user, task, error: null });
        } catch (error) {
            console.error('Error fetching task for edit:', error);
            res.render('task-edit', { user, task: null, error: 'Erro ao carregar a tarefa para edição.' });
        }
    }

    static async updateTask(req: Request, res: Response) {
        const user: User | undefined = req.session.user;
        if (!user) {
            return res.redirect('/');
        }

        const taskId = parseInt(req.params.id);
        const { description, completed } = req.body;

        try {
            await TaskModel.update(taskId, {
                description,
                completed: completed === 'on' || completed === true
            });
            res.redirect('/dashboard');
        } catch (error) {
            console.error('Error updating task:', error);
            res.render('task-edit', { user, task: null, error: 'Erro ao atualizar tarefa.' });
        }
    }

    static async deleteTask(req: Request, res: Response) {
        const user: User | undefined = req.session.user;
        if (!user) {
            return res.redirect('/');
        }

        const taskId = parseInt(req.params.id);
        try {
            const task = await TaskModel.findById(taskId);
            if (!task) {
                return res.redirect('/dashboard');
            }
            await TaskModel.delete(taskId);
            res.redirect('/dashboard');
        } catch (error) {
            console.error('Error deleting task:', error);
            res.redirect('/dashboard');
        }
    }
}
