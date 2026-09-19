import { Icon } from "@iconify/react";
import { FormEvent, useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ResetPassword = () => {
	const [email, setEmail] = useState<string>("");
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			if (!email) {
				throw new Error("Email field cannot be empty");
			}

			// Email validation
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(email)) {
				throw new Error("Please enter a valid email address");
			}

			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 1000));

			toast.success("Password reset link sent to your email!");
			setEmail("");
		} catch (error) {
			if (error instanceof Error) {
				toast.error(error.message);
			} else {
				toast.error("An unknown error occurred");
			}
		} finally {
			setIsSubmitting(false);
		}
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
								Reset Password
							</h2>
							<p className="mb-0">
								Enter your email to receive a password reset link.
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
										onChange={(e) => setEmail(e.target.value)}
										required
										autoComplete="email"
										disabled={isSubmitting}
									/>
								</div>
							</div>

							<div className="col-12">
								<button
									type="submit"
									className="cs_btn cs_style_1 cs_purple_bg cs_accent_hover cs_fs_16 cs_semibold cs_white_color cs_radius_30 w-100"
									disabled={isSubmitting}
									aria-disabled={isSubmitting}
								>
									{isSubmitting ? (
										<span className="cs_spinner"></span>
									) : (
										<span>Reset Password</span>
									)}
								</button>
							</div>
						</form>
					</div>
				</div>
				<div className="cs_register_shape_1 cs_purple_bg cs_radius_100 position-absolute" />
				<div className="cs_register_shape_2 cs_accent_bg cs_radius_100 position-absolute" />
			</div>
			<div className="cs_height_140 cs_height_lg_80" />
		</section>
	);
};

export default ResetPassword;
