import parser from "html-react-parser";

interface FeatureItem {
	id: number;
	img: string;
	title: string;
	desc: string;
	animation: string;
}

interface FeaturesStyle7Props {
	data: {
		title: string;
		subTitle: string;
		features?: FeatureItem[];
	};
}

const FeaturesStyle7: React.FC<FeaturesStyle7Props> = ({ data }) => {
	const { title, subTitle, features } = data;

	return (
		<section>
			<div className="cs_height_123 cs_height_lg_80"></div>
			<div className="container">
				<div className="cs_section_heading cs_style_1 text-center">
					<h2
						className="cs_fs_50 cs_white_color cs_fs_24 aos fadeInDown"
						data-aos="fade-down"
						data-aos-duration="800"
					>
						{parser(title)}
					</h2>
					<p
						className="mb-0 aos fadeInUp"
						data-aos="fade-up"
						data-aos-duration="800"
					>
						{parser(subTitle)}
					</p>
				</div>

				<div className="cs_height_67 cs_height_lg_50"></div>

				<div className="row cs_gap_y_24">
					{features?.map((item, index) => (
						<div className={`col-lg-4 wow ${item.animation}`} key={index}>
							<div className="cs_card cs_style_2 cs_radius_15">
								<div className="cs_card_thumbnail cs_radius_10 cs_mb_31">
									<img src={item.img} alt={item.title} />
								</div>
								<div className="cs_card_info">
									<h3 className="cs_fs_21 cs_white_color cs_mb_14">
										{item.title}
									</h3>
									<p className="mb-0">{item.desc}</p>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
};

export default FeaturesStyle7;
