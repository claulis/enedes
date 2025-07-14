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
exports.FollowUpController = void 0;
const FollowUps_1 = require("../models/FollowUps");
const FolloUpAttachments_1 = require("../models/FolloUpAttachments");
const Actions_1 = require("../models/Actions");
const Collaborators_1 = require("../models/Collaborators");
const filestorage_1 = require("../config/filestorage");
const app_1 = require("../app");
class FollowUpController {
    static getFollowUps(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const user = req.session.user;
            if (!user) {
                return res.redirect('/');
            }
            const { action_id, assigned_to, search = '', sort = 'created_at', order = 'DESC', page = '1' } = req.query;
            const pageSize = 10;
            const offset = (parseInt(page) - 1) * pageSize;
            const validSortColumns = ['id', 'title', 'status', 'priority', 'start_date', 'end_date', 'created_at', 'action_name', 'collaborator_name'];
            const sortColumn = validSortColumns.includes(sort) ? sort : 'created_at';
            const sortOrder = order === 'ASC' ? 'ASC' : 'DESC';
            const searchTerm = `%${search}%`;
            try {
                // Fetch actions and collaborators for filter dropdowns
                const [actions] = yield app_1.db.query('SELECT id, task AS name FROM actions WHERE status != "concluida"');
                const [collaborators] = yield app_1.db.query('SELECT id, name FROM collaborators WHERE is_active = 1');
                // Build query with filters
                let query = `
                SELECT * FROM follow_ups_detailed2
                WHERE title LIKE ? OR description LIKE ?
            `;
                const queryParams = [searchTerm, searchTerm];
                if (action_id && !isNaN(parseInt(action_id))) {
                    query += ' AND action_id = ?';
                    queryParams.push(parseInt(action_id));
                }
                if (assigned_to && !isNaN(parseInt(assigned_to))) {
                    query += ' AND assigned_to = ?';
                    queryParams.push(parseInt(assigned_to));
                }
                // Apply user role/section restrictions
                if (user.role !== 'general_coordinator' && user.role !== 'project_coordinator') {
                    const [userSections] = yield app_1.db.query('SELECT section_id FROM user_sections WHERE user_id = ?', [user.id]);
                    const sectionIds = userSections.map((s) => s.section_id);
                    if (sectionIds.length > 0) {
                        query += ` AND section_id IN (${sectionIds.map(() => '?').join(',')})`;
                        queryParams.push(...sectionIds);
                    }
                    else {
                        query += ' AND 1=0'; // No access if no sections assigned
                    }
                }
                query += ` ORDER BY ${sortColumn} ${sortOrder} LIMIT ? OFFSET ?`;
                queryParams.push(pageSize, offset);
                // Fetch follow-ups
                const [followUps] = yield app_1.db.query(query, queryParams);
                // Get total count for pagination
                let countQuery = 'SELECT COUNT(*) as total FROM follow_ups_detailed2 WHERE title LIKE ? OR description LIKE ?';
                const countParams = [searchTerm, searchTerm];
                if (action_id && !isNaN(parseInt(action_id))) {
                    countQuery += ' AND action_id = ?';
                    countParams.push(parseInt(action_id));
                }
                if (assigned_to && !isNaN(parseInt(assigned_to))) {
                    countQuery += ' AND assigned_to = ?';
                    countParams.push(parseInt(assigned_to));
                }
                if (user.role !== 'general_coordinator' && user.role !== 'project_coordinator') {
                    const [userSections] = yield app_1.db.query('SELECT section_id FROM user_sections WHERE user_id = ?', [user.id]);
                    const sectionIds = userSections.map((s) => s.section_id);
                    if (sectionIds.length > 0) {
                        countQuery += ` AND section_id IN (${sectionIds.map(() => '?').join(',')})`;
                        countParams.push(...sectionIds);
                    }
                    else {
                        countQuery += ' AND 1=0';
                    }
                }
                const [countResult] = yield app_1.db.query(countQuery, countParams);
                const totalItems = ((_a = countResult[0]) === null || _a === void 0 ? void 0 : _a.total) || 0;
                const totalPages = Math.ceil(totalItems / pageSize);
                res.render('follow-ups', {
                    user,
                    followUps,
                    actions,
                    collaborators,
                    action_id: action_id || '',
                    assigned_to: assigned_to || '',
                    search,
                    sort,
                    order,
                    page: parseInt(page) || 1,
                    totalPages,
                    totalItems,
                    error: null
                });
            }
            catch (error) {
                console.error('Error fetching follow-ups:', error);
                res.render('follow-ups', {
                    user,
                    followUps: [],
                    actions: [],
                    collaborators: [],
                    action_id: action_id || '',
                    assigned_to: assigned_to || '',
                    search,
                    sort,
                    order,
                    page: 1,
                    totalPages: 1,
                    totalItems: 0,
                    error: 'Erro ao carregar follow-ups. Verifique a conexão com o banco de dados ou os filtros aplicados.'
                });
            }
        });
    }
    static getNewFollowUp(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = req.session.user;
            if (!user) {
                return res.redirect('/');
            }
            const actionId = parseInt(req.params.actionId);
            if (isNaN(actionId)) {
                return res.render('follow-up-form', { user, action: null, collaborators: [], error: 'ID da ação inválido.' });
            }
            try {
                const action = yield Actions_1.ActionModel.findById(actionId);
                if (!action || (user.role !== 'general_coordinator' && user.role !== 'project_coordinator' && !user.sections.includes(action.section_name))) {
                    return res.render('follow-up-form', { user, action: null, collaborators: [], error: 'Acesso não autorizado ou ação não encontrada.' });
                }
                const collaborators = yield Collaborators_1.CollaboratorModel.findAll();
                res.render('follow-up-form', { user, action, collaborators, followUp: null, attachments: [], error: null });
            }
            catch (error) {
                console.error('Error fetching new follow-up form:', error);
                res.render('follow-up-form', { user, action: null, collaborators: [], attachments: [], error: 'Erro ao carregar formulário.' });
            }
        });
    }
    static createFollowUp(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = req.session.user;
            if (!user) {
                return res.redirect('/');
            }
            filestorage_1.upload.array('attachments')(req, res, (err) => __awaiter(this, void 0, void 0, function* () {
                if (err) {
                    console.error('Error uploading files:', err.message);
                    const actionId = parseInt(req.body.action_id);
                    const action = isNaN(actionId) ? null : yield Actions_1.ActionModel.findById(actionId);
                    const collaborators = yield Collaborators_1.CollaboratorModel.findAll();
                    return res.render('follow-up-form', {
                        user,
                        action,
                        collaborators,
                        followUp: null,
                        attachments: [],
                        error: err.message.includes('Tipo de arquivo não permitido')
                            ? err.message
                            : 'Erro ao fazer upload dos arquivos. Verifique os formatos e tente novamente.'
                    });
                }
                const { action_id, assigned_to, title, description, next_steps, obstacles, comments, priority, status, start_date, end_date, new_deadline } = req.body;
                try {
                    if (!action_id || !title || !description || !assigned_to || !end_date) {
                        throw new Error('Campos obrigatórios não preenchidos.');
                    }
                    const actionId = parseInt(action_id);
                    const assignedToId = parseInt(assigned_to);
                    if (isNaN(actionId) || isNaN(assignedToId)) {
                        throw new Error('ID da ação ou colaborador inválido.');
                    }
                    const followUp = {
                        action_id: actionId,
                        assigned_to: assignedToId,
                        created_by: user.id,
                        title,
                        description,
                        next_steps: next_steps || null,
                        obstacles: obstacles || null,
                        comments: comments || null,
                        priority: priority || 'medium',
                        status: status || 'pending',
                        start_date: start_date ? new Date(start_date) : null,
                        end_date: new Date(end_date),
                        new_deadline: new_deadline ? new Date(new_deadline) : null
                    };
                    const followUpId = yield FollowUps_1.FollowUpModel.create(followUp);
                    if (req.files && Array.isArray(req.files)) {
                        for (const file of req.files) {
                            yield FolloUpAttachments_1.FollowUpAttachmentModel.create({
                                follow_up_id: followUpId,
                                filename: file.filename,
                                original_name: file.originalname,
                                file_size: file.size,
                                mime_type: file.mimetype,
                                file_path: file.path,
                                uploaded_by: user.id
                            });
                        }
                    }
                    res.redirect(`/action/edit/${action_id}`);
                }
                catch (error) {
                    console.error('Error creating follow-up:', error.message);
                    const actionId = parseInt(action_id);
                    const action = isNaN(actionId) ? null : yield Actions_1.ActionModel.findById(actionId);
                    const collaborators = yield Collaborators_1.CollaboratorModel.findAll();
                    res.render('follow-up-form', {
                        user,
                        action,
                        collaborators,
                        followUp: null,
                        attachments: [],
                        error: error.message || 'Erro ao criar follow-up. Verifique os dados e tente novamente.'
                    });
                }
            }));
        });
    }
    static getEditFollowUp(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = req.session.user;
            if (!user) {
                return res.redirect('/');
            }
            const followUpId = parseInt(req.params.id);
            if (isNaN(followUpId)) {
                return res.render('follow-up-form', { user, action: null, collaborators: [], followUp: null, attachments: [], error: 'ID do follow-up inválido.' });
            }
            try {
                const followUp = yield FollowUps_1.FollowUpModel.findById(followUpId);
                if (!followUp) {
                    return res.render('follow-up-form', { user, action: null, collaborators: [], followUp: null, attachments: [], error: 'Follow-up não encontrado.' });
                }
                const action = yield Actions_1.ActionModel.findById(followUp.action_id);
                if (!action) {
                    return res.render('follow-up-form', { user, action: null, collaborators: [], followUp, attachments: [], error: 'Ação associada não encontrada.' });
                }
                const collaborators = yield Collaborators_1.CollaboratorModel.findAll();
                const attachments = yield FolloUpAttachments_1.FollowUpAttachmentModel.findByFollowUpId(followUpId);
                res.render('follow-up-form', { user, action, collaborators, followUp, attachments, error: null });
            }
            catch (error) {
                console.error('Error fetching follow-up for edit:', error);
                res.render('follow-up-form', { user, action: null, collaborators: [], followUp: null, attachments: [], error: 'Erro ao carregar follow-up.' });
            }
        });
    }
    static updateFollowUp(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = req.session.user;
            if (!user) {
                return res.redirect('/');
            }
            filestorage_1.upload.array('attachments')(req, res, (err) => __awaiter(this, void 0, void 0, function* () {
                if (err) {
                    console.error('Error uploading files:', err.message);
                    const followUpId = parseInt(req.params.id);
                    const followUp = isNaN(followUpId) ? null : yield FollowUps_1.FollowUpModel.findById(followUpId);
                    const action = followUp ? yield Actions_1.ActionModel.findById(followUp.action_id) : null;
                    const collaborators = yield Collaborators_1.CollaboratorModel.findAll();
                    const attachments = followUp ? yield FolloUpAttachments_1.FollowUpAttachmentModel.findByFollowUpId(followUpId) : [];
                    return res.render('follow-up-form', {
                        user,
                        action,
                        collaborators,
                        followUp,
                        attachments,
                        error: err.message.includes('Tipo de arquivo não permitido')
                            ? err.message
                            : 'Erro ao fazer upload dos arquivos. Verifique os formatos e tente novamente.'
                    });
                }
                const followUpId = parseInt(req.params.id);
                const { action_id, assigned_to, title, description, next_steps, obstacles, comments, priority, status, start_date, end_date, new_deadline } = req.body;
                try {
                    if (!action_id || !title || !description || !assigned_to || !end_date) {
                        throw new Error('Campos obrigatórios não preenchidos.');
                    }
                    const actionId = parseInt(action_id);
                    const assignedToId = parseInt(assigned_to);
                    if (isNaN(actionId) || isNaN(assignedToId)) {
                        throw new Error('ID da ação ou colaborador inválido.');
                    }
                    const followUp = {
                        action_id: actionId,
                        assigned_to: assignedToId,
                        title,
                        description,
                        next_steps: next_steps || null,
                        obstacles: obstacles || null,
                        comments: comments || null,
                        priority: priority || 'medium',
                        status: status || 'pending',
                        start_date: start_date ? new Date(start_date) : null,
                        end_date: new Date(end_date),
                        new_deadline: new_deadline ? new Date(new_deadline) : null
                    };
                    yield FollowUps_1.FollowUpModel.update(followUpId, followUp);
                    if (req.files && Array.isArray(req.files)) {
                        for (const file of req.files) {
                            yield FolloUpAttachments_1.FollowUpAttachmentModel.create({
                                follow_up_id: followUpId,
                                filename: file.filename,
                                original_name: file.originalname,
                                file_size: file.size,
                                mime_type: file.mimetype,
                                file_path: file.path,
                                uploaded_by: user.id
                            });
                        }
                    }
                    res.redirect(`/action/edit/${action_id}`);
                }
                catch (error) {
                    console.error('Error updating follow-up:', error.message);
                    const followUp = yield FollowUps_1.FollowUpModel.findById(followUpId);
                    const action = followUp ? yield Actions_1.ActionModel.findById(followUp.action_id) : null;
                    const collaborators = yield Collaborators_1.CollaboratorModel.findAll();
                    const attachments = yield FolloUpAttachments_1.FollowUpAttachmentModel.findByFollowUpId(followUpId);
                    res.render('follow-up-form', {
                        user,
                        action,
                        collaborators,
                        followUp,
                        attachments,
                        error: error.message || 'Erro ao atualizar follow-up. Verifique os dados e tente novamente.'
                    });
                }
            }));
        });
    }
    static deleteFollowUp(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = req.session.user;
            if (!user) {
                return res.redirect('/');
            }
            const followUpId = parseInt(req.params.id);
            if (isNaN(followUpId)) {
                return res.redirect('/dashboard');
            }
            try {
                const followUp = yield FollowUps_1.FollowUpModel.findById(followUpId);
                if (!followUp) {
                    return res.redirect('/dashboard');
                }
                const attachments = yield FolloUpAttachments_1.FollowUpAttachmentModel.findByFollowUpId(followUpId);
                for (const attachment of attachments) {
                    yield FolloUpAttachments_1.FollowUpAttachmentModel.delete(attachment.id);
                }
                yield FollowUps_1.FollowUpModel.delete(followUpId);
                res.redirect(`/action/edit/${followUp.action_id}`);
            }
            catch (error) {
                console.error('Error deleting follow-up:', error);
                res.redirect('/dashboard');
            }
        });
    }
    static getFollowUp(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = req.session.user;
            if (!user) {
                return res.redirect('/');
            }
            const followUpId = parseInt(req.params.id);
            if (isNaN(followUpId)) {
                return res.render('follow-up-view', { user, followUp: null, action: null, collaborator: null, attachments: [], error: 'ID do follow-up inválido.' });
            }
            try {
                const followUp = yield FollowUps_1.FollowUpModel.findById(followUpId);
                if (!followUp) {
                    return res.render('follow-up-view', { user, followUp: null, action: null, collaborator: null, attachments: [], error: 'Follow-up não encontrado.' });
                }
                const action = yield Actions_1.ActionModel.findById(followUp.action_id);
                const collaborator = yield Collaborators_1.CollaboratorModel.findById(followUp.assigned_to);
                const attachments = yield FolloUpAttachments_1.FollowUpAttachmentModel.findByFollowUpId(followUpId);
                res.render('follow-up-view', { user, followUp, action, collaborator, attachments, error: null });
            }
            catch (error) {
                console.error('Error fetching follow-up:', error);
                res.render('follow-up-view', { user, followUp: null, action: null, collaborator: null, attachments: [], error: 'Erro ao carregar follow-up.' });
            }
        });
    }
}
exports.FollowUpController = FollowUpController;
