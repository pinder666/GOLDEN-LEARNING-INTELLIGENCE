import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

interface Player {
	id: string;
	first_name: string;
	last_name: string;
	photo_url: string | null;
	total_points: number;
	card_frame: string;
}

const CoachDashboard = () => {
	const navigate = useNavigate();
	const [loading, setLoading] = useState(true);
	const [coachName, setCoachName] = useState("Coach");
	const [teamName, setTeamName] = useState("Your Team");
	const [teamAgeGroup, setTeamAgeGroup] = useState("");
	const [players, setPlayers] = useState<Player[]>([]);

	useEffect(() => {
		let mounted = true;

		const load = async () => {
			try {
				const { data: { user } } = await supabase.auth.getUser();

				if (!user) {
					navigate("/login", { replace: true });
					return;
				}

				// Try to get coach data - don't redirect if not found
				const { data: coach } = await supabase
					.from("coaches")
					.select("*, teams(*)")
					.eq("user_id", user.id)
					.single();

				if (mounted && coach) {
					setCoachName(coach.first_name || "Coach");
					if (coach.teams) {
						setTeamName(coach.teams.name || "Your Team");
						setTeamAgeGroup(coach.teams.age_group || "");

						// Get players
						const { data: playersData } = await supabase
							.from("players")
							.select("*")
							.eq("team_id", coach.teams.id)
							.order("total_points", { ascending: false });

						if (mounted && playersData) {
							setPlayers(playersData);
						}
					}
				}
			} catch (err) {
				console.error("Dashboard load error:", err);
			} finally {
				if (mounted) setLoading(false);
			}
		};

		load();
		return () => { mounted = false; };
	}, [navigate]);

	const handleSignOut = async () => {
		await supabase.auth.signOut();
		navigate("/login", { replace: true });
	};

	const getFrameColor = (frame: string) => {
		switch (frame) {
			case "silver": return "#c0c0c0";
			case "gold": return "#ffd700";
			case "platinum": return "#e5e4e2";
			default: return "#cd7f32";
		}
	};

	if (loading) {
		return (
			<div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', backgroundColor: '#f7fafc' }}>
				<div className="text-center">
					<Icon icon="eos-icons:loading" className="cs_fs_48 mb-3" style={{ color: '#2d5a1b' }} />
					<p>Loading...</p>
				</div>
			</div>
		);
	}

	return (
		<div style={{ backgroundColor: '#f7fafc', minHeight: '100vh' }}>
			{/* Header */}
			<header style={{ backgroundColor: '#2d5a1b', padding: '20px 0' }}>
				<div className="container">
					<div className="d-flex align-items-center justify-content-between">
						<div className="d-flex align-items-center gap-3">
							<div
								className="d-flex align-items-center justify-content-center"
								style={{ width: '50px', height: '50px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '8px' }}
							>
								<Icon icon="fa6-solid:futbol" className="text-white cs_fs_24" />
							</div>
							<div className="text-white">
								<h1 className="cs_fs_18 mb-0 fw-bold">{teamName}</h1>
								<span className="opacity-75" style={{ fontSize: '14px' }}>{teamAgeGroup || "Coach Dashboard"}</span>
							</div>
						</div>
						<div className="d-flex align-items-center gap-3">
							<span className="text-white d-none d-md-inline">Hi, {coachName}!</span>
							<button onClick={handleSignOut} className="btn btn-outline-light btn-sm rounded-pill px-3">
								<Icon icon="fa6-solid:right-from-bracket" className="me-2" />
								Sign Out
							</button>
						</div>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main className="container py-4">
				{/* Quick Stats */}
				<div className="row g-3 mb-4">
					<div className="col-6 col-md-3">
						<div className="bg-white rounded-3 p-3 h-100 shadow-sm">
							<div className="d-flex align-items-center gap-3">
								<div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px', backgroundColor: '#2d5a1b15' }}>
									<Icon icon="fa6-solid:users" style={{ color: '#2d5a1b', fontSize: '20px' }} />
								</div>
								<div>
									<div className="cs_fs_24 fw-bold" style={{ color: '#2d5a1b' }}>{players.length}</div>
									<div className="text-muted" style={{ fontSize: '13px' }}>Players</div>
								</div>
							</div>
						</div>
					</div>
					<div className="col-6 col-md-3">
						<div className="bg-white rounded-3 p-3 h-100 shadow-sm">
							<div className="d-flex align-items-center gap-3">
								<div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px', backgroundColor: '#2b6cb015' }}>
									<Icon icon="fa6-solid:calendar" style={{ color: '#2b6cb0', fontSize: '20px' }} />
								</div>
								<div>
									<div className="cs_fs_24 fw-bold" style={{ color: '#2b6cb0' }}>0</div>
									<div className="text-muted" style={{ fontSize: '13px' }}>Events</div>
								</div>
							</div>
						</div>
					</div>
					<div className="col-6 col-md-3">
						<div className="bg-white rounded-3 p-3 h-100 shadow-sm">
							<div className="d-flex align-items-center gap-3">
								<div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px', backgroundColor: '#dd6b2015' }}>
									<Icon icon="fa6-solid:award" style={{ color: '#dd6b20', fontSize: '20px' }} />
								</div>
								<div>
									<div className="cs_fs_24 fw-bold" style={{ color: '#dd6b20' }}>0</div>
									<div className="text-muted" style={{ fontSize: '13px' }}>Badges</div>
								</div>
							</div>
						</div>
					</div>
					<div className="col-6 col-md-3">
						<div className="bg-white rounded-3 p-3 h-100 shadow-sm">
							<div className="d-flex align-items-center gap-3">
								<div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px', backgroundColor: '#6b46c115' }}>
									<Icon icon="fa6-solid:star" style={{ color: '#6b46c1', fontSize: '20px' }} />
								</div>
								<div>
									<div className="cs_fs_24 fw-bold" style={{ color: '#6b46c1' }}>Free</div>
									<div className="text-muted" style={{ fontSize: '13px' }}>Plan</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div className="row g-4">
					<div className="col-lg-8">
						{/* Quick Actions */}
						<div className="bg-white rounded-3 p-4 shadow-sm mb-4">
							<h2 className="cs_fs_18 fw-bold mb-3">Quick Actions</h2>
							<div className="row g-2">
								<div className="col-6 col-md-3">
									<Link to="/roster" className="d-block text-center p-3 rounded-3 text-decoration-none" style={{ backgroundColor: '#2d5a1b15' }}>
										<Icon icon="fa6-solid:user-plus" className="cs_fs_24 mb-2" style={{ color: '#2d5a1b' }} />
										<div className="fw-semibold" style={{ color: '#2d5a1b', fontSize: '14px' }}>Add Player</div>
									</Link>
								</div>
								<div className="col-6 col-md-3">
									<Link to="/calendar" className="d-block text-center p-3 rounded-3 text-decoration-none" style={{ backgroundColor: '#2b6cb015' }}>
										<Icon icon="fa6-solid:calendar-plus" className="cs_fs_24 mb-2" style={{ color: '#2b6cb0' }} />
										<div className="fw-semibold" style={{ color: '#2b6cb0', fontSize: '14px' }}>New Event</div>
									</Link>
								</div>
								<div className="col-6 col-md-3">
									<Link to="/messages" className="d-block text-center p-3 rounded-3 text-decoration-none" style={{ backgroundColor: '#dd6b2015' }}>
										<Icon icon="fa6-solid:paper-plane" className="cs_fs_24 mb-2" style={{ color: '#dd6b20' }} />
										<div className="fw-semibold" style={{ color: '#dd6b20', fontSize: '14px' }}>Message</div>
									</Link>
								</div>
								<div className="col-6 col-md-3">
									<Link to="/badges" className="d-block text-center p-3 rounded-3 text-decoration-none" style={{ backgroundColor: '#6b46c115' }}>
										<Icon icon="fa6-solid:award" className="cs_fs_24 mb-2" style={{ color: '#6b46c1' }} />
										<div className="fw-semibold" style={{ color: '#6b46c1', fontSize: '14px' }}>Badge</div>
									</Link>
								</div>
							</div>
						</div>

						{/* Team Roster */}
						<div className="bg-white rounded-3 p-4 shadow-sm">
							<div className="d-flex align-items-center justify-content-between mb-3">
								<h2 className="cs_fs_18 fw-bold mb-0">Team Roster</h2>
								<Link to="/roster" className="btn btn-sm btn-outline-secondary rounded-pill">Manage</Link>
							</div>
							{players.length === 0 ? (
								<div className="text-center py-4">
									<Icon icon="fa6-solid:users" className="cs_fs_36 mb-2 text-muted" />
									<p className="text-muted mb-3">No players yet</p>
									<Link to="/roster" className="btn btn-sm rounded-pill px-4" style={{ backgroundColor: '#2d5a1b', color: 'white' }}>
										Add Your First Player
									</Link>
								</div>
							) : (
								<div className="row g-2">
									{players.slice(0, 8).map((player) => (
										<div key={player.id} className="col-6 col-md-3">
											<div className="text-center p-3 rounded-3" style={{ backgroundColor: '#f7fafc' }}>
												<div
													className="mx-auto mb-2 rounded-circle d-flex align-items-center justify-content-center"
													style={{ width: '56px', height: '56px', border: `3px solid ${getFrameColor(player.card_frame)}`, backgroundColor: '#e2e8f0' }}
												>
													{player.photo_url ? (
														<img src={player.photo_url} alt={player.first_name} className="rounded-circle" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
													) : (
														<Icon icon="fa6-solid:user" style={{ color: '#a0aec0', fontSize: '24px' }} />
													)}
												</div>
												<div className="fw-semibold" style={{ fontSize: '14px' }}>{player.first_name}</div>
												<div className="text-muted" style={{ fontSize: '12px' }}>{player.total_points} pts</div>
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					</div>

					<div className="col-lg-4">
						{/* Today's Focus */}
						<div className="bg-white rounded-3 p-4 shadow-sm mb-4">
							<h2 className="cs_fs_18 fw-bold mb-3">Today's Focus</h2>
							<div className="p-3 rounded-3" style={{ backgroundColor: '#2d5a1b15', borderLeft: '4px solid #2d5a1b' }}>
								<div className="fw-semibold" style={{ color: '#2d5a1b' }}>
									{players.length === 0 ? "Add your players" : "Build your roster"}
								</div>
								<p className="mb-0 text-muted" style={{ fontSize: '13px' }}>
									{players.length === 0
										? "Start by adding players to unlock all features."
										: `You have ${players.length} player${players.length === 1 ? '' : 's'}. Keep building!`
									}
								</p>
							</div>
						</div>

						{/* Coming Soon */}
						<div className="bg-white rounded-3 p-4 shadow-sm">
							<h2 className="cs_fs_18 fw-bold mb-3">Coming Soon</h2>
							<ul className="list-unstyled mb-0">
								<li className="d-flex align-items-center gap-2 mb-2">
									<Icon icon="fa6-solid:calendar" style={{ color: '#2b6cb0' }} />
									<span style={{ fontSize: '14px' }}>Calendar & Events</span>
								</li>
								<li className="d-flex align-items-center gap-2 mb-2">
									<Icon icon="fa6-solid:message" style={{ color: '#dd6b20' }} />
									<span style={{ fontSize: '14px' }}>Team Messaging</span>
								</li>
								<li className="d-flex align-items-center gap-2 mb-2">
									<Icon icon="fa6-solid:award" style={{ color: '#6b46c1' }} />
									<span style={{ fontSize: '14px' }}>Badges & Recognition</span>
								</li>
								<li className="d-flex align-items-center gap-2">
									<Icon icon="fa6-solid:chart-line" style={{ color: '#c53030' }} />
									<span style={{ fontSize: '14px' }}>Player Development</span>
								</li>
							</ul>
						</div>
					</div>
				</div>
			</main>

			<footer className="py-4 text-center" style={{ backgroundColor: '#edf2f7' }}>
				<p className="mb-0 text-muted" style={{ fontSize: '14px' }}>
					SoccerCoachPro &copy; {new Date().getFullYear()}
				</p>
			</footer>
		</div>
	);
};

export default CoachDashboard;
