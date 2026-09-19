import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

interface Player {
	id: string;
	first_name: string;
	last_name: string;
	photo_url: string | null;
	total_points: number;
	card_frame: string;
}

interface Milestone {
	id: string;
	title: string;
	description: string;
	icon: string;
	points_required: number;
	reward_type: "frame" | "badge" | "title";
	reward_value: string;
	unlocked: boolean;
}

const MILESTONES: Omit<Milestone, 'id' | 'unlocked'>[] = [
	{ title: "First Steps", description: "Join the team", icon: "fa6-solid:flag-checkered", points_required: 0, reward_type: "frame", reward_value: "bronze" },
	{ title: "Getting Started", description: "Earn 25 points", icon: "fa6-solid:seedling", points_required: 25, reward_type: "title", reward_value: "Rookie" },
	{ title: "Rising Star", description: "Earn 50 points", icon: "fa6-solid:star", points_required: 50, reward_type: "badge", reward_value: "Rising Star" },
	{ title: "Dedicated Player", description: "Earn 100 points", icon: "fa6-solid:heart", points_required: 100, reward_type: "title", reward_value: "Dedicated" },
	{ title: "Silver Achievement", description: "Earn 150 points", icon: "fa6-solid:medal", points_required: 150, reward_type: "frame", reward_value: "silver" },
	{ title: "Team Leader", description: "Earn 200 points", icon: "fa6-solid:users", points_required: 200, reward_type: "title", reward_value: "Leader" },
	{ title: "Champion Spirit", description: "Earn 300 points", icon: "fa6-solid:trophy", points_required: 300, reward_type: "badge", reward_value: "Champion" },
	{ title: "Gold Standard", description: "Earn 400 points", icon: "fa6-solid:crown", points_required: 400, reward_type: "frame", reward_value: "gold" },
	{ title: "Elite Player", description: "Earn 500 points", icon: "fa6-solid:bolt", points_required: 500, reward_type: "title", reward_value: "Elite" },
	{ title: "Platinum Legend", description: "Earn 750 points", icon: "fa6-solid:gem", points_required: 750, reward_type: "frame", reward_value: "platinum" },
	{ title: "Hall of Fame", description: "Earn 1000 points", icon: "fa6-solid:monument", points_required: 1000, reward_type: "badge", reward_value: "Legend" },
	{ title: "Diamond Status", description: "Earn 1500 points", icon: "fa6-solid:diamond", points_required: 1500, reward_type: "frame", reward_value: "diamond" },
];

const JourneyPath = () => {
	const navigate = useNavigate();
	const [loading, setLoading] = useState(true);
	const [player, setPlayer] = useState<Player | null>(null);
	const [milestones, setMilestones] = useState<Milestone[]>([]);

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

			// For now, get player directly linked to user (child account)
			// In production, this would be through a child_accounts table
			const { data: playerData } = await supabase
				.from("players")
				.select("*")
				.eq("id", user.id)
				.single();

			// If no direct link, try to find via parent or demo mode
			if (!playerData) {
				// Demo mode - get first player
				const { data: anyPlayer } = await supabase
					.from("players")
					.select("*")
					.limit(1)
					.single();

				if (anyPlayer) {
					setPlayer(anyPlayer);
					buildMilestones(anyPlayer.total_points);
				}
			} else {
				setPlayer(playerData);
				buildMilestones(playerData.total_points);
			}
		} catch (err) {
			console.error("Load journey error:", err);
		} finally {
			setLoading(false);
		}
	};

	const buildMilestones = (points: number) => {
		const built = MILESTONES.map((m, idx) => ({
			...m,
			id: `milestone-${idx}`,
			unlocked: points >= m.points_required
		}));
		setMilestones(built);
	};

	const getProgress = () => {
		if (!player) return 0;
		const unlocked = milestones.filter(m => m.unlocked).length;
		return Math.round((unlocked / milestones.length) * 100);
	};

	const getNextMilestone = () => {
		return milestones.find(m => !m.unlocked);
	};

	const getPointsToNext = () => {
		const next = getNextMilestone();
		if (!next || !player) return 0;
		return next.points_required - player.total_points;
	};

	const getFrameColor = (frame: string) => {
		switch (frame) {
			case "bronze": return "#cd7f32";
			case "silver": return "#c0c0c0";
			case "gold": return "#ffd700";
			case "platinum": return "#e5e4e2";
			case "diamond": return "#b9f2ff";
			default: return "#cd7f32";
		}
	};

	const getRewardIcon = (type: string) => {
		switch (type) {
			case "frame": return "fa6-solid:image";
			case "badge": return "fa6-solid:award";
			case "title": return "fa6-solid:tag";
			default: return "fa6-solid:gift";
		}
	};

	if (loading) {
		return (
			<div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', backgroundColor: '#f7fafc' }}>
				<Icon icon="eos-icons:loading" className="cs_fs_48" style={{ color: '#2d5a1b' }} />
			</div>
		);
	}

	if (!player) {
		return (
			<div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', backgroundColor: '#f7fafc' }}>
				<div className="text-center">
					<Icon icon="fa6-solid:map" className="cs_fs_48 mb-3 text-muted" />
					<p className="text-muted">No journey data available</p>
					<button className="btn btn-secondary rounded-pill" onClick={() => navigate("/dashboard")}>
						Back to Dashboard
					</button>
				</div>
			</div>
		);
	}

	const nextMilestone = getNextMilestone();

	return (
		<div style={{ backgroundColor: '#f7fafc', minHeight: '100vh' }}>
			{/* Header */}
			<header style={{ backgroundColor: '#2d5a1b', padding: '20px 0' }}>
				<div className="container">
					<div className="d-flex align-items-center gap-3">
						<button onClick={() => navigate(-1)} className="btn btn-link text-white p-0">
							<Icon icon="fa6-solid:arrow-left" className="cs_fs_20" />
						</button>
						<div className="text-white">
							<h1 className="cs_fs_20 mb-0 fw-bold">My Journey</h1>
							<span className="opacity-75" style={{ fontSize: '14px' }}>{player.first_name}'s Path to Greatness</span>
						</div>
					</div>
				</div>
			</header>

			<main className="container py-4">
				{/* Player Card */}
				<div className="bg-white rounded-3 p-4 shadow-sm mb-4">
					<div className="d-flex align-items-center gap-3">
						<div
							className="rounded-circle d-flex align-items-center justify-content-center"
							style={{
								width: '70px',
								height: '70px',
								border: `4px solid ${getFrameColor(player.card_frame)}`,
								backgroundColor: '#e2e8f0'
							}}
						>
							{player.photo_url ? (
								<img src={player.photo_url} alt="" className="rounded-circle" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
							) : (
								<Icon icon="fa6-solid:user" style={{ color: '#a0aec0', fontSize: '28px' }} />
							)}
						</div>
						<div className="flex-grow-1">
							<h2 className="cs_fs_18 fw-bold mb-1">{player.first_name} {player.last_name}</h2>
							<div className="d-flex align-items-center gap-2 mb-2">
								<span className="fw-bold" style={{ color: '#2d5a1b', fontSize: '20px' }}>{player.total_points}</span>
								<span className="text-muted" style={{ fontSize: '14px' }}>total points</span>
							</div>
							<div className="progress" style={{ height: '8px' }}>
								<div
									className="progress-bar"
									style={{ width: `${getProgress()}%`, backgroundColor: '#2d5a1b' }}
								/>
							</div>
							<div className="text-muted mt-1" style={{ fontSize: '12px' }}>
								{getProgress()}% journey complete
							</div>
						</div>
					</div>
				</div>

				{/* Next Milestone */}
				{nextMilestone && (
					<div className="bg-white rounded-3 p-4 shadow-sm mb-4" style={{ borderLeft: '4px solid #2d5a1b' }}>
						<div className="d-flex align-items-center gap-3">
							<div
								className="rounded-circle d-flex align-items-center justify-content-center"
								style={{ width: '50px', height: '50px', backgroundColor: '#2d5a1b15' }}
							>
								<Icon icon={nextMilestone.icon} style={{ color: '#2d5a1b', fontSize: '24px' }} />
							</div>
							<div className="flex-grow-1">
								<div className="text-muted" style={{ fontSize: '12px' }}>NEXT MILESTONE</div>
								<h3 className="fw-bold mb-0" style={{ fontSize: '16px' }}>{nextMilestone.title}</h3>
								<div style={{ fontSize: '14px' }}>
									<span className="fw-bold" style={{ color: '#2d5a1b' }}>{getPointsToNext()}</span>
									<span className="text-muted"> points to go</span>
								</div>
							</div>
							<div className="text-center">
								<Icon icon={getRewardIcon(nextMilestone.reward_type)} className="text-muted mb-1" />
								<div className="text-muted" style={{ fontSize: '11px' }}>{nextMilestone.reward_value}</div>
							</div>
						</div>
					</div>
				)}

				{/* Journey Path */}
				<div className="bg-white rounded-3 p-4 shadow-sm">
					<h2 className="cs_fs_18 fw-bold mb-4">The Path</h2>
					<div className="position-relative">
						{/* Path line */}
						<div
							className="position-absolute"
							style={{
								left: '24px',
								top: '24px',
								bottom: '24px',
								width: '4px',
								backgroundColor: '#e2e8f0',
								borderRadius: '2px'
							}}
						/>
						{/* Progress line */}
						<div
							className="position-absolute"
							style={{
								left: '24px',
								top: '24px',
								height: `${getProgress()}%`,
								width: '4px',
								backgroundColor: '#2d5a1b',
								borderRadius: '2px',
								transition: 'height 0.5s ease'
							}}
						/>

						{milestones.map((milestone, idx) => (
							<div key={milestone.id} className="d-flex gap-3 mb-4 position-relative">
								{/* Milestone marker */}
								<div
									className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
									style={{
										width: '50px',
										height: '50px',
										backgroundColor: milestone.unlocked ? '#2d5a1b' : '#e2e8f0',
										border: milestone.unlocked ? 'none' : '3px dashed #cbd5e0',
										zIndex: 1
									}}
								>
									{milestone.unlocked ? (
										<Icon icon={milestone.icon} className="text-white" style={{ fontSize: '20px' }} />
									) : (
										<Icon icon="fa6-solid:lock" style={{ color: '#a0aec0', fontSize: '16px' }} />
									)}
								</div>

								{/* Milestone info */}
								<div
									className={`flex-grow-1 p-3 rounded-3 ${milestone.unlocked ? '' : 'opacity-50'}`}
									style={{ backgroundColor: milestone.unlocked ? '#2d5a1b08' : '#f7fafc' }}
								>
									<div className="d-flex justify-content-between align-items-start">
										<div>
											<h4 className="fw-bold mb-1" style={{ fontSize: '15px' }}>{milestone.title}</h4>
											<p className="mb-0 text-muted" style={{ fontSize: '13px' }}>{milestone.description}</p>
										</div>
										{milestone.unlocked && (
											<span className="badge rounded-pill" style={{ backgroundColor: '#2d5a1b', fontSize: '11px' }}>
												<Icon icon="fa6-solid:check" className="me-1" />
												Unlocked
											</span>
										)}
									</div>
									{/* Reward */}
									<div className="mt-2 d-flex align-items-center gap-2">
										<Icon icon={getRewardIcon(milestone.reward_type)} style={{ color: '#718096', fontSize: '12px' }} />
										<span style={{ fontSize: '12px', color: '#718096' }}>
											{milestone.reward_type === 'frame' && `${milestone.reward_value} frame`}
											{milestone.reward_type === 'badge' && `"${milestone.reward_value}" badge`}
											{milestone.reward_type === 'title' && `"${milestone.reward_value}" title`}
										</span>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			</main>
		</div>
	);
};

export default JourneyPath;
