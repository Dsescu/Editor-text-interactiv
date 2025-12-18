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
  axios.post("http://127.0.0.1:8000/api/register/", {
    username,
    email,
    password,
  });

// ===========================
// DOCUMENTS
// ===========================

export const fetchDocuments = () => API.get("documents/");
export const createDocument = (data) => API.post("documents/", data);
export const updateDocument = (id, data) => API.put(`documents/${id}/`, data);
export const deleteDocument = (id) => API.delete(`documents/${id}/`);
export const autoSaveDocument = (id, content) => API.post(`documents/${id}/autosave/`, { content });

export const shareDocument = (id, type, data = {}) =>{
  const config = {
    responseType: type === 'pdf' ? 'blob' : 'json',
  };
  return API.post(`documents/${id}/share/`, {type, ...data}, config);
};

export const getDocumentCollaborators = (id) => API.get(`documents/${id}/collaborators/`);
export const addDocumentCollaborator = (id, email, canEdit = true) => API.post(`documents/${id}/collaborators/`, { email: email, can_edit: canEdit });
export const removeDocumentCollaborator = (id, userId) => API.delete(`documents/${id}/collaborators/` , { data: { user_id: userId } });
export const fetchSharedDocument = (token) => axios.get(`http://127.0.0.1:8000/api/shared/${token}/`);

export const updateShareDocument = (token, content) => {
  const localToken = localStorage.getItem("access");
  const headers = localToken ? { Authorization: `Bearer ${localToken}` } : {};
  return axios.post(`http://127.0.0.1:8000/api/shared/${token}/update/`, { content }, { headers });
}


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
