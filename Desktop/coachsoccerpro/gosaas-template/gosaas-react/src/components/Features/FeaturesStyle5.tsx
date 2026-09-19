import { Icon } from "@iconify/react/dist/iconify.js";
import parser from "html-react-parser";
import { Link } from "react-router-dom";

interface FeatureItem {
	animation: string;
	icon: string;
	title: string;
	subtitle: string;
}

interface FeaturesStyle5Props {
	data: {
		title: string;
		subTitle: string;
		features?: FeatureItem[];
	};
}

const FeaturesStyle5 = ({ data }: FeaturesStyle5Props) => {
	const { title, subTitle, features } = data;

	return (
		<section>
			<div className="cs_height_120 cs_height_lg_80" />
			<div className="container">
				<div className="cs_section_heading cs_style_1 cs_center_column text-center cs_mb_55">
					<h2
						className="cs_section_title cs_fs_50 cs_mb_4 aos fadeInDown"
						data-aos="fade-down"
						data-aos-duration="800"
					>
						{parser(title)}
					</h2>
					{subTitle && (
						<p
							className="cs_section_text cs_fs_21 mb-0"
							data-aos="fade-up"
							data-aos-duration="800"
						>
							{parser(subTitle)}
						</p>
					)}
				</div>
				<div
					className="row cs_gap_y_40"
					data-aos="fade-up"
					data-aos-duration="800"
				>
					{features?.map((item, index) => (
						<div className="col-lg-4" key={`feature-${index}`}>
							<div
								className={`cs_iconbox cs_style_1 text-center wow ${item.animation}`}
							>
								<span className="cs_iconbox_icon cs_center cs_radius_100 cs_accent_bg cs_heading_color cs_mb_22">
									<img
										src={item.icon}
										alt={`${item.title} icon`}
										className="cs_img_fit"
									/>
								</span>
								<div className="cs_iconbox_info">
									<h3 className="cs_iconbox_title cs_fs_29 cs_normal cs_mb_12">
										{item.title}
									</h3>
									<p className="cs_iconbox_subtitle cs_fs_18 cs_mb_11">
										{parser(item.subtitle)}
									</p>
									<Link
										to="/features"
										aria-label={`Learn more about ${item.title}`}
										className="cs_iconbox_btn cs_semibold cs_heading_color"
									>
										<span>Learn More</span>
										<span className="cs_btn_icon cs_center" aria-hidden="true">
											<Icon
												icon="fa6-solid:arrow-right"
												className="cs_custom_anim3"
											/>
										</span>
									</Link>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
};

export default FeaturesStyle5;
