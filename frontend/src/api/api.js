import axios from "axios";

//detectam IP-u; de pe care s-a incarcat pagina
const hostname = window.location.hostname; 
const API_URL = `http://${hostname}:8000/api/`;

const API = axios.create({
  baseURL: API_URL,
});


API.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// gestionare erori (cand expira token-ul)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.log("Token expired, redirecting to login...");
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);


// AUTH
// Login 
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


// DOCUMENTS
export const fetchDocuments = () => API.get("documents/");
export const createDocument = (data) => API.post("documents/", data);
export const updateDocument = (id, data) => API.patch(`documents/${id}/`, data);
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


// STYLES
export const fetchStyles = () => API.get("styles/");
export const createStyle = (style) => API.post("styles/", style);
export const deleteStyle = (id) => API.delete(`styles/${id}/`);


// MEDIA
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
