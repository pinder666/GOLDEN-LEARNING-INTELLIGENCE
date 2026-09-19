import { Icon } from "@iconify/react/dist/iconify.js";
import parser from "html-react-parser";
import { useState, FormEvent } from "react";
import { toast } from "react-toastify";
import useEmailValidation from "../../utils/hooks/useEmailValidation";

interface CtaStyle7Props {
	data: {
		title: string;
		btnText: string;
		bgImg?: string;
	};
}

const CtaStyle7 = ({ data }: CtaStyle7Props) => {
	const { title, btnText, bgImg } = data;

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
			<div className="cs_height_134 cs_height_lg_80" />
			<div className="container">
				<div
					className="cs_cta cs_style_4 cs_gray_bg_8 cs_bg_filed cs_radius_10"
					style={{ backgroundImage: `url(${bgImg || ""})` }}
				>
					<div className="cs_center_column text-center position-relative z-1">
						<h2
							className="cs_contet_title cs_fs_70 cs_mb_55 aos fadeInDown"
							data-aos="fade-down"
							data-aos-duration="800"
						>
							{parser(title)}
						</h2>
						<form
							action="#"
							className="cs_newsletter_form cs_type_3 cs_mb_21 position-relative aos fadeInUp"
							data-aos="fade-up"
							data-aos-duration="800"
							onSubmit={handleSubmit}
						>
							<input
								type="email"
								value={email}
								placeholder="Enter your email"
								onChange={(e) => setEmail(e.target.value)}
								className="cs_newsletter_input cs_heading_bg cs_radius_50 text-capitalize"
							/>
							<button
								type="submit"
								aria-label="Sign up button"
								className="cs_btn cs_style_1 cs_purple_bg cs_accent_hover cs_fs_16 cs_semibold cs_white_color"
							>
								<span>{btnText}</span>
							</button>
						</form>
						<ul className="cs_list cs_style_2 cs_mp_0">
							<li>
								<i>
									<Icon icon="fa6-solid:check" className="cs_accent_color" />
								</i>
								No credit card needed
							</li>
							<li>
								<i>
									<Icon icon="fa6-solid:check" className="cs_accent_color" />
								</i>
								Free 14-day trial
							</li>
						</ul>
					</div>
				</div>
			</div>
		</section>
	);
};

export default CtaStyle7;
