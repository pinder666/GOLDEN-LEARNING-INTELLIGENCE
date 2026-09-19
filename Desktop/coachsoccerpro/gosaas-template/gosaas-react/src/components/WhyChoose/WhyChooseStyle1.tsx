import parser from "html-react-parser";

interface Service {
	icon: string;
	title: string;
	desc: string;
}

interface WhyChooseData {
	mintTitle: string;
	title: string;
	imgUrl: string;
	services: Service[];
}

interface WhyChooseStyle1Props {
	data: WhyChooseData;
}

const WhyChooseStyle1 = ({ data }: WhyChooseStyle1Props) => {
	const { mintTitle, title, imgUrl, services } = data;
	return (
		<section>
			<div className="container">
				<div className="cs_card cs_style_1 cs_type_3">
					<div className="row cs_gap_y_40 position-relative">
						<div className="col-lg-6 order-lg-2 position-relative">
							<div
								className="cs_card_thumbnail  fadeInRight"
								data-aos="fade-right"
								data-aos-duration="800"
							>
								<img src={imgUrl} alt="Feature image" />
								<div className="cs_blob_1 position-absolute" />
								<div className="cs_feature_shape_3 position-absolute">
									<img src="/img/hero_shape_1.svg" alt="Shape image" />
								</div>
								<div className="cs_text_check_wrap position-absolute">
									<div className="cs_iconbox cs_style_3 cs_purple_bg cs_radius_15">
										<span className="cs_iconbox_icon cs_center cs_accent_color">
											<svg
												width={24}
												height={24}
												viewBox="0 0 24 24"
												fill="none"
												xmlns="http://www.w3.org/2000/svg"
											>
												<g clipPath="url(#clip0_1573_7212)">
													<path
														d="M19.259 2.41188L12 0.00488281L4.741 2.41188C3.101 2.95588 2 4.48088 2 6.20888V11.9639C2 18.5309 9.006 22.5409 11.15 23.6119L11.956 24.0159L12.794 23.6799C14.953 22.8099 22 19.3949 22 11.9629V6.20788C22 4.47988 20.898 2.95588 19.259 2.41188ZM20 11.9639C20 18.1419 13.914 21.0729 12.048 21.8249C10.16 20.8809 4.001 17.3839 4.001 11.9639V6.20888C4.001 5.34588 4.552 4.58188 5.371 4.31088L12.001 2.11288L18.631 4.31088C19.45 4.58188 20.001 5.34588 20.001 6.20888L20 11.9639ZM14.5 9.49988C14.5 10.5249 13.883 11.4059 13 11.7909V15.9999H11V11.7909C10.117 11.4049 9.5 10.5249 9.5 9.49988C9.5 8.11888 10.619 6.99988 12 6.99988C13.381 6.99988 14.5 8.11888 14.5 9.49988Z"
														fill="currentColor"
													/>
												</g>
												<defs>
													<clipPath id="clip0_1573_7212">
														<rect width={24} height={24} fill="white" />
													</clipPath>
												</defs>
											</svg>
										</span>
										<h3 className="cs_fs_18 cs_white_color fw-semibold mb-0">
											Advance Security
										</h3>
									</div>
									<span className="cs_arrow">
										<img src="/img/icons/arrow-right.svg" alt="Arrow" />
									</span>
								</div>
								<div className="cs_aiassistant_wrap position-absolute">
									<div className="cs_iconbox cs_style_3 cs_heading_bg cs_radius_15">
										<span className="cs_iconbox_icon cs_center cs_accent_color">
											<svg
												width={35}
												height={35}
												viewBox="0 0 35 35"
												fill="none"
												xmlns="http://www.w3.org/2000/svg"
											>
												<g clipPath="url(#clip0_1668_202)">
													<path
														d="M30.6248 31.3543V35.0001H27.7081V31.3543C27.7081 29.3432 26.0733 27.7084 24.0623 27.7084H10.9373C8.92768 27.7084 7.29143 29.3432 7.29143 31.3543V35.0001H4.37477V31.3543C4.37477 27.7362 7.31914 24.7918 10.9373 24.7918H24.0623C27.6804 24.7918 30.6248 27.7362 30.6248 31.3543ZM18.7014 8.88865C20.5316 9.31011 22.0235 10.7903 22.4566 12.6176C22.7498 13.8528 22.5893 15.037 22.1096 16.0418H24.0141C24.7448 16.0418 25.3835 15.5051 25.4681 14.7789C25.5673 13.9228 25.5308 13.0259 25.3354 12.1087C24.6879 9.07678 22.2277 6.63115 19.1914 6.00699C14.0333 4.94678 9.48039 8.8799 9.48039 13.8543C9.48039 15.9966 10.3248 17.9449 11.6971 19.3843C11.7554 18.1476 12.2016 17.0116 12.9162 16.0943C12.5837 15.4176 12.3971 14.6564 12.3971 13.8528C12.3971 10.6459 15.3691 8.12011 18.7029 8.8872L18.7014 8.88865ZM10.02 5.87428C12.2498 3.78449 15.1693 2.75199 18.2304 2.94157C23.9529 3.31199 28.4373 8.2922 28.4373 14.2787C28.4373 16.8599 26.3387 18.9584 23.7575 18.9584H20.2618C19.9075 17.7466 18.7889 16.8599 17.4618 16.8599C15.8504 16.8599 14.5452 18.1651 14.5452 19.7766C14.5452 21.388 15.8504 22.6932 17.4618 22.6932C18.2479 22.6932 18.9625 22.3812 19.486 21.8751H23.756C27.9443 21.8751 31.3525 18.467 31.3525 14.2787C31.3539 6.75803 25.6723 0.498862 18.4185 0.0307374C14.5335 -0.221554 10.8483 1.09824 8.02643 3.74657C5.42039 6.18928 3.85414 9.57407 3.66602 13.1266H6.58706C6.76643 10.3514 7.96956 7.79782 10.0214 5.87428H10.02Z"
														fill="currentColor"
													/>
												</g>
												<defs>
													<clipPath id="clip0_1668_202">
														<rect width={35} height={35} fill="white" />
													</clipPath>
												</defs>
											</svg>
										</span>
										<h3 className="cs_fs_18 cs_white_color fw-semibold mb-0">
											Live Support
										</h3>
									</div>
									<span className="cs_arrow cs_rotate_180">
										<img src="/img/icons/arrow-right.svg" alt="Arrow" />
									</span>
								</div>
							</div>
						</div>
						<div className="col-lg-6 order-lg-1">
							<div className="cs_card_content">
								<div className="cs_section_heading cs_style_1 cs_mb_51">
									<p className="cs_fs_16 cs_semibold cs_mb_11">{mintTitle}</p>
									<h2
										className="cs_section_title cs_fs_50 cs_bold mb-0 aos fadeInDown"
										data-aos="fade-down"
										data-aos-duration="800"
									>
										{parser(title)}
									</h2>
								</div>
								<div className="cs_iconbox_wrapper">
									{services?.map((item, index) => (
										<div
											className="cs_iconbox cs_style_4 cs_mb_23 aos fadeInLeft"
											data-aos="fade-right"
											data-aos-duration="800"
											key={index}
										>
											<span className="cs_iconbox_icon cs_center cs_radius_100">
												<img src={item.icon} />
											</span>
											<div className="cs_iconbox_info">
												<h3 className="cs_fs_21 cs_mb_6 fw-semibold">
													{item.title}
												</h3>
												<p className="mb-0">{item.desc}</p>
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

export default WhyChooseStyle1;
