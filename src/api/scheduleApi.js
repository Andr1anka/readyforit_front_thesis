import axios from "axios";

const API = axios.create({ baseURL: import.meta.env.VITE_API_URL });
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const getActualSchedule = async () => {
  const res = await API.get("/schedule/actual");
  return res.data;
};

export const getArchivedSchedule = async () => {
  const res = await API.get("/schedule/archived");
  return res.data;
};

export const getJoinInfo = async (lessonId) => {
  const res = await API.get(`/schedule/join/${lessonId}`);
  return res.data;
};
