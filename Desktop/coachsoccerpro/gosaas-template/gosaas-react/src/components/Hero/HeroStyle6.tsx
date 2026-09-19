import { useState } from "react";
import { Link } from "react-router-dom";
import VideoModal from "../VideoModal";

interface HeroStyle6Props {
	data: {
		titleStart: string,
		highlightedText: string,
		titleEnd: string,
		subTitle: string,
		videoUrl: string,
		btnText1: string,
		btnText2: string,
		btnUrl2: string,
		imgUrl: string,
		brands: string[],
	};
}

const HeroStyle6: React.FC<HeroStyle6Props> = ({ data }) => {
	const {
		titleStart,
		highlightedText,
		titleEnd,
		subTitle,
		videoUrl,
		btnText1,
		btnText2,
		btnUrl2,
		imgUrl,
		brands,
	} = data;

	const [showVideo, setShowVideo] = useState(false);
	const [iframeSrc, setIframeSrc] = useState("about:blank");

	const handleVideoOpen = () => {
		setIframeSrc(videoUrl);
		setShowVideo(true);
	};

	const handleVideoClose = () => {
		setIframeSrc("about:blank");
		setShowVideo(false);
	};

	return (
		<>
			<section className="cs_hero cs_style_3 position-relative" id="home">
				<div className="container">
					<div className="cs_hero_content">
						<div className="row cs_gap_y_40 align-items-center position-relative z-1">
							{/* Thumbnail */}
							<div className="col-xl-5 order-xl-2">
								<div className="cs_hero_thumbnail">
									<img src={imgUrl} alt="Hero" />
									<div className="cs_height_40 cs_height_lg_40" />
									<div className="cs_horizontal_slider_wrapper cs_type_1">
										<div className="cs_slider_in">
											{[...Array(2)].map((_, i) => (
												<div className="cs_brands_list" key={i}>
													{brands?.map((brand, idx) => (
														<div className="cs_center" key={idx}>
															<img src={brand} alt={`Brand ${idx + 1}`} />
														</div>
													))}
												</div>
											))}
										</div>
									</div>
								</div>
							</div>

							{/* Text */}
							<div className="col-xl-7 order-xl-1 position-relative z-1">
								<div className="cs_hero_text p-0">
									<h1
										className="cs_hero_title cs_fs_68 cs_mb_28 aos fadeInDown"
										data-aos="fade-down"
										data-aos-duration="800"
									>
										{titleStart}{" "}
										<span className="position-relative">
											{highlightedText}
											<img
												src="/img/vector.svg"
												alt="Vector"
												className="cs_line_1 position-absolute"
											/>
											<img
												src="/img/vector-2.svg"
												alt="Vector"
												className="cs_line_2 position-absolute"
											/>
										</span>{" "}
										{titleEnd}
									</h1>
									<p className="cs_fs_21 cs_mb_42">{subTitle}</p>
									<div className="cs_btns_group">
										<span
											className="cs_btn cs_style_1 cs_type_1 cs_purple_bg cs_white_color cs_video_open fadeInLeft cursor-pointer"
											onClick={handleVideoOpen}
										>
											<svg
												width="24"
												height="25"
												viewBox="0 0 24 25"
												fill="none"
												xmlns="http://www.w3.org/2000/svg"
											>
												<path
													d="M12 22.5C17.5228 22.5 22 18.0228 22 12.5C22 6.97715 17.5228 2.5 12 2.5C6.47715 2.5 2 6.97715 2 12.5C2 18.0228 6.47715 22.5 12 22.5Z"
													stroke="white"
													strokeWidth="2"
													strokeLinecap="round"
													strokeLinejoin="round"
												/>
												<path
													d="M10 8.5L16 12.5L10 16.5V8.5Z"
													stroke="white"
													strokeWidth="2"
													strokeLinecap="round"
													strokeLinejoin="round"
												/>
											</svg>
											<span>{btnText1}</span>
										</span>
										<Link
											to={btnUrl2}
											className="cs_btn cs_style_1 cs_outline cs_semibold cs_heading_color fadeInRight"
											data-aos="fade-right"
											data-aos-duration="800"
										>
											<span className="cs_player_text">{btnText2}</span>
										</Link>
									</div>
								</div>
							</div>
						</div>
					</div>
					<div className="cs_hero_shape_1 cs_radius_100 position-absolute" />
				</div>
			</section>

			<VideoModal
				isTrue={showVideo}
				iframeSrc={iframeSrc}
				handelClose={handleVideoClose}
			/>
		</>
	);
};

export default HeroStyle6;
