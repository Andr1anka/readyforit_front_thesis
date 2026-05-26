import axios from "axios";

const API = axios.create({ baseURL: import.meta.env.VITE_API_URL });
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// --- Скарги ---
export const adminGetComplaints = async (status = "OPEN") => {
  const res = await API.get("/admin/complaints", { params: { status } });
  return res.data;
};
export const adminResolveComplaint = async (id, accept, comment) => {
  const res = await API.post(`/admin/complaints/${id}/resolve`, { comment }, { params: { accept } });
  return res.data;
};

// --- Користувачі ---
export const adminGetUsers = async () => {
  const res = await API.get("/admin/users");
  return res.data;
};
export const adminSetBlocked = async (id, blocked) => {
  const res = await API.post(`/admin/users/${id}/block`, null, { params: { blocked } });
  return res.data;
};

// --- Заявки інтерв'юерів ---
export const adminGetRequests = async () => {
  const res = await API.get("/admin/requests");
  return res.data;
};
export const adminDecideRequest = async (id, approve, comment) => {
  const res = await API.post(`/admin/requests/${id}/decide`, { comment }, { params: { approve } });
  return res.data;
};

// --- Верифікація ---
export const adminGetVerifications = async () => {
  const res = await API.get("/admin/verifications");
  return res.data;
};
export const adminDecideVerification = async (userId, approve) => {
  const res = await API.post(`/admin/verifications/${userId}/decide`, null, { params: { approve } });
  return res.data;
};
