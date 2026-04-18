import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import { Toaster } from "sonner";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Scanner from "./pages/Scanner";
import CardDetail from "./pages/CardDetail";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
const API = `${BACKEND_URL}/api`;

// Configure axios
axios.defaults.withCredentials = false;

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/scanner" element={<Scanner />} />
      <Route path="/card/:cardId" element={<CardDetail />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-zinc-950">
        <AppRouter />
        <Toaster
          theme="dark"
          position="top-right"
          toastOptions={{
            style: {
              background: "hsl(0 0% 7%)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "hsl(0 0% 98%)",
            },
          }}
        />
      </div>
    </BrowserRouter>
  );
}

export { API };
export default App;