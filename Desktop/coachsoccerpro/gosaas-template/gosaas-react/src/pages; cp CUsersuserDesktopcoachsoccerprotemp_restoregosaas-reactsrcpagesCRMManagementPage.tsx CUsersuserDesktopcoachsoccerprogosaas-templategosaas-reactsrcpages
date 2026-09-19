import BrandStyle2 from "../components/Brand/BrandStyle2";
import CardStyle3 from "../components/Card/CardStyle3";
import CardStyle4 from "../components/Card/CardStyle4";
import CardStyle5 from "../components/Card/CardStyle5";
import CtaStyle4 from "../components/Cta/CtaStyle4";
import FaqStyle3 from "../components/Faq/FaqStyle3";
import FeaturesStyle4 from "../components/Features/FeaturesStyle4";
import FeaturesStyle7 from "../components/Features/FeaturesStyle7";
import HeroStyle3 from "../components/Hero/HeroStyle3";
import PricingStyle3 from "../components/Pricing/PricingStyle3";

interface HeroData {
	title: string;
	subTitle: string;
	iconUrl: string;
	imgUrl: string;
	bgImgUrl?: string;
	btnText: string;
}

interface FeaturesFourItem {
	id: number;
	icon: string;
	iconBg: string;
	title: string;
	desc: string;
}

interface FeaturesFourData {
	mintTitle: string;
	title: string;
	features: FeaturesFourItem[];
}

interface CardThreeItem {
	id: number;
	icon: string;
	title: string;
	desc: string;
}

interface CardThreeData {
	mintTitle: string;
	title: string;
	subTitle: string;
	imgUrl: string;
	features: CardThreeItem[];
	badge1?: string;
	badge2?: string;
	growthRate?: number;
	happyCustomers?: number;
}

interface CardFourItem {
	id: number;
	title: string;
}

interface CardFourData {
	mintTitle: string;
	title: string;
	subTitle: string;
	imgUrl: string;
	badge1: string;
	badge2: string;
	features: CardFourItem[];
}

interface FeaturesSevenItem {
	id: number;
	img: string;
	title: string;
	desc: string;
	animation: string;
}

interface FeaturesSevenData {
	title: string;
	subTitle: string;
	features?: FeaturesSevenItem[];
}

interface IntegrationItem {
	id: number;
	icon: string;
	name: string;
}

interface IntegrationsData {
	integrations1: IntegrationItem[];
	integrations2: IntegrationItem[];
}

interface IntegrationSection {
	mintTitle: string;
	title: string;
	integrations: IntegrationsData;
}

interface CardFiveData {
	mintTitle: string;
	title: string;
	subTitle: string;
	imgUrl: string;
	growthRate: number;
	happyCustomers: number;
	badgeImages?: {
		fastMessaging?: string;
		taskInfo?: string;
		rating?: string;
	};
}

interface PricingFeature {
	label: string;
	available: boolean;
}

interface PricingPlan {
	id: number;
	title: string;
	monthlyPrice: number;
	features: PricingFeature[];
	badge: string | null;
}

interface PricingData {
	subtitle: string;
	title: string;
	plans: PricingPlan[];
}

interface CtaData4 {
	title: string;
	subTitle: string;
	btnText: string;
	btnUrl: string;
	shape1?: string;
	shape2?: string;
}

interface FaqItem {
	question: string;
	answer: string;
}

interface FaqData {
	subtitle: string;
	title: string;
	faqs: FaqItem[];
}

const heroData: HeroData = {
	title: "We unite tasks, team, and <br /> tools in one place",
	subTitle:
		"Streamline your tasks, stay organized, and enhance your productivity <br /> with our intuitive task management web application.",
	iconUrl: "/img/cup.png",
	imgUrl: "/img/hero_img_3.jpg",
	bgImgUrl: "/img/hero_shape_2.svg",
	btnText: "Sign Up Free",
};

const featuresFourData: FeaturesFourData = {
	mintTitle: "FEATURES",
	title: "Key features to boost your <br/> productivity",
	features: [
		{
			id: 1,
			title: "Easy Task Creation",
			desc: "Add new tasks quickly with a simple and user-friendly interface. Organize your workload without the hassle.",
			icon: "/img/icons/easy-task.svg",
			iconBg: "",
		},
		{
			id: 2,
			title: "Due Date & Reminders",
			desc: "Set due dates and reminders to ensure you meet your deadlines. Get notified via email or in-app alerts.",
			icon: "/img/icons/due-date.svg",
			iconBg: "cs_bg_2",
		},
		{
			id: 3,
			title: "Customizable Lists",
			desc: "Customize task lists to match your unique workflow. Group tasks by project, priority, or deadline to stay on top of everything.",
			icon: "/img/icons/slider.svg",
			iconBg: "cs_bg_3",
		},
		{
			id: 4,
			title: "Progress Tracking",
			desc: "Visualize your progress with intuitive dashboards and progress bars. Keep track of completed and pending tasks effortlessly.",
			icon: "/img/icons/progress.svg",
			iconBg: "cs_bg_4",
		},
		{
			id: 5,
			title: "Cross Platform Sync",
			desc: "Access your tasks from any device. Our application syncs across web, mobile, and desktop to keep you connected.",
			icon: "/img/icons/cross-plateform.svg",
			iconBg: "cs_bg_5",
		},
	],
};

const cardThreeData: CardThreeData = {
	mintTitle: "FLEXIBILIY",
	title: "Access real-time updates <br/> on your team's work",
	subTitle:
		"Skip the tedious manual work. Automation handles it for you, streamlining workflows, minimizing errors, and freeing up time for more critical tasks.",
	imgUrl: "/img/feature_5.jpg",
	features: [
		{
			id: 1,
			title: "Automate Task Creation",
			desc: "Automate task creation to streamline your workflow and boost productivity.",
			icon: "/img/feature_16.svg",
		},
		{
			id: 2,
			title: "Enhanced Collaboration",
			desc: "Enabling seamless communication and collaboration from anywhere.",
			icon: "/img/feature_17.svg",
		},
	],
};

const cardFourData: CardFourData = {
	mintTitle: "FAST RESPONSE",
	title: "Experience unmatched speed and efficiency",
	subTitle:
		"Our fast response system helps you tackle tasks efficiently, enabling you to focus on what truly matters and achieve your goals with ease.",
	imgUrl: "/img/feature_6.jpg",
	badge1: "/img/active-user.png",
	badge2: "/img/advance-search.png",
	features: [
		{ id: 1, title: "Real-Time Messaging" },
		{ id: 2, title: "Quick File Sharing" },
		{ id: 3, title: "Fast System Integration" },
	],
};

const featuresSevenData: FeaturesSevenData = {
	title: "Increase your productivity",
	subTitle:
		"Packed with features to provide you the ultimate web <br />conferencing experience",
	features: [
		{
			id: 1,
			img: "/img/card-img-1.png",
			title: "Task Creation & Assignment",
			desc: "Increase productivity through streamlined workflows and highly efficient task management solutions.",
			animation: "fade-in-left",
		},
		{
			id: 2,
			img: "/img/card-img-2.png",
			title: "Deadline & Priority Setting",
			desc: "Set deadlines and prioritize tasks to help manage workloads and meet project timelines effectively",
			animation: "fade-in-down",
		},
		{
			id: 3,
			img: "/img/card-img-3.png",
			title: "Progress Tracking",
			desc: "Monitor task progress with status updates, checklists, and completion indicators, keeping everyone on the same page.",
			animation: "fade-in-right",
		},
	],
};

const intrigrationData: IntegrationSection = {
	mintTitle: "INTEGRATIONS",
	title: "Seamlessly integrating with your <br/> preferred tools",
	integrations: {
		integrations1: [
			{ id: 1, icon: "/img/icons/amazon.svg", name: "Amazon" },
			{ id: 2, icon: "/img/icons/twitter.svg", name: "Twitter" },
			{ id: 3, icon: "/img/icons/google.svg", name: "Google" },
			{ id: 4, icon: "/img/icons/snapchat.svg", name: "Snapchat" },
			{ id: 5, icon: "/img/icons/github.svg", name: "Github" },
			{ id: 6, icon: "/img/icons/paypal.svg", name: "Paypal" },
		],

		integrations2: [
			{ id: 1, icon: "/img/icons/amazon.svg", name: "Amazon" },
			{ id: 2, icon: "/img/icons/twitter.svg", name: "Twitter" },
			{ id: 3, icon: "/img/icons/google.svg", name: "Google" },
			{ id: 4, icon: "/img/icons/snapchat.svg", name: "Snapchat" },
			{ id: 5, icon: "/img/icons/github.svg", name: "Github" },
			{ id: 6, icon: "/img/icons/paypal.svg", name: "Paypal" },
		],
	},
};

const cardFiveData: CardFiveData = {
	mintTitle: "AWESOME FACT",
	title: `A task Manager that’s both <span class='cs_gradient_color'>powerful & essential</span>`,
	subTitle:
		"Skip the tedious manual work. Automation handles it for you,<br> streamlining workflows, minimizing errors, and freeing up time <br> for more critical tasks.",
	imgUrl: "/img/feature_7.jpg",
	growthRate: 35,
	happyCustomers: 30,
	badgeImages: {
		fastMessaging: "/img/fast-messaging.png",
		taskInfo: "/img/Illustration_3.png",
		rating: "/img/rating.png",
	},
};

const pricingData: PricingData = {
	subtitle: "PRICING",
	title: "Select the plan that best fits <br> your business needs",
	plans: [
		{
			id: 1,
			title: "Free",
			monthlyPrice: 0,
			badge: null,
			features: [
				{ label: "Limited number of data points", available: true },
				{ label: "Standard analytics reports", available: true },
				{ label: "Basic dashboard", available: true },
				{ label: "Email support", available: false },
				{ label: "Premium Support", available: false },
			],
		},
		{
			id: 2,
			title: "Standard",
			monthlyPrice: 10,
			badge: "Most Popular",
			features: [
				{ label: "Increased data point limits", available: true },
				{ label: "Advanced analytics", available: true },
				{ label: "Customizable dashboards", available: true },
				{ label: "API access", available: false },
				{ label: "Priority email support", available: false },
			],
		},
		{
			id: 3,
			title: "Enterprise",
			monthlyPrice: 49,
			badge: null,
			features: [
				{ label: "Unlimited data points", available: true },
				{ label: "Real-time analytics", available: true },
				{ label: "Advanced predictive analytics", available: true },
				{ label: "Dedicated account manager", available: true },
				{ label: "Phone support", available: true },
			],
		},
	],
};

const ctaData: CtaData4 = {
	title: "Ready to get started? Start your free trial now!",
	subTitle:
		"Elevate sales and stay ahead in the competitive market by being among <br/> the first to benefit from our game-changing solutions.",
	btnText: "Start Free Trial",
	btnUrl: "/about-us",
	shape1: "",
	shape2: "/img/vector_3.svg",
};

const faqData: FaqData = {
	subtitle: "FAQ'S",
	title: "Answers to Your Frequently <br> Asked Questions",
	faqs: [
		{
			question: "What data types does your analytics application support?",
			answer: "We support JSON, CSV, SQL databases, and more.",
		},
		{
			question: "Do you offer a free trial of your analytics application?",
			answer: "Yes, we offer a 14-day free trial.",
		},
		{
			question: "Can I upgrade or downgrade my plan at any time?",
			answer: "Absolutely, plans can be changed anytime via your dashboard.",
		},
		{
			question: "Do you offer discounts for annual subscriptions?",
			answer: "Yes, annual plans receive a 20% discount.",
		},
		{
			question: "What support options are available if I need help?",
			answer: "We provide email, live chat, and priority support options.",
		},
		{
			question: "Is there a mobile app available?",
			answer: "Yes, our app is available for both iOS and Android.",
		},
		{
			question: "What are benefits of using your analytics application?",
			answer:
				"Real-time insights, powerful dashboards, and collaboration tools.",
		},
		{
			question: "Is there any future prediction for business?",
			answer: "Yes, we use machine learning to provide predictive analytics.",
		},
	],
};

const TaskManagementPage: React.FC = () => {
	return (
		<>
			<HeroStyle3 data={heroData} />
			<FeaturesStyle4 data={featuresFourData} />
			<CardStyle3 data={cardThreeData} />
			<div className="cs_height_136 cs_height_lg_80"></div>
			<CardStyle4 data={cardFourData} styleVariant="cs_white_color" />
			<FeaturesStyle7 data={featuresSevenData} />
			<BrandStyle2 data={intrigrationData} />
			<CardStyle5 data={cardFiveData} />
			<PricingStyle3 data={pricingData} />
			<CtaStyle4 data={ctaData} />
			<FaqStyle3 data={faqData} />
		</>
	);
};

export default TaskManagementPage;
