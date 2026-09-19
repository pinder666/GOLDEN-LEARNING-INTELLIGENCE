import { Icon } from "@iconify/react/dist/iconify.js";
import parser from "html-react-parser";
import { useState, FormEvent, ChangeEvent } from "react";
import { toast } from "react-toastify";
import useEmailValidation from "../../utils/hooks/useEmailValidation";

interface HeroStyle3Props {
	data: {
		title: string;
		subTitle: string;
		iconUrl: string;
		imgUrl: string;
		bgImgUrl?: string;
		btnText: string;
	};
}

const HeroStyle3: React.FC<HeroStyle3Props> = ({ data }) => {
	const { title, subTitle, bgImgUrl, imgUrl } = data;

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
		<section
			className="cs_hero cs_style_1 cs_type_2 cs_bg_filed cs_heading_bg position-relative"
			id="home"
			style={{ backgroundImage: `url(${bgImgUrl})` }}
		>
			<div className="container">
				<div className="cs_hero_content cs_center_column text-center position-relative z-1">
					<h1
						className="cs_fs_68 cs_white_color cs_mb_42 aos fadeInDown"
						data-aos="fade-down"
						data-aos-duration="800"
					>
						{parser(title)}
					</h1>
					<p className="cs_mb_46">{parser(subTitle)}</p>
					<form
						className="cs_newsletter_form cs_type_2 cs_mb_21 position-relative aos fadeInUp"
						data-aos="fade-up"
						data-aos-duration="800"
						onSubmit={handleSubmit}
					>
						<input
							type="email"
							value={email}
							placeholder="Enter your email"
							onChange={(e) => setEmail(e.target.value)}
							className="cs_newsletter_input cs_radius_50 text-capitalize"
						/>
						<span className="cs_mail_icon position-absolute">
							<i>
								<Icon icon="fa6-solid:envelope" />
							</i>
						</span>
						<button
							type="submit"
							aria-label="Subscribe button"
							className="cs_btn cs_style_1 cs_purple_bg cs_fs_16 cs_semibold cs_white_color cs_accent_hover"
						>
							<span>Sign Up Free</span>
						</button>
					</form>
				</div>
				<div className="cs_height_60 cs_height_lg_50" />
				<div
					className="cs_hero_thumbnail position-relative aos fadeInDown"
					data-aos="fade-down"
					data-aos-duration="800"
				>
					<img src={imgUrl} alt="Hero image" />
				</div>
				<div className="cs_blob_1 cs_radius_100 position-absolute" />
				<div className="cs_blob_2 cs_radius_100 position-absolute" />
				<div className="cs_blob_3 cs_radius_100 position-absolute" />
				<div className="cs_blob_4 cs_radius_100 position-absolute" />
				<div className="cs_hero_shape_1 position-absolute">
					<img src="/img/hero_shape_3.svg" alt="Circular shape" />
				</div>
				<div className="cs_hero_shape_2 position-absolute">
					<img src="/img/hero_shape_4.svg" alt="Triangle shape" />
				</div>
			</div>
		</section>
	);
};

export default HeroStyle3;
