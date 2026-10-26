import { useEffect, useMemo, useState } from "react";
import {
  Search,
  ShoppingCart,
  Store,
  SlidersHorizontal,
  UserRound,
  LogOut,
  CheckCircle2,
  ClipboardList,
  Boxes,
} from "lucide-react";

import AdminOrders from "./components/AdminOrders";
import AdminProducts from "./components/AdminProducts";
import ProductDetails from "./components/ProductDetails";
import Account from "./components/Account";
import api from "./api/axios";
import AuthModal from "./components/AuthModal";
import CartDrawer from "./components/CartDrawer";
import Checkout from "./components/Checkout";
import MyOrders from "./components/MyOrders";
import { useAuth } from "./context/AuthContext";
import "./App.css";

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("newest");

  const [showAuth, setShowAuth] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showOrders, setShowOrders] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [showAdminOrders, setShowAdminOrders] = useState(false);
  const [showAdminProducts, setShowAdminProducts] = useState(false);

  const [selectedProductId, setSelectedProductId] = useState(null);
  const [placedOrder, setPlacedOrder] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [notice, setNotice] = useState("");

  const { user, isLoggedIn, logout } = useAuth();

  async function loadCartCount() {
    if (!localStorage.getItem("shopsphere_token")) {
      setCartCount(0);
      return;
    }

    try {
      const response = await api.get("/cart");
      const cart = response.data.cart || response.data;

      const count = (cart.items || []).reduce(
        (total, item) => total + item.quantity,
        0
      );

      setCartCount(count);
    } catch {
      setCartCount(0);
    }
  }

  useEffect(() => {
    async function fetchProducts() {
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

    fetchProducts();
  }, []);

  useEffect(() => {
    loadCartCount();
  }, [isLoggedIn]);

  const categories = useMemo(
    () => ["All", ...new Set(products.map((product) => product.category))],
    [products]
  );

  const filteredProducts = useMemo(() => {
    let result = products.filter((product) => {
      const query = search.trim().toLowerCase();

      const matchesSearch =
        !query ||
        (product.name || "").toLowerCase().includes(query) ||
        (product.description || "").toLowerCase().includes(query) ||
        (product.brand || "").toLowerCase().includes(query);

      const matchesCategory =
        category === "All" || product.category === category;

      return matchesSearch && matchesCategory;
    });

    if (sort === "price_asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (sort === "price_desc") {
      result.sort((a, b) => b.price - a.price);
    } else if (sort === "name_asc") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [products, search, category, sort]);

  function closeOtherPages() {
    setShowCart(false);
    setShowCheckout(false);
    setShowOrders(false);
    setShowAccount(false);
    setShowAdminOrders(false);
    setShowAdminProducts(false);
    setSelectedProductId(null);
    setPlacedOrder(null);
  }

  async function addToCart(product, quantity = 1) {
    if (!isLoggedIn) {
      setShowAuth(true);
      return;
    }

    setNotice("");

    try {
      await api.post("/cart", {
        productId: product._id,
        quantity,
      });

      await loadCartCount();
      setNotice(`${product.name} added to your cart.`);
    } catch (err) {
      throw new Error(
        err.response?.data?.message ||
          "Unable to add this product. Please try again."
      );
    }
  }

  function handleLogout() {
    logout();
    setCartCount(0);
    closeOtherPages();
    setNotice("You have signed out.");
  }

  function handleOrderPlaced(order) {
    setPlacedOrder(order);
    setShowCheckout(false);
    setShowCart(false);
    setShowOrders(false);
    setShowAccount(false);
    setShowAdminOrders(false);
    setShowAdminProducts(false);
    setSelectedProductId(null);
    setCartCount(0);
    setNotice("");
  }

  function goToStore() {
    closeOtherPages();
    setNotice("");
  }

  if (placedOrder) {
    return (
      <div className="shop-app">
        <main className="checkout-page">
          <section className="order-success">
            <CheckCircle2 size={56} />
            <h1>Order placed successfully!</h1>
            <p>Your ShopSphere order has been created.</p>

            <div className="order-success-details">
              <p>
                <strong>Order ID:</strong> {placedOrder._id || "Confirmed"}
              </p>
              <p>
                <strong>Payment:</strong> Cash on Delivery
              </p>
              <p>
                <strong>Status:</strong> {placedOrder.orderStatus || "Placed"}
              </p>
              <p>
                <strong>Total:</strong> ₹
                {Number(placedOrder.totalPrice || 0).toLocaleString("en-IN")}
              </p>
            </div>

            <button
              className="place-order-button"
              onClick={() => {
                setPlacedOrder(null);
                loadCartCount();
              }}
            >
              Continue shopping
            </button>

            <button
              className="secondary-button"
              style={{ width: "100%", marginTop: 10 }}
              onClick={() => {
                setPlacedOrder(null);
                setShowOrders(true);
              }}
            >
              View my orders
            </button>
          </section>
        </main>
      </div>
    );
  }

  if (showAccount && isLoggedIn) {
    return (
      <div className="shop-app">
        <Account
          onBack={() => {
            setShowAccount(false);
            setNotice("");
          }}
        />
      </div>
    );
  }

  if (showOrders && isLoggedIn) {
    return (
      <div className="shop-app">
        <MyOrders onBack={() => setShowOrders(false)} />
      </div>
    );
  }

  if (showAdminOrders && user?.role === "admin") {
    return (
      <div className="shop-app">
        <AdminOrders />
      </div>
    );
  }

  if (showAdminProducts && user?.role === "admin") {
    return (
      <div className="shop-app">
        <AdminProducts onBack={() => setShowAdminProducts(false)} />
      </div>
    );
  }

  if (showCheckout) {
    return (
      <div className="shop-app">
        <Checkout
          onBack={() => setShowCheckout(false)}
          onOrderPlaced={handleOrderPlaced}
        />
      </div>
    );
  }

  if (selectedProductId) {
    return (
      <div className="shop-app">
        <ProductDetails
          productId={selectedProductId}
          onBack={() => {
            setSelectedProductId(null);
            setNotice("");
          }}
          onAddToCart={addToCart}
        />
      </div>
    );
  }

  return (
    <div className="shop-app">
      <header className="navbar">
        <a
          className="brand"
          href="#"
          onClick={(event) => {
            event.preventDefault();
            goToStore();
          }}
        >
          <span className="brand-icon">
            <Store size={21} />
          </span>
          <span>ShopSphere</span>
        </a>

        <div className="nav-search">
          <Search size={18} />
          <input
            type="search"
            placeholder="Search products and brands..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search products"
          />
        </div>

        <div className="nav-actions">
          {isLoggedIn ? (
            <>
              <span className="account-label">
                <UserRound size={17} />
                {user?.name || "My Account"}
              </span>

              <button
                className="account-button"
                onClick={() => {
                  closeOtherPages();
                  setShowAccount(true);
                }}
              >
                <UserRound size={17} />
                <span>My Account</span>
              </button>

              {user?.role === "admin" && (
                <>
                  <button
                    className="account-button"
                    onClick={() => {
                      closeOtherPages();
                      setShowAdminOrders(true);
                    }}
                  >
                    <ClipboardList size={17} />
                    <span>Admin Orders</span>
                  </button>

                  <button
                    className="account-button"
                    onClick={() => {
                      closeOtherPages();
                      setShowAdminProducts(true);
                    }}
                  >
                    <Boxes size={17} />
                    <span>Admin Products</span>
                  </button>
                </>
              )}

              <button
                className="account-button"
                onClick={() => {
                  closeOtherPages();
                  setShowOrders(true);
                }}
              >
                <ClipboardList size={17} />
                <span>My Orders</span>
              </button>

              <button className="account-button" onClick={handleLogout}>
                <LogOut size={17} />
                <span>Sign out</span>
              </button>
            </>
          ) : (
            <button
              className="account-button"
              onClick={() => setShowAuth(true)}
            >
              <UserRound size={18} />
              <span>Sign in</span>
            </button>
          )}

          <button
            className="cart-button"
            onClick={() => {
              if (!isLoggedIn) {
                setShowAuth(true);
                return;
              }

              closeOtherPages();
              setShowCart(true);
            }}
          >
            <ShoppingCart size={19} />
            <span>Cart</span>
            {cartCount > 0 && (
              <span className="cart-count">{cartCount}</span>
            )}
          </button>
        </div>
      </header>

      {showCart ? (
        <CartDrawer
          onClose={() => {
            setShowCart(false);
            loadCartCount();
          }}
          onCheckout={() => {
            setShowCart(false);
            setShowCheckout(true);
          }}
        />
      ) : (
        <main className="main-content">
          <section className="hero">
            <div className="hero-copy">
              <span className="eyebrow">THE SHOPSPHERE COLLECTION</span>
              <h1>
                Find something
                <br />
                worth keeping.
              </h1>
              <p>
                Thoughtfully selected essentials for your everyday life.
                Explore the collection and find your next favourite.
              </p>

              <button
                className="primary-button"
                onClick={() =>
                  document
                    .getElementById("products")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Explore products
              </button>
            </div>

            <div className="hero-visual">
              <div className="hero-circle">
                <Store size={76} strokeWidth={1.1} />
              </div>
              <span className="hero-caption">
                Discover your next favourite.
              </span>
            </div>
          </section>

          <section className="catalog" id="products">
            <div className="catalog-heading">
              <div>
                <span className="eyebrow">OUR COLLECTION</span>
                <h2>Explore products</h2>
                <p className="muted">
                  {filteredProducts.length}{" "}
                  {filteredProducts.length === 1 ? "product" : "products"}{" "}
                  available
                </p>
              </div>

              <label className="sort-control">
                <SlidersHorizontal size={17} />
                <span>Sort by</span>
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                >
                  <option value="newest">Newest</option>
                  <option value="price_asc">Price: low to high</option>
                  <option value="price_desc">Price: high to low</option>
                  <option value="name_asc">Name: A–Z</option>
                </select>
              </label>
            </div>

            <div className="category-list" aria-label="Filter by category">
              {categories.map((item) => (
                <button
                  key={item}
                  className={`category-chip ${
                    category === item ? "active" : ""
                  }`}
                  onClick={() => setCategory(item)}
                >
                  {item}
                </button>
              ))}
            </div>

            {notice && (
              <p className="shop-notice" role="status">
                {notice}
              </p>
            )}

            {loading && <p className="state-message">Loading products...</p>}
            {error && <p className="error-message">{error}</p>}

            {!loading && !error && filteredProducts.length === 0 && (
              <div className="empty-state">
                <Search size={30} />
                <h3>No products found</h3>
                <p>Try a different search or category.</p>
                <button
                  className="secondary-button"
                  onClick={() => {
                    setSearch("");
                    setCategory("All");
                  }}
                >
                  Clear filters
                </button>
              </div>
            )}

            <div className="product-grid">
              {filteredProducts.map((product) => (
                <article
                  className="product-card"
                  key={product._id}
                  onClick={() => setSelectedProductId(product._id)}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      event.target === event.currentTarget
                    ) {
                      setSelectedProductId(product._id);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`View details for ${product.name}`}
                  style={{ cursor: "pointer" }}
                >
                  <div className="product-image-wrap">
                    <img
                      className="product-image"
                      src={product.image}
                      alt={product.name}
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.style.visibility = "hidden";
                      }}
                    />

                    {product.stock === 0 && (
                      <span className="stock-badge">Out of stock</span>
                    )}
                  </div>

                  <div className="product-info">
                    <span className="product-category">
                      {product.category}
                    </span>

                    <h3>{product.name}</h3>
                    <p className="product-description">
                      {product.description}
                    </p>

                    <div className="product-bottom">
                      <span className="product-price">
                        ₹{Number(product.price).toLocaleString("en-IN")}
                      </span>
                      <span className="product-stock">
                        {product.stock > 0
                          ? `${product.stock} in stock`
                          : "Unavailable"}
                      </span>
                    </div>

                    <button
                      className="add-button"
                      disabled={product.stock === 0}
                      onClick={(event) => {
                        event.stopPropagation();
                        addToCart(product, 1).catch((err) => {
                          setNotice(err.message);
                        });
                      }}
                    >
                      {product.stock > 0 ? "Add to cart" : "Out of stock"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </main>
      )}

      <footer className="footer">
        <a
          className="brand footer-brand"
          href="#"
          onClick={(event) => {
            event.preventDefault();
            goToStore();
          }}
        >
          <span className="brand-icon">
            <Store size={18} />
          </span>
          <span>ShopSphere</span>
        </a>

        <p>Everyday essentials. A simpler way to shop.</p>
        <span>© {new Date().getFullYear()} ShopSphere</span>
      </footer>

      {showAuth && (
        <AuthModal
          onClose={() => {
            setShowAuth(false);
            loadCartCount();
          }}
        />
      )}
    </div>
  );
}

export default App;
