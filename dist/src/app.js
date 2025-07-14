"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const express_1 = __importDefault(require("express"));
const express_session_1 = __importDefault(require("express-session"));
const promise_1 = __importDefault(require("mysql2/promise"));
const path_1 = __importDefault(require("path"));
const database_1 = require("./config/database");
const index_1 = __importDefault(require("./routes/index"));
const app = (0, express_1.default)();
// Middleware
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.json());
const publicPath = path_1.default.join(__dirname, './public');
console.log('Serving static files from:', publicPath);
app.use(express_1.default.static(publicPath));
app.set('view engine', 'ejs');
app.set('views', path_1.default.join(__dirname, 'views'));
app.set('view cache', false);
// Session configuration
app.use((0, express_session_1.default)({
    secret: 'enedes-secret-key-2025',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 8 * 60 * 60 * 1000 } // 8 hours
}));
// Database connection
exports.db = promise_1.default.createPool(database_1.dbConfig);
// Routes
app.use('/', index_1.default);
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
