import BrandStyle1 from "../components/Brand/BrandStyle1";
import CardStyle1 from "../components/Card/CardStyle1";
import CardStyle2 from "../components/Card/CardStyle2";
import CtaStyle8 from "../components/Cta/CtaStyle8";
import CtaStyle9 from "../components/Cta/CtaStyle9";
import FeaturesStyle6 from "../components/Features/FeaturesStyle6";
import HeroStyle7 from "../components/Hero/HeroStyle7";
import IntegrationStyle1 from "../components/Integration/IntegrationStyle1";
import PricingStyle2 from "../components/Pricing/PricingStyle2";
import TestimonialStyle1 from "../components/Testimonial/TestimonialStyle1";
import WhyChooseStyle1 from "../components/WhyChoose/WhyChooseStyle1";

// ---------- Type Definitions ----------
interface FeatureItem {
	id: number;
	icon?: string;
	title: string;
	desc?: string;
	url?: string;
}

interface HeroData {
	title: string;
	subTitle: string;
	iconUrl: string;
	imgUrl: string;
	btnText: string;
	features: FeatureItem[];
	animText1: string;
	animText2: string;
}

interface BrandItem {
	id: number;
	imgUrl: string;
}

interface BrandData {
	title: string;
	brands: BrandItem[];
}

interface CardOneData {
	mintTitle: string;
	title: string;
	subTitle: string;
	btnText: string;
	btnUrl: string;
	imgUrl: string;
	imgUrl2?: string;
}

interface CardTwoData {
	mintTitle: string;
	title: string;
	subTitle: string;
	btnText: string;
	btnUrl: string;
	imgUrl: string;
}

interface IntegrationItem {
	id: number;
	name: string;
	icon: string;
}

interface IntegrationData {
	title: string;
	subtitle: string;
	tools: IntegrationItem[];
}

interface FeatureSixItems {
	id: number;
	icon: string;
	title: string;
	desc: string;
	url: string;
}

interface FeaturesSixData {
	title: string;
	subTitle: string;
	features: FeatureSixItems[];
}

interface PricingPlan {
	id: number;
	name: string;
	monthlyPrice: number;
	features: string[];
	popular: boolean;
}

interface PricingData {
	title: string;
	plans: PricingPlan[];
}

interface Service {
	id: number;
	title: string;
	desc: string;
	icon: string;
}

interface WhyChooseData {
	mintTitle: string;
	title: string;
	imgUrl: string;
	services: Service[];
}

/** CLEAN testimonial shape expected by TestimonialStyle1 */
interface Testimonial {
	id: number;
	name: string;
	designation?: string;
	message: string;
	avatar?: string;
	rating?: number;
}

interface TestimonialData {
	title: string;
	testimonial: Testimonial[];
}

interface CtaEightItems {
	id: number;
	title: string;
}

interface CtaEightData {
	title?: string;
	subTitle?: string;
	features?: CtaEightItems[];
	btnText?: string;
	iconUrl?: string;
}

interface CtaNineData {
	imgUrl: string;
	title: string;
	btnText: string;
}

const heroData: HeroData = {
	title: "Boost Customer Satisfaction <br/> with Live Chat",
	subTitle:
		"Our chat application is trusted by over <span className='cs_purple_color'>15K</span> companies!",
	iconUrl: "/img/cup.png",
	imgUrl: "/img/hero_img_2.jpg",
	btnText: "Sign Up Free",
	features: [
		{ id: 1, title: "No credit card needed" },
		{ id: 2, title: "Free 14-day trial" },
	],
	animText1: "AI Assistant",
	animText2: "Grammar Checker",
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

const cardOneData: CardOneData = {
	mintTitle: "AI ASSISTANT",
	title: "Resolve up to 70% of cases with AI",
	subTitle:
		"Our AI assistant in a live chat application provides instant answers to common questions, delivers personalized responses by analyzing user data, enhancing efficiency & user satisfaction.",
	btnText: "Learn More",
	btnUrl: "/about-us",
	imgUrl: "/img/feature_3.jpg",
	imgUrl2: "/img/chat.png",
};

const cardTwoData: CardTwoData = {
	mintTitle: "AUTO SPELLING CHECKER",
	title: "Enhance Your Writing with AI-Powered Auto Spelling Checker",
	subTitle:
		"Our AI-powered auto spelling checker instantly detects and corrects spelling errors as you type. It ensures your writing is accurate and polished across all platforms.",
	btnText: "Learn More",
	btnUrl: "/about-us",
	imgUrl: "/img/feature_4.jpg",
};

const featuresData: FeaturesSixData = {
	title: "Discover our incredible features",
	subTitle:
		"With our intuitive dashboards and user-friendly interface, you can effortlessly explore and <br/> analyze your data, no matter your level of technical expertise.",
	features: [
		{
			id: 1,
			icon: "/img/icons/messages.svg",
			title: "Real-Time Messaging",
			desc: "Instant communication with no noticeable delay, ensuring smooth conversations.",
			url: "/features",
		},
		{
			id: 2,
			icon: "/img/icons/users-alt.svg",
			title: "Group Chats",
			desc: "Create and participate in group conversations for team collaboration or social interactions.",
			url: "/features",
		},
		{
			id: 3,
			icon: "/img/icons/graphic-style.svg",
			title: "Multimedia Sharing",
			desc: "Send and receive images, videos, audio files, and documents within the chat.",
			url: "/features",
		},
		{
			id: 4,
			icon: "/img/icons/text.svg",
			title: "Typing Indicators",
			desc: "See when the other person is typing, making the conversation feel more interactive.",
			url: "/features",
		},
		{
			id: 5,
			icon: "/img/icons/discover.svg",
			title: "Search Functionality",
			desc: "Easily find specific messages or conversations using keywords or filters.",
			url: "/features",
		},
		{
			id: 6,
			icon: "/img/icons/user-headset.svg",
			title: "Voice and Video Calls",
			desc: "Make voice and video calls directly from the chat application, facilitating face-to-face.",
			url: "/features",
		},
	],
};

const integrationData: IntegrationData = {
	title: "Seamlessly integrating with your preferred tools",
	subtitle:
		"Seamlessly integrating with your preferred tools, our chat application connects with various apps and services.",
	tools: [
		{ id: 1, name: "Discord", icon: "/img/icons/discord.svg" },
		{ id: 2, name: "Slack", icon: "/img/icons/slack.svg" },
		{ id: 3, name: "Microsoft", icon: "/img/icons/microsoft.svg" },
		{ id: 4, name: "Spotify", icon: "/img/icons/spotify.svg" },
		{ id: 5, name: "Google", icon: "/img/icons/google.svg" },
		{ id: 6, name: "Facebook", icon: "/img/icons/fscebook.svg" }, // check path spelling if needed
	],
};

const pricingData: PricingData = {
	title: "Select the plan that best fits <br/> your business needs",
	plans: [
		{
			id: 1,
			name: "Starter",
			monthlyPrice: 10,
			features: [
				"Upto 5000 words/month",
				"Access basic writing tools",
				"10+ writing templates",
				"Grammar checker",
				"Light mode theme only",
				"Email support",
			],
			popular: false,
		},
		{
			id: 2,
			name: "Team",
			monthlyPrice: 20,
			features: [
				"Upto 5000 words/month",
				"30+ writing templates",
				"Tone and customization",
				"SEO keyword suggestion",
				"Multi-language output",
				"Priority email support",
			],
			popular: false,
		},
		{
			id: 3,
			name: "Business",
			monthlyPrice: 49,
			features: [
				"Limitless word generation",
				"Access to all AI tools",
				"Collaboration (up to 5)",
				"AI-powered rewriting",
				"Content history",
				"Chat & email support",
			],
			popular: true,
		},
		{
			id: 4,
			name: "Enterprise",
			monthlyPrice: 79,
			features: [
				"Unlimited usage & users",
				"Custom AI model",
				"Dedicated manager",
				"API access & integrations",
				"Security controls",
				"24/7 priority support",
			],
			popular: false,
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

const testimonialData: TestimonialData = {
	title: "Customer Reviews and <br/> Success Stories",
	testimonial: [
		{
			id: 1,
			avatar: "/img/avatar-1.jpg",
			name: "Sara Thomas",
			designation: "Project Manager",
			message:
				"Gosaas has completely transformed how we manage projects at our company. The intuitive interface makes it easy for everyone to get on board, and the powerful features like subtasks and dependencies.",
			rating: 3.5,
		},
		{
			id: 2,
			avatar: "/img/avatar-2.jpg",
			name: "Wizard Bona",
			designation: "Creative Director",
			message:
				"Managing a creative team comes with its own set of challenges, but Gosaas has made it so much easier. The customizable views allow us to organize tasks in a way that makes sense for our projects",
			rating: 5,
		},
		{
			id: 3,
			avatar: "/img/avatar-3.jpg",
			name: "Jhon Kubera",
			designation: "Marketing Specialist",
			message:
				"As a marketing specialist, staying organized and on top of deadlines is crucial. Gosaas has been a lifesaver. The platform is incredibly user-friendly, and I love how I can customize task lists to fit my workflow.",
			rating: 4,
		},
		{
			id: 4,
			avatar: "/img/avatar-1.jpg",
			name: "Sara Thomas",
			designation: "Project Manager",
			message:
				"Gosaas has completely transformed how we manage projects at our company. The intuitive interface makes it easy for everyone to get on board, and the powerful features like subtasks and dependencies.",
			rating: 4.5,
		},
		{
			id: 5,
			avatar: "/img/avatar-2.jpg",
			name: "Wizard Bona",
			designation: "Creative Director",
			message:
				"Managing a creative team comes with its own set of challenges, but Gosaas has made it so much easier. The customizable views allow us to organize tasks in a way that makes sense for our projects",
			rating: 5,
		},
		{
			id: 6,
			avatar: "/img/avatar-3.jpg",
			name: "Jhon Kubera",
			designation: "Marketing Specialist",
			message:
				"As a marketing specialist, staying organized and on top of deadlines is crucial. Gosaas has been a lifesaver. The platform is incredibly user-friendly, and I love how I can customize task lists to fit my workflow.",
			rating: 4,
		},
	],
};

const ctaData: CtaEightData = {
	title: "Ready to enhance your sales & customer satisfaction?",
	features: [
		{ id: 1, title: "No credit card needed" },
		{ id: 2, title: "Free 14-day trial" },
	],
	btnText: "Sign Up Free",
};

const ctaTwoData: CtaNineData = {
	imgUrl: "/img/support-img-group.png",
	title: "Any Questions? Our support team is available 24/7",
	btnText: "Live Chat Now",
};

const LiveChatPage: React.FC = () => {
	return (
		<>
			<HeroStyle7 data={heroData} />
			<div className="cs_height_124 cs_height_lg_80" />
			<BrandStyle1 data={brandData} />
			<div className="cs_height_140 cs_height_lg_80" />
			<CardStyle1 data={cardOneData} />
			<CardStyle2 data={cardTwoData} />
			<FeaturesStyle6 data={featuresData} />
			<div className="cs_height_140 cs_height_lg_80"></div>
			<IntegrationStyle1 data={integrationData} />
			<div className="cs_height_140 cs_height_lg_80"></div>
			<PricingStyle2 data={pricingData} styleVariant="cs_gray_bg_4" />
			<div className="cs_height_140 cs_height_lg_80"></div>
			<WhyChooseStyle1 data={whyChooseData} />
			<TestimonialStyle1 data={testimonialData} />
			<CtaStyle8 data={ctaData} />
			<div className="cs_height_135 cs_height_lg_80"></div>
			<CtaStyle9 data={ctaTwoData} />
		</>
	);
};

export default LiveChatPage;
