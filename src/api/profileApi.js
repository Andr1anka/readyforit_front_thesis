import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Авто-вставка JWT
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// === Профіль ===
export const getMyProfile = async () => {
  const res = await API.get("/user/me");
  return res.data;
};

export const updateProfile = async (payload) => {
  const res = await API.put("/user/me", payload);
  return res.data;
};

export const changePassword = async (currentPassword, newPassword) => {
  await API.put("/user/me/password", { currentPassword, newPassword });
};

export const uploadAvatar = async (file) => {
  const form = new FormData();
  form.append("file", file);
  const res = await API.post("/user/me/avatar", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

// === Верифікація ===
export const submitVerification = async (documentBlob, selfieBlob) => {
  const form = new FormData();
  form.append("document", documentBlob, "document.jpg");
  form.append("selfie", selfieBlob, "selfie.jpg");
  const res = await API.post("/verification", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const getVerificationStatus = async () => {
  const res = await API.get("/verification/status");
  return res.data;
};

export const escalateVerification = async () => {
  await API.post("/verification/escalate");
};

// === Інтерв'юер ===
export const applyForInterviewer = async (data, proofFiles) => {
  const form = new FormData();
  form.append("data", new Blob([JSON.stringify(data)], { type: "application/json" }));
  proofFiles.forEach((f) => form.append("proofs", f));
  const res = await API.post("/interviewer-request", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const getMyInterviewerRequest = async () => {
  const res = await API.get("/interviewer-request/me");
  return res.status === 204 ? null : res.data;
};

// === Платежі ===
export const initTopup = async (amount, currency = "UAH") => {
  const res = await API.post("/payment/topup/init", { amount, currency });
  return res.data;
};

export const getPaymentHistory = async () => {
  const res = await API.get("/payment/history");
  return res.data;
};