import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import QrGenerator from "./QrGenerator";

export default function LoginPage() {
    const { login }             = useAuth();
    const navigate              = useNavigate();
    const [form, setForm]       = useState({ email: "", password: "" });
    const [error, setError]     = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(""); setLoading(true);
        try {
            const user = await login(form);
            navigate(user.role === "hr" ? "/hr/leave" : "/dashboard");
        } catch (err) {
            setError(err.response?.status === 401 ? "Invalid email or password." : "Something went wrong.");
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <div className="w-10 h-10 bg-zinc-900 rounded-lg flex items-center justify-center text-white text-sm font-bold mx-auto mb-4">HR</div>
                    <h1 className="text-xl font-semibold text-zinc-900">Sign in to HR Connect</h1>
                    <p className="text-sm text-zinc-500 mt-1">Enter your credentials to continue</p>
                </div>
                <div className="bg-white rounded-xl border border-zinc-200 p-6">
                    {error && <div className="mb-4 px-3 py-2.5 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">{error}</div>}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-zinc-700">Email</label>
                            <input type="email" required value={form.email}
                                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                placeholder="you@company.com"
                                className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-md outline-none placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-zinc-700">Password</label>
                            <input type="password" required value={form.password}
                                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                                placeholder="••••••••"
                                className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-md outline-none placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200" />
                        </div>
                        <button type="submit" disabled={loading}
                            className="w-full mt-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium rounded-md transition disabled:opacity-60">
                            {loading ? "Signing in…" : "Sign in"}
                        </button>
                    </form>
                </div>
                <p className="text-center text-xs text-zinc-400 mt-6">Don't have an account? Contact your HR department.</p>
            </div>
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
            <QrGenerator/>
        </div>
    );
}
