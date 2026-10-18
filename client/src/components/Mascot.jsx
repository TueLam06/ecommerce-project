import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";

// Con rùa pixel art vẽ bằng SVG: mỗi ký tự là một ô vuông 1x1.
// #=mai, S=hoa văn mai, H=đầu/tay/chân, E=mắt, L/M=chân (nhấc luân phiên)
// D=lưng màn hình, G=logo, B=thân laptop, P/Q=tay gõ phím
const STAND = [
    "..#####....",
    ".#S#S#S#.HH",
    ".#######HEH",
    ".#######HHH",
    ".#########.",
    "..LL...MM..",
    "..LL...MM..",
];

// Rùa ngồi bệt gõ laptop, cùng vị trí với rùa đứng để chuyển trạng thái không bị nhảy
const SIT = [
    "..#####...........",
    ".#S#S#S#.HH....DD.",
    ".#######HEH....DD.",
    ".#######HHH....DG.",
    ".##########P.Q.DD.",
    ".LL#####MM.BBBBBBB",
];

const COLORS = {
    "#": "#3E7C4F",
    S: "#6FAF7B",
    H: "#A8D08D",
    E: "#1B1B18",
    L: "#A8D08D",
    M: "#A8D08D",
    P: "#A8D08D",
    Q: "#A8D08D",
    D: "#5B6270",
    G: "#C9CED8",
    B: "#8A91A0",
};

const CLASSES = {
    E: "mascot-eye",
    L: "mascot-leg-a",
    M: "mascot-leg-b",
    P: "mascot-hand-a",
    Q: "mascot-hand-b",
    G: "mascot-logo",
};

// Z (mắt nhắm) cần màu riêng
COLORS.Z = "#1B1B18";

// Rùa ngủ: Z là mắt nhắm (không chớp)
const SLEEP = [
    "..#####....",
    ".#S#S#S#...",
    ".########HH",
    ".#######HZH",
    ".LL#####MM.",
];

// Chữ z nhỏ bay lên, mỗi chữ 3x3 ô thu còn nửa kích thước
const Z_CELLS = [[0, 0], [1, 0], [2, 0], [1, 1], [0, 2], [1, 2], [2, 2]];

const MAX_BOXES = 3;
const GROUND = 7; // hàng mặt đất chung cho mọi trạng thái

function cells(rows, dy = 0, only, still = false) {
    return rows.flatMap((row, y) =>
        [...row].map((ch, x) =>
            ch === "." || (only && !only.includes(ch)) ? null : (
                <rect
                    key={`${x}-${y}`}
                    className={still ? undefined : CLASSES[ch]}
                    x={x}
                    y={y + dy}
                    width="1"
                    height="1"
                    fill={COLORS[ch]}
                />
            ),
        ),
    );
}

// Gói hàng 3x2 đặt trên mai, tầng k chồng lên tầng k-1
function Box({ level }) {
    const y = -2 * (level + 1);
    return (
        <g className="mascot-box-in">
            <rect x="2" y={y} width="3" height="2" fill="#C48A4A" />
            <rect x="3" y={y} width="1" height="2" fill="#E8C98F" />
            <rect x="2" y={y + 1} width="3" height="1" fill="#A9733A" />
        </g>
    );
}

const NON_TEXT_INPUT = ["checkbox", "radio", "button", "submit", "file", "range"];

function isTextField(el) {
    return (
        el &&
        (el.tagName === "TEXTAREA" ||
            (el.tagName === "INPUT" && !NON_TEXT_INPUT.includes(el.type)))
    );
}

// 3 trạng thái: gõ laptop (đang nhập vào ô chữ), vác gói (giỏ có hàng), đứng yên
function Mascot({ size = 108, className = "" }) {
    const { cartCount } = useCart();
    const [typing, setTyping] = useState(false);

    useEffect(() => {
        const onIn = (e) => setTyping(isTextField(e.target));
        const onOut = () => setTyping(false);
        document.addEventListener("focusin", onIn);
        document.addEventListener("focusout", onOut);
        return () => {
            document.removeEventListener("focusin", onIn);
            document.removeEventListener("focusout", onOut);
        };
    }, []);

    const boxes = Math.min(cartCount, MAX_BOXES);
    // Trang chi tiết sản phẩm: rùa gõ laptop như đang tìm hiểu sản phẩm
    const { pathname } = useLocation();
    const onDetail = pathname.startsWith("/products/");
    const mood = typing || onDetail ? "typing" : boxes > 0 ? "carry" : "sleep";
    const label = {
        typing: "Chú rùa đang gõ laptop",
        carry: "Chú rùa đang vác hàng",
        sleep: "Chú rùa đang ngủ",
    }[mood];

    return (
        <svg
            viewBox="0 -6 18 13"
            width={size}
            height={(size * 13) / 18}
            shapeRendering="crispEdges"
            role="img"
            aria-label={label}
            className={`overflow-visible ${className}`}
        >
            {mood === "typing" ? (
                <>
                    <g className="mascot-bob">{cells(SIT, GROUND - SIT.length, "#SHELM")}</g>
                    {cells(SIT, GROUND - SIT.length, "DGB")}
                    {cells(SIT, GROUND - SIT.length, "PQ")}
                    {[12, 13, 14].map((x, i) => (
                        <rect
                            key={x}
                            className="mascot-spark"
                            style={{ animationDelay: `${i * 0.4}s` }}
                            x={x}
                            y={GROUND - SIT.length + 3}
                            width="1"
                            height="1"
                            fill="#2F5233"
                        />
                    ))}
                </>
            ) : mood === "sleep" ? (
                <>
                    <g>
                        {cells(SLEEP, GROUND - SLEEP.length, undefined, true)}
                    </g>
                    {[0, 1].map((i) => (
                        <g
                            key={i}
                            className="mascot-zzz"
                            style={{ animationDelay: `${i * 1.2}s` }}
                        >
                            {Z_CELLS.map(([x, y]) => (
                                <rect
                                    key={`${x}-${y}`}
                                    x={9 + x / 2}
                                    y={2.5 + y / 2}
                                    width="0.5"
                                    height="0.5"
                                    fill="#6B6B65"
                                />
                            ))}
                        </g>
                    ))}
                </>
            ) : (
                <g className="mascot-bob">
                    {cells(STAND, GROUND - STAND.length)}
                    {Array.from({ length: boxes }, (_, i) => (
                        <Box key={i} level={i} />
                    ))}
                </g>
            )}
        </svg>
    );
}

export default Mascot;
