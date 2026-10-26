
import { useEffect, useState } from "react";
import { Minus, Plus, Trash2, X, ShoppingBag } from "lucide-react";
import api from "../api/axios";

export default function CartDrawer({ onClose, onCheckout }) {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  async function loadCart() {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/cart");
      setCart(response.data.cart || response.data);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load your cart."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCart();
  }, []);

  const items = cart?.items || [];

  const itemCount = items.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const subtotal = items.reduce((total, item) => {
    const product = item.product || item;
    return total + (product.price || item.price || 0) * item.quantity;
  }, 0);

  async function updateQuantity(item, quantity) {
    const product = item.product || item;
    const productId = product._id;

    if (!productId || quantity < 1) return;

    setBusyId(productId);
    setError("");

    try {
      await api.put(`/cart/${productId}`, { quantity });
      await loadCart();
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to update quantity."
      );
    } finally {
      setBusyId("");
    }
  }

  async function removeItem(item) {
    const product = item.product || item;
    const productId = product._id;

    if (!productId) return;

    setBusyId(productId);
    setError("");

    try {
      await api.delete(`/cart/${productId}`);
      await loadCart();
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to remove this item."
      );
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="cart-overlay" onClick={onClose}>
      <aside
        className="cart-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="cart-drawer-header">
          <div>
            <h2 id="cart-title">Your cart</h2>
            <p>{itemCount} {itemCount === 1 ? "item" : "items"}</p>
          </div>

          <button
            className="cart-icon-button"
            onClick={onClose}
            aria-label="Close cart"
          >
            <X size={21} />
          </button>
        </header>

        {loading ? (
          <p className="cart-message">Loading your cart...</p>
        ) : error && !cart ? (
          <p className="cart-error">{error}</p>
        ) : items.length === 0 ? (
          <div className="cart-empty">
            <ShoppingBag size={40} />
            <h3>Your cart is empty</h3>
            <p>Explore the collection and add something you love.</p>
            <button className="primary-button" onClick={onClose}>
              Continue shopping
            </button>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {items.map((item) => {
                const product = item.product || item;
                const productId = product._id;
                const price = product.price ?? item.price ?? 0;
                const name = product.name || item.name || "Product";
                const image = product.image || item.image;
                const busy = busyId === productId;

                return (
                  <article className="cart-item" key={productId}>
                    {image ? (
                      <img src={image} alt={name} />
                    ) : (
                      <div className="cart-item-placeholder">
                        <ShoppingBag size={22} />
                      </div>
                    )}

                    <div className="cart-item-details">
                      <h3>{name}</h3>
                      <p>₹{price.toLocaleString("en-IN")}</p>

                      <div className="cart-item-actions">
                        <div className="quantity-control">
                          <button
                            disabled={busy || item.quantity <= 1}
                            onClick={() =>
                              updateQuantity(item, item.quantity - 1)
                            }
                            aria-label={`Decrease ${name} quantity`}
                          >
                            <Minus size={14} />
                          </button>

                          <span>{item.quantity}</span>

                          <button
                            disabled={
                              busy ||
                              (typeof product.stock === "number" &&
                                item.quantity >= product.stock)
                            }
                            onClick={() =>
                              updateQuantity(item, item.quantity + 1)
                            }
                            aria-label={`Increase ${name} quantity`}
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        <button
                          className="remove-cart-item"
                          disabled={busy}
                          onClick={() => removeItem(item)}
                          aria-label={`Remove ${name}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <strong className="cart-line-total">
                      ₹{(price * item.quantity).toLocaleString("en-IN")}
                    </strong>
                  </article>
                );
              })}
            </div>

            {error && <p className="cart-error">{error}</p>}

            <div className="cart-summary">
              <div>
                <span>Subtotal</span>
                <strong>₹{subtotal.toLocaleString("en-IN")}</strong>
              </div>
              <p>Shipping and final total are confirmed at checkout.</p>
              <button
                className="cart-checkout-button"
                onClick={onCheckout}
              >
                Proceed to checkout
              </button>
              <button className="cart-continue-button" onClick={onClose}>
                Continue shopping
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
