import { useState } from "react";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";

function ChatPage() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSend() {
        if (!input.trim() || loading) return;

        const userMessage = input.trim();

        // Thêm message của user trước
        setMessages((prev) => [
            ...prev,
            {
                sender: "user",
                text: userMessage,
            },
        ]);

        setInput("");
        setLoading(true);

        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/chat`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        message: userMessage,
                        history: messages,
                    }),
                }
            );

            if (!res.ok) {
                throw new Error("Chat API error");
            }

            const data = await res.json();

            const botText = data.message || "Xin lỗi, tôi không có câu trả lời.";

            // Tạo message bot rỗng trước
            setMessages((prev) => [
                ...prev,
                {
                    sender: "bot",
                    text: "",
                    products: data.products || [],
                },
            ]);

            // Hiệu ứng chạy chữ
            let currentText = "";

            for (let i = 0; i < botText.length; i++) {
                currentText += botText[i];

                await new Promise((resolve) => {
                    setTimeout(resolve, 15);
                });

                setMessages((prev) => {
                    const updated = [...prev];

                    updated[updated.length - 1] = {
                        sender: "bot",
                        text: currentText,
                        products: data.products || [],
                    };

                    return updated;
                });
            }
        } catch (err) {
            console.error(err);

            setMessages((prev) => [
                ...prev,
                {
                    sender: "bot",
                    text: "Xin lỗi, có lỗi xảy ra. Vui lòng thử lại.",
                },
            ]);
        } finally {
            setLoading(false);
        }
    }

    function handleKeyDown(e) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }

    return (
        <main className="min-h-screen bg-[#FAFAF8]">
            {/* Header */}
            <section className="bg-[#2F5233]">
                <div className="max-w-4xl mx-auto px-6 py-12 md:py-16">
                    <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-[#D8E2D2]">
                        AI Assistant
                    </p>

                    <h1
                        className="text-4xl md:text-5xl text-[#F5F3EE]"
                        style={{ fontFamily: "'Fraunces', serif" }}
                    >
                        Chat với trợ lý AI
                    </h1>

                    <p className="mt-4 max-w-xl text-[#D8E2D2] leading-relaxed">
                        Hỏi tôi về sản phẩm, tìm kiếm sản phẩm hoặc nhận gợi ý
                        phù hợp với nhu cầu của bạn.
                    </p>
                </div>
            </section>

            {/* Chat area */}
            <section className="max-w-4xl mx-auto px-6 py-8">
                <div className="min-h-[500px] rounded-lg border border-[#D9D6CC] bg-white shadow-sm">
                    {/* Messages */}
                    <div className="min-h-[440px] max-h-[600px] overflow-y-auto p-5 md:p-6">
                        {messages.length === 0 && (
                            <div className="flex min-h-[380px] items-center justify-center text-center">
                                <div>
                                    <h2
                                        className="text-2xl text-[#1A1A18]"
                                        style={{
                                            fontFamily: "'Fraunces', serif",
                                        }}
                                    >
                                        Tôi có thể giúp gì cho bạn?
                                    </h2>

                                    <p className="mt-2 text-sm text-[#6B6B65]">
                                        Ví dụ: "Tìm cho tôi một chiếc laptop
                                        dưới 20 triệu đồng"
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="space-y-6">
                            {messages.map((msg, index) => (
                                <div
                                    key={index}
                                    className={`flex ${
                                    msg.sender === "user"
                                        ? "justify-end"
                                        : "justify-start"
                                }`}
                                >
                                    <div
                                        className={`max-w-[85%] md:max-w-[75%] ${
                                        msg.sender === "user"
                                            ? "items-end"
                                            : "items-start"
                                    }`}
                                    >
                                        {/* Sender */}
                                        <p
                                            className={`mb-1.5 text-xs font-medium uppercase tracking-wide ${
                                                msg.sender === "user"
                                                    ? "text-right text-[#6B6B65]"
                                                    : "text-[#2F5233]"
                                            }`}
                                        >
                                            {msg.sender === "user"
                                                ? "Bạn"
                                                : "AI Assistant"}
                                        </p>

                                        {/* Message */}
                                        <div
                                            className={`rounded-lg px-4 py-3 leading-relaxed ${
                                                msg.sender === "user"
                                                    ? "bg-[#2F5233] text-[#F5F3EE]"
                                                    : "border border-[#D9D6CC] bg-[#FAFAF8] text-[#1A1A18]"
                                            }`}
                                        >
                                            <div
                                                className={`prose prose-sm max-w-none ${
                                            msg.sender === "user"
                                                ? "prose-invert"
                                                : ""
                                        }`}
                                            >
                                                <ReactMarkdown>
                                                    {msg.text}
                                                </ReactMarkdown>
                                            </div>
                                        </div>

                                        {/* Products */}
                                        {msg.products?.length > 0 && (
                                            <div className="mt-3 space-y-2">
                                                <p className="text-xs font-medium uppercase tracking-wide text-[#6B6B65]">
                                                    Sản phẩm được đề xuất
                                                </p>

                                                <div className="flex flex-wrap gap-2">
                                                    {msg.products.map((p) => (
                                                        <Link
                                                            key={p.id}
                                                            to={`/products/${p.id}`}
                                                            className="group flex max-w-full items-center gap-3 rounded-md border border-[#D9D6CC] bg-white py-2 pl-2 pr-4 transition-colors hover:border-[#2F5233]"
                                                        >
                                                            {p.image && (
                                                                <img
                                                                    src={p.image}
                                                                    alt=""
                                                                    className="h-10 w-10 shrink-0 rounded object-cover bg-[#F5F3EE]"
                                                                />
                                                            )}
                                                            <span className="min-w-0">
                                                                <span className="block truncate text-sm font-medium text-[#1A1A18] group-hover:text-[#2F5233]">
                                                                    {p.name}
                                                                </span>
                                                                <span className="block text-xs text-[#2F5233]">
                                                                    {Number(p.price).toLocaleString("vi-VN")}₫
                                                                </span>
                                                            </span>
                                                        </Link>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* Loading */}
                            {loading && (
                                <div className="flex justify-start">
                                    <div>
                                        <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-[#2F5233]">
                                            AI Assistant
                                        </p>

                                        <div className="rounded-lg border border-[#D9D6CC] bg-[#FAFAF8] px-4 py-3">
                                            <div className="flex items-center gap-1.5">
                                                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#2F5233]" />
                                                <span
                                                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#2F5233]"
                                                    style={{
                                                        animationDelay: "150ms",
                                                    }}
                                                />
                                                <span
                                                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#2F5233]"
                                                    style={{
                                                        animationDelay: "300ms",
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Input */}
                    <div className="border-t border-[#D9D6CC] p-4">
                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={loading}
                                placeholder="Bạn muốn tìm gì?"
                                className="min-w-0 flex-1 rounded-md border border-[#D9D6CC] bg-white px-3.5 py-2.5 text-[#1A1A18] placeholder:text-[#6B6B65] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#2F5233] disabled:bg-[#FAFAF8]"
                            />

                            <button
                                onClick={handleSend}
                                disabled={loading || !input.trim()}
                                className="rounded-md bg-[#2F5233] px-5 py-2.5 font-medium text-[#F5F3EE] transition-colors hover:bg-[#244027] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {loading ? "Đang gửi..." : "Gửi"}
                            </button>
                        </div>

                        <p className="mt-2 text-xs text-[#6B6B65]">
                            Nhấn Enter để gửi
                        </p>
                    </div>
                </div>
            </section>
        </main>
    );
}

export default ChatPage;