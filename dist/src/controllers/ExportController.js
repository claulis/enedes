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
exports.ExportController = void 0;
const puppeteer_1 = __importDefault(require("puppeteer"));
class ExportController {
    static generatePDF(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = req.session.user;
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
                const browser = yield puppeteer_1.default.launch({ headless: true });
                const page = yield browser.newPage();
                // Passar o cookie de sessão para autenticar a página
                const sessionCookie = {
                    name: 'connect.sid',
                    value: req.sessionID,
                    domain: 'localhost',
                    path: '/',
                    httpOnly: true,
                    secure: false,
                };
                yield page.setCookie(sessionCookie);
                // Navegar até a URL do dashboard
                yield page.goto(url, { waitUntil: 'networkidle0' });
                // Aguardar elementos dinâmicos do dashboard
                yield page.waitForSelector('.dashboard-container', { timeout: 10000 });
                // Aplicar media query de impressão para otimizar o layout
                yield page.emulateMediaType('print');
                // Gerar o PDF
                const pdfBuffer = yield page.pdf({
                    format: 'A4',
                    printBackground: true,
                    margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
                });
                yield browser.close();
                // Configurar o response para download
                res.set({
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': 'attachment; filename="dashboard.pdf"',
                    'Content-Length': pdfBuffer.length.toString(),
                });
                res.send(pdfBuffer);
            }
            catch (error) {
                console.error('Erro ao gerar PDF:', error);
                res.status(500).send('Erro ao gerar o PDF');
            }
        });
    }
}
exports.ExportController = ExportController;
