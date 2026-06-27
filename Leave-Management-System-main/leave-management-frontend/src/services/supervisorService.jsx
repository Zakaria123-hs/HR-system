import api from "../api/axios";

export const getPendingRequests = ()                          => api.get("/api/supervisor/pending");
export const approveRequest     = (id)                        => api.post(`/api/supervisor/approve/${id}`);
export const rejectRequest      = (id, rejection_reason)      => api.post(`/api/supervisor/reject/${id}`, { rejection_reason });
