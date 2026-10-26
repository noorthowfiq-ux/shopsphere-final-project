import { useEffect, useState } from "react";
import {
  ArrowLeft,
  UserRound,
  Mail,
  Phone,
  MapPin,
  Save,
  LoaderCircle,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import api from "../api/axios";
import "./Account.css";

function Account({ onBack }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      setLoading(true);
      setNotice(null);

      try {
        // This endpoint will be added to the backend in the next step.
        const response = await api.get("/auth/profile");
        const profile = response.data.user || response.data;

        if (!cancelled) {
          setForm({
            name: profile.name || "",
            email: profile.email || "",
            phone: profile.phone || "",
            address: profile.address || "",
          });
        }
      } catch (error) {
        if (!cancelled) {
          setNotice({
            type: "error",
            text:
              error.response?.data?.message ||
              "Unable to load your profile. Please try again.",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setNotice(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setNotice(null);

    if (!form.name.trim()) {
      setNotice({ type: "error", text: "Please enter your name." });
      return;
    }

    setSaving(true);

    try {
      const response = await api.put("/auth/profile", {
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
      });

      const updatedUser = response.data.user || response.data;

      setForm((current) => ({
        ...current,
        name: updatedUser.name ?? current.name,
        email: updatedUser.email ?? current.email,
        phone: updatedUser.phone ?? current.phone,
        address: updatedUser.address ?? current.address,
      }));

      setNotice({
        type: "success",
        text: "Your account details have been updated successfully.",
      });
    } catch (error) {
      setNotice({
        type: "error",
        text:
          error.response?.data?.message ||
          "Unable to save your changes. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="account-page">
        <div className="account-state">
          <LoaderCircle className="account-spinner" size={28} />
          <p>Loading your account...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="account-page">
      <button className="account-back-button" onClick={onBack}>
        <ArrowLeft size={18} />
        Back to shopping
      </button>

      <header className="account-heading">
        <div className="account-heading-icon">
          <UserRound size={25} />
        </div>

        <div>
          <h1>My Account</h1>
          <p>View and manage your personal information.</p>
        </div>
      </header>

      <div className="account-layout">
        <aside className="account-sidebar">
          <div className="account-avatar">
            {form.name.trim().charAt(0).toUpperCase() || (
              <UserRound size={30} />
            )}
          </div>

          <h2>{form.name || "Your account"}</h2>
          <p className="account-sidebar-email">{form.email}</p>

          <div className="account-security-note">
            <ShieldCheck size={19} />
            <span>Your account information is protected.</span>
          </div>
        </aside>

        <section className="account-form-card">
          <div className="account-form-heading">
            <h2>Personal information</h2>
            <p>Update the details associated with your account.</p>
          </div>

          {notice && (
            <div
              className={`account-notice ${
                notice.type === "success"
                  ? "account-notice-success"
                  : "account-notice-error"
              }`}
              role="status"
            >
              {notice.type === "success" ? (
                <CheckCircle2 size={19} />
              ) : (
                <AlertCircle size={19} />
              )}
              <span>{notice.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="account-field">
              <label htmlFor="account-name">Full name</label>
              <div className="account-input-wrap">
                <UserRound size={18} />
                <input
                  id="account-name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  autoComplete="name"
                  maxLength={100}
                  required
                />
              </div>
            </div>

            <div className="account-field">
              <label htmlFor="account-email">Email address</label>
              <div className="account-input-wrap account-input-disabled">
                <Mail size={18} />
                <input
                  id="account-email"
                  name="email"
                  type="email"
                  value={form.email}
                  readOnly
                  autoComplete="email"
                />
              </div>
              <p className="account-field-hint">
                Your registered email address cannot be changed here.
              </p>
            </div>

            <div className="account-field">
              <label htmlFor="account-phone">Phone number</label>
              <div className="account-input-wrap">
                <Phone size={18} />
                <input
                  id="account-phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
                  autoComplete="tel"
                  maxLength={20}
                />
              </div>
            </div>

            <div className="account-field">
              <label htmlFor="account-address">Shipping address</label>
              <div className="account-input-wrap account-textarea-wrap">
                <MapPin size={18} />
                <textarea
                  id="account-address"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Enter your delivery address"
                  autoComplete="street-address"
                  rows={4}
                  maxLength={500}
                />
              </div>
            </div>

            <button
              className="account-save-button"
              type="submit"
              disabled={saving}
            >
              {saving ? (
                <LoaderCircle className="account-spinner" size={18} />
              ) : (
                <Save size={18} />
              )}
              {saving ? "Saving changes..." : "Save changes"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

export default Account;