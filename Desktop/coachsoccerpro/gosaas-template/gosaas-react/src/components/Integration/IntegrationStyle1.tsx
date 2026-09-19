import { FC } from "react";

interface Tools {
	id: number;
	name: string;
	icon: string;
}

interface IntegrationStyle1Props {
	data: {
		title: string;
		subtitle: string;
		tools: Tools[];
	};
}

const IntegrationStyle1: FC<IntegrationStyle1Props> = ({ data }) => {
	const { title, subtitle, tools } = data;

	return (
		<section>
			<div className="container">
				<div className="cs_payments_info_wrapper position-relative">
					<div className="row">
						<div className="col-lg-6 offset-lg-3">
							<div className="cs_payment_info_text position-relative z-2">
								<div className="cs_section_heading cs_style_1 text-center">
									<h2
										className="cs_fs_50 cs_mb_22 aos zoomIn"
										data-aos="zoom-in"
									>
										{title}
									</h2>
									<p
										className="text-center mb-0 aos fadeInUp"
										data-aos="fade-up"
										data-aos-duration="800"
									>
										{subtitle}
									</p>
								</div>
							</div>
						</div>
					</div>
					<div className="cs_payments_logo_wrapper">
						{tools?.map((tool, index) => (
							<div
								className="cs_payment_logo cs_center_column cs_white_bg cs_radius_10 text-center"
								key={index}
							>
								<span className="cs_payment_icon cs_center">
									<img src={tool.icon} alt={`${tool.name} icon`} />
								</span>
								<h3 className="cs_fs_21 fw-semibold mb-0">{tool.name}</h3>
							</div>
						))}
					</div>
					<div className="cs_circular_shape position-absolute">
						<img src="/img/animated-object.svg" alt="Circular image" />
					</div>
				</div>
			</div>
		</section>
	);
};

export default IntegrationStyle1;
