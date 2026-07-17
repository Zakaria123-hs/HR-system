import api from "../api/axios";

export const generateQrToken        = ()      => api.get("/api/attendance/generate-qr");
export const scanQrToken            = (data)  => api.post("/api/attendance/scan-qr", data);