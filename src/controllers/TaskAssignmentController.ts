import { Request, Response } from 'express';
import { TaskAssignmentModel, TaskAssignment } from '../models/TaskAssignments';
import { ActionModel } from '../models/Actions';
import { TaskModel } from '../models/Tasks';
import { CollaboratorModel } from '../models/Collaborators';
import { User } from '../models/Users';

declare module 'express-session' {
    interface SessionData {
        user?: User;
    }
}

export class TaskAssignmentController {
    static async getNewTaskAssignment(req: Request, res: Response) {
        const user: User | undefined = req.session.user;
        if (!user) {
            return res.redirect('/');
        }

        const actionId = parseInt(req.params.actionId);
        try {
            const action = await ActionModel.findById(actionId);
            if (!action || (user.role !== 'general_coordinator' && user.role !== 'project_coordinator' && !user.sections.includes(action.section_name!))) {
                return res.render('task-assignment-form', { user, action: null, tasks: [], collaborators: [], assignment: null, error: 'Acesso não autorizado.' });
            }
            const [tasks, collaborators] = await Promise.all([
                TaskModel.findByActionId(actionId),
                CollaboratorModel.findAll()
            ]);
            if (!tasks || tasks.length === 0) {
                return res.render('task-assignment-form', { user, action, tasks: [], collaborators, assignment: null, error: 'Nenhuma tarefa disponível para esta ação.' });
            }
            res.render('task-assignment-form', { user, action, tasks, collaborators, assignment: null, error: null });
        } catch (error) {
            console.error('Error fetching new task assignment form:', error);
            res.render('task-assignment-form', { user, action: null, tasks: [], collaborators: [], assignment: null, error: 'Erro ao carregar formulário.' });
        }
    }

    static async createTaskAssignment(req: Request, res: Response) {
        const user: User | undefined = req.session.user;
        if (!user) {
            return res.redirect('/');
        }

        const { action_id, task_id, collaborator_id, message, priority, status, deadline } = req.body;

        try {
            const action = await ActionModel.findById(parseInt(action_id));
            if (!action) {
                throw new Error('Ação não encontrada.');
            }
            const task = await TaskModel.findById(parseInt(task_id));
            if (!task || task.action_id !== parseInt(action_id)) {
                throw new Error('Tarefa inválida ou não pertence à ação.');
            }

            const assignment: Partial<TaskAssignment> = {
                action_id: parseInt(action_id),
                task_id: parseInt(task_id),
                collaborator_id: parseInt(collaborator_id),
                assigned_by: user.id,
                message: message || null,
                priority: priority || 'medium',
                status: status || 'sent',
                deadline: deadline ? new Date(deadline) : null
            };

            await TaskAssignmentModel.create(assignment);
            res.redirect(`/action/edit/${action_id}`);
        } catch (error) {
            console.error('Error creating task assignment:', error);
            const actionId = parseInt(action_id);
            const action = await ActionModel.findById(actionId);
            const tasks = await TaskModel.findByActionId(actionId);
            const collaborators = await CollaboratorModel.findAll();
            res.render('task-assignment-form', { user, action, tasks, collaborators, assignment: null, error: 'Erro ao criar atribuição.' });
        }
    }

    static async getEditTaskAssignment(req: Request, res: Response) {
        const user: User | undefined = req.session.user;
        if (!user) {
            return res.redirect('/');
        }

        const assignmentId = parseInt(req.params.id);
        try {
            const assignment = await TaskAssignmentModel.findById(assignmentId);
            if (!assignment) {
                return res.render('task-assignment-form', { user, action: null, tasks: [], collaborators: [], assignment: null, error: 'Atribuição não encontrada.' });
            }
            const [action, tasks, collaborators] = await Promise.all([
                ActionModel.findById(assignment.action_id),
                TaskModel.findByActionId(assignment.action_id),
                CollaboratorModel.findAll()
            ]);
            if (!action || !tasks || tasks.length === 0) {
                return res.render('task-assignment-form', { user, action: null, tasks: [], collaborators, assignment, error: 'Ação ou tarefas não encontradas.' });
            }
            res.render('task-assignment-form', { user, action, tasks, collaborators, assignment, error: null });
        } catch (error) {
            console.error('Error fetching task assignment for edit:', error);
            res.render('task-assignment-form', { user, action: null, tasks: [], collaborators: [], assignment: null, error: 'Erro ao carregar atribuição.' });
        }
    }

    static async updateTaskAssignment(req: Request, res: Response) {
        const user: User | undefined = req.session.user;
        if (!user) {
            return res.redirect('/');
        }

        const assignmentId = parseInt(req.params.id);
        const { action_id, task_id, collaborator_id, message, priority, status, deadline } = req.body;

        try {
            const action = await ActionModel.findById(parseInt(action_id));
            if (!action) {
                throw new Error('Ação não encontrada.');
            }
            const task = await TaskModel.findById(parseInt(task_id));
            if (!task || task.action_id !== parseInt(action_id)) {
                throw new Error('Tarefa inválida ou não pertence à ação.');
            }

            const assignment: Partial<TaskAssignment> = {
                action_id: parseInt(action_id),
                task_id: parseInt(task_id),
                collaborator_id: parseInt(collaborator_id),
                message: message || null,
                priority: priority || 'medium',
                status: status || 'sent',
                deadline: deadline ? new Date(deadline) : null
            };

            await TaskAssignmentModel.update(assignmentId, assignment);
            res.redirect(`/action/edit/${action_id}`);
        } catch (error) {
            console.error('Error updating task assignment:', error);
            const assignment = await TaskAssignmentModel.findById(assignmentId);
            if (!assignment) {
                return res.render('task-assignment-form', { user, action: null, tasks: [], collaborators: [], assignment: null, error: 'Atribuição não encontrada.' });
            }
            const [action, tasks, collaborators] = await Promise.all([
                ActionModel.findById(assignment.action_id),
                TaskModel.findByActionId(assignment.action_id),
                CollaboratorModel.findAll()
            ]);
            res.render('task-assignment-form', { user, action, tasks, collaborators, assignment, error: 'Erro ao atualizar atribuição.' });
        }
    }

    static async deleteTaskAssignment(req: Request, res: Response) {
        const user: User | undefined = req.session.user;
        if (!user) {
            return res.redirect('/');
        }

        const assignmentId = parseInt(req.params.id);
        try {
            const assignment = await TaskAssignmentModel.findById(assignmentId);
            if (!assignment) {
                return res.redirect('/dashboard');
            }
            await TaskAssignmentModel.delete(assignmentId);
            res.redirect(`/action/edit/${assignment.action_id}`);
        } catch (error) {
            console.error('Error deleting task assignment:', error);
            res.redirect('/dashboard');
        }
    }
}