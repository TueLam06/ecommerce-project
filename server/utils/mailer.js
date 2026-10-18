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

function clientUrl(path) {
    const base = (process.env.CLIENT_URL || 'http://localhost:5173').trim().replace(/\/+$/, '');
    return `${base}${path}`;
}

function layout(content) {
    return `<div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto; color: #1A1A18">${content}</div>`;
}

// Nút + link dạng chữ bên dưới (Brevo bọc link để tracking, link bọc từng trả 404)
function buttonBlock(link, text) {
    return `
        <p style="text-align: center; margin: 32px 0">
            <a href="${link}" style="background: #2F5233; color: #F5F3EE; padding: 12px 24px; border-radius: 6px; text-decoration: none">
                ${text}
            </a>
        </p>
        <p style="font-size: 13px; color: #6B6B65">
            Nếu nút không mở được, hãy copy đường link sau và dán vào trình duyệt:
        </p>
        <p style="font-size: 13px; word-break: break-all; color: #2F5233">${link}</p>
    `;
}

async function sendVerificationEmail(user, token) {
    const link = clientUrl(`/verify-email?token=${encodeURIComponent(token)}`);
    await sendMail({
        to: user.email,
        subject: 'Xác thực email tài khoản của bạn',
        html: layout(`
            <h2 style="color: #2F5233">Chào ${escapeHtml(user.name)},</h2>
            <p>Cảm ơn bạn đã đăng ký. Bấm nút bên dưới để xác thực email và kích hoạt tài khoản:</p>
            ${buttonBlock(link, 'Xác thực email')}
            <p style="font-size: 13px; color: #6B6B65">
                Link có hiệu lực trong 24 giờ. Nếu bạn không đăng ký tài khoản, hãy bỏ qua email này.
            </p>
        `),
    });
}

async function sendPasswordResetEmail(user, token) {
    const link = clientUrl(`/reset-password?token=${encodeURIComponent(token)}`);
    await sendMail({
        to: user.email,
        subject: 'Đặt lại mật khẩu',
        html: layout(`
            <h2 style="color: #2F5233">Chào ${escapeHtml(user.name)},</h2>
            <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Bấm nút bên dưới để đặt mật khẩu mới:</p>
            ${buttonBlock(link, 'Đặt lại mật khẩu')}
            <p style="font-size: 13px; color: #6B6B65">
                Link có hiệu lực trong 30 phút và chỉ dùng được 1 lần.
                Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này, mật khẩu cũ vẫn giữ nguyên.
            </p>
        `),
    });
}

function formatVND(n) {
    return `${Number(n).toLocaleString('vi-VN')}đ`;
}

// order: { id, customer_name, phone, address, total, email, user_id }, items: { name, variant_name, quantity, price }
async function sendOrderConfirmationEmail(order, items) {
    // Khách có tài khoản xem đơn trong lịch sử, khách vãng lai tra cứu bằng mã đơn + SĐT
    const link = clientUrl(order.user_id ? `/orders/${order.id}` : '/track-order');
    const rows = items.map((i) => `
        <tr>
            <td style="padding: 8px 0; border-top: 1px solid #E5E3DC">
                ${escapeHtml(i.name)}${i.variant_name ? `<br><span style="font-size: 13px; color: #6B6B65">${escapeHtml(i.variant_name)}</span>` : ''}
            </td>
            <td style="padding: 8px 0; border-top: 1px solid #E5E3DC; text-align: center">x${i.quantity}</td>
            <td style="padding: 8px 0; border-top: 1px solid #E5E3DC; text-align: right; white-space: nowrap">${formatVND(i.price * i.quantity)}</td>
        </tr>
    `).join('');

    await sendMail({
        to: order.email,
        subject: `Xác nhận đơn hàng #${order.id}`,
        html: layout(`
            <h2 style="color: #2F5233">Cảm ơn ${escapeHtml(order.customer_name)} đã đặt hàng!</h2>
            <p>Đơn hàng <strong>#${order.id}</strong> đã được ghi nhận. Chúng tôi sẽ gọi qua số điện thoại bên dưới để xác nhận trước khi giao.</p>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin: 24px 0">
                ${rows}
                <tr>
                    <td colspan="2" style="padding: 12px 0; border-top: 2px solid #2F5233"><strong>Tổng cộng</strong></td>
                    <td style="padding: 12px 0; border-top: 2px solid #2F5233; text-align: right"><strong>${formatVND(order.total)}</strong></td>
                </tr>
            </table>
            <p style="font-size: 14px; margin: 4px 0"><span style="color: #6B6B65">Người nhận:</span> ${escapeHtml(order.customer_name)}</p>
            <p style="font-size: 14px; margin: 4px 0"><span style="color: #6B6B65">Số điện thoại:</span> ${escapeHtml(order.phone)}</p>
            <p style="font-size: 14px; margin: 4px 0"><span style="color: #6B6B65">Địa chỉ:</span> ${escapeHtml(order.address)}</p>            ${buttonBlock(link, 'Xem trạng thái đơn hàng')}
            ${order.user_id ? '' : `<p style="font-size: 13px; color: #6B6B65">Tra cứu bằng mã đơn <strong>#${order.id}</strong> và số điện thoại đặt hàng.</p>`}
        `),
    });
}

module.exports = { sendMail, sendVerificationEmail, sendPasswordResetEmail, sendOrderConfirmationEmail };
