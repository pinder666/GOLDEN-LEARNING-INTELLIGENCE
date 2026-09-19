import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Autoplay, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { useEffect, useRef, useState } from "react";
import type { Swiper as SwiperType } from "swiper";
import { Rating } from "react-simple-star-rating";

// Props interface (kept exactly as your current shape/keys)
interface Testimonial {
	avaterImgUrl: string;
	avaterName: string;
	avaterDesignation: string;
	desc: string;
	ratting: number;
}

interface TestimonialSliderStyle2Props {
	testimonials: Testimonial[];
}

const TestimonialSliderStyle2: React.FC<TestimonialSliderStyle2Props> = ({
	testimonials,
}) => {
	const paginationRef = useRef<HTMLDivElement | null>(null);
	const swiperRef = useRef<SwiperType | null>(null);
	const [isReady, setIsReady] = useState(false);

	// Bind pagination element after mount (and once swiper instance exists)
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
	}, []); // ref.current changes don't trigger effects; run once and also bind in onSwiper

	return (
		<div
			className="cs_react_slider cs_style_1"
			data-aos="fade-up"
			data-aos-duration="800"
		>
			<Swiper
				modules={[Pagination, Autoplay]}
				spaceBetween={24}
				slidesPerView={1}
				autoplay={{ delay: 5000 }}
				loop
				speed={1000}
				pagination={{
					el: paginationRef.current,
					clickable: true,
				}}
				onSwiper={(swiper) => {
					swiperRef.current = swiper;
					// Bind immediately too, in case refs are already available
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
					991: { slidesPerView: 2 },
					1199: { slidesPerView: 3 },
				}}
			>
				{testimonials?.map((item, index) => (
					<SwiperSlide className="cs_slider_wrapper aos fadeInUp" key={index}>
						<div className="cs_slide">
							<div className="cs_testimonial cs_style_2 cs_gray_bg_9 cs_radius_15 position-relative">
								<div className="cs_avatar cs_style_1 cs_mb_37">
									<span className="cs_avatar_icon cs_center cs_radius_100">
										<img
											src={item.avaterImgUrl}
											alt={`${item.avaterName} Avatar`}
										/>
									</span>
									<div className="cs_avatar_info">
										<h3 className="cs_fs_21 fw-normal">{item.avaterName}</h3>
										<p className="mb-0">{item.avaterDesignation}</p>
									</div>
								</div>

								<blockquote>{item.desc}</blockquote>

								<Rating
									initialValue={item.ratting}
									readonly
									fillColor="#00CC61"
									size={20}
								/>

								<span className="cs_quote_icon position-absolute">
									<img src="/img/icons/quote-right.svg" alt="Quote icon" />
								</span>
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
				data-aos-duration={800}
			/>
		</div>
	);
};

export default TestimonialSliderStyle2;
