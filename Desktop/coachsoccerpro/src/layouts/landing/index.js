// The public landing lives at /landing-page.html (static, bilingual, SEO head).
// This route only forwards to it so "/" shows the real front door when logged out.
function LandingPage() {
  window.location.replace("/landing-page.html");
  return null;
}

export default LandingPage;
