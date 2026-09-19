import React from "react";
import parser from "html-react-parser";
import TestimonialSliderStyle1 from "../Slider/TestimonialSliderStyle1";

interface Testimonial {
	id: number;
	name: string;
	designation?: string;
	message: string;
	avatar?: string;
	rating?: number;
}

interface TestimonialStyle1Props {
	data: {
		title: string;
		testimonial: Testimonial[];
	};
}

// Slider expects these misspelled keys; keep as-is to match the slider file
type SliderTestimonialItem = {
	id: number;
	avaterImgUrl: string;
	avaterName: string;
	avaterDesignation: string;
	desc: string;
	ratting: number;
};

const TestimonialStyle1: React.FC<TestimonialStyle1Props> = ({ data }) => {
	const { title, testimonial } = data;

	// Adapter: map your incoming items to the slider's expected shape
	const sliderTestimonials: SliderTestimonialItem[] = (testimonial ?? []).map(
		(t) => ({
			id: t.id,
			avaterImgUrl: t.avatar ?? "/img/avatars/default.png",
			avaterName: t.name ?? "",
			avaterDesignation: t.designation ?? "",
			desc: t.message ?? "",
			ratting: typeof t.rating === "number" ? t.rating : 0,
		})
	);

	return (
		<section>
			<div className="cs_height_120 cs_height_lg_70" />
			<div className="container">
				<div className="cs_section_heading cs_style_1 text-center cs_mb_55">
					<h2
						className="cs_fs_50 mb-0 aos fadeInDown"
						data-aos="fade-down"
						data-aos-duration="800"
					>
						{parser(title)}
					</h2>
				</div>
			</div>

			{/* Pass normalized data to the slider */}
			<TestimonialSliderStyle1 testimonial={sliderTestimonials} />

			<div className="cs_height_140 cs_height_lg_80" />
		</section>
	);
};

export default TestimonialStyle1;
