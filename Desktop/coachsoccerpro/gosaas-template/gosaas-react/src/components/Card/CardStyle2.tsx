import React from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link } from "react-router-dom";

interface CardStyle2Props {
	data: {
		mintTitle: string;
		title: string;
		subTitle: string;
		btnText: string;
		btnUrl: string;
		imgUrl: string;
	};
}

const CardStyle2: React.FC<CardStyle2Props> = ({ data }) => {
	const { mintTitle, title, subTitle, btnText, btnUrl, imgUrl } = data;

	const defaultBubbles = [
		{
			id: 1,
			image: "/img/message-bubble-1.png",
			altText: "Message bubble 1",
			className: "cs_message_bubble_1",
		},
		{
			id: 2,
			image: "/img/message-bubble-2.png",
			altText: "Message bubble 2",
			className: "cs_message_bubble_2",
		},
		{
			id: 3,
			image: "/img/message-bubble-3.png",
			altText: "Message bubble 3",
			className: "cs_message_bubble_3",
		},
	];

	return (
		<section>
			<div className="cs_height_140 cs_height_lg_80" />
			<div className="container">
				<div className="cs_card cs_style_1 cs_type_2">
					<div className="row cs_gap_y_40 align-items-center">
						<div className="col-xl-6 col-lg-6">
							<div
								className="cs_card_thumbnail cs_radius_15 position-relative aos fadeInLeft"
								data-aos="fade-right"
								data-aos-duration="800"
							>
								<img
									src={imgUrl}
									alt="Feature image"
									className="cs_main_image"
									loading="lazy"
								/>
								<div className="cs_feature_shape_2 position-absolute">
									<img
										src="/img/hero_shape_1.svg"
										alt="Decorative shape"
										loading="lazy"
									/>
								</div>
								<div className="cs_message_bubble_wrapper position-absolute">
									{defaultBubbles.map((bubble, index) => (
										<div key={`bubble-${index}`} className={bubble.className}>
											<img
												src={bubble.image}
												alt={bubble.altText}
												loading="lazy"
											/>
										</div>
									))}
								</div>
							</div>
						</div>
						<div className="col-xl-5 col-lg-6 offset-xl-1">
							<div className="cs_card_content">
								<div className="cs_section_heading cs_style_1 cs_mb_30">
									<p className="cs_fs_16 cs_semibold cs_mb_11">{mintTitle}</p>
									<h2
										className="cs_section_title cs_fs_50 cs_bold cs_mb_27 aos fadeInDown"
										data-aos="fade-down"
									>
										{title}
									</h2>
									<p className="cs_section_text cs_fs_21 mb-0">{subTitle}</p>
								</div>
								<Link
									to={btnUrl}
									aria-label={`Click to ${btnText}`}
									className="cs_btn cs_style_1 cs_heading_bg cs_fs_16 cs_white_color cs_semibold mt-0 aos fadeInUp"
									data-aos="fade-up"
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

export default CardStyle2;
