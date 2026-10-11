import { Outlet, NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const navItemClass = ({ isActive }) =>
    `block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        isActive
            ? "bg-[#2F5233] text-[#F5F3EE]"
            : "text-[#6B6B65] hover:bg-[#EFEDE6] hover:text-[#1A1A18]"
    }`;

export default function AdminLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    return (
        <div className="min-h-screen bg-[#FAFAF8]">
            {/* Header ngang trên cùng */}
            <nav className="flex items-center justify-between px-6 py-4 bg-[#FAFAF8] border-b border-[#D9D6CC]">
                <Link
                    to="/admin"
                    className="text-xl text-[#1A1A18]"
                    style={{ fontFamily: "'Fraunces', serif" }}
                >
                    Stuff Corner - Admin
                </Link>

                <div className="flex items-center gap-6">
                    <Link
                        to="/"
                        className="rounded-md border border-[#2F5233] text-[#2F5233] px-4 py-2 text-sm font-medium hover:bg-[#2F5233] hover:text-[#F5F3EE] transition-colors"
                    >
                        Xem cửa hàng
                    </Link>

                    {user && (
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-[#6B6B65]">
                                Xin chào, {user.name}
                            </span>
                            <button
                                onClick={handleLogout}
                                className="rounded-md bg-[#2F5233] text-[#F5F3EE] px-4 py-2 text-sm font-medium hover:bg-[#244027] transition-colors"
                            >
                                Đăng xuất
                            </button>
                        </div>
                    )}
                </div>
            </nav>

            {/* Sidebar + nội dung */}
            <div className="flex">
                <aside className="w-56 shrink-0 border-r border-[#E5E3DC] bg-white px-4 py-6 min-h-[calc(100vh-65px)]">
                    <nav className="space-y-1">
                        <NavLink to="/admin" end className={navItemClass}>
                            Trang chủ
                        </NavLink>
                        <NavLink to="/admin/products" className={navItemClass}>
                            Sản phẩm
                        </NavLink>
                        <NavLink to="/admin/orders" className={navItemClass}>
                            Đơn hàng
                        </NavLink>
                    </nav>
                </aside>
                <main className="flex-1 px-8 py-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}