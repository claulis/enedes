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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const AuthController_1 = require("../controllers/AuthController");
const ActionController_1 = require("../controllers/ActionController");
const FollowUpController_1 = require("../controllers/FollowUpController");
const TaskAssignmentController_1 = require("../controllers/TaskAssignmentController");
const NotificationController_1 = require("../controllers/NotificationController");
const CollaboratorController_1 = require("../controllers/CollaboratorController");
const ExecutionController_1 = require("../controllers/ExecutionController");
const ExportController_1 = require("../controllers/ExportController");
const MetasController_1 = require("../controllers/MetasController");
const app_1 = require("../app");
const filestorage_1 = require("../config/filestorage");
const ActionAttachments_1 = require("../models/ActionAttachments");
const FolloUpAttachments_1 = require("../models/FolloUpAttachments");
const path_1 = __importDefault(require("path"));
const router = express_1.default.Router();
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const [users] = yield app_1.db.query('SELECT username, name FROM users WHERE is_active = 1');
        res.render('login', { users, error: null });
    }
    catch (error) {
        console.error('Error fetching users for login:', error);
        res.render('login', { users: [], error: 'Erro ao carregar lista de usuários.' });
    }
}));
router.post('/login', AuthController_1.AuthController.login);
router.get('/logout', AuthController_1.AuthController.logout);
router.get('/dashboard', ActionController_1.ActionController.getDashboard);
router.get('/action/new', ActionController_1.ActionController.getNewAction);
router.post('/action', filestorage_1.upload.array('attachments'), ActionController_1.ActionController.createAction);
router.get('/action/edit/:id', ActionController_1.ActionController.getEditAction);
router.post('/action/:id', filestorage_1.upload.array('attachments'), ActionController_1.ActionController.updateAction);
router.get('/action/delete/:id', ActionController_1.ActionController.deleteAction);
router.get('/task/edit/:id', ActionController_1.ActionController.getEditTask);
router.get('/task/delete/:id', ActionController_1.ActionController.deleteTask);
router.post('/task/:id', ActionController_1.ActionController.updateTask);
router.get('/follow-up/new/:actionId', FollowUpController_1.FollowUpController.getNewFollowUp);
router.post('/createFollowUp', FollowUpController_1.FollowUpController.createFollowUp);
router.get('/follow-up/edit/:id', FollowUpController_1.FollowUpController.getEditFollowUp);
router.post('/follow-up/:id', FollowUpController_1.FollowUpController.updateFollowUp);
router.get('/follow-up/delete/:id', FollowUpController_1.FollowUpController.deleteFollowUp);
router.get('/follow-up/:id', FollowUpController_1.FollowUpController.getFollowUp);
router.get('/follow-ups', FollowUpController_1.FollowUpController.getFollowUps);
router.get('/task-assignment/new/:actionId', TaskAssignmentController_1.TaskAssignmentController.getNewTaskAssignment);
router.post('/task-assignment', TaskAssignmentController_1.TaskAssignmentController.createTaskAssignment);
router.get('/task-assignment/edit/:id', TaskAssignmentController_1.TaskAssignmentController.getEditTaskAssignment);
router.post('/task-assignment/:id', TaskAssignmentController_1.TaskAssignmentController.updateTaskAssignment);
router.get('/task-assignment/delete/:id', TaskAssignmentController_1.TaskAssignmentController.deleteTaskAssignment);
router.post('/notification/mark-read/:id', NotificationController_1.NotificationController.markAsRead);
router.post('/notification/create', NotificationController_1.NotificationController.createNotification);
router.get('/notification/new', NotificationController_1.NotificationController.getNewNotification);
router.get('/notifications', NotificationController_1.NotificationController.getNotifications);
router.post('/notifications/update', NotificationController_1.NotificationController.updateNotifications);
router.get('/notification/delete/:id', NotificationController_1.NotificationController.deleteNotification);
router.get('/collaborators', CollaboratorController_1.CollaboratorController.getCollaborators);
router.post('/collaborators', CollaboratorController_1.CollaboratorController.createCollaborator);
router.post('/collaborators/:id', CollaboratorController_1.CollaboratorController.updateCollaborator);
router.get('/collaborators/delete/:id', CollaboratorController_1.CollaboratorController.deleteCollaborator);
router.get('/executions', ExecutionController_1.ExecutionController.getExecutions);
router.post('/execution', ExecutionController_1.ExecutionController.createExecution);
router.post('/execution/:id', ExecutionController_1.ExecutionController.updateExecution);
router.get('/execution/delete/:id', ExecutionController_1.ExecutionController.deleteExecution);
router.post('/gerar-pdf', ExportController_1.ExportController.generatePDF);
router.get('/metas', MetasController_1.MetaController.getMetas);
router.post('/metas', MetasController_1.MetaController.createMeta);
router.post('/metas/:id', MetasController_1.MetaController.updateMeta);
router.get('/metas/delete/:id', MetasController_1.MetaController.deleteMeta);
router.get('/attachment/action/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const attachmentId = parseInt(req.params.id);
    try {
        const attachment = yield ActionAttachments_1.ActionAttachmentModel.findById(attachmentId);
        if (!attachment || !attachment.file_path) {
            return res.status(404).send('Anexo não encontrado.');
        }
        res.sendFile(path_1.default.resolve(attachment.file_path));
    }
    catch (error) {
        console.error('Error downloading attachment:', error);
        res.status(500).send('Erro ao baixar anexo.');
    }
}));
router.get('/attachment/follow-up/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const attachmentId = parseInt(req.params.id);
    try {
        const attachment = yield FolloUpAttachments_1.FollowUpAttachmentModel.findById(attachmentId);
        if (!attachment || !attachment.file_path) {
            return res.status(404).send('Anexo não encontrado.');
        }
        res.sendFile(path_1.default.resolve(attachment.file_path));
    }
    catch (error) {
        console.error('Error downloading attachment:', error);
        res.status(500).send('Erro ao baixar anexo.');
    }
}));
router.get('/attachment/delete/action/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.session.user;
    if (!user) {
        return res.redirect('/');
    }
    const attachmentId = parseInt(req.params.id);
    try {
        const attachment = yield ActionAttachments_1.ActionAttachmentModel.findById(attachmentId);
        if (!attachment) {
            return res.redirect('/dashboard');
        }
        yield ActionAttachments_1.ActionAttachmentModel.delete(attachmentId);
        res.redirect(`/action/edit/${attachment.action_id}`);
    }
    catch (error) {
        console.error('Error deleting attachment:', error);
        res.redirect('/dashboard');
    }
}));
router.get('/attachment/delete/follow-up/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.session.user;
    if (!user) {
        return res.redirect('/');
    }
    const attachmentId = parseInt(req.params.id);
    try {
        const attachment = yield FolloUpAttachments_1.FollowUpAttachmentModel.findById(attachmentId);
        if (!attachment) {
            return res.redirect('/dashboard');
        }
        yield FolloUpAttachments_1.FollowUpAttachmentModel.delete(attachmentId);
        res.redirect(`/follow-up/edit/${attachment.follow_up_id}`);
    }
    catch (error) {
        console.error('Error deleting attachment:', error);
        res.redirect('/dashboard');
    }
}));
exports.default = router;
