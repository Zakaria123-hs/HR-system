import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useLocation } from "react-router-dom";
import { readNotification } from "../services/employeeService";

// ── Primitives ────────────────────────────────────────────────────────────────
const NavLink = ({ to, icon, label, isActive, onClick }) => (
    <Link
        to={to}
        onClick={onClick}
        className={`group relative flex items-center gap-3 pl-3.5 pr-3 py-2 rounded-md text-sm font-medium transition-colors ${
            isActive ? "bg-zinc-100 text-zinc-900" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
        }`}
    >
        {isActive && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5 rounded-full bg-blue-600" />
        )}
        <span className={isActive ? "text-blue-600" : "text-zinc-400 group-hover:text-zinc-600"}>{icon}</span>
        {label}
    </Link>
);

const NavSection = ({ label }) => (
    <p className="px-3 pt-4 pb-1 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">{label}</p>
);

// ── Icons ─────────────────────────────────────────────────────────────────────
const Icon = {
    dashboard:  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" strokeWidth="2"/><rect x="14" y="3" width="7" height="7" rx="1" strokeWidth="2"/><rect x="3" y="14" width="7" height="7" rx="1" strokeWidth="2"/><rect x="14" y="14" width="7" height="7" rx="1" strokeWidth="2"/></svg>,
    requests:   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>,
    team:       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
    calendar:   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>,
    document:   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>,
    employees:  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197"/></svg>,
    bell:       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>,
    inbox:      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/></svg>,
    attendance: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" strokeWidth="2"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 7v5l3 2"/></svg>,
    menu:       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/></svg>,
    close:      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>,
};

const pageTitles = {
    "/dashboard":          "Dashboard",
    "/my-requests":        "My Leave Requests",
    "/my-documents":       "Document Requests",
    "/team":               "Team Directory",
    "/Attendance":         "Attendance",
    "/holidays":           "Company Holidays",
    "/supervisor":         "Leave Validations",
    "/hr/leave":           "HR — Leave Approvals",
    "/hr/documents":       "HR — Document Requests",
    "/hr/employees":       "HR — Employee Management",
};

const DashboardLayout = ({ children, unreadCount = 0, notifications = [], fetchNotifications }) => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const p = location.pathname;
    const [showNotif, setShowNotif] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false); // mobile drawer
    const notifRef = useRef(null);

    // Close notif dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Close mobile drawer on route change
    useEffect(() => {
        setSidebarOpen(false);
    }, [p]);

    // Close mobile drawer on Escape
    useEffect(() => {
        const onKey = (e) => { if (e.key === "Escape") setSidebarOpen(false); };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, []);

    // Lock body scroll while drawer is open
    useEffect(() => {
        document.body.style.overflow = sidebarOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [sidebarOpen]);

    const role = user?.role;
    const title = pageTitles[p] ?? "HR Connect";
    const closeSidebar = () => setSidebarOpen(false);

    const navContent = (
        <>
            <NavLink to="/dashboard"   icon={Icon.dashboard}   label="Dashboard"  isActive={p === "/dashboard"} onClick={closeSidebar} />
            <NavSection label="Workforce" />
            <NavLink to="/team"        icon={Icon.team}        label="Team"       isActive={p === "/team"} onClick={closeSidebar} />
            <NavLink to="/Attendance"  icon={Icon.attendance}  label="Attendance" isActive={p === "/Attendance"} onClick={closeSidebar} />
            <NavLink to="/holidays"    icon={Icon.calendar}    label="Holidays"   isActive={p === "/holidays"} onClick={closeSidebar} />

            {role !== "hr" && (
                <>
                    <NavSection label="My Requests" />
                    <NavLink to="/my-requests"  icon={Icon.requests} label="Leave Requests" isActive={p === "/my-requests"} onClick={closeSidebar} />
                    <NavLink to="/my-documents" icon={Icon.document} label="Documents"      isActive={p === "/my-documents"} onClick={closeSidebar} />
                </>
            )}

            {role === "supervisor" && (
                <>
                    <NavSection label="Management" />
                    <NavLink to="/supervisor" icon={Icon.inbox} label="Leave Validations" isActive={p === "/supervisor"} onClick={closeSidebar} />
                </>
            )}

            {role === "hr" && (
                <>
                    <NavSection label="HR" />
                    <NavLink to="/hr/leave"      icon={Icon.inbox}     label="Leave Approvals"   isActive={p === "/hr/leave"} onClick={closeSidebar} />
                    <NavLink to="/hr/documents"  icon={Icon.document}  label="Document Requests" isActive={p === "/hr/documents"} onClick={closeSidebar} />
                    <NavLink to="/hr/employees"  icon={Icon.employees} label="Employees"         isActive={p === "/hr/employees"} onClick={closeSidebar} />
                </>
            )}
        </>
    );

    const userFooter = (
        <div className="px-3 py-3 border-t border-zinc-100 shrink-0">
            <div className="flex items-center gap-2.5 px-2 py-1.5">
                <div className="w-8 h-8 rounded-full bg-zinc-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {user?.name?.charAt(0).toUpperCase() ?? "U"}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-zinc-800 truncate">{user?.name}</p>
                    <p className="text-[11px] text-zinc-400 truncate capitalize">{user?.role}</p>
                </div>
                <button onClick={logout} title="Sign out" aria-label="Sign out" className="text-zinc-400 hover:text-zinc-700 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-zinc-50 overflow-hidden">

            {/* ── MOBILE BACKDROP ──────────────────────────────────── */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-zinc-900/40 z-40 md:hidden"
                    onClick={closeSidebar}
                    aria-hidden="true"
                />
            )}

            {/* ── SIDEBAR ───────────────────────────────────────────── */}
            <aside
                className={`fixed md:static inset-y-0 left-0 z-50 w-64 md:w-60 bg-white border-r border-zinc-200 flex flex-col shrink-0
                    transform transition-transform duration-200 ease-out
                    ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
            >
                {/* Brand */}
                <div className="h-14 px-4 flex items-center justify-between gap-2.5 border-b border-zinc-100 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 bg-zinc-900 rounded-md flex items-center justify-center text-white text-[11px] font-bold">HR</div>
                        <span className="font-semibold text-zinc-900 text-sm tracking-tight">HR Connect</span>
                    </div>
                    <button
                        onClick={closeSidebar}
                        aria-label="Close menu"
                        className="md:hidden text-zinc-400 hover:text-zinc-700 p-1 -mr-1"
                    >
                        {Icon.close}
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-0.5">
                    {navContent}
                </nav>

                {userFooter}
            </aside>

            {/* ── MAIN ──────────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

                {/* Header */}
                <header className="h-14 bg-white border-b border-zinc-200 px-4 md:px-6 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            aria-label="Open menu"
                            className="md:hidden text-zinc-500 hover:text-zinc-900 p-1.5 -ml-1.5 rounded-md hover:bg-zinc-100 transition-colors"
                        >
                            {Icon.menu}
                        </button>
                        <h1 className="text-sm font-semibold text-zinc-900 truncate">{title}</h1>
                    </div>

                    <div className="flex items-center gap-2 shrink-0" ref={notifRef}>
                        <div className="relative">
                            <button
                                onClick={() => setShowNotif(v => !v)}
                                aria-label="Notifications"
                                className="relative p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
                            >
                                {Icon.bell}
                                {unreadCount > 0 && (
                                    <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-blue-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                                        {unreadCount > 9 ? "9+" : unreadCount}
                                    </span>
                                )}
                            </button>

                            {showNotif && (
                                <div className="fixed md:absolute left-4 right-4 md:left-auto md:right-0 top-16 md:top-auto md:mt-2 w-auto md:w-80 bg-white rounded-xl border border-zinc-200 shadow-lg md:shadow-none z-50 overflow-hidden">
                                    <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
                                        <p className="text-xs font-semibold text-zinc-900">Notifications</p>
                                        {unreadCount > 0 && <span className="text-[10px] text-zinc-400">{unreadCount} unread</span>}
                                    </div>
                                    <div className="max-h-80 overflow-y-auto divide-y divide-zinc-50">
                                        {notifications.length === 0 ? (
                                            <p className="px-4 py-8 text-center text-xs text-zinc-400">No notifications yet.</p>
                                        ) : notifications.map(n => {
                                            const target = role === "supervisor" ? "/supervisor" : role === "hr" ? "/hr/leave" : n.document_request_id ? "/my-documents" : "/my-requests";
                                            return (
                                                <Link key={n.id} to={target}
                                                    onClick={async () => {
                                                        setShowNotif(false);
                                                        if (!n.read_at) { try { await readNotification(n.id); fetchNotifications?.(); } catch { /* noop */ } }
                                                    }}
                                                    className="flex items-start gap-3 px-4 py-3 hover:bg-zinc-50 transition-colors"
                                                >
                                                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${n.read_at ? "bg-zinc-200" : "bg-blue-600"}`} />
                                                    <div className="min-w-0">
                                                        <p className="text-xs text-zinc-700 leading-snug">{n.message}</p>
                                                        <p className="text-[10px] text-zinc-400 mt-0.5">{new Date(n.created_at).toLocaleDateString()}</p>
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;