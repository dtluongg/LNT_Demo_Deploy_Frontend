import axios from "axios";

const apiBaseURL = import.meta.env.VITE_API_URL;
const devApiBaseURL = "http://localhost:4000/api"; 
const prodApiBaseURL = `${apiBaseURL}/api`;
const apiBase = import.meta.env.VITE_API_URL ? prodApiBaseURL : devApiBaseURL;

const api = axios.create({
  baseURL: apiBase, // đổi sang baseUrl production khi deploy
  headers: {
    "Content-Type": "application/json"
  }
});

export default api;
