import { db } from '../app';

export interface ActionAttachment {
    id: number;
    action_id: number;
    filename: string;
    original_name: string;
    file_size: number | null;
    mime_type: string | null;
    file_path: string | null;
    uploaded_by: number | null;
    created_at: Date;
}

export class ActionAttachmentModel {
    static async create(attachment: Partial<ActionAttachment>): Promise<number> {
        const [result] = await db.query(
            'INSERT INTO action_attachments (action_id, filename, original_name, file_size, mime_type, file_path, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
                attachment.action_id,
                attachment.filename,
                attachment.original_name,
                attachment.file_size,
                attachment.mime_type,
                attachment.file_path,
                attachment.uploaded_by
            ]
        );
        return (result as any).insertId;
    }

    static async findByActionId(actionId: number): Promise<ActionAttachment[]> {
        const [rows] = await db.query('SELECT * FROM action_attachments WHERE action_id = ?', [actionId]);
        return rows as ActionAttachment[];
    }

    static async findById(id: number): Promise<ActionAttachment | null> {
        const [rows] = await db.query('SELECT * FROM action_attachments WHERE id = ?', [id]);
        return (rows as ActionAttachment[])[0] || null;
    }

    static async delete(id: number): Promise<void> {
        const attachment = await this.findById(id);
        if (attachment && attachment.file_path) {
            const fs = require('fs');
            if (fs.existsSync(attachment.file_path)) {
                fs.unlinkSync(attachment.file_path);
            }
        }
        await db.query('DELETE FROM action_attachments WHERE id = ?', [id]);
    }
}