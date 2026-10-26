import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ShoppingCart,
  Minus,
  Plus,
  Package,
  ShieldCheck,
  Truck,
  Check,
  AlertCircle,
} from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import "./ProductDetails.css";

function ProductDetails({ productId, onBack, onAddToCart }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [notice, setNotice] = useState("");
  const [adding, setAdding] = useState(false);

  const { isLoggedIn } = useAuth();

  useEffect(() => {
    let cancelled = false;

    async function loadProduct() {
      setLoading(true);
      setError("");
      setProduct(null);
      setQuantity(1);
      setNotice("");

      try {
        const response = await api.get(`/products/${productId}`);
        const data = response.data.product || response.data;

        if (!cancelled) {
          setProduct(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              "Unable to load this product. Please try again."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (productId) loadProduct();
    else {
      setError("No product was selected.");
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [productId]);

  async function handleAddToCart() {
    if (!product || product.stock < 1) return;

    if (!isLoggedIn) {
      setNotice("Please sign in to add products to your cart.");
      return;
    }

    setAdding(true);
    setNotice("");

    try {
      if (onAddToCart) {
        await onAddToCart(product, quantity);
      } else {
        await api.post("/cart", {
          productId: product._id,
          quantity,
        });
      }

      setNotice("Product added to your cart successfully.");
    } catch (err) {
      setNotice(
        err.response?.data?.message ||
          "Unable to add this product to your cart."
      );
    } finally {
      setAdding(false);
    }
  }

  if (loading) {
    return (
      <main className="product-details-page">
        <div className="product-details-state">Loading product details...</div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="product-details-page">
        <button className="pd-back-button" onClick={onBack}>
          <ArrowLeft size={18} /> Back to products
        </button>
        <div className="product-details-state pd-error">
          <AlertCircle size={30} />
          <h2>Product unavailable</h2>
          <p>{error || "This product could not be found."}</p>
          <button className="pd-primary-button" onClick={onBack}>
            Return to products
          </button>
        </div>
      </main>
    );
  }

  const stock = Number(product.stock || 0);
  const price = Number(product.price || 0);
  const image = product.image || "";

  return (
    <main className="product-details-page">
      <button className="pd-back-button" onClick={onBack}>
        <ArrowLeft size={18} />
        Back to products
      </button>

      <div className="pd-breadcrumb">
        <span onClick={onBack}>ShopSphere</span>
        <span>/</span>
        <span>{product.category}</span>
        <span>/</span>
        <strong>{product.name}</strong>
      </div>

      <section className="pd-layout">
        <div className="pd-gallery">
          <div className="pd-main-image">
            {image ? (
              <img src={image} alt={product.name} />
            ) : (
              <div className="pd-image-placeholder">
                <Package size={64} />
                <span>No product image</span>
              </div>
            )}

            {stock === 0 && (
              <span className="pd-stock-label">Out of stock</span>
            )}
          </div>
        </div>

        <div className="pd-information">
          <span className="pd-category">{product.category}</span>

          <p className="pd-brand">
            {product.brand || "ShopSphere Collection"}
          </p>

          <h1>{product.name}</h1>

          {product.rating > 0 && (
            <div className="pd-rating">
              <span className="pd-rating-stars">★</span>
              <strong>{Number(product.rating).toFixed(1)}</strong>
              <span>
                ({Number(product.numReviews || 0)} reviews)
              </span>
            </div>
          )}

          <div className="pd-price">
            ₹{price.toLocaleString("en-IN")}
          </div>

          <p className="pd-tax-note">
            Product price displayed in Indian Rupees.
          </p>

          <div className="pd-divider" />

          <h2 className="pd-description-heading">Product description</h2>
          <p className="pd-description">
            {product.description || "No description available."}
          </p>

          <div className="pd-stock-info">
            <span className={`pd-stock-dot ${stock > 0 ? "available" : ""}`} />
            {stock > 0
              ? stock <= 5
                ? `Only ${stock} left in stock`
                : "In stock and ready to order"
              : "Currently unavailable"}
          </div>

          {stock > 0 && (
            <div className="pd-purchase-controls">
              <div className="pd-quantity">
                <span>Quantity</span>
                <div className="pd-quantity-selector">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    disabled={quantity <= 1}
                    onClick={() =>
                      setQuantity((current) => Math.max(1, current - 1))
                    }
                  >
                    <Minus size={16} />
                  </button>

                  <span>{quantity}</span>

                  <button
                    type="button"
                    aria-label="Increase quantity"
                    disabled={quantity >= stock}
                    onClick={() =>
                      setQuantity((current) =>
                        Math.min(stock, current + 1)
                      )
                    }
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              <button
                className="pd-primary-button pd-add-button"
                onClick={handleAddToCart}
                disabled={adding}
              >
                <ShoppingCart size={19} />
                {adding ? "Adding..." : "Add to Cart"}
              </button>
            </div>
          )}

          {notice && (
            <div
              className={`pd-notice ${
                notice.startsWith("Product added") ? "pd-notice-success" : ""
              }`}
              role="status"
            >
              {notice.startsWith("Product added") ? (
                <Check size={17} />
              ) : (
                <AlertCircle size={17} />
              )}
              <span>{notice}</span>
            </div>
          )}

          <div className="pd-benefits">
            <div>
              <Truck size={21} />
              <span>
                <strong>Delivery</strong>
                <small>Delivery options at checkout</small>
              </span>
            </div>

            <div>
              <ShieldCheck size={21} />
              <span>
                <strong>Secure shopping</strong>
                <small>Your account is protected</small>
              </span>
            </div>

            <div>
              <Package size={21} />
              <span>
                <strong>Order tracking</strong>
                <small>Track orders from My Orders</small>
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="pd-additional-info">
        <h2>Product information</h2>
        <div>
          <span>Product</span>
          <strong>{product.name}</strong>
        </div>
        <div>
          <span>Brand</span>
          <strong>{product.brand || "ShopSphere"}</strong>
        </div>
        <div>
          <span>Category</span>
          <strong>{product.category}</strong>
        </div>
        <div>
          <span>Availability</span>
          <strong>{stock > 0 ? "In stock" : "Out of stock"}</strong>
        </div>
      </section>
    </main>
  );
}

export default ProductDetails;