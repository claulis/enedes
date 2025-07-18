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
exports.MetaModel = void 0;
const app_1 = require("../app");
class MetaModel {
    static findAll() {
        return __awaiter(this, void 0, void 0, function* () {
            const [rows] = yield app_1.db.query(`
            SELECT m.*, s.name as section_name 
            FROM metas m 
            JOIN sections s ON m.section_id = s.id
        `);
            return rows;
        });
    }
    static findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const [rows] = yield app_1.db.query(`
            SELECT m.*, s.name as section_name 
            FROM metas m 
            JOIN sections s ON m.section_id = s.id 
            WHERE m.id = ?
        `, [id]);
            return rows[0] || null;
        });
    }
}
exports.MetaModel = MetaModel;
