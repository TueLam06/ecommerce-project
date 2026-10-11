import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

function Header({ title }) {
    const { cartCount } = useCart();
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    const linkClass =
        "text-[#1A1A18] hover:text-[#2F5233] transition-colors font-medium";

    return (
        <nav className="flex items-center justify-between px-6 py-4 bg-[#FAFAF8] border-b border-[#D9D6CC]">
            <Link
                to="/"
                className="text-xl text-[#1A1A18]"
                style={{ fontFamily: "'Fraunces', serif" }}
            >
                {title}
            </Link>

            <div className="flex items-center gap-6">
                <Link to="/" className={linkClass}>
                    Trang chủ
                </Link>
                <Link to="/products" className={linkClass}>
                    Sản phẩm
                </Link>
                <Link to="/chat" className={linkClass}>
                    Chatbot
                </Link>
                <Link to="/cart" className={linkClass}>
                    Giỏ hàng {cartCount > 0 ? `(${cartCount})` : ""}
                </Link>

                {user ? (
                    <div className="flex items-center gap-4">
                        {user.role === "admin" && (
                            <Link
                                to="/admin"
                                className="rounded-md border border-[#2F5233] text-[#2F5233] px-4 py-2 text-sm font-medium hover:bg-[#2F5233] hover:text-[#F5F3EE] transition-colors"
                            >
                                Trang quản trị
                            </Link>
                        )}
                        <Link to="/orders" className={linkClass}>
                            Đơn hàng của tôi
                        </Link>
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
                ) : (
                    <>
                        <Link to="/track-order" className={linkClass}>
                            Tra cứu đơn
                        </Link>
                        <Link
                            to="/login"
                            className="rounded-md bg-[#2F5233] text-[#F5F3EE] px-4 py-2 text-sm font-medium hover:bg-[#244027] transition-colors"
                        >
                            Đăng nhập
                        </Link>
                    </>
                )}
            </div>
        </nav>
    );
}

export default Header;