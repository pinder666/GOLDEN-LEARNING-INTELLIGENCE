import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";

interface AppStoreLink {
	title: string;
	subTitle: string;
	icon: string;
	url: string;
}

interface LinkItem {
	title: string;
	url: string;
	icon?: string;
	subTitle?: string;
}

interface FooterSection {
	title: string;
	links: Array<LinkItem | AppStoreLink>;
}

interface FooterData {
	logo: string;
	description: string;
	quickLinks: FooterSection;
	supportLinks: FooterSection;
	contactInfo: FooterSection;
}

type FooterVariant = "cs_type_1" | "cs_type_2" | "cs_type_3" | "cs_type_4";

interface FooterStyle4Props {
	data: FooterData;
	styleVariant?: FooterVariant;
}

const FooterStyle4: React.FC<FooterStyle4Props> = ({ data, styleVariant }) => {
	const { logo, description, quickLinks, supportLinks, contactInfo } = data;

	const socialLinks = [
		{ icon: "fa6-brands:facebook", name: "Facebook" },
		{ icon: "fa6-brands:youtube", name: "Youtube" },
		{ icon: "fa6-brands:instagram", name: "Instagram" },
	];

	return (
		<footer className={`cs_footer cs_style_1 ${styleVariant || ""}`}>
			<div className="cs_height_130 cs_height_lg_80" />
			<div className="container">
				<div className="cs_footer_main">
					<div className="row cs_gap_y_30">
						{/* Brand Info Column */}
						<div className="col-xl-5 col-lg-4 col-md-7">
							<div className="cs_footer_widget cs_text_widget">
								<div
									className="cs_brand cs_mb_10 aos fadeInUp"
									data-aos="fade-up"
									data-aos-duration="800"
								>
									<img src={logo} alt="Logo" width="120" height="auto" />
								</div>
								<p className="mb-0">{description}</p>
							</div>
						</div>

						{/* Quick Links Column */}
						<div className="col-xl-2 col-lg-2 col-md-4 offset-lg-0 offset-md-1">
							<div className="cs_footer_widget cs_links_widget">
								<h3 className="cs_footer_widget_title cs_fs_21 cs_mb_21">
									{quickLinks.title}
								</h3>
								<ul className="cs_footer_menu cs_mp_0">
									{quickLinks.links.map((item, index) => (
										<li key={index}>
											<Link
												to={item.url}
												className="text-capitalize"
												aria-label={`${item.title} page link`}
											>
												{item.title}
											</Link>
										</li>
									))}
								</ul>
							</div>
						</div>

						{/* Support Links Column */}
						<div className="col-xl-2 col-lg-3 col-md-7">
							<div className="cs_footer_widget cs_help_widget">
								<h3 className="cs_footer_widget_title cs_fs_21 cs_mb_21">
									{supportLinks.title}
								</h3>
								<ul className="cs_footer_menu cs_mp_0">
									{supportLinks.links.map((item) => (
										<li key={item.title}>
											<Link
												to={item.url}
												className="text-capitalize"
												aria-label={`${item.title} page link`}
											>
												{item.title}
											</Link>
										</li>
									))}
								</ul>
							</div>
						</div>

						{/* App Store Links Column */}
						<div className="col-xl-3 col-lg-3 col-md-4 offset-md-1 offset-lg-0">
							<div className="cs_footer_widget cs_contact_widget">
								<h3 className="cs_footer_widget_title cs_fs_21 cs_mb_24">
									{contactInfo.title}
								</h3>
								<div className="cs_btns_group position-relative">
									{contactInfo.links.map((item, index) => (
										<Link
											to={item.url}
											aria-label={`Download from ${item.title}`}
											className="cs_btn cs_style_2 cs_type_1 cs_heading_bg cs_radius_5 cs_white_color fadeInRight"
											data-aos="fade-right"
											data-aos-duration="800"
											key={index}
										>
											<span className="cs_btn_icon">
												<img
													src={item.icon}
													alt={`${item.title} icon`}
													width="24"
													height="24"
												/>
											</span>
											<div className="cs_btn_text_erapper">
												<p className="cs_fs_14 cs_semibold cs_mb_3">
													{item.subTitle}
												</p>
												<h3 className="cs_white_color cs_fs_18 mb-0">
													{item.title}
												</h3>
											</div>
										</Link>
									))}
								</div>
							</div>
						</div>
					</div>
				</div>

				<div className="cs_height_62 cs_height_lg_40" />

				{/* Footer Bottom Section */}
				<div className="cs_footer_bottom">
					<div className="cs_social_links cs_style_1 cs_heading_color">
						{socialLinks.map((social) => (
							<Link
								to="#"
								key={social.name}
								aria-label={`${social.name} social link`}
							>
								<span className="cs_social_icon cs_purple_color">
									<Icon icon={social.icon} />
								</span>
								<span>{social.name}</span>
							</Link>
						))}
					</div>

					<div className="cs_footer_text cs_heading_color">
						© Copyright{" "}
						<span className="cs_getting_year">{new Date().getFullYear()}</span>{" "}
						GoSaas theme by{" "}
						<Link
							target="_blank"
							to="https://laralink.com/"
							rel="noopener noreferrer"
							aria-label="Laralink website"
						>
							Laralink
						</Link>
					</div>
				</div>
			</div>
		</footer>
	);
};

export default FooterStyle4;
