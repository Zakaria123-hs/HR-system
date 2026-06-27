import { useEffect, useState } from "react";
import { getTeam } from "../services/employeeService";
import { useNotifications } from "../hooks/useNotifications";
import DashboardLayout from "../layouts/DashboardLayout";

const initials = (name) => name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() ?? "?";

const RoleBadge = ({ role, isMySupervisor }) => {
    if (isMySupervisor)     return <span className="px-2 py-0.5 bg-zinc-900 text-white text-[10px] font-semibold rounded uppercase tracking-wide">Your Supervisor</span>;
    if (role === "supervisor") return <span className="px-2 py-0.5 bg-zinc-100 text-zinc-700 text-[10px] font-semibold rounded uppercase tracking-wide">Supervisor</span>;
    if (role === "hr")         return <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-semibold rounded uppercase tracking-wide">HR</span>;
    return <span className="px-2 py-0.5 bg-zinc-50 text-zinc-500 text-[10px] font-semibold rounded uppercase tracking-wide">Employee</span>;
};

export default function TeamPage() {
    const { notifications, unreadCount, fetchNotifications } = useNotifications();
    const [team, setTeam]       = useState([]);
    const [search, setSearch]   = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getTeam().then(r => setTeam(r.data ?? [])).catch(() => {}).finally(() => setLoading(false));
    }, []);

    const filtered = team.filter(m => {
        const q = search.toLowerCase();
        return m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q) || m.service?.toLowerCase().includes(q);
    });

    return (
        <DashboardLayout notifications={notifications} unreadCount={unreadCount} fetchNotifications={fetchNotifications}>
            <div className="space-y-4">
                <div className="relative max-w-sm">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="11" cy="11" r="8" strokeWidth="2"/><path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <input
                        className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-zinc-300 rounded-md outline-none placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
                        placeholder="Search by name, email or department…"
                        value={search} onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <p className="text-xs text-zinc-400">{filtered.length} member{filtered.length !== 1 ? "s" : ""}</p>

                {loading ? (
                    <div className="flex justify-center py-12"><div className="w-5 h-5 border-2 border-zinc-200 border-t-zinc-800 rounded-full animate-spin" /></div>
                ) : filtered.length === 0 ? (
                    <div className="bg-white rounded-xl border border-zinc-200 p-10 text-center text-sm text-zinc-400">No team members found.</div>
                ) : (
                    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-zinc-50 border-b border-zinc-100">
                                <tr>{["Name", "Role", "Department", "Email"].map(h => (
                                    <th key={h} className="px-4 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
                                ))}</tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-50">
                                {filtered.map(m => (
                                    <tr key={m.id} className="hover:bg-zinc-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${m.is_my_supervisor ? "bg-zinc-900" : "bg-zinc-400"}`}>
                                                    {initials(m.name)}
                                                </div>
                                                <span className="font-medium text-zinc-800">{m.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3"><RoleBadge role={m.role} isMySupervisor={m.is_my_supervisor} /></td>
                                        <td className="px-4 py-3 text-zinc-500">{m.service ?? "—"}</td>
                                        <td className="px-4 py-3 text-zinc-400">{m.email}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
