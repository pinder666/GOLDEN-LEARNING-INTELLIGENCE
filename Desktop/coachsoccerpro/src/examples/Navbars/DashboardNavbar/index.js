/** 

=========================================================
* Vision UI PRO React - v1.0.0
=========================================================

* Product Page: https://www.creative-tim.com/product/vision-ui-dashboard-pro-react
* Copyright 2021 Creative Tim (https://www.creative-tim.com/)

* Design and Coded by Simmmple & Creative Tim

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Visionware.

*/

import { useState, useEffect } from "react";

// react-router components
import { useLocation, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

// prop-types is a library for typechecking of props.
import PropTypes from "prop-types";

// @material-ui core components
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import Icon from "@mui/material/Icon";

// Vision UI Dashboard PRO React components
import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiInput from "components/VuiInput";

// Vision UI Dashboard PRO React example components
import Breadcrumbs from "examples/Breadcrumbs";
import NotificationItem from "examples/Items/NotificationItem";

// Custom styles for DashboardNavbar
import {
  navbar,
  navbarContainer,
  navbarRow,
  navbarIconButton,
  navbarDesktopMenu,
  navbarMobileMenu,
} from "examples/Navbars/DashboardNavbar/styles";

// Vision UI Dashboard PRO React context
import {
  useVisionUIController,
  setTransparentNavbar,
  setMiniSidenav,
  setOpenConfigurator,
} from "context";

// Images
import team2 from "assets/images/team-2.jpg";
import logoSpotify from "assets/images/small-logos/logo-spotify.svg";
import agentFace from "assets/images/avatar4.png";

function DashboardNavbar({ absolute, light, isMini }) {
  const [navbarType, setNavbarType] = useState();
  const [controller, dispatch] = useVisionUIController();
  const { miniSidenav, transparentNavbar, fixedNavbar, openConfigurator } = controller;
  const [openMenu, setOpenMenu] = useState(false);
  const { i18n } = useTranslation();
  const uiLang = (i18n.language || "en").startsWith("es") ? "es" : "en";

  // Global voice mute (services/voice.js reads the same flag)
  const [voiceMuted, setVoiceMuted] = useState(() => {
    try { return localStorage.getItem("csp_muted") === "1"; } catch (e) { return false; }
  });
  const toggleVoiceMute = () => {
    const next = !voiceMuted;
    setVoiceMuted(next);
    import("services/voice").then((v) => v.setMuted(next));
  };
  const route = useLocation().pathname.split("/").slice(1);

  useEffect(() => {
    // Setting the navbar type
    if (fixedNavbar) {
      setNavbarType("sticky");
    } else {
      setNavbarType("static");
    }

    // A function that sets the transparent state of the navbar.
    function handleTransparentNavbar() {
      setTransparentNavbar(dispatch, (fixedNavbar && window.scrollY === 0) || !fixedNavbar);
    }

    /** 
     The event listener that's calling the handleTransparentNavbar function when 
     scrolling the window.
    */
    window.addEventListener("scroll", handleTransparentNavbar);

    // Call the handleTransparentNavbar function to set the state with the initial value.
    handleTransparentNavbar();

    // Remove event listener on cleanup
    return () => window.removeEventListener("scroll", handleTransparentNavbar);
  }, [dispatch, fixedNavbar]);

  const handleMiniSidenav = () => setMiniSidenav(dispatch, !miniSidenav);
  const handleConfiguratorOpen = () => setOpenConfigurator(dispatch, !openConfigurator);
  const handleOpenMenu = (event) => setOpenMenu(event.currentTarget);
  const handleCloseMenu = () => setOpenMenu(false);

  // Render the notifications menu
  const renderMenu = () => (
    <Menu
      anchorEl={openMenu}
      anchorReference={null}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "left",
      }}
      open={Boolean(openMenu)}
      onClose={handleCloseMenu}
      sx={{ mt: 2 }}
    >
      <NotificationItem
        image={<img src={team2} alt="person" />}
        title={["New message", "from Laur"]}
        date="13 minutes ago"
        onClick={handleCloseMenu}
      />
      <NotificationItem
        image={<img src={logoSpotify} alt="person" />}
        title={["New album", "by Travis Scott"]}
        date="1 day"
        onClick={handleCloseMenu}
      />
      <NotificationItem
        color="secondary"
        image={
          <Icon fontSize="small" sx={{ color: ({ palette: { white } }) => white.main }}>
            payment
          </Icon>
        }
        title={["", "Payment successfully completed"]}
        date="2 days"
        onClick={handleCloseMenu}
      />
    </Menu>
  );

  return (
    <AppBar
      position={absolute ? "absolute" : navbarType}
      color="inherit"
      sx={(theme) => navbar(theme, { transparentNavbar, absolute, light })}
    >
      <Toolbar sx={(theme) => navbarContainer(theme)}>
        {/* Clean top bar: just the menu toggle and notifications — no
            search, no breadcrumb, no duplicate settings (Settings lives in
            the sidebar; the floating gear was removed too). */}
        <VuiBox color="inherit" mb={{ xs: 1, md: 0 }} sx={(theme) => navbarRow(theme, { isMini })}>
          <Icon fontSize="medium" sx={navbarDesktopMenu} onClick={handleMiniSidenav}>
            {miniSidenav ? "menu_open" : "menu"}
          </Icon>
        </VuiBox>
        {isMini ? null : (
          <VuiBox sx={(theme) => navbarRow(theme, { isMini })}>
            <VuiBox color={light ? "white" : "inherit"}>
              <IconButton
                size="small"
                color="white"
                sx={navbarMobileMenu}
                onClick={handleMiniSidenav}
              >
                <Icon color="white">{miniSidenav ? "menu_open" : "menu"}</Icon>
              </IconButton>
              {/* MIA — the assistant. Her face, not a bare mic. Tap and talk;
                  she runs on-device (attendance, payments, messages, nav). */}
              <VuiBox
                onClick={() => window.dispatchEvent(new Event("csp-toggle-agent"))}
                title="Mia — tap and talk"
                sx={{
                  position: "relative", width: 36, height: 36, mr: 1.5, ml: 0.5,
                  borderRadius: "50%", cursor: "pointer", flexShrink: 0,
                  border: "2px solid #f97316", boxShadow: "0 2px 10px rgba(249,115,22,.5)",
                  overflow: "hidden", transition: "transform .15s",
                  "&:hover": { transform: "scale(1.08)" },
                }}
              >
                <VuiBox component="img" src={agentFace} alt="Mia"
                  sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                <VuiBox sx={{
                  position: "absolute", right: -1, bottom: -1, width: 13, height: 13,
                  borderRadius: "50%", background: "#f97316", border: "2px solid #0f0c29",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7,
                }}>🎙️</VuiBox>
              </VuiBox>
              {/* Global EN/ES — the ONE language switch, reachable on every page */}
              <VuiBox sx={{ display: "inline-flex", gap: "2px", background: "rgba(255,255,255,.08)", borderRadius: "16px", p: "2px", mr: 1, verticalAlign: "middle" }}>
                {["en", "es"].map((l) => (
                  <button key={l} onClick={() => i18n.changeLanguage(l)} style={{
                    background: uiLang === l ? "#f97316" : "transparent", color: uiLang === l ? "#000" : "rgba(255,255,255,.6)",
                    border: "none", borderRadius: "14px", padding: "3px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "Inter,sans-serif",
                  }}>{l.toUpperCase()}</button>
                ))}
              </VuiBox>
              {/* Global voice mute — silences every coach voice in the app */}
              <IconButton
                size="small"
                color="white"
                sx={navbarIconButton}
                title={voiceMuted ? "Unmute voices" : "Mute voices"}
                onClick={toggleVoiceMute}
              >
                <Icon sx={voiceMuted ? { color: "#fbbf24 !important" } : undefined}>
                  {voiceMuted ? "volume_off" : "volume_up"}
                </Icon>
              </IconButton>
              <IconButton
                size="small"
                color="white"
                sx={navbarIconButton}
                aria-controls="notification-menu"
                aria-haspopup="true"
                variant="contained"
                onClick={handleOpenMenu}
              >
                <Icon>notifications</Icon>
              </IconButton>
              {renderMenu()}
            </VuiBox>
          </VuiBox>
        )}
      </Toolbar>
    </AppBar>
  );
}

// Setting default values for the props of DashboardNavbar
DashboardNavbar.defaultProps = {
  absolute: false,
  light: false,
  isMini: false,
};

// Typechecking props for the DashboardNavbar
DashboardNavbar.propTypes = {
  absolute: PropTypes.bool,
  light: PropTypes.bool,
  isMini: PropTypes.bool,
};

export default DashboardNavbar;
