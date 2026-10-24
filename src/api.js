import axios from "axios";
export const API = import.meta.env.VITE_API_URL || "http://localhost:3000";
export const api = axios.create({ baseURL: API });
export const src = (id) => `${API}/video/${id}`;
