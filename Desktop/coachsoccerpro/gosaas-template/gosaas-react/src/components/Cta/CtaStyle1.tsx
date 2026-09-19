import { useState, FormEvent } from "react";
import parser from "html-react-parser";
import { toast } from "react-toastify";
import useEmailValidation from "../../utils/hooks/useEmailValidation";

interface CtaStyle1Props {
	data: {
		title: string;
		btnText: string;
	};
}

const CtaStyle1 = ({ data }: CtaStyle1Props) => {
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
		<section className="cs_cta cs_style_3 cs_purple_bg position-relative overflow-hidden">
			<div className="cs_height_125 cs_height_lg_72" />
			<div className="container">
				<div className="cs_cta_text cs_center_column text-center position-relative z-1">
					<h2
						className="cs_fs_50 cs_white_color cs_mb_48 aos fadeInDown"
						data-aos="fade-down"
						data-aos-duration="800"
					>
						{parser(data.title)}
					</h2>
					<form
						className="cs_newsletter_form cs_type_1 position-relative aos fadeInUp"
						data-aos="fade-up"
						data-aos-duration="800"
						onSubmit={handleSubmit}
					>
						<input
							type="email"
							value={email}
							placeholder="Enter your email address"
							onChange={(e) => setEmail(e.target.value)}
							className="cs_newsletter_input cs_white_bg cs_radius_50 border-0"
						/>
						<button
							type="submit"
							aria-label="Get started now button"
							className="cs_btn cs_style_1 cs_heading_bg cs_fs_16 cs_semibold cs_white_color cs_purple_hover"
						>
							<span>{data.btnText}</span>
						</button>
					</form>
				</div>
				<div className="cs_cta_shape_1 cs_accent_bg cs_radius_100 position-absolute" />
				<div className="cs_cta_shape_2 cs_accent_bg cs_radius_100 position-absolute" />
			</div>
			<div className="cs_height_140 cs_height_lg_80" />
		</section>
	);
};

export default CtaStyle1;
