import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { supabase } from "../../lib/supabase";
import { celebrate } from "../../utils/celebrate";

interface Player {
	id: string;
	first_name: string;
	last_name: string;
	photo_url: string | null;
	jersey_number: number | null;
}

interface Event {
	id: string;
	title: string;
	event_type: string;
	start_time: string;
	location_name: string;
}

interface AttendanceRecord {
	player_id: string;
	status: "present" | "absent" | "late" | "excused";
}

const AttendanceTracker = () => {
	const navigate = useNavigate();
	const { eventId } = useParams();
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [event, setEvent] = useState<Event | null>(null);
	const [players, setPlayers] = useState<Player[]>([]);
	const [attendance, setAttendance] = useState<{ [playerId: string]: string }>({});

	useEffect(() => {
		if (eventId) {
			loadData();
		}
	}, [eventId]);

	const loadData = async () => {
		try {
			const { data: { user } } = await supabase.auth.getUser();
			if (!user) {
				navigate("/login", { replace: true });
				return;
			}

			// Get event
			const { data: eventData, error: eventError } = await supabase
				.from("events")
				.select("*")
				.eq("id", eventId)
				.single();

			if (eventError || !eventData) {
				toast.error("Event not found");
				navigate("/calendar");
				return;
			}
			setEvent(eventData);

			// Get team players
			const { data: coach } = await supabase
				.from("coaches")
				.select("team_id")
				.eq("user_id", user.id)
				.single();

			if (coach?.team_id) {
				const { data: playersData } = await supabase
					.from("players")
					.select("*")
					.eq("team_id", coach.team_id)
					.order("jersey_number", { ascending: true, nullsFirst: false })
					.order("first_name", { ascending: true });

				if (playersData) {
					setPlayers(playersData);

					// Get existing attendance records
					const { data: attendanceData } = await supabase
						.from("attendance")
						.select("player_id, status")
						.eq("event_id", eventId);

					if (attendanceData) {
						const attendanceMap: { [key: string]: string } = {};
						attendanceData.forEach(record => {
							attendanceMap[record.player_id] = record.status;
						});
						setAttendance(attendanceMap);
					}
				}
			}
		} catch (err) {
			console.error("Load attendance error:", err);
		} finally {
			setLoading(false);
		}
	};

	const toggleAttendance = (playerId: string) => {
		setAttendance(prev => {
			const current = prev[playerId];
			let next: string;

			if (!current || current === "absent") {
				next = "present";
			} else if (current === "present") {
				next = "late";
			} else if (current === "late") {
				next = "excused";
			} else {
				next = "absent";
			}

			return { ...prev, [playerId]: next };
		});
	};

	const setPlayerStatus = (playerId: string, status: string) => {
		setAttendance(prev => ({ ...prev, [playerId]: status }));
	};

	const markAllPresent = () => {
		const allPresent: { [key: string]: string } = {};
		players.forEach(p => { allPresent[p.id] = "present"; });
		setAttendance(allPresent);
	};

	const saveAttendance = async () => {
		if (!eventId) return;
		setSaving(true);

		try {
			const { data: { user } } = await supabase.auth.getUser();
			if (!user) throw new Error("Not logged in");

			// Delete existing attendance for this event
			await supabase
				.from("attendance")
				.delete()
				.eq("event_id", eventId);

			// Insert new records
			const records = Object.entries(attendance).map(([playerId, status]) => ({
				event_id: eventId,
				player_id: playerId,
				status,
				marked_by: user.id,
				marked_at: new Date().toISOString(),
			}));

			if (records.length > 0) {
				const { error } = await supabase
					.from("attendance")
					.insert(records);

				if (error) throw error;
			}

			toast.success("Attendance saved!");
			celebrate();
			navigate("/calendar");

		} catch (err: any) {
			console.error("Save attendance error:", err);
			toast.error(err.message || "Failed to save");
		} finally {
			setSaving(false);
		}
	};

	const getStatusStyle = (status: string) => {
		switch (status) {
			case "present":
				return { bg: "#2d5a1b", icon: "fa6-solid:check", label: "Present" };
			case "late":
				return { bg: "#dd6b20", icon: "fa6-solid:clock", label: "Late" };
			case "excused":
				return { bg: "#2b6cb0", icon: "fa6-solid:calendar-xmark", label: "Excused" };
			case "absent":
				return { bg: "#c53030", icon: "fa6-solid:xmark", label: "Absent" };
			default:
				return { bg: "#a0aec0", icon: "fa6-solid:minus", label: "Not Marked" };
		}
	};

	const formatEventTime = (dateStr: string) => {
		const date = new Date(dateStr);
		return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) +
			" at " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	};

	const presentCount = Object.values(attendance).filter(s => s === "present").length;
	const lateCount = Object.values(attendance).filter(s => s === "late").length;
	const absentCount = Object.values(attendance).filter(s => s === "absent").length;

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
					<div className="d-flex align-items-center justify-content-between">
						<div className="d-flex align-items-center gap-3">
							<button onClick={() => navigate("/calendar")} className="btn btn-link text-white p-0">
								<Icon icon="fa6-solid:arrow-left" className="cs_fs_20" />
							</button>
							<div className="text-white">
								<h1 className="cs_fs_20 mb-0 fw-bold">Take Attendance</h1>
								<span className="opacity-75" style={{ fontSize: '14px' }}>{event?.title}</span>
							</div>
						</div>
						<button
							onClick={saveAttendance}
							disabled={saving}
							className="btn btn-light btn-sm rounded-pill px-3 d-flex align-items-center gap-2"
						>
							<Icon icon="fa6-solid:check" />
							{saving ? "Saving..." : "Save"}
						</button>
					</div>
				</div>
			</header>

			<main className="container py-4">
				{/* Event Info */}
				<div className="bg-white rounded-3 p-3 shadow-sm mb-4">
					<div className="d-flex align-items-center gap-3">
						<div
							className="rounded-circle d-flex align-items-center justify-content-center"
							style={{ width: '48px', height: '48px', backgroundColor: '#2d5a1b15' }}
						>
							<Icon icon={event?.event_type === "game" ? "fa6-solid:futbol" : "fa6-solid:whistle"} style={{ color: '#2d5a1b', fontSize: '20px' }} />
						</div>
						<div>
							<div className="fw-bold">{event?.title}</div>
							<div className="text-muted" style={{ fontSize: '13px' }}>
								{event && formatEventTime(event.start_time)}
								{event?.location_name && ` • ${event.location_name}`}
							</div>
						</div>
					</div>
				</div>

				{/* Quick Stats */}
				<div className="d-flex gap-2 mb-4 flex-wrap">
					<span className="badge rounded-pill px-3 py-2" style={{ backgroundColor: '#2d5a1b', fontSize: '14px' }}>
						<Icon icon="fa6-solid:check" className="me-1" /> {presentCount} Present
					</span>
					<span className="badge rounded-pill px-3 py-2" style={{ backgroundColor: '#dd6b20', fontSize: '14px' }}>
						<Icon icon="fa6-solid:clock" className="me-1" /> {lateCount} Late
					</span>
					<span className="badge rounded-pill px-3 py-2" style={{ backgroundColor: '#c53030', fontSize: '14px' }}>
						<Icon icon="fa6-solid:xmark" className="me-1" /> {absentCount} Absent
					</span>
					<button
						onClick={markAllPresent}
						className="badge rounded-pill px-3 py-2 border-0"
						style={{ backgroundColor: '#e2e8f0', color: '#1a202c', fontSize: '14px', cursor: 'pointer' }}
					>
						Mark All Present
					</button>
				</div>

				{/* Player List */}
				{players.length === 0 ? (
					<div className="bg-white rounded-3 p-5 text-center shadow-sm">
						<Icon icon="fa6-solid:users" className="cs_fs_48 mb-3" style={{ color: '#cbd5e0' }} />
						<h2 className="cs_fs_20 fw-bold mb-2">No players yet</h2>
						<p className="text-muted mb-0">Add players to your roster first</p>
					</div>
				) : (
					<div className="bg-white rounded-3 shadow-sm overflow-hidden">
						{players.map((player, index) => {
							const status = attendance[player.id] || "";
							const style = getStatusStyle(status);

							return (
								<div
									key={player.id}
									className={`d-flex align-items-center p-3 ${index < players.length - 1 ? 'border-bottom' : ''}`}
								>
									{/* Player Info */}
									<div className="d-flex align-items-center gap-3 flex-grow-1">
										<div
											className="rounded-circle d-flex align-items-center justify-content-center position-relative"
											style={{ width: '48px', height: '48px', backgroundColor: '#e2e8f0' }}
										>
											{player.photo_url ? (
												<img src={player.photo_url} alt="" className="rounded-circle" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
											) : (
												<Icon icon="fa6-solid:user" style={{ color: '#a0aec0', fontSize: '20px' }} />
											)}
											{player.jersey_number && (
												<div
													className="position-absolute rounded-circle d-flex align-items-center justify-content-center fw-bold"
													style={{
														width: '20px', height: '20px',
														backgroundColor: '#2d5a1b', color: 'white',
														fontSize: '10px', bottom: '-2px', right: '-2px',
														border: '2px solid white'
													}}
												>
													{player.jersey_number}
												</div>
											)}
										</div>
										<div>
											<div className="fw-semibold">{player.first_name} {player.last_name}</div>
										</div>
									</div>

									{/* Status Buttons */}
									<div className="d-flex gap-1">
										{["present", "late", "excused", "absent"].map(s => {
											const st = getStatusStyle(s);
											const isActive = status === s;
											return (
												<button
													key={s}
													onClick={() => setPlayerStatus(player.id, s)}
													className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center"
													style={{
														width: '36px', height: '36px',
														backgroundColor: isActive ? st.bg : '#e2e8f0',
														color: isActive ? 'white' : '#718096',
														border: 'none'
													}}
													title={st.label}
												>
													<Icon icon={st.icon} />
												</button>
											);
										})}
									</div>
								</div>
							);
						})}
					</div>
				)}
			</main>
		</div>
	);
};

export default AttendanceTracker;
