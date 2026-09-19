import React from "react";
import CardStyle4 from "../components/Card/CardStyle4";
import CtaStyle5 from "../components/Cta/CtaStyle5";
import FaqStyle4 from "../components/Faq/FaqStyle4";
import FeaturesStyle3 from "../components/Features/FeaturesStyle3";
import FeaturesStyle5 from "../components/Features/FeaturesStyle5";
import FunfactStyle1 from "../components/Funfact/FunfactStyle1";
import HeroStyle4 from "../components/Hero/HeroStyle4";
import PricingStyle4 from "../components/Pricing/PricingStyle4";
import ServiceStyle2 from "../components/Service/ServiceStyle2";

/* ------------------- Type Definitions ------------------- */
interface HeroData {
	title: string;
	subTitle: string;
	btnText1: string;
	btnUrl1: string;
	videoBtnText: string;
	videoSrc: string;
	imgUrl: string;
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
	subTitle: string;
	bgUrl: string;
	funfacts: FunfactItem[];
}

interface FeatureItem {
	id: number;
	icon: string;
	title: string;
	subtitle: string;
	link: string;
	animation: string;
}

interface FeaturesData {
	title: string;
	subTitle: string;
	features: FeatureItem[];
}

interface CardFeature {
	id: number;
	title: string;
}

interface CardData {
	title: string;
	subTitle: string;
	imgUrl: string;
	badge1: string;
	badge2: string;
	features: CardFeature[];
}

interface ServiceItem {
	id: number;
	title: string;
	desc: string;
	icon: string;
	iconBg: string;
}

interface ServiceCta {
	btnText: string;
	btnUrl: string;
	iconText: string;
}

interface ServiceData {
	title: string;
	subTitle: string;
	services: ServiceItem[];
	cta: ServiceCta;
}

interface PricingFeature {
	id: number;
	label: string;
	available: boolean;
}

interface PricingPlan {
	id: number;
	label: string;
	monthlyPrice: number;
	active?: boolean;
	buttonText: string;
	features: PricingFeature[];
}

interface PricingData {
	title: string;
	plans: PricingPlan[];
}

interface FaqItem {
	id: number;
	question: string;
	answer: string;
}

interface FaqData {
	title: string;
	faqs: FaqItem[];
}

interface CtaData {
	image: string;
	quoteImage: string;
	title: string;
	description: string;
	btnText: string;
	formAction: string;
}

/** For FeaturesStyle3 block (your "featureThreeData") */
interface FeatureThreeListItem {
	id: number;
	title: string;
}
interface FeatureThreeData {
	title: string;
	subTitle: string;
	imgUrl: string;
	imgUrl2: string;
	badge1?: string;
	features: FeatureThreeListItem[];
}

/* ------------------- Data ------------------- */

const heroData: HeroData = {
	title: "Unlock Insights with Powerful Data Analytics",
	subTitle:
		"Transform raw data into actionable insights effortlessly. Our application helps you make data-driven decisions, visualize trends, and optimize performance with intuitive and powerful analytics tools",
	btnText1: "Sign Up Now",
	btnUrl1: "/register",
	videoBtnText: "View Demo",
	videoSrc: "https://www.youtube.com/embed/U3IfeAqciL0",
	imgUrl: "/img/hero_img_1.jpg",
};

const funfactData: FunfactData = {
	title:
		" Our analytics platform is trusted by over <br /> 15,000 companies worldwide",
	subTitle:
		"Transform raw data into actionable insights effortlessly. Our application helps you make data-driven decisions, visualize trends, and optimize performance with intuitive and powerful analytics tools",
	bgUrl: "/img/counter_bg.svg",
	funfacts: [
		{ id: 1, count: 15, suffix: "K", title: "Active Users" },
		{ id: 2, count: 100, suffix: "%", title: "Automation" },
		{ id: 3, count: 2, suffix: "M", title: "Downloads" },
		{ id: 4, count: 15, suffix: "K", title: "Active Users" },
	],
};

const featuresData: FeaturesData = {
	title: "Discover our incredible features",
	subTitle:
		"With our intuitive dashboards and user-friendly interface, you can effortlessly explore <br /> and analyze your data, no matter your level of technical expertise.",
	features: [
		{
			id: 1,
			icon: "/img/icons/dashboard.svg",
			title: "Interactive Dashboard",
			subtitle: "Get real-time insights with interactive dashboards.",
			link: "/features",
			animation: "fade-in-left",
		},
		{
			id: 2,
			icon: "/img/icons/stats.svg",
			title: "Predictive Analytics",
			subtitle: "Predict trends with advanced machine learning.",
			link: "/features",
			animation: "fade-in-up",
		},
		{
			id: 3,
			icon: "/img/icons/magic-wand.svg",
			title: "Collaboration Tools",
			subtitle: "Seamlessly collaborate with team together.",
			link: "/features",
			animation: "fade-in-right",
		},
	],
};

const cardTwoData: CardData = {
	title: "Gain precise insights for your business",
	subTitle:
		"Our fast response system helps you tackle tasks efficiently, enabling you to focus on what truly matters and achieve your goals with ease.",
	imgUrl: "/img/feature_1.jpg",
	badge1: "/img/active-user.png",
	badge2: "/img/advance-search.png",
	features: [
		{ id: 1, title: "Real-Time Messaging" },
		{ id: 2, title: "Quick File Sharing" },
		{ id: 3, title: "Fast System Integration" },
	],
};

const featureThreeData: FeatureThreeData = {
	title: "Convert your data into meaningful insights",
	subTitle:
		"Gain precise insights for your business with our advanced analytics tools. Make informed decisions based on accurate, real-time data",
	imgUrl: "/img/feature_2.jpg",
	imgUrl2: "/img/Illustration.png",
	badge1: "/img/vector_1.svg",
	features: [
		{ id: 1, title: "Actionable Insights" },
		{ id: 2, title: "Enhanced Decision-Making" },
		{ id: 3, title: "Improved Efficiency" },
	],
};

const serviceData: ServiceData = {
	title: "Our Analytical Services Offer",
	subTitle:
		"Unlock the full potential of your data with our comprehensive analytics solutions. we <br /> provide the tools you need to make informed decisions & drive business growth.",
	services: [
		{
			id: 1,
			title: "Smart Content Generator",
			desc: "Create blog posts, ads, emails, and more with just a few keywords. Let AI turn your ideas into polished, ready-to-use content.",
			icon: "/img/service_1.svg",
			iconBg: "cs_purple_color",
		},
		{
			id: 2,
			title: "Tone & Style Customization",
			desc: "Match your voice ease — professional, friendly, or witty. Select the tone you want to watch your content adapt accordingly.",
			icon: "/img/service_2.svg",
			iconBg: "cs_accent_color",
		},
		{
			id: 3,
			title: "SEO-Optimized Writing",
			desc: "Boost visibility with AI-powered keyword suggestions. Write content that ranks — without needing an SEO expert.",
			icon: "/img/service_3.svg",
			iconBg: "cs_purple_color",
		},
		{
			id: 4,
			title: "Grammar & Clarity Enhancement",
			desc: "Polish your writing to perfection. Automatically fix grammar, improve readability, and ensure clarity.",
			icon: "/img/service_4.svg",
			iconBg: "cs_accent_color",
		},
		{
			id: 5,
			title: "Multi-Language Support",
			desc: "Create content in over 20 languages. Reach global audiences with native-level translation and localization.",
			icon: "/img/service_5.svg",
			iconBg: "cs_purple_color",
		},
		{
			id: 6,
			title: "Templates for Every Need",
			desc: "Ready-to-use templates for blogs, ads, social posts, and more. Save time with proven content powered by AI.",
			icon: "/img/service_6.svg",
			iconBg: "cs_accent_color",
		},
	],
	cta: {
		btnText: "Contact For Free Trial",
		btnUrl: "/contact",
		iconText:
			'Our application is trusted by over <span class="cs_purple_color">15K</span> clients worldwide!',
	},
};

const pricingData: PricingData = {
	title: "Select the plan that best fits <br /> your business needs",
	plans: [
		{
			id: 1,
			label: "Free",
			monthlyPrice: 0,
			buttonText: "Try It For Free",
			features: [
				{ id: 1, label: "Limited number of data points", available: true },
				{ id: 2, label: "Standard analytics reports", available: true },
				{ id: 3, label: "Basic dashboard", available: true },
				{ id: 4, label: "Email support", available: false },
				{ id: 5, label: "Premium Support", available: false },
			],
		},
		{
			id: 2,
			label: "Standard",
			monthlyPrice: 9,
			active: true,
			buttonText: "Purchase Now",
			features: [
				{ id: 1, label: "Increased data point limits", available: true },
				{ id: 2, label: "Advanced analytics", available: true },
				{ id: 3, label: "Customizable dashboards", available: true },
				{ id: 4, label: "API access", available: false },
				{ id: 5, label: "Priority email support", available: false },
			],
		},
		{
			id: 3,
			label: "Enterprise",
			monthlyPrice: 49,
			buttonText: "Purchase Now",
			features: [
				{ id: 1, label: "Unlimited data points", available: true },
				{ id: 2, label: "Real-time analytics", available: true },
				{ id: 3, label: "Advanced predictive analytics", available: true },
				{ id: 4, label: "Dedicated account manager", available: false },
				{ id: 5, label: "Phone support", available: false },
			],
		},
	],
};

const faqData: FaqData = {
	title: "Answers to Your Frequently <br /> Asked Questions",
	faqs: [
		{
			id: 1,
			question: "What data types does your analytics application support?",
			answer:
				"Lorem, ipsum dolor sit amet consectetur adipisicing elit. Temporibus quos vitae, consectetur eos, aut porro repellat quas eum reprehenderit magnam natus, voluptatem tempore numquam. Similique, dicta porro.",
		},
		{
			id: 2,
			question: "Do you offer a free trial of your analytics application?",
			answer:
				"Lorem, ipsum dolor sit amet consectetur adipisicing elit. Temporibus quos vitae, consectetur eos, aut porro repellat quas eum reprehenderit magnam natus, voluptatem tempore numquam. Similique, dicta porro.",
		},
		{
			id: 3,
			question: "Can I upgrade or downgrade my plan at any time?",
			answer:
				"Lorem, ipsum dolor sit amet consectetur adipisicing elit. Temporibus quos vitae, consectetur eos, aut porro repellat quas eum reprehenderit magnam natus, voluptatem tempore numquam. Similique, dicta porro.",
		},
		{
			id: 4,
			question: "Do you offer discounts for annual subscriptions?",
			answer:
				"Lorem, ipsum dolor sit amet consectetur adipisicing elit. Temporibus quos vitae, consectetur eos, aut porro repellat quas eum reprehenderit magnam natus, voluptatem tempore numquam. Similique, dicta porro.",
		},
		{
			id: 5,
			question: "What support options are available if I need help?",
			answer:
				"Lorem, ipsum dolor sit amet consectetur adipisicing elit. Temporibus quos vitae, consectetur eos, aut porro repellat quas eum reprehenderit magnam natus, voluptatem tempore numquam. Similique, dicta porro.",
		},
		{
			id: 6,
			question: "Is there a mobile app available?",
			answer:
				"Lorem, ipsum dolor sit amet consectetur adipisicing elit. Temporibus quos vitae, consectetur eos, aut porro repellat quas eum reprehenderit magnam natus, voluptatem tempore numquam. Similique, dicta porro.",
		},
		{
			id: 7,
			question: "What are benefits of using your analytics application?",
			answer:
				"Lorem, ipsum dolor sit amet consectetur adipisicing elit. Temporibus quos vitae, consectetur eos, aut porro repellat quas eum reprehenderit magnam natus, voluptatem tempore numquam. Similique, dicta porro.",
		},
		{
			id: 8,
			question: "Is there any future prediction for business?",
			answer:
				"Lorem, ipsum dolor sit amet consectetur adipisicing elit. Temporibus quos vitae, consectetur eos, aut porro repellat quas eum reprehenderit magnam natus, voluptatem tempore numquam. Similique, dicta porro.",
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

/* ------------------- Page ------------------- */

const DataAnalyticsPage: React.FC = () => {
	return (
		<>
			<HeroStyle4 data={heroData} />
			<FunfactStyle1 data={funfactData} />
			<FeaturesStyle5 data={featuresData} />
			<div className="cs_height_133 cs_height_lg_80"></div>
			<CardStyle4 data={cardTwoData} />
			<FeaturesStyle3
				data={featureThreeData}
				btnText="Get Started Now"
				btnUrl="/register"
			/>
			<div className="cs_height_130 cs_height_lg_80"></div>
			<ServiceStyle2 data={serviceData} />
			<div className="cs_height_45"></div>
			<PricingStyle4 data={pricingData} />
			<FaqStyle4 data={faqData} />
			<CtaStyle5 data={ctaData} />
		</>
	);
};

export default DataAnalyticsPage;
