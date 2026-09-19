import React from "react";

const Preloader: React.FC = () => {
	return (
		<div className="cs_preloader cs_white_bg">
			<div className="cs_preloader_in position-relative">
				<span></span>
				<span></span>
			</div>
		</div>
	);
};

export default Preloader;
