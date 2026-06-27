import { useEffect, useState } from "react";
import { getPendingRequests, approveRequest, rejectRequest } from "../services/supervisorService";
import { useNotifications } from "../hooks/useNotifications";
import DashboardLayout from "../layouts/DashboardLayout";

export default function SupervisorDashboard() {
    const { notifications, unreadCount, fetchNotifications } = useNotifications();
    const [requests, setRequests]   = useState([]);
    const [loading, setLoading]     = useState(true);
    const [rejectId, setRejectId]   = useState(null);
    const [reason, setReason]       = useState("");
    const [busy, setBusy]           = useState(false);
    const [error, setError]         = useState("");

    const load = () => {
        setLoading(true);
        getPendingRequests()
            .then(r => setRequests(r.data.pending_req ?? []))
            .catch(() => {})
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const approve = async (id) => {
        setBusy(true);
        try { await approveRequest(id); load(); fetchNotifications(); }
        catch (err) { setError(err.response?.data?.error ?? "Failed to approve."); }
        setBusy(false);
    };

    const submitReject = async () => {
        if (!reason.trim()) return;
        setBusy(true);
        try { await rejectRequest(rejectId, reason); setRejectId(null); setReason(""); load(); fetchNotifications(); }
        catch (err) { setError(err.response?.data?.error ?? "Failed to reject."); }
        setBusy(false);
    };

    return (
        <DashboardLayout notifications={notifications} unreadCount={unreadCount} fetchNotifications={fetchNotifications}>
            <div className="space-y-4">

                {error && (
                    <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center justify-between">
                        {error}
                        <button onClick={() => setError("")} className="text-red-400 hover:text-red-600">✕</button>
                    </div>
                )}

                {rejectId && (
                    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl border border-zinc-200 p-6 w-full max-w-md mx-4 space-y-4">
                            <p className="text-sm font-semibold text-zinc-900">Rejection Reason</p>
                            <textarea autoFocus rows={3} value={reason}
                                onChange={e => setReason(e.target.value)}
                                placeholder="Explain the reason for rejection…"
                                className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-md outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 resize-none" />
                            <div className="flex gap-2 justify-end">
                                <button onClick={() => { setRejectId(null); setReason(""); }}
                                    className="px-3 py-1.5 text-sm text-zinc-600 hover:text-zinc-900 border border-zinc-200 rounded-md transition">
                                    Cancel
                                </button>
                                <button onClick={submitReject} disabled={!reason.trim() || busy}
                                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition disabled:opacity-60">
                                    Confirm Rejection
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center py-12"><div className="w-5 h-5 border-2 border-zinc-200 border-t-zinc-800 rounded-full animate-spin" /></div>
                ) : requests.length === 0 ? (
                    <div className="bg-white rounded-xl border border-zinc-200 p-10 text-center text-sm text-zinc-400">No requests.</div>
                ) : (
                    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-zinc-100">
                            <p className="text-sm font-semibold text-zinc-900">Team Leave Requests</p>
                            <p className="text-xs text-zinc-400 mt-0.5">{requests.filter(r => r.status === 'pending_supervisor').length} pending · {requests.filter(r => r.status === 'rejected').length} rejected</p>
                        </div>
                        <table className="w-full text-left text-sm">
                            <thead className="bg-zinc-50 border-b border-zinc-100">
                                <tr>{["Employee", "Type", "Period", "Days", "Notes", ""].map(h => (
                                    <th key={h} className="px-4 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
                                ))}</tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-50">
                                {requests.map(r => (
                                    <tr key={r.id} className={`transition-colors ${r.status === 'rejected' ? 'opacity-60' : 'hover:bg-zinc-50'}`}>
                                        <td className="px-4 py-3 font-medium text-zinc-800">{r.employee_name}</td>
                                        <td className="px-4 py-3 text-zinc-500">{r.leave_type_label}</td>
                                        <td className="px-4 py-3 text-zinc-500 whitespace-nowrap">{r.start_date} → {r.end_date}</td>
                                        <td className="px-4 py-3 text-zinc-500">{r.days_count}</td>
                                        <td className="px-4 py-3 text-zinc-400 max-w-xs truncate">
                                            {r.status === 'rejected' && r.rejection_reason
                                                ? <span className="text-red-500 text-xs">{r.rejection_reason}</span>
                                                : r.reason || "—"}
                                        </td>
                                        <td className="px-4 py-3">
                                            {r.status === 'rejected' ? (
                                                <span className="inline-block px-2 py-0.5 bg-red-50 text-red-500 text-[11px] font-semibold rounded">Rejected</span>
                                            ) : (
                                                <div className="flex gap-2">
                                                    <button onClick={() => approve(r.id)} disabled={busy}
                                                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-medium rounded transition disabled:opacity-60">
                                                        Approve
                                                    </button>
                                                    <button onClick={() => setRejectId(r.id)} disabled={busy}
                                                        className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium rounded transition disabled:opacity-60">
                                                        Reject
                                                    </button>
                                                </div>
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
