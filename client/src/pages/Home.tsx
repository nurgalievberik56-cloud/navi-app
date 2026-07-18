import { useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Home() {
  // The userAuth hooks provides authentication state
  // To implement login/logout functionality, simply call logout() or redirect to getLoginUrl()
  let { user, loading, error, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    window.location.href = "/index-navi.html";
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#f7f5f2",
      fontFamily: "sans-serif"
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🌿</div>
        <div style={{ fontSize: 20, color: "#1a2e1e", fontWeight: 600 }}>Navi</div>
        <div style={{ fontSize: 14, color: "#6b7a6e", marginTop: 8 }}>Загрузка...</div>
      </div>
    </div>
  );
}
