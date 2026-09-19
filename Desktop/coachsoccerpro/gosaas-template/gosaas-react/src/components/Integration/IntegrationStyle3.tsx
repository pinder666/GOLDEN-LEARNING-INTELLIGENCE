import parser from "html-react-parser";
import { FC } from "react";

interface Tool {
	id: number;
	name: string;
	icon: string;
	desc?: string;
}

interface IntegrationStyle3Props {
	data: {
		title: string;
		subtitle: string;
		tools: Tool[];
	};
}

const IntegrationStyle3: FC<IntegrationStyle3Props> = ({ data }) => {
	const { title, subtitle, tools } = data;

	return (
		<section className="cs_gray_bg_1 position-relative">
			<div className="cs_height_130 cs_height_lg_80" />
			<div className="container">
				<div className="cs_section_heading cs_style_1 text-center position-relative z-2">
					<h2
						className="cs_section_title cs_fs_50 cs_mb_4 aos fadeInDown"
						data-aos="fade-down"
						data-aos-duration="800"
					>
						{parser(title)}
					</h2>
					<p
						className="cs_section_text cs_fs_21 mb-0"
						data-aos="fade-up"
						data-aos-duration="800"
					>
						{parser(subtitle)}
					</p>
				</div>

				<div className="cs_height_62 cs_height_lg_50" />

				<div
					className="row cs_gap_y_24 position-relative z-1"
					data-aos="fade-up"
					data-aos-duration="800"
				>
					{tools?.map((item, index) => (
						<div className="col-lg-4 col-md-6 aos fadeInDown" key={index}>
							<div className="cs_iconbox cs_style_2 cs_type_3 cs_center_column cs_white_bg cs_radius_15 text-center">
								<span className="cs_iconbox_icon cs_center cs_mb_38">
									<img src={item.icon} alt={item.name} />
								</span>
								<div className="cs_iconbox_info">
									<h3 className="cs_fs_29 cs_medium cs_mb_13">{item.name}</h3>
									<p className="mb-0">{item.desc}</p>
								</div>
							</div>
						</div>
					))}
				</div>

				<div className="cs_vector_shape_1 position-absolute">
					<img src="/img/vector_1.svg" alt="Vector shape" />
				</div>
				<div className="cs_vector_shape_2 position-absolute">
					<img src="/img/vector_1.svg" alt="Vector shape" />
				</div>
			</div>
			<div className="cs_height_130 cs_height_lg_80" />
		</section>
	);
};

export default IntegrationStyle3;
