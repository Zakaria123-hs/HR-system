import api from "../api/axios";

// Leave
export const hrPendingRequests        = ()                       => api.get("/api/hr/leave/pending");
export const hrApprove                = (id)                     => api.post(`/api/hr/leave/approve/${id}`);
export const hrReject                 = (id, rejection_reason)   => api.post(`/api/hr/leave/reject/${id}`, { rejection_reason });

// Documents
export const hrDocumentPending        = ()                       => api.get("/api/hr/document-requests/pending");
export const hrDocumentApprove        = (id)                     => api.post(`/api/hr/document-requests/${id}/approve`);
export const hrDocumentReject         = (id, rejection_reason)   => api.post(`/api/hr/document-requests/${id}/reject`, { rejection_reason });

// Employees CRUD
export const getEmployees             = ()                       => api.get("/api/hr/employees");
export const createEmployee           = (data)                   => api.post("/api/hr/employees", data);
export const updateEmployee           = (id, data)               => api.put(`/api/hr/employees/${id}`, data);
export const deleteEmployee           = (id)                     => api.delete(`/api/hr/employees/${id}`);
export const getSupervisorsForService = (serviceId)              => api.get(`/api/hr/services/${serviceId}/supervisors`);

// Shared
export const getServices              = ()                       => api.get("/api/services");
