import Cart from "../components/Cart";
import { useCart } from "../context/CartContext";

function CartPage() {
    const {cart, formattedTotal, increaseQuantity, decreaseQuantity, removeFromCart} = useCart()
    return (
        <main className="min-h-screen bg-[#FAFAF8]">
            <section className="max-w-6xl mx-auto px-6 py-10 md:py-14">
                <Cart
                    cart={cart}
                    total={formattedTotal}
                    onIncrease={increaseQuantity}
                    onDecrease={decreaseQuantity}
                    onRemove={removeFromCart}
                />
            </section>
        </main>
    )
}

export default CartPage;