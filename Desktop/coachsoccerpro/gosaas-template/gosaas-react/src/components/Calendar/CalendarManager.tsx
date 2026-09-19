import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { supabase } from "../../lib/supabase";
import { celebrate } from "../../utils/celebrate";

interface Event {
	id: string;
	title: string;
	event_type: string;
	start_time: string;
	end_time: string;
	location_name: string;
	location_address: string;
	opponent: string;
	home_away: string;
	description: string;
}

const EVENT_TYPES = [
	{ value: "practice", label: "Practice", icon: "fa6-solid:whistle", color: "#2d5a1b" },
	{ value: "game", label: "Game", icon: "fa6-solid:futbol", color: "#c53030" },
	{ value: "tournament", label: "Tournament", icon: "fa6-solid:trophy", color: "#dd6b20" },
	{ value: "meeting", label: "Meeting", icon: "fa6-solid:users", color: "#2b6cb0" },
];

const CalendarManager = () => {
	const navigate = useNavigate();
	const [loading, setLoading] = useState(true);
	const [teamId, setTeamId] = useState<string | null>(null);
	const [events, setEvents] = useState<Event[]>([]);
	const [showModal, setShowModal] = useState(false);
	const [saving, setSaving] = useState(false);
	const [editingEvent, setEditingEvent] = useState<Event | null>(null);

	// Form state
	const [title, setTitle] = useState("");
	const [eventType, setEventType] = useState("practice");
	const [startDate, setStartDate] = useState("");
	const [startTime, setStartTime] = useState("");
	const [endTime, setEndTime] = useState("");
	const [locationName, setLocationName] = useState("");
	const [locationAddress, setLocationAddress] = useState("");
	const [opponent, setOpponent] = useState("");
	const [homeAway, setHomeAway] = useState("home");
	const [description, setDescription] = useState("");

	useEffect(() => {
		loadEvents();
	}, []);

	const loadEvents = async () => {
		try {
			const { data: { user } } = await supabase.auth.getUser();
			if (!user) {
				navigate("/login", { replace: true });
				return;
			}

			const { data: coach } = await supabase
				.from("coaches")
				.select("team_id")
				.eq("user_id", user.id)
				.single();

			if (coach?.team_id) {
				setTeamId(coach.team_id);

				const { data: eventsData } = await supabase
					.from("events")
					.select("*")
					.eq("team_id", coach.team_id)
					.order("start_time", { ascending: true });

				if (eventsData) {
					setEvents(eventsData);
				}
			}
		} catch (err) {
			console.error("Load events error:", err);
		} finally {
			setLoading(false);
		}
	};

	const resetForm = () => {
		setTitle("");
		setEventType("practice");
		setStartDate("");
		setStartTime("");
		setEndTime("");
		setLocationName("");
		setLocationAddress("");
		setOpponent("");
		setHomeAway("home");
		setDescription("");
		setEditingEvent(null);
	};

	const openAddModal = () => {
		resetForm();
		// Default to tomorrow
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		setStartDate(tomorrow.toISOString().split('T')[0]);
		setStartTime("18:00");
		setEndTime("19:30");
		setShowModal(true);
	};

	const openEditModal = (event: Event) => {
		setEditingEvent(event);
		setTitle(event.title);
		setEventType(event.event_type);
		const start = new Date(event.start_time);
		setStartDate(start.toISOString().split('T')[0]);
		setStartTime(start.toTimeString().slice(0, 5));
		if (event.end_time) {
			const end = new Date(event.end_time);
			setEndTime(end.toTimeString().slice(0, 5));
		}
		setLocationName(event.location_name || "");
		setLocationAddress(event.location_address || "");
		setOpponent(event.opponent || "");
		setHomeAway(event.home_away || "home");
		setDescription(event.description || "");
		setShowModal(true);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!teamId) return;

		if (!title.trim()) {
			toast.error("Please enter an event title");
			return;
		}
		if (!startDate || !startTime) {
			toast.error("Please select date and time");
			return;
		}

		setSaving(true);

		try {
			const startDateTime = new Date(`${startDate}T${startTime}`).toISOString();
			const endDateTime = endTime ? new Date(`${startDate}T${endTime}`).toISOString() : null;

			const eventData = {
				team_id: teamId,
				title: title.trim(),
				event_type: eventType,
				start_time: startDateTime,
				end_time: endDateTime,
				location_name: locationName.trim() || null,
				location_address: locationAddress.trim() || null,
				opponent: opponent.trim() || null,
				home_away: eventType === "game" ? homeAway : null,
				description: description.trim() || null,
			};

			if (editingEvent) {
				const { error } = await supabase
					.from("events")
					.update(eventData)
					.eq("id", editingEvent.id);
				if (error) throw error;
				toast.success("Event updated!");
			} else {
				const { error } = await supabase
					.from("events")
					.insert(eventData);
				if (error) throw error;
				toast.success("Event created!");
				celebrate();
			}

			setShowModal(false);
			resetForm();
			loadEvents();

		} catch (err: any) {
			console.error("Save event error:", err);
			toast.error(err.message || "Failed to save event");
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async (event: Event) => {
		if (!confirm(`Delete "${event.title}"? This cannot be undone.`)) return;

		try {
			const { error } = await supabase
				.from("events")
				.delete()
				.eq("id", event.id);
			if (error) throw error;
			toast.success("Event deleted");
			loadEvents();
		} catch (err: any) {
			toast.error(err.message || "Failed to delete event");
		}
	};

	const formatDate = (dateStr: string) => {
		const date = new Date(dateStr);
		const today = new Date();
		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);

		if (date.toDateString() === today.toDateString()) {
			return "Today";
		} else if (date.toDateString() === tomorrow.toDateString()) {
			return "Tomorrow";
		} else {
			return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
		}
	};

	const formatTime = (dateStr: string) => {
		return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	};

	const getEventStyle = (type: string) => {
		const eventType = EVENT_TYPES.find(t => t.value === type);
		return eventType || EVENT_TYPES[0];
	};

	const groupEventsByDate = () => {
		const groups: { [key: string]: Event[] } = {};
		events.forEach(event => {
			const dateKey = new Date(event.start_time).toDateString();
			if (!groups[dateKey]) {
				groups[dateKey] = [];
			}
			groups[dateKey].push(event);
		});
		return groups;
	};

	const upcomingEvents = events.filter(e => new Date(e.start_time) >= new Date());
	const pastEvents = events.filter(e => new Date(e.start_time) < new Date());

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
								<h1 className="cs_fs_20 mb-0 fw-bold">Calendar</h1>
								<span className="opacity-75" style={{ fontSize: '14px' }}>Schedule & Events</span>
							</div>
						</div>
						<button onClick={openAddModal} className="btn btn-light btn-sm rounded-pill px-3 d-flex align-items-center gap-2">
							<Icon icon="fa6-solid:plus" />
							New Event
						</button>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main className="container py-4">
				{events.length === 0 ? (
					<div className="bg-white rounded-3 p-5 text-center shadow-sm">
						<Icon icon="fa6-solid:calendar-plus" className="cs_fs_48 mb-3" style={{ color: '#cbd5e0' }} />
						<h2 className="cs_fs_20 fw-bold mb-2">No events scheduled</h2>
						<p className="text-muted mb-4">Create your first practice, game, or meeting</p>
						<button onClick={openAddModal} className="btn rounded-pill px-4" style={{ backgroundColor: '#2d5a1b', color: 'white' }}>
							<Icon icon="fa6-solid:plus" className="me-2" />
							Create Event
						</button>
					</div>
				) : (
					<>
						{/* Upcoming Events */}
						{upcomingEvents.length > 0 && (
							<div className="mb-4">
								<h2 className="cs_fs_18 fw-bold mb-3">Upcoming</h2>
								<div className="d-flex flex-column gap-2">
									{upcomingEvents.map(event => {
										const style = getEventStyle(event.event_type);
										return (
											<div key={event.id} className="bg-white rounded-3 p-3 shadow-sm">
												<div className="d-flex align-items-center gap-3">
													<div
														className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
														style={{ width: '48px', height: '48px', backgroundColor: `${style.color}15` }}
													>
														<Icon icon={style.icon} style={{ color: style.color, fontSize: '20px' }} />
													</div>
													<div className="flex-grow-1">
														<div className="d-flex align-items-center gap-2 mb-1">
															<span className="fw-bold">{event.title}</span>
															{event.event_type === "game" && event.opponent && (
																<span className="badge bg-secondary">{event.home_away === "home" ? "vs" : "@"} {event.opponent}</span>
															)}
														</div>
														<div className="text-muted" style={{ fontSize: '13px' }}>
															{formatDate(event.start_time)} at {formatTime(event.start_time)}
															{event.location_name && ` • ${event.location_name}`}
														</div>
													</div>
													<div className="d-flex gap-2">
														<Link to={`/attendance/${event.id}`} className="btn btn-sm rounded-pill px-3" style={{ backgroundColor: '#2d5a1b', color: 'white' }}>
															<Icon icon="fa6-solid:clipboard-check" className="me-1" />
															Attendance
														</Link>
														<button onClick={() => openEditModal(event)} className="btn btn-sm btn-outline-secondary rounded-pill">
															<Icon icon="fa6-solid:pen" />
														</button>
														<button onClick={() => handleDelete(event)} className="btn btn-sm btn-outline-danger rounded-pill">
															<Icon icon="fa6-solid:trash" />
														</button>
													</div>
												</div>
											</div>
										);
									})}
								</div>
							</div>
						)}

						{/* Past Events */}
						{pastEvents.length > 0 && (
							<div>
								<h2 className="cs_fs_18 fw-bold mb-3 text-muted">Past Events</h2>
								<div className="d-flex flex-column gap-2">
									{pastEvents.slice(0, 5).map(event => {
										const style = getEventStyle(event.event_type);
										return (
											<div key={event.id} className="bg-white rounded-3 p-3 shadow-sm" style={{ opacity: 0.6 }}>
												<div className="d-flex align-items-center gap-3">
													<div
														className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
														style={{ width: '40px', height: '40px', backgroundColor: `${style.color}15` }}
													>
														<Icon icon={style.icon} style={{ color: style.color, fontSize: '16px' }} />
													</div>
													<div className="flex-grow-1">
														<div className="fw-semibold" style={{ fontSize: '14px' }}>{event.title}</div>
														<div className="text-muted" style={{ fontSize: '12px' }}>
															{formatDate(event.start_time)}
														</div>
													</div>
												</div>
											</div>
										);
									})}
								</div>
							</div>
						)}
					</>
				)}
			</main>

			{/* Add/Edit Modal */}
			{showModal && (
				<div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setShowModal(false)}>
					<div className="modal-dialog modal-dialog-centered modal-lg" onClick={e => e.stopPropagation()}>
						<div className="modal-content rounded-4">
							<div className="modal-header border-0 pb-0">
								<h5 className="modal-title fw-bold">{editingEvent ? "Edit Event" : "New Event"}</h5>
								<button type="button" className="btn-close" onClick={() => setShowModal(false)} />
							</div>
							<form onSubmit={handleSubmit}>
								<div className="modal-body">
									<div className="row g-3">
										{/* Event Type */}
										<div className="col-12">
											<label className="form-label small fw-semibold">Event Type</label>
											<div className="d-flex gap-2 flex-wrap">
												{EVENT_TYPES.map(type => (
													<button
														key={type.value}
														type="button"
														onClick={() => setEventType(type.value)}
														className={`btn rounded-pill px-3 ${eventType === type.value ? 'text-white' : 'btn-outline-secondary'}`}
														style={eventType === type.value ? { backgroundColor: type.color } : {}}
													>
														<Icon icon={type.icon} className="me-2" />
														{type.label}
													</button>
												))}
											</div>
										</div>

										{/* Title */}
										<div className="col-12">
											<label className="form-label small fw-semibold">Title *</label>
											<input
												type="text"
												className="form-control rounded-pill"
												placeholder={eventType === "practice" ? "e.g., Weekly Practice" : eventType === "game" ? "e.g., League Match" : "Event title"}
												value={title}
												onChange={e => setTitle(e.target.value)}
												required
											/>
										</div>

										{/* Game specific fields */}
										{eventType === "game" && (
											<>
												<div className="col-8">
													<label className="form-label small fw-semibold">Opponent</label>
													<input
														type="text"
														className="form-control rounded-pill"
														placeholder="Team name"
														value={opponent}
														onChange={e => setOpponent(e.target.value)}
													/>
												</div>
												<div className="col-4">
													<label className="form-label small fw-semibold">Home/Away</label>
													<select
														className="form-select rounded-pill"
														value={homeAway}
														onChange={e => setHomeAway(e.target.value)}
													>
														<option value="home">Home</option>
														<option value="away">Away</option>
													</select>
												</div>
											</>
										)}

										{/* Date & Time */}
										<div className="col-4">
											<label className="form-label small fw-semibold">Date *</label>
											<input
												type="date"
												className="form-control rounded-pill"
												value={startDate}
												onChange={e => setStartDate(e.target.value)}
												required
											/>
										</div>
										<div className="col-4">
											<label className="form-label small fw-semibold">Start Time *</label>
											<input
												type="time"
												className="form-control rounded-pill"
												value={startTime}
												onChange={e => setStartTime(e.target.value)}
												required
											/>
										</div>
										<div className="col-4">
											<label className="form-label small fw-semibold">End Time</label>
											<input
												type="time"
												className="form-control rounded-pill"
												value={endTime}
												onChange={e => setEndTime(e.target.value)}
											/>
										</div>

										{/* Location */}
										<div className="col-6">
											<label className="form-label small fw-semibold">Location Name</label>
											<input
												type="text"
												className="form-control rounded-pill"
												placeholder="e.g., Central Park Field"
												value={locationName}
												onChange={e => setLocationName(e.target.value)}
											/>
										</div>
										<div className="col-6">
											<label className="form-label small fw-semibold">Address</label>
											<input
												type="text"
												className="form-control rounded-pill"
												placeholder="Full address"
												value={locationAddress}
												onChange={e => setLocationAddress(e.target.value)}
											/>
										</div>

										{/* Notes */}
										<div className="col-12">
											<label className="form-label small fw-semibold">Notes</label>
											<textarea
												className="form-control rounded-3"
												rows={2}
												placeholder="Any additional details..."
												value={description}
												onChange={e => setDescription(e.target.value)}
											/>
										</div>
									</div>
								</div>
								<div className="modal-footer border-0 pt-0">
									<button type="button" className="btn btn-secondary rounded-pill" onClick={() => setShowModal(false)}>
										Cancel
									</button>
									<button type="submit" className="btn rounded-pill px-4" style={{ backgroundColor: '#2d5a1b', color: 'white' }} disabled={saving}>
										{saving ? "Saving..." : editingEvent ? "Update Event" : "Create Event"}
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

export default CalendarManager;
