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
	nickname: string | null;
	dob: string | null;
	position: string | null;
	jersey_number: number | null;
	photo_url: string | null;
	card_frame: string;
	total_points: number;
}

interface Team {
	id: string;
	name: string;
	primary_color: string;
}

const POSITIONS = [
	"Goalkeeper",
	"Defender",
	"Left Back",
	"Right Back",
	"Center Back",
	"Midfielder",
	"Defensive Mid",
	"Attacking Mid",
	"Left Wing",
	"Right Wing",
	"Forward",
	"Striker"
];

const RosterManager = () => {
	const navigate = useNavigate();
	const [loading, setLoading] = useState(true);
	const [team, setTeam] = useState<Team | null>(null);
	const [players, setPlayers] = useState<Player[]>([]);
	const [showAddModal, setShowAddModal] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
	const [saving, setSaving] = useState(false);

	// Form state
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [nickname, setNickname] = useState("");
	const [dob, setDob] = useState("");
	const [position, setPosition] = useState("");
	const [jerseyNumber, setJerseyNumber] = useState("");
	const [photoFile, setPhotoFile] = useState<File | null>(null);
	const [photoPreview, setPhotoPreview] = useState("");

	useEffect(() => {
		loadRoster();
	}, []);

	const loadRoster = async () => {
		try {
			const { data: { user } } = await supabase.auth.getUser();
			if (!user) {
				navigate("/login");
				return;
			}

			const { data: coach } = await supabase
				.from("coaches")
				.select("team_id")
				.eq("user_id", user.id)
				.single();

			if (!coach?.team_id) {
				navigate("/onboarding");
				return;
			}

			const { data: teamData } = await supabase
				.from("teams")
				.select("*")
				.eq("id", coach.team_id)
				.single();

			if (teamData) {
				setTeam(teamData);

				const { data: playersData } = await supabase
					.from("players")
					.select("*")
					.eq("team_id", teamData.id)
					.order("jersey_number", { ascending: true, nullsFirst: false })
					.order("first_name", { ascending: true });

				if (playersData) {
					setPlayers(playersData);
				}
			}
		} catch (err) {
			console.error("Load roster error:", err);
			toast.error("Failed to load roster");
		} finally {
			setLoading(false);
		}
	};

	const resetForm = () => {
		setFirstName("");
		setLastName("");
		setNickname("");
		setDob("");
		setPosition("");
		setJerseyNumber("");
		setPhotoFile(null);
		setPhotoPreview("");
	};

	const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			if (file.size > 5 * 1024 * 1024) {
				toast.error("Photo must be under 5MB");
				return;
			}
			setPhotoFile(file);
			setPhotoPreview(URL.createObjectURL(file));
		}
	};

	const handleAddPlayer = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!team) return;

		if (!firstName.trim() || !lastName.trim()) {
			toast.error("First and last name are required");
			return;
		}

		setSaving(true);

		try {
			let photoUrl = null;

			if (photoFile) {
				const fileExt = photoFile.name.split('.').pop();
				const fileName = `${team.id}-${Date.now()}.${fileExt}`;
				const filePath = `player-photos/${fileName}`;

				const { error: uploadError } = await supabase.storage
					.from("avatars")
					.upload(filePath, photoFile);

				if (uploadError) throw uploadError;

				const { data: { publicUrl } } = supabase.storage
					.from("avatars")
					.getPublicUrl(filePath);

				photoUrl = publicUrl;
			}

			const { error } = await supabase.from("players").insert({
				team_id: team.id,
				first_name: firstName.trim(),
				last_name: lastName.trim(),
				nickname: nickname.trim() || null,
				dob: dob || null,
				position: position || null,
				jersey_number: jerseyNumber ? parseInt(jerseyNumber) : null,
				photo_url: photoUrl,
				card_frame: "bronze",
				total_points: 0
			});

			if (error) throw error;

			toast.success("Player added!");
			celebrate();
			setShowAddModal(false);
			resetForm();
			loadRoster();

		} catch (err: any) {
			console.error("Add player error:", err);
			toast.error(err.message || "Failed to add player");
		} finally {
			setSaving(false);
		}
	};

	const openEditModal = (player: Player) => {
		setEditingPlayer(player);
		setFirstName(player.first_name);
		setLastName(player.last_name);
		setNickname(player.nickname || "");
		setDob(player.dob || "");
		setPosition(player.position || "");
		setJerseyNumber(player.jersey_number?.toString() || "");
		setPhotoPreview(player.photo_url || "");
		setShowEditModal(true);
	};

	const handleEditPlayer = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!editingPlayer) return;

		if (!firstName.trim() || !lastName.trim()) {
			toast.error("First and last name are required");
			return;
		}

		setSaving(true);

		try {
			let photoUrl = editingPlayer.photo_url;

			if (photoFile) {
				const fileExt = photoFile.name.split('.').pop();
				const fileName = `${team?.id}-${Date.now()}.${fileExt}`;
				const filePath = `player-photos/${fileName}`;

				const { error: uploadError } = await supabase.storage
					.from("avatars")
					.upload(filePath, photoFile);

				if (uploadError) throw uploadError;

				const { data: { publicUrl } } = supabase.storage
					.from("avatars")
					.getPublicUrl(filePath);

				photoUrl = publicUrl;
			}

			const { error } = await supabase
				.from("players")
				.update({
					first_name: firstName.trim(),
					last_name: lastName.trim(),
					nickname: nickname.trim() || null,
					dob: dob || null,
					position: position || null,
					jersey_number: jerseyNumber ? parseInt(jerseyNumber) : null,
					photo_url: photoUrl
				})
				.eq("id", editingPlayer.id);

			if (error) throw error;

			toast.success("Player updated!");
			setShowEditModal(false);
			setEditingPlayer(null);
			resetForm();
			loadRoster();

		} catch (err: any) {
			console.error("Edit player error:", err);
			toast.error(err.message || "Failed to update player");
		} finally {
			setSaving(false);
		}
	};

	const handleDeletePlayer = async (player: Player) => {
		if (!confirm(`Delete ${player.first_name} ${player.last_name}? This cannot be undone.`)) {
			return;
		}

		try {
			const { error } = await supabase
				.from("players")
				.delete()
				.eq("id", player.id);

			if (error) throw error;

			toast.success("Player removed");
			loadRoster();

		} catch (err: any) {
			console.error("Delete player error:", err);
			toast.error(err.message || "Failed to delete player");
		}
	};

	const getFrameColor = (frame: string) => {
		switch (frame) {
			case "bronze": return "#cd7f32";
			case "silver": return "#c0c0c0";
			case "gold": return "#ffd700";
			case "platinum": return "#e5e4e2";
			default: return "#cd7f32";
		}
	};

	const calculateAge = (dobStr: string) => {
		const dob = new Date(dobStr);
		const today = new Date();
		let age = today.getFullYear() - dob.getFullYear();
		const monthDiff = today.getMonth() - dob.getMonth();
		if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
			age--;
		}
		return age;
	};

	if (loading) {
		return (
			<div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
				<div className="text-center">
					<Icon icon="eos-icons:loading" className="cs_fs_48 mb-3" style={{ color: '#2d5a1b' }} />
					<p>Loading roster...</p>
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
							<button
								onClick={() => navigate("/dashboard")}
								className="btn btn-link text-white p-0"
							>
								<Icon icon="fa6-solid:arrow-left" className="cs_fs_20" />
							</button>
							<div className="text-white">
								<h1 className="cs_fs_20 mb-0 fw-bold">Team Roster</h1>
								<span className="opacity-75" style={{ fontSize: '14px' }}>{team?.name}</span>
							</div>
						</div>
						<button
							onClick={() => { resetForm(); setShowAddModal(true); }}
							className="btn btn-light btn-sm rounded-pill px-3 d-flex align-items-center gap-2"
						>
							<Icon icon="fa6-solid:plus" />
							Add Player
						</button>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main className="container py-4">
				{players.length === 0 ? (
					<div className="bg-white rounded-3 p-5 text-center shadow-sm">
						<Icon icon="fa6-solid:users" className="cs_fs_48 mb-3" style={{ color: '#cbd5e0' }} />
						<h2 className="cs_fs_20 fw-bold mb-2">No players yet</h2>
						<p className="text-muted mb-4">Add your first player to get started</p>
						<button
							onClick={() => { resetForm(); setShowAddModal(true); }}
							className="btn rounded-pill px-4"
							style={{ backgroundColor: '#2d5a1b', color: 'white' }}
						>
							<Icon icon="fa6-solid:plus" className="me-2" />
							Add First Player
						</button>
					</div>
				) : (
					<div className="row g-3">
						{players.map((player) => (
							<div key={player.id} className="col-6 col-md-4 col-lg-3">
								<div className="bg-white rounded-3 p-3 h-100 shadow-sm">
									<div className="text-center mb-3">
										<div
											className="mx-auto rounded-circle d-flex align-items-center justify-content-center position-relative"
											style={{
												width: '80px',
												height: '80px',
												border: `4px solid ${getFrameColor(player.card_frame)}`,
												backgroundColor: player.photo_url ? 'transparent' : '#e2e8f0'
											}}
										>
											{player.photo_url ? (
												<img
													src={player.photo_url}
													alt={player.first_name}
													className="rounded-circle"
													style={{ width: '100%', height: '100%', objectFit: 'cover' }}
												/>
											) : (
												<Icon icon="fa6-solid:user" style={{ color: '#a0aec0', fontSize: '32px' }} />
											)}
											{player.jersey_number && (
												<div
													className="position-absolute rounded-circle d-flex align-items-center justify-content-center fw-bold"
													style={{
														width: '28px',
														height: '28px',
														backgroundColor: team?.primary_color || '#2d5a1b',
														color: 'white',
														fontSize: '12px',
														bottom: '-4px',
														right: '-4px',
														border: '2px solid white'
													}}
												>
													{player.jersey_number}
												</div>
											)}
										</div>
									</div>

									<div className="text-center mb-3">
										<h3 className="cs_fs_16 fw-bold mb-0">
											{player.nickname || player.first_name}
										</h3>
										{player.nickname && (
											<div className="text-muted" style={{ fontSize: '13px' }}>
												{player.first_name} {player.last_name}
											</div>
										)}
										{!player.nickname && (
											<div className="text-muted" style={{ fontSize: '13px' }}>
												{player.last_name}
											</div>
										)}
									</div>

									<div className="d-flex flex-wrap justify-content-center gap-1 mb-3">
										{player.position && (
											<span
												className="badge rounded-pill"
												style={{ backgroundColor: '#e2e8f0', color: '#4a5568', fontSize: '11px' }}
											>
												{player.position}
											</span>
										)}
										{player.dob && (
											<span
												className="badge rounded-pill"
												style={{ backgroundColor: '#e2e8f0', color: '#4a5568', fontSize: '11px' }}
											>
												Age {calculateAge(player.dob)}
											</span>
										)}
									</div>

									<div className="text-center mb-3">
										<div className="fw-bold" style={{ color: '#2d5a1b', fontSize: '18px' }}>
											{player.total_points}
										</div>
										<div className="text-muted" style={{ fontSize: '12px' }}>points</div>
									</div>

									<div className="d-flex gap-2 mb-2">
										<button
											onClick={() => navigate(`/player/${player.id}/notes`)}
											className="btn btn-sm flex-grow-1 rounded-pill"
											style={{ backgroundColor: '#2d5a1b15', color: '#2d5a1b' }}
										>
											<Icon icon="fa6-solid:note-sticky" className="me-1" />
											Notes
										</button>
									</div>
									<div className="d-flex gap-2">
										<button
											onClick={() => openEditModal(player)}
											className="btn btn-sm btn-outline-secondary flex-grow-1 rounded-pill"
										>
											<Icon icon="fa6-solid:pen" className="me-1" />
											Edit
										</button>
										<button
											onClick={() => handleDeletePlayer(player)}
											className="btn btn-sm btn-outline-danger rounded-pill px-3"
										>
											<Icon icon="fa6-solid:trash" />
										</button>
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</main>

			{/* Add Player Modal */}
			{showAddModal && (
				<div
					className="modal d-block"
					style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
					onClick={() => setShowAddModal(false)}
				>
					<div
						className="modal-dialog modal-dialog-centered"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="modal-content rounded-4">
							<div className="modal-header border-0 pb-0">
								<h5 className="modal-title fw-bold">Add Player</h5>
								<button
									type="button"
									className="btn-close"
									onClick={() => setShowAddModal(false)}
								/>
							</div>
							<form onSubmit={handleAddPlayer}>
								<div className="modal-body">
									<div className="row g-3">
										<div className="col-6">
											<label className="form-label small fw-semibold">First Name *</label>
											<input
												type="text"
												className="form-control rounded-pill"
												value={firstName}
												onChange={(e) => setFirstName(e.target.value)}
												required
											/>
										</div>
										<div className="col-6">
											<label className="form-label small fw-semibold">Last Name *</label>
											<input
												type="text"
												className="form-control rounded-pill"
												value={lastName}
												onChange={(e) => setLastName(e.target.value)}
												required
											/>
										</div>
										<div className="col-6">
											<label className="form-label small fw-semibold">Nickname</label>
											<input
												type="text"
												className="form-control rounded-pill"
												placeholder="Optional"
												value={nickname}
												onChange={(e) => setNickname(e.target.value)}
											/>
										</div>
										<div className="col-6">
											<label className="form-label small fw-semibold">Jersey #</label>
											<input
												type="number"
												className="form-control rounded-pill"
												min="0"
												max="99"
												value={jerseyNumber}
												onChange={(e) => setJerseyNumber(e.target.value)}
											/>
										</div>
										<div className="col-6">
											<label className="form-label small fw-semibold">Date of Birth</label>
											<input
												type="date"
												className="form-control rounded-pill"
												value={dob}
												onChange={(e) => setDob(e.target.value)}
											/>
										</div>
										<div className="col-6">
											<label className="form-label small fw-semibold">Position</label>
											<select
												className="form-select rounded-pill"
												value={position}
												onChange={(e) => setPosition(e.target.value)}
											>
												<option value="">Select...</option>
												{POSITIONS.map((pos) => (
													<option key={pos} value={pos}>{pos}</option>
												))}
											</select>
										</div>
										<div className="col-12">
											<label className="form-label small fw-semibold">Photo</label>
											<div
												className="border rounded-3 p-3 text-center"
												style={{ borderStyle: 'dashed', cursor: 'pointer' }}
												onClick={() => document.getElementById('playerPhoto')?.click()}
											>
												{photoPreview ? (
													<img
														src={photoPreview}
														alt="Preview"
														style={{ maxHeight: '100px', borderRadius: '50%' }}
													/>
												) : (
													<>
														<Icon icon="fa6-solid:camera" className="text-muted cs_fs_24 mb-1" />
														<div className="text-muted small">Click to upload</div>
													</>
												)}
												<input
													id="playerPhoto"
													type="file"
													accept="image/*"
													className="d-none"
													onChange={handlePhotoChange}
												/>
											</div>
										</div>
									</div>
								</div>
								<div className="modal-footer border-0 pt-0">
									<button
										type="button"
										className="btn btn-secondary rounded-pill"
										onClick={() => setShowAddModal(false)}
									>
										Cancel
									</button>
									<button
										type="submit"
										className="btn rounded-pill px-4"
										style={{ backgroundColor: '#2d5a1b', color: 'white' }}
										disabled={saving}
									>
										{saving ? "Adding..." : "Add Player"}
									</button>
								</div>
							</form>
						</div>
					</div>
				</div>
			)}

			{/* Edit Player Modal */}
			{showEditModal && editingPlayer && (
				<div
					className="modal d-block"
					style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
					onClick={() => setShowEditModal(false)}
				>
					<div
						className="modal-dialog modal-dialog-centered"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="modal-content rounded-4">
							<div className="modal-header border-0 pb-0">
								<h5 className="modal-title fw-bold">Edit Player</h5>
								<button
									type="button"
									className="btn-close"
									onClick={() => setShowEditModal(false)}
								/>
							</div>
							<form onSubmit={handleEditPlayer}>
								<div className="modal-body">
									<div className="row g-3">
										<div className="col-6">
											<label className="form-label small fw-semibold">First Name *</label>
											<input
												type="text"
												className="form-control rounded-pill"
												value={firstName}
												onChange={(e) => setFirstName(e.target.value)}
												required
											/>
										</div>
										<div className="col-6">
											<label className="form-label small fw-semibold">Last Name *</label>
											<input
												type="text"
												className="form-control rounded-pill"
												value={lastName}
												onChange={(e) => setLastName(e.target.value)}
												required
											/>
										</div>
										<div className="col-6">
											<label className="form-label small fw-semibold">Nickname</label>
											<input
												type="text"
												className="form-control rounded-pill"
												placeholder="Optional"
												value={nickname}
												onChange={(e) => setNickname(e.target.value)}
											/>
										</div>
										<div className="col-6">
											<label className="form-label small fw-semibold">Jersey #</label>
											<input
												type="number"
												className="form-control rounded-pill"
												min="0"
												max="99"
												value={jerseyNumber}
												onChange={(e) => setJerseyNumber(e.target.value)}
											/>
										</div>
										<div className="col-6">
											<label className="form-label small fw-semibold">Date of Birth</label>
											<input
												type="date"
												className="form-control rounded-pill"
												value={dob}
												onChange={(e) => setDob(e.target.value)}
											/>
										</div>
										<div className="col-6">
											<label className="form-label small fw-semibold">Position</label>
											<select
												className="form-select rounded-pill"
												value={position}
												onChange={(e) => setPosition(e.target.value)}
											>
												<option value="">Select...</option>
												{POSITIONS.map((pos) => (
													<option key={pos} value={pos}>{pos}</option>
												))}
											</select>
										</div>
										<div className="col-12">
											<label className="form-label small fw-semibold">Photo</label>
											<div
												className="border rounded-3 p-3 text-center"
												style={{ borderStyle: 'dashed', cursor: 'pointer' }}
												onClick={() => document.getElementById('editPlayerPhoto')?.click()}
											>
												{photoPreview ? (
													<img
														src={photoPreview}
														alt="Preview"
														style={{ maxHeight: '100px', borderRadius: '50%' }}
													/>
												) : (
													<>
														<Icon icon="fa6-solid:camera" className="text-muted cs_fs_24 mb-1" />
														<div className="text-muted small">Click to upload</div>
													</>
												)}
												<input
													id="editPlayerPhoto"
													type="file"
													accept="image/*"
													className="d-none"
													onChange={handlePhotoChange}
												/>
											</div>
										</div>
									</div>
								</div>
								<div className="modal-footer border-0 pt-0">
									<button
										type="button"
										className="btn btn-secondary rounded-pill"
										onClick={() => setShowEditModal(false)}
									>
										Cancel
									</button>
									<button
										type="submit"
										className="btn rounded-pill px-4"
										style={{ backgroundColor: '#2d5a1b', color: 'white' }}
										disabled={saving}
									>
										{saving ? "Saving..." : "Save Changes"}
									</button>
								</div>
							</form>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default RosterManager;
