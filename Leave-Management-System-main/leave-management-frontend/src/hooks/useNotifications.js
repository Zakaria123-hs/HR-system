import { useState, useEffect, useCallback } from "react";
import { getMyNotifications } from "../services/employeeService";

export function useNotifications() {
    const [notifications, setNotifications] = useState([]);

    const fetch = useCallback(async () => {
        try {
            const res = await getMyNotifications();
            setNotifications(res.data.notifications ?? []);
        } catch {}
    }, []);

    useEffect(() => { fetch(); }, [fetch]);

    return {
        notifications,
        unreadCount: notifications.filter(n => !n.read_at).length,
        fetchNotifications: fetch,
    };
}
