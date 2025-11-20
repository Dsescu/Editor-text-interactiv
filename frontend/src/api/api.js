import axios from "axios";

// Instanța principală Axios
const API = axios.create({
  baseURL: "http://127.0.0.1:8000/api/",
});

// Atașează token-ul JWT la fiecare request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ===========================
// AUTH
// ===========================

// Login - (JWT: /api/auth/token/)
export const login = (username, password) =>
  axios.post("http://127.0.0.1:8000/api/auth/token/", {
    username,
    password,
  });

// Register
export const register = (username, email, password) =>
  axios.post("http://127.0.0.1:8000/api/auth/register/", {
    username,
    email,
    password,
  });

// ===========================
// DOCUMENTS
// ===========================

export const fetchDocuments = () => API.get("documents/");
export const createDocument = (data) => API.post("documents/", data);
export const updateDocument = (id, data) =>
  API.put(`documents/${id}/`, data);
export const deleteDocument = (id) => API.delete(`documents/${id}/`);

// ===========================
// STYLES
// ===========================

export const fetchStyles = () => API.get("styles/");
export const createStyle = (style) => API.post("styles/", style);

// ===========================
// MEDIA (Imagini / Fișiere)
// ===========================

// Upload pentru MediaFileViewSet (media-files/)
export const uploadMedia = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  try{
    const res = await API.post("media-files/", formData);
    return res.data;
  } catch(err){
    console.error("Image upload failed:", err.response?.data || err);
    throw err;
  }
  //return API.post("media-files/", formData, {
   // headers: {
    //  "Content-Type": "multipart/form-data",
    //},
 // });
};

export default API;
