// Gửi email qua Brevo HTTP API (https://developers.brevo.com/reference/sendtransacemail)
// Chưa set BREVO_API_KEY (vd: chạy local) thì chỉ in nội dung ra console để test
async function sendMail({ to, subject, html }) {
    if (!process.env.BREVO_API_KEY) {
        console.log(`[mail] Chưa có BREVO_API_KEY, bỏ qua gửi mail tới ${to}: ${subject}\n${html}`);
        return;
    }

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            'api-key': process.env.BREVO_API_KEY,
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        body: JSON.stringify({
            sender: {
                email: process.env.MAIL_FROM_EMAIL,
                name: process.env.MAIL_FROM_NAME || 'Stuff Corner',
            },
            to: [{ email: to }],
            subject,
            htmlContent: html,
        }),
    });

    if (!res.ok) {
        const detail = await res.text().catch(() => '');
        throw new Error(`Brevo trả lỗi ${res.status}: ${detail}`);
    }
}

function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    })[c]);
}

async function sendVerificationEmail(user, token) {
    const link = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email?token=${encodeURIComponent(token)}`;
    await sendMail({
        to: user.email,
        subject: 'Xác thực email tài khoản của bạn',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; color: #1A1A18">
                <h2 style="color: #2F5233">Chào ${escapeHtml(user.name)},</h2>
                <p>Cảm ơn bạn đã đăng ký. Bấm nút bên dưới để xác thực email và kích hoạt tài khoản:</p>
                <p style="text-align: center; margin: 32px 0">
                    <a href="${link}" style="background: #2F5233; color: #F5F3EE; padding: 12px 24px; border-radius: 6px; text-decoration: none">
                        Xác thực email
                    </a>
                </p>
                <p style="font-size: 13px; color: #6B6B65">
                    Link có hiệu lực trong 24 giờ. Nếu bạn không đăng ký tài khoản, hãy bỏ qua email này.
                </p>
            </div>
        `,
    });
}

module.exports = { sendMail, sendVerificationEmail };
