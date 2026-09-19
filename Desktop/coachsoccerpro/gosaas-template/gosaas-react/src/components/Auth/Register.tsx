import { Icon } from "@iconify/react";
import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Register = () => {
	const [fullName, setFullName] = useState<string>("");
	const [email, setEmail] = useState<string>("");
	const [password, setPassword] = useState<string>("");
	const [conditions, setConditions] = useState<boolean>(false);
	const [showPassword, setShowPassword] = useState<boolean>(false);

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (!fullName || !email || !password) {
			toast.error("All fields are required!");
			return;
		}

		if (!conditions) {
			toast.error("You must accept the terms & conditions");
			return;
		}

		// Email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			toast.error("Please enter a valid email address");
			return;
		}

		// Password validation
		if (password.length < 8) {
			toast.error("Password must be at least 8 characters");
			return;
		}

		// Name validation
		if (fullName.length < 3) {
			toast.error("Full name must be at least 3 characters");
			return;
		}

		// Simulate successful registration
		toast.success("Registration successful!");

		// Reset form
		setFullName("");
		setEmail("");
		setPassword("");
		setConditions(false);
	};

	return (
		<section className="position-relative">
			<div className="cs_height_140 cs_height_lg_80" />
			<div className="container">
				<div className="cs_center">
					<div className="cs_register_form_wrapper cs_white_bg cs_radius_30 position-relative z-1">
						<div className="cs_mb_31 text-center">
							<h2
								className="cs_fs_29 cs_medium cs_mb_9 aos zoomIn"
								data-aos="zoom-in"
							>
								Create an account
							</h2>
							<p className="mb-0">
								Use your credentials to access your account
							</p>
						</div>

						<form
							onSubmit={handleSubmit}
							className="cs_register_form row cs_gap_y_24 cs_mb_26"
							noValidate
						>
							<div className="col-12">
								<div className="position-relative">
									<Icon
										icon="fa6-solid:circle-user"
										className="cs_input_icon"
									/>
									<input
										type="text"
										className="cs_form_field cs_radius_30"
										placeholder="Full Name"
										value={fullName}
										onChange={(e) => setFullName(e.target.value)}
										minLength={3}
										required
										autoComplete="name"
									/>
								</div>
							</div>

							<div className="col-12">
								<div className="position-relative">
									<Icon icon="fa6-solid:envelope" className="cs_input_icon" />
									<input
										type="email"
										className="cs_form_field cs_radius_30"
										placeholder="Email Address"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										required
										autoComplete="email"
									/>
								</div>
							</div>

							<div className="col-12">
								<div className="position-relative">
									<Icon icon="fa6-solid:lock" className="cs_input_icon" />
									<Icon
										icon={`fa6-solid:${showPassword ? "eye-slash" : "eye"}`}
										onClick={() => setShowPassword(!showPassword)}
										className="cs_password_toggle"
										aria-label={
											showPassword ? "Hide password" : "Show password"
										}
									/>
									<input
										type={showPassword ? "text" : "password"}
										className="cs_form_field cs_radius_30"
										placeholder="Password"
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										minLength={8}
										required
										autoComplete="new-password"
									/>
								</div>
							</div>

							<div className="col-12">
								<div className="form-check">
									<input
										type="checkbox"
										className="form-check-input"
										id="conditions"
										checked={conditions}
										onChange={(e) => setConditions(e.target.checked)}
										required
									/>
									<label htmlFor="conditions" className="form-check-label">
										I accept the{" "}
										<Link to="#" className="cs_accent_color">
											Terms & Conditions
										</Link>
									</label>
								</div>
							</div>

							<div className="col-12">
								<button
									type="submit"
									className="cs_btn cs_style_1 cs_purple_bg cs_accent_hover cs_fs_16 cs_semibold cs_white_color cs_radius_30 w-100"
									aria-label="Register button"
								>
									<span>Register Now</span>
								</button>
							</div>
						</form>

						<div className="cs_social_login text-center">
							<p className="cs_mb_22">or sign up with</p>
							<div className="cs_social_links cs_center cs_mb_20">
								{[
									{ icon: "fa6-brands:linkedin-in", label: "LinkedIn" },
									{ icon: "fa6-brands:x-twitter", label: "Twitter" },
									{ icon: "fa6-brands:facebook-f", label: "Facebook" },
									{ icon: "fa6-brands:google", label: "Google" },
								].map((social) => (
									<a
										key={social.label}
										href="#"
										className="cs_center cs_radius_100"
										aria-label={`Sign up with ${social.label}`}
									>
										<Icon icon={social.icon} />
									</a>
								))}
							</div>
							<p className="mb-0">
								Already have an account?{" "}
								<Link to="/login" className="cs_accent_color">
									Login here
								</Link>
							</p>
						</div>
					</div>
				</div>
				<div className="cs_register_shape_1 cs_purple_bg cs_radius_100 position-absolute" />
				<div className="cs_register_shape_2 cs_accent_bg cs_radius_100 position-absolute" />
			</div>
			<div className="cs_height_140 cs_height_lg_80" />
		</section>
	);
};

export default Register;
