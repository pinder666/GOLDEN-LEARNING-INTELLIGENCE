import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";

interface LinkItem {
	title: string;
	url: string;
}

interface FooterSection {
	title: string;
	links: LinkItem[];
}

interface FooterData {
	logo: string;
	desc: string;
	quickLinks: FooterSection;
	supportLinks: FooterSection;
	contactInfo: FooterSection;
}

interface FooterStyle3Props {
	data: FooterData;
}

const FooterStyle3: React.FC<FooterStyle3Props> = ({ data }) => {
	const { logo, desc, quickLinks, supportLinks, contactInfo } = data;

	const socialLinks = [
		{ icon: "fa6-brands:facebook", name: "Facebook" },
		{ icon: "fa6-brands:youtube", name: "YouTube" },
		{ icon: "fa6-brands:instagram", name: "Instagram" },
	];

	const contactMethods = [
		{
			type: "email",
			href: "mailto:contact@gosaas.com",
			icon: "/img/icons/envelopes.svg",
			text: "contact@gosaas.com",
		},
		{
			type: "phone",
			href: "tel:+5514545155540",
			icon: "/img/icons/phone-rotary.svg",
			text: "+55 145451 55540",
		},
	];

	return (
		<footer className="cs_footer cs_style_1 cs_type_2 position-relative overflow-hidden">
			<div className="cs_height_130 cs_height_lg_80" />
			<div className="container">
				<div className="cs_footer_main position-relative z-1">
					<div className="row cs_gap_y_30">
						{/* Brand Info Column */}
						<div className="col-xl-5 col-lg-4 col-md-7">
							<div className="cs_footer_widget cs_text_widget">
								<div
									className="cs_brand cs_mb_13 aos fadeInUp"
									data-aos="fade-up"
									data-aos-duration="800"
								>
									<img src={logo} alt="Logo" width="120" height="auto" />
								</div>
								<p className="cs_mb_27">{desc}</p>
								<div className="d-flex flex-column">
									{contactMethods.map((method) => (
										<a
											key={method.type}
											href={method.href}
											aria-label={`${method.type} contact link`}
											className={`cs_support_link cs_white_color cs_semibold ${
												method.type === "email" ? "cs_mb_23" : ""
											}`}
										>
											<span className="cs_support_icon cs_center cs_radius_100">
												<img
													src={method.icon}
													alt={`${method.type} icon`}
													width="20"
													height="20"
												/>
											</span>
											<span className="cs_support_text">{method.text}</span>
										</a>
									))}
								</div>
							</div>
						</div>

						{/* Quick Links Column */}
						<div className="col-xl-2 col-lg-2 col-md-4 offset-lg-0 offset-md-1">
							<div className="cs_footer_widget cs_links_widget">
								<h3 className="cs_footer_widget_title cs_fs_21 cs_white_color cs_mb_24">
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
								<h3 className="cs_footer_widget_title cs_fs_21 cs_white_color cs_mb_24">
									{supportLinks.title}
								</h3>
								<ul className="cs_footer_menu cs_mp_0">
									{supportLinks.links.map((item, index) => (
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

						{/* Contact Info Column */}
						<div className="col-xl-3 col-lg-3 col-md-4 offset-md-1 offset-lg-0">
							<div className="cs_footer_widget cs_contact_widget">
								<h3 className="cs_footer_widget_title cs_fs_21 cs_white_color cs_mb_24">
									{contactInfo.title}
								</h3>
								<ul className="cs_footer_menu cs_mp_0">
									{contactInfo.links.map((item, index) => (
										<li key={index}>
											{item.url ? (
												<Link
													to={item.url}
													aria-label={
														item.title.toLowerCase().includes("email")
															? "Email contact link"
															: "Phone contact link"
													}
												>
													{item.title}
												</Link>
											) : (
												<span>{item.title}</span>
											)}
										</li>
									))}
								</ul>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className="cs_height_62 cs_height_lg_40" />
			<hr />

			{/* Footer Bottom Section */}
			<div className="container">
				<div className="cs_footer_bottom position-relative z-1">
					<div className="cs_footer_text cs_white_color">
						Copyright ©{" "}
						<span className="cs_getting_year">{new Date().getFullYear()}</span>{" "}
						GoSaas theme by Laralink All Rights.
					</div>

					<div className="cs_social_links cs_style_1 cs_white_color">
						{socialLinks.map((social) => (
							<a
								href="#"
								key={social.name}
								aria-label={`${social.name} social link`}
							>
								<span className="cs_social_icon">
									<i>
										<Icon icon={social.icon} />
									</i>
								</span>
								<span>{social.name}</span>
							</a>
						))}
					</div>
				</div>
			</div>

			{/* Decorative Elements */}
			<div className="cs_ellipse_1 position-absolute" />
			<div className="cs_ellipse_2 position-absolute" />
			<div className="cs_ellipse_3 position-absolute" />
			<div className="cs_ellipse_4 position-absolute" />
			<div className="cs_vector_1 position-absolute">
				<img
					src="/img/vector_4.svg"
					alt="Decorative vector shape"
					width="100%"
					height="auto"
				/>
			</div>
		</footer>
	);
};

export default FooterStyle3;
