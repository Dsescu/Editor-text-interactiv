import axios from "axios";

//axios cu adresa de baza a API-ului
const API = axios.create({
  baseURL: "http://127.0.0.1:8000/api/",
});

//pune token-ul automat la fiecare request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});


//AUTH
//login
export const login = (username, password) =>
  axios.post("http://127.0.0.1:8000/api/auth/token/", {
    username,
    password,
  });

//register
export const register = (username, email, password) =>
  axios.post("http://127.0.0.1:8000/api/auth/register/", {
    username,
    email,
    password,
  });


//DOC
export const fetchDocuments = () => API.get("documents/");

//creeaza document
export const createDocument = (d) => API.post("documents/", d);

//modifica document
export const updateDocument = (id, d) => API.put(`documents/${id}/`, d);

//sterge document
export const deleteDocument = (id) => API.delete(`documents/${id}/`);


//STYLES
export const fetchStyles = () => API.get("styles/");

//creeaza stil
export const createStyle = (s) => API.post("styles/", s);


//MEDIA
// upload fisier
export const uploadMedia = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return API.post("media-files/", formData);
};
