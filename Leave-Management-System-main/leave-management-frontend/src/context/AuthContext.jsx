import { createContext, useContext, useState, useMemo, useEffect } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser]         = useState(null);
    const [isLoading, setLoading] = useState(true);

    useEffect(() => {
        api.get("/api/user")
            .then(r => setUser(r.data))
            .catch(() => setUser(null))
            .finally(() => setLoading(false));
    }, []);

    const login = async (credentials) => {
        await api.get("/sanctum/csrf-cookie");
        await api.post("/api/login", credentials);
        const r = await api.get("/api/user");
        setUser(r.data);
        return r.data;
    };

    const logout = async () => {
        try { await api.post("/api/logout"); } catch {}
        setUser(null);
    };

    const value = useMemo(() => ({ user, setUser, isAuthenticated: !!user, isLoading, login, logout }), [user, isLoading]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
};
