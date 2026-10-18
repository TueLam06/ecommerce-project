const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

// Tạo limiter trả lỗi JSON theo format chung của API
function createLimiter({ windowMs, limit, message, ...options }) {
    return rateLimit({
        windowMs,
        limit,
        standardHeaders: 'draft-8',
        legacyHeaders: false,
        handler: (req, res) => res.status(429).json({ error: message, message }),
        ...options,
    });
}

// Toàn bộ /api: 200 request / phút / IP
const apiLimiter = createLimiter({
    windowMs: 60_000,
    limit: 200,
    message: 'Quá nhiều request, vui lòng thử lại sau',
});

// Đăng nhập: tối đa 5 lần SAI / 15 phút cho mỗi cặp IP + email (đăng nhập đúng không bị tính)
const loginLimiter = createLimiter({
    windowMs: 15 * 60_000,
    limit: 5,
    skipSuccessfulRequests: true,
    keyGenerator: (req) =>
        `${ipKeyGenerator(req.ip)}:${String(req.body?.email || '').trim().toLowerCase()}`,
    message: 'Bạn đăng nhập sai quá nhiều lần, vui lòng thử lại sau 15 phút',
});

// Đăng nhập: chặn thêm theo IP để không dò được bằng cách đổi email liên tục
const loginIpLimiter = createLimiter({
    windowMs: 15 * 60_000,
    limit: 30,
    skipSuccessfulRequests: true,
    message: 'Bạn đăng nhập sai quá nhiều lần, vui lòng thử lại sau 15 phút',
});

// Đăng ký: 10 lần thành công / giờ / IP (nhập sai, email trùng... không bị tính)
const registerLimiter = createLimiter({
    windowMs: 60 * 60_000,
    limit: 10,
    skipFailedRequests: true,
    message: 'Bạn đăng ký quá nhiều tài khoản, vui lòng thử lại sau',
});

// Gửi lại email xác thực: 3 lần / 15 phút / IP (mỗi lần tốn 1 mail trong quota Brevo)
const resendVerificationLimiter = createLimiter({
    windowMs: 15 * 60_000,
    limit: 3,
    message: 'Bạn gửi lại email quá nhiều lần, vui lòng thử lại sau 15 phút',
});

// Quên mật khẩu: 3 lần / 15 phút / IP (mỗi lần tốn 1 mail, chặn spam hộp thư người khác)
const forgotPasswordLimiter = createLimiter({
    windowMs: 15 * 60_000,
    limit: 3,
    message: 'Bạn yêu cầu đặt lại mật khẩu quá nhiều lần, vui lòng thử lại sau 15 phút',
});

// Đổi mật khẩu: tối đa 5 lần SAI / 15 phút / user (chặn dò mật khẩu cũ bằng token bị lộ)
const changePasswordLimiter = createLimiter({
    windowMs: 15 * 60_000,
    limit: 5,
    skipSuccessfulRequests: true,
    keyGenerator: (req) => (req.user ? `user:${req.user.id}` : ipKeyGenerator(req.ip)),
    message: 'Bạn nhập sai mật khẩu hiện tại quá nhiều lần, vui lòng thử lại sau 15 phút',
});

// Đặt hàng: 5 đơn / 10 phút, theo user nếu đã đăng nhập, theo IP nếu là khách
const orderLimiter = createLimiter({
    windowMs: 10 * 60_000,
    limit: 5,
    keyGenerator: (req) => (req.user ? `user:${req.user.id}` : ipKeyGenerator(req.ip)),
    message: 'Bạn đặt hàng quá nhiều lần, vui lòng thử lại sau ít phút',
});

// Tra cứu đơn: 10 lần / phút / IP (chống dò SĐT)
const trackLimiter = createLimiter({
    windowMs: 60_000,
    limit: 10,
    message: 'Bạn tra cứu quá nhiều lần, vui lòng thử lại sau 1 phút',
});

// Chatbot: 10 tin / phút / IP (mỗi tin tốn quota Gemini)
const chatLimiter = createLimiter({
    windowMs: 60_000,
    limit: 10,
    message: 'Bạn gửi tin nhắn quá nhanh, vui lòng thử lại sau',
});

module.exports = {
    apiLimiter,
    loginLimiter,
    loginIpLimiter,
    registerLimiter,
    resendVerificationLimiter,
    forgotPasswordLimiter,
    changePasswordLimiter,
    orderLimiter,
    trackLimiter,
    chatLimiter,
};
