
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  MapPin,
  Package,
} from "lucide-react";
import api from "../api/axios";

const emptyAddress = {
  fullName: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
};

export default function Checkout({ onBack, onOrderPlaced }) {
  const [address, setAddress] = useState(emptyAddress);
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCart() {
      try {
        const response = await api.get("/cart");
        setCart(response.data.cart || response.data);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Unable to load your cart."
        );
      } finally {
        setLoading(false);
      }
    }

    loadCart();
  }, []);

  const items = cart?.items || [];

  const subtotal = items.reduce((total, item) => {
    const product = item.product || item;
    const price = Number(product.price ?? item.price ?? 0);

    return total + price * item.quantity;
  }, 0);

  const shipping = 0;
  const total = subtotal + shipping;

  function updateAddress(event) {
    const { name, value } = event.target;

    setAddress((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!address.fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (items.length === 0) {
      setError(
        "Your cart is empty. Add a product before checkout."
      );
      return;
    }

    const cleanedAddress = {
      fullName: address.fullName.trim(),
      phone: address.phone.trim(),
      address: address.address.trim(),
      city: address.city.trim(),
      state: address.state.trim(),
      postalCode: address.postalCode.trim(),
      country: address.country.trim(),
    };

    setSubmitting(true);

    try {
      const response = await api.post("/orders", {
        ...cleanedAddress,
        shippingAddress: cleanedAddress,
        paymentMethod: "COD",
      });

      const order = response.data.order || response.data;

      onOrderPlaced(order);
    } catch (err) {
      console.error(
        "Order submission failed:",
        err.response?.data || err.message
      );

      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Unable to place your order. Please check your details and try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="checkout-page">
        <p className="state-message">Loading checkout...</p>
      </main>
    );
  }

  return (
    <main className="checkout-page">
      <button
        type="button"
        className="checkout-back"
        onClick={onBack}
      >
        <ArrowLeft size={17} />
        Back to shopping
      </button>

      <div className="checkout-heading">
        <span className="eyebrow">SECURE CHECKOUT</span>
        <h1>Complete your order</h1>
        <p>
          Enter your delivery details and choose Cash on Delivery.
        </p>
      </div>

      {error && (
        <p className="checkout-error" role="alert">
          {error}
        </p>
      )}

      {items.length === 0 ? (
        <section className="checkout-empty">
          <Package size={38} />
          <h2>Your cart is empty</h2>
          <p>
            Add products to your cart before placing an order.
          </p>
          <button
            type="button"
            className="primary-button"
            onClick={onBack}
          >
            Return to store
          </button>
        </section>
      ) : (
        <div className="checkout-layout">
          <form
            className="checkout-form"
            onSubmit={handleSubmit}
          >
            <section className="checkout-section">
              <div className="checkout-section-title">
                <MapPin size={20} />
                <h2>Delivery address</h2>
              </div>

              <div className="checkout-fields">
                <label>
                  Full name
                  <input
                    type="text"
                    name="fullName"
                    value={address.fullName}
                    onChange={updateAddress}
                    autoComplete="name"
                    required
                  />
                </label>

                <label>
                  Phone number
                  <input
                    type="tel"
                    name="phone"
                    value={address.phone}
                    onChange={updateAddress}
                    autoComplete="tel"
                    pattern="[0-9+() -]{7,20}"
                    title="Enter a valid phone number."
                    required
                  />
                </label>

                <label className="checkout-full-width">
                  House number, street and area
                  <textarea
                    name="address"
                    value={address.address}
                    onChange={updateAddress}
                    autoComplete="street-address"
                    rows={3}
                    required
                  />
                </label>

                <label>
                  City
                  <input
                    type="text"
                    name="city"
                    value={address.city}
                    onChange={updateAddress}
                    autoComplete="address-level2"
                    required
                  />
                </label>

                <label>
                  State
                  <input
                    type="text"
                    name="state"
                    value={address.state}
                    onChange={updateAddress}
                    autoComplete="address-level1"
                    required
                  />
                </label>

                <label>
                  Postal code
                  <input
                    type="text"
                    name="postalCode"
                    value={address.postalCode}
                    onChange={updateAddress}
                    autoComplete="postal-code"
                    inputMode="numeric"
                    required
                  />
                </label>

                <label>
                  Country
                  <input
                    type="text"
                    name="country"
                    value={address.country}
                    onChange={updateAddress}
                    autoComplete="country-name"
                    required
                  />
                </label>
              </div>
            </section>

            <section className="checkout-section">
              <div className="checkout-section-title">
                <Package size={20} />
                <h2>Payment method</h2>
              </div>

              <div className="payment-option">
                <div className="payment-radio" />
                <div>
                  <strong>Cash on Delivery</strong>
                  <p>Pay when your order arrives.</p>
                </div>
                <span>COD</span>
              </div>
            </section>

            <button
              className="place-order-button"
              type="submit"
              disabled={submitting || items.length === 0}
            >
              {submitting
                ? "Placing order..."
                : `Place order · ₹${total.toLocaleString("en-IN")}`}
            </button>
          </form>

          <aside className="checkout-summary">
            <h2>Order summary</h2>

            <div className="checkout-summary-items">
              {items.map((item, index) => {
                const product = item.product || item;
                const productId = product._id || product.id || index;
                const price = Number(
                  product.price ?? item.price ?? 0
                );
                const name =
                  product.name || item.name || "Product";

                return (
                  <div
                    className="checkout-summary-item"
                    key={productId}
                  >
                    <div className="checkout-product-image">
                      {product.image || item.image ? (
                        <img
                          src={product.image || item.image}
                          alt={name}
                        />
                      ) : (
                        <Package size={20} />
                      )}

                      <span>{item.quantity}</span>
                    </div>

                    <div className="checkout-summary-name">
                      <strong>{name}</strong>
                      <span>Quantity: {item.quantity}</span>
                    </div>

                    <strong>
                      ₹
                      {(price * item.quantity).toLocaleString(
                        "en-IN"
                      )}
                    </strong>
                  </div>
                );
              })}
            </div>

            <div className="checkout-total-row">
              <span>Subtotal</span>
              <span>
                ₹{subtotal.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="checkout-total-row">
              <span>Shipping</span>
              <span>
                {shipping === 0
                  ? "Free"
                  : `₹${shipping.toLocaleString("en-IN")}`}
              </span>
            </div>

            <div className="checkout-grand-total">
              <span>Total</span>
              <strong>
                ₹{total.toLocaleString("en-IN")}
              </strong>
            </div>

            <p className="checkout-summary-note">
              <CheckCircle2 size={16} />
              Your order will be recorded after successful submission.
            </p>
          </aside>
        </div>
      )}
    </main>
  );
}
