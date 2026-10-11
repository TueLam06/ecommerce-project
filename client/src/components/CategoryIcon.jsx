// Icon nét mảnh cho ô danh mục ở trang Sản phẩm, chọn theo slug của category
const ICONS = {
    all: (
        <>
            <rect x="5" y="5" width="9" height="9" rx="1.5" />
            <rect x="18" y="5" width="9" height="9" rx="1.5" />
            <rect x="5" y="18" width="9" height="9" rx="1.5" />
            <rect x="18" y="18" width="9" height="9" rx="1.5" />
        </>
    ),
    laptop: (
        <>
            <rect x="6" y="7" width="20" height="13" rx="1.5" />
            <path d="M3 24h26" />
        </>
    ),
    "man-hinh": (
        <>
            <rect x="4" y="6" width="24" height="15" rx="1.5" />
            <path d="M16 21v4M10 26h12" />
        </>
    ),
    "phu-kien": (
        <>
            <path d="M5 13a4.5 4.5 0 0 1 9 0" />
            <rect x="4" y="12.5" width="2.5" height="4" rx="1" />
            <rect x="12.5" y="12.5" width="2.5" height="4" rx="1" />
            <rect x="18" y="5" width="9" height="9" rx="1" />
            <rect x="5" y="19" width="9" height="8" rx="1" />
            <circle cx="22.5" cy="23" r="4.5" />
        </>
    ),
    // Danh mục mới chưa có icon riêng
    default: (
        <>
            <path d="M16 4l11 6v12l-11 6-11-6V10z" />
            <path d="M5 10l11 6 11-6M16 16v12" />
        </>
    ),
};

function CategoryIcon({ slug, className = "" }) {
    return (
        <svg
            viewBox="0 0 32 32"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className={className}
        >
            {ICONS[slug] || ICONS.default}
        </svg>
    );
}

export default CategoryIcon;
