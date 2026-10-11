import { useEffect, useId, useRef, useState } from "react";

// Dropdown không khung, menu mờ dần/đậm dần khi đóng/mở
// options: [{ value, label }]
function Dropdown({ label, value, options, onChange }) {
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const rootRef = useRef(null);
    const buttonRef = useRef(null);
    const listId = useId();

    const selectedIndex = Math.max(0, options.findIndex((o) => o.value === value));
    const selected = options[selectedIndex];

    // Bấm ra ngoài thì đóng
    useEffect(() => {
        if (!open) return;
        const handleClick = (e) => {
            if (!rootRef.current?.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [open]);

    const openMenu = () => {
        setActiveIndex(selectedIndex);
        setOpen(true);
    };

    const choose = (index) => {
        onChange(options[index].value);
        setOpen(false);
        buttonRef.current?.focus();
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
            setActiveIndex((i) => (i + 1) % options.length);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((i) => (i - 1 + options.length) % options.length);
        } else if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            choose(activeIndex);
        } else if (e.key === "Escape") {
            e.preventDefault();
            setOpen(false);
        } else if (e.key === "Tab") {
            setOpen(false);
        }
    };

    return (
        <div ref={rootRef} className="relative text-sm">
            <button
                ref={buttonRef}
                type="button"
                onClick={() => (open ? setOpen(false) : openMenu())}
                onKeyDown={handleKeyDown}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-controls={listId}
                aria-activedescendant={open ? `${listId}-${activeIndex}` : undefined}
                className="flex items-center gap-1 py-1 focus:outline-none focus-visible:underline underline-offset-4"
            >
                <span className="text-[#6B6B65]">{label}</span>
                <span className="font-medium text-[#1A1A18]">{selected?.label}</span>
                <svg
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden="true"
                    className={`h-4 w-4 text-[#1A1A18] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                >
                    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>

            <ul
                id={listId}
                role="listbox"
                aria-label={label}
                className={`dropdown-menu absolute right-0 top-full z-20 mt-2 min-w-[190px] rounded-lg border border-[#E5E3DC] bg-white py-1.5 shadow-lg shadow-black/5 ${
                    open ? "is-open" : ""
                }`}
            >
                {options.map((opt, i) => {
                    const isSelected = i === selectedIndex;
                    return (
                        <li
                            key={opt.value}
                            id={`${listId}-${i}`}
                            role="option"
                            aria-selected={isSelected}
                            onMouseEnter={() => setActiveIndex(i)}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => choose(i)}
                            className={`flex cursor-pointer items-center justify-between gap-4 px-4 py-2 ${
                                i === activeIndex ? "bg-[#F5F3EE]" : ""
                            } ${isSelected ? "font-medium text-[#2F5233]" : "text-[#3A3A36]"}`}
                        >
                            {opt.label}
                            {isSelected && (
                                <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="h-4 w-4">
                                    <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            )}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

export default Dropdown;
