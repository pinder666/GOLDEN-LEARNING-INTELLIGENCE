import { Icon } from "@iconify/react";
import { FormEvent, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { supabase } from "../../lib/supabase";

const AGE_GROUPS = [
	"U6", "U7", "U8", "U9", "U10", "U11", "U12",
	"U13", "U14", "U15", "U16", "U17", "U18", "U19", "Adult"
];

const TEAM_COLORS = [
	{ name: "Forest Green", value: "#2d5a1b" },
	{ name: "Navy Blue", value: "#1a365d" },
	{ name: "Red", value: "#c53030" },
	{ name: "Royal Blue", value: "#2b6cb0" },
	{ name: "Orange", value: "#dd6b20" },
	{ name: "Purple", value: "#6b46c1" },
	{ name: "Black", value: "#1a202c" },
	{ name: "Maroon", value: "#742a2a" },
];

const Onboarding = () => {
	const navigate = useNavigate();
	const [step, setStep] = useState<number>(1);
	const [loading, setLoading] = useState<boolean>(false);
	const [checkingAuth, setCheckingAuth] = useState<boolean>(true);
	const [coachId, setCoachId] = useState<string | null>(null);

	// Step 1: Team basics
	const [teamName, setTeamName] = useState<string>("");
	const [ageGroup, setAgeGroup] = useState<string>("");

	// Step 2: Team branding
	const [primaryColor, setPrimaryColor] = useState<string>("#2d5a1b");
	const [logoFile, setLogoFile] = useState<File | null>(null);
	const [logoPreview, setLogoPreview] = useState<string>("");

	useEffect(() => {
		checkAuth();
	}, []);

	const checkAuth = async () => {
		try {
			const { data: { user } } = await supabase.auth.getUser();

			if (!user) {
				navigate("/login", { replace: true });
				return;
			}

			// Get coach record - if not found, just proceed (they can still create team)
			const { data: coach } = await supabase
				.from("coaches")
				.select("id, onboarding_complete")
				.eq("user_id", user.id)
				.single();

			if (coach) {
				if (coach.onboarding_complete) {
					navigate("/dashboard", { replace: true });
					return;
				}
				setCoachId(coach.id);
			}
			// If no coach record, just show the form - they might have registered differently
		} catch (err) {
			console.error("Auth check error:", err);
		} finally {
			setCheckingAuth(false);
		}
	};

	const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			if (file.size > 5 * 1024 * 1024) {
				toast.error("Logo must be under 5MB");
				return;
			}
			setLogoFile(file);
			setLogoPreview(URL.createObjectURL(file));
		}
	};

	const handleStep1Submit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!teamName.trim()) {
			toast.error("Please enter your team name");
			return;
		}
		if (!ageGroup) {
			toast.error("Please select an age group");
			return;
		}
		setStep(2);
	};

	const handleFinalSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setLoading(true);

		try {
			const { data: { user } } = await supabase.auth.getUser();
			if (!user) throw new Error("Not logged in");

			let currentCoachId = coachId;

			// Create coach record if it doesn't exist
			if (!currentCoachId) {
				const { data: newCoach, error: createCoachError } = await supabase
					.from("coaches")
					.insert({
						user_id: user.id,
						first_name: user.user_metadata?.first_name || "",
						last_name: user.user_metadata?.last_name || "",
						subscription_plan: "grassroots",
						onboarding_complete: false,
					})
					.select()
					.single();

				if (createCoachError) throw createCoachError;
				currentCoachId = newCoach.id;
			}

			let logoUrl = null;

			// Upload logo if provided
			if (logoFile) {
				const fileExt = logoFile.name.split('.').pop();
				const fileName = `${currentCoachId}-${Date.now()}.${fileExt}`;
				const filePath = `team-logos/${fileName}`;

				const { error: uploadError } = await supabase.storage
					.from("avatars")
					.upload(filePath, logoFile);

				if (uploadError) throw uploadError;

				const { data: { publicUrl } } = supabase.storage
					.from("avatars")
					.getPublicUrl(filePath);

				logoUrl = publicUrl;
			}

			// Create team
			const { data: team, error: teamError } = await supabase
				.from("teams")
				.insert({
					coach_id: currentCoachId,
					name: teamName.trim(),
					age_group: ageGroup,
					primary_color: primaryColor,
					secondary_color: "#ffffff",
					logo_url: logoUrl,
				})
				.select()
				.single();

			if (teamError) throw teamError;

			// Update coach with team_id and mark onboarding complete
			const { error: coachError } = await supabase
				.from("coaches")
				.update({
					team_id: team.id,
					onboarding_complete: true,
				})
				.eq("id", currentCoachId);

			if (coachError) throw coachError;

			toast.success("Team created! Welcome to SoccerCoachPro!");

			setTimeout(() => {
				navigate("/dashboard");
			}, 1500);

		} catch (err: any) {
			console.error("Onboarding error:", err);
			toast.error(err.message || "Failed to create team");
		} finally {
			setLoading(false);
		}
	};

	if (checkingAuth) {
		return (
			<section className="position-relative">
				<div className="cs_height_140 cs_height_lg_80" />
				<div className="container">
					<div className="cs_center">
						<div className="cs_register_form_wrapper cs_white_bg cs_radius_30 position-relative z-1 text-center">
							<Icon icon="eos-icons:loading" className="cs_fs_48" />
							<p className="mt-3">Loading...</p>
						</div>
					</div>
				</div>
				<div className="cs_height_140 cs_height_lg_80" />
			</section>
		);
	}

	return (
		<section className="position-relative">
			<div className="cs_height_140 cs_height_lg_80" />
			<div className="container">
				<div className="cs_center">
					<div className="cs_register_form_wrapper cs_white_bg cs_radius_30 position-relative z-1">
						{/* Progress indicator */}
						<div className="d-flex justify-content-center mb-4">
							<div className="d-flex align-items-center gap-3">
								<div
									className={`rounded-circle d-flex align-items-center justify-content-center ${step >= 1 ? 'cs_purple_bg cs_white_color' : 'bg-light'}`}
									style={{ width: '40px', height: '40px' }}
								>
									{step > 1 ? <Icon icon="fa6-solid:check" /> : "1"}
								</div>
								<div
									className={`${step >= 2 ? 'cs_purple_bg' : 'bg-light'}`}
									style={{ width: '60px', height: '4px', borderRadius: '2px' }}
								/>
								<div
									className={`rounded-circle d-flex align-items-center justify-content-center ${step >= 2 ? 'cs_purple_bg cs_white_color' : 'bg-light'}`}
									style={{ width: '40px', height: '40px' }}
								>
									2
								</div>
							</div>
						</div>

						{step === 1 && (
							<>
								<div className="cs_mb_31 text-center">
									<h2 className="cs_fs_29 cs_medium cs_mb_9">
										Let's Set Up Your Team
									</h2>
									<p className="mb-0">
										Tell us about your squad
									</p>
								</div>

								<form onSubmit={handleStep1Submit} className="cs_register_form row cs_gap_y_24 cs_mb_26">
									<div className="col-12">
										<label className="form-label fw-semibold mb-2">Team Name</label>
										<div className="position-relative">
											<Icon icon="fa6-solid:shield-halved" className="cs_input_icon" />
											<input
												type="text"
												className="cs_form_field cs_radius_30"
												placeholder="e.g., Riverside FC U12"
												value={teamName}
												onChange={(e) => setTeamName(e.target.value)}
												required
											/>
										</div>
									</div>

									<div className="col-12">
										<label className="form-label fw-semibold mb-2">Age Group</label>
										<div className="position-relative">
											<Icon icon="fa6-solid:users" className="cs_input_icon" />
											<select
												className="cs_form_field cs_radius_30"
												value={ageGroup}
												onChange={(e) => setAgeGroup(e.target.value)}
												required
												style={{ paddingLeft: '45px', appearance: 'none' }}
											>
												<option value="">Select age group...</option>
												{AGE_GROUPS.map((age) => (
													<option key={age} value={age}>{age}</option>
												))}
											</select>
											<Icon
												icon="fa6-solid:chevron-down"
												style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
											/>
										</div>
									</div>

									<div className="col-12">
										<button
											type="submit"
											className="cs_btn cs_style_1 cs_purple_bg cs_accent_hover cs_fs_16 cs_semibold cs_white_color cs_radius_30 w-100"
										>
											<span>Continue</span>
										</button>
									</div>
								</form>
							</>
						)}

						{step === 2 && (
							<>
								<div className="cs_mb_31 text-center">
									<h2 className="cs_fs_29 cs_medium cs_mb_9">
										Customize Your Team
									</h2>
									<p className="mb-0">
										Make it yours (optional)
									</p>
								</div>

								<form onSubmit={handleFinalSubmit} className="cs_register_form row cs_gap_y_24 cs_mb_26">
									<div className="col-12">
										<label className="form-label fw-semibold mb-2">Team Color</label>
										<div className="d-flex flex-wrap gap-2">
											{TEAM_COLORS.map((color) => (
												<button
													key={color.value}
													type="button"
													onClick={() => setPrimaryColor(color.value)}
													className="rounded-circle border-0 position-relative"
													style={{
														width: '48px',
														height: '48px',
														backgroundColor: color.value,
														cursor: 'pointer',
														outline: primaryColor === color.value ? '3px solid #2d5a1b' : 'none',
														outlineOffset: '2px'
													}}
													title={color.name}
												>
													{primaryColor === color.value && (
														<Icon
															icon="fa6-solid:check"
															className="text-white position-absolute"
															style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
														/>
													)}
												</button>
											))}
										</div>
									</div>

									<div className="col-12">
										<label className="form-label fw-semibold mb-2">Team Logo (optional)</label>
										<div
											className="border rounded-3 p-4 text-center position-relative"
											style={{
												borderStyle: 'dashed',
												borderColor: '#ccc',
												cursor: 'pointer',
												backgroundColor: logoPreview ? 'transparent' : '#f8f9fa'
											}}
											onClick={() => document.getElementById('logoInput')?.click()}
										>
											{logoPreview ? (
												<div className="position-relative d-inline-block">
													<img
														src={logoPreview}
														alt="Team logo preview"
														style={{ maxHeight: '120px', maxWidth: '100%', objectFit: 'contain' }}
													/>
													<button
														type="button"
														className="position-absolute top-0 end-0 btn btn-sm btn-danger rounded-circle"
														style={{ transform: 'translate(50%, -50%)' }}
														onClick={(e) => {
															e.stopPropagation();
															setLogoFile(null);
															setLogoPreview("");
														}}
													>
														<Icon icon="fa6-solid:xmark" />
													</button>
												</div>
											) : (
												<>
													<Icon icon="fa6-solid:cloud-arrow-up" className="cs_fs_36 mb-2" style={{ color: '#aaa' }} />
													<p className="mb-0 text-muted">Click to upload team logo</p>
													<small className="text-muted">PNG, JPG up to 5MB</small>
												</>
											)}
											<input
												id="logoInput"
												type="file"
												accept="image/png, image/jpeg, image/jpg"
												onChange={handleLogoChange}
												className="d-none"
											/>
										</div>
									</div>

									<div className="col-12 d-flex gap-3">
										<button
											type="button"
											onClick={() => setStep(1)}
											className="cs_btn cs_style_1 cs_fs_16 cs_semibold cs_radius_30 flex-grow-1"
											style={{ backgroundColor: '#e2e8f0', color: '#1a202c' }}
										>
											<span>Back</span>
										</button>
										<button
											type="submit"
											disabled={loading}
											className="cs_btn cs_style_1 cs_purple_bg cs_accent_hover cs_fs_16 cs_semibold cs_white_color cs_radius_30 flex-grow-1"
											style={{ opacity: loading ? 0.7 : 1 }}
										>
											<span>{loading ? "Creating Team..." : "Create Team"}</span>
										</button>
									</div>

									<div className="col-12 text-center">
										<button
											type="button"
											onClick={handleFinalSubmit}
											className="btn btn-link text-muted"
											disabled={loading}
										>
											Skip for now
										</button>
									</div>
								</form>
							</>
						)}
					</div>
				</div>
				<div className="cs_register_shape_1 cs_purple_bg cs_radius_100 position-absolute" />
				<div className="cs_register_shape_2 cs_accent_bg cs_radius_100 position-absolute" />
			</div>
			<div className="cs_height_140 cs_height_lg_80" />
		</section>
	);
};

export default Onboarding;
