import { Request, Response } from 'express';
import session from 'express-session';
import { ActionModel } from '../models/Actions';
import { TaskModel } from '../models/Tasks';
import { User } from '../models/Users';

declare module 'express-session' {
    interface SessionData {
        user?: import('../models/Users').User;
    }
}

export class ActionController {
    static async getDashboard(req: Request, res: Response) {
        const user = req.session.user as User;
        if (!user) return res.redirect('/');

        const sections = user.role === 'admin' ? [
            'Cronograma de Execução', 'Metas ENEDES', 'Lab Consumer', 'Lab Varejo',
            'IFB Mais Empreendedor', 'Rota Empreendedora', 'Estúdio', 'Sala Interativa',
            'Agência de Marketing'
        ] : JSON.parse(user.sections);

        const filters = {
            section: req.query.section as string,
            status: req.query.status as string || '', // Default to empty string for "Todos"
            search: req.query.search as string
        };

        const actions = await ActionModel.findAll(user.id, user.role, JSON.parse(user.sections), filters);
        const actionDetails = await Promise.all(actions.map(async action => ({
            ...action,
            tasks: await TaskModel.findByActionId(action.id)
        })));

        res.render('dashboard', { user, sections, actions: actionDetails, filters });
    }

    static async createAction(req: Request, res: Response) {
        const user = req.session.user as User;
        if (!user) return res.redirect('/');

        const { task, responsible, deadline, budget, description, note, priority, section, completed, validated, created_date, tasks } = req.body;
        const tasksData = JSON.parse(tasks || '[]').map((t: any, i: number) => ({ description: t.description, completed: t.completed || false, order: i }));

        const completedTasks = tasksData.filter((t: any) => t.completed).length;
        const progress = tasksData.length > 0 ? Math.round((completedTasks / tasksData.length) * 100) : 0;
        const status = progress >= 100 ? 'concluida' : progress >= 70 ? 'em_andamento' : progress >= 31 ? 'alerta' : 'pendente';

        await ActionModel.create({
            task, responsible, deadline: new Date(deadline), budget, description, note, priority, section,
            completed: completed === 'on', validated: validated === 'on', created_date: new Date(created_date), created_by: user.id, progress, status
        }, tasksData);

        res.redirect('/dashboard');
    }

    static async getEditAction(req: Request, res: Response) {
        const user = req.session.user as User;
        if (!user) return res.redirect('/');

        const actionId = parseInt(req.params.id);
        const action = await ActionModel.findById(actionId);
        if (!action) return res.status(404).send('Ação não encontrada');

        const tasks = await TaskModel.findByActionId(actionId);
        const sections = user.role === 'admin' ? [
            'Cronograma de Execução', 'Metas ENEDES', 'Lab Consumer', 'Lab Varejo',
            'IFB Mais Empreendedor', 'Rota Empreendedora', 'Estúdio', 'Sala Interativa',
            'Agência de Marketing'
        ] : JSON.parse(user.sections);

        res.render('action-edit', { action, tasks, sections });
    }

    static async updateAction(req: Request, res: Response) {
        const user = req.session.user as User;
        if (!user) return res.redirect('/');

        const actionId = parseInt(req.params.id);
        const { task, responsible, deadline, budget, description, note, priority, section, completed, validated, created_date, tasks } = req.body;
        const tasksData = JSON.parse(tasks || '[]').map((t: any, i: number) => ({
            description: t.description,
            completed: t.completed || false,
            order: i
        }));

        const completedTasks = tasksData.filter((t: any) => t.completed).length;
        const progress = tasksData.length > 0 ? Math.round((completedTasks / tasksData.length) * 100) : 0;
        const status = progress >= 100 ? 'concluida' : progress >= 70 ? 'em_andamento' : progress >= 31 ? 'alerta' : 'pendente';

        await ActionModel.update(actionId, {
            task, responsible, deadline: new Date(deadline), budget, description, note, priority, section,
            completed: completed === 'on', validated: validated === 'on', created_date: new Date(created_date), created_by: user.id, progress, status
        }, tasksData);

        res.redirect('/dashboard');
    }

    static async deleteAction(req: Request, res: Response) {
        const user = req.session.user as User;
        if (!user) return res.redirect('/');

        const actionId = parseInt(req.params.id);
        await ActionModel.delete(actionId);
        res.redirect('/dashboard');
    }

    static async deleteTask(req: Request, res: Response) {
        const user = req.session.user as User;
        if (!user) return res.redirect('/');

        const taskId = parseInt(req.params.id);
        await TaskModel.delete(taskId);
        res.redirect('/dashboard');
    }
}