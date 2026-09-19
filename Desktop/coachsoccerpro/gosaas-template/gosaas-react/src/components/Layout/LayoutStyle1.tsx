import { Outlet } from "react-router-dom";
import Footer from "../Footer/Footer";
import HeaderStyle1 from "../Header/HeaderStyle1";

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
	logo: "/img/coachsoccerpronewlogo.png",
	description:
		"The coaching platform built for the beautiful game. Help every player feel seen.",
	quickLinks: {
		title: "Product",
		links: [
			{ title: "Features", url: "/features" },
			{ title: "Pricing", url: "/pricing" },
			{ title: "For Coaches", url: "/features" },
			{ title: "For Clubs", url: "/pricing" },
		],
	},
	supportLinks: {
		title: "Company",
		links: [
			{ title: "Contact", url: "/contact" },
			{ title: "Privacy Policy", url: "/privacy" },
			{ title: "Terms of Service", url: "/terms" },
		],
	},
	contactInfo: {
		title: "Contact",
		links: [
			{ title: "hello@soccercoachpro.com", url: "mailto:hello@soccercoachpro.com" },
		],
	},
};

const LayoutStyle1 = () => {
	return (
		<div className="cs_site_wrapper">
			<HeaderStyle1 logo="/img/coachsoccerpronewlogo.png" logoUrl="/" />
			<main className="cs_main_content">
				<Outlet />
			</main>
			<Footer data={footerData} styleVariant="cs_type_3" />
		</div>
	);
};

export default LayoutStyle1;
