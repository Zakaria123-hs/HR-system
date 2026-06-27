import { useEffect, useState } from "react";
import { getAvailableDocuments, getMyDocumentRequests, postDocumentRequest } from "../services/employeeService";
import { useNotifications } from "../hooks/useNotifications";
import DashboardLayout from "../layouts/DashboardLayout";

const STATUS_STYLE = {
    pending:  "bg-amber-50 text-amber-700",
    approved: "bg-emerald-50 text-emerald-700",
    rejected: "bg-red-50 text-red-700",
};

export default function DocumentsPage() {
    const { notifications, unreadCount, fetchNotifications } = useNotifications();
    const [docs, setDocs]           = useState([]);
    const [requests, setRequests]   = useState([]);
    const [loading, setLoading]     = useState(true);
    const [showForm, setShowForm]   = useState(false);
    const [form, setForm]           = useState({ document_id: "", reason: "" });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError]         = useState("");

    const load = async () => {
        try {
            const [d, r] = await Promise.all([getAvailableDocuments(), getMyDocumentRequests()]);
            setDocs(d.data ?? []);
            setRequests(r.data.requests ?? []);
        } catch {}
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const submit = async (e) => {
        e.preventDefault();
        setError(""); setSubmitting(true);
        try {
            await postDocumentRequest(form);
            setShowForm(false);
            setForm({ document_id: "", reason: "" });
            load();
        } catch (err) {
            setError(err.response?.data?.error ?? "Something went wrong.");
        }
        setSubmitting(false);
    };

    return (
        <DashboardLayout notifications={notifications} unreadCount={unreadCount} fetchNotifications={fetchNotifications}>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-zinc-900">Document Requests</p>
                    <button onClick={() => setShowForm(v => !v)}
                        className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium rounded-md transition">
                        {showForm ? "Close" : "+ New Request"}
                    </button>
                </div>

                {showForm && (
                    <div className="bg-white rounded-xl border border-zinc-200 p-6">
                        <p className="text-sm font-semibold text-zinc-900 mb-4">Request a Document</p>
                        {error && <p className="mb-4 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}
                        <form onSubmit={submit} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-zinc-700">Document</label>
                                <select required value={form.document_id}
                                    onChange={e => setForm(f => ({ ...f, document_id: e.target.value }))}
                                    className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-md outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 bg-white">
                                    <option value="">Select a document…</option>
                                    {docs.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-zinc-700">Reason <span className="text-zinc-400 font-normal">(optional)</span></label>
                                <textarea rows={2} value={form.reason}
                                    onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                                    className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-md outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 resize-none" />
                            </div>
                            <div className="flex justify-end">
                                <button type="submit" disabled={submitting}
                                    className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium rounded-md transition disabled:opacity-60">
                                    {submitting ? "Submitting…" : "Submit Request"}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center py-12"><div className="w-5 h-5 border-2 border-zinc-200 border-t-zinc-800 rounded-full animate-spin" /></div>
                ) : requests.length === 0 ? (
                    <div className="bg-white rounded-xl border border-zinc-200 p-10 text-center text-sm text-zinc-400">No document requests yet.</div>
                ) : (
                    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-zinc-50 border-b border-zinc-100">
                                <tr>{["Document", "Reason", "Status", "Date"].map(h => (
                                    <th key={h} className="px-4 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
                                ))}</tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-50">
                                {requests.map(r => (
                                    <tr key={r.id} className="hover:bg-zinc-50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-zinc-800">{r.document}</td>
                                        <td className="px-4 py-3 text-zinc-400 max-w-xs truncate">
                                            {r.rejection_reason
                                                ? <span className="text-red-500">{r.rejection_reason}</span>
                                                : r.reason || "—"}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${STATUS_STYLE[r.status] ?? "bg-zinc-100 text-zinc-500"}`}>
                                                {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">{new Date(r.created_at).toLocaleDateString()}</td>
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
