import React, { useState, FormEvent } from "react";
import { Icon } from "@iconify/react";
import parser from "html-react-parser";
import { toast } from "react-toastify";
import useEmailValidation from "../../utils/hooks/useEmailValidation";

interface CardStyle5Props {
	data: {
		mintTitle: string;
		title: string;
		subTitle: string;
		imgUrl: string;
		growthRate: number;
		happyCustomers: number;
		/**
		 * Optional badge images. If any field is undefined,
		 * that badge won't render.
		 */
		badgeImages?: {
			fastMessaging?: string;
			taskInfo?: string;
			rating?: string;
		};
	};
}

const CardStyle5: React.FC<CardStyle5Props> = ({ data }) => {
	const {
		mintTitle,
		title,
		subTitle,
		imgUrl,
		growthRate,
		happyCustomers,
		badgeImages,
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
				<div className="cs_card cs_style_1 cs_type_5">
					<div className="row cs_gap_y_40 align-items-center">
						{/* Image / Badges */}
						<div className="col-lg-5 order-lg-2 offset-lg-1">
							<div
								className="cs_card_thumbnail cs_radius_15 position-relative fadeInRight"
								data-aos="fade-right"
								data-aos-duration="800"
							>
								<img
									src={imgUrl}
									alt="Feature"
									className="w-100"
									loading="lazy"
								/>

								{/* Badges (conditionally rendered) */}
								{badgeImages?.fastMessaging && (
									<div
										className="cs_fast_managing_badge position-absolute"
										aria-hidden="true"
									>
										<img
											src={badgeImages.fastMessaging}
											alt=""
											loading="lazy"
										/>
									</div>
								)}

								{badgeImages?.taskInfo && (
									<div
										className="cs_task_info_badge position-absolute"
										aria-hidden="true"
									>
										<img src={badgeImages.taskInfo} alt="" loading="lazy" />
									</div>
								)}

								{badgeImages?.rating && (
									<div
										className="cs_rating_badge position-absolute"
										aria-hidden="true"
									>
										<img src={badgeImages.rating} alt="" loading="lazy" />
									</div>
								)}
							</div>
						</div>

						{/* Content */}
						<div className="col-lg-6">
							<div className="cs_card_content">
								<div className="cs_section_heading cs_style_1 cs_mb_37">
									<p className="cs_body_color cs_semibold cs_mb_11">
										{mintTitle}
									</p>
									<h2
										className="cs_section_title cs_fs_50 cs_white_color cs_mb_27 aos fadeInDown"
										data-aos="fade-down"
										data-aos-duration="800"
									>
										{parser(title)}
									</h2>
									<p className="cs_section_text mb-0">{parser(subTitle)}</p>
								</div>

								{/* Newsletter form */}
								<form
									onSubmit={handleSubmit}
									className="cs_newsletter_form cs_type_2 cs_mb_29 position-relative aos fadeInUp"
									data-aos="fade-up"
									data-aos-duration="800"
									noValidate
								>
									<input
										type="email"
										value={email}
										placeholder="Enter your email"
										onChange={(e) => setEmail(e.target.value)}
										className="cs_newsletter_input cs_radius_50"
										aria-label="Email address"
									/>
									<span
										className="cs_mail_icon position-absolute"
										aria-hidden="true"
									>
										<Icon icon="fa6-regular:envelope" />
									</span>
									<button
										type="submit"
										className="cs_btn cs_style_1 cs_purple_bg cs_fs_16 cs_semibold cs_white_color cs_accent_hover"
										aria-label="Sign up for free"
									>
										<span>Sign Up Free</span>
									</button>
								</form>

								{/* Funfacts */}
								<div className="cs_funfact_wrapper">
									<div className="cs_funfact cs_style_1">
										<div className="cs_funfact_number cs_fs_38 cs_bold cs_white_color cs_mb_2">
											{growthRate}%
										</div>
										<h3 className="cs_border_color cs_fs_16 cs_normal mb-0">
											Growth Rate
										</h3>
									</div>
									<div className="cs_funfact cs_style_1">
										<div className="cs_funfact_number cs_fs_38 cs_bold cs_white_color cs_mb_2">
											{happyCustomers}K
										</div>
										<h3 className="cs_border_color cs_fs_16 cs_normal mb-0">
											Happy Customers
										</h3>
									</div>
								</div>
							</div>
						</div>
						{/* /Content */}
					</div>
				</div>
			</div>
		</section>
	);
};

export default CardStyle5;
