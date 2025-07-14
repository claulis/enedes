import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { UserModel } from '../models/Users';
import { db } from '../app';

export class AuthController {
    static async login(req: Request, res: Response) {
        const { username, password } = req.body;
        if (!username || !password) {
            try {
                const [users] = await db.query('SELECT username, name FROM users WHERE is_active = 1');
                return res.status(400).render('login', { users, error: 'Usuário e senha são obrigatórios.' });
            } catch (error) {
                console.error('Error fetching users for login:', error);
                return res.status(500).render('login', { users: [], error: 'Erro ao carregar lista de usuários.' });
            }
        }

        try {
            const user = await UserModel.findByUsername(username);
            if (!user || !user.password) {
                const [users] = await db.query('SELECT username, name FROM users WHERE is_active = 1');
                return res.status(401).render('login', { users, error: 'Usuário ou senha inválidos.' });
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                const [users] = await db.query('SELECT username, name FROM users WHERE is_active = 1');
                return res.status(401).render('login', { users, error: 'Usuário ou senha inválidos.' });
            }

            // Update last_login timestamp
            await db.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);
            req.session.user = user;
            return res.redirect('/dashboard');
        } catch (error) {
            console.error('Error during login:', error);
            try {
                const [users] = await db.query('SELECT username, name FROM users WHERE is_active = 1');
                return res.status(500).render('login', { users, error: 'Erro ao realizar login. Tente novamente.' });
            } catch (fetchError) {
                console.error('Error fetching users for login error:', fetchError);
                return res.status(500).render('login', { users: [], error: 'Erro ao realizar login. Tente novamente.' });
            }
        }
    }

    static async logout(req: Request, res: Response) {
        req.session.destroy((err) => {
            if (err) {
                console.error('Error during logout:', err);
            }
            res.redirect('/');
        });
    }
}