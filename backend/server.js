require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise'); // Use the promise-based version
const cors = require('cors');

const app = express();
const port = 5000; // The port inside the container

app.use(cors());
app.use(express.json());

// Use a connection pool for stability and automatic reconnections
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

console.log('Backend server starting...');

// GET all tasks
app.get('/api/tasks', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM tasks ORDER BY column_id, created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST a new task
app.post('/api/tasks', async (req, res) => {
  try {
    const { id, title, description, priority, column_id, due_date } = req.body;
    const sql = 'INSERT INTO tasks (id, title, description, priority, column_id, due_date) VALUES (?, ?, ?, ?, ?, ?)';
    await pool.query(sql, [id, title, description, priority, column_id, due_date]);
    res.status(201).json({ message: 'Task created' });
  } catch (error) {
    console.error('Failed to create task:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT (update) a task
app.put('/api/tasks/:id', async (req, res) => {
  try {
    const { title, description, priority, column_id, due_date } = req.body;
    const { id } = req.params;
    const sql = 'UPDATE tasks SET title = ?, description = ?, priority = ?, column_id = ?, due_date = ? WHERE id = ?';
    await pool.query(sql, [title, description, priority, column_id, due_date, id]);
    res.json({ message: 'Task updated' });
  } catch (error) {
    console.error('Failed to update task:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE a task
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM tasks WHERE id = ?', [id]);
    res.json({ message: 'Task deleted' });
  } catch (error) {
    console.error('Failed to delete task:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Backend running on port ${port}`);
});