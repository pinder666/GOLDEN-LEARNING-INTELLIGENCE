import { Outlet } from "react-router-dom";
import Footer from "../Footer/Footer";
import HeaderStyle5 from "../Header/HeaderStyle5";

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
	description: string;
	quickLinks: FooterSection;
	supportLinks: FooterSection;
	contactInfo: FooterSection;
}

const footerData: FooterData = {
	logo: "/img/logo.svg",
	description:
		"Our analytics application turns raw data into actionable insights, empowering businesses to make data-driven decisions and enhance performance.",
	quickLinks: {
		title: "Quick Links",
		links: [
			{ title: "home", url: "/" },
			{ title: "features", url: "/features" },
			{ title: "pricing", url: "/pricing" },
			{ title: "blog", url: "/blog" },
			{ title: "contact", url: "/contact" },
		],
	},
	supportLinks: {
		title: "Support",
		links: [
			{ title: "contact", url: "/contact" },
			{ title: "help", url: "/contact" },
			{ title: "resources", url: "#" },
			{ title: "terms & Condition", url: "/term-condition" }, // Fixed formatting
		],
	},
	contactInfo: {
		title: "Contact Info",
		links: [
			{ title: "24/7 Support Center", url: "" },
			{ title: "contact@gosaas.com", url: "mailto:contact@gosaas.com" },
			{ title: "(55) 1234-56789", url: "tel:(55) 1234-56789" },
			{ title: "10 am - 12 pm, Everyday", url: "" },
		],
	},
};

const LayoutStyle6 = () => {
	return (
		<div className="cs_site_wrapper">
			<HeaderStyle5 logo="/img/logo.svg" logoUrl="/" />
			<main className="cs_main_content">
				<Outlet />
			</main>
			<Footer data={footerData} />
		</div>
	);
};

export default LayoutStyle6;
