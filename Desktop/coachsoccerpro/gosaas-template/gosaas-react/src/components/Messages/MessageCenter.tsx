import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { supabase } from "../../lib/supabase";
import { celebrate } from "../../utils/celebrate";

interface Player {
	id: string;
	first_name: string;
	last_name: string;
	photo_url: string | null;
}

interface Message {
	id: string;
	coach_id: string;
	team_id: string;
	content: string;
	message_type: "announcement" | "reminder" | "praise" | "general";
	recipient_type: "team" | "player" | "parents";
	recipient_player_id: string | null;
	created_at: string;
}

const MESSAGE_TYPES = [
	{ value: "announcement", label: "Announcement", icon: "fa6-solid:bullhorn", color: "#2b6cb0" },
	{ value: "reminder", label: "Reminder", icon: "fa6-solid:bell", color: "#dd6b20" },
	{ value: "praise", label: "Praise", icon: "fa6-solid:star", color: "#6b46c1" },
	{ value: "general", label: "General", icon: "fa6-solid:message", color: "#2d5a1b" },
];

const MessageCenter = () => {
	const navigate = useNavigate();
	const [loading, setLoading] = useState(true);
	const [messages, setMessages] = useState<Message[]>([]);
	const [players, setPlayers] = useState<Player[]>([]);
	const [coachId, setCoachId] = useState<string | null>(null);
	const [teamId, setTeamId] = useState<string | null>(null);
	const [showComposeModal, setShowComposeModal] = useState(false);
	const [sending, setSending] = useState(false);

	// Compose form
	const [messageType, setMessageType] = useState("general");
	const [recipientType, setRecipientType] = useState("team");
	const [selectedPlayer, setSelectedPlayer] = useState("");
	const [content, setContent] = useState("");

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
			setTeamId(coach.team_id);

			// Get messages
			const { data: messagesData } = await supabase
				.from("messages")
				.select("*")
				.eq("coach_id", coach.id)
				.order("created_at", { ascending: false })
				.limit(50);

			if (messagesData) {
				setMessages(messagesData);
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
				}
			}
		} catch (err) {
			console.error("Load messages error:", err);
		} finally {
			setLoading(false);
		}
	};

	const sendMessage = async () => {
		if (!content.trim() || !coachId || !teamId) return;

		setSending(true);
		try {
			const { error } = await supabase
				.from("messages")
				.insert({
					coach_id: coachId,
					team_id: teamId,
					content: content.trim(),
					message_type: messageType,
					recipient_type: recipientType,
					recipient_player_id: recipientType === "player" ? selectedPlayer : null,
				});

			if (error) throw error;

			toast.success("Message sent!");
			celebrate();
			setShowComposeModal(false);
			setContent("");
			setMessageType("general");
			setRecipientType("team");
			setSelectedPlayer("");
			loadData();
		} catch (err: any) {
			console.error("Send message error:", err);
			toast.error(err.message || "Failed to send message");
		} finally {
			setSending(false);
		}
	};

	const getTypeConfig = (type: string) => {
		return MESSAGE_TYPES.find(t => t.value === type) || MESSAGE_TYPES[3];
	};

	const getRecipientLabel = (msg: Message) => {
		if (msg.recipient_type === "team") return "Entire Team";
		if (msg.recipient_type === "parents") return "All Parents";
		if (msg.recipient_type === "player" && msg.recipient_player_id) {
			const player = players.find(p => p.id === msg.recipient_player_id);
			return player ? `${player.first_name} ${player.last_name}` : "Player";
		}
		return "Unknown";
	};

	const formatDate = (dateStr: string) => {
		const date = new Date(dateStr);
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const days = Math.floor(diff / (1000 * 60 * 60 * 24));

		if (days === 0) {
			return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
		} else if (days === 1) {
			return "Yesterday";
		} else if (days < 7) {
			return date.toLocaleDateString([], { weekday: 'short' });
		} else {
			return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
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
					<div className="d-flex align-items-center justify-content-between">
						<div className="d-flex align-items-center gap-3">
							<button onClick={() => navigate("/dashboard")} className="btn btn-link text-white p-0">
								<Icon icon="fa6-solid:arrow-left" className="cs_fs_20" />
							</button>
							<div className="text-white">
								<h1 className="cs_fs_20 mb-0 fw-bold">Messages</h1>
								<span className="opacity-75" style={{ fontSize: '14px' }}>Communicate with your team</span>
							</div>
						</div>
						<button
							className="btn btn-light rounded-pill px-3"
							onClick={() => setShowComposeModal(true)}
						>
							<Icon icon="fa6-solid:plus" className="me-2" />
							New Message
						</button>
					</div>
				</div>
			</header>

			<main className="container py-4">
				{/* Quick Send */}
				<div className="bg-white rounded-3 p-4 shadow-sm mb-4">
					<h2 className="cs_fs_18 fw-bold mb-3">Quick Send</h2>
					<div className="row g-2">
						{MESSAGE_TYPES.map(type => (
							<div key={type.value} className="col-6 col-md-3">
								<button
									className="btn w-100 d-flex flex-column align-items-center gap-2 p-3 rounded-3"
									style={{ backgroundColor: `${type.color}15`, border: 'none' }}
									onClick={() => {
										setMessageType(type.value);
										setShowComposeModal(true);
									}}
								>
									<Icon icon={type.icon} style={{ color: type.color, fontSize: '24px' }} />
									<span className="fw-semibold" style={{ color: type.color, fontSize: '14px' }}>{type.label}</span>
								</button>
							</div>
						))}
					</div>
				</div>

				{/* Message History */}
				<div className="bg-white rounded-3 p-4 shadow-sm">
					<h2 className="cs_fs_18 fw-bold mb-3">Sent Messages</h2>
					{messages.length === 0 ? (
						<div className="text-center py-5">
							<Icon icon="fa6-solid:paper-plane" className="cs_fs_48 mb-3 text-muted" />
							<p className="text-muted mb-3">No messages sent yet</p>
							<button
								className="btn rounded-pill px-4"
								style={{ backgroundColor: '#2d5a1b', color: 'white' }}
								onClick={() => setShowComposeModal(true)}
							>
								Send Your First Message
							</button>
						</div>
					) : (
						<div className="list-group list-group-flush">
							{messages.map(msg => {
								const typeConfig = getTypeConfig(msg.message_type);
								return (
									<div key={msg.id} className="list-group-item px-0 py-3 border-start-0 border-end-0">
										<div className="d-flex gap-3">
											<div
												className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
												style={{ width: '40px', height: '40px', backgroundColor: `${typeConfig.color}15` }}
											>
												<Icon icon={typeConfig.icon} style={{ color: typeConfig.color }} />
											</div>
											<div className="flex-grow-1 overflow-hidden">
												<div className="d-flex align-items-center justify-content-between mb-1">
													<span className="fw-semibold" style={{ fontSize: '14px' }}>{typeConfig.label}</span>
													<span className="text-muted" style={{ fontSize: '12px' }}>{formatDate(msg.created_at)}</span>
												</div>
												<p className="mb-1 text-truncate" style={{ fontSize: '14px' }}>{msg.content}</p>
												<span className="badge rounded-pill" style={{ backgroundColor: '#e2e8f0', color: '#4a5568', fontSize: '11px' }}>
													To: {getRecipientLabel(msg)}
												</span>
											</div>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>
			</main>

			{/* Compose Modal */}
			{showComposeModal && (
				<div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setShowComposeModal(false)}>
					<div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
						<div className="modal-content rounded-4">
							<div className="modal-header border-0 pb-0">
								<h5 className="modal-title fw-bold">New Message</h5>
								<button type="button" className="btn-close" onClick={() => setShowComposeModal(false)} />
							</div>
							<div className="modal-body">
								{/* Message Type */}
								<div className="mb-3">
									<label className="form-label fw-semibold">Type</label>
									<div className="d-flex gap-2 flex-wrap">
										{MESSAGE_TYPES.map(type => (
											<button
												key={type.value}
												className="btn btn-sm rounded-pill px-3"
												style={{
													backgroundColor: messageType === type.value ? type.color : `${type.color}15`,
													color: messageType === type.value ? 'white' : type.color,
													border: 'none'
												}}
												onClick={() => setMessageType(type.value)}
											>
												<Icon icon={type.icon} className="me-1" />
												{type.label}
											</button>
										))}
									</div>
								</div>

								{/* Recipient */}
								<div className="mb-3">
									<label className="form-label fw-semibold">Send To</label>
									<div className="d-flex gap-2 mb-2">
										<button
											className={`btn btn-sm rounded-pill px-3 ${recipientType === 'team' ? 'btn-dark' : 'btn-outline-secondary'}`}
											onClick={() => setRecipientType("team")}
										>
											Entire Team
										</button>
										<button
											className={`btn btn-sm rounded-pill px-3 ${recipientType === 'parents' ? 'btn-dark' : 'btn-outline-secondary'}`}
											onClick={() => setRecipientType("parents")}
										>
											All Parents
										</button>
										<button
											className={`btn btn-sm rounded-pill px-3 ${recipientType === 'player' ? 'btn-dark' : 'btn-outline-secondary'}`}
											onClick={() => setRecipientType("player")}
										>
											One Player
										</button>
									</div>
									{recipientType === "player" && (
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
									)}
								</div>

								{/* Message Content */}
								<div className="mb-3">
									<label className="form-label fw-semibold">Message</label>
									<textarea
										className="form-control rounded-3"
										rows={4}
										placeholder="Type your message..."
										value={content}
										onChange={e => setContent(e.target.value)}
									/>
								</div>
							</div>
							<div className="modal-footer border-0 pt-0">
								<button className="btn btn-secondary rounded-pill" onClick={() => setShowComposeModal(false)}>Cancel</button>
								<button
									className="btn rounded-pill px-4"
									style={{ backgroundColor: '#2d5a1b', color: 'white' }}
									disabled={!content.trim() || (recipientType === 'player' && !selectedPlayer) || sending}
									onClick={sendMessage}
								>
									{sending ? "Sending..." : "Send Message"}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default MessageCenter;
