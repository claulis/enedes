import express, { Router, Request, Response } from 'express';
import { AuthController } from '../controllers/AuthController';
import { ActionController } from '../controllers/ActionController';
import { UserModel } from '../models/Users';
import { dbConfig } from '../config/database';
import mysql from 'mysql2/promise';

const router: Router = express.Router();

router.get('/', async (req: Request, res: Response) => {
    const connection = await mysql.createConnection(dbConfig);
    const [users] = await connection.query('SELECT username, name FROM user WHERE is_active = 1');
    await connection.end();
    res.render('login', { users, error: null });
});

router.post('/login', AuthController.login);
router.get('/logout', AuthController.logout);
router.get('/dashboard', ActionController.getDashboard);
router.get('/action/new', async (req: Request, res: Response) => {   
    const user = req.session.user;
    if (!user) return res.redirect('/');
    const sections = user.role === 'admin' ? [
        'Cronograma de Execução', 'Metas ENEDES', 'Lab Consumer', 'Lab Varejo',
        'IFB Mais Empreendedor', 'Rota Empreendedora', 'Estúdio', 'Sala Interativa',
        'Agência de Marketing'
    ] : JSON.parse(user.sections);
    res.render('action-form', { sections });
});
router.post('/action', ActionController.createAction);
router.get('/action/edit/:id', ActionController.getEditAction);
router.post('/action/:id', ActionController.updateAction);
router.get('/action/delete/:id', ActionController.deleteAction);
router.get('/task/delete/:id', ActionController.deleteTask);
router.get('/task/edit/:id', ActionController.getEditTask);
router.post('/task/:id', ActionController.updateTask);

export default router;