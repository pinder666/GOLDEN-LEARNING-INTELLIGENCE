import { FC } from "react";

interface ServiceItem {
	icon: string;
	iconBg: string;
	title: string;
	desc: string;
}

interface ServiceStyle3Props {
	data: {
		title: string;
		subTitle: string;
		imgUrl: string;
		services: ServiceItem[];
	};
}

const ServiceStyle3: FC<ServiceStyle3Props> = ({ data }) => {
	const { title, subTitle, imgUrl, services } = data;

	return (
		<section>
			<div className="container">
				<div className="cs_card cs_style_1 cs_type_7">
					<div className="row cs_gap_y_40 align-items-xl-center">
						<div className="col-lg-6">
							<div
								className="cs_card_thumbnail cs_radius_10 aos fadeInLeft"
								data-aos="fade-right"
								data-aos-duration="800"
							>
								<img src={imgUrl} alt="Feature" />
							</div>
						</div>
						<div className="col-lg-6">
							<div className="cs_card_content">
								<div className="cs_section_heading cs_style_1 cs_mb_45">
									<h2
										className="cs_section_title cs_fs_50 cs_mb_30 aos fadeInDown"
										data-aos="fade-down"
										data-aos-duration="800"
									>
										{title || ""}
									</h2>
									<p
										className="mb-0 aos fadeInUp"
										data-aos="fade-up"
										data-aos-duration="800"
									>
										{subTitle || ""}
									</p>
								</div>
								<div className="row cs_row_gap_70 cs_gap_y_50">
									{services?.map((item, index) => (
										<div
											className="col-sm-6"
											key={index}
											data-aos="fade-up"
											data-aos-duration="800"
										>
											<div className="cs_iconbox cs_style_2 cs_type_2">
												<span
													className={`cs_iconbox_icon cs_center cs_radius_100 ${item.iconBg} cs_mb_25`}
												>
													<img src={item.icon} alt={item.title} />
												</span>
												<div className="cs_iconbox_info">
													<h3 className="cs_fs_21 cs_normal cs_mb_13">
														{item.title}
													</h3>
													<p className="mb-0">{item.desc}</p>
												</div>
											</div>
										</div>
									))}
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};

export default ServiceStyle3;
