import { Outlet } from "react-router-dom";
import FooterStyle3 from "../Footer/FooterStyle3";
import HeaderStyle3 from "../Header/HeaderStyle3";

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
	logo: "/img/logo-2.svg",
	desc: "Boosts your productivity with easy task creation, customizable lists, time tracking, and real-time collaboration. Organize tasks, teammates, and tools in one seamless platform.",
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
			{ title: "terms & Condition", url: "/term-condition" },
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

const LayoutStyle3 = () => {
	return (
		<div className="cs_task_management">
			<HeaderStyle3 logo="/img/logo-2.svg" logoUrl="/" />
			<main className="cs_main_content">
				<Outlet />
			</main>
			<FooterStyle3 data={footerData} />
		</div>
	);
};

export default LayoutStyle3;
