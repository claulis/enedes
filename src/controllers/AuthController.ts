import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { UserModel, User } from '../models/Users';
import mysql from 'mysql2/promise';
import { dbConfig } from '../config/database';

export class AuthController {
    static async login(req: Request, res: Response) {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).render('login', { error: 'Username e senha são obrigatórios' });
        }

        const user = await UserModel.findByUsername(username);
        if (!user || !await bcrypt.compare(password, user.password_hash)) {
            // Fetch users again for the login page
            const connection = await mysql.createConnection(dbConfig);
            const [users] = await connection.query('SELECT username, name FROM user WHERE is_active = 1');
            await connection.end();
            return res.render('login', { users, error: 'Usuário ou senha inválidos.' });
        }

        req.session.user = user;
        return res.redirect('/dashboard');
    }

    static logout(req: Request, res: Response) {
        req.session.destroy(() => {
            res.redirect('/');
        });
    }
}