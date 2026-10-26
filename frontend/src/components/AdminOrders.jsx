
import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import "./AdminOrders.css";

const STATUSES = [
  "Placed",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

const shortId = (id) => String(id || "").slice(-8).toUpperCase();

const formatDate = (date) => {
  if (!date) return "Date unavailable";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Date unavailable";

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const statusClass = (status) =>
  String(status || "Placed").toLowerCase();

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingId, setUpdatingId] = useState("");
  const [updateError, setUpdateError] = useState("");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/orders/admin/all");
      const fetchedOrders = response.data.orders || [];

      setOrders(fetchedOrders);

      setSelectedOrder((current) => {
        if (!current) return null;
        return (
          fetchedOrders.find((order) => order._id === current._id) ||
          null
        );
      });
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load orders. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const stats = useMemo(() => {
    return {
      total: orders.length,
      processing: orders.filter((o) =>
        ["Placed", "Processing"].includes(o.orderStatus)
      ).length,
      shipped: orders.filter((o) => o.orderStatus === "Shipped").length,
      delivered: orders.filter((o) => o.orderStatus === "Delivered").length,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase();

    return [...orders]
      .filter((order) => filter === "All" || order.orderStatus === filter)
      .filter((order) => {
        if (!term) return true;

        const searchable = [
          order._id,
          shortId(order._id),
          order.user?.name,
          order.user?.email,
          order.paymentMethod,
          order.orderStatus,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchable.includes(term);
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      );
  }, [orders, search, filter]);

  const updateStatus = async (orderId, orderStatus) => {
    const previousOrder = orders.find((order) => order._id === orderId);

    if (
      !previousOrder ||
      ["Delivered", "Cancelled"].includes(previousOrder.orderStatus)
    ) {
      return;
    }

    setUpdatingId(orderId);
    setUpdateError("");

    try {
      await api.patch(`/orders/admin/${orderId}/status`, { orderStatus });

      const updatedOrders = orders.map((order) =>
        order._id === orderId ? { ...order, orderStatus } : order
      );

      setOrders(updatedOrders);

      setSelectedOrder((current) =>
        current?._id === orderId
          ? { ...current, orderStatus }
          : current
      );
    } catch (err) {
      setUpdateError(
        err.response?.data?.message || "Could not update this order."
      );
    } finally {
      setUpdatingId("");
    }
  };

  if (loading) {
    return (
      <main className="admin-orders-page">
        <div className="ao-loading">
          <span className="ao-spinner" />
          <p>Loading your orders...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="admin-orders-page">
        <div className="ao-error-panel">
          <h2>We couldn't load your orders</h2>
          <p>{error}</p>
          <button className="ao-primary-button" onClick={fetchOrders}>
            Try again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-orders-page">
      <div className="ao-container">
        <header className="ao-header">
          <div>
            <div className="ao-eyebrow">SHOPSPHERE / MANAGEMENT</div>
            <h1>Orders</h1>
            <p>Track, review, and manage customer purchases.</p>
          </div>

          <button
            className="ao-refresh-button"
            onClick={fetchOrders}
            disabled={loading}
          >
            <span aria-hidden="true">↻</span> Refresh
          </button>
        </header>

        <section className="ao-stats" aria-label="Order statistics">
          <article className="ao-stat-card">
            <span className="ao-stat-label">Total orders</span>
            <strong>{stats.total}</strong>
            <span className="ao-stat-note">All customer orders</span>
          </article>

          <article className="ao-stat-card">
            <span className="ao-stat-label">In progress</span>
            <strong>{stats.processing}</strong>
            <span className="ao-stat-note">Placed or processing</span>
          </article>

          <article className="ao-stat-card">
            <span className="ao-stat-label">Shipped</span>
            <strong>{stats.shipped}</strong>
            <span className="ao-stat-note">On the way to customers</span>
          </article>

          <article className="ao-stat-card">
            <span className="ao-stat-label">Delivered</span>
            <strong>{stats.delivered}</strong>
            <span className="ao-stat-note">Successfully completed</span>
          </article>
        </section>

        {updateError && (
          <div className="ao-update-error" role="alert">
            {updateError}
            <button onClick={() => setUpdateError("")} aria-label="Dismiss error">
              ×
            </button>
          </div>
        )}

        <section className="ao-orders-panel">
          <div className="ao-panel-heading">
            <div>
              <h2>All orders</h2>
              <p>
                Showing {filteredOrders.length} of {orders.length} orders
              </p>
            </div>
            <span className="ao-live-indicator">
              <span /> Connected
            </span>
          </div>

          <div className="ao-toolbar">
            <label className="ao-search">
              <span aria-hidden="true">⌕</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search order ID, customer or email..."
                aria-label="Search orders"
              />
            </label>

            <label className="ao-filter">
              <span>Status</span>
              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                aria-label="Filter orders by status"
              >
                <option value="All">All statuses</option>
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="ao-empty">
              <div className="ao-empty-icon">▤</div>
              <h3>{orders.length ? "No matching orders" : "No orders yet"}</h3>
              <p>
                {orders.length
                  ? "Try another search or change the status filter."
                  : "Customer orders will appear here after checkout."}
              </p>
              {(search || filter !== "All") && (
                <button
                  className="ao-secondary-button"
                  onClick={() => {
                    setSearch("");
                    setFilter("All");
                  }}
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="ao-table-wrap">
              <table className="ao-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Payment</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th><span className="ao-visually-hidden">Details</span></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => {
                    const terminal = ["Delivered", "Cancelled"].includes(
                      order.orderStatus
                    );

                    return (
                      <tr key={order._id}>
                        <td>
                          <button
                            className="ao-order-id"
                            onClick={() => setSelectedOrder(order)}
                          >
                            #{shortId(order._id)}
                          </button>
                          <span className="ao-item-count">
                            {order.items?.length || 0}{" "}
                            {(order.items?.length || 0) === 1
                              ? "product"
                              : "products"}
                          </span>
                        </td>
                        <td>
                          <div className="ao-customer">
                            <span className="ao-avatar">
                              {(order.user?.name || "C")
                                .trim()
                                .charAt(0)
                                .toUpperCase()}
                            </span>
                            <div>
                              <strong>
                                {order.user?.name || "Unknown customer"}
                              </strong>
                              <span>{order.user?.email || "No email available"}</span>
                            </div>
                          </div>
                        </td>
                        <td className="ao-date">{formatDate(order.createdAt)}</td>
                        <td>
                          <span className="ao-payment-method">
                            {order.paymentMethod || "N/A"}
                          </span>
                          <span className="ao-payment-status">
                            {order.paymentStatus || "Pending"}
                          </span>
                        </td>
                        <td className="ao-total">
                          {money(order.totalPrice)}
                        </td>
                        <td>
                          <span
                            className={`ao-status ao-status-${statusClass(
                              order.orderStatus
                            )}`}
                          >
                            <span />
                            {order.orderStatus || "Placed"}
                          </span>
                        </td>
                        <td>
                          <button
                            className="ao-view-button"
                            onClick={() => setSelectedOrder(order)}
                            aria-label={`View order ${shortId(order._id)}`}
                          >
                            View <span aria-hidden="true">→</span>
                          </button>
                          {terminal && (
                            <span className="ao-visually-hidden">
                              This order is in a final status.
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <footer className="ao-panel-footer">
            <span>ShopSphere order management</span>
            <span>{filteredOrders.length} result(s)</span>
          </footer>
        </section>
      </div>

      {selectedOrder && (
        <div
          className="ao-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedOrder(null);
            }
          }}
        >
          <aside
            className="ao-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ao-drawer-title"
          >
            <div className="ao-drawer-header">
              <div>
                <span className="ao-eyebrow">ORDER DETAILS</span>
                <h2 id="ao-drawer-title">
                  #{shortId(selectedOrder._id)}
                </h2>
                <p>Placed on {formatDate(selectedOrder.createdAt)}</p>
              </div>
              <button
                className="ao-close-button"
                onClick={() => setSelectedOrder(null)}
                aria-label="Close order details"
              >
                ×
              </button>
            </div>

            <div className="ao-drawer-body">
              <section className="ao-detail-section">
                <h3>Order status</h3>
                <span
                  className={`ao-status ao-status-${statusClass(
                    selectedOrder.orderStatus
                  )}`}
                >
                  <span />
                  {selectedOrder.orderStatus || "Placed"}
                </span>

                <label className="ao-status-editor">
                  Update status
                  <select
                    value={selectedOrder.orderStatus || "Placed"}
                    disabled={
                      Boolean(updatingId) ||
                      ["Delivered", "Cancelled"].includes(
                        selectedOrder.orderStatus
                      )
                    }
                    onChange={(event) =>
                      updateStatus(selectedOrder._id, event.target.value)
                    }
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>

                {updatingId === selectedOrder._id && (
                  <p className="ao-saving-note">Saving status...</p>
                )}

                {["Delivered", "Cancelled"].includes(
                  selectedOrder.orderStatus
                ) && (
                  <p className="ao-saving-note">
                    This order has reached a final status and cannot be changed.
                  </p>
                )}
              </section>

              <section className="ao-detail-section">
                <h3>Customer</h3>
                <div className="ao-detail-customer">
                  <span className="ao-avatar ao-avatar-large">
                    {(selectedOrder.user?.name || "C")
                      .trim()
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                  <div>
                    <strong>
                      {selectedOrder.user?.name || "Unknown customer"}
                    </strong>
                    <p>{selectedOrder.user?.email || "No email available"}</p>
                  </div>
                </div>
              </section>

              <section className="ao-detail-section">
                <h3>Products ({selectedOrder.items?.length || 0})</h3>
                <div className="ao-detail-items">
                  {(selectedOrder.items || []).map((item, index) => (
                    <div className="ao-detail-item" key={`${selectedOrder._id}-${index}`}>
                      <div className="ao-product-placeholder">P</div>
                      <div className="ao-product-info">
                        <strong>{item.name || "Product"}</strong>
                        <span>
                          {money(item.price)} × {item.quantity || 0}
                        </span>
                      </div>
                      <strong>
                        {money(Number(item.price || 0) * Number(item.quantity || 0))}
                      </strong>
                    </div>
                  ))}
                </div>
              </section>

              <section className="ao-detail-section">
                <h3>Payment summary</h3>
                <div className="ao-summary-row">
                  <span>Payment method</span>
                  <strong>{selectedOrder.paymentMethod || "N/A"}</strong>
                </div>
                <div className="ao-summary-row">
                  <span>Payment status</span>
                  <strong>{selectedOrder.paymentStatus || "Pending"}</strong>
                </div>
                <div className="ao-summary-total">
                  <span>Order total</span>
                  <strong>{money(selectedOrder.totalPrice)}</strong>
                </div>
              </section>
            </div>

            <div className="ao-drawer-footer">
              <button
                className="ao-secondary-button"
                onClick={() => setSelectedOrder(null)}
              >
                Close details
              </button>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
};

export default AdminOrders;
