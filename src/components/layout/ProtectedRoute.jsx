import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../app/AuthContext";

export default function ProtectedRoute({ children }) {
  const { isAuthed, ready } = useAuth();
  const location = useLocation();
  if (!ready) return null;

  if (!isAuthed) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
