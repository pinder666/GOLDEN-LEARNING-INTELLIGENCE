import { Link } from "react-router-dom";

interface StoreLink {
	url: string;
	title: string;
	subTitle: string;
}

interface CtaStyle6Props {
	data: {
		title: string;
		subTitle: string;
		imgUrl: string;
		quoteImg: string;
		playStore: StoreLink;
		appStore: StoreLink;
	};
}

const CtaStyle6 = ({ data }: CtaStyle6Props) => {
	const { title, subTitle, imgUrl, quoteImg, playStore, appStore } = data;

	return (
		<section>
			<div className="container">
				<div className="cs_cta cs_style_1 cs_heading_bg cs_radius_40 position-relative overflow-hidden">
					<div
						className="cs_cta_thumbnail aos fadeInUp"
						data-aos="fade-up"
						data-aos-duration="800"
					>
						<img src={imgUrl} alt="Cta image" />
						<span className="cs_quote_text_img position-absolute">
							<img src={quoteImg} alt="Quote text image" />
						</span>
					</div>

					<div className="cs_cta_text position-relative z-3">
						<h2
							className="cs_fs_50 cs_white_color cs_mb_17 aos fadeInDown"
							data-aos="fade-down"
							data-aos-duration="800"
						>
							{title}
						</h2>
						<p className="cs_border_color cs_mb_23">{subTitle}</p>

						<div className="cs_btns_group">
							<Link
								to={appStore.url}
								aria-label="App store button"
								className="cs_btn cs_style_2 cs_type_1 cs_radius_5 cs_heading_bg cs_white_color aos fadeInLeft"
								data-aos="fade-right"
								data-aos-duration="800"
							>
								<span className="cs_btn_icon">
									<svg
										width="26"
										height="31"
										viewBox="0 0 26 31"
										fill="none"
										xmlns="http://www.w3.org/2000/svg"
									>
										<path
											d="M21.6011 16.4212C21.6165 15.2527 21.9352 14.107 22.5274 13.0907C23.1196 12.0743 23.9662 11.2204 24.9883 10.6084C24.339 9.70514 23.4824 8.96182 22.4865 8.43744C21.4907 7.91307 20.383 7.62209 19.2516 7.58761C16.8379 7.34084 14.4979 8.99437 13.268 8.99437C12.0142 8.99437 10.1205 7.61211 8.08127 7.65297C6.76225 7.69448 5.47675 8.06807 4.35004 8.73736C3.22333 9.40664 2.29382 10.3488 1.65209 11.472C-1.12776 16.1598 0.945757 23.0493 3.60862 26.8385C4.94091 28.694 6.49797 30.7666 8.53535 30.6931C10.5291 30.6126 11.2737 29.4549 13.6802 29.4549C16.0645 29.4549 16.7631 30.6931 18.8418 30.6464C20.9811 30.6126 22.329 28.7827 23.6145 26.9096C24.5718 25.5875 25.3084 24.1263 25.7971 22.5801C24.5542 22.0681 23.4935 21.211 22.7473 20.1158C22.0012 19.0206 21.6025 17.7357 21.6011 16.4212Z"
											fill="currentColor"
										/>
										<path
											d="M17.6743 5.09536C18.8407 3.73147 19.4154 1.97842 19.2762 0.208496C17.4942 0.390805 15.848 1.22039 14.6658 2.53195C14.0878 3.17268 13.6451 3.91809 13.363 4.72557C13.0809 5.53305 12.965 6.38676 13.0219 7.2379C13.9132 7.24684 14.7951 7.05866 15.6009 6.68754C16.4068 6.31641 17.1157 5.77202 17.6743 5.09536Z"
											fill="currentColor"
										/>
									</svg>
								</span>
								<div className="cs_btn_text_erapper">
									<p className="cs_fs_14 cs_semibold cs_mb_3">
										{appStore.subTitle}
									</p>
									<h3 className="cs_fs_22 cs_white_color mb-0">
										{appStore.title}
									</h3>
								</div>
							</Link>

							<Link
								to={playStore.url}
								aria-label="Play store button"
								className="cs_btn cs_style_2 cs_type_1 cs_radius_5 cs_heading_bg cs_white_color  fadeInRight"
								data-aos="fade-right"
								data-aos-duration="800"
							>
								<span className="cs_btn_icon">
									<img src="/img/icons/playstore.svg" alt="Play store icon" />
								</span>
								<div className="cs_btn_text_erapper">
									<p className="cs_fs_14 cs_semibold cs_mb_3">
										{playStore.subTitle}
									</p>
									<h3 className="cs_fs_22 cs_white_color mb-0">
										{playStore.title}
									</h3>
								</div>
							</Link>
						</div>
					</div>

					{/* Decorative shapes */}
					<div className="cs_ellipse_1 cs_radius_100 position-absolute"></div>
					<div className="cs_ellipse_2 cs_radius_100 position-absolute"></div>
					<div className="cs_vector_1 cs_border_color position-absolute">
						<svg
							width="47"
							height="51"
							viewBox="0 0 47 51"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M1.04162 42.5091C4.00744 46.6198 11.8266 53.2485 19.3766 46.8769C24.494 40.4603 21.1718 32.7965 18.8711 29.7666C17.7788 28.0747 14.931 24.9911 12.278 26.1916C9.62491 27.3922 11.1462 31.0761 12.2385 32.768C15.1312 36.3841 22.9583 41.6975 31.1244 34.0219C39.2905 26.3463 34.7896 16.6331 31.5184 12.7359C27.7525 8.91175 20.6412 3.42528 22.3227 12.0724C24.7957 20.6026 32.9871 19.2579 36.7737 17.5193C39.9008 15.8781 46.1157 10.2766 45.9585 0.999964"
								stroke="currentColor"
								strokeLinecap="round"
							/>
						</svg>
					</div>
				</div>
			</div>
		</section>
	);
};

export default CtaStyle6;
