import BrandStyle1 from "../components/Brand/BrandStyle1";
import CtaStyle5 from "../components/Cta/CtaStyle5";
import FunfactStyle2 from "../components/Funfact/FunfactStyle2";
import PageHeadingStyle1 from "../components/PageHeading/PageHeadingStyle1";
import ServiceStyle3 from "../components/Service/ServiceStyle3";
import TeamStyle1 from "../components/Team/TeamStyle1";
import VideoBlockStyle1 from "../components/VideoBlock/VideoBlockStyle1";
import WhyChooseStyle1 from "../components/WhyChoose/WhyChooseStyle1";

interface VideoBlockData {
	videoUrl: string;
	imgUrl: string;
}

interface BrandData {
	title: string;
	brands: {
		id: number;
		imgUrl: string;
		name?: string;
		url?: string;
		altText?: string;
	}[];
	subtitle?: string;
	description?: string;
}

interface FunfactItem {
	id: number;
	count: number;
	suffix?: string;
	prefix?: string;
	label?: string;
	title?: string;
}

interface FunfactData {
	title: string;
	imgUrl: string;
	funfacts: FunfactItem[];
}

interface ServiceItem {
	id: number;
	title: string;
	desc: string;
	icon: string;
	iconBg: string;
}

interface ServiceData {
	title: string;
	subTitle: string;
	imgUrl: string;
	services: ServiceItem[];
}

interface WhyChooseItem {
	id: number;
	title: string;
	desc: string;
	icon: string;
}

interface WhyChooseData {
	mintTitle: string;
	title: string;
	imgUrl: string;
	services: WhyChooseItem[];
}

interface SocialLink {
	id: number;
	platform: string;
	icon: string;
	url: string;
}

interface TeamMember {
	id: number;
	name: string;
	position: string;
	imgUrl: string;
	socials: SocialLink[];
}

interface TeamData {
	title: string;
	members: TeamMember[];
}

interface CtaData {
	image: string;
	quoteImage: string;
	title: string;
	description: string;
	btnText: string;
	formAction: string;
}

const videoBlockData: VideoBlockData = {
	videoUrl: "https://www.youtube.com/embed/U3IfeAqciL0",
	imgUrl: "/img/video-bg-1.jpg",
};

const brandData: BrandData = {
	title: "Already Join 15K + Business Using GoSass",
	brands: [
		{ id: 1, imgUrl: "/img/brand-1.svg" },
		{ id: 2, imgUrl: "/img/brand-2.svg" },
		{ id: 3, imgUrl: "/img/brand-3.svg" },
		{ id: 4, imgUrl: "/img/brand-4.svg" },
		{ id: 5, imgUrl: "/img/brand-5.svg" },
		{ id: 6, imgUrl: "/img/brand-6.svg" },
	],
};

const funfactData: FunfactData = {
	title: "Our Outstanding Success Story Told <br/> Through Key Numbers",
	imgUrl: "/img/funfact-bg.jpg",
	funfacts: [
		{ id: 1, count: 50, suffix: "K", label: "Active User" },
		{ id: 2, count: 80, suffix: "K", label: "Download" },
		{ id: 3, count: 15, suffix: "K", label: "Reviews" },
		{ id: 4, count: 4, suffix: "K", label: "Got awards" },
	],
};

const serviceData: ServiceData = {
	title: "Supporting your growth at every step",
	subTitle:
		"Gain precise insights for your business with our advanced analytics tools. Make informed decisions based on accurate, real-time data.",
	imgUrl: "/img/feature_10.jpg",
	services: [
		{
			id: 1,
			title: "Predictive Analytics",
			desc: "Utilize advanced machine learning algorithms to forecast future outcomes.",
			icon: "/img/service_2.svg",
			iconBg: "cs_accent_color",
		},
		{
			id: 2,
			title: "Real-time Analytics",
			desc: "Transform complex data sets into clear and compelling visual representations.",
			icon: "/img/service_1.svg",
			iconBg: "cs_purple_color",
		},
		{
			id: 3,
			title: "SEO-Optimized Writing",
			desc: "Analyze data in real-time to monitor key metrics & respond promptly to changes.",
			icon: "/img/service_3.svg",
			iconBg: "cs_purple_color",
		},
		{
			id: 4,
			title: "Data Integration",
			desc: "Seamlessly combine data from multiple sources into a unified view.",
			icon: "/img/service_4.svg",
			iconBg: "cs_accent_color",
		},
	],
};

const whyChooseData: WhyChooseData = {
	mintTitle: "WHY CHOOSE",
	title: "Why should you<br/>choose our GoSaas?",
	imgUrl: "/img/feature_5.png",
	services: [
		{
			id: 1,
			title: "Enhanced Collaboration",
			desc: "GoSaaS Chat enables efficient team communication with real-time messaging, group chats, and multimedia sharing from anywhere.",
			icon: "/img/feature_13.svg",
		},
		{
			id: 2,
			title: "Robust Security",
			desc: "With end-to-end encryption and secure storage, GoSaaS Chat ensures your privacy and data protection.",
			icon: "/img/feature_14.svg",
		},
		{
			id: 3,
			title: "Enhanced Collaboration",
			desc: "GoSaaS Chat enables efficient team communication with real-time messaging, group chats, and multimedia sharing from anywhere.",
			icon: "/img/feature_15.svg",
		},
	],
};

const teamData: TeamData = {
	title: "We're a team focused on <br> delivering results",
	members: [
		{
			id: 1,
			name: "John Williams",
			position: "Front Office Manager",
			imgUrl: "/img/team-1.jpg",
			socials: [
				{
					id: 1,
					platform: "LinkedIn",
					icon: "fa-brands fa-linkedin-in",
					url: "#",
				},
				{
					id: 2,
					platform: "Twitter",
					icon: "fa-brands fa-x-twitter",
					url: "#",
				},
				{ id: 3, platform: "YouTube", icon: "fa-brands fa-youtube", url: "#" },
				{
					id: 4,
					platform: "Instagram",
					icon: "fa-brands fa-instagram",
					url: "#",
				},
			],
		},
		{
			id: 2,
			name: "Sarah Smith",
			position: "General Manager",
			imgUrl: "/img/team-2.jpg",
			socials: [
				{
					id: 1,
					platform: "LinkedIn",
					icon: "fa-brands fa-linkedin-in",
					url: "#",
				},
				{
					id: 2,
					platform: "Twitter",
					icon: "fa-brands fa-x-twitter",
					url: "#",
				},
				{ id: 3, platform: "YouTube", icon: "fa-brands fa-youtube", url: "#" },
				{
					id: 4,
					platform: "Instagram",
					icon: "fa-brands fa-instagram",
					url: "#",
				},
			],
		},
		{
			id: 3,
			name: "Michael Anderson",
			position: "Software Developer",
			imgUrl: "/img/team-3.jpg",
			socials: [
				{
					id: 1,
					platform: "LinkedIn",
					icon: "fa-brands fa-linkedin-in",
					url: "#",
				},
				{
					id: 2,
					platform: "Twitter",
					icon: "fa-brands fa-x-twitter",
					url: "#",
				},
				{ id: 3, platform: "YouTube", icon: "fa-brands fa-youtube", url: "#" },
				{
					id: 4,
					platform: "Instagram",
					icon: "fa-brands fa-instagram",
					url: "#",
				},
			],
		},
		{
			id: 4,
			name: "Jessica Tylore",
			position: "Marketing Officer",
			imgUrl: "/img/team-4.jpg",
			socials: [
				{
					id: 1,
					platform: "LinkedIn",
					icon: "fa-brands fa-linkedin-in",
					url: "#",
				},
				{
					id: 2,
					platform: "Twitter",
					icon: "fa-brands fa-x-twitter",
					url: "#",
				},
				{ id: 3, platform: "YouTube", icon: "fa-brands fa-youtube", url: "#" },
				{
					id: 4,
					platform: "Instagram",
					icon: "fa-brands fa-instagram",
					url: "#",
				},
			],
		},
	],
};

const ctaData: CtaData = {
	image: "/img/cta-img-1.png",
	quoteImage: "/img/quote.png",
	title: "Stay Connected!",
	description:
		"Subscribe to our newsletter for the latest insights, updates,<br />and exclusive offers and exclusive tips. Stay informed and <br />never miss an update.",
	btnText: "Subscribe Now",
	formAction: "#",
};

const AboutUsPage: React.FC = () => {
	return (
		<>
			<PageHeadingStyle1
				title="Big Results for Small Businesses"
				subTitle="Driven by technology and a dedication to excellence, we help businesses <br/> succeed in the ever-evolving digital world."
			/>
			<VideoBlockStyle1 data={videoBlockData} />
			<div className="cs_height_60 cs_height_lg_60"></div>
			<BrandStyle1 data={brandData} />
			<div className="cs_height_140 cs_height_lg_80"></div>
			<FunfactStyle2
				data={funfactData}
				styleVariant="cs_gray_bg_6"
				shapeIcon={true}
			/>
			<div className="cs_height_140 cs_height_lg_80" />
			<ServiceStyle3 data={serviceData} />
			<div className="cs_height_140 cs_height_lg_80" />
			<WhyChooseStyle1 data={whyChooseData} />
			<TeamStyle1 data={teamData} />
			<CtaStyle5 data={ctaData} />
		</>
	);
};

export default AboutUsPage;
