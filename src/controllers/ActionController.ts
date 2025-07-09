import { Request, Response } from 'express';
import { ActionModel, Action } from '../models/Actions';
import { TaskModel } from '../models/Tasks';
import { User } from '../models/Users';

declare module 'express-session' {
    interface SessionData {
        user?: User;
    }
}

export class ActionController {
    static async getDashboard(req: Request, res: Response) {
        const user: User | undefined = req.session.user;
        if (!user) {
            console.log('No user in session, redirecting to login');
            return res.redirect('/');
        }

        const sections = user.role === 'admin' ? [
            'Cronograma de Execução', 'Metas ENEDES', 'Lab Consumer', 'Lab Varejo',
            'IFB Mais Empreendedor', 'Rota Empreendedora', 'Estúdio', 'Sala Interativa',
            'Agência de Marketing'
        ] : JSON.parse(user.sections || '[]');

        const filters = {
            section: req.query.section as string,
            status: req.query.status as string || '',
            search: req.query.search as string
        };

        try {
            const actions = await ActionModel.findAll(user.id, user.role, sections, filters);
            const actionDetails = await Promise.all(actions.map(async action => ({
                ...action,
                tasks: await TaskModel.findByActionId(action.id)
            })));

            res.render('dashboard', { user, sections, actions: actionDetails, filters, error: null });
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            res.render('dashboard', { user, sections, actions: [], filters, error: 'Erro ao carregar o dashboard.' });
        }
    }

    static async getNewAction(req: Request, res: Response) {
        const user: User | undefined = req.session.user;
        if (!user) {
            console.log('No user in session, redirecting to login');
            return res.redirect('/');
        }

        const sections = user.role === 'admin' ? [
            'Cronograma de Execução', 'Metas ENEDES', 'Lab Consumer', 'Lab Varejo',
            'IFB Mais Empreendedor', 'Rota Empreendedora', 'Estúdio', 'Sala Interativa',
            'Agência de Marketing'
        ] : JSON.parse(user.sections || '[]');

        res.render('action-form', { user, sections, error: null });
    }

    static async createAction(req: Request, res: Response) {
        const user: User | undefined = req.session.user;
        if (!user) {
            console.log('No user in session, redirecting to login');
            return res.redirect('/');
        }

        const { task, responsible, deadline, budget, status, description, note, priority, section, completed, validated, created_date, tasks } = req.body;

        try {
            const tasksData = Array.isArray(tasks) ? tasks.map((t: any, i: number) => ({
                description: t.description || '',
                completed: t.completed === 'on' || t.completed === true,
                order: i
            })).filter(t => t.description) : [];

            const action: Partial<Action> = {
                task,
                responsible,
                deadline: new Date(deadline),
                budget: budget || '',
                status: status || 'pendente',
                description: description || '',
                note: note || '',
                priority: priority || 'medium',
                section,
                completed: completed === 'on',
                validated: validated === 'on',
                created_date: new Date(created_date),
                created_by: user.id
            };

            await ActionModel.create(action, tasksData);
            res.redirect('/dashboard');
        } catch (error) {
            console.error('Error creating action:', error);
            const sections = user.role === 'admin' ? [
                'Cronograma de Execução', 'Metas ENEDES', 'Lab Consumer', 'Lab Varejo',
                'IFB Mais Empreendedor', 'Rota Empreendedora', 'Estúdio', 'Sala Interativa',
                'Agência de Marketing'
            ] : JSON.parse(user.sections || '[]');
            res.render('action-form', { user, sections, error: 'Erro ao criar ação. Verifique os dados e tente novamente.' });
        }
    }

    static async getEditAction(req: Request, res: Response) {
        const user: User | undefined = req.session.user;
        if (!user) {
            console.log('No user in session, redirecting to login');
            return res.redirect('/');
        }

        const actionId = parseInt(req.params.id);
        try {
            const action = await ActionModel.findById(actionId);
            if (!action) {
                return res.render('action-edit', { user, action: null, tasks: [], sections: [], error: 'Ação não encontrada.' });
            }
            const tasks = await TaskModel.findByActionId(actionId);
            const sections = user.role === 'admin' ? [
                'Cronograma de Execução', 'Metas ENEDES', 'Lab Consumer', 'Lab Varejo',
                'IFB Mais Empreendedor', 'Rota Empreendedora', 'Estúdio', 'Sala Interativa',
                'Agência de Marketing'
            ] : JSON.parse(user.sections || '[]');
            res.render('action-edit', { user, action, tasks, sections, error: null });
        } catch (error) {
            console.error('Error fetching action for edit:', error);
            res.render('action-edit', { user, action: null, tasks: [], sections: [], error: 'Erro ao carregar a ação para edição.' });
        }
    }

    static async updateAction(req: Request, res: Response) {
        const user: User | undefined = req.session.user;
        if (!user) {
            console.log('No user in session, redirecting to login');
            return res.redirect('/');
        }

        const actionId = parseInt(req.params.id);
        const { task, responsible, deadline, budget, status, description, note, priority, section, completed, validated, created_date, tasks } = req.body;

        try {
            const tasksData = Array.isArray(tasks) ? tasks.map((t: any, i: number) => ({
                description: t.description || '',
                completed: t.completed === 'on' || t.completed === true,
                order: i
            })).filter(t => t.description) : [];

            const action: Partial<Action> = {
                task,
                responsible,
                deadline: new Date(deadline),
                budget: budget || '',
                status: status || 'pendente',
                description: description || '',
                note: note || '',
                priority: priority || 'medium',
                section,
                completed: completed === 'on',
                validated: validated === 'on',
                created_date: new Date(created_date)
            };

            await ActionModel.update(actionId, action, tasksData);
            res.redirect('/dashboard');
        } catch (error) {
            console.error('Error updating action:', error);
            const action = await ActionModel.findById(actionId);
            const tasks = await TaskModel.findByActionId(actionId);
            const sections = user.role === 'admin' ? [
                'Cronograma de Execução', 'Metas ENEDES', 'Lab Consumer', 'Lab Varejo',
                'IFB Mais Empreendedor', 'Rota Empreendedora', 'Estúdio', 'Sala Interativa',
                'Agência de Marketing'
            ] : JSON.parse(user.sections || '[]');
            res.render('action-edit', { user, action: action || null, tasks: tasks || [], sections, error: 'Erro ao atualizar ação. Tente novamente.' });
        }
    }

    static async deleteAction(req: Request, res: Response) {
        const user: User | undefined = req.session.user;
        if (!user) {
            console.log('No user in session, redirecting to login');
            return res.redirect('/');
        }

        const actionId = parseInt(req.params.id);
        try {
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
            console.log('No user in session, redirecting to login');
            return res.redirect('/');
        }

        const taskId = parseInt(req.params.id);
        try {
            const task = await TaskModel.findById(taskId);
            if (!task) {
                return res.render('task-edit', { user, task: null, error: 'Tarefa não encontrada.' });
            }
            const action = await ActionModel.findById(task.action_id);
            if (!action || (user.role !== 'admin' && !JSON.parse(user.sections || '[]').includes(action.section))) {
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
            console.log('No user in session, redirecting to login');
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
            console.log('No user in session, redirecting to login');
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