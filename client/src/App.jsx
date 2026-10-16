import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "./context/CartProvider";
import { AuthProvider } from "./context/AuthContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import ChatPage from "./pages/ChatPage";
import ProductsPage from "./pages/ProductsPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import OrderHistoryPage from "./pages/OrderHistoryPage";
import MyOrderDetailPage from "./pages/MyOrderDetailPage";
import TrackOrderPage from "./pages/TrackOrderPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";

import PrivateRoute from "./routes/PrivateRoute";
import AdminRoute from "./routes/AdminRoute";
import AdminLayout from "./admin/layout/AdminLayout";
import ProductList from "./admin/pages/ProductList";
import ProductForm from "./admin/pages/ProductForm";
import AdminHome from "./admin/pages/AdminHome";
import OrderList from "./admin/pages/OrderList";
import OrderDetail from "./admin/pages/OrderDetail";

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <CartProvider>
                    <Routes>
                        <Route
                            path="/*"
                            element={
                                <div className="min-h-screen flex flex-col">
                                    <Header title="Stuff Corner" />
                                    <main className="flex-1">
                                        <Routes>
                                            <Route path="/" element={<HomePage />} />
                                            <Route path="/products" element={<ProductsPage />} />
                                            <Route path="/products/:id" element={<ProductDetailPage />} />
                                            <Route path="/chat" element={<ChatPage />} />
                                            <Route path="/cart" element={<CartPage />} />
                                            <Route path="/checkout" element={<CheckoutPage />} />
                                            <Route path="/track-order" element={<TrackOrderPage />} />
                                            <Route path="/login" element={<LoginPage h/>} />
                                            <Route path="/register" element={<RegisterPage />} />
                                            <Route path="/verify-email" element={<VerifyEmailPage />} />
                                            <Route
                                                path="/orders"
                                                element={<PrivateRoute><OrderHistoryPage /></PrivateRoute>}
                                            />
                                            <Route
                                                path="/orders/:id"
                                                element={<PrivateRoute><MyOrderDetailPage /></PrivateRoute>}
                                            />
                                        </Routes>
                                    </main>
                                    <Footer title="Stuff Corner" />
                                </div>
                            }
                        />

                        <Route
                            path="/admin/*"
                            element={
                                <AdminRoute>
                                    <AdminLayout />
                                </AdminRoute>
                            }
                        >
                            <Route index element={<AdminHome />} />
                            <Route path="products" element={<ProductList />} />
                            <Route path="products/new" element={<ProductForm />} />
                            <Route path="products/:id/edit" element={<ProductForm />} />
                            <Route path="orders" element={<OrderList />} />
                            <Route path="orders/:id" element={<OrderDetail />} />
                        </Route>
                    </Routes>
                </CartProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}
export default App;