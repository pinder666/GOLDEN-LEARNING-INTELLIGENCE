import React from "react";
import CtaStyle3 from "../Cta/CtaStyle3";

interface FeatureItem {
	title: string;
}

interface HeroStyle2Props {
	data: {
		title: string;
		subTitle: string;
		features?: FeatureItem[];
		btnText: string;
		iconUrl: string;
		imgUrl: string;
	};
}

const HeroStyle2: React.FC<HeroStyle2Props> = ({ data }) => {
	const { title, subTitle, features, btnText, iconUrl, imgUrl } = data;

	return (
		<section className="cs_hero cs_style_4" id="home">
			<div className="container">
				<div className="cs_hero_content cs_center_column text-center">
					<CtaStyle3 data={{ title, subTitle, features, btnText, iconUrl }} />
					<div className="cs_height_63 cs_height_lg_60"></div>
					<div
						className="cs_hero_thumbnail cs_radius_20 position-relative aos fadeInDown"
						data-aos="fade-down"
						data-aos-duration="800"
					>
						<img src={imgUrl} alt="Hero image" />
					</div>
				</div>
			</div>
		</section>
	);
};

export default HeroStyle2;
