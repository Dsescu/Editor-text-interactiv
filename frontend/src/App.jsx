import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import EditorPage from "./pages/EditorPage";
import ProtectedRoute from "./components/ProtectedRoute";
import StylesPage from "./pages/StylesPage";
import SharedDocPage from "./pages/SharedDocPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/*login*/}
        <Route path="/" element={<Login />} />

        {/*register*/}
        <Route path="/register" element={<Register />} />

        {/*Ruta publica pentru documente partajate*/}
        <Route path="shared/:token" element={<SharedDocPage />} />
        
        {/*dashboard*/}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/*editor*/}
        <Route
          path="/editor/:id"
          element={
            <ProtectedRoute>
              <EditorPage />
            </ProtectedRoute>
          }
        />

        {/*styles*/}
        <Route
          path="/styles"
          element={
            <ProtectedRoute>
              <StylesPage />
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
