
import { createContext, useContext, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(
    () => localStorage.getItem("shopsphere_token") || ""
  );

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("shopsphere_user")) || null;
    } catch {
      return null;
    }
  });

  async function login(email, password) {
    const response = await api.post("/auth/login", {
      email,
      password,
    });

    const data = response.data;
    const newToken = data.token || data.accessToken;

    if (!newToken) {
      throw new Error("The server did not return an authentication token.");
    }

    const newUser = data.user || null;

    localStorage.setItem("shopsphere_token", newToken);
    localStorage.setItem("shopsphere_user", JSON.stringify(newUser));

    setToken(newToken);
    setUser(newUser);

    return data;
  }

  async function register(name, email, password) {
    const response = await api.post("/auth/register", {
      name,
      email,
      password,
    });

    const data = response.data;
    const newToken = data.token || data.accessToken;

    if (newToken) {
      const newUser = data.user || null;

      localStorage.setItem("shopsphere_token", newToken);
      localStorage.setItem("shopsphere_user", JSON.stringify(newUser));

      setToken(newToken);
      setUser(newUser);
    }

    return data;
  }

  function logout() {
    localStorage.removeItem("shopsphere_token");
    localStorage.removeItem("shopsphere_user");
    setToken("");
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ token, user, isLoggedIn: Boolean(token), login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
