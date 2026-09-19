import { Outlet } from "react-router-dom";
import FooterStyle2 from "../Footer/FooterStyle2";
import HeaderStyle6 from "../Header/HeaderStyle6";

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

const footerData: FooterData = {
	logo: "/img/coachsoccerpronewlogo.png",
	desc: "The coaching platform built for the beautiful game. Help every player feel seen.",
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

const LayoutStyle7 = () => {
	return (
		<div className="cs_site_wrapper">
			<HeaderStyle6 logo="/img/coachsoccerpronewlogo.png" logoUrl="/" />
			<div className="cs_height_100 cs_height_lg_80"></div>
			<main className="cs_main_content">
				<Outlet />
			</main>
			<FooterStyle2 data={footerData} />
		</div>
	);
};

export default LayoutStyle7;
