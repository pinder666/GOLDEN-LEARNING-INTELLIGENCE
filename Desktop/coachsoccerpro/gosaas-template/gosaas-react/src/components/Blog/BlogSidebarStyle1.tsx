import React from "react";
import { Link } from "react-router-dom";

const BlogSidebarStyle1: React.FC = () => {
	return (
		<aside
			className="cs_sidebar cs_style_1"
			data-aos="fade-left"
			data-aos-duration="800"
		>
			<div className="cs_sidebar_widget">
				<form action="#" className="cs_search_form position-relative">
					<span className="cs_search_icon">
						<i className="fa-solid fa-magnifying-glass" />
					</span>
					<input
						type="search"
						placeholder="Search.."
						className="cs_form_field cs_radius_30"
					/>
				</form>
			</div>
			<div className="cs_sidebar_widget">
				<h3 className="cs_widget_title cs_fs_29 cs_normal cs_mb_16">
					Categories
				</h3>
				<ul className="cs_category_list cs_mp_0">
					<li>
						<a href="#" aria-label="Post category link">
							Agency (0)
						</a>
					</li>
					<li>
						<a href="#" aria-label="Post category link">
							Business (2)
						</a>
					</li>
					<li>
						<a href="#" aria-label="Post category link">
							SEO (2)
						</a>
					</li>
					<li>
						<a href="#" aria-label="Post category link">
							Corporate (5)
						</a>
					</li>
					<li>
						<a href="#" aria-label="Post category link">
							Artificial Intelligence (1)
						</a>
					</li>
					<li>
						<a href="#" aria-label="Post category link">
							Application (3)
						</a>
					</li>
				</ul>
			</div>
			<div className="cs_sidebar_widget">
				<h3 className="cs_widget_title cs_fs_29 cs_normal cs_mb_23">
					Latest Post
				</h3>
				<ul className="cs_latestpost_list cs_mp_0">
					<li>
						<div className="cs_latest_post cs_style_1">
							<h3 className="cs_fs_21 cs_normal cs_mb_6">
								<Link
									to="/blog/blog-details"
									aria-label="Read post details link"
								>
									The Future of Multivendor Marketplaces
								</Link>
							</h3>
							<p className="mb-0">Apr 10, 2024</p>
						</div>
					</li>
					<li>
						<div className="cs_latest_post cs_style_1">
							<h3 className="cs_fs_21 cs_normal cs_mb_6">
								<Link
									to="/blog/blog-details"
									aria-label="Read post details link"
								>
									Effective Marketing Strategies for Small Businesses
								</Link>
							</h3>
							<p className="mb-0">May 15, 2024</p>
						</div>
					</li>
					<li>
						<div className="cs_latest_post cs_style_1">
							<h3 className="cs_fs_21 cs_normal cs_mb_6">
								<Link
									to="/blog/blog-details"
									aria-label="Read post details link"
								>
									The Importance of SEO in Growing Your Online Store
								</Link>
							</h3>
							<p className="mb-0">Jun 05, 2024</p>
						</div>
					</li>
					<li>
						<div className="cs_latest_post cs_style_1">
							<h3 className="cs_fs_21 cs_normal cs_mb_6">
								<Link
									to="/blog/blog-details"
									aria-label="Read post details link"
								>
									Enhancing User Experience with Custom Web Designs
								</Link>
							</h3>
							<p className="mb-0">July 27, 2024</p>
						</div>
					</li>
				</ul>
			</div>
			<div className="cs_sidebar_widget">
				<h3 className="cs_widget_title cs_fs_29 cs_normal cs_mb_30">
					Popular tags
				</h3>
				<div className="cs_tags">
					<a
						href="#"
						aria-label="Post tag link"
						className="cs_tag_link cs_radius_20"
					>
						Business
					</a>
					<a
						href="#"
						aria-label="Post tag link"
						className="cs_tag_link cs_radius_20"
					>
						Internet
					</a>
					<a
						href="#"
						aria-label="Post tag link"
						className="cs_tag_link cs_radius_20"
					>
						Startup
					</a>
					<a
						href="#"
						aria-label="Post tag link"
						className="cs_tag_link cs_radius_20"
					>
						Search Engine
					</a>
					<a
						href="#"
						aria-label="Post tag link"
						className="cs_tag_link cs_radius_20"
					>
						Mobile
					</a>
					<a
						href="#"
						aria-label="Post tag link"
						className="cs_tag_link cs_radius_20"
					>
						UI/UX
					</a>
					<a
						href="#"
						aria-label="Post tag link"
						className="cs_tag_link cs_radius_20"
					>
						Corporate
					</a>
				</div>
			</div>
		</aside>
	);
};

export default BlogSidebarStyle1;
