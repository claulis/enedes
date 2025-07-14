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
exports.UserModel = void 0;
const app_1 = require("../app");
const bcrypt_1 = __importDefault(require("bcrypt"));
class UserModel {
    static findByUsername(username) {
        return __awaiter(this, void 0, void 0, function* () {
            const [rows] = yield app_1.db.query(`SELECT u.*, GROUP_CONCAT(s.name) as section_names
             FROM users u
             LEFT JOIN user_sections us ON u.id = us.user_id
             LEFT JOIN sections s ON us.section_id = s.id
             WHERE u.username = ? AND u.is_active = 1
             GROUP BY u.id`, [username]);
            if (!rows[0])
                return null;
            const user = rows[0];
            return {
                id: user.id,
                username: user.username,
                name: user.name,
                password: user.password,
                email: user.email,
                phone: user.phone,
                department: user.department,
                role: user.role,
                sections: user.section_names ? user.section_names.split(',') : [],
                is_active: !!user.is_active,
                needs_password_change: !!user.needs_password_change,
                last_login: user.last_login ? new Date(user.last_login) : null,
                created_at: new Date(user.created_at),
                updated_at: new Date(user.updated_at)
            };
        });
    }
    static findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const [rows] = yield app_1.db.query(`SELECT u.*, GROUP_CONCAT(s.name) as section_names
             FROM users u
             LEFT JOIN user_sections us ON u.id = us.user_id
             LEFT JOIN sections s ON us.section_id = s.id
             WHERE u.id = ? AND u.is_active = 1
             GROUP BY u.id`, [id]);
            if (!rows[0])
                return null;
            const user = rows[0];
            return {
                id: user.id,
                username: user.username,
                name: user.name,
                password: user.password,
                email: user.email,
                phone: user.phone,
                department: user.department,
                role: user.role,
                sections: user.section_names ? user.section_names.split(',') : [],
                is_active: !!user.is_active,
                needs_password_change: !!user.needs_password_change,
                last_login: user.last_login ? new Date(user.last_login) : null,
                created_at: new Date(user.created_at),
                updated_at: new Date(user.updated_at)
            };
        });
    }
    static create(user) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e;
            if (!user.password) {
                throw new Error('Senha é obrigatória para criar um usuário.');
            }
            const hashedPassword = yield bcrypt_1.default.hash(user.password, 10);
            const [result] = yield app_1.db.query('INSERT INTO users (username, name, email, password, phone, department, role, is_active, needs_password_change) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [
                user.username,
                user.name,
                user.email,
                hashedPassword,
                (_a = user.phone) !== null && _a !== void 0 ? _a : null,
                (_b = user.department) !== null && _b !== void 0 ? _b : null,
                (_c = user.role) !== null && _c !== void 0 ? _c : 'department_coordinator',
                (_d = user.is_active) !== null && _d !== void 0 ? _d : true,
                (_e = user.needs_password_change) !== null && _e !== void 0 ? _e : true
            ]);
            const userId = result.insertId;
            // Insert sections if provided
            if (user.sections && user.sections.length > 0) {
                for (const sectionName of user.sections) {
                    const [section] = yield app_1.db.query('SELECT id FROM sections WHERE name = ?', [sectionName]);
                    if (section[0]) {
                        yield app_1.db.query('INSERT INTO user_sections (user_id, section_id) VALUES (?, ?)', [userId, section[0].id]);
                    }
                }
            }
            return userId;
        });
    }
    static update(id, user) {
        return __awaiter(this, void 0, void 0, function* () {
            const fields = [];
            const values = [];
            if (user.username) {
                fields.push('username = ?');
                values.push(user.username);
            }
            if (user.name) {
                fields.push('name = ?');
                values.push(user.name);
            }
            if (user.email) {
                fields.push('email = ?');
                values.push(user.email);
            }
            if (user.password) {
                fields.push('password = ?');
                values.push(yield bcrypt_1.default.hash(user.password, 10));
            }
            if (user.phone !== undefined) {
                fields.push('phone = ?');
                values.push(user.phone);
            }
            if (user.department !== undefined) {
                fields.push('department = ?');
                values.push(user.department);
            }
            if (user.role) {
                fields.push('role = ?');
                values.push(user.role);
            }
            if (user.is_active !== undefined) {
                fields.push('is_active = ?');
                values.push(user.is_active);
            }
            if (user.needs_password_change !== undefined) {
                fields.push('needs_password_change = ?');
                values.push(user.needs_password_change);
            }
            values.push(id);
            if (fields.length > 0) {
                yield app_1.db.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
            }
            // Update sections if provided
            if (user.sections) {
                yield app_1.db.query('DELETE FROM user_sections WHERE user_id = ?', [id]);
                for (const sectionName of user.sections) {
                    const [section] = yield app_1.db.query('SELECT id FROM sections WHERE name = ?', [sectionName]);
                    if (section[0]) {
                        yield app_1.db.query('INSERT INTO user_sections (user_id, section_id) VALUES (?, ?)', [id, section[0].id]);
                    }
                }
            }
        });
    }
}
exports.UserModel = UserModel;
