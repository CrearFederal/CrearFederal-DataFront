import axios from "axios";

const apiBaseURL = import.meta.env.VITE_API_URL?.trim().replace(/\/$/, "");

export const instanceAxios = axios.create({
  baseURL: apiBaseURL,
  withCredentials: true,
  timeout: 30000,
});