import axios from "axios";

const apiBaseURL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const api = axios.create({
  baseURL: apiBaseURL, // đổi sang baseUrl production khi deploy
  headers: {
    "Content-Type": "application/json"
  }
});

export default api;
