/**
 * CoachSoccerPro - Main App Component
 * A mentorship platform disguised as a youth soccer app
 */

import { useState, useEffect, useMemo } from "react";
import { Route, useLocation, Routes, Navigate } from "react-router-dom";

// @mui material components
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Icon from "@mui/material/Icon";

// Vision UI Dashboard PRO React components
import VuiBox from "components/VuiBox";

// Vision UI Dashboard PRO React example components
import Sidenav from "examples/Sidenav";
import Configurator from "examples/Configurator";

// Vision UI Dashboard PRO React themes
import theme from "assets/theme";

// Routes
import routes, { coachRoutes, parentRoutes, childRoutes, authRoutes } from "./routes";

// Auth Context
import { useAuth } from "context/AuthContext";

// Vision UI Dashboard PRO React contexts
import {
  useVisionUIController,
  setMiniSidenav,
  setOpenConfigurator,
} from "context";

// i18n
import { useTranslation } from "react-i18next";

// Plugins custom css
import "assets/theme/base/plugins.css";

// Logo
import logo from "assets/images/logos/coachsoccerpro-logo.png";

export default function App() {
  const [controller, dispatch] = useVisionUIController();
  const { miniSidenav, direction, layout, openConfigurator, sidenavColor } = controller;
  const [onMouseEnter, setOnMouseEnter] = useState(false);
  const { pathname } = useLocation();
  const { user, userProfile, loading } = useAuth();
  const { i18n } = useTranslation();

  // Get language-appropriate routes
  const getLocalizedRoutes = (routes) => {
    return routes.map((route) => ({
      ...route,
      name: i18n.language === "es" && route.nameEs ? route.nameEs : route.name,
    }));
  };

  // Open sidenav when mouse enter on mini sidenav
  const handleOnMouseEnter = () => {
    if (miniSidenav && !onMouseEnter) {
      setMiniSidenav(dispatch, false);
      setOnMouseEnter(true);
    }
  };

  // Close sidenav when mouse leave mini sidenav
  const handleOnMouseLeave = () => {
    if (onMouseEnter) {
      setMiniSidenav(dispatch, true);
      setOnMouseEnter(false);
    }
  };

  // Change the openConfigurator state
  const handleConfiguratorOpen = () => setOpenConfigurator(dispatch, !openConfigurator);

  // Setting the dir attribute for the body element
  useEffect(() => {
    document.body.setAttribute("dir", direction);
  }, [direction]);

  // Setting page scroll to 0 when changing the route
  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.scrollingElement.scrollTop = 0;
  }, [pathname]);

  // Generate routes from array
  const getRoutes = (allRoutes) => {
    return allRoutes.map((route) => {
      if (route.collapse) {
        return getRoutes(route.collapse);
      }

      if (route.route && route.component) {
        return <Route exact path={route.route} element={route.component} key={route.key} />;
      }

      return null;
    });
  };

  // Determine which routes to show in sidebar based on user role.
  // The section being viewed wins (lets any role preview parent/player views in dev);
  // otherwise fall back to the profile role.
  const getSidenavRoutes = () => {
    if (!userProfile) return [];

    if (pathname.startsWith("/parent")) return getLocalizedRoutes(parentRoutes);
    if (pathname.startsWith("/player")) return getLocalizedRoutes(childRoutes);

    switch (userProfile.role) {
      case "coach":
      case "assistant_coach":
        return getLocalizedRoutes(coachRoutes);
      case "parent":
        return getLocalizedRoutes(parentRoutes);
      case "child":
        return getLocalizedRoutes(childRoutes);
      default:
        return [];
    }
  };

  // Check if current route is an auth route or landing page (no sidebar needed)
  const isAuthRoute = pathname.startsWith("/auth") || pathname === "/" || pathname === "/landing";

  // Settings button
  const configsButton = (
    <VuiBox
      display="flex"
      justifyContent="center"
      alignItems="center"
      width="3.5rem"
      height="3.5rem"
      bgColor="white"
      shadow="sm"
      borderRadius="50%"
      position="fixed"
      right="2rem"
      bottom="2rem"
      zIndex={99}
      color="white"
      sx={({ palette: { info } }) => ({
        cursor: "pointer",
        backgroundColor: info.main,
      })}
      onClick={handleConfiguratorOpen}
    >
      <Icon fontSize="default" color="inherit">
        settings
      </Icon>
    </VuiBox>
  );

  // Show loading while checking auth
  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <VuiBox
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="100vh"
          sx={{ background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)" }}
        >
          <VuiBox
            component="img"
            src={logo}
            alt="CoachSoccerPro"
            sx={{ width: 200, animation: "pulse 2s infinite" }}
          />
        </VuiBox>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      {/* Sidenav - only show when logged in and not on auth pages */}
      {user && !isAuthRoute && (
        <>
          <Sidenav
            color={sidenavColor}
            brand={logo}
            brandName="CoachSoccerPro"
            routes={getSidenavRoutes()}
            onMouseEnter={handleOnMouseEnter}
            onMouseLeave={handleOnMouseLeave}
          />
          <Configurator />
          {configsButton}
        </>
      )}

      <Routes>
        {/* Auth routes */}
        {getRoutes(authRoutes)}

        {/* Coach routes */}
        {getRoutes(coachRoutes)}

        {/* Parent routes */}
        {getRoutes(parentRoutes)}

        {/* Child routes */}
        {getRoutes(childRoutes)}

        {/* Catch-all redirect */}
        <Route
          path="*"
          element={
            user ? (
              <Navigate to="/coach/dashboard" replace />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
      </Routes>
    </ThemeProvider>
  );
}
