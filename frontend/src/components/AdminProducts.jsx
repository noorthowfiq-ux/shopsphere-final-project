import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Boxes,
  PackagePlus,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import api from "../api/axios";
import "./AdminProducts.css";

const emptyForm = {
  name: "",
  description: "",
  price: "",
  category: "",
  image: "",
  stock: "",
  brand: "",
};

function AdminProducts({ onBack }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function loadProducts() {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/products");
      setProducts(response.data.products || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load products. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  const stats = useMemo(() => {
    const totalUnits = products.reduce(
      (total, product) => total + Number(product.stock || 0),
      0
    );

    return {
      total: products.length,
      units: totalUnits,
      lowStock: products.filter(
        (product) => product.stock > 0 && product.stock <= 5
      ).length,
      outOfStock: products.filter(
        (product) => Number(product.stock) === 0
      ).length,
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch = [
        product.name,
        product.brand,
        product.category,
      ].some((value) =>
        String(value || "").toLowerCase().includes(query)
      );

      const stock = Number(product.stock || 0);

      const matchesStock =
        stockFilter === "all" ||
        (stockFilter === "available" && stock > 5) ||
        (stockFilter === "low" && stock > 0 && stock <= 5) ||
        (stockFilter === "out" && stock === 0);

      return matchesSearch && matchesStock;
    });
  }, [products, search, stockFilter]);

  function openCreateForm() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setNotice("");
    setShowForm(true);
  }

  function openEditForm(product) {
    setEditingId(product._id);
    setForm({
      name: product.name || "",
      description: product.description || "",
      price: String(product.price ?? ""),
      category: product.category || "",
      image: product.image || "",
      stock: String(product.stock ?? 0),
      brand: product.brand || "",
    });
    setError("");
    setNotice("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  }

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    const price = Number(form.price);
    const stock = Number(form.stock);

    if (!form.name.trim() || !form.description.trim()) {
      setError("Enter the product name and description.");
      return;
    }

    if (
      !form.category.trim() ||
      !form.brand.trim() ||
      !form.image.trim()
    ) {
      setError("Complete all required product fields.");
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      setError("Enter a valid non-negative price.");
      return;
    }

    if (
      form.stock.trim() === "" ||
      !Number.isInteger(stock) ||
      stock < 0
    ) {
      setError("Stock must be a non-negative whole number.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price,
      category: form.category.trim(),
      image: form.image.trim(),
      stock,
      brand: form.brand.trim(),
    };

    setSaving(true);

    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
        setNotice("Product updated successfully.");
      } else {
        await api.post("/products", payload);
        setNotice("Product added successfully.");
      }

      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      await loadProducts();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Unable to save the product. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(product) {
    const confirmed = window.confirm(
      `Delete "${product.name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingId(product._id);
    setError("");
    setNotice("");

    try {
      await api.delete(`/products/${product._id}`);
      setProducts((current) =>
        current.filter((item) => item._id !== product._id)
      );
      setNotice("Product deleted successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to delete this product."
      );
    } finally {
      setDeletingId("");
    }
  }

  function stockLabel(stock) {
    if (Number(stock) === 0) return "Out of stock";
    if (Number(stock) <= 5) return "Low stock";
    return "In stock";
  }

  return (
    <main className="admin-products-page">
      <header className="admin-products-header">
        <div className="admin-products-heading">
          <button
            type="button"
            className="ap-back-button"
            onClick={onBack}
            aria-label="Back to storefront"
          >
            <ArrowLeft size={18} />
          </button>

          <div>
            <span className="ap-eyebrow">SHOPSPHERE ADMIN</span>
            <h1>Product management</h1>
            <p>Manage your catalogue, prices and inventory.</p>
          </div>
        </div>

        <div className="ap-header-actions">
          <button
            type="button"
            className="ap-secondary-button"
            onClick={loadProducts}
            disabled={loading}
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          <button
            type="button"
            className="ap-primary-button"
            onClick={openCreateForm}
          >
            <Plus size={17} />
            Add product
          </button>
        </div>
      </header>

      <section className="ap-stats-grid">
        <article className="ap-stat-card">
          <span className="ap-stat-icon">
            <Boxes size={19} />
          </span>
          <span className="ap-stat-label">Total products</span>
          <strong>{stats.total}</strong>
          <small>Products in catalogue</small>
        </article>

        <article className="ap-stat-card">
          <span className="ap-stat-icon">
            <PackagePlus size={19} />
          </span>
          <span className="ap-stat-label">Inventory units</span>
          <strong>{stats.units.toLocaleString("en-IN")}</strong>
          <small>Total available stock</small>
        </article>

        <article className="ap-stat-card">
          <span className="ap-stat-icon ap-warning-icon">
            <Boxes size={19} />
          </span>
          <span className="ap-stat-label">Low stock</span>
          <strong>{stats.lowStock}</strong>
          <small>Between 1 and 5 units</small>
        </article>

        <article className="ap-stat-card">
          <span className="ap-stat-icon ap-danger-icon">
            <Trash2 size={19} />
          </span>
          <span className="ap-stat-label">Out of stock</span>
          <strong>{stats.outOfStock}</strong>
          <small>Products needing restock</small>
        </article>
      </section>

      {notice && (
        <div className="ap-alert ap-alert-success" role="status">
          {notice}
          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {error && !showForm && (
        <div className="ap-alert ap-alert-error" role="alert">
          {error}
          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <section className="ap-catalog-panel">
        <div className="ap-toolbar">
          <div>
            <h2>All products</h2>
            <p>{filteredProducts.length} products displayed</p>
          </div>

          <div className="ap-toolbar-controls">
            <label className="ap-search">
              <Search size={17} />
              <input
                type="search"
                placeholder="Search name, brand or category"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>

            <select
              className="ap-stock-filter"
              value={stockFilter}
              onChange={(event) => setStockFilter(event.target.value)}
              aria-label="Filter by stock status"
            >
              <option value="all">All stock</option>
              <option value="available">In stock</option>
              <option value="low">Low stock</option>
              <option value="out">Out of stock</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="ap-empty-state">
            <RefreshCw size={24} />
            <p>Loading products...</p>
          </div>
        ) : error && products.length === 0 ? (
          <div className="ap-empty-state">
            <p>Products could not be loaded.</p>
            <button
              type="button"
              className="ap-secondary-button"
              onClick={loadProducts}
            >
              Try again
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="ap-empty-state">
            <Boxes size={30} />
            <h3>No products found</h3>
            <p>Try another search or stock filter.</p>
          </div>
        ) : (
          <div className="ap-table-wrap">
            <table className="ap-products-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th className="ap-actions-heading">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product._id}>
                    <td>
                      <div className="ap-product-cell">
                        <img
                          src={product.image}
                          alt=""
                          onError={(event) => {
                            event.currentTarget.style.visibility = "hidden";
                          }}
                        />
                        <div>
                          <strong>{product.name}</strong>
                          <span>{product.brand}</span>
                        </div>
                      </div>
                    </td>

                    <td>{product.category}</td>

                    <td className="ap-price">
                      ₹{Number(product.price).toLocaleString("en-IN")}
                    </td>

                    <td>{product.stock}</td>

                    <td>
                      <span
                        className={`ap-stock-status ${
                          Number(product.stock) === 0
                            ? "ap-status-out"
                            : Number(product.stock) <= 5
                              ? "ap-status-low"
                              : "ap-status-good"
                        }`}
                      >
                        {stockLabel(product.stock)}
                      </span>
                    </td>

                    <td>
                      <div className="ap-row-actions">
                        <button
                          type="button"
                          className="ap-icon-button"
                          onClick={() => openEditForm(product)}
                          aria-label={`Edit ${product.name}`}
                          title="Edit product"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          className="ap-icon-button ap-delete-button"
                          onClick={() => handleDelete(product)}
                          disabled={deletingId === product._id}
                          aria-label={`Delete ${product.name}`}
                          title="Delete product"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showForm && (
        <div
          className="ap-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeForm();
          }}
        >
          <section
            className="ap-product-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ap-form-title"
          >
            <header className="ap-modal-header">
              <div>
                <span className="ap-eyebrow">PRODUCT CATALOGUE</span>
                <h2 id="ap-form-title">
                  {editingId ? "Edit product" : "Add new product"}
                </h2>
                <p>Enter the product details below.</p>
              </div>

              <button
                type="button"
                className="ap-icon-button"
                onClick={closeForm}
                disabled={saving}
                aria-label="Close form"
              >
                <X size={19} />
              </button>
            </header>

            {error && (
              <div className="ap-alert ap-alert-error" role="alert">
                {error}
              </div>
            )}

            <form className="ap-product-form" onSubmit={handleSubmit}>
              <label>
                Product name *
                <input
                  name="name"
                  value={form.name}
                  onChange={updateField}
                  required
                  maxLength={150}
                  placeholder="e.g. Wireless headphones"
                />
              </label>

              <div className="ap-form-row">
                <label>
                  Brand *
                  <input
                    name="brand"
                    value={form.brand}
                    onChange={updateField}
                    required
                    placeholder="Brand name"
                  />
                </label>

                <label>
                  Category *
                  <input
                    name="category"
                    value={form.category}
                    onChange={updateField}
                    required
                    placeholder="e.g. Electronics"
                  />
                </label>
              </div>

              <label>
                Description *
                <textarea
                  name="description"
                  value={form.description}
                  onChange={updateField}
                  required
                  rows={3}
                  placeholder="Describe the product..."
                />
              </label>

              <div className="ap-form-row">
                <label>
                  Price (₹) *
                  <input
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={updateField}
                    required
                    placeholder="2499"
                  />
                </label>

                <label>
                  Stock quantity *
                  <input
                    name="stock"
                    type="number"
                    min="0"
                    step="1"
                    value={form.stock}
                    onChange={updateField}
                    required
                    placeholder="20"
                  />
                </label>
              </div>

              <label>
                Product image URL *
                <input
                  name="image"
                  type="url"
                  value={form.image}
                  onChange={updateField}
                  required
                  placeholder="https://example.com/product.jpg"
                />
              </label>

              {form.image.trim() && (
                <div className="ap-image-preview">
                  <img
                    src={form.image}
                    alt="Product preview"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                    onLoad={(event) => {
                      event.currentTarget.style.display = "block";
                    }}
                  />
                  <span>Image preview</span>
                </div>
              )}

              <div className="ap-form-actions">
                <button
                  type="button"
                  className="ap-secondary-button"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="ap-primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Save changes"
                      : "Create product"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

export default AdminProducts;