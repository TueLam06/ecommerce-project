import { useEffect, useId, useRef, useState } from "react";

// Bỏ dấu tiếng Việt để tìm kiếm: "Bến Thành" -> "ben thanh", "Đống Đa" -> "dong da"
function normalize(text) {
    return text
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .toLowerCase()
        .trim();
}

// Dropdown có ô tìm kiếm (không cần gõ dấu), menu mờ dần/đậm dần như Dropdown
// options: [{ value, label, hint? }] — hint hiển thị mờ bên phải (vd. "phường")
function Combobox({
    id,
    value,
    options,
    onChange,
    onClose,
    placeholder = "Chọn",
    searchPlaceholder = "Tìm kiếm...",
    searchable = true,
    disabled = false,
    invalid = false,
    describedBy,
    ariaLabel,
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [activeIndex, setActiveIndex] = useState(0);
    const rootRef = useRef(null);
    const buttonRef = useRef(null);
    const searchRef = useRef(null);
    const listRef = useRef(null);
    const listId = useId();

    const selected = options.find((o) => o.value === value);
    const q = normalize(query);
    const filtered = q
        ? options.filter((o) => normalize(`${o.label} ${o.hint || ""}`).includes(q))
        : options;

    const close = (refocus = true) => {
        setOpen(false);
        if (refocus) buttonRef.current?.focus();
        onClose?.();
    };

    // Bấm ra ngoài thì đóng
    useEffect(() => {
        if (!open) return;
        const handleClick = (e) => {
            if (!rootRef.current?.contains(e.target)) {
                setOpen(false);
                onClose?.();
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [open, onClose]);

    // Mở ra thì focus ô tìm kiếm (đợi menu hiện rồi mới focus được)
    useEffect(() => {
        if (open && searchable) {
            const t = setTimeout(() => searchRef.current?.focus(), 0);
            return () => clearTimeout(t);
        }
    }, [open, searchable]);

    // Giữ mục đang chọn/đang trỏ trong tầm nhìn khi di chuyển bằng phím
    useEffect(() => {
        if (!open) return;
        listRef.current
            ?.querySelector(`[data-index="${activeIndex}"]`)
            ?.scrollIntoView({ block: "nearest" });
    }, [open, activeIndex]);

    const openMenu = () => {
        if (disabled) return;
        setQuery("");
        setActiveIndex(Math.max(0, options.findIndex((o) => o.value === value)));
        setOpen(true);
    };

    const choose = (option) => {
        onChange(option.value);
        close();
    };

    const handleKeyDown = (e) => {
        if (!open) {
            if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
                e.preventDefault();
                openMenu();
            }
            return;
        }
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter" || (e.key === " " && !searchable)) {
            e.preventDefault();
            if (filtered[activeIndex]) choose(filtered[activeIndex]);
        } else if (e.key === "Escape") {
            e.preventDefault();
            close();
        } else if (e.key === "Tab") {
            close(false);
        }
    };

    const activeId = open && filtered[activeIndex] ? `${listId}-${activeIndex}` : undefined;

    return (
        <div ref={rootRef} className="relative">
            <button
                ref={buttonRef}
                id={id}
                type="button"
                disabled={disabled}
                onClick={() => (open ? close() : openMenu())}
                onKeyDown={handleKeyDown}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-controls={listId}
                aria-activedescendant={searchable ? undefined : activeId}
                aria-invalid={invalid}
                aria-describedby={describedBy}
                aria-label={ariaLabel}
                className={`flex w-full items-center justify-between gap-2 px-3.5 py-2.5 bg-transparent border rounded-sm text-left outline-none focus:ring-1 transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                    invalid
                        ? "border-[#B3413B] focus:border-[#B3413B] focus:ring-[#B3413B]"
                        : "border-[#DAD6C9] focus:border-[#2F5233] focus:ring-[#2F5233]"
                }`}
            >
                <span className={`truncate ${selected ? "text-[#1F2420]" : "text-[#B0AC9C]"}`}>
                    {selected ? selected.label : placeholder}
                </span>
                <svg
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden="true"
                    className={`h-4 w-4 shrink-0 text-[#6B6F63] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                >
                    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>

            <div
                className={`dropdown-menu absolute left-0 right-0 top-full z-20 mt-1.5 rounded-lg border border-[#E5E3DC] bg-white shadow-lg shadow-black/5 ${
                    open ? "is-open" : ""
                }`}
            >
                {searchable && (
                    <div className="border-b border-[#EFEDE6] p-2">
                        <input
                            ref={searchRef}
                            type="text"
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                setActiveIndex(0);
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder={searchPlaceholder}
                            role="combobox"
                            aria-expanded={open}
                            aria-controls={listId}
                            aria-activedescendant={activeId}
                            aria-autocomplete="list"
                            aria-label={searchPlaceholder}
                            tabIndex={open ? 0 : -1}
                            className="w-full rounded-sm border border-[#E5E3DC] px-3 py-2 text-sm text-[#1F2420] placeholder:text-[#B0AC9C] outline-none focus:border-[#2F5233]"
                        />
                    </div>
                )}

                <ul ref={listRef} id={listId} role="listbox" className="max-h-64 overflow-y-auto py-1.5">
                    {filtered.length === 0 && (
                        <li className="px-4 py-3 text-sm text-[#6B6F63]">Không tìm thấy kết quả</li>
                    )}
                    {filtered.map((opt, i) => {
                        const isSelected = opt.value === value;
                        return (
                            <li
                                key={opt.value}
                                id={`${listId}-${i}`}
                                data-index={i}
                                role="option"
                                aria-selected={isSelected}
                                onMouseEnter={() => setActiveIndex(i)}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => choose(opt)}
                                className={`flex cursor-pointer items-center justify-between gap-3 px-4 py-2 text-sm ${
                                    i === activeIndex ? "bg-[#F5F3EE]" : ""
                                } ${isSelected ? "font-medium text-[#2F5233]" : "text-[#3A3A36]"}`}
                            >
                                <span>{opt.label}</span>
                                <span className="flex items-center gap-2 text-xs text-[#9A968A]">
                                    {opt.hint}
                                    {isSelected && (
                                        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="h-4 w-4 text-[#2F5233]">
                                            <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    )}
                                </span>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
}

export default Combobox;
