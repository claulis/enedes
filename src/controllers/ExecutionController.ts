import { Request, Response } from 'express';
import { ExecutionModel, Execution } from '../models/Execution';
import { db } from '../app';
import { User } from '../models/Users';
import { RowDataPacket } from 'mysql2/promise';
import { parse } from 'path';

// Helper function to format date to YYYY-MM-DD or return empty string for invalid/null dates
function formatDateForInput(date: Date | string | null | undefined): string {
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

export class ExecutionController {
    static async getExecutions(req: Request, res: Response): Promise<void> {
        const user: User | undefined = req.session.user;
        if (!user) {
            return res.redirect('/');
        }
        try {
            const filter = { section_name: req.query.section_name as string };
            const executions = await ExecutionModel.findAll(filter);
            // Format dates for each execution
            const formattedExecutions = executions.map(execution => ({
                ...execution,
                start_date: formatDateForInput(execution.start_date),
                end_date: formatDateForInput(execution.end_date),
            }));
            const [sections] = await db.query('SELECT id, name FROM sections WHERE is_active = 1');
            res.render('executions', { executions: formattedExecutions, sections, user });
        } catch (error) {
            console.error('Error fetching executions:', error);
            res.status(500).send('Erro ao carregar execuções.');
        }
    }

    static async createExecution(req: Request, res: Response): Promise<void> {
        const user: User | undefined = req.session.user;
        if (!user) {
            return res.redirect('/');
        }
        try {
            const sectionId = parseInt(req.body.section_id);
            if (isNaN(sectionId) || sectionId <= 0) {
                 res.status(400).send('ID da seção inválido.');
            }

            // Fetch section_name from sections table
            const [sectionRows] = await db.query<RowDataPacket[]>('SELECT name FROM sections WHERE id = ? AND is_active = 1', [sectionId]);
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

            const execution: Execution = {
                section_id: sectionId,
                section_name: sectionName,
                start_date: startDate,
                end_date: endDate,
                executed: parseFloat(req.body.executed) || 0,
                total_budget: parseFloat(req.body.total_budget) || 0,
            };
            await ExecutionModel.create(execution);
            res.redirect('/executions');
        } catch (error) {
            console.error('Error creating execution:', error);
            res.status(500).send('Erro ao criar execução.');
        }
    }

    static async updateExecution(req: Request, res: Response): Promise<void> {
        const user: User | undefined = req.session.user;
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
            const [sectionRows] = await db.query<RowDataPacket[]>('SELECT name FROM sections WHERE id = ? AND is_active = 1', [sectionId]);
            if (sectionRows.length === 0) {
                 res.status(400).send('Seção não encontrada ou inativa.');
            }
            const sectionName = sectionRows[0].name;

            // Validate and parse dates
            const startDate = req.body.start_date || null;
            const endDate = req.body.end_date || null;
            if (endDate<startDate){
                throw new Error("Intervalo de datas inválido")
            }
           

            const execution: Partial<Execution> = {
                section_id: sectionId,
                section_name: sectionName,
                start_date:startDate,
                end_date: endDate,
                executed: parseFloat(req.body.executed) || 0,
                total_budget: parseFloat(req.body.total_budget) || 0,
            };
            await ExecutionModel.update(id, execution);
            res.redirect('/executions');
        } catch (error) {
        
            console.error('Error updating execution:', error);
            res.status(500).send('Erro ao atualizar a  execução.');
        }
    }

    static async deleteExecution(req: Request, res: Response): Promise<void> {
        const user: User | undefined = req.session.user;
        if (!user) {
            return res.redirect('/');
        }
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id) || id <= 0) {
                res.status(400).send('ID da execução inválido.');
            }
            await ExecutionModel.delete(id);
            res.redirect('/executions');
        } catch (error) {
            console.error('Error deleting execution:', error);
            res.status(500).send('Erro ao excluir execução.');
        }
   }

   
}