import { useEffect, useRef, useState } from "react";

// Hiện phần tử khi cuộn tới: from = "up" | "left" | "right", delay tính bằng ms
function Reveal({ as: Tag = "div", from = "up", delay = 0, className = "", children, ...rest }) {
    const ref = useRef(null);
    // Trình duyệt không hỗ trợ IntersectionObserver thì hiện luôn
    const [visible, setVisible] = useState(() => !("IntersectionObserver" in window));

    useEffect(() => {
        const el = ref.current;
        if (!el || visible) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                // Hiện cả khi đã cuộn vượt qua (vd. nhảy thẳng xuống cuối trang)
                if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
                    setVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [visible]);

    return (
        <Tag
            ref={ref}
            className={`reveal reveal-${from} ${visible ? "is-visible" : ""} ${className}`}
            style={{ "--d": `${delay}ms` }}
            {...rest}
        >
            {children}
        </Tag>
    );
}

export default Reveal;
