import { useEffect, useState } from "react";
import { dashboardData } from "../services/employeeService";
import { useNotifications } from "../hooks/useNotifications";
import DashboardLayout from "../layouts/DashboardLayout";

const Stat = ({ label, value, color = "text-zinc-900" }) => (
    <div className="flex items-center justify-between py-3 border-b border-zinc-100 last:border-0">
        <span className="text-sm text-zinc-500">{label}</span>
        <span className={`text-sm font-semibold ${color}`}>{value}</span>
    </div>
);

export default function DashboardPage() {
    const { notifications, unreadCount, fetchNotifications } = useNotifications();
    const [data, setData] = useState(null);

    useEffect(() => {
        dashboardData().then(r => setData(r.data)).catch(() => {});
    }, []);

    const gi = data?.general_info;
    const to = data?.time_off;

    return (
        <DashboardLayout notifications={notifications} unreadCount={unreadCount} fetchNotifications={fetchNotifications}>
            {!data ? (
                <div className="flex items-center justify-center h-48">
                    <div className="w-5 h-5 border-2 border-zinc-200 border-t-zinc-800 rounded-full animate-spin" />
                </div>
            ) : (
                <div className="flex gap-6 items-start">
                    {/* Profile card */}
                    <div className="w-72 shrink-0 bg-white rounded-xl border border-zinc-200 overflow-hidden">
                        <div className="px-6 pt-8 pb-5 text-center border-b border-zinc-100">
                            <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center text-white text-lg font-bold mx-auto mb-3">
                                {gi?.name?.charAt(0).toUpperCase()}
                            </div>
                            <p className="font-semibold text-zinc-900">{gi?.name}</p>
                            <span className="inline-block mt-1.5 px-2 py-0.5 bg-zinc-100 text-zinc-600 text-xs font-medium rounded capitalize">{gi?.role}</span>
                        </div>
                        <div className="px-5 py-1">
                            <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider pt-3 pb-1">Info</p>
                            <Stat label="Email" value={gi?.email} />
                            <Stat label="Department" value={gi?.service} />
                        </div>
                        <div className="px-5 py-1 pb-4">
                            <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider pt-3 pb-1">Time Off</p>
                            <Stat label="Approved"  value={to?.days_approved}  color="text-emerald-600" />
                            <Stat label="Pending"   value={to?.days_awaiting}  color="text-amber-500" />
                            <Stat label="Remaining" value={to?.days_remaining} color="text-zinc-900" />
                        </div>
                    </div>

                    {/* Feed */}
                    <div className="flex-1 space-y-4">
                        <div className="bg-white rounded-xl border border-zinc-200 p-6">
                            <p className="text-sm font-semibold text-zinc-900 mb-4">Announcements</p>
                            <p className="text-sm text-zinc-400 text-center py-8">No announcements at the moment.</p>
                        </div>
                        <div className="bg-white rounded-xl border border-zinc-200 p-6">
                            <p className="text-sm font-semibold text-zinc-900 mb-4">Tasks</p>
                            <p className="text-sm text-zinc-400 text-center py-8">No tasks assigned to you.</p>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
