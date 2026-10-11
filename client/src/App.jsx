import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "./context/CartProvider";
import { AuthProvider } from "./context/AuthContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import ChatPage from "./pages/ChatPage";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import CartPage from "./pages/CartPage";
import Checkout from "./pages/Checkout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import OrderHistory from "./pages/OrderHistory";
import MyOrderDetail from "./pages/MyOrderDetail";
import TrackOrder from "./pages/TrackOrder";

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
                                            <Route path="/" element={<Home />} />
                                            <Route path="/products" element={<Products />} />
                                            <Route path="/products/:id" element={<ProductDetail />} />
                                            <Route path="/chat" element={<ChatPage />} />
                                            <Route path="/cart" element={<CartPage />} />
                                            <Route path="/checkout" element={<Checkout />} />
                                            <Route path="/track-order" element={<TrackOrder />} />
                                            <Route path="/login" element={<LoginPage h/>} />
                                            <Route path="/register" element={<RegisterPage />} />
                                            <Route
                                                path="/orders"
                                                element={<PrivateRoute><OrderHistory /></PrivateRoute>}
                                            />
                                            <Route
                                                path="/orders/:id"
                                                element={<PrivateRoute><MyOrderDetail /></PrivateRoute>}
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