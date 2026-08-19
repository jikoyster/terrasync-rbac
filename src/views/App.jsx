import { useEffect, useState } from "react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { getRole } from "../models/authModel";

import {
  loginAsAdmin,
  loginAsFarmer,
  logout,
  restoreAdminSession,
  subscribeToAuthChanges,
} from "../controllers/authController";

import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/AdminDashboard";
import FarmerProfile from "./pages/FarmerProfile";
import FarmerDetails from "./pages/FarmerDetails";

/**
 * Protected Route
 *
 * Restricts access based on the current user's session type.
 */
function Protected({ session, type, children }) {
  const location = useLocation();

  // Still no authenticated session
  if (!session) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  // User is logged in but has the wrong role
  if (session.type !== type) {
    return (
      <Navigate
        to={
          session.type === "admin"
            ? "/admin/dashboard"
            : "/profile"
        }
        replace
      />
    );
  }

  return children;
}

/**
 * Main Application
 */
export default function App() {
  const [session, setSession] = useState(null);
  const [booting, setBooting] = useState(true);

  const navigate = useNavigate();

  /**
   * Restore authentication session when the application starts.
   *
   * This is important when the user refreshes:
   *
   * /admin/dashboard
   * /admin/farmers/123
   * /profile
   */
  useEffect(() => {
    let mounted = true;

    async function initializeSession() {
      try {
        // ----------------------------------------
        // 1. Try restoring the admin session
        // ----------------------------------------
        const adminSession = await restoreAdminSession();

        if (adminSession && mounted) {
          setSession(adminSession);
          return;
        }

        // ----------------------------------------
        // 2. Try restoring the farmer session
        // ----------------------------------------
        const rawFarmer = localStorage.getItem("terrasync_farmer");

        if (rawFarmer && mounted) {
          try {
            const farmer = JSON.parse(rawFarmer);

            setSession({
              type: "farmer",
              farmer,
            });
          } catch (error) {
            console.error(
              "Invalid farmer session:",
              error
            );

            localStorage.removeItem("terrasync_farmer");
          }
        }
      } catch (error) {
        console.error(
          "Session restore failed:",
          error
        );
      } finally {
        if (mounted) {
          setBooting(false);
        }
      }
    }

    initializeSession();

    /**
     * Listen for Supabase authentication changes.
     */
    const authSubscription = subscribeToAuthChanges(
      async (_event, authSession) => {
        if (!mounted) {
          return;
        }

        // ----------------------------------------
        // User logged out
        // ----------------------------------------
        if (!authSession) {
          const rawFarmer =
            localStorage.getItem("terrasync_farmer");

          if (rawFarmer) {
            try {
              const farmer = JSON.parse(rawFarmer);

              setSession({
                type: "farmer",
                farmer,
              });
            } catch (error) {
              console.error(
                "Invalid farmer session:",
                error
              );

              localStorage.removeItem("terrasync_farmer");
              setSession(null);
            }
          } else {
            setSession(null);
          }

          return;
        }

        // ----------------------------------------
        // User has an authentication session
        // ----------------------------------------
        try {
          const role = await getRole(
            authSession.user.id
          );

          if (!mounted) {
            return;
          }

          if (role === "admin") {
            setSession({
              type: "admin",
              user: authSession.user,
            });
          }
        } catch (error) {
          console.error(
            "Failed to determine user role:",
            error
          );
        }
      }
    );

    /**
     * Cleanup
     */
    return () => {
      mounted = false;

      authSubscription?.subscription?.unsubscribe();
    };
  }, []);

  /**
   * Handle login.
   */
  async function handleLogin(mode, credentials) {
    try {
      const result =
        mode === "admin"
          ? await loginAsAdmin(
              credentials.identifier,
              credentials.password
            )
          : await loginAsFarmer(
              credentials.identifier,
              credentials.password
            );

      if (!result) {
        throw new Error("Login failed.");
      }

      // ----------------------------------------
      // Store session in React state
      // ----------------------------------------
      setSession(result);

      // ----------------------------------------
      // Store farmer session locally
      // ----------------------------------------
      if (result.type === "farmer") {
        localStorage.setItem(
          "terrasync_farmer",
          JSON.stringify(result.farmer)
        );

        navigate("/profile", {
          replace: true,
        });

        return;
      }

      // ----------------------------------------
      // Admin
      // ----------------------------------------
      if (result.type === "admin") {
        navigate("/admin/dashboard", {
          replace: true,
        });
      }
    } catch (error) {
      console.error("Login failed:", error);

      // Let LoginPage handle/display its own error if
      // the login implementation provides one.
      throw error;
    }
  }

  /**
   * Handle logout.
   */
  async function handleLogout() {
    try {
      await logout();
    } catch (error) {
      console.error(
        "Logout failed:",
        error
      );
    } finally {
      // Clear React session
      setSession(null);

      // Clear farmer session
      localStorage.removeItem(
        "terrasync_farmer"
      );

      // Go to login
      navigate("/login", {
        replace: true,
      });
    }
  }

  /**
   * Prevent React Router from rendering routes before
   * authentication restoration is complete.
   *
   * This is important on browser refresh.
   */
  if (booting) {
    return (
      <div className="app-loading">
        Loading TerraSync...
      </div>
    );
  }

  return (
    <Routes>
      {/* ==================================================
          LOGIN
          ================================================== */}
      <Route
        path="/login"
        element={
          session ? (
            <Navigate
              to={
                session.type === "admin"
                  ? "/admin/dashboard"
                  : "/profile"
              }
              replace
            />
          ) : (
            <LoginPage
              onLogin={handleLogin}
            />
          )
        }
      />

      {/* ==================================================
          ADMIN ROOT

          /admin
          /admin/

          Both redirect to:
          /admin/dashboard
          ================================================== */}
      <Route
        path="/admin"
        element={
          <Navigate
            to="/admin/dashboard"
            replace
          />
        }
      />

      {/* ==================================================
          ADMIN DASHBOARD
          ================================================== */}
      <Route
        path="/admin/dashboard"
        element={
          <Protected
            session={session}
            type="admin"
          >
            <AdminDashboard
              session={session}
              onLogout={handleLogout}
            />
          </Protected>
        }
      />

      {/* ==================================================
          ADMIN FARMER DETAILS
          ================================================== */}
      <Route
        path="/admin/farmers/:farmerId"
        element={
          <Protected
            session={session}
            type="admin"
          >
            <FarmerDetails
              onLogout={handleLogout}
            />
          </Protected>
        }
      />

      {/* ==================================================
          FARMER PROFILE
          ================================================== */}
      <Route
        path="/profile"
        element={
          <Protected
            session={session}
            type="farmer"
          >
            <FarmerProfile
              session={session}
              onLogout={handleLogout}
              onSessionChange={setSession}
            />
          </Protected>
        }
      />

      {/* ==================================================
          UNKNOWN ROUTES

          If logged in as admin:
              /something
              -> /admin/dashboard

          If logged in as farmer:
              /something
              -> /profile

          If not logged in:
              /something
              -> /login
          ================================================== */}
      <Route
        path="*"
        element={
          <Navigate
            to={
              session
                ? session.type === "admin"
                  ? "/admin/dashboard"
                  : "/profile"
                : "/login"
            }
            replace
          />
        }
      />
    </Routes>
  );
}
