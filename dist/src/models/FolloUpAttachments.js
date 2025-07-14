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
exports.FollowUpAttachmentModel = void 0;
const app_1 = require("../app");
class FollowUpAttachmentModel {
    static create(attachment) {
        return __awaiter(this, void 0, void 0, function* () {
            const [result] = yield app_1.db.query('INSERT INTO follow_up_attachments (follow_up_id, filename, original_name, file_size, mime_type, file_path, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?)', [
                attachment.follow_up_id,
                attachment.filename,
                attachment.original_name,
                attachment.file_size,
                attachment.mime_type,
                attachment.file_path,
                attachment.uploaded_by
            ]);
            return result.insertId;
        });
    }
    static findByFollowUpId(followUpId) {
        return __awaiter(this, void 0, void 0, function* () {
            const [rows] = yield app_1.db.query('SELECT * FROM follow_up_attachments WHERE follow_up_id = ?', [followUpId]);
            return rows;
        });
    }
    static findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const [rows] = yield app_1.db.query('SELECT * FROM follow_up_attachments WHERE id = ?', [id]);
            return rows[0] || null;
        });
    }
    static delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const attachment = yield this.findById(id);
            if (attachment && attachment.file_path) {
                const fs = require('fs');
                if (fs.existsSync(attachment.file_path)) {
                    fs.unlinkSync(attachment.file_path);
                }
            }
            yield app_1.db.query('DELETE FROM follow_up_attachments WHERE id = ?', [id]);
        });
    }
}
exports.FollowUpAttachmentModel = FollowUpAttachmentModel;
