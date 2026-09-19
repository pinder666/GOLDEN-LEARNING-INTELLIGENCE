import React from "react";
import parser from "html-react-parser";

interface FeatureItem {
	id: number;
	icon: string;
	title: string;
	desc: string;
}

interface CardStyle3Props {
	data: {
		mintTitle: string;
		title: string;
		subTitle: string;
		imgUrl: string;
		features?: FeatureItem[];
		className?: string;
		illustrationImage?: string;
		animationOptions?: {
			duration?: number;
			delay?: number;
		};
	};
}

const CardStyle3: React.FC<CardStyle3Props> = ({ data }) => {
	const {
		mintTitle,
		title,
		subTitle,
		imgUrl,
		features = [],
		className = "",
		illustrationImage = "/img/Illustration_2.png",
		animationOptions = {},
	} = data;

	return (
		<section className={className}>
			<div className="container">
				<div className="cs_card cs_style_1 cs_type_4">
					<div className="row cs_gap_y_40 align-items-center">
						<div className="col-xl-5 col-lg-5 offset-xl-1 order-lg-2">
							<div
								className="cs_card_thumbnail cs_radius_15 position-relative fadeInRight"
								data-aos="fade-right"
								data-aos-duration={animationOptions.duration || 800}
								data-aos-delay={animationOptions.delay || 0}
							>
								<img
									src={imgUrl}
									alt="Feature image"
									className="cs_main_image"
									loading="lazy"
								/>
								<div className="cs_illustration position-absolute">
									<img
										src={illustrationImage}
										alt="Analytics chart"
										loading="lazy"
									/>
								</div>
							</div>
						</div>
						<div className="col-xl-6 col-lg-7 order-lg-1">
							<div className="cs_card_content">
								<div className="cs_section_heading cs_style_1 cs_mb_39">
									<p className="cs_body_color cs_mb_11">{mintTitle}</p>
									<h2
										className="cs_section_title cs_white_color cs_fs_50 cs_mb_24 aos fadeInDown"
										data-aos="fade-down"
										data-aos-duration={animationOptions.duration || 800}
										data-aos-delay={animationOptions.delay || 0}
									>
										{parser(title)}
									</h2>
									<p className="cs_section_text cs_fs_21 mb-0">
										{parser(subTitle)}
									</p>
								</div>
								{features.length > 0 && (
									<div className="row cs_gap_y_40">
										{features.map((item, index) => (
											<div
												className={`col-md-6`}
												key={`feature-${index}`}
												data-aos="fade-up"
												data-aos-delay={
													index * 100 + (animationOptions.delay || 0)
												}
											>
												<div className="cs_iconbox">
													<span className="cs_iconbox_icon cs_accent_color cs_mb_24 d-inline-block">
														<img
															src={item.icon}
															alt={`${item.title} icon`}
															loading="lazy"
														/>
													</span>
													<h3 className="cs_fs_21 cs_white_color cs_mb_15">
														{item.title}
													</h3>
													<p className="mb-0">{item.desc}</p>
												</div>
											</div>
										))}
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};

export default CardStyle3;
