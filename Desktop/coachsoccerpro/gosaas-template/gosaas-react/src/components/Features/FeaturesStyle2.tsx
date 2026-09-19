interface FeatureItem {
	id: number;
	icon: string;
	title: string;
	desc: string;
}

interface FeaturesStyle2Props {
	data: {
		title: string;
		imgUrl: string;
		features?: FeatureItem[];
	};
}

const FeaturesStyle2 = ({ data }: FeaturesStyle2Props) => {
	const { title, imgUrl, features } = data;

	return (
		<section>
			<div className="cs_height_140 cs_height_lg_80" />
			<div className="container">
				<div className="cs_card cs_style_1 cs_type_6">
					<div className="row cs_gap_y_40">
						<div className="col-xl-6 col-lg-6">
							<div
								className="cs_card_thumbnail cs_center position-relative aos fadeInLeft"
								data-aos="fade-right"
								data-aos-duration="800"
							>
								<img src={`${imgUrl}`} alt="Man image" className="cs_img_fit" />
								<div className="cs_thumbnail_before cs_radius_100 position-absolute" />
								<div className="cs_illustration_1 cs_radius_20 position-absolute">
									<img
										src="/img/Illustration_5.png"
										alt="Analytics chart image"
										className="cs_img_fit"
									/>
								</div>
								<div className="cs_illustration_2 cs_radius_20 position-absolute">
									<img
										src="/img/Illustration_6.png"
										alt="User info image"
										className="cs_img_fit"
									/>
								</div>
							</div>
						</div>
						<div className="col-xl-5 col-lg-6 offset-xl-1">
							<div className="cs_section_heading cs_style_1 cs_mb_40">
								<h2
									className="cs_section_title cs_fs_50 cs_mb_19 aos fadeInDown"
									data-aos="fade-down"
									data-aos-duration="800"
								>
									{title}
								</h2>
								<hr className="cs_divider" />
							</div>
							<div className="cs_iconbox_wrapper position-relative z-2">
								{features?.map((item, index) => (
									<div
										className="cs_iconbox cs_style_6 cs_mb_36 aos fadeInLeft"
										data-aos="fade-left"
										data-aos-duration="800"
										key={`feature-${index}`}
									>
										<span className="cs_iconbox_icon cs_center cs_purple_bg cs_white_color cs_radius_100">
											<img src={item.icon} alt={`${item.title} icon`} />
										</span>
										<div className="cs_iconbox_info">
											<h3 className="cs_fs_29 cs_normal">{item.title}</h3>
											<p className="mb-0">{item.desc}</p>
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			</div>
			<div className="cs_height_140 cs_height_lg_80" />
		</section>
	);
};

export default FeaturesStyle2;
