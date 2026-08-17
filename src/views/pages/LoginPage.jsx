import { useState } from "react";
import { Leaf, LockKeyhole, UserRound } from "lucide-react";

export default function LoginPage({ onLogin }) {
  const [mode, setMode] = useState("farmer");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function switchMode(next) {
    setMode(next);
    setIdentifier("");
    setPassword("");
    setError("");
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await onLogin(mode, { identifier, password });
    } catch (err) {
      setError(err.message || "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-brand">
        <Leaf size={31} />
        <span>Terra<span>Sync</span></span>
      </div>

      <section className="login-card">
        <div className="login-heading">
          <h1>Welcome back</h1>
          <p>Sign in to your TerraSync account</p>
        </div>

        <div className="login-tabs">
          <button className={mode === "farmer" ? "selected" : ""} onClick={() => switchMode("farmer")}>
            FARMER
          </button>
          <button className={mode === "admin" ? "selected" : ""} onClick={() => switchMode("admin")}>
            ADMIN
          </button>
        </div>

        <form onSubmit={submit}>
          <label>
            {mode === "farmer" ? "RSBSA Number or Email" : "Admin Email"}
            <div className="input-with-icon">
              <UserRound size={17} />
              <input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={mode === "farmer" ? "e.g. 12-34-56-789-12345" : "admin@example.com"}
                required
              />
            </div>
          </label>

          <label>
            Password
            <div className="input-with-icon">
              <LockKeyhole size={17} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
            </div>
          </label>

          {error && <div className="login-error">{error}</div>}

          <button className="login-button" type="submit" disabled={busy}>
            {busy ? "Signing in..." : `Sign In as ${mode === "farmer" ? "Farmer" : "Admin"}`}
          </button>
        </form>

        <div className="login-note">
          {mode === "farmer"
            ? "Farmers can view and update only their own profile."
            : "Admins must have an admin role in Supabase user_roles."}
        </div>
      </section>
    </main>
  );
}
