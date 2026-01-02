import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<h1>Home</h1>} />
        <Route path="/news" element={<h1>News</h1>} />
        <Route path="/notices" element={<h1>Notices</h1>} />
        <Route path="/friends" element={<h1>Friends</h1>} />
        <Route path="/login" element={<h1>Login</h1>} />
        <Route path="/register" element={<h1>Register</h1>} />
        <Route path="/profile" element={<h1>Profile</h1>} />
        <Route path="/add-pet" element={<h1>Add Pet</h1>} />
      </Route>
    </Routes>
  );
}
