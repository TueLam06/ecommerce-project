import { useState } from "react";

const METRICS = {
    revenue: {
        label: "Doanh thu",
        format: (v) => `${v.toLocaleString("vi-VN")}đ`,
        formatAxis: formatCompact,
    },
    orders: {
        label: "Đơn hàng",
        format: (v) => `${v} đơn`,
        formatAxis: (v) => String(v),
    },
};

// Biểu đồ cột theo ngày, chuyển qua lại giữa doanh thu và số đơn
export default function DailyChart({ data }) {
    const [metric, setMetric] = useState("revenue");
    const [hovered, setHovered] = useState(null);
    const { label, format, formatAxis } = METRICS[metric];

    const values = data.map((d) => d[metric]);
    const max = niceMax(Math.max(...values, 0), metric === "orders");
    const ticks = [max, (max * 2) / 3, max / 3, 0];
    const total = values.reduce((sum, v) => sum + v, 0);

    return (
        <div className="rounded-md border border-[#D9D6CC] bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
                <div>
                    <h3 className="text-[#1A1A18] font-medium">{label} 14 ngày gần nhất</h3>
                    <p className="text-sm text-[#6B6B65]">
                        Tổng: <span className="text-[#1A1A18] font-medium">{format(total)}</span>
                        {metric === "revenue" && " · chỉ tính đơn đã giao thành công"}
                    </p>
                </div>
                <div className="inline-flex rounded-md border border-[#D9D6CC] p-0.5 text-sm">
                    {Object.entries(METRICS).map(([key, m]) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setMetric(key)}
                            className={`px-3 py-1 rounded transition-colors ${
                                metric === key
                                    ? "bg-[#2F5233] text-[#F5F3EE]"
                                    : "text-[#6B6B65] hover:text-[#1A1A18]"
                            }`}
                        >
                            {m.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex gap-2">
                {/* Trục Y */}
                <div className="flex flex-col justify-between h-48 text-[11px] text-[#8A8A82] text-right shrink-0 -mt-1.5 pb-0">
                    {ticks.map((t) => (
                        <span key={t} className="leading-3">
                            {formatAxis(t)}
                        </span>
                    ))}
                </div>

                <div className="flex-1 min-w-0">
                    {/* Vùng cột */}
                    <div className="relative h-48">
                        {ticks.map((t, i) => (
                            <div
                                key={t}
                                className={`absolute left-0 right-0 border-t ${
                                    i === ticks.length - 1 ? "border-[#D9D6CC]" : "border-[#EFEDE6]"
                                }`}
                                style={{ top: `${(i / (ticks.length - 1)) * 100}%` }}
                            />
                        ))}

                        <div className="absolute inset-0 flex items-end gap-1 sm:gap-2">
                            {data.map((d, i) => {
                                const value = d[metric];
                                const height = max ? (value / max) * 100 : 0;
                                const active = hovered === i;
                                return (
                                    <div
                                        key={d.date}
                                        className="relative flex-1 h-full flex items-end justify-center"
                                        onMouseEnter={() => setHovered(i)}
                                        onMouseLeave={() => setHovered(null)}
                                    >
                                        {active && (
                                            <div
                                                className={`absolute z-10 whitespace-nowrap rounded bg-[#1A1A18] px-2 py-1 text-[11px] text-white pointer-events-none ${
                                                    i < 2 ? "left-0" : i > data.length - 3 ? "right-0" : "left-1/2 -translate-x-1/2"
                                                }`}
                                                style={{ bottom: `calc(${height}% + 6px)` }}
                                            >
                                                {formatDate(d.date)}: {format(value)}
                                            </div>
                                        )}
                                        <div
                                            className={`w-full max-w-7 rounded-t-sm transition-colors ${
                                                active ? "bg-[#244027]" : "bg-[#2F5233]"
                                            }`}
                                            style={{ height: `${height}%`, minHeight: value > 0 ? 2 : 0 }}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Trục X */}
                    <div className="flex gap-1 sm:gap-2 mt-2 text-[11px] text-[#8A8A82]">
                        {data.map((d, i) => (
                            <span key={d.date} className="flex-1 text-center">
                                {i % 2 === data.length % 2 ? formatDate(d.date) : ""}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Làm tròn giá trị lớn nhất để trục Y có vạch chia đẹp, chia hết cho 3
function niceMax(value, integer) {
    if (value <= 0) return integer ? 3 : 300000;
    const raw = value / 3;
    const pow = 10 ** Math.floor(Math.log10(raw));
    const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw);
    return (integer ? Math.max(1, Math.ceil(step)) : step) * 3;
}

function formatCompact(v) {
    if (v >= 1e9) return `${+(v / 1e9).toFixed(1)}tỷ`;
    if (v >= 1e6) return `${+(v / 1e6).toFixed(1)}tr`;
    if (v >= 1e3) return `${+(v / 1e3).toFixed(0)}k`;
    return String(Math.round(v));
}

function formatDate(iso) {
    const [, m, d] = iso.split("-");
    return `${d}/${m}`;
}
