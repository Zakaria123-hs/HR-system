import api from "../api/axios";

// Leave
export const getLeaveTypes          = ()      => api.get("/api/leave-types");
export const getMyBalances          = ()      => api.get("/api/my-balances");
export const getMyRequests          = ()      => api.get("/api/my-leave-requests");
export const postLeaveRequest       = (data)  => api.post("/api/leave-requests", data);
export const cancelLeaveRequest     = (id)    => api.patch(`/api/leave-requests/${id}/cancel`);

// Dashboard / team / holidays
export const dashboardData          = ()      => api.get("/api/dashboard-data");
export const getTeam                = ()      => api.get("/api/team");
export const holidays               = ()      => api.get("/api/company-holidays");

// Notifications
export const getMyNotifications     = ()      => api.get("/api/my-notifications");
export const readNotification       = (id)    => api.post(`/api/notifications/${id}/read`);

// Document requests
export const getAvailableDocuments  = ()      => api.get("/api/documents");
export const getMyDocumentRequests  = ()      => api.get("/api/my-document-requests");
export const postDocumentRequest    = (data)  => api.post("/api/document-requests", data);
