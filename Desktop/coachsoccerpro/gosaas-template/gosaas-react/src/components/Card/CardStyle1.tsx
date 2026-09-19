import React from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link } from "react-router-dom";

interface CardStyle1Props {
	data: {
		mintTitle: string;
		title: string;
		subTitle: string;
		btnText: string;
		btnUrl: string;
		imgUrl: string;
		imgUrl2?: string;
	};
}

const CardStyle1: React.FC<CardStyle1Props> = ({ data }) => {
	const { mintTitle, title, subTitle, btnText, btnUrl, imgUrl, imgUrl2 } = data;

	return (
		<section className={`cs_gray_bg_3 position-relative `}>
			<div className="cs_height_140 cs_height_lg_80" />
			<div className="container">
				<div className="cs_card cs_style_1 cs_type_1">
					<div className="row cs_gap_y_40 align-items-center position-relative z-1">
						<div className="col-xl-6 col-lg-6 offset-xl-1 order-lg-2">
							<div
								className="cs_card_thumbnail cs_radius_15 position-relative fadeInRight"
								data-aos="fade-right"
								data-aos-duration="800"
							>
								<img
									src={imgUrl}
									alt="Feature image"
									className="cs_main_img"
									loading="lazy"
								/>
								<div className="cs_chat cs_radius_10 position-absolute">
									<img src={imgUrl2} alt="Chat image" loading="lazy" />
								</div>
								<div className="cs_feature_shape position-absolute">
									<img
										src="/img/hero_shape_1.svg"
										alt="Decorative shape"
										loading="lazy"
									/>
								</div>
							</div>
						</div>
						<div className="col-xl-5 col-lg-6 order-lg-1">
							<div className="cs_card_content">
								<div className="cs_section_heading cs_style_1 cs_mb_33">
									<p className="cs_section_text cs_fs_16 cs_semibold cs_mb_11">
										{mintTitle}
									</p>
									<h2
										className="cs_section_title cs_fs_50 cs_bold cs_mb_16 aos fadeInDown"
										data-aos="fade-down"
										data-aos-duration="800"
									>
										{title}
									</h2>
									<p className="cs_section_text mb-0">{subTitle}</p>
								</div>
								<Link
									to={btnUrl}
									aria-label={`Click to ${btnText}`}
									className="cs_btn cs_style_1 cs_heading_bg cs_fs_16 cs_white_color cs_semibold mt-0 aos fadeInUp"
									data-aos="fade-up"
									data-aos-duration="800"
								>
									<span>{btnText}</span>
									<span className="cs_btn_icon cs_center overflow-hidden">
										<Icon
											icon="fa6-solid:arrow-right"
											className="cs_custom_anim"
											aria-hidden="true"
										/>
									</span>
								</Link>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div className="cs_height_140 cs_height_lg_80" />
		</section>
	);
};

export default CardStyle1;
