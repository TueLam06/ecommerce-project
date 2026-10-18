const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();

const pool = require('../config/db');
const {
    generateToken,
    generateEmailToken,
    verifyEmailToken,
    generateResetToken,
    verifyResetToken,
    passwordFingerprint,
} = require('../utils/token');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/mailer');
const { verifyToken } = require('../middleware/auth.middleware');
const {
    loginLimiter,
    loginIpLimiter,
    registerLimiter,
    resendVerificationLimiter,
    forgotPasswordLimiter,
    changePasswordLimiter,
} = require('../middleware/rateLimit.middleware');

const SALT_ROUNDS = 10;

router.post('/register', registerLimiter, async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Thiếu name, email hoặc password' });
    }
    if (password.length < 6) {
        return res.status(400).json({ error: 'Password phải có ít nhất 6 ký tự' });
    }

    try {
        const existing = await pool.query('SELECT id, email_verified FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0 && existing.rows[0].email_verified) {
            return res.status(409).json({ error: 'Email đã được sử dụng' });
        }

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        // Email đã đăng ký nhưng chưa xác thực (nhập sai, không nhận được mail...) -> cho đăng ký lại, ghi đè thông tin cũ
        const result = existing.rows.length > 0
            ? await pool.query(
                `UPDATE users SET name = $1, password = $2
       WHERE id = $3
       RETURNING id, name, email, password, role, created_at`,
                [name, hashedPassword, existing.rows[0].id]
            )
            : await pool.query(
                `INSERT INTO users (name, email, password, role, email_verified)
       VALUES ($1, $2, $3, 'customer', false)
       RETURNING id, name, email, password, role, created_at`,
                [name, email, hashedPassword]
            );

        const user = result.rows[0];

        // Chưa trả token đăng nhập: phải bấm link trong email trước
        let emailSent = true;
        try {
            await sendVerificationEmail(user, generateEmailToken(user));
        } catch (mailErr) {
            console.error('Send verification email error:', mailErr);
            emailSent = false;
        }

        res.status(existing.rows.length > 0 ? 200 : 201).json({
            email: user.email,
            emailSent,
            message: emailSent
                ? 'Đăng ký thành công, vui lòng kiểm tra email để xác thực tài khoản'
                : 'Đăng ký thành công nhưng chưa gửi được email xác thực, vui lòng bấm gửi lại',
        });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Lỗi server khi đăng ký' });
    }
});

router.post('/login', loginIpLimiter, loginLimiter, async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Thiếu email hoặc password' });
    }

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ error: 'Email hoặc password không đúng' });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Email hoặc password không đúng' });
        }

        if (!user.email_verified) {
            return res.status(403).json({
                error: 'Email chưa được xác thực, vui lòng kiểm tra hộp thư',
                code: 'EMAIL_NOT_VERIFIED',
            });
        }

        const token = generateToken(user);

        res.json({
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
            token,
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Lỗi server khi đăng nhập' });
    }
});

// POST /api/auth/verify-email - body: { token } từ link trong email. Xác thực xong thì đăng nhập luôn
router.post('/verify-email', async (req, res) => {
    let payload;
    try {
        payload = verifyEmailToken(String(req.body.token || ''));
    } catch (err) {
        const expired = err.name === 'TokenExpiredError';
        return res.status(400).json({
            error: expired
                ? 'Link xác thực đã hết hạn, vui lòng gửi lại email xác thực'
                : 'Link xác thực không hợp lệ',
        });
    }

    try {
        // So cả email và mật khẩu: link cũ hết hiệu lực nếu đã đổi email hoặc đã đăng ký lại
        const found = await pool.query(
            'SELECT id, name, email, password, role FROM users WHERE id = $1 AND email = $2',
            [payload.id, payload.email]
        );
        const row = found.rows[0];
        if (!row || passwordFingerprint(row.password) !== payload.pwf) {
            return res.status(400).json({
                error: 'Link xác thực không còn hiệu lực, vui lòng dùng link trong email mới nhất',
            });
        }

        await pool.query('UPDATE users SET email_verified = true WHERE id = $1', [row.id]);

        const user = { id: row.id, name: row.name, email: row.email, role: row.role };
        res.json({ user, token: generateToken(user) });
    } catch (err) {
        console.error('Verify email error:', err);
        res.status(500).json({ error: 'Lỗi server khi xác thực email' });
    }
});

// POST /api/auth/resend-verification - body: { email }
// Luôn trả cùng một câu để không lộ email nào đã đăng ký
router.post('/resend-verification', resendVerificationLimiter, async (req, res) => {
    const email = String(req.body.email || '').trim();
    const message = 'Nếu email đã đăng ký và chưa xác thực, chúng tôi đã gửi lại link xác thực';

    if (!email) {
        return res.status(400).json({ error: 'Thiếu email' });
    }

    try {
        const result = await pool.query(
            'SELECT id, name, email, password FROM users WHERE email = $1 AND email_verified = false',
            [email]
        );
        const user = result.rows[0];
        if (user) {
            await sendVerificationEmail(user, generateEmailToken(user));
        }
        res.json({ message });
    } catch (err) {
        console.error('Resend verification error:', err);
        res.status(500).json({ error: 'Không gửi được email, vui lòng thử lại sau' });
    }
});

// POST /api/auth/forgot-password - body: { email }
// Luôn trả cùng một câu để không lộ email nào đã đăng ký
router.post('/forgot-password', forgotPasswordLimiter, async (req, res) => {
    const email = String(req.body.email || '').trim();
    const message = 'Nếu email đã đăng ký, chúng tôi đã gửi link đặt lại mật khẩu. Vui lòng kiểm tra hộp thư';

    if (!email) {
        return res.status(400).json({ error: 'Thiếu email' });
    }

    try {
        const result = await pool.query('SELECT id, name, email, password FROM users WHERE email = $1', [email]);
        const user = result.rows[0];
        // Không chờ gửi mail: thời gian phản hồi và lỗi gửi mail không được để lộ email có tồn tại hay không
        if (user) {
            sendPasswordResetEmail(user, generateResetToken(user))
                .catch((mailErr) => console.error('Send reset email error:', mailErr));
        }
        res.json({ message });
    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ error: 'Không gửi được email, vui lòng thử lại sau' });
    }
});

// POST /api/auth/reset-password - body: { token, password }. Đổi xong thì đăng nhập luôn
router.post('/reset-password', async (req, res) => {
    const password = String(req.body.password || '');
    if (password.length < 6) {
        return res.status(400).json({ error: 'Password phải có ít nhất 6 ký tự' });
    }

    let payload;
    try {
        payload = verifyResetToken(String(req.body.token || ''));
    } catch (err) {
        const expired = err.name === 'TokenExpiredError';
        return res.status(400).json({
            error: expired
                ? 'Link đặt lại mật khẩu đã hết hạn, vui lòng yêu cầu link mới'
                : 'Link đặt lại mật khẩu không hợp lệ',
        });
    }

    try {
        const found = await pool.query(
            'SELECT id, password FROM users WHERE id = $1 AND email = $2',
            [payload.id, payload.email]
        );
        const row = found.rows[0];
        // Mật khẩu đã đổi (link đã dùng, hoặc có link mới hơn được dùng trước) thì link hết hiệu lực
        if (!row || passwordFingerprint(row.password) !== payload.pwf) {
            return res.status(400).json({
                error: 'Link đặt lại mật khẩu đã được sử dụng hoặc không còn hiệu lực, vui lòng yêu cầu link mới',
            });
        }

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        // Bấm được link trong mail tức là sở hữu email, nên coi như đã xác thực luôn
        const updated = await pool.query(
            `UPDATE users SET password = $1, email_verified = true WHERE id = $2
       RETURNING id, name, email, role`,
            [hashedPassword, row.id]
        );

        const user = updated.rows[0];
        res.json({ user, token: generateToken(user) });
    } catch (err) {
        console.error('Reset password error:', err);
        res.status(500).json({ error: 'Lỗi server khi đặt lại mật khẩu' });
    }
});

router.get('/me', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
            [req.user.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy user' });
        }
        res.json({ user: result.rows[0] });
    } catch (err) {
        console.error('Get me error:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// PATCH /api/auth/me - body: { name }. Đổi tên hiển thị
router.patch('/me', verifyToken, async (req, res) => {
    const name = String(req.body.name || '').trim();
    if (!name) {
        return res.status(400).json({ error: 'Tên không được để trống' });
    }
    if (name.length > 100) {
        return res.status(400).json({ error: 'Tên tối đa 100 ký tự' });
    }

    try {
        const result = await pool.query(
            'UPDATE users SET name = $1 WHERE id = $2 RETURNING id, name, email, role, created_at',
            [name, req.user.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy user' });
        }
        res.json({ user: result.rows[0], message: 'Đã cập nhật thông tin' });
    } catch (err) {
        console.error('Update me error:', err);
        res.status(500).json({ error: 'Lỗi server khi cập nhật thông tin' });
    }
});

// POST /api/auth/change-password - body: { currentPassword, newPassword }
// Đổi xong thì link xác thực/đặt lại mật khẩu cũ tự hết hiệu lực (dấu vân tay mật khẩu đổi)
router.post('/change-password', verifyToken, changePasswordLimiter, async (req, res) => {
    const currentPassword = String(req.body.currentPassword || '');
    const newPassword = String(req.body.newPassword || '');

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Thiếu mật khẩu hiện tại hoặc mật khẩu mới' });
    }
    if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Password phải có ít nhất 6 ký tự' });
    }
    if (newPassword === currentPassword) {
        return res.status(400).json({ error: 'Mật khẩu mới phải khác mật khẩu hiện tại' });
    }

    try {
        const found = await pool.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
        const row = found.rows[0];
        if (!row) {
            return res.status(404).json({ error: 'Không tìm thấy user' });
        }
        if (!(await bcrypt.compare(currentPassword, row.password))) {
            return res.status(400).json({ error: 'Mật khẩu hiện tại không đúng' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
        await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, req.user.id]);
        res.json({ message: 'Đã đổi mật khẩu' });
    } catch (err) {
        console.error('Change password error:', err);
        res.status(500).json({ error: 'Lỗi server khi đổi mật khẩu' });
    }
});

module.exports = router;