import parser from "html-react-parser";

interface FeatureItem {
	id: number;
	icon: string;
	iconBg: string;
	title: string;
	desc: string;
}

interface FeaturesStyle4Props {
	data: {
		mintTitle: string;
		title: string;
		features?: FeatureItem[];
	};
}

const FeaturesStyle4 = ({ data }: FeaturesStyle4Props) => {
	const { mintTitle, title, features } = data;

	return (
		<section>
			<div className="cs_height_140 cs_height_lg_80" />
			<div className="container">
				<div className="cs_section_heading cs_style_1 text-center">
					{mintTitle && (
						<p className="cs_section_subtitle cs_accent_color cs_border cs_radius_15 cs_semibold cs_mb_19">
							{parser(mintTitle)}
						</p>
					)}
					<h2
						className="cs_section_title cs_fs_50 cs_white_color mb-0 aos fadeInDown"
						data-aos="fade-down"
						data-aos-duration="800"
					>
						{parser(title)}
					</h2>
				</div>
				<div className="cs_height_74 cs_height_lg_50" />
				<div className="row cs_gap_y_24 justify-content-center">
					{features?.map((item, index) => (
						<div
							className="col-lg-4 col-md-6 fadeInRight"
							data-aos="fade-right"
							data-aos-duration="800"
							key={`feature-${index}`}
						>
							<div className="cs_iconbox cs_style_2 cs_type_1 cs_radius_15">
								<span
									className={`cs_iconbox_icon cs_center ${item.iconBg} cs_radius_100 cs_mb_25`}
								>
									<img
										src={item.icon}
										alt={`${item.title} icon`}
										className="cs_img_fit"
									/>
								</span>
								<div className="cs_iconbox_info">
									<h3 className="cs_fs_21 cs_white_color cs_normal cs_mb_13">
										{item.title}
									</h3>
									<p className="mb-0">{item.desc}</p>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
			<div className="cs_height_140 cs_height_lg_80" />
		</section>
	);
};

export default FeaturesStyle4;
