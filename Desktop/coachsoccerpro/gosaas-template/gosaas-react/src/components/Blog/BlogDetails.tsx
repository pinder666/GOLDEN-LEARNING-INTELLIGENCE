import { Icon } from "@iconify/react/dist/iconify.js";
import { useParams } from "react-router-dom";
import CommentForm from "../Contact/CommentForm";
import BlogSidebarStyle1 from "./BlogSidebarStyle1";

interface BlogData {
	title: string;
	imgUrl: string;
	desc: string;
	date: string;
	author: string;
	blogSlug: string;
}

const blogDataList: BlogData[] = [
	{
		title: "Strategies for your Post-Pandemic Workplace",
		imgUrl: "/img/post-5.jpg",
		desc: "Discover key strategies to adapt your workplace after the pandemic, from flexible policies and hybrid models to employee well-being, technology integration, and maintaining strong team collaboration post-crisis.",
		date: "Jun 25, 2025",
		author: "Emma Carter",
		blogSlug: "strategies-for-your-post-pandemic-workplace",
	},
	{
		title: "Making a Positive Impact Beyond your Profits",
		imgUrl: "/img/post-6.jpg",
		desc: "Explore how businesses can make a meaningful difference beyond financial success by focusing on sustainability, social responsibility, ethical practices, and creating value for communities and future generations.",
		date: "Aug 01, 2025",
		author: "Liam Bennett",
		blogSlug: "making-a-positive-impact-beyond-your-profits",
	},
	{
		title: "Protecting Your Business from Data Breaches",
		imgUrl: "/img/post-7.jpg",
		desc: "Learn how to shield your company from data breaches with strong cybersecurity practices, employee training, threat detection, backup strategies, secure systems, and a clear incident response plan.",
		date: "Sep 14, 2025",
		author: "Sophia Reynolds",
		blogSlug: "protecting-your-business-from-data-breaches",
	},
	{
		title: "Navigating the Complex Path to Corporate Growth",
		imgUrl: "/img/post-8.jpg",
		desc: "Understand how to grow your business strategically by leveraging innovation, market expansion, smart investments, performance tracking, and leadership development while managing risks and aligning with long-term vision.",
		date: "Jun 25, 2025",
		author: "Noah Mitchell",
		blogSlug: "navigating-the-complex-path-to-corporate-growth",
	},
	{
		title: "Enhancing User Experience with Custom Web Designs",
		imgUrl: "/img/post-1.jpg",
		desc: "Discover how custom web design can set your brand apart and create a more engaging user experience. This blog covers the benefits of personalized designs, from improving navigation to reinforcing brand identity.",
		date: "Jun 25, 2025",
		author: "Syful Khan",
		blogSlug: "enhancing-user-experience-with-custom-web-designs",
	},
	{
		title: "The Importance of SEO in Growing Your Online Store",
		imgUrl: "/img/post-2.jpg",
		desc: "Learn why SEO is essential for any online business and how it can help drive organic traffic to your store. This blog provides tips on optimizing product listings, keywords, and content to rank higher in search results.",
		date: "Aug 01, 2025",
		author: "Shariful UK",
		blogSlug: "the-importance-of-seo-in-growing-your-online-store",
	},
	{
		title: "Effective Marketing Strategies for Small Businesses",
		imgUrl: "/img/post-3.jpg",
		desc: "This blog offers actionable marketing strategies tailored for small businesses. Learn how to make the most of your limited resources with cost-effective tactics like content marketing, email campaigns, and local SEO.",
		date: "Sep 14, 2025",
		author: "Ripon Hossain",
		blogSlug: "effective-marketing-strategies-for-small-businesses",
	},
	{
		title: "How to Streamline Your Business with Automation",
		imgUrl: "/img/post-4.jpg",
		desc: "Discover how automation tools can help you save time, reduce errors, and improve productivity. This blog covers the best practices for automating tasks like order management, customer communication, and data syncing across different platforms.",
		date: "Jun 25, 2025",
		author: "Mamun",
		blogSlug: "how-to-streamline-your-business-with-automation",
	},
];

const BlogDetails = () => {
	const { blogSlug } = useParams<{ blogSlug: string }>();
	const blogData = blogDataList.find((item) => item.blogSlug === blogSlug);

	return (
		<section className="cs_blog_details">
			<div className="container">
				<div className="row cs_gap_y_60">
					<aside className="col-lg-3 offset-lg-1 order-lg-2 aos fadeInDown">
						<BlogSidebarStyle1 />
					</aside>
					<div
						className="col-lg-8 order-lg-1 aos fadeInLeft"
						data-aos="fade-right"
						data-aos-duration="800"
					>
						<div className="cs_post_details">
							<div className="cs_post_meta_wrapper cs_mb_13">
								<div className="cs_post_meta">
									By {blogData?.author || "Jenifar"}
								</div>
								<div className="cs_post_meta">
									{blogData?.date || "5 Jan 2025"}
								</div>
								<div className="cs_post_meta">0 Comments</div>
							</div>
							<h1>
								{blogData?.title ||
									"Enhancing User Experience with Custom Web Designs"}
							</h1>
							<img src={"/img/post-banner.jpg"} alt="Post banner" />
							<p>
								A Elit scelerisque mauris pellentesque pulvinar pellentesque
								habitant morbi tristique. Tortor posuere ac ut consequat semper
								viverra nam libero justo. Mauris commodo quis imperdiet massa
								tincidunt nunc pulvinar sapien et. Aliquam purus sit amet luctus
								venenatis lectus magna fringilla urna. Purus sit amet luctus
								venenatis lectus. Nunc aliquet bibendum enim facilisis. Pretium
								viverra suspendisse potenti nullam ac tortor vitae. Purus sit
								amet luctus venenatis lectus. Nunc aliquet bibendum enim
								facilisis. Pretium viverra suspendisse potenti nullam ac tortor
								vitae.
							</p>
							<article>
								<h2>Tailored to Your Audience</h2>
								<p>
									In today's digital landscape, user experience (UX) plays a
									crucial role in determining the success of a website. Custom
									web design is a powerful way to enhance UX, ensuring that your
									visitors enjoy seamless navigation, an intuitive interface,
									and a visually appealing environment. Here's how custom web
									designs can improve user experience and set your brand apart.
								</p>
								<p>
									Custom web designs allow you to create a website that caters
									specifically to your target audience. By understanding their
									needs, preferences, and behaviors, you can craft a user
									experience that feels personalized and relevant. This level of
									customization not only attracts more visitors but also keeps
									them engaged longer. A custom design gives you the flexibility
									to structure your website's layout in a way that makes it easy
									for users to find what they're looking for. Streamlined menus,
									intuitive buttons, and logical page hierarchies guide users
									smoothly through your site, reducing frustration and improving
									retention.
								</p>
							</article>
							<blockquote>
								<svg
									width={49}
									height={49}
									viewBox="0 0 49 49"
									fill="none"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										d="M40.5024 24.5H34.2608V19.3959C34.2608 16.5806 36.5 14.2917 39.2541 14.2917H39.8783C40.916 14.2917 41.7508 13.4383 41.7508 12.3776V8.5495C41.7508 7.48879 40.916 6.63544 39.8783 6.63544H39.2541C32.3571 6.63544 26.7708 12.3457 26.7708 19.3959V38.5365C26.7708 40.6499 28.4482 42.3646 30.5158 42.3646H40.5024C42.57 42.3646 44.2474 40.6499 44.2474 38.5365V28.3281C44.2474 26.2147 42.57 24.5 40.5024 24.5ZM18.0324 24.5H11.7908V19.3959C11.7908 16.5806 14.03 14.2917 16.7841 14.2917H17.4083C18.446 14.2917 19.2808 13.4383 19.2808 12.3776V8.5495C19.2808 7.48879 18.446 6.63544 17.4083 6.63544H16.7841C9.88707 6.63544 4.30078 12.3457 4.30078 19.3959V38.5365C4.30078 40.6499 5.97823 42.3646 8.04578 42.3646H18.0324C20.1 42.3646 21.7774 40.6499 21.7774 38.5365V28.3281C21.7774 26.2147 20.1 24.5 18.0324 24.5Z"
										fill="currentColor"
									/>
								</svg>
								But I must explain to you how all this mistaken idea of
								denouncing pleasure and praising pain was born and I will give
								you a complete account of the system, who expound the actual
								teachings of the great explorer.
								<small>Andrew Hobar</small>
							</blockquote>
							<article>
								<h2>Consistent Branding</h2>
								<p>
									Custom web design ensures that every aspect of your site
									reflects your brand identity. From the color scheme to
									typography and imagery, everything can be aligned with your
									brand's voice and values. Consistent branding builds trust and
									recognition, helping visitors feel connected to your business.
									With more users browsing on mobile devices, it's essential to
									have a website that looks and functions well across all screen
									sizes. A custom-designed site is optimized for responsiveness,
									ensuring that your content adjusts automatically, offering a
									flawless experience on desktops, tablets, and smartphones.
								</p>
							</article>
							<img src="/img/post-banner-2.jpg" alt="Post banner" />
							<p>
								Stand out from competitors with a visually distinctive design.
								Custom web design allows for creative freedom to make your site
								unique while aligning with the latest design trends and best
								practices. The result is a visually appealing website that
								leaves a lasting impression on users. With custom web design,
								you have the freedom to add tailored features and
								functionalities that meet the specific needs of your business.
								Whether it's integrating custom forms, interactive elements, or
								third-party tools, you can provide users.
							</p>
							<p>
								A well-designed custom website not only enhances user experience
								but also drives conversions. By strategically placing
								call-to-action buttons, using compelling visuals, and designing
								forms that are easy to fill out, you can guide users toward
								desired actions, such as making a purchase or signing up for a
								newsletter.
							</p>
							<ul>
								<li>An intuitive and visually appealing website design.</li>
								<li>
									Seamless integration of a booking system, allowing customers
									to schedule appointments effortlessly.
								</li>
								<li>
									Responsive design for optimal user experiences across various
									devices.
								</li>
								<li>
									Rigorous testing to ensure the website and booking system
									perform flawlessly.
								</li>
								<li>
									A content management system for easy updates and maintenance.
								</li>
								<li>
									Search engine optimization strategies to enhance online
									visibility.
								</li>
							</ul>
							<div className="cs_post_shares">
								<div className="cs_tags_wrapper">
									<h3>Tags:</h3>
									<div className="cs_post_tags">
										<a href="#">Spa</a>
										<a href="#">Beauty</a>
									</div>
								</div>
								<div className="cs_socials_wrapper">
									<h3>Shares:</h3>
									<div className="cs_social_links cs_heading_color">
										<a href="#">
											<Icon icon="fa6-brands:facebook-f" />
										</a>
										<a href="#">
											<Icon icon="fa6-brands:x-twitter" />
										</a>
										<a href="#">
											<Icon icon="fa6-brands:linkedin-in" />
										</a>
									</div>
								</div>
							</div>
							<div className="cs_post_btns_wrapper">
								<button className="cs_prev">
									<span>
										<Icon icon="fa6-solid:arrow-left-long" />
									</span>
									<span>Prev Post</span>
								</button>
								<button className="cs_prev">
									<span>Next Post</span>
									<span>
										<Icon icon="fa6-solid:arrow-right-long" />
									</span>
								</button>
							</div>
						</div>
						<div className="cs_height_77 cs_height_lg_50" />
						<div className="cs_reply_comment">
							<div className="cs_mb_33">
								<h2 className="cs_fs_50 cs_mb_14">Leave A Reply</h2>
								<p className="mb-0">
									Your email address will not be published. Required fields are
									marked *
								</p>
							</div>
							<CommentForm />
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};

export default BlogDetails;
