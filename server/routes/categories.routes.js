const express = require("express");
const router = express.Router();
const pool = require("../config/db");

router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, name, slug FROM categories ORDER BY name ASC'
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

module.exports = router;
