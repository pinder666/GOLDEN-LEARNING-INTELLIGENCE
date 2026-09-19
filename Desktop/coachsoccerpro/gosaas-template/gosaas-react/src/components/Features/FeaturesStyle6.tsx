import { Icon } from "@iconify/react/dist/iconify.js";
import parser from "html-react-parser";
import { Link } from "react-router-dom";

interface FeatureItem {
	id: number;
	icon: string;
	title: string;
	desc: string;
	url: string;
}

interface FeaturesStyle6Props {
	data: {
		title: string;
		subTitle: string;
		features: FeatureItem[];
	};
}

const FeaturesStyle6: React.FC<FeaturesStyle6Props> = ({ data }) => {
	const { title, subTitle, features } = data;

	return (
		<section>
			<div className="container">
				<div className="cs_section_heading cs_style_1 text-center cs_mb_60">
					<h2
						className="cs_section_title cs_fs_50 cs_mb_15 aos fadeInDown"
						data-aos="fade-down"
						data-aos-duration="800"
					>
						{title}
					</h2>
					<p
						className="cs_section_text mb-0"
						data-aos="fade-up"
						data-aos-duration="800"
					>
						{parser(subTitle)}
					</p>
				</div>
				<div
					className="cs_features_wrapper cs_style_1 cs_heading_bg cs_radius_20 aos fadeInUp"
					data-aos="fade-up"
					data-aos-duration="800"
				>
					{features.map((item, index) => (
						<div
							key={index}
							className="cs_iconbox cs_style_1 cs_center_column text-center"
						>
							<span className="cs_iconbox_icon cs_center cs_radius_15 cs_mb_27">
								<img src={item.icon} alt={`${item.title} icon`} />
							</span>
							<div className="cs_iconbox_info">
								<h3 className="cs_fs_29 cs_white_color cs_mb_19 fw-medium">
									{item.title}
								</h3>
								<p className="cs_border_color cs_mb_17">{item.desc}</p>
								<Link
									to={item.url}
									aria-label={`Learn more about ${item.title}`}
									className="cs_iconbox_btn cs_btn cs_style_1 cs_fs_16 cs_semibold cs_white_color"
								>
									<span>Learn More</span>
									<span className="cs_btn_icon cs_center">
										<Icon
											icon="fa6-solid:arrow-right"
											className="cs_custom_anim2"
										/>
									</span>
								</Link>
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
};

export default FeaturesStyle6;
