import parser from "html-react-parser";
import InterfaceSliderStyle1 from "../Slider/InterfaceSliderStyle1";
import { FC } from "react";

interface InterfaceImage {
	imgUrl: string;
}

interface InterfaceStyle1Props {
	data: {
		title: string;
		subTitle: string;
		interfaceImages: InterfaceImage[];
	};
}

const InterfaceStyle1: FC<InterfaceStyle1Props> = ({ data }) => {
	const { title, subTitle, interfaceImages } = data;

	return (
		<section className="cs_gray_bg_7 cs_slider cs_style_1 cs_slider_gap_24">
			<div className="cs_height_124 cs_height_lg_80"></div>
			<div className="container">
				<div className="cs_section_heading cs_style_1 text-center cs_mb_55">
					<h2
						className="cs_fs_50 cs_mb_12 aos fadeInDown"
						data-aos="fade-down"
						data-aos-duration="800"
					>
						{parser(title)}
					</h2>
					<p className="cs_fs_21 mb-0">{parser(subTitle)}</p>
				</div>
				<InterfaceSliderStyle1 interfaceImages={interfaceImages} />
			</div>
			<div className="cs_height_130 cs_height_lg_80"></div>
		</section>
	);
};

export default InterfaceStyle1;
