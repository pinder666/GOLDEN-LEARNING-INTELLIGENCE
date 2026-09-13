import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import VuiBox from "components/VuiBox";

function Checkmatch() {
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
        {/* The REAL Checkmatch, served by the SoccerMental game-server —
            the copied HTML lacked its supporting assets and broke. */}
        <iframe
          src="http://localhost:8091/checkmatch.html"
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
