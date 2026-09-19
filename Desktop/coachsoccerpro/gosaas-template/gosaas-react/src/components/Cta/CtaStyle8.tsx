import { Icon } from "@iconify/react/dist/iconify.js";
import parser from "html-react-parser";
import { useState, FormEvent } from "react";
import { toast } from "react-toastify";
import useEmailValidation from "../../utils/hooks/useEmailValidation";

interface FeatureItem {
	id: number;
	title: string;
}

interface CtaStyle8Props {
	data: {
		title?: string;
		subTitle?: string;
		features?: FeatureItem[];
		btnText?: string;
		iconUrl?: string;
	};
}

const CtaStyle8 = ({ data }: CtaStyle8Props) => {
	const { title, subTitle, features, btnText, iconUrl } = data;

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
				<div className="row">
					<div className="col-lg-10 offset-lg-1">
						<div className="cs_hero_content cs_center_column text-center">
							{subTitle && (
								<p className="cs_mb_25">
									<img src={iconUrl} alt="Giftbox image" className="me-2" />
									{parser(subTitle)}
								</p>
							)}
							<h1
								className="cs_fs_70 cs_bold cs_mb_57 aos fadeInDown"
								data-aos="fade-down"
								data-aos-duration="800"
							>
								{parser(title || "")}
							</h1>
							<form
								action="#"
								className="cs_newsletter_form cs_type_1 position-relative aos fadeInUp"
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
								<button
									type="submit"
									aria-label="Subscribe button"
									className="cs_btn cs_style_1 cs_purple_bg cs_fs_16 cs_semibold cs_white_color"
								>
									<span>{btnText || ""}</span>
								</button>
							</form>
							<ul className="cs_list cs_style_2 cs_mp_0">
								{features?.map((item, index) => (
									<li className="" key={index}>
										<i>
											<Icon
												className="cs_accent_color"
												icon="fa6-solid:check"
											/>
										</i>
										{item.title}
									</li>
								))}
							</ul>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};

export default CtaStyle8;
