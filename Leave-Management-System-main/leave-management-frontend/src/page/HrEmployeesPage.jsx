import { useEffect, useState, useCallback } from "react";
import {
    getEmployees, createEmployee, updateEmployee, deleteEmployee,
    getSupervisorsForService, getServices
} from "../services/hrService";
import { useNotifications } from "../hooks/useNotifications";
import DashboardLayout from "../layouts/DashboardLayout";

const EMPTY_FORM = { name: "", email: "", password: "", role: "employee", hired_at: "", level: "", service_id: "", supervisor_id: "" };

const RoleBadge = ({ role }) => {
    const s = role === "hr" ? "bg-amber-50 text-amber-700" : role === "supervisor" ? "bg-zinc-100 text-zinc-700" : "bg-zinc-50 text-zinc-500";
    return <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${s}`}>{role}</span>;
};

export default function HrEmployeesPage() {
    const { notifications, unreadCount, fetchNotifications } = useNotifications();
    const [employees, setEmployees]     = useState([]);
    const [services, setServices]       = useState([]);
    const [supervisors, setSupervisors] = useState([]);
    const [loading, setLoading]         = useState(true);
    const [modal, setModal]             = useState(null); // null | 'create' | 'edit'
    const [editing, setEditing]         = useState(null);
    const [form, setForm]               = useState(EMPTY_FORM);
    const [busy, setBusy]               = useState(false);
    const [error, setError]             = useState("");
    const [search, setSearch]           = useState("");

    const load = useCallback(() => {
        setLoading(true);
        Promise.all([getEmployees(), getServices()])
            .then(([e, s]) => { setEmployees(e.data.employees ?? []); setServices(s.data ?? []); })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { load(); }, [load]);

    // When service changes in form, reload supervisor dropdown
    useEffect(() => {
        if (!form.service_id) { setSupervisors([]); return; }
        getSupervisorsForService(form.service_id)
            .then(r => setSupervisors(r.data.supervisors ?? []))
            .catch(() => setSupervisors([]));
    }, [form.service_id]);

    const openCreate = () => { setForm(EMPTY_FORM); setError(""); setEditing(null); setModal("create"); };
    const openEdit   = (emp) => {
        setForm({
            name: emp.name ?? "", email: emp.email ?? "", password: "",
            role: emp.role ?? "employee", hired_at: emp.hired_at ?? "",
            level: emp.level ?? "", service_id: emp.service_id ?? "", supervisor_id: emp.supervisor_id ?? "",
        });
        setError(""); setEditing(emp); setModal("edit");
    };
    const closeModal = () => { setModal(null); setEditing(null); setError(""); };

    const f = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));

    const save = async (e) => {
        e.preventDefault();
        setBusy(true); setError("");
        try {
            const payload = { ...form };
            if (modal === "edit" && !payload.password) delete payload.password;
            if (modal === "edit") await updateEmployee(editing.id, payload);
            else await createEmployee(payload);
            closeModal(); load();
        } catch (err) {
            setError(err.response?.data?.error ?? Object.values(err.response?.data?.errors ?? {}).flat()[0] ?? "Failed to save.");
        }
        setBusy(false);
    };

    const destroy = async (id, name) => {
        if (!confirm(`Delete ${name}? This cannot be undone.`)) return;
        try { await deleteEmployee(id); load(); }
        catch (err) { alert(err.response?.data?.error ?? "Failed to delete."); }
    };

    const filtered = employees.filter(e => {
        const q = search.toLowerCase();
        return e.name?.toLowerCase().includes(q) || e.email?.toLowerCase().includes(q) || e.service?.toLowerCase().includes(q);
    });

    return (
        <DashboardLayout notifications={notifications} unreadCount={unreadCount} fetchNotifications={fetchNotifications}>
            <div className="space-y-4">

                {/* Create/Edit Modal */}
                {modal && (
                    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl border border-zinc-200 w-full max-w-lg">
                            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
                                <p className="text-sm font-semibold text-zinc-900">{modal === "create" ? "Add Employee" : `Edit — ${editing?.name}`}</p>
                                <button onClick={closeModal} className="text-zinc-400 hover:text-zinc-700 transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                                </button>
                            </div>
                            <form onSubmit={save} className="px-6 py-5 space-y-4">
                                {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}

                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="Full Name" required>
                                        <input required value={form.name} onChange={f("name")} className={inputCls} placeholder="Sara Alaoui" />
                                    </Field>
                                    <Field label="Email" required>
                                        <input type="email" required value={form.email} onChange={f("email")} className={inputCls} placeholder="sara@company.com" />
                                    </Field>
                                    <Field label={modal === "edit" ? "New Password (leave blank to keep)" : "Password"} required={modal === "create"}>
                                        <input type="password" required={modal === "create"} value={form.password} onChange={f("password")} className={inputCls} placeholder="••••••••" />
                                    </Field>
                                    <Field label="Role" required>
                                        <select required value={form.role} onChange={f("role")} className={inputCls}>
                                            <option value="employee">Employee</option>
                                            <option value="supervisor">Supervisor</option>
                                            <option value="hr">HR</option>
                                        </select>
                                    </Field>
                                    <Field label="Hired At">
                                        <input type="date" value={form.hired_at} onChange={f("hired_at")} className={inputCls} />
                                    </Field>
                                    <Field label="Level">
                                        <input value={form.level} onChange={f("level")} className={inputCls} placeholder="e.g. Senior" />
                                    </Field>
                                    <Field label="Department" required>
                                        <select required value={form.service_id} onChange={f("service_id")} className={inputCls}>
                                            <option value="">Select…</option>
                                            {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </Field>
                                    <Field label="Supervisor">
                                        <select value={form.supervisor_id} onChange={f("supervisor_id")} className={inputCls} disabled={!form.service_id}>
                                            <option value="">None</option>
                                            {supervisors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </Field>
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    <button type="button" onClick={closeModal}
                                        className="px-3 py-1.5 text-sm text-zinc-600 border border-zinc-200 rounded-md hover:text-zinc-900 transition">Cancel</button>
                                    <button type="submit" disabled={busy}
                                        className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium rounded-md transition disabled:opacity-60">
                                        {busy ? "Saving…" : modal === "create" ? "Create" : "Save Changes"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Top bar */}
                <div className="flex items-center gap-3">
                    <div className="relative flex-1 max-w-sm">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <circle cx="11" cy="11" r="8" strokeWidth="2"/><path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        <input className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-zinc-300 rounded-md outline-none placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
                            placeholder="Search employees…" value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <button onClick={openCreate}
                        className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium rounded-md transition whitespace-nowrap">
                        + Add Employee
                    </button>
                </div>

                <p className="text-xs text-zinc-400">{filtered.length} employee{filtered.length !== 1 ? "s" : ""}</p>

                {loading ? (
                    <div className="flex justify-center py-12"><div className="w-5 h-5 border-2 border-zinc-200 border-t-zinc-800 rounded-full animate-spin" /></div>
                ) : filtered.length === 0 ? (
                    <div className="bg-white rounded-xl border border-zinc-200 p-10 text-center text-sm text-zinc-400">No employees found.</div>
                ) : (
                    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-zinc-50 border-b border-zinc-100">
                                <tr>{["Name", "Role", "Department", "Supervisor", "Hired", ""].map(h => (
                                    <th key={h} className="px-4 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
                                ))}</tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-50">
                                {filtered.map(emp => (
                                    <tr key={emp.id} className="hover:bg-zinc-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-zinc-200 text-zinc-600 text-xs font-bold flex items-center justify-center shrink-0">
                                                    {emp.name?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-zinc-800">{emp.name}</p>
                                                    <p className="text-[11px] text-zinc-400">{emp.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3"><RoleBadge role={emp.role} /></td>
                                        <td className="px-4 py-3 text-zinc-500">{emp.service ?? "—"}</td>
                                        <td className="px-4 py-3 text-zinc-400">{emp.supervisor ?? "—"}</td>
                                        <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">{emp.hired_at ? new Date(emp.hired_at).toLocaleDateString() : "—"}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                <button onClick={() => openEdit(emp)}
                                                    className="text-xs text-zinc-400 hover:text-zinc-900 transition">Edit</button>
                                                <button onClick={() => destroy(emp.id, emp.name)}
                                                    className="text-xs text-zinc-400 hover:text-red-500 transition">Delete</button>
                                            </div>
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

// ── Helpers ───────────────────────────────────────────────────────────────────
const inputCls = "w-full px-3 py-2 text-sm border border-zinc-300 rounded-md outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 bg-white";

const Field = ({ label, required, children }) => (
    <div className="space-y-1">
        <label className="text-xs font-medium text-zinc-700">{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>
        {children}
    </div>
);
