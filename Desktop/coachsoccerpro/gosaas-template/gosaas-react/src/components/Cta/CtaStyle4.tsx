import { Icon } from "@iconify/react/dist/iconify.js";
import parser from "html-react-parser";
import { Link } from "react-router-dom";
import { FC } from "react";

interface CtaStyle4Props {
	data: {
		title: string;
		subTitle: string;
		btnText: string;
		btnUrl: string;
	};
}

const CtaStyle4: FC<CtaStyle4Props> = ({ data }) => {
	const { title, subTitle, btnText, btnUrl } = data;
	return (
		<section>
			<div className="cs_height_130 cs_height_lg_80"></div>
			<div className="container">
				<div className="cs_cta cs_style_2 cs_radius_40 position-relative overflow-hidden">
					<div className="cs_cta_text text-center position-relative z-1">
						<h2
							className="cs_fs_50 cs_bold cs_white_color cs_mb_30 aos fadeInDown"
							data-aos="fade-down"
							data-aos-duration="800"
						>
							{parser(title)}
						</h2>
						<p className="cs_border_color cs_mb_37">{parser(subTitle)}</p>
						<Link
							to={btnUrl}
							aria-label="About page link button"
							className="cs_btn cs_style_1 cs_purple_bg cs_fs_16 cs_white_color cs_semibold cs_accent_hover aos fadeInUp"
							data-aos="fade-up"
							data-aos-duration="800"
						>
							<span>{btnText}</span>
							<span className="cs_btn_icon cs_center overflow-hidden">
								<Icon icon="fa6-solid:arrow-right" className="cs_custom_anim" />
							</span>
						</Link>
					</div>
					<div className="cs_ellipse_1 position-absolute" />
					<div className="cs_ellipse_2 position-absolute" />
					<div className="cs_ellipse_3 position-absolute" />
					<div className="cs_ellipse_4 position-absolute" />
					<div className="cs_vector_1 position-absolute">
						<img src="/img/vector_2.svg" alt="Vector shape" />
					</div>
					<div className="cs_vector_2 position-absolute">
						<img src="/img/vector_3.svg" alt="Vector shape" />
					</div>
				</div>
			</div>
		</section>
	);
};

export default CtaStyle4;
