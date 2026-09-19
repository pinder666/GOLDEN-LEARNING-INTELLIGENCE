import { Icon } from "@iconify/react/dist/iconify.js";
import React from "react";
import { Link } from "react-router-dom";

const Page404: React.FC = () => {
	return (
		<div>
			<div className="cs_height_130 cs_height_lg_80"></div>
			<div className="cs_page_not_found text-center">
				<h3 className="cs_404_title cs_accent_color mb-0">404</h3>
				<h4 className="cs_fs_50 mb-0 cs_heading_color">Page Not Found</h4>
				<p className="cs_mb_50">
					oops, the page you are looking for can't be found!
				</p>
				<Link
					to="/"
					className="cs_btn cs_style_1 cs_type_1 cs_purple_bg cs_fs_16 cs_semibold cs_white_color"
				>
					<Icon icon="fa6-solid:arrow-left" />
					<span>Back to Home</span>
				</Link>
			</div>
		</div>
	);
};

export default Page404;
