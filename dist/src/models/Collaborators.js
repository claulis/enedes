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
exports.CollaboratorModel = void 0;
const app_1 = require("../app");
class CollaboratorModel {
    static findAll() {
        return __awaiter(this, void 0, void 0, function* () {
            const [rows] = yield app_1.db.query('SELECT * FROM collaborators');
            return rows.map(row => (Object.assign(Object.assign({}, row), { skills: row.skills ? JSON.parse(row.skills) : null })));
        });
    }
    static findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const [rows] = yield app_1.db.query('SELECT * FROM collaborators WHERE id = ?', [id]);
            const collaborator = rows[0];
            if (collaborator && collaborator.skills) {
                collaborator.skills = JSON.parse(collaborator.skills);
            }
            return collaborator || null;
        });
    }
}
exports.CollaboratorModel = CollaboratorModel;
