import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import {
  getRole
} from "../models/authModel";
import {
  loginAsAdmin,
  loginAsFarmer,
  logout,
  restoreAdminSession,
  subscribeToAuthChanges
} from "../controllers/authController";
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/AdminDashboard";
import FarmerProfile from "./pages/FarmerProfile";
import FarmerDetails from "./pages/FarmerDetails";

function Protected({ session, type, children }) {
  const location = useLocation();

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (session.type !== type) {
    return <Navigate to={session.type === "admin" ? "/admin/dashboard" : "/profile"} replace />;
  }

  return children;
}

export default function App() {
  const [session, setSession] = useState(null);
  const [booting, setBooting] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const adminSession = await restoreAdminSession();
        if (adminSession && mounted) {
          setSession(adminSession);
        } else {
          const rawFarmer = localStorage.getItem("terrasync_farmer");
          if (rawFarmer && mounted) {
            const farmer = JSON.parse(rawFarmer);
            setSession({ type: "farmer", farmer });
          }
        }
      } catch (error) {
        console.error("Session restore failed:", error);
      } finally {
        if (mounted) setBooting(false);
      }
    })();

    const { data: listener } = subscribeToAuthChanges(async (_event, authSession) => {
      if (!mounted) return;
      if (!authSession) {
        const rawFarmer = localStorage.getItem("terrasync_farmer");
        setSession(rawFarmer ? { type: "farmer", farmer: JSON.parse(rawFarmer) } : null);
        return;
      }

      try {
        const role = await getRole(authSession.user.id);
        if (role === "admin") setSession({ type: "admin", user: authSession.user });
      } catch (error) {
        console.error(error);
      }
    });

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  async function handleLogin(mode, credentials) {
    const result =
      mode === "admin"
        ? await loginAsAdmin(credentials.identifier, credentials.password)
        : await loginAsFarmer(credentials.identifier, credentials.password);

    setSession(result);
    if (result.type === "admin") navigate("/admin/dashboard", { replace: true });
    else {
      localStorage.setItem("terrasync_farmer", JSON.stringify(result.farmer));
      navigate("/profile", { replace: true });
    }
  }

  async function handleLogout() {
    await logout();
    setSession(null);
    navigate("/login", { replace: true });
  }

  if (booting) {
    return <div className="app-loading">Loading TerraSync...</div>;
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          session ? (
            <Navigate to={session.type === "admin" ? "/admin/dashboard" : "/profile"} replace />
          ) : (
            <LoginPage onLogin={handleLogin} />
          )
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <Protected session={session} type="admin">
            <AdminDashboard session={session} onLogout={handleLogout} />
          </Protected>
        }
      />
      <Route
        path="/admin/farmers/:farmerId"
        element={
          <Protected session={session} type="admin">
            <FarmerDetails onLogout={handleLogout} />
          </Protected>
        }
      />
      <Route
        path="/profile"
        element={
          <Protected session={session} type="farmer">
            <FarmerProfile session={session} onLogout={handleLogout} onSessionChange={setSession} />
          </Protected>
        }
      />
      <Route path="*" element={<Navigate to={session ? (session.type === "admin" ? "/admin/dashboard" : "/profile") : "/login"} replace />} />
    </Routes>
  );
}
