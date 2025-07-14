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
exports.MetaController = void 0;
const app_1 = require("../app");
class MetaController {
    static getMetas(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = req.session.user;
            if (!user) {
                return res.redirect('/');
            }
            const { search = '', sort = 'goal_description', order = 'ASC' } = req.query;
            const validSortColumns = ['id', 'goal_description', 'indicator', 'percentage_completion', 'social_goal', 'section_id'];
            const sortColumn = validSortColumns.includes(sort) ? sort : 'goal_description';
            const sortOrder = order === 'DESC' ? 'DESC' : 'ASC';
            const searchTerm = `%${search}%`;
            try {
                const [metas] = yield app_1.db.query(`
                SELECT m.*, s.name as section_name 
                FROM metas m 
                JOIN sections s ON m.section_id = s.id
                WHERE m.goal_description LIKE ? OR m.indicator LIKE ? OR m.social_goal LIKE ?
                ORDER BY ${sortColumn} ${sortOrder}
            `, [searchTerm, searchTerm, searchTerm]);
                const [sections] = yield app_1.db.query('SELECT id, name FROM sections WHERE is_active = 1');
                res.render('metas', {
                    user,
                    metas,
                    sections,
                    search,
                    sort,
                    order,
                    error: null
                });
            }
            catch (error) {
                console.error('Error fetching metas:', error);
                res.render('metas', {
                    user,
                    metas: [],
                    sections: [],
                    search,
                    sort,
                    order,
                    error: 'Erro ao carregar metas.'
                });
            }
        });
    }
    static createMeta(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = req.session.user;
            if (!user) {
                return res.redirect('/');
            }
            const { section_id, goal_description, indicator, percentage_completion, social_goal } = req.body;
            if (!section_id || !goal_description || !indicator || !percentage_completion || !social_goal) {
                return res.render('metas', {
                    user,
                    metas: (yield app_1.db.query(`
                    SELECT m.*, s.name as section_name 
                    FROM metas m 
                    JOIN sections s ON m.section_id = s.id
                    WHERE is_active = 1
                `))[0],
                    sections: (yield app_1.db.query('SELECT id, name FROM sections WHERE is_active = 1'))[0],
                    search: req.query.search || '',
                    sort: req.query.sort || 'goal_description',
                    order: req.query.order || 'ASC',
                    error: 'Todos os campos são obrigatórios.'
                });
            }
            try {
                yield app_1.db.query(`
                INSERT INTO metas (section_id, goal_description, indicator, percentage_completion, social_goal)
                VALUES (?, ?, ?, ?, ?)
            `, [section_id, goal_description, indicator, percentage_completion, social_goal]);
                res.redirect('/metas');
            }
            catch (error) {
                console.error('Error creating meta:', error);
                res.render('metas', {
                    user,
                    metas: (yield app_1.db.query(`
                    SELECT m.*, s.name as section_name 
                    FROM metas m 
                    JOIN sections s ON m.section_id = s.id
                    WHERE is_active = 1
                `))[0],
                    sections: (yield app_1.db.query('SELECT id, name FROM sections WHERE is_active = 1'))[0],
                    search: req.query.search || '',
                    sort: req.query.sort || 'goal_description',
                    order: req.query.order || 'ASC',
                    error: 'Erro ao criar meta.'
                });
            }
        });
    }
    static updateMeta(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = req.session.user;
            if (!user) {
                return res.redirect('/');
            }
            const { id } = req.params;
            const { section_id, goal_description, indicator, percentage_completion, social_goal } = req.body;
            if (!section_id || !goal_description || !indicator || !percentage_completion || !social_goal) {
                return res.redirect('/metas?error=Todos+os+campos+são+obrigatórios');
            }
            try {
                yield app_1.db.query(`
                UPDATE metas 
                SET section_id = ?, goal_description = ?, indicator = ?, percentage_completion = ?, social_goal = ?
                WHERE id = ?
            `, [section_id, goal_description, indicator, percentage_completion, social_goal, id]);
                res.redirect('/metas');
            }
            catch (error) {
                console.error('Error updating meta:', error);
                res.redirect('/metas?error=Erro+ao+atualizar+meta');
            }
        });
    }
    static deleteMeta(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = req.session.user;
            if (!user) {
                return res.redirect('/');
            }
            const { id } = req.params;
            try {
                yield app_1.db.query('DELETE FROM metas WHERE id = ?', [id]);
                res.redirect('/metas');
            }
            catch (error) {
                console.error('Error deleting meta:', error);
                res.redirect('/metas?error=Erro+ao+excluir+meta');
            }
        });
    }
}
exports.MetaController = MetaController;
