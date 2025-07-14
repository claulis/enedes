"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskAssignmentController = void 0;
const TaskAssignments_1 = require("../models/TaskAssignments");
const Actions_1 = require("../models/Actions");
const Tasks_1 = require("../models/Tasks");
const Collaborators_1 = require("../models/Collaborators");
class TaskAssignmentController {
    static getNewTaskAssignment(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = req.session.user;
            if (!user) {
                return res.redirect('/');
            }
            const actionId = parseInt(req.params.actionId);
            try {
                const action = yield Actions_1.ActionModel.findById(actionId);
                if (!action || (user.role !== 'general_coordinator' && user.role !== 'project_coordinator' && !user.sections.includes(action.section_name))) {
                    return res.render('task-assignment-form', { user, action: null, tasks: [], collaborators: [], assignment: null, error: 'Acesso não autorizado.' });
                }
                const [tasks, collaborators] = yield Promise.all([
                    Tasks_1.TaskModel.findByActionId(actionId),
                    Collaborators_1.CollaboratorModel.findAll()
                ]);
                if (!tasks || tasks.length === 0) {
                    return res.render('task-assignment-form', { user, action, tasks: [], collaborators, assignment: null, error: 'Nenhuma tarefa disponível para esta ação.' });
                }
                res.render('task-assignment-form', { user, action, tasks, collaborators, assignment: null, error: null });
            }
            catch (error) {
                console.error('Error fetching new task assignment form:', error);
                res.render('task-assignment-form', { user, action: null, tasks: [], collaborators: [], assignment: null, error: 'Erro ao carregar formulário.' });
            }
        });
    }
    static createTaskAssignment(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = req.session.user;
            if (!user) {
                return res.redirect('/');
            }
            const { action_id, task_id, collaborator_id, message, priority, status, deadline } = req.body;
            try {
                const action = yield Actions_1.ActionModel.findById(parseInt(action_id));
                if (!action) {
                    throw new Error('Ação não encontrada.');
                }
                const task = yield Tasks_1.TaskModel.findById(parseInt(task_id));
                if (!task || task.action_id !== parseInt(action_id)) {
                    throw new Error('Tarefa inválida ou não pertence à ação.');
                }
                const assignment = {
                    action_id: parseInt(action_id),
                    task_id: parseInt(task_id),
                    collaborator_id: parseInt(collaborator_id),
                    assigned_by: user.id,
                    message: message || null,
                    priority: priority || 'medium',
                    status: status || 'sent',
                    deadline: deadline ? new Date(deadline) : null
                };
                yield TaskAssignments_1.TaskAssignmentModel.create(assignment);
                res.redirect(`/action/edit/${action_id}`);
            }
            catch (error) {
                console.error('Error creating task assignment:', error);
                const actionId = parseInt(action_id);
                const action = yield Actions_1.ActionModel.findById(actionId);
                const tasks = yield Tasks_1.TaskModel.findByActionId(actionId);
                const collaborators = yield Collaborators_1.CollaboratorModel.findAll();
                res.render('task-assignment-form', { user, action, tasks, collaborators, assignment: null, error: 'Erro ao criar atribuição.' });
            }
        });
    }
    static getEditTaskAssignment(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = req.session.user;
            if (!user) {
                return res.redirect('/');
            }
            const assignmentId = parseInt(req.params.id);
            try {
                const assignment = yield TaskAssignments_1.TaskAssignmentModel.findById(assignmentId);
                if (!assignment) {
                    return res.render('task-assignment-form', { user, action: null, tasks: [], collaborators: [], assignment: null, error: 'Atribuição não encontrada.' });
                }
                const [action, tasks, collaborators] = yield Promise.all([
                    Actions_1.ActionModel.findById(assignment.action_id),
                    Tasks_1.TaskModel.findByActionId(assignment.action_id),
                    Collaborators_1.CollaboratorModel.findAll()
                ]);
                if (!action || !tasks || tasks.length === 0) {
                    return res.render('task-assignment-form', { user, action: null, tasks: [], collaborators, assignment, error: 'Ação ou tarefas não encontradas.' });
                }
                res.render('task-assignment-form', { user, action, tasks, collaborators, assignment, error: null });
            }
            catch (error) {
                console.error('Error fetching task assignment for edit:', error);
                res.render('task-assignment-form', { user, action: null, tasks: [], collaborators: [], assignment: null, error: 'Erro ao carregar atribuição.' });
            }
        });
    }
    static updateTaskAssignment(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = req.session.user;
            if (!user) {
                return res.redirect('/');
            }
            const assignmentId = parseInt(req.params.id);
            const { action_id, task_id, collaborator_id, message, priority, status, deadline } = req.body;
            try {
                const action = yield Actions_1.ActionModel.findById(parseInt(action_id));
                if (!action) {
                    throw new Error('Ação não encontrada.');
                }
                const task = yield Tasks_1.TaskModel.findById(parseInt(task_id));
                if (!task || task.action_id !== parseInt(action_id)) {
                    throw new Error('Tarefa inválida ou não pertence à ação.');
                }
                const assignment = {
                    action_id: parseInt(action_id),
                    task_id: parseInt(task_id),
                    collaborator_id: parseInt(collaborator_id),
                    message: message || null,
                    priority: priority || 'medium',
                    status: status || 'sent',
                    deadline: deadline ? new Date(deadline) : null
                };
                yield TaskAssignments_1.TaskAssignmentModel.update(assignmentId, assignment);
                res.redirect(`/action/edit/${action_id}`);
            }
            catch (error) {
                console.error('Error updating task assignment:', error);
                const assignment = yield TaskAssignments_1.TaskAssignmentModel.findById(assignmentId);
                if (!assignment) {
                    return res.render('task-assignment-form', { user, action: null, tasks: [], collaborators: [], assignment: null, error: 'Atribuição não encontrada.' });
                }
                const [action, tasks, collaborators] = yield Promise.all([
                    Actions_1.ActionModel.findById(assignment.action_id),
                    Tasks_1.TaskModel.findByActionId(assignment.action_id),
                    Collaborators_1.CollaboratorModel.findAll()
                ]);
                res.render('task-assignment-form', { user, action, tasks, collaborators, assignment, error: 'Erro ao atualizar atribuição.' });
            }
        });
    }
    static deleteTaskAssignment(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = req.session.user;
            if (!user) {
                return res.redirect('/');
            }
            const assignmentId = parseInt(req.params.id);
            try {
                const assignment = yield TaskAssignments_1.TaskAssignmentModel.findById(assignmentId);
                if (!assignment) {
                    return res.redirect('/dashboard');
                }
                yield TaskAssignments_1.TaskAssignmentModel.delete(assignmentId);
                res.redirect(`/action/edit/${assignment.action_id}`);
            }
            catch (error) {
                console.error('Error deleting task assignment:', error);
                res.redirect('/dashboard');
            }
        });
    }
}
exports.TaskAssignmentController = TaskAssignmentController;
