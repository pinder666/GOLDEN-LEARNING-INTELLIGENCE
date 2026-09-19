import React from "react";
import parser from "html-react-parser";
import BlogSliderStyle1 from "../Slider/BlogSliderStyle1";

interface Blog {
	id: number;
	title: string;
	imgUrl: string;
	desc: string;
	date: string;
	author: string;
	blogSlug: string;
	categories?: string[];
	tags?: string[];
	content?: string;
	featured?: boolean;
	readTime?: string;
	commentsCount?: number;
}

interface BlogStyle1Props {
	data: {
		title: string;
		blogs: Blog[];
		subtitle?: string;
		viewAllLink?: string;
		showCategories?: boolean;
		showTags?: boolean;
	};
}

const BlogStyle1: React.FC<BlogStyle1Props> = ({ data }) => {
	const { title, blogs } = data;

	return (
		<section className="cs_slider cs_style_1 cs_slider_gap_24">
			<div className="cs_height_124 cs_height_lg_80"></div>
			<div className="container-fluid">
				<div className="cs_section_heading cs_style_1 text-center cs_mb_55">
					<h2
						className="cs_fs_50 mb-0 aos fadeInDown"
						data-aos="fade-down"
						data-aos-duration="800"
					>
						{parser(title)}
					</h2>
				</div>
				<div className="cs_post_slider_wrapper">
					<BlogSliderStyle1 blogs={blogs} />
				</div>
			</div>
		</section>
	);
};

export default BlogStyle1;
