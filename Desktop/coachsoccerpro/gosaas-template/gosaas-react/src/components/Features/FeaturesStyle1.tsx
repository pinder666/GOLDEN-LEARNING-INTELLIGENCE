import parser from "html-react-parser";
import FeaturesSliderStyle1 from "../Slider/FeaturesSliderStyle1";

interface FeatureItem {
	icon: string;
	icon_bg?: string;
	title: string;
	description: string;
}

interface FeaturesStyle1Props {
	data: {
		title: string;
		subTitle?: string;
		features: FeatureItem[];
	};
}

const FeaturesStyle1 = ({ data }: FeaturesStyle1Props) => {
	const { title, subTitle, features } = data;

	return (
		<section className="cs_slider cs_style_1 cs_slider_gap_24">
			<div className="cs_bg_shape_1 cs_radius_15 position-absolute" style={{ backgroundColor: '#2d5a1b' }} />
			<div className="cs_height_125 cs_height_lg_80" />
			<div className="container position-relative z-1">
				<div className="cs_section_heading cs_style_1 cs_type_1 cs_mb_60">
					<div className="cs_section_heading_left">
						<h2
							className="cs_section_title cs_fs_50 mb-0 aos fadeInLeft"
							data-aos="fade-right"
							data-aos-duration="800"
						>
							{parser(title)}
						</h2>
					</div>
					<div
						className="cs_section_heading_right fadeInRight"
						data-aos="fade-left"
						data-aos-duration="800"
					>
						{subTitle && <p className="mb-0">{subTitle}</p>}
					</div>
				</div>
				<FeaturesSliderStyle1 features={features} />
			</div>
			<div className="cs_height_140 cs_height_lg_80" />
		</section>
	);
};

export default FeaturesStyle1;
