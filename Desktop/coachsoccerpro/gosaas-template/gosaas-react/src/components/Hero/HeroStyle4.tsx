import { useState } from "react";
import { Link } from "react-router-dom";
import VideoModal from "../VideoModal";

interface HeroStyle4Props {
	data: {
		title: string;
		subTitle: string;
		imgUrl: string;
		btnText1: string;
		btnUrl1: string;
		videoBtnText: string;
		videoSrc: string;
	};
}

const HeroStyle4: React.FC<HeroStyle4Props> = ({ data }) => {
	const { title, subTitle, imgUrl, btnText1, btnUrl1, videoBtnText, videoSrc } =
		data;

	const [iframeSrc, setIframeSrc] = useState<string>("");
	const [toggle, setToggle] = useState<boolean>(false);

	const handelClick = () => {
		setIframeSrc(videoSrc);
		setToggle(!toggle);
	};
	const handelClose = () => {
		setIframeSrc("about:blank");
		setToggle(!toggle);
	};

	return (
		<>
			<section className="cs_hero cs_style_1 position-relative" id="home">
				<div className="cs_hero_bg position-absolute"></div>
				<div className="container">
					<div className="cs_hero_content position-relative z-1">
						<div className="row align-items-center cs_gap_y_40">
							<div className="col-lg-6 order-lg-2">
								<div
									className="cs_hero_thumbnail position-relative aos fadeInLeft"
									data-aos="fade-right"
									data-aos-duration="800"
								>
									<div className="cs_hero_shape_vector position-absolute">
										<img src="/img/hero_shape_1.svg" alt="Vector Shape" />
									</div>

									<img src={imgUrl} alt="Hero Image" />
								</div>
							</div>
							<div className="col-lg-6 order-lg-1">
								<div className="cs_hero_text">
									<h1
										className="cs_hero_title cs_fs_68 aos fadeInDown"
										data-aos="fade-down"
										data-aos-duration="800"
									>
										{title}
									</h1>
									<p className="cs_hero_subtitle">{subTitle}</p>
									<div className="cs_btn_group position-relative">
										<Link
											to={btnUrl1}
											aria-label="Sign up button"
											className="cs_btn cs_style_1 cs_accent_bg cs_white_color aos fadeInLeft"
											data-aos="fade-right"
											data-aos-duration="800"
										>
											<span>{btnText1}</span>
										</Link>
										<span
											onClick={handelClick}
											aria-label="Demo video open button"
											className="cs_player_btn cs_semibold cs_heading_color cs_video_open fadeInRight cursor-pointer"
										>
											<span className="cs_play_btn_icon cs_center cs_radius_100">
												<span></span>
											</span>
											<span className="cs_player_text">{videoBtnText}</span>
										</span>
										<div className="cs_hero_shape_1 position-absolute">
											<img src="/img/arrow_shape_1.svg" alt="Arrow Shape" />
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>
			<VideoModal
				isTrue={toggle}
				iframeSrc={iframeSrc}
				handelClose={handelClose}
			/>
		</>
	);
};

export default HeroStyle4;
