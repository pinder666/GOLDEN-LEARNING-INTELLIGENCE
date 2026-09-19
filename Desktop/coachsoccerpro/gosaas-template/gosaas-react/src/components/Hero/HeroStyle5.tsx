import { Link } from "react-router-dom";

interface StoreButton {
	url: string;
	title: string;
	subTitle: string;
	icon?: string;
}

interface HeroStyle5Props {
	data: {
		mintTitle: string,
		title: string,
		subTitle: string,
		imgUrl: string,
		appStore: StoreButton,
		playStore: StoreButton,
	};
}

const HeroStyle5: React.FC<HeroStyle5Props> = ({ data }) => {
	const { mintTitle, title, subTitle, imgUrl, appStore, playStore } = data;

	return (
		<section
			className="cs_hero cs_style_2 cs_purple_bg position-relative"
			id="home"
		>
			<div className="container">
				<div className="cs_hero_content">
					<div className="row cs_gap_y_40 align-items-center">
						<div className="col-xl-6">
							<div className="cs_hero_text">
								<p className="cs_hero_subtitle cs_fs_16 cs_medium cs_white_color cs_mb_20">
									{mintTitle}
								</p>
								<h1
									className="cs_hero_title cs_fs_68 cs_white_color cs_mb_28 aos fadeInDown"
									data-aos="fade-down"
									data-aos-duration="800"
								>
									{title}
								</h1>
								<p className="cs_fs_21 cs_border_color cs_mb_42">{subTitle}</p>
								<div className="cs_btns_group d-flex flex-wrap gap-3">
									<Link
										to={appStore.url}
										aria-label="App store button"
										className="cs_btn cs_style_2 cs_radius_5 cs_white_bg cs_heading_color aos fadeInLeft"
										data-aos="fade-right"
										data-aos-duration="800"
									>
										<span className="cs_btn_icon">
											{/* SVG or icon already provided */}
										</span>
										<div className="cs_btn_text_erapper">
											<p className="cs_fs_14 cs_semibold cs_mb_3">
												{appStore.subTitle}
											</p>
											<h3 className="cs_fs_22 mb-0">{appStore.title}</h3>
										</div>
									</Link>
									<Link
										to={playStore.url}
										aria-label="Play store button"
										className="cs_btn cs_style_2 cs_type_1 cs_radius_5 cs_white_color fadeInRight"
										data-aos="fade-right"
										data-aos-duration="800"
									>
										<span className="cs_btn_icon">
											{playStore.icon && <img src={playStore.icon} alt="" />}
										</span>
										<div className="cs_btn_text_erapper">
											<p className="cs_fs_14 cs_semibold cs_mb_3">
												{playStore.subTitle}
											</p>
											<h3 className="cs_fs_22 mb-0 cs_white_color">
												{playStore.title}
											</h3>
										</div>
									</Link>
								</div>
							</div>
						</div>
						<div className="col-xl-6">
							<div className="cs_hero_thumbnail">
								<img src={imgUrl} alt="Hero Image" />
							</div>
						</div>
					</div>
				</div>

				{/* Background Shapes */}
				<div className="cs_hero_shape_1 cs_radius_100 position-absolute"></div>
				<div className="cs_hero_shape_2 cs_radius_100 position-absolute"></div>
				<div className="cs_hero_shape_3 cs_radius_100 position-absolute"></div>
				<div className="cs_hero_shape_4 cs_radius_100 position-absolute"></div>
				<div className="cs_hero_shape_5 cs_radius_100 position-absolute"></div>
			</div>
		</section>
	);
};

export default HeroStyle5;
