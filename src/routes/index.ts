import express, { Router, Request, Response } from 'express';
import { AuthController } from '../controllers/AuthController';
import { ActionController } from '../controllers/ActionController';
import { FollowUpController } from '../controllers/FollowUpController';
import { TaskAssignmentController } from '../controllers/TaskAssignmentController';
import { NotificationController } from '../controllers/NotificationController';
import { CollaboratorController } from '../controllers/CollaboratorController';
import { ExecutionController } from '../controllers/ExecutionController';
import { ExportController} from '../controllers/ExportController';
import { MetaController } from '../controllers/MetasController';

import { User } from '../models/Users';
import { db } from '../app';
import { upload } from '../config/filestorage';
import { ActionAttachmentModel } from '../models/ActionAttachments';
import { FollowUpAttachmentModel } from '../models/FolloUpAttachments';
import path from 'path';

const router: Router = express.Router();

router.get('/', async (req: Request, res: Response) => {
    try {
        const [users] = await db.query('SELECT username, name FROM users WHERE is_active = 1');
        res.render('login', { users, error: null });
    } catch (error) {
        console.error('Error fetching users for login:', error);
        res.render('login', { users: [], error: 'Erro ao carregar lista de usuários.' });
    }
});

router.post('/login', AuthController.login);
router.get('/logout', AuthController.logout);
router.get('/dashboard', ActionController.getDashboard);
router.get('/action/new', ActionController.getNewAction);
router.post('/action', upload.array('attachments'), ActionController.createAction);
router.get('/action/edit/:id', ActionController.getEditAction);
router.post('/action/:id', upload.array('attachments'), ActionController.updateAction);
router.get('/action/delete/:id', ActionController.deleteAction);
router.get('/task/edit/:id', ActionController.getEditTask);
router.get('/task/delete/:id', ActionController.deleteTask);
router.post('/task/:id', ActionController.updateTask);
router.get('/follow-up/new/:actionId', FollowUpController.getNewFollowUp);
router.post('/createFollowUp', FollowUpController.createFollowUp);
router.get('/follow-up/edit/:id', FollowUpController.getEditFollowUp);
router.post('/follow-up/:id', FollowUpController.updateFollowUp);
router.get('/follow-up/delete/:id', FollowUpController.deleteFollowUp);
router.get('/follow-up/:id', FollowUpController.getFollowUp);
router.get('/follow-ups', FollowUpController.getFollowUps);
router.get('/task-assignment/new/:actionId', TaskAssignmentController.getNewTaskAssignment);
router.post('/task-assignment', TaskAssignmentController.createTaskAssignment);
router.get('/task-assignment/edit/:id', TaskAssignmentController.getEditTaskAssignment);
router.post('/task-assignment/:id', TaskAssignmentController.updateTaskAssignment);
router.get('/task-assignment/delete/:id', TaskAssignmentController.deleteTaskAssignment);
router.post('/notification/mark-read/:id', NotificationController.markAsRead);
router.post('/notification/create', NotificationController.createNotification);
router.get('/notification/new', NotificationController.getNewNotification);
router.get('/notifications', NotificationController.getNotifications);
router.post('/notifications/update', NotificationController.updateNotifications);
router.get('/notification/delete/:id', NotificationController.deleteNotification);
router.get('/collaborators', CollaboratorController.getCollaborators);
router.post('/collaborators', CollaboratorController.createCollaborator);
router.post('/collaborators/:id', CollaboratorController.updateCollaborator);
router.get('/collaborators/delete/:id', CollaboratorController.deleteCollaborator);
router.get('/executions', ExecutionController.getExecutions);
router.post('/execution', ExecutionController.createExecution);
router.post('/execution/:id', ExecutionController.updateExecution);
router.get('/execution/delete/:id', ExecutionController.deleteExecution);
router.post('/gerar-pdf', ExportController.generatePDF); 
router.get('/metas', MetaController.getMetas);
router.post('/metas', MetaController.createMeta);
router.post('/metas/:id', MetaController.updateMeta);
router.get('/metas/delete/:id', MetaController.deleteMeta);

router.get('/attachment/action/:id', async (req: Request, res: Response) => {
    const attachmentId = parseInt(req.params.id);
    try {
        const attachment = await ActionAttachmentModel.findById(attachmentId);
        if (!attachment || !attachment.file_path) {
            return res.status(404).send('Anexo não encontrado.');
        }
        res.sendFile(path.resolve(attachment.file_path));
    } catch (error) {
        console.error('Error downloading attachment:', error);
        res.status(500).send('Erro ao baixar anexo.');
    }
});
router.get('/attachment/follow-up/:id', async (req: Request, res: Response) => {
    const attachmentId = parseInt(req.params.id);
    try {
        const attachment = await FollowUpAttachmentModel.findById(attachmentId);
        if (!attachment || !attachment.file_path) {
            return res.status(404).send('Anexo não encontrado.');
        }
        res.sendFile(path.resolve(attachment.file_path));
    } catch (error) {
        console.error('Error downloading attachment:', error);
        res.status(500).send('Erro ao baixar anexo.');
    }
});
router.get('/attachment/delete/action/:id', async (req: Request, res: Response) => {
    const user: User | undefined = req.session.user;
    if (!user) {
        return res.redirect('/');
    }
    const attachmentId = parseInt(req.params.id);
    try {
        const attachment = await ActionAttachmentModel.findById(attachmentId);
        if (!attachment) {
            return res.redirect('/dashboard');
        }
        await ActionAttachmentModel.delete(attachmentId);
        res.redirect(`/action/edit/${attachment.action_id}`);
    } catch (error) {
        console.error('Error deleting attachment:', error);
        res.redirect('/dashboard');
    }
});
router.get('/attachment/delete/follow-up/:id', async (req: Request, res: Response) => {
    const user: User | undefined = req.session.user;
    if (!user) {
        return res.redirect('/');
    }
    const attachmentId = parseInt(req.params.id);
    try {
        const attachment = await FollowUpAttachmentModel.findById(attachmentId);
        if (!attachment) {
            return res.redirect('/dashboard');
        }
        await FollowUpAttachmentModel.delete(attachmentId);
        res.redirect(`/follow-up/edit/${attachment.follow_up_id}`);
    } catch (error) {
        console.error('Error deleting attachment:', error);
        res.redirect('/dashboard');
    }
});

export default router;
