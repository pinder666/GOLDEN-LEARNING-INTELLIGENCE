import { FC, useEffect, useRef, useState } from "react";
import parser from "html-react-parser";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Autoplay, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link } from "react-router-dom";

interface FeatureItem {
	icon: string;
	icon_bg?: string;
	title: string;
	description: string;
}

interface FeaturesSliderStyle1Props {
	features: FeatureItem[];
}

const FeaturesSliderStyle1: FC<FeaturesSliderStyle1Props> = ({ features }) => {
	const paginationRef = useRef<HTMLDivElement | null>(null);
	const swiperRef = useRef<any>(null);
	const [isReady, setIsReady] = useState(false);

	useEffect(() => {
		if (
			swiperRef.current &&
			paginationRef.current &&
			swiperRef.current.params.pagination &&
			typeof swiperRef.current.params.pagination !== "boolean"
		) {
			swiperRef.current.params.pagination.el = paginationRef.current;
			swiperRef.current.pagination.init();
			swiperRef.current.pagination.render();
			swiperRef.current.pagination.update();
			setIsReady(true);
		}
	}, []);

	return (
		<div
			className="cs_react_slider cs_style_1 aos fadeInLeft"
			data-aos="fade-up"
			data-aos-duration="800"
		>
			<Swiper
				modules={[Pagination, Autoplay]}
				spaceBetween={24}
				slidesPerView={1}
				autoplay={{ delay: 5000 }}
				loop={true}
				speed={1000}
				pagination={{
					el: paginationRef.current,
					clickable: true,
				}}
				onSwiper={(swiper) => {
					swiperRef.current = swiper;
				}}
				breakpoints={{
					767: { slidesPerView: 2 },
					991: { slidesPerView: 2 },
					1199: { slidesPerView: 3 },
				}}
			>
				{features?.map((item, index) => (
					<SwiperSlide className="cs_slider_wrapper aos fadeInUp" key={index}>
						<div className="cs_slide">
							<div className="cs_iconbox cs_style_1 cs_type_1 cs_heading_bg cs_center_column cs_radius_15 text-center">
								<span
									className={`cs_iconbox_icon cs_center cs_radius_15 ${item.icon_bg} cs_mb_28`}
								>
									<img src={item.icon} alt="Feature icon" />
								</span>
								<div className="cs_iconbox_info">
									<h3 className="cs_iconbox_title cs_fs_29 cs_normal cs_white_color">
										{item.title}
									</h3>
									<p className="cs_iconbox_subtitle cs_fs_18 cs_border_color cs_mb_17">
										{parser(item.description)}
									</p>
									<Link
										to="/features"
										aria-label="Click to visit features page"
										className="cs_btn cs_style_1 cs_white_color cs_semibold cs_iconbox_btn"
									>
										<span>Learn More</span>
										<span className="cs_btn_icon cs_center overflow-hidden">
											<Icon
												icon="fa6-solid:arrow-right"
												className="cs_custom_anim2"
											/>
										</span>
									</Link>
								</div>
							</div>
						</div>
					</SwiperSlide>
				))}
			</Swiper>

			<div className="cs_height_70 cs_height_lg_50" />

			{/* Pagination container */}
			<div
				ref={paginationRef}
				className="swiper-pagination cs_pagination cs_style_1 aos fadeInDown"
				data-aos="fade-down"
				data-aos-duration="800"
			/>
		</div>
	);
};

export default FeaturesSliderStyle1;
