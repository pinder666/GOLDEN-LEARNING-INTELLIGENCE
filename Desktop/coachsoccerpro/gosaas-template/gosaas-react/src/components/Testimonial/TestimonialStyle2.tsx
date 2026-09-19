import parser from "html-react-parser";
import "swiper/css";
import "swiper/css/pagination";
import TestimonialSliderStyle2 from "../Slider/TestimonialSliderStyle2";

interface Testimonial {
	id: number;
	name: string;
	designation?: string;
	message: string;
	avatar?: string;
	rating?: number;
}

interface TestimonialStyle2Props {
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

const TestimonialStyle2: React.FC<TestimonialStyle2Props> = ({ data }) => {
	const { title, testimonial } = data;

	// Adapter: map your incoming items to what the slider needs
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
		<section className="cs_slider cs_style_1 cs_slider_gap_24">
			<div className="cs_height_124 cs_height_lg_80" />
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
				<TestimonialSliderStyle2 testimonials={sliderTestimonials} />
			</div>
		</section>
	);
};

export default TestimonialStyle2;
