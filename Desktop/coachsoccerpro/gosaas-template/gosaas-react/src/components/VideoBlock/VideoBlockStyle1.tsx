import { Icon } from "@iconify/react/dist/iconify.js";
import { useState } from "react";
import VideoModal from "../VideoModal";

interface VideoBlockStyle1Props {
	data: {
		videoUrl: string;
		imgUrl: string;
	};
}

export default function VideoBlockStyle1({ data }: VideoBlockStyle1Props) {
	const { videoUrl, imgUrl } = data;

	const [showVideo, setShowVideo] = useState<boolean>(false);
	const [iframeSrc, setIframeSrc] = useState<string>("about:blank");

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
			<section data-aos="fade-up" data-aos-duration="800">
				<div className="container">
					<div className="row">
						<div className="col-lg-10 offset-lg-1">
							<span
								aria-label="Click to open video modal"
								className="cs_video_block cs_style_1 cs_bg_filed cs_center cs_video_open cs_radius_10 position-relative cursor-pointer"
								style={{ backgroundImage: `url(${imgUrl})` }}
								onClick={handleVideoOpen}
							>
								<span
									className="cs_player_btn cs_style_2 cs_white_bg cs_fs_24 cs_heading_color cs_center cs_radius_100 aos zoomIn"
									data-aos="zoom-in"
								>
									<Icon icon="fa6-solid:play" />
								</span>
								<div className="cs_feature_shape_3 position-absolute">
									<img src="/img/hero_shape_1.svg" alt="Shape image" />
								</div>
							</span>
						</div>
					</div>
				</div>
			</section>

			<VideoModal
				isTrue={showVideo}
				iframeSrc={iframeSrc}
				handelClose={handleVideoClose}
			/>
		</>
	);
}
