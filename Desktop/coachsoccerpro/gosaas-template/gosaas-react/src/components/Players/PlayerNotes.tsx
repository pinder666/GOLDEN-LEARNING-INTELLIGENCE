import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { supabase } from "../../lib/supabase";

interface Player {
	id: string;
	first_name: string;
	last_name: string;
	photo_url: string | null;
	jersey_number: number | null;
	position: string | null;
}

interface Note {
	id: string;
	player_id: string;
	coach_id: string;
	content: string;
	note_type: string;
	created_at: string;
}

const NOTE_TYPES = [
	{ value: "development", label: "Development", icon: "fa6-solid:chart-line", color: "#2d5a1b" },
	{ value: "behavior", label: "Behavior", icon: "fa6-solid:face-smile", color: "#6b46c1" },
	{ value: "skills", label: "Skills", icon: "fa6-solid:futbol", color: "#2b6cb0" },
	{ value: "injury", label: "Injury/Health", icon: "fa6-solid:heart-pulse", color: "#c53030" },
	{ value: "general", label: "General", icon: "fa6-solid:note-sticky", color: "#dd6b20" },
];

const PlayerNotes = () => {
	const navigate = useNavigate();
	const { playerId } = useParams<{ playerId: string }>();
	const [loading, setLoading] = useState(true);
	const [player, setPlayer] = useState<Player | null>(null);
	const [notes, setNotes] = useState<Note[]>([]);
	const [coachId, setCoachId] = useState<string | null>(null);
	const [showAddModal, setShowAddModal] = useState(false);
	const [saving, setSaving] = useState(false);

	// Form
	const [noteType, setNoteType] = useState("development");
	const [content, setContent] = useState("");

	useEffect(() => {
		loadData();
	}, [playerId]);

	const loadData = async () => {
		if (!playerId) {
			navigate("/roster", { replace: true });
			return;
		}

		try {
			const { data: { user } } = await supabase.auth.getUser();
			if (!user) {
				navigate("/login", { replace: true });
				return;
			}

			const { data: coach } = await supabase
				.from("coaches")
				.select("id")
				.eq("user_id", user.id)
				.single();

			if (!coach) {
				navigate("/onboarding", { replace: true });
				return;
			}

			setCoachId(coach.id);

			// Get player
			const { data: playerData } = await supabase
				.from("players")
				.select("*")
				.eq("id", playerId)
				.single();

			if (playerData) {
				setPlayer(playerData);
			}

			// Get notes
			const { data: notesData } = await supabase
				.from("player_notes")
				.select("*")
				.eq("player_id", playerId)
				.eq("coach_id", coach.id)
				.order("created_at", { ascending: false });

			if (notesData) {
				setNotes(notesData);
			}
		} catch (err) {
			console.error("Load notes error:", err);
		} finally {
			setLoading(false);
		}
	};

	const saveNote = async () => {
		if (!content.trim() || !coachId || !playerId) return;

		setSaving(true);
		try {
			const { error } = await supabase
				.from("player_notes")
				.insert({
					player_id: playerId,
					coach_id: coachId,
					content: content.trim(),
					note_type: noteType,
				});

			if (error) throw error;

			toast.success("Note saved!");
			setShowAddModal(false);
			setContent("");
			setNoteType("development");
			loadData();
		} catch (err: any) {
			console.error("Save note error:", err);
			toast.error(err.message || "Failed to save note");
		} finally {
			setSaving(false);
		}
	};

	const deleteNote = async (noteId: string) => {
		if (!confirm("Delete this note?")) return;

		try {
			const { error } = await supabase
				.from("player_notes")
				.delete()
				.eq("id", noteId);

			if (error) throw error;

			toast.success("Note deleted");
			loadData();
		} catch (err: any) {
			toast.error("Failed to delete note");
		}
	};

	const getTypeConfig = (type: string) => {
		return NOTE_TYPES.find(t => t.value === type) || NOTE_TYPES[4];
	};

	const formatDate = (dateStr: string) => {
		const date = new Date(dateStr);
		return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
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
					<Icon icon="fa6-solid:user-slash" className="cs_fs_48 mb-3 text-muted" />
					<p className="text-muted">Player not found</p>
					<button className="btn btn-secondary rounded-pill" onClick={() => navigate("/roster")}>
						Back to Roster
					</button>
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
							<button onClick={() => navigate("/roster")} className="btn btn-link text-white p-0">
								<Icon icon="fa6-solid:arrow-left" className="cs_fs_20" />
							</button>
							<div className="d-flex align-items-center gap-3">
								<div
									className="rounded-circle d-flex align-items-center justify-content-center"
									style={{ width: '50px', height: '50px', backgroundColor: 'rgba(255,255,255,0.2)' }}
								>
									{player.photo_url ? (
										<img src={player.photo_url} alt="" className="rounded-circle" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
									) : (
										<Icon icon="fa6-solid:user" className="text-white cs_fs_20" />
									)}
								</div>
								<div className="text-white">
									<h1 className="cs_fs_20 mb-0 fw-bold">{player.first_name} {player.last_name}</h1>
									<span className="opacity-75" style={{ fontSize: '14px' }}>
										{player.position || "Player"} {player.jersey_number ? `• #${player.jersey_number}` : ""}
									</span>
								</div>
							</div>
						</div>
						<button
							className="btn btn-light rounded-pill px-3"
							onClick={() => setShowAddModal(true)}
						>
							<Icon icon="fa6-solid:plus" className="me-2" />
							Add Note
						</button>
					</div>
				</div>
			</header>

			<main className="container py-4">
				{/* Quick Add */}
				<div className="bg-white rounded-3 p-4 shadow-sm mb-4">
					<h2 className="cs_fs_18 fw-bold mb-3">Quick Add</h2>
					<div className="row g-2">
						{NOTE_TYPES.map(type => (
							<div key={type.value} className="col-6 col-md">
								<button
									className="btn w-100 d-flex flex-column align-items-center gap-2 p-3 rounded-3"
									style={{ backgroundColor: `${type.color}15`, border: 'none' }}
									onClick={() => {
										setNoteType(type.value);
										setShowAddModal(true);
									}}
								>
									<Icon icon={type.icon} style={{ color: type.color, fontSize: '20px' }} />
									<span className="fw-semibold" style={{ color: type.color, fontSize: '13px' }}>{type.label}</span>
								</button>
							</div>
						))}
					</div>
				</div>

				{/* Notes List */}
				<div className="bg-white rounded-3 p-4 shadow-sm">
					<h2 className="cs_fs_18 fw-bold mb-3">Development Notes</h2>
					{notes.length === 0 ? (
						<div className="text-center py-5">
							<Icon icon="fa6-solid:note-sticky" className="cs_fs_48 mb-3 text-muted" />
							<p className="text-muted mb-3">No notes yet for {player.first_name}</p>
							<button
								className="btn rounded-pill px-4"
								style={{ backgroundColor: '#2d5a1b', color: 'white' }}
								onClick={() => setShowAddModal(true)}
							>
								Add First Note
							</button>
						</div>
					) : (
						<div className="list-group list-group-flush">
							{notes.map(note => {
								const typeConfig = getTypeConfig(note.note_type);
								return (
									<div key={note.id} className="list-group-item px-0 py-3 border-start-0 border-end-0">
										<div className="d-flex gap-3">
											<div
												className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
												style={{ width: '40px', height: '40px', backgroundColor: `${typeConfig.color}15` }}
											>
												<Icon icon={typeConfig.icon} style={{ color: typeConfig.color }} />
											</div>
											<div className="flex-grow-1">
												<div className="d-flex align-items-center justify-content-between mb-1">
													<span className="badge rounded-pill" style={{ backgroundColor: `${typeConfig.color}15`, color: typeConfig.color, fontSize: '11px' }}>
														{typeConfig.label}
													</span>
													<div className="d-flex align-items-center gap-2">
														<span className="text-muted" style={{ fontSize: '12px' }}>{formatDate(note.created_at)}</span>
														<button
															className="btn btn-link text-danger p-0"
															onClick={() => deleteNote(note.id)}
															title="Delete note"
														>
															<Icon icon="fa6-solid:trash" style={{ fontSize: '14px' }} />
														</button>
													</div>
												</div>
												<p className="mb-0" style={{ fontSize: '14px', whiteSpace: 'pre-wrap' }}>{note.content}</p>
											</div>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>
			</main>

			{/* Add Modal */}
			{showAddModal && (
				<div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setShowAddModal(false)}>
					<div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
						<div className="modal-content rounded-4">
							<div className="modal-header border-0 pb-0">
								<h5 className="modal-title fw-bold">Add Note for {player.first_name}</h5>
								<button type="button" className="btn-close" onClick={() => setShowAddModal(false)} />
							</div>
							<div className="modal-body">
								{/* Note Type */}
								<div className="mb-3">
									<label className="form-label fw-semibold">Type</label>
									<div className="d-flex gap-2 flex-wrap">
										{NOTE_TYPES.map(type => (
											<button
												key={type.value}
												className="btn btn-sm rounded-pill px-3"
												style={{
													backgroundColor: noteType === type.value ? type.color : `${type.color}15`,
													color: noteType === type.value ? 'white' : type.color,
													border: 'none'
												}}
												onClick={() => setNoteType(type.value)}
											>
												<Icon icon={type.icon} className="me-1" />
												{type.label}
											</button>
										))}
									</div>
								</div>

								{/* Content */}
								<div className="mb-3">
									<label className="form-label fw-semibold">Note</label>
									<textarea
										className="form-control rounded-3"
										rows={4}
										placeholder="Write your observation..."
										value={content}
										onChange={e => setContent(e.target.value)}
									/>
								</div>
							</div>
							<div className="modal-footer border-0 pt-0">
								<button className="btn btn-secondary rounded-pill" onClick={() => setShowAddModal(false)}>Cancel</button>
								<button
									className="btn rounded-pill px-4"
									style={{ backgroundColor: '#2d5a1b', color: 'white' }}
									disabled={!content.trim() || saving}
									onClick={saveNote}
								>
									{saving ? "Saving..." : "Save Note"}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default PlayerNotes;
