const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET chưa được set trong file .env');
}

function generateToken(user) {
    const payload = {
        id: user.id,
        email: user.email,
        role: user.role,
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyTokenString(token) {
    return jwt.verify(token, JWT_SECRET);
}

// Token trong link xác thực email ký bằng secret riêng, để không dùng thay token đăng nhập được
const EMAIL_SECRET = `${JWT_SECRET}:verify-email`;

// Dấu vân tay của mật khẩu hiện tại: đăng ký lại (đổi mật khẩu) thì link cũ hết hiệu lực
function passwordFingerprint(passwordHash) {
    return crypto.createHash('sha256').update(String(passwordHash)).digest('hex').slice(0, 16);
}

// user cần có id, email, password (hash)
function generateEmailToken(user) {
    return jwt.sign(
        { id: user.id, email: user.email, pwf: passwordFingerprint(user.password) },
        EMAIL_SECRET,
        { expiresIn: '24h' }
    );
}

function verifyEmailToken(token) {
    return jwt.verify(token, EMAIL_SECRET);
}

// Token đặt lại mật khẩu: secret riêng, hạn ngắn. Đổi mật khẩu xong thì dấu vân tay đổi nên link chỉ dùng được 1 lần
const RESET_SECRET = `${JWT_SECRET}:reset-password`;

function generateResetToken(user) {
    return jwt.sign(
        { id: user.id, email: user.email, pwf: passwordFingerprint(user.password) },
        RESET_SECRET,
        { expiresIn: '30m' }
    );
}

function verifyResetToken(token) {
    return jwt.verify(token, RESET_SECRET);
}

module.exports = {
    generateToken,
    verifyTokenString,
    generateEmailToken,
    verifyEmailToken,
    generateResetToken,
    verifyResetToken,
    passwordFingerprint,
};