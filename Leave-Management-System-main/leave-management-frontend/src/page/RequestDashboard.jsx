import { useEffect, useState } from "react";
import { getMyRequests, getMyBalances, getLeaveTypes, postLeaveRequest, cancelLeaveRequest } from "../services/employeeService";
import { useNotifications } from "../hooks/useNotifications";
import DashboardLayout from "../layouts/DashboardLayout";

const STATUS_STYLE = {
    pending_supervisor: "bg-amber-50 text-amber-700",
    pending_hr:         "bg-blue-50 text-blue-700",
    approved:           "bg-emerald-50 text-emerald-700",
    rejected:           "bg-red-50 text-red-700",
    cancelled:          "bg-zinc-100 text-zinc-500",
};
const STATUS_LABEL = {
    pending_supervisor: "Pending Supervisor",
    pending_hr:         "Pending HR",
    approved:           "Approved",
    rejected:           "Rejected",
    cancelled:          "Cancelled",
};

const Badge = ({ status }) => (
    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${STATUS_STYLE[status] ?? "bg-zinc-100 text-zinc-500"}`}>
        {STATUS_LABEL[status] ?? status}
    </span>
);

export default function RequestDashboard() {
    const { notifications, unreadCount, fetchNotifications } = useNotifications();
    const [requests, setRequests]   = useState([]);
    const [balances, setBalances]   = useState([]);
    const [types, setTypes]         = useState([]);
    const [loading, setLoading]     = useState(true);
    const [showForm, setShowForm]   = useState(false);
    const [form, setForm]           = useState({ leave_type_id: "", start_date: "", end_date: "", reason: "" });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError]         = useState("");

    const load = async () => {
        try {
            const [r, b, t] = await Promise.all([getMyRequests(), getMyBalances(), getLeaveTypes()]);
            setRequests(r.data.my_requests ?? []);
            setBalances(b.data.balances ?? []);
            setTypes(t.data ?? []);
        } catch {}
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const submit = async (e) => {
        e.preventDefault();
        setError(""); setSubmitting(true);
        try {
            await postLeaveRequest(form);
            setShowForm(false);
            setForm({ leave_type_id: "", start_date: "", end_date: "", reason: "" });
            load();
        } catch (err) {
            setError(err.response?.data?.error ?? "Something went wrong.");
        }
        setSubmitting(false);
    };

    const cancel = async (id) => {
        if (!confirm("Cancel this leave request?")) return;
        try { await cancelLeaveRequest(id); load(); } catch {}
    };

    return (
        <DashboardLayout notifications={notifications} unreadCount={unreadCount} fetchNotifications={fetchNotifications}>
            <div className="space-y-6">

                {/* Balances */}
                {balances.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {balances.map(b => (
                            <div key={b.leave_type} className="bg-white rounded-xl border border-zinc-200 p-4">
                                <p className="text-xs text-zinc-500 mb-1">{b.leave_type}</p>
                                <p className="text-2xl font-bold text-zinc-900">{b.remaining_days}</p>
                                <p className="text-[11px] text-zinc-400 mt-0.5">{b.used_days} used · {b.initial_days} total</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Header row */}
                <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-zinc-900">My Requests</p>
                    <button onClick={() => setShowForm(v => !v)}
                        className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium rounded-md transition">
                        {showForm ? "Close" : "+ New Request"}
                    </button>
                </div>

                {/* Form */}
                {showForm && (
                    <div className="bg-white rounded-xl border border-zinc-200 p-6">
                        <p className="text-sm font-semibold text-zinc-900 mb-4">New Leave Request</p>
                        {error && <p className="mb-4 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}
                        <form onSubmit={submit} className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 sm:col-span-1 space-y-1">
                                <label className="text-xs font-medium text-zinc-700">Leave Type</label>
                                <select required value={form.leave_type_id}
                                    onChange={e => setForm(f => ({ ...f, leave_type_id: e.target.value }))}
                                    className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-md outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 bg-white">
                                    <option value="">Select…</option>
                                    {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                            <div className="col-span-2 sm:col-span-1" />
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-zinc-700">Start Date</label>
                                <input type="date" required value={form.start_date}
                                    onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                                    className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-md outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-zinc-700">End Date</label>
                                <input type="date" required value={form.end_date}
                                    onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                                    className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-md outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200" />
                            </div>
                            <div className="col-span-2 space-y-1">
                                <label className="text-xs font-medium text-zinc-700">Reason <span className="text-zinc-400 font-normal">(optional)</span></label>
                                <textarea rows={2} value={form.reason}
                                    onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                                    className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-md outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 resize-none" />
                            </div>
                            <div className="col-span-2 flex justify-end">
                                <button type="submit" disabled={submitting}
                                    className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium rounded-md transition disabled:opacity-60">
                                    {submitting ? "Submitting…" : "Submit Request"}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Table */}
                {loading ? (
                    <div className="flex justify-center py-12"><div className="w-5 h-5 border-2 border-zinc-200 border-t-zinc-800 rounded-full animate-spin" /></div>
                ) : requests.length === 0 ? (
                    <div className="bg-white rounded-xl border border-zinc-200 p-10 text-center text-sm text-zinc-400">No leave requests yet.</div>
                ) : (
                    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-zinc-50 border-b border-zinc-100">
                                <tr>{["Type", "Period", "Days", "Status", "Reason", ""].map(h => (
                                    <th key={h} className="px-4 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
                                ))}</tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-50">
                                {requests.map(r => (
                                    <tr key={r.id} className="hover:bg-zinc-50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-zinc-800">{r.leave_type}</td>
                                        <td className="px-4 py-3 text-zinc-500 whitespace-nowrap">{r.start_date} → {r.end_date}</td>
                                        <td className="px-4 py-3 text-zinc-500">{r.days_count}</td>
                                        <td className="px-4 py-3"><Badge status={r.status} /></td>
                                        <td className="px-4 py-3 text-zinc-400 max-w-xs truncate">
                                            {r.rejection_reason
                                                ? <span className="text-red-500">{r.rejection_reason}</span>
                                                : r.reason || "—"}
                                        </td>
                                        <td className="px-4 py-3">
                                            {["pending_supervisor", "pending_hr", "approved"].includes(r.status) && (
                                                <button onClick={() => cancel(r.id)}
                                                    className="text-xs text-zinc-400 hover:text-red-500 transition-colors">
                                                    Cancel
                                                </button>
                                            )}
                                        </td>
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
