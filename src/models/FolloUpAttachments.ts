import { db } from '../app';

export interface FollowUpAttachment {
    id: number;
    follow_up_id: number;
    filename: string;
    original_name: string;
    file_size: number | null;
    mime_type: string | null;
    file_path: string | null;
    uploaded_by: number | null;
    created_at: Date;
}

export class FollowUpAttachmentModel {
    static async create(attachment: Partial<FollowUpAttachment>): Promise<number> {
        const [result] = await db.query(
            'INSERT INTO follow_up_attachments (follow_up_id, filename, original_name, file_size, mime_type, file_path, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
                attachment.follow_up_id,
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

    static async findByFollowUpId(followUpId: number): Promise<FollowUpAttachment[]> {
        const [rows] = await db.query('SELECT * FROM follow_up_attachments WHERE follow_up_id = ?', [followUpId]);
        return rows as FollowUpAttachment[];
    }

    static async findById(id: number): Promise<FollowUpAttachment | null> {
        const [rows] = await db.query('SELECT * FROM follow_up_attachments WHERE id = ?', [id]);
        return (rows as FollowUpAttachment[])[0] || null;
    }

    static async delete(id: number): Promise<void> {
        const attachment = await this.findById(id);
        if (attachment && attachment.file_path) {
            const fs = require('fs');
            if (fs.existsSync(attachment.file_path)) {
                fs.unlinkSync(attachment.file_path);
            }
        }
        await db.query('DELETE FROM follow_up_attachments WHERE id = ?', [id]);
    }
}