import { Outlet } from "react-router-dom";
import FooterStyle4 from "../Footer/FooterStyle4";
import HeaderStyle4 from "../Header/HeaderStyle4";

interface AppStoreLink {
	title: string;
	subTitle: string;
	icon: string;
	url: string;
}

interface LinkItem {
	title: string;
	url: string;
	subTitle?: string;
	icon?: string;
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

const footerData: FooterData = {
	logo: "/img/logo.svg",
	description:
		"Our analytics application turns raw data into actionable insights, empowering businesses to make data-driven decisions and enhance performance.",
	quickLinks: {
		title: "Useful Links",
		links: [
			{ title: "home", url: "/" },
			{ title: "features", url: "/features" },
			{ title: "pricing", url: "/pricing" },
			{ title: "blog", url: "/blog" },
			{ title: "contact", url: "/contact" },
		],
	},
	supportLinks: {
		title: "Product Help",
		links: [
			{ title: "contact", url: "/contact" },
			{ title: "help", url: "/contact" },
			{ title: "resources", url: "#" },
			{ title: "terms & Condition", url: "/term-condition" }, // Fixed formatting
		],
	},
	contactInfo: {
		title: "Download",
		links: [
			{
				title: "App Store",
				subTitle: "Download on the",
				icon: "/img/icons/apple-icon.svg",
				url: "#",
			},
			{
				title: "Google Play",
				subTitle: "GET IT ON",
				icon: "/img/icons/playstore.svg",
				url: "#",
			},
		],
	},
};

const LayoutStyle5 = () => {
	return (
		<div className="cs_site_wrapper">
			<HeaderStyle4 logo="/img/logo-2.svg" logoUrl="/" />
			<main className="cs_main_content">
				<Outlet />
			</main>
			<FooterStyle4 data={footerData} styleVariant="cs_type_3" />
		</div>
	);
};

export default LayoutStyle5;
