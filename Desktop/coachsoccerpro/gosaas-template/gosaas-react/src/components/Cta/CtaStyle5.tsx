import parser from "html-react-parser";
import { useState, FormEvent, ChangeEvent } from "react";
import { toast } from "react-toastify";
import useEmailValidation from "../../utils/hooks/useEmailValidation";

interface CtaStyle5Props {
	data: {
		image: string;
		quoteImage: string;
		title: string;
		description: string;
		btnText: string;
		formAction?: string;
	};
}

const CtaStyle5 = ({ data }: CtaStyle5Props) => {
	const {
		image,
		quoteImage,
		title,
		description,
		btnText,
		formAction = "#",
	} = data;

	const [email, setEmail] = useState<string>("");
	const { validateEmail } = useEmailValidation();

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault();

		const { isValid, message } = validateEmail(email);

		if (isValid) {
			toast.success("You are signup successfully.");
			setEmail("");
		} else {
			toast.error(message);
		}
	};

	return (
		<section>
			<div className="container">
				<div className="cs_cta cs_style_1 cs_heading_bg cs_radius_40 position-relative overflow-hidden">
					<div
						className="cs_cta_thumbnail aos fadeInUp"
						data-aos="fade-up"
						data-aos-duration="800"
					>
						<img src={image} alt="CTA thumbnail" />
						<span className="cs_quote_text_img position-absolute">
							<img src={quoteImage} alt="Quote text" />
						</span>
					</div>
					<div className="cs_cta_text position-relative z-3">
						<h2
							className="cs_fs_50 cs_white_color cs_mb_17 aos fadeInDown"
							data-aos="fade-down"
							data-aos-duration="800"
						>
							{parser(title)}
						</h2>
						<p className="cs_border_color cs_mb_23">{parser(description)}</p>
						<form
							action={formAction}
							className="cs_newsletter_form position-relative aos fadeInUp"
							data-aos="fade-up"
							data-aos-duration="800"
							onSubmit={handleSubmit}
						>
							<input
								type="email"
								value={email}
								placeholder="Enter your email"
								onChange={(e) => setEmail(e.target.value)}
								className="cs_newsletter_input cs_heading_bg cs_radius_50"
							/>
							<button
								type="submit"
								aria-label="Subscribe button"
								className="cs_btn cs_style_1 cs_accent_bg cs_fs_16 cs_semibold cs_white_color cs_purple_hover"
							>
								<span>{btnText}</span>
							</button>
						</form>
					</div>

					{/* Background decorative elements */}
					<div className="cs_ellipse_1 cs_radius_100 position-absolute"></div>
					<div className="cs_ellipse_2 cs_radius_100 position-absolute"></div>
					<div className="cs_vector_1 cs_border_color position-absolute">
						<svg
							width="47"
							height="51"
							viewBox="0 0 47 51"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M1.04162 42.5091C4.00744 46.6198 11.8266 53.2485 19.3766 46.8769C24.494 40.4603 21.1718 32.7965 18.8711 29.7666C17.7788 28.0747 14.931 24.9911 12.278 26.1916C9.62491 27.3922 11.1462 31.0761 12.2385 32.768C15.1312 36.3841 22.9583 41.6975 31.1244 34.0219C39.2905 26.3463 34.7896 16.6331 31.5184 12.7359C27.7525 8.91175 20.6412 3.42528 22.3227 12.0724C24.7957 20.6026 32.9871 19.2579 36.7737 17.5193C39.9008 15.8781 46.1157 10.2766 45.9585 0.999964"
								stroke="currentColor"
								strokeLinecap="round"
							/>
						</svg>
					</div>
				</div>
			</div>
		</section>
	);
};

export default CtaStyle5;
