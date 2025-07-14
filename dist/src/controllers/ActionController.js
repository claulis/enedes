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
exports.ActionController = void 0;
const Actions_1 = require("../models/Actions");
const Tasks_1 = require("../models/Tasks");
const Collaborators_1 = require("../models/Collaborators");
const Notifications_1 = require("../models/Notifications");
const Metas_1 = require("../models/Metas");
const Execution_1 = require("../models/Execution");
const ActionAttachments_1 = require("../models/ActionAttachments");
const FollowUps_1 = require("../models/FollowUps");
const TaskAssignments_1 = require("../models/TaskAssignments");
const app_1 = require("../app");
class ActionController {
    static getDashboard(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = req.session.user;
            if (!user) {
                return res.redirect('/');
            }
            const sections = user.role === 'general_coordinator' || user.role === 'project_coordinator' ? ((yield app_1.db.query('SELECT name FROM sections WHERE is_active = 1'))[0].map(s => s.name)) : user.sections;
            const filters = {
                section: req.query.section,
                status: req.query.status || '',
                priority: req.query.priority || '',
                search: req.query.search
            };
            try {
                const [actions, executions, notifications, metas, stats] = yield Promise.all([
                    Actions_1.ActionModel.findAll(user.id, user.role, sections, filters),
                    Execution_1.ExecutionModel.findAll(),
                    Notifications_1.NotificationModel.findByUserId(user.id),
                    Metas_1.MetaModel.findAll(),
                    app_1.db.query('SELECT * FROM user_dashboard WHERE user_id = ?', [user.id])
                ]);
                const actionDetails = yield Promise.all(actions.map((action) => __awaiter(this, void 0, void 0, function* () {
                    return (Object.assign(Object.assign({}, action), { tasks: yield Tasks_1.TaskModel.findByActionId(action.id), attachments: yield ActionAttachments_1.ActionAttachmentModel.findByActionId(action.id), followUps: yield FollowUps_1.FollowUpModel.findByActionId(action.id), assignments: yield TaskAssignments_1.TaskAssignmentModel.findByActionId(action.id) }));
                })));
                const userStats = stats[0][0] || { total_actions: 0, completed_actions: 0, unread_notifications: 0 };
                res.render('dashboard', {
                    user,
                    sections,
                    actions: actionDetails,
                    executions,
                    notifications,
                    metas,
                    stats: userStats,
                    filters,
                    error: null
                });
            }
            catch (error) {
                console.error('Error fetching dashboard data:', error);
                res.render('dashboard', {
                    user,
                    sections,
                    actions: [],
                    notifications: [],
                    metas: [],
                    stats: null,
                    filters,
                    error: 'Erro ao carregar o dashboard.'
                });
            }
        });
    }
    static getNewAction(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = req.session.user;
            if (!user) {
                return res.redirect('/');
            }
            const sections = user.role === 'general_coordinator' || user.role === 'project_coordinator' ? ((yield app_1.db.query('SELECT name FROM sections WHERE is_active = 1'))[0].map(s => s.name)) : user.sections;
            const collaborators = yield Collaborators_1.CollaboratorModel.findAll();
            res.render('action-form', { user, sections, collaborators, error: null });
        });
    }
    static createAction(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = req.session.user;
            if (!user) {
                return res.redirect('/');
            }
            const { task, responsible, deadline, budget, status, description, note, priority, section, completed, validated, tasks } = req.body;
            try {
                const [sectionResult] = yield app_1.db.query('SELECT id FROM sections WHERE name = ?', [section]);
                if (!sectionResult[0])
                    throw new Error('Seção inválida');
                const tasksData = Array.isArray(tasks) ? tasks.map((t, i) => ({
                    id: t.id ? parseInt(t.id) : undefined,
                    description: t.description || '',
                    completed: t.completed === 'on' || t.completed === true,
                    order_index: i
                })).filter(t => t.description.trim()) : [];
                const action = {
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
                const actionId = yield Actions_1.ActionModel.create(action, tasksData);
                if (req.files && Array.isArray(req.files)) {
                    for (const file of req.files) {
                        yield ActionAttachments_1.ActionAttachmentModel.create({
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
            }
            catch (error) {
                console.error('Error creating action:', error);
                const sections = user.role === 'general_coordinator' || user.role === 'project_coordinator' ? ((yield app_1.db.query('SELECT name FROM sections WHERE is_active = 1'))[0].map(s => s.name)) : user.sections;
                const collaborators = yield Collaborators_1.CollaboratorModel.findAll();
                res.render('action-form', { user, sections, collaborators, error: 'Erro ao criar ação. Verifique os dados e tente novamente.' });
            }
        });
    }
    static getEditAction(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = req.session.user;
            if (!user) {
                return res.redirect('/');
            }
            const actionId = parseInt(req.params.id);
            try {
                const action = yield Actions_1.ActionModel.findById(actionId);
                if (!action) {
                    return res.render('action-edit', { user, action: null, tasks: [], sections: [], collaborators: [], attachments: [], followUps: [], assignments: [], error: 'Ação não encontrada.' });
                }
                const [tasks, attachments, collaborators, followUps, assignments] = yield Promise.all([
                    Tasks_1.TaskModel.findByActionId(actionId),
                    ActionAttachments_1.ActionAttachmentModel.findByActionId(actionId),
                    Collaborators_1.CollaboratorModel.findAll(),
                    FollowUps_1.FollowUpModel.findByActionId(actionId),
                    TaskAssignments_1.TaskAssignmentModel.findByActionId(actionId)
                ]);
                const sections = user.role === 'general_coordinator' || user.role === 'project_coordinator' ? ((yield app_1.db.query('SELECT name FROM sections WHERE is_active = 1'))[0].map(s => s.name)) : user.sections;
                res.render('action-edit', { user, action, tasks, sections, collaborators, attachments, followUps, assignments, error: null });
            }
            catch (error) {
                console.error('Error fetching action for edit:', error);
                res.render('action-edit', { user, action: null, tasks: [], sections: [], collaborators: [], attachments: [], followUps: [], assignments: [], error: 'Erro ao carregar a ação para edição.' });
            }
        });
    }
    static updateAction(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = req.session.user;
            if (!user) {
                return res.redirect('/');
            }
            const actionId = parseInt(req.params.id);
            const { task, responsible, deadline, budget, status, description, note, priority, section, completed, validated, tasks } = req.body;
            try {
                const [sectionResult] = yield app_1.db.query('SELECT id FROM sections WHERE name = ?', [section]);
                if (!sectionResult[0])
                    throw new Error('Seção inválida');
                const tasksData = Array.isArray(tasks) ? tasks.map((t, i) => ({
                    id: t.id ? parseInt(t.id) : undefined,
                    description: t.description || '',
                    completed: t.completed === 'on' || t.completed === true,
                    order_index: i
                })).filter(t => t.description.trim()) : [];
                const action = {
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
                yield Actions_1.ActionModel.update(actionId, action, tasksData);
                if (req.files && Array.isArray(req.files)) {
                    for (const file of req.files) {
                        yield ActionAttachments_1.ActionAttachmentModel.create({
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
            }
            catch (error) {
                console.error('Error updating action:', error);
                const action = yield Actions_1.ActionModel.findById(actionId);
                const [tasks, attachments, collaborators, followUps, assignments] = yield Promise.all([
                    Tasks_1.TaskModel.findByActionId(actionId),
                    ActionAttachments_1.ActionAttachmentModel.findByActionId(actionId),
                    Collaborators_1.CollaboratorModel.findAll(),
                    FollowUps_1.FollowUpModel.findByActionId(actionId),
                    TaskAssignments_1.TaskAssignmentModel.findByActionId(actionId)
                ]);
                const sections = user.role === 'general_coordinator' || user.role === 'project_coordinator' ? ((yield app_1.db.query('SELECT name FROM sections WHERE is_active = 1'))[0].map(s => s.name)) : user.sections;
                res.render('action-edit', { user, action: action || null, tasks: tasks || [], sections, collaborators, attachments, followUps, assignments, error: 'Erro ao atualizar ação. Tente novamente.' });
            }
        });
    }
    static deleteAction(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = req.session.user;
            if (!user) {
                return res.redirect('/');
            }
            const actionId = parseInt(req.params.id);
            try {
                const attachments = yield ActionAttachments_1.ActionAttachmentModel.findByActionId(actionId);
                for (const attachment of attachments) {
                    yield ActionAttachments_1.ActionAttachmentModel.delete(attachment.id);
                }
                yield Actions_1.ActionModel.delete(actionId);
                res.redirect('/dashboard');
            }
            catch (error) {
                console.error('Error deleting action:', error);
                res.redirect('/dashboard');
            }
        });
    }
    static getEditTask(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = req.session.user;
            if (!user) {
                return res.redirect('/');
            }
            const taskId = parseInt(req.params.id);
            try {
                const task = yield Tasks_1.TaskModel.findById(taskId);
                if (!task) {
                    return res.render('task-edit', { user, task: null, error: 'Tarefa não encontrada.' });
                }
                const action = yield Actions_1.ActionModel.findById(task.action_id);
                if (!action || (user.role !== 'general_coordinator' && user.role !== 'project_coordinator' && !user.sections.includes(action.section_name))) {
                    return res.render('task-edit', { user, task: null, error: 'Acesso não autorizado.' });
                }
                res.render('task-edit', { user, task, error: null });
            }
            catch (error) {
                console.error('Error fetching task for edit:', error);
                res.render('task-edit', { user, task: null, error: 'Erro ao carregar a tarefa para edição.' });
            }
        });
    }
    static updateTask(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = req.session.user;
            if (!user) {
                return res.redirect('/');
            }
            const taskId = parseInt(req.params.id);
            const { description, completed } = req.body;
            try {
                yield Tasks_1.TaskModel.update(taskId, {
                    description,
                    completed: completed === 'on' || completed === true
                });
                res.redirect('/dashboard');
            }
            catch (error) {
                console.error('Error updating task:', error);
                res.render('task-edit', { user, task: null, error: 'Erro ao atualizar tarefa.' });
            }
        });
    }
    static deleteTask(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = req.session.user;
            if (!user) {
                return res.redirect('/');
            }
            const taskId = parseInt(req.params.id);
            try {
                const task = yield Tasks_1.TaskModel.findById(taskId);
                if (!task) {
                    return res.redirect('/dashboard');
                }
                yield Tasks_1.TaskModel.delete(taskId);
                res.redirect('/dashboard');
            }
            catch (error) {
                console.error('Error deleting task:', error);
                res.redirect('/dashboard');
            }
        });
    }
}
exports.ActionController = ActionController;
