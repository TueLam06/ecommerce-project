const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const model = require('../config/gemini');
const { z } = require('zod')

const chatResponseSchema = z.object({
    message: z.string().describe("Câu trả lời bằng lời cho khách hàng"),
    productIds: z.array(z.number()).describe("Danh sách id sản phẩm được gợi ý, để trống nếu không có sản phẩm phù hợp"),
})

const buildSystemPrompt = require('../prompts/systemPrompt');
const structuredModel = model.withStructuredOutput(chatResponseSchema);

router.post('/', async (req, res) => {
    try {
        const { message, history } = req.body;
        const result = await pool.query(
            `SELECT p.*,
                    (SELECT json_agg(json_build_object('name', v.name, 'price', v.price) ORDER BY v.sort_order, v.id)
                     FROM product_variants v WHERE v.product_id = p.id) AS variants
             FROM products p`
        );
        const productList = result.rows
            .map(p => {
                if (!p.variants) return `- id ${p.id}: ${p.name} - ${p.price}đ. ${p.description}`;
                const opts = p.variants.map(v => `${v.name}: ${v.price}đ`).join('; ');
                return `- id ${p.id}: ${p.name} - các phiên bản (${opts}). ${p.description}`;
            })
            .join('\n');

        const systemPrompt = buildSystemPrompt(productList);

        const conversation = [
            ["system", systemPrompt],
            ...history.map(msg => [
                msg.sender === 'user' ? 'human' : 'ai',
                msg.text,
            ]),
            ["human", message]
        ]

        const response = await structuredModel.invoke(conversation);

        // Gửi kèm tên/giá/ảnh để frontend hiện tên sản phẩm thay vì chỉ có id
        const products = (response.productIds || [])
            .map((id) => result.rows.find((p) => p.id === id))
            .filter(Boolean)
            .map(({ id, name, price, image, variants }) => ({
                id,
                name,
                price: variants ? Math.min(...variants.map(v => Number(v.price))) : price,
                image,
            }));

        res.json({ ...response, products });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Lỗi khi xử lý chatbot' });
    }
});

module.exports = router;