import { FC, useEffect, useRef, useState } from "react";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Autoplay, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

interface InterfaceImage {
	imgUrl: string;
}

interface InterfaceSliderStyle1Props {
	interfaceImages: InterfaceImage[];
}

const InterfaceSliderStyle1: FC<InterfaceSliderStyle1Props> = ({
	interfaceImages,
}) => {
	const paginationRef = useRef<HTMLDivElement | null>(null);
	const swiperRef = useRef<SwiperType | null>(null);
	const [isReady, setIsReady] = useState(false);

	// Bind pagination after mount (refs don’t trigger effects when .current changes)
	useEffect(() => {
		const swiper = swiperRef.current;
		const paginationEl = paginationRef.current;

		if (
			swiper &&
			paginationEl &&
			swiper.params.pagination &&
			typeof swiper.params.pagination !== "boolean"
		) {
			swiper.params.pagination.el = paginationEl;
			swiper.pagination.init();
			swiper.pagination.render();
			swiper.pagination.update();
			setIsReady(true);
		}
	}, []);

	return (
		<div
			className="cs_react_slider cs_style_2"
			data-aos="fade-up"
			data-aos-duration="800"
		>
			<Swiper
				modules={[Pagination, Autoplay]}
				spaceBetween={24}
				slidesPerView={1}
				loop
				speed={1000}
				autoplay={{ delay: 5000 }}
				pagination={{
					el: paginationRef.current,
					clickable: true,
				}}
				onSwiper={(swiper) => {
					swiperRef.current = swiper;
					// Also bind immediately in case refs are already set
					const paginationEl = paginationRef.current;
					if (
						paginationEl &&
						swiper.params.pagination &&
						typeof swiper.params.pagination !== "boolean"
					) {
						swiper.params.pagination.el = paginationEl;
						swiper.pagination.init();
						swiper.pagination.render();
						swiper.pagination.update();
						setIsReady(true);
					}
				}}
				breakpoints={{
					767: { slidesPerView: 2 },
					991: { slidesPerView: 3 },
					1199: { slidesPerView: 4 },
				}}
			>
				{interfaceImages?.map((item, index) => (
					<SwiperSlide key={index}>
						<div className="cs_card cs_style_4 cs_white_bg cs_radius_15">
							<img
								src={item.imgUrl}
								alt={`Interface preview ${index + 1}`}
								loading="lazy"
							/>
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

export default InterfaceSliderStyle1;
