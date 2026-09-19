import { Icon } from "@iconify/react/dist/iconify.js";

interface CtaStyle9Props {
	data: {
		imgUrl: string;
		title: string;
		btnText: string;
	};
}

const CtaStyle9 = ({ data }: CtaStyle9Props) => {
	const { imgUrl, title, btnText } = data;

	return (
		<section className="cs_gray_bg_5">
			<div className="container">
				<div className="cs_support_content_wrapper">
					<div className="cs_support_text">
						<img
							src={imgUrl}
							alt="Group images"
							className="aos zoomIn"
							data-aos="zoom-in"
						/>
						<h3 className="cs_fs_29 fw-medium mb-0">{title}</h3>
					</div>
					<button
						type="button"
						aria-label="Open chat button"
						className="cs_btn cs_style_1 cs_heading_bg cs_purple_hover cs_fs_16 cs_white_color cs_semibold mt-0 fadeInRight"
						data-aos="fade-right"
						data-aos-duration="800"
					>
						<span>{btnText}</span>
						<span className="cs_btn_icon cs_center overflow-hidden">
							<Icon icon="fa6-solid:arrow-right" className="cs_custom_anim" />
						</span>
					</button>
				</div>
			</div>
		</section>
	);
};

export default CtaStyle9;
