import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import VuiBox from "components/VuiBox";

function Checkmatch() {
  const navigate = useNavigate();

  // The game's Back button (embed mode) reports here — return to the cockpit
  useEffect(() => {
    const onMsg = (e) => {
      if (e?.data?.sm === "csp-back") navigate("/coach/dashboard");
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [navigate]);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <VuiBox
        sx={{
          position: "relative",
          width: "100%",
          height: "calc(100vh - 120px)",
          borderRadius: "15px",
          overflow: "hidden",
        }}
      >
        {/* The REAL Checkmatch, served by the SoccerMental game-server.
            ?embed=csp keeps only pause/back/mute (no feedback triangle)
            and wires Back to the message handler above. */}
        <iframe
          src="http://localhost:8091/checkmatch.html?embed=csp"
          title="Checkmatch"
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            borderRadius: "15px",
          }}
        />
      </VuiBox>
    </DashboardLayout>
  );
}

export default Checkmatch;
