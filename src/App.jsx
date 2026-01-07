import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import News from "./pages/News";
import Friends from "./pages/Friends";

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Navigate to="/home" replace />} />
        {/* Pages */}
        <Route path="/home" element={<Home />} />
        <Route path="/news" element={<News />} />
        <Route path="/notices" element={<h1>Notices</h1>} />
        <Route path="/friends" element={<Friends />} />

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* Other */}
        <Route path="/profile" element={<h1>Profile</h1>} />
        <Route path="/add-pet" element={<h1>Add Pet</h1>} />
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Route>
    </Routes>
  );
}
