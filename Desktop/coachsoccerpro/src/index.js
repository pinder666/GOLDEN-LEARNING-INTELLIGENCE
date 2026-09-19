/** 

=========================================================
* Vision UI PRO React - v1.0.0
=========================================================

* Product Page: https://www.creative-tim.com/product/vision-ui-dashboard-pro-react
* Copyright 2021 Creative Tim (https://www.creative-tim.com/)

* Design and Coded by Simmmple & Creative Tim

=========================================================

/**
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Visionware.
 */

import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "App";

// Vision UI Context Provider
import { VisionUIControllerProvider } from "context";

// Auth Context Provider
import { AuthProvider } from "context/AuthContext";

// i18n
import "./i18n";

const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <BrowserRouter>
    <VisionUIControllerProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </VisionUIControllerProvider>
  </BrowserRouter>
);