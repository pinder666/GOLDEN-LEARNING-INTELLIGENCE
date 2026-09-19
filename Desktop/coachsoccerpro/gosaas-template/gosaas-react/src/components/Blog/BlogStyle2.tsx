import { Link } from "react-router-dom";
import BlogSidebarStyle1 from "./BlogSidebarStyle1";
import { FC } from "react";

interface BlogPost {
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

interface BlogStyle2Props {
	data: {
		blogs: BlogPost[];
		title?: string;
		subtitle?: string;
		viewAllLink?: string;
		className?: string;
	};
}

const BlogStyle2: FC<BlogStyle2Props> = ({ data }) => {
	const { blogs = [] } = data;

	return (
		<section className={`cs_blog_section ${data.className || ""}`}>
			<div className="container">
				<div className="row cs_gap_y_60">
					<div className="col-lg-3 order-lg-2 fadeInRight">
						<BlogSidebarStyle1 />
					</div>
					<div
						className="col-lg-9 order-lg-1 aos fadeInLeft"
						data-aos="fade-right"
						data-aos-duration="800"
					>
						{blogs.slice(4).map((item) => (
							<article className="cs_post cs_style_1 cs_mb_40" key={item.id}>
								<Link
									to={`/blog/${item.blogSlug}`}
									aria-label={`Read ${item.title}`}
									className="cs_post_thumbnail cs_radius_10"
								>
									<img src={item.imgUrl} alt={item.title} loading="lazy" />
								</Link>
								<div className="cs_post_content">
									<div className="cs_post_meta_wrapper cs_mb_8">
										<div className="cs_post_meta">By {item.author}</div>
										<div className="cs_post_meta">{item.date}</div>
										<div className="cs_post_meta">
											{item.commentsCount || 0} Comments
										</div>
									</div>
									<h3 className="cs_post_title cs_fs_38 cs_mb_15">
										<Link
											to={`/blog/${item.blogSlug}`}
											aria-label={`Read ${item.title}`}
										>
											{item.title}
										</Link>
									</h3>
									<p className="cs_post_subtitle cs_mb_33">{item.desc}</p>
									<Link
										to={`/blog/${item.blogSlug}`}
										aria-label={`Read more about ${item.title}`}
										className="cs_btn cs_style_1 cs_purple_bg cs_accent_hover cs_white_color cs_fs_16 cs_semibold cs_radius_30"
									>
										<span>Read more</span>
									</Link>
								</div>
							</article>
						))}
					</div>
				</div>
			</div>
		</section>
	);
};

export default BlogStyle2;
