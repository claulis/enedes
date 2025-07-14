import { Request, Response } from 'express';
import puppeteer from 'puppeteer';
import { User } from '../models/Users';

export class ExportController {
    static async generatePDF(req: Request, res: Response): Promise<void> {
        const user: User | undefined = req.session.user;
        if (!user) {
            res.status(401).send('Usuário não autenticado');
            return;
        }

        try {
            const { url } = req.body;
            if (!url) {
                res.status(400).send('URL não fornecida');
                return;
            }

            const browser = await puppeteer.launch({ headless: true });
            const page = await browser.newPage();

            // Passar o cookie de sessão para autenticar a página
            const sessionCookie = {
                name: 'connect.sid',
                value: req.sessionID,
                domain: 'localhost',
                path: '/',
                httpOnly: true,
                secure: false,
            };
            await page.setCookie(sessionCookie);

            // Navegar até a URL do dashboard
            await page.goto(url, { waitUntil: 'networkidle0' });

            // Aguardar elementos dinâmicos do dashboard
            await page.waitForSelector('.dashboard-container', { timeout: 10000 });

            // Aplicar media query de impressão para otimizar o layout
            await page.emulateMediaType('print');

            // Gerar o PDF
            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
            });

            await browser.close();

            // Configurar o response para download
            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename="dashboard.pdf"',
                'Content-Length': pdfBuffer.length.toString(),
            });

            res.send(pdfBuffer);
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            res.status(500).send('Erro ao gerar o PDF');
        }
    }
}