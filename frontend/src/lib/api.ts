import axios from "axios";

// Create one axios instance for the whole app
// baseURL comes from your .env.local file
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
});

// This runs automatically before EVERY request
// It grabs the JWT token from localStorage and adds it to the header
// So you never have to manually add Authorization header anywhere
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;