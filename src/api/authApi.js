import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

export const registerUser = async (data) => {
  const res = await API.post("/auth/register", data);
  return res.data;
};

export const loginUser = async (data) => {
  const res = await API.post("/auth/login", data);
  return res.data;
};

export const forgotPassword = async (email) => {
  const res = await API.post(`/auth/forgot-password?email=${encodeURIComponent(email)}`);
  return res.data;
};

export const resetPassword = async (token, newPassword) => {
  const res = await API.post(
    `/auth/reset-password?token=${encodeURIComponent(token)}&newPassword=${encodeURIComponent(newPassword)}`
  );
  return res.data;
};