import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { supabase } from "../../lib/supabase";
import { celebrateBadge } from "../../utils/celebrate";
import { sendNotification, NotificationTypes } from "../../utils/pushNotifications";

interface Badge {
	id: string;
	name_en: string;
	name_es: string;
	description_en: string;
	icon: string;
	category: string;
	points: number;
}

interface Player {
	id: string;
	first_name: string;
	last_name: string;
	photo_url: string | null;
}

interface PlayerBadge {
	id: string;
	player_id: string;
	badge_id: string;
	awarded_at: string;
}

const DEFAULT_BADGES: Omit<Badge, 'id'>[] = [
	{ name_en: "Star Player", name_es: "Jugador Estrella", description_en: "Outstanding performance", icon: "⭐", category: "effort", points: 10 },
	{ name_en: "Team Player", name_es: "Jugador de Equipo", description_en: "Great teamwork", icon: "🤝", category: "character", points: 10 },
	{ name_en: "Most Improved", name_es: "Más Mejorado", description_en: "Showing great progress", icon: "📈", category: "skill", points: 15 },
	{ name_en: "Hard Worker", name_es: "Trabajador", description_en: "Always gives 100%", icon: "💪", category: "effort", points: 10 },
	{ name_en: "Perfect Attendance", name_es: "Asistencia Perfecta", description_en: "Never misses practice", icon: "✅", category: "attendance", points: 20 },
	{ name_en: "Goal Scorer", name_es: "Goleador", description_en: "Scored a goal", icon: "⚽", category: "skill", points: 10 },
	{ name_en: "Clean Sheet", name_es: "Portería Invicta", description_en: "Goalkeeper didn't concede", icon: "🧤", category: "skill", points: 15 },
	{ name_en: "Captain", name_es: "Capitán", description_en: "Led the team today", icon: "©️", category: "character", points: 10 },
	{ name_en: "Positive Attitude", name_es: "Actitud Positiva", description_en: "Always encouraging", icon: "😊", category: "character", points: 10 },
	{ name_en: "First Goal", name_es: "Primer Gol", description_en: "Scored their first goal", icon: "🎯", category: "skill", points: 25 },
	{ name_en: "Assist King", name_es: "Rey de Asistencias", description_en: "Great assist", icon: "👟", category: "skill", points: 10 },
	{ name_en: "Training Hero", name_es: "Héroe del Entrenamiento", description_en: "Exceptional in training", icon: "🏃", category: "effort", points: 10 },
];

const BadgeManager = () => {
	const navigate = useNavigate();
	const [loading, setLoading] = useState(true);
	const [badges, setBadges] = useState<Badge[]>([]);
	const [players, setPlayers] = useState<Player[]>([]);
	const [playerBadges, setPlayerBadges] = useState<PlayerBadge[]>([]);
	const [showAwardModal, setShowAwardModal] = useState(false);
	const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
	const [selectedPlayer, setSelectedPlayer] = useState<string>("");
	const [saving, setSaving] = useState(false);
	const [coachId, setCoachId] = useState<string | null>(null);

	useEffect(() => {
		loadData();
	}, []);

	const loadData = async () => {
		try {
			const { data: { user } } = await supabase.auth.getUser();
			if (!user) {
				navigate("/login", { replace: true });
				return;
			}

			const { data: coach } = await supabase
				.from("coaches")
				.select("id, team_id")
				.eq("user_id", user.id)
				.single();

			if (!coach) {
				navigate("/onboarding", { replace: true });
				return;
			}

			setCoachId(coach.id);

			// Get or create badges
			let { data: badgesData } = await supabase
				.from("badge_definitions")
				.select("*")
				.or(`is_system.eq.true,coach_id.eq.${coach.id}`);

			if (!badgesData || badgesData.length === 0) {
				// Create default badges
				const { data: newBadges, error } = await supabase
					.from("badge_definitions")
					.insert(DEFAULT_BADGES.map(b => ({ ...b, is_system: true })))
					.select();

				if (!error && newBadges) {
					badgesData = newBadges;
				}
			}

			if (badgesData) {
				setBadges(badgesData);
			}

			// Get players
			if (coach.team_id) {
				const { data: playersData } = await supabase
					.from("players")
					.select("id, first_name, last_name, photo_url")
					.eq("team_id", coach.team_id)
					.order("first_name");

				if (playersData) {
					setPlayers(playersData);

					// Get awarded badges
					const playerIds = playersData.map(p => p.id);
					if (playerIds.length > 0) {
						const { data: awardedData } = await supabase
							.from("player_badges")
							.select("*")
							.in("player_id", playerIds);

						if (awardedData) {
							setPlayerBadges(awardedData);
						}
					}
				}
			}
		} catch (err) {
			console.error("Load badges error:", err);
		} finally {
			setLoading(false);
		}
	};

	const openAwardModal = (badge: Badge) => {
		setSelectedBadge(badge);
		setSelectedPlayer("");
		setShowAwardModal(true);
	};

	const awardBadge = async () => {
		if (!selectedBadge || !selectedPlayer || !coachId) return;

		setSaving(true);
		try {
			// Insert badge award
			const { error: badgeError } = await supabase
				.from("player_badges")
				.insert({
					player_id: selectedPlayer,
					badge_id: selectedBadge.id,
					awarded_by: coachId,
					awarded_at: new Date().toISOString(),
				});

			if (badgeError) throw badgeError;

			// Update player points
			const { error: pointsError } = await supabase.rpc('increment_player_points', {
				player_id_input: selectedPlayer,
				points_to_add: selectedBadge.points
			});

			// If RPC doesn't exist, do manual update
			if (pointsError) {
				const player = players.find(p => p.id === selectedPlayer);
				if (player) {
					await supabase
						.from("players")
						.update({ total_points: (player as any).total_points + selectedBadge.points })
						.eq("id", selectedPlayer);
				}
			}

			toast.success(`Badge awarded! +${selectedBadge.points} points`);
			celebrateBadge();

			// Send push notification
			const player = players.find(p => p.id === selectedPlayer);
			if (player) {
				sendNotification(NotificationTypes.BADGE_AWARDED, {
					playerName: player.first_name,
					badgeName: selectedBadge.name_en
				});
			}

			setShowAwardModal(false);
			loadData();

		} catch (err: any) {
			console.error("Award badge error:", err);
			toast.error(err.message || "Failed to award badge");
		} finally {
			setSaving(false);
		}
	};

	const getPlayerBadgeCount = (playerId: string) => {
		return playerBadges.filter(pb => pb.player_id === playerId).length;
	};

	const getCategoryColor = (category: string) => {
		switch (category) {
			case "effort": return "#2d5a1b";
			case "skill": return "#2b6cb0";
			case "character": return "#6b46c1";
			case "attendance": return "#dd6b20";
			default: return "#718096";
		}
	};

	if (loading) {
		return (
			<div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', backgroundColor: '#f7fafc' }}>
				<Icon icon="eos-icons:loading" className="cs_fs_48" style={{ color: '#2d5a1b' }} />
			</div>
		);
	}

	return (
		<div style={{ backgroundColor: '#f7fafc', minHeight: '100vh' }}>
			{/* Header */}
			<header style={{ backgroundColor: '#2d5a1b', padding: '20px 0' }}>
				<div className="container">
					<div className="d-flex align-items-center gap-3">
						<button onClick={() => navigate("/dashboard")} className="btn btn-link text-white p-0">
							<Icon icon="fa6-solid:arrow-left" className="cs_fs_20" />
						</button>
						<div className="text-white">
							<h1 className="cs_fs_20 mb-0 fw-bold">Badges</h1>
							<span className="opacity-75" style={{ fontSize: '14px' }}>Award recognition to players</span>
						</div>
					</div>
				</div>
			</header>

			<main className="container py-4">
				{/* Badge Grid */}
				<div className="bg-white rounded-3 p-4 shadow-sm mb-4">
					<h2 className="cs_fs_18 fw-bold mb-3">Available Badges</h2>
					<div className="row g-3">
						{badges.map(badge => (
							<div key={badge.id} className="col-6 col-md-4 col-lg-3">
								<div
									className="text-center p-3 rounded-3 h-100"
									style={{ backgroundColor: '#f7fafc', cursor: 'pointer', border: '2px solid transparent', transition: 'border-color 0.2s' }}
									onClick={() => openAwardModal(badge)}
									onMouseOver={(e) => e.currentTarget.style.borderColor = getCategoryColor(badge.category)}
									onMouseOut={(e) => e.currentTarget.style.borderColor = 'transparent'}
								>
									<div style={{ fontSize: '36px', marginBottom: '8px' }}>{badge.icon}</div>
									<div className="fw-semibold" style={{ fontSize: '14px' }}>{badge.name_en}</div>
									<div className="text-muted" style={{ fontSize: '12px' }}>{badge.description_en}</div>
									<span
										className="badge rounded-pill mt-2"
										style={{ backgroundColor: getCategoryColor(badge.category), fontSize: '11px' }}
									>
										+{badge.points} pts
									</span>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Recent Awards */}
				<div className="bg-white rounded-3 p-4 shadow-sm">
					<h2 className="cs_fs_18 fw-bold mb-3">Players</h2>
					{players.length === 0 ? (
						<div className="text-center py-4">
							<Icon icon="fa6-solid:users" className="cs_fs_36 mb-2 text-muted" />
							<p className="text-muted mb-0">Add players to your roster first</p>
						</div>
					) : (
						<div className="row g-2">
							{players.map(player => {
								const badgeCount = getPlayerBadgeCount(player.id);
								return (
									<div key={player.id} className="col-6 col-md-4 col-lg-3">
										<div className="d-flex align-items-center gap-2 p-2 rounded-3" style={{ backgroundColor: '#f7fafc' }}>
											<div
												className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
												style={{ width: '40px', height: '40px', backgroundColor: '#e2e8f0' }}
											>
												{player.photo_url ? (
													<img src={player.photo_url} alt="" className="rounded-circle" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
												) : (
													<Icon icon="fa6-solid:user" style={{ color: '#a0aec0' }} />
												)}
											</div>
											<div className="flex-grow-1 overflow-hidden">
												<div className="fw-semibold text-truncate" style={{ fontSize: '14px' }}>{player.first_name}</div>
												<div className="text-muted" style={{ fontSize: '12px' }}>{badgeCount} badge{badgeCount !== 1 ? 's' : ''}</div>
											</div>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>
			</main>

			{/* Award Modal */}
			{showAwardModal && selectedBadge && (
				<div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setShowAwardModal(false)}>
					<div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
						<div className="modal-content rounded-4">
							<div className="modal-header border-0 pb-0">
								<h5 className="modal-title fw-bold">Award Badge</h5>
								<button type="button" className="btn-close" onClick={() => setShowAwardModal(false)} />
							</div>
							<div className="modal-body text-center">
								<div style={{ fontSize: '48px', marginBottom: '8px' }}>{selectedBadge.icon}</div>
								<h3 className="fw-bold">{selectedBadge.name_en}</h3>
								<p className="text-muted">{selectedBadge.description_en}</p>
								<span className="badge rounded-pill mb-4" style={{ backgroundColor: getCategoryColor(selectedBadge.category) }}>
									+{selectedBadge.points} points
								</span>

								<div className="mt-4">
									<label className="form-label fw-semibold">Select Player</label>
									<select
										className="form-select rounded-pill"
										value={selectedPlayer}
										onChange={e => setSelectedPlayer(e.target.value)}
									>
										<option value="">Choose a player...</option>
										{players.map(p => (
											<option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
										))}
									</select>
								</div>
							</div>
							<div className="modal-footer border-0 pt-0">
								<button className="btn btn-secondary rounded-pill" onClick={() => setShowAwardModal(false)}>Cancel</button>
								<button
									className="btn rounded-pill px-4"
									style={{ backgroundColor: '#2d5a1b', color: 'white' }}
									disabled={!selectedPlayer || saving}
									onClick={awardBadge}
								>
									{saving ? "Awarding..." : "Award Badge"}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default BadgeManager;
