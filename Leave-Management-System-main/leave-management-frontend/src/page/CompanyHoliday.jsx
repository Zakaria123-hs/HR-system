import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import { holidays } from "../services/employeeService";
import { useNotifications } from "../hooks/useNotifications";
import DashboardLayout from "../layouts/DashboardLayout";

export default function CompanyHoliday() {
    const { notifications, unreadCount, fetchNotifications } = useNotifications();
    const [events, setEvents]   = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        holidays()
            .then(r => setEvents(
                (r.data.holidays ?? []).map(h => ({
                    id: h.id, title: h.name, start: h.date, allDay: true,
                    backgroundColor: "#f4f4f5", borderColor: "#a1a1aa", textColor: "#18181b",
                }))
            ))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    return (
        <DashboardLayout notifications={notifications} unreadCount={unreadCount} fetchNotifications={fetchNotifications}>
            <div className="bg-white rounded-xl border border-zinc-200 p-6">
                <div className="mb-5">
                    <p className="text-sm font-semibold text-zinc-900">Company Holidays</p>
                    <p className="text-xs text-zinc-400 mt-0.5">Official non-working days and public holidays.</p>
                </div>
                {loading ? (
                    <div className="flex justify-center py-12"><div className="w-5 h-5 border-2 border-zinc-200 border-t-zinc-800 rounded-full animate-spin" /></div>
                ) : (
                    <>
                        <style>{`
                            .fc .fc-toolbar-title{font-size:14px!important;font-weight:600!important;color:#18181b}
                            .fc .fc-button-primary{background:#fff!important;border:1px solid #e4e4e7!important;color:#52525b!important;font-size:12px!important;font-weight:500!important;box-shadow:none!important;border-radius:6px!important;padding:5px 10px!important}
                            .fc .fc-button-primary:hover{background:#f4f4f5!important;color:#18181b!important}
                            .fc th{background:#fafafa;padding:8px 0!important;font-size:11px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:.05em;border-color:#f4f4f5!important}
                            .fc td{border-color:#f4f4f5!important;font-size:13px}
                            .fc-h-event{border-radius:4px!important;padding:1px 5px!important;font-size:11px!important;font-weight:600!important}
                        `}</style>
                        <FullCalendar
                            plugins={[dayGridPlugin]}
                            initialView="dayGridMonth"
                            events={events}
                            headerToolbar={{ left: "prev,next today", center: "title", right: "" }}
                            height="auto"
                            fixedWeekCount={false}
                        />
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}
