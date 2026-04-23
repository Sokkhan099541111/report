import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import connection from '../database/db.mjs';
import authMiddleware from '../middleware/auth.mjs';
import roleMiddleware from '../middleware/roles.mjs';

const router = express.Router();

// Register Route
router.post('/register', async (req, res) => {
    const { username, password, role } = req.body;

    try {
        const [existingUser] = await connection.query('SELECT * FROM users WHERE username = ?', [username]);

        if (existingUser.length > 0) {
            return res.status(400).json({ message: 'User already registered.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await connection.query('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, hashedPassword, role]);
        res.status(201).json({ message: 'User registered successfully.' });
    } catch (err) {
        console.error('Error during registration:', err.message);
        res.status(500).json({ message: 'Server error during registration.' });
    }
});

// Login Route
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const [userResult] = await connection.query('SELECT * FROM users WHERE username = ?', [username]);

        if (userResult.length === 0) {
            return res.status(400).json({ message: 'Invalid username or password.' });
        }

        const user = userResult[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid username or password.' });
        }

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'sokkhan', { expiresIn: '1h' });
        res.json({ token, role: user.role });
    } catch (err) {
        console.error('Error during login:', err.message);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

// Retrieve User Data Route
router.get('/users', authMiddleware, async (req, res) => {
    try {
        const [users] = await connection.query('SELECT id, username, role FROM users');
        res.json(users);
    } catch (err) {
        console.error('Error retrieving users:', err.message);
        res.status(500).json({ message: 'Server error while retrieving users.' });
    }
});
router.get('/test', async (req, res) => {
    try {
        const [rows] = await connection.query('SELECT * FROM users');
        res.status(200).json(rows);
    } catch (err) {
        console.error('Error fetching users:', err.message);
        res.status(500).json({ message: 'Server error while fetching users' });
    }
});
// Example of a protected route that only admins can access
router.get('/admin', [authMiddleware, roleMiddleware('admin')], (req, res) => {
    res.json({ message: 'Welcome, Admin!' });
});

export default router;
