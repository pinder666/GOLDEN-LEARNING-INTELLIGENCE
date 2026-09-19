import { Link } from "react-router-dom";

const routes = [
	{ path: "/", label: "Home (Landing Page)" },
	{ path: "/ai-writing", label: "AI Writing Assistant" },
	{ path: "/task-management", label: "Task Management" },
	{ path: "/data-analytics", label: "Data Analytics" },
	{ path: "/app-landing", label: "App Landing" },
	{ path: "/pos", label: "POS Landing" },
	{ path: "/live-chat", label: "Live Chat" },
	{ path: "/contact", label: "Contact" },
	{ path: "/login", label: "Login" },
	{ path: "/register", label: "Register" },
	{ path: "/reset-password", label: "Reset Password" },
	{ path: "/onboarding", label: "Onboarding" },
	{ path: "/faqs", label: "FAQs" },
	{ path: "/integration", label: "Integration" },
	{ path: "/services", label: "Services" },
	{ path: "/blogs", label: "Blogs" },
	{ path: "/blog/blog-details", label: "Blog Details (sample)" },
	{ path: "/features", label: "Features" },
	{ path: "/pricing", label: "Pricing" },
	{ path: "/about-us", label: "About Us" },
	{ path: "/dashboard", label: "Coach Dashboard" },
	{ path: "/roster", label: "Roster" },
	{ path: "/calendar", label: "Calendar" },
	{ path: "/attendance/sample-event-id", label: "Attendance (sample)" },
	{ path: "/badges", label: "Badges" },
	{ path: "/messages", label: "Messages" },
	{ path: "/player/sample-player-id/notes", label: "Player Notes (sample)" },
	{ path: "/journey", label: "Journey Path" },
];

const DevPage = () => {
	return (
		<div style={{ padding: "40px", fontFamily: "sans-serif", background: "#fff", minHeight: "100vh" }}>
			<h1>All Routes</h1>
			<p style={{ color: "#666", marginBottom: "20px" }}>Click any link to navigate</p>
			<ul style={{ listStyle: "none", padding: 0 }}>
				{routes.map((route) => (
					<li key={route.path} style={{ marginBottom: "10px" }}>
						<Link
							to={route.path}
							style={{ color: "#2d5a1b", textDecoration: "none", fontSize: "16px" }}
						>
							{route.path} — {route.label}
						</Link>
					</li>
				))}
			</ul>
		</div>
	);
};

export default DevPage;
