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
exports.AuthController = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const Users_1 = require("../models/Users");
const app_1 = require("../app");
class AuthController {
    static login(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { username, password } = req.body;
            if (!username || !password) {
                try {
                    const [users] = yield app_1.db.query('SELECT username, name FROM users WHERE is_active = 1');
                    return res.status(400).render('login', { users, error: 'Usuário e senha são obrigatórios.' });
                }
                catch (error) {
                    console.error('Error fetching users for login:', error);
                    return res.status(500).render('login', { users: [], error: 'Erro ao carregar lista de usuários.' });
                }
            }
            try {
                const user = yield Users_1.UserModel.findByUsername(username);
                if (!user || !user.password) {
                    const [users] = yield app_1.db.query('SELECT username, name FROM users WHERE is_active = 1');
                    return res.status(401).render('login', { users, error: 'Usuário ou senha inválidos.' });
                }
                const isPasswordValid = yield bcrypt_1.default.compare(password, user.password);
                if (!isPasswordValid) {
                    const [users] = yield app_1.db.query('SELECT username, name FROM users WHERE is_active = 1');
                    return res.status(401).render('login', { users, error: 'Usuário ou senha inválidos.' });
                }
                // Update last_login timestamp
                yield app_1.db.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);
                req.session.user = user;
                return res.redirect('/dashboard');
            }
            catch (error) {
                console.error('Error during login:', error);
                try {
                    const [users] = yield app_1.db.query('SELECT username, name FROM users WHERE is_active = 1');
                    return res.status(500).render('login', { users, error: 'Erro ao realizar login. Tente novamente.' });
                }
                catch (fetchError) {
                    console.error('Error fetching users for login error:', fetchError);
                    return res.status(500).render('login', { users: [], error: 'Erro ao realizar login. Tente novamente.' });
                }
            }
        });
    }
    static logout(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            req.session.destroy((err) => {
                if (err) {
                    console.error('Error during logout:', err);
                }
                res.redirect('/');
            });
        });
    }
}
exports.AuthController = AuthController;
