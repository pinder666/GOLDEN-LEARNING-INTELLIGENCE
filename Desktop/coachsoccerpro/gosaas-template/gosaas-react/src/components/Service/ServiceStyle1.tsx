import { FC } from "react";
import parser from "html-react-parser";

interface ServiceItem {
	icon: string;
	iconBg: string;
	title: string;
	desc: string;
}

interface ServiceStyle1Props {
	data: {
		title: string;
		subTitle: string;
		services: ServiceItem[];
	};
}

const ServiceStyle1: FC<ServiceStyle1Props> = ({ data }) => {
	const { title, subTitle, services } = data;

	return (
		<section className="cs_gray_bg_7 position-relative">
			<div className="cs_height_124 cs_height_lg_80" />
			<div className="container">
				<div className="cs_section_heading cs_style_1 text-center cs_mb_55 position-relative z-2">
					<h2
						className="cs_section_title cs_fs_50 cs_mb_4 aos fadeInDown"
						data-aos="fade-down"
						data-aos-duration="800"
					>
						{parser(title)}
					</h2>
					<p className="cs_section_text cs_fs_21 mb-0">{parser(subTitle)}</p>
				</div>
				<div className="row cs_gap_y_24 position-relative z-1">
					{services?.map((item, index) => (
						<div
							className="col-lg-4 col-md-6 aos fadeInLeft"
							data-aos="fade-right"
							data-aos-duration="800"
							key={index}
						>
							<div className="cs_iconbox cs_style_2 cs_white_bg cs_radius_15">
								<span
									className={`cs_iconbox_icon cs_center cs_radius_100 ${item.iconBg} cs_mb_25`}
								>
									<img src={item.icon} alt={item.title} />
								</span>
								<div className="cs_iconbox_info">
									<h3 className="cs_fs_21 fw-normal cs_mb_13">{item.title}</h3>
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

export default ServiceStyle1;
