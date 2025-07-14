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
exports.CollaboratorController = void 0;
const app_1 = require("../app");
class CollaboratorController {
    static getCollaborators(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = req.session.user;
            if (!user) {
                return res.redirect('/');
            }
            const { search = '', sort = 'name', order = 'ASC' } = req.query;
            const validSortColumns = ['id', 'name', 'email', 'phone', 'department', 'position', 'is_active'];
            const sortColumn = validSortColumns.includes(sort) ? sort : 'name';
            const sortOrder = order === 'DESC' ? 'DESC' : 'ASC';
            const searchTerm = `%${search}%`;
            try {
                const [collaborators] = yield app_1.db.query(`
                SELECT * FROM collaborators 
                WHERE name LIKE ? 
                ORDER BY ${sortColumn} ${sortOrder}
            `, [searchTerm]);
                res.render('collaborators', {
                    user,
                    collaborators,
                    search,
                    sort,
                    order,
                    error: null
                });
            }
            catch (error) {
                console.error('Error fetching collaborators:', error);
                res.render('collaborators', {
                    user,
                    collaborators: [],
                    search,
                    sort,
                    order,
                    error: 'Erro ao carregar colaboradores.'
                });
            }
        });
    }
    static createCollaborator(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = req.session.user;
            if (!user) {
                return res.redirect('/');
            }
            const { name, email, phone, department, position, skills, is_active } = req.body;
            if (!name || !email) {
                return res.render('collaborators', {
                    user,
                    collaborators: (yield app_1.db.query('SELECT * FROM collaborators WHERE is_active = 1'))[0],
                    search: req.query.search || '',
                    sort: req.query.sort || 'name',
                    order: req.query.order || 'ASC',
                    error: 'Nome e email são obrigatórios.'
                });
            }
            try {
                const skillsArray = skills ? JSON.stringify(skills.split(',').map((s) => s.trim())) : '[]';
                yield app_1.db.query(`
                INSERT INTO collaborators (name, email, phone, department, position, skills, is_active, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            `, [name, email, phone || null, department || null, position || null, skillsArray, is_active === 'on' ? 1 : 0]);
                res.redirect('/collaborators');
            }
            catch (error) {
                console.error('Error creating collaborator:', error);
                res.render('collaborators', {
                    user,
                    collaborators: (yield app_1.db.query('SELECT * FROM collaborators WHERE is_active = 1'))[0],
                    search: req.query.search || '',
                    sort: req.query.sort || 'name',
                    order: req.query.order || 'ASC',
                    error: 'Erro ao criar colaborador.'
                });
            }
        });
    }
    static updateCollaborator(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = req.session.user;
            if (!user) {
                return res.redirect('/');
            }
            const { id } = req.params;
            const { name, email, phone, department, position, skills, is_active } = req.body;
            if (!name || !email) {
                return res.redirect('/collaborators?error=Nome+e+email+são+obrigatórios');
            }
            try {
                const skillsArray = skills ? JSON.stringify(skills.split(',').map((s) => s.trim())) : '[]';
                yield app_1.db.query(`
                UPDATE collaborators 
                SET name = ?, email = ?, phone = ?, department = ?, position = ?, skills = ?, is_active = ?, updated_at = NOW()
                WHERE id = ?
            `, [name, email, phone || null, department || null, position || null, skillsArray, is_active === 'on' ? 1 : 0, id]);
                res.redirect('/collaborators');
            }
            catch (error) {
                console.error('Error updating collaborator:', error);
                res.redirect('/collaborators?error=Erro+ao+atualizar+colaborador');
            }
        });
    }
    static deleteCollaborator(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = req.session.user;
            if (!user) {
                return res.redirect('/');
            }
            const { id } = req.params;
            try {
                yield app_1.db.query('Delete from collaborators WHERE id = ?', [id]);
                res.redirect('/collaborators');
            }
            catch (error) {
                console.error('Error deleting collaborator:', error);
                res.redirect('/collaborators?error=Erro+ao+excluir+colaborador');
            }
        });
    }
}
exports.CollaboratorController = CollaboratorController;
