import { Icon } from "@iconify/react";
import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

const LandingPage = () => {
	const navigate = useNavigate();

	useEffect(() => {
		const check = async () => {
			const { data: { user } } = await supabase.auth.getUser();
			if (user) {
				navigate("/dashboard", { replace: true });
			}
		};
		check();
	}, [navigate]);

	return (
		<div style={{ backgroundColor: '#ffffff' }}>
			{/* Header */}
			<header style={{ backgroundColor: '#2d5a1b', position: 'sticky', top: 0, zIndex: 1000 }}>
				<div className="container py-3">
					<div className="d-flex align-items-center justify-content-between">
						<Link to="/" className="d-flex align-items-center">
							<img src="/img/coachsoccerpronewlogo.png" alt="SoccerCoachPro" style={{ height: '45px' }} />
						</Link>
						<nav className="d-none d-md-flex align-items-center gap-4">
							<a href="#features" className="text-white text-decoration-none opacity-75 hover-opacity-100">Features</a>
							<a href="#pricing" className="text-white text-decoration-none opacity-75 hover-opacity-100">Pricing</a>
							<Link to="/login" className="text-white text-decoration-none opacity-75">Log In</Link>
							<Link to="/register" className="btn btn-light btn-sm rounded-pill px-4 fw-semibold" style={{ color: '#2d5a1b' }}>Start Free</Link>
						</nav>
						<div className="d-md-none d-flex gap-2">
							<Link to="/login" className="btn btn-outline-light btn-sm rounded-pill px-3">Log In</Link>
							<Link to="/register" className="btn btn-light btn-sm rounded-pill px-3 fw-semibold" style={{ color: '#2d5a1b' }}>Start Free</Link>
						</div>
					</div>
				</div>
			</header>

			{/* Hero Section */}
			<section style={{ backgroundColor: '#2d5a1b', paddingTop: '60px', paddingBottom: '80px' }}>
				<div className="container">
					<div className="row align-items-center">
						<div className="col-lg-6 text-white mb-5 mb-lg-0">
							<h1 className="display-4 fw-bold mb-4">
								The coaching platform that makes every kid feel seen
							</h1>
							<p className="lead mb-4 opacity-90">
								Manage your youth soccer team like a pro. Roster, schedule, attendance, badges, payments — all in one place.
								While you focus on coaching, we make sure no player falls through the cracks.
							</p>
							<div className="d-flex flex-wrap gap-3">
								<Link to="/register" className="btn btn-light btn-lg rounded-pill px-4 fw-semibold" style={{ color: '#2d5a1b' }}>
									Start Free Trial
								</Link>
								<a href="#features" className="btn btn-outline-light btn-lg rounded-pill px-4">
									See Features
								</a>
							</div>
							<p className="mt-3 small opacity-75">No credit card required • Free for teams under 10 players</p>
						</div>
						<div className="col-lg-6">
							<div className="bg-white rounded-4 p-4 shadow-lg">
								<div className="d-flex align-items-center gap-3 mb-4">
									<div className="rounded-circle" style={{ width: '50px', height: '50px', backgroundColor: '#2d5a1b15' }}>
										<div className="d-flex align-items-center justify-content-center h-100">
											<Icon icon="fa6-solid:trophy" style={{ color: '#2d5a1b', fontSize: '20px' }} />
										</div>
									</div>
									<div>
										<div className="fw-bold">Badge Awarded!</div>
										<div className="text-muted small">Marcus earned "Star Player"</div>
									</div>
								</div>
								<div className="row g-3">
									{[
										{ icon: "fa6-solid:users", label: "18 Players", color: "#2d5a1b" },
										{ icon: "fa6-solid:calendar-check", label: "94% Attendance", color: "#2b6cb0" },
										{ icon: "fa6-solid:award", label: "156 Badges", color: "#dd6b20" },
										{ icon: "fa6-solid:fire", label: "12 Streaks", color: "#c53030" },
									].map((stat, idx) => (
										<div key={idx} className="col-6">
											<div className="p-3 rounded-3" style={{ backgroundColor: `${stat.color}10` }}>
												<Icon icon={stat.icon} style={{ color: stat.color, fontSize: '20px' }} />
												<div className="fw-semibold mt-2">{stat.label}</div>
											</div>
										</div>
									))}
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section id="features" className="py-5">
				<div className="container py-4">
					<div className="text-center mb-5">
						<h2 className="display-6 fw-bold mb-3">Everything you need to run your team</h2>
						<p className="lead text-muted">Built by coaches, for coaches. In English and Spanish.</p>
					</div>
					<div className="row g-4">
						{[
							{ icon: "fa6-solid:users", title: "Roster Management", desc: "Add players, track details, upload photos. See your whole team at a glance." },
							{ icon: "fa6-solid:calendar", title: "Schedule & Events", desc: "Practices, games, tournaments. One calendar, no confusion." },
							{ icon: "fa6-solid:clipboard-check", title: "Attendance Tracking", desc: "One-tap attendance. Know who showed up, who was late, who needs attention." },
							{ icon: "fa6-solid:award", title: "Badges & Recognition", desc: "50+ badges to award. Every kid earns recognition. No one invisible." },
							{ icon: "fa6-solid:paper-plane", title: "Team Messaging", desc: "Send announcements to the whole team or individual parents. Instant delivery." },
							{ icon: "fa6-solid:credit-card", title: "Collect Payments", desc: "Dues, fees, gear. Parents pay online. You get paid. No chasing checks." },
							{ icon: "fa6-solid:fire", title: "Streak System", desc: "Attendance streaks, effort streaks. Kids love seeing their flames grow." },
							{ icon: "fa6-solid:route", title: "Player Journey", desc: "Visual progression from bronze to platinum. Kids own their growth." },
						].map((feature, idx) => (
							<div key={idx} className="col-md-6 col-lg-3">
								<div className="h-100 p-4 rounded-3" style={{ backgroundColor: '#f7fafc' }}>
									<div className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '50px', height: '50px', backgroundColor: '#2d5a1b15' }}>
										<Icon icon={feature.icon} style={{ color: '#2d5a1b', fontSize: '22px' }} />
									</div>
									<h5 className="fw-bold">{feature.title}</h5>
									<p className="text-muted mb-0 small">{feature.desc}</p>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* The Child Experience */}
			<section className="py-5" style={{ backgroundColor: '#f7fafc' }}>
				<div className="container py-4">
					<div className="row align-items-center">
						<div className="col-lg-6 mb-4 mb-lg-0">
							<h2 className="display-6 fw-bold mb-4">Every child on the leaderboard</h2>
							<p className="lead text-muted mb-4">
								No "Top 5 only" here. If you're #15 out of 15, you're still ON the board. You exist. You matter.
							</p>
							<ul className="list-unstyled">
								{[
									"Living player card that evolves: Bronze → Silver → Gold → Platinum",
									"Badge collection they're proud to show",
									"Streak flames that keep them coming back",
									"Pro habits from Messi, Ronaldo, and the greats"
								].map((item, idx) => (
									<li key={idx} className="d-flex align-items-start gap-2 mb-3">
										<Icon icon="fa6-solid:check-circle" style={{ color: '#2d5a1b', marginTop: '4px' }} />
										<span>{item}</span>
									</li>
								))}
							</ul>
						</div>
						<div className="col-lg-6">
							<div className="bg-white rounded-4 p-4 shadow">
								<div className="text-center mb-4">
									<div className="mx-auto rounded-circle d-flex align-items-center justify-content-center" style={{ width: '100px', height: '100px', border: '4px solid #ffd700', backgroundColor: '#e2e8f0' }}>
										<Icon icon="fa6-solid:user" style={{ color: '#a0aec0', fontSize: '40px' }} />
									</div>
									<h4 className="fw-bold mt-3 mb-0">Marcus Rodriguez</h4>
									<span className="badge rounded-pill mt-2" style={{ backgroundColor: '#ffd700', color: '#1a202c' }}>Gold Frame</span>
								</div>
								<div className="d-flex justify-content-around text-center mb-4">
									<div>
										<div className="fw-bold cs_fs_24" style={{ color: '#2d5a1b' }}>245</div>
										<div className="text-muted small">Points</div>
									</div>
									<div>
										<div className="fw-bold cs_fs_24" style={{ color: '#dd6b20' }}>12</div>
										<div className="text-muted small">Badges</div>
									</div>
									<div>
										<div className="fw-bold cs_fs_24" style={{ color: '#c53030' }}>7🔥</div>
										<div className="text-muted small">Streak</div>
									</div>
								</div>
								<div className="d-flex flex-wrap gap-2 justify-content-center">
									{["⭐", "🤝", "💪", "✅", "⚽", "🎯"].map((emoji, idx) => (
										<div key={idx} className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', backgroundColor: '#f7fafc', fontSize: '20px' }}>
											{emoji}
										</div>
									))}
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Pricing */}
			<section className="py-5">
				<div className="container py-4">
					<div className="text-center mb-5">
						<h2 className="display-6 fw-bold mb-3">Simple pricing</h2>
						<p className="lead text-muted">Start free. Upgrade when you're ready.</p>
					</div>
					<div className="row justify-content-center g-4">
						<div className="col-md-6 col-lg-4">
							<div className="bg-white rounded-4 p-4 h-100 border">
								<h4 className="fw-bold">Free</h4>
								<div className="mb-4">
									<span className="display-5 fw-bold">$0</span>
									<span className="text-muted">/month</span>
								</div>
								<ul className="list-unstyled mb-4">
									{["Up to 10 players", "Roster & calendar", "Attendance", "Basic badges", "Team messaging"].map((item, idx) => (
										<li key={idx} className="d-flex align-items-center gap-2 mb-2">
											<Icon icon="fa6-solid:check" style={{ color: '#2d5a1b' }} />
											<span>{item}</span>
										</li>
									))}
								</ul>
								<Link to="/register" className="btn btn-outline-dark w-100 rounded-pill">Get Started</Link>
							</div>
						</div>
						<div className="col-md-6 col-lg-4">
							<div className="rounded-4 p-4 h-100 text-white" style={{ backgroundColor: '#2d5a1b' }}>
								<div className="d-flex justify-content-between align-items-start">
									<h4 className="fw-bold">First Team</h4>
									<span className="badge bg-white text-dark">Most Popular</span>
								</div>
								<div className="mb-4">
									<span className="display-5 fw-bold">$79</span>
									<span className="opacity-75">/month</span>
								</div>
								<ul className="list-unstyled mb-4">
									{["Unlimited players", "AI voice messages", "All badges & analytics", "Session planner", "Voice stats", "Social media posting", "End of season reports"].map((item, idx) => (
										<li key={idx} className="d-flex align-items-center gap-2 mb-2">
											<Icon icon="fa6-solid:check" />
											<span>{item}</span>
										</li>
									))}
								</ul>
								<Link to="/register" className="btn btn-light w-100 rounded-pill fw-semibold" style={{ color: '#2d5a1b' }}>Start Free Trial</Link>
							</div>
						</div>
						<div className="col-md-6 col-lg-4">
							<div className="bg-white rounded-4 p-4 h-100 border">
								<h4 className="fw-bold">The Gaffer</h4>
								<div className="mb-4">
									<span className="display-5 fw-bold">$149</span>
									<span className="text-muted">/month</span>
								</div>
								<ul className="list-unstyled mb-4">
									{["Everything in First Team", "Computer vision analysis", "White label branding", "Unlimited teams", "Club director dashboard", "Recruitment profiles"].map((item, idx) => (
										<li key={idx} className="d-flex align-items-center gap-2 mb-2">
											<Icon icon="fa6-solid:check" style={{ color: '#2d5a1b' }} />
											<span>{item}</span>
										</li>
									))}
								</ul>
								<Link to="/register" className="btn btn-outline-dark w-100 rounded-pill">Contact Us</Link>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* CTA */}
			<section className="py-5" style={{ backgroundColor: '#2d5a1b' }}>
				<div className="container py-4 text-center text-white">
					<h2 className="display-6 fw-bold mb-3">Ready to coach like a pro?</h2>
					<p className="lead opacity-90 mb-4">Join hundreds of coaches who use SoccerCoachPro to manage their teams.</p>
					<Link to="/register" className="btn btn-light btn-lg rounded-pill px-5 fw-semibold" style={{ color: '#2d5a1b' }}>
						Start Your Free Trial
					</Link>
				</div>
			</section>

			{/* Footer */}
			<footer className="py-4" style={{ backgroundColor: '#1a202c' }}>
				<div className="container">
					<div className="d-flex flex-wrap justify-content-between align-items-center">
						<div className="d-flex align-items-center">
							<img src="/img/coachsoccerpronewlogo.png" alt="SoccerCoachPro" style={{ height: '30px' }} />
						</div>
						<div className="text-white opacity-75 small">
							© {new Date().getFullYear()} SoccerCoachPro. All rights reserved.
						</div>
					</div>
				</div>
			</footer>
		</div>
	);
};

export default LandingPage;
