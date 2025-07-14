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
exports.ExecutionController = void 0;
const Execution_1 = require("../models/Execution");
const app_1 = require("../app");
// Helper function to format date to YYYY-MM-DD or return empty string for invalid/null dates
function formatDateForInput(date) {
    if (!date || date === '0000-00-00') {
        return ''; // Return empty string for invalid or null dates
    }
    if (typeof date === 'string') {
        // Validate if the string is a valid date
        const parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) {
            return '';
        }
        return parsedDate.toISOString().split('T')[0]; // Convert to YYYY-MM-DD
    }
    if (date instanceof Date && !isNaN(date.getTime())) {
        return date.toISOString().split('T')[0]; // Convert to YYYY-MM-DD
    }
    return '';
}
class ExecutionController {
    static getExecutions(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = req.session.user;
            if (!user) {
                return res.redirect('/');
            }
            try {
                const filter = { section_name: req.query.section_name };
                const executions = yield Execution_1.ExecutionModel.findAll(filter);
                // Format dates for each execution
                const formattedExecutions = executions.map(execution => (Object.assign(Object.assign({}, execution), { start_date: formatDateForInput(execution.start_date), end_date: formatDateForInput(execution.end_date) })));
                const [sections] = yield app_1.db.query('SELECT id, name FROM sections WHERE is_active = 1');
                res.render('executions', { executions: formattedExecutions, sections, user });
            }
            catch (error) {
                console.error('Error fetching executions:', error);
                res.status(500).send('Erro ao carregar execuções.');
            }
        });
    }
    static createExecution(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = req.session.user;
            if (!user) {
                return res.redirect('/');
            }
            try {
                const sectionId = parseInt(req.body.section_id);
                if (isNaN(sectionId) || sectionId <= 0) {
                    res.status(400).send('ID da seção inválido.');
                }
                // Fetch section_name from sections table
                const [sectionRows] = yield app_1.db.query('SELECT name FROM sections WHERE id = ? AND is_active = 1', [sectionId]);
                if (sectionRows.length === 0) {
                    res.status(400).send('Seção não encontrada ou inativa.');
                }
                const sectionName = sectionRows[0].name;
                // Validate and parse dates
                const startDate = req.body.start_date ? new Date(req.body.start_date) : null;
                const endDate = req.body.end_date ? new Date(req.body.end_date) : null;
                // Check if dates are valid
                if (startDate && isNaN(startDate.getTime())) {
                    res.status(400).send('Data de início inválida.');
                }
                if (endDate && isNaN(endDate.getTime())) {
                    res.status(400).send('Data de fim inválida.');
                }
                const execution = {
                    section_id: sectionId,
                    section_name: sectionName,
                    start_date: startDate,
                    end_date: endDate,
                    executed: parseFloat(req.body.executed) || 0,
                    total_budget: parseFloat(req.body.total_budget) || 0,
                };
                yield Execution_1.ExecutionModel.create(execution);
                res.redirect('/executions');
            }
            catch (error) {
                console.error('Error creating execution:', error);
                res.status(500).send('Erro ao criar execução.');
            }
        });
    }
    static updateExecution(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = req.session.user;
            if (!user) {
                return res.redirect('/');
            }
            try {
                const id = parseInt(req.params.id);
                if (isNaN(id) || id <= 0) {
                    res.status(400).send('ID da execução inválido.');
                }
                const sectionId = parseInt(req.body.section_id);
                if (isNaN(sectionId) || sectionId <= 0) {
                    res.status(400).send('ID da seção inválido.');
                }
                // Fetch section_name from sections table
                const [sectionRows] = yield app_1.db.query('SELECT name FROM sections WHERE id = ? AND is_active = 1', [sectionId]);
                if (sectionRows.length === 0) {
                    res.status(400).send('Seção não encontrada ou inativa.');
                }
                const sectionName = sectionRows[0].name;
                // Validate and parse dates
                const startDate = req.body.start_date || null;
                const endDate = req.body.end_date || null;
                if (endDate < startDate) {
                    throw new Error("Intervalo de datas inválido");
                }
                const execution = {
                    section_id: sectionId,
                    section_name: sectionName,
                    start_date: startDate,
                    end_date: endDate,
                    executed: parseFloat(req.body.executed) || 0,
                    total_budget: parseFloat(req.body.total_budget) || 0,
                };
                yield Execution_1.ExecutionModel.update(id, execution);
                res.redirect('/executions');
            }
            catch (error) {
                console.error('Error updating execution:', error);
                res.status(500).send('Erro ao atualizar a  execução.');
            }
        });
    }
    static deleteExecution(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = req.session.user;
            if (!user) {
                return res.redirect('/');
            }
            try {
                const id = parseInt(req.params.id);
                if (isNaN(id) || id <= 0) {
                    res.status(400).send('ID da execução inválido.');
                }
                yield Execution_1.ExecutionModel.delete(id);
                res.redirect('/executions');
            }
            catch (error) {
                console.error('Error deleting execution:', error);
                res.status(500).send('Erro ao excluir execução.');
            }
        });
    }
}
exports.ExecutionController = ExecutionController;
