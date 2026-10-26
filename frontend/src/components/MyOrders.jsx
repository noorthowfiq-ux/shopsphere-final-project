
import { useEffect, useState } from "react";
import { ArrowLeft, Package, RefreshCw } from "lucide-react";
import api from "../api/axios";

function formatPrice(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatDate(value) {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

function getStatusClass(status) {
  const normalized = String(status || "Placed").toLowerCase();

  if (normalized === "delivered") return "delivered";
  if (normalized === "cancelled") return "cancelled";
  if (normalized === "shipped") return "shipped";
  if (normalized === "processing") return "processing";

  return "placed";
}

export default function MyOrders({ onBack }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadOrders() {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/orders/myorders");
      const data = response.data;

      const orderList = Array.isArray(data)
        ? data
        : data.orders || data.data || [];

      setOrders(orderList);
    } catch (err) {
      console.error("Unable to load orders:", err);
      setError(
        err.response?.status === 401
          ? "Please sign in to view your orders."
          : err.response?.data?.message ||
              "Unable to load your orders. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  return (
    <main className="my-orders-page">
      <button className="my-orders-back" onClick={onBack}>
        <ArrowLeft size={18} />
        Back to shop
      </button>

      <div className="my-orders-heading">
        <div>
          <p className="my-orders-eyebrow">YOUR ACCOUNT</p>
          <h1>My Orders</h1>
          <p>Track your purchases and check order details.</p>
        </div>

        <button
          className="my-orders-refresh"
          onClick={loadOrders}
          disabled={loading}
          aria-label="Refresh orders"
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="my-orders-message">
          Loading your orders...
        </div>
      ) : error ? (
        <div className="my-orders-message my-orders-error">
          <p>{error}</p>
          <button onClick={loadOrders}>Try again</button>
        </div>
      ) : orders.length === 0 ? (
        <div className="my-orders-empty">
          <Package size={42} strokeWidth={1.5} />
          <h2>No orders yet</h2>
          <p>Your orders will appear here after checkout.</p>
          <button onClick={onBack}>Explore products</button>
        </div>
      ) : (
        <div className="my-orders-list">
          {orders.map((order) => (
            <article
              className="my-order-card"
              key={order._id || order.id}
            >
              <div className="my-order-top">
                <div>
                  <p className="my-order-label">ORDER ID</p>
                  <p className="my-order-id">
                    {order._id || order.id || "Unavailable"}
                  </p>
                  <p className="my-order-date">
                    Placed on {formatDate(order.createdAt)}
                  </p>
                </div>

                <span
                  className={`my-order-status ${getStatusClass(
                    order.orderStatus
                  )}`}
                >
                  {order.orderStatus || "Placed"}
                </span>
              </div>

              <div className="my-order-items">
                {(order.items || []).map((item, index) => {
                  const product = item.product || item.productId;
                  const name =
                    item.name ||
                    (typeof product === "object" && product?.name) ||
                    "Product";

                  return (
                    <div
                      className="my-order-item"
                      key={item._id || `${name}-${index}`}
                    >
                      <div>
                        <p>{name}</p>
                        <span>Quantity: {item.quantity || 1}</span>
                      </div>
                      <strong>
                        {formatPrice(
                          item.price ??
                            item.unitPrice ??
                            product?.price
                        )}
                      </strong>
                    </div>
                  );
                })}
              </div>

              <div className="my-order-bottom">
                <div>
                  <p className="my-order-label">PAYMENT</p>
                  <p>{order.paymentMethod || "COD"}</p>
                  <span>
                    {order.paymentStatus || "Pending"}
                  </span>
                </div>

                <div className="my-order-total">
                  <p className="my-order-label">ORDER TOTAL</p>
                  <strong>
                    {formatPrice(
                      order.totalPrice ??
                        order.total ??
                        order.amount
                    )}
                  </strong>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
