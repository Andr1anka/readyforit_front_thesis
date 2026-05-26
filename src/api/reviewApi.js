import axios from "axios";

const API = axios.create({ baseURL: import.meta.env.VITE_API_URL });
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const submitReview = async (lessonId, rating, comment) => {
  const res = await API.post("/reviews", { lessonId: Number(lessonId), rating, comment });
  return res.data;
};

export const submitInterviewerFeedback = async (lessonId, feedback) => {
  const res = await API.post("/reviews/interviewer-feedback", {
    lessonId: Number(lessonId),
    feedback,
  });
  return res.data;
};

export const getMyWrittenReviews = async () => {
  const res = await API.get("/reviews/written");
  return res.data;
};

export const getReceivedReviews = async () => {
  const res = await API.get("/reviews/received");
  return res.data;
};

export const submitComplaint = async (lessonId, title, description) => {
  const res = await API.post("/reviews/complaints", { lessonId: Number(lessonId), title, description });
  return res.data;
};

export const getMyComplaints = async () => {
  const res = await API.get("/reviews/complaints/my");
  return res.data;
};
