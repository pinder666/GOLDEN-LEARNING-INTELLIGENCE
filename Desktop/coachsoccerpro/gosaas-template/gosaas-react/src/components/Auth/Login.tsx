import { Icon } from "@iconify/react/dist/iconify.js";
import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface SocialLoginOption {
	icon: string;
	label: string;
}

const Login = () => {
	const [email, setEmail] = useState<string>("");
	const [password, setPassword] = useState<string>("");
	const [remember, setRemember] = useState<boolean>(false);
	const [showPassword, setShowPassword] = useState<boolean>(false);

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (!email || !password) {
			toast.error("Input field must not be empty!");
			return;
		}

		// Email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			toast.error("Please enter a valid email address");
			return;
		}

		// Password validation (min 8 chars)
		if (password.length < 8) {
			toast.error("Password must be at least 8 characters");
			return;
		}

		// Simulate successful login
		toast.success("Login successful!");

		// Reset form (optional)
		setEmail("");
		setPassword("");
		setRemember(false);
	};

	const socialLoginOptions: SocialLoginOption[] = [
		{ icon: "fa6-brands:linkedin-in", label: "LinkedIn" },
		{ icon: "fa6-brands:x-twitter", label: "Twitter" },
		{ icon: "fa6-brands:facebook-f", label: "Facebook" },
		{ icon: "fa6-brands:google", label: "Google" },
	];

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
								Login into account
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
									<Icon icon="fa6-solid:envelope" className="cs_input_icon" />
									<input
										type="email"
										className="cs_form_field cs_radius_30"
										placeholder="Email Address"
										value={email}
										onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
											setEmail(e.target.value)
										}
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
										onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
											setPassword(e.target.value)
										}
										required
										minLength={8}
										autoComplete="current-password"
									/>
								</div>
							</div>

							<div className="col-12">
								<div className="cs_login_meta d-flex justify-content-between align-items-center">
									<div className="form-check">
										<input
											type="checkbox"
											className="form-check-input"
											id="remember"
											checked={remember}
											onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
												setRemember(e.target.checked)
											}
										/>
										<label htmlFor="remember" className="form-check-label">
											Remember me
										</label>
									</div>
									<Link
										to="/reset-password"
										className="cs_accent_color cs_modal_btn"
										aria-label="Reset password"
									>
										Forgot Password?
									</Link>
								</div>
							</div>

							<div className="col-12">
								<button
									type="submit"
									className="cs_btn cs_style_1 cs_purple_bg cs_accent_hover cs_fs_16 cs_semibold cs_white_color cs_radius_30 w-100"
									aria-label="Login button"
								>
									<span>Login Now</span>
								</button>
							</div>
						</form>

						<div className="cs_social_login text-center">
							<p className="cs_mb_22">or signup with</p>
							<div className="cs_social_links cs_center cs_mb_20">
								{socialLoginOptions.map((social: SocialLoginOption) => (
									<a
										key={social.label}
										href="#"
										className="cs_center cs_radius_100"
										aria-label={`Login with ${social.label}`}
									>
										<Icon icon={social.icon} />
									</a>
								))}
							</div>
							<p className="mb-0">
								Don't have an account?{" "}
								<Link to="/register" className="cs_accent_color">
									Register here
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

export default Login;
