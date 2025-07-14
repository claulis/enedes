import express, { Express, Request, Response } from 'express';
import session from 'express-session';
import mysql from 'mysql2/promise';
import path from 'path';
import { dbConfig } from './config/database';
import indexRouter from './routes/index';

const app: Express = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
const publicPath = path.join(__dirname, './public');
console.log('Serving static files from:', publicPath);
app.use(express.static(publicPath));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('view cache', false);

// Session configuration
app.use(session({
    secret: 'enedes-secret-key-2025',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 8 * 60 * 60 * 1000 } // 8 hours
}));

// Database connection
export const db = mysql.createPool(dbConfig);

// Routes
app.use('/', indexRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});