import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ===== Налаштування інтерв'юера =====
export const getInterviewerSettings = async () => {
  const res = await API.get("/interviewer/profile/settings");
  return res.data;
};

export const updateInterviewerSettings = async (payload) => {
  const res = await API.put("/interviewer/profile/settings", payload);
  return res.data;
};

// ===== Види занять =====
export const getLessonTypes = async () => {
  const res = await API.get("/interviewer/profile/lesson-types");
  return res.data;
};

export const createLessonType = async (payload) => {
  const res = await API.post("/interviewer/profile/lesson-types", payload);
  return res.data;
};

export const updateLessonType = async (id, payload) => {
  const res = await API.put(`/interviewer/profile/lesson-types/${id}`, payload);
  return res.data;
};

export const deleteLessonType = async (id) => {
  await API.delete(`/interviewer/profile/lesson-types/${id}`);
};

// ===== Слоти =====
export const previewSlots = async (payload) => {
  const res = await API.post("/interviewer/profile/slots/preview", payload);
  return res.data;
};

export const saveSlots = async (slots) => {
  const res = await API.post("/interviewer/profile/slots", slots);
  return res.data;
};

export const getMySlots = async () => {
  const res = await API.get("/interviewer/profile/slots");
  return res.data;
};

export const deleteSlot = async (id) => {
  await API.delete(`/interviewer/profile/slots/${id}`);
};

// ===== Список інтерв'юерів (Feature 2) =====
export const searchInterviewers = async (filter) => {
  const res = await API.post("/interviewers/search", filter);
  return res.data;
};

export const getInterviewerTags = async () => {
  const res = await API.get("/interviewers/tags");
  return res.data;
};

// ===== Деталі заняття + відгуки (Feature 3) =====
export const getLessonDetails = async (lessonTypeId) => {
  const res = await API.get(`/lessons/${lessonTypeId}`);
  return res.data;
};

export const getInterviewerReviews = async (interviewerId, page = 0, size = 5, sort = "newest") => {
  const res = await API.get(`/lessons/interviewer/${interviewerId}/reviews`, {
    params: { page, size, sort },
  });
  return res.data;
};

// ===== Реєстрація на урок (Feature 4) =====
export const bookLesson = async (lessonTypeId, slotId) => {
  const res = await API.post("/bookings", {
    lessonTypeId: Number(lessonTypeId),
    slotId: Number(slotId),
  });
  return res.data;
};
