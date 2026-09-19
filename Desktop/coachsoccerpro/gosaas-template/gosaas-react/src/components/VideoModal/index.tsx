import React from "react";

interface VideoModalProps {
	isTrue: boolean;
	iframeSrc: string;
	handelClose: () => void;
}

export default function VideoModal({
	isTrue,
	iframeSrc,
	handelClose,
}: VideoModalProps) {
	return (
		<div className={`cs_video_popup ${isTrue ? "active" : ""}`}>
			<div className="cs_video_popup-overlay"></div>
			<div className="cs_video_popup-content">
				<div className="cs_video_popup-layer"></div>
				<div className="cs_video_popup-container">
					<div className="cs_video_popup-align">
						<div className="embed-responsive embed-responsive-16by9">
							{iframeSrc && (
								<iframe
									className="embed-responsive-item"
									src={iframeSrc}
									title="Video"
									allow="autoplay; fullscreen"
								/>
							)}
						</div>
					</div>
					<div className="cs_video_popup-close" onClick={handelClose}></div>
				</div>
			</div>
		</div>
	);
}
