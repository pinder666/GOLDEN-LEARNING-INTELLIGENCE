import CardStyle4 from "../components/Card/CardStyle4";
import CtaStyle8 from "../components/Cta/CtaStyle8";
import CtaStyle9 from "../components/Cta/CtaStyle9";
import FeaturesStyle2 from "../components/Features/FeaturesStyle2";
import FeaturesStyle3 from "../components/Features/FeaturesStyle3";
import FeaturesStyle6 from "../components/Features/FeaturesStyle6";
import IntegrationStyle1 from "../components/Integration/IntegrationStyle1";
import PageHeadingStyle1 from "../components/PageHeading/PageHeadingStyle1";

// ---------- Type Definitions ----------
interface CardFeature {
	id: number;
	title: string;
}

interface CardData4 {
	title: string;
	subTitle: string;
	imgUrl: string;
	badge1: string;
	badge2: string;
	features: CardFeature[];
}

interface FeatureThreeItem {
	id: number;
	title: string;
}

interface FeaturesThreeData {
	title: string;
	subTitle: string;
	imgUrl: string;
	imgUrl2: string;
	features?: FeatureThreeItem[];
	badge1?: string;
}

interface FeatureTwoItem {
	id: number;
	icon: string;
	title: string;
	desc: string;
}

interface FeatureTwoData {
	title: string;
	imgUrl: string;
	features?: FeatureTwoItem[];
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

interface FeaturesSixItem {
	id: number;
	icon: string;
	title: string;
	desc: string;
	url: string;
}

interface FeaturesSixData {
	title: string;
	subTitle: string;
	features: FeaturesSixItem[];
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

const cardFourData: CardData4 = {
	title: "Gain precise insights for your business",
	subTitle:
		"Our fast response system helps you tackle tasks efficiently, enabling you to focus on what truly matters and achieve your goals with ease.",
	imgUrl: "/img/feature_11.png",
	badge1: "/img/active-user.png",
	badge2: "/img/advance-search.png",
	features: [
		{
			id: 1,
			title: "Advanced Analytics Tools",
		},
		{ id: 2, title: "Real-time Data" },
		{
			id: 3,
			title: "Accurate Predictions",
		},
	],
};

const featureThreeData: FeaturesThreeData = {
	title: "Convert your data into meaningful insights",
	subTitle:
		"Gain precise insights for your business with our advanced analytics tools. Make informed decisions based on accurate, real-time data",
	imgUrl: "/img/feature_2.jpg",
	imgUrl2: "/img/Illustration.png",
	badge1: "/img/vector_1.svg",
	features: [
		{
			id: 1,
			title: "Actionable Insights",
		},
		{
			id: 2,
			title: "Enhanced Decision-Making",
		},
		{
			id: 3,
			title: "Improved Efficiency",
		},
	],
};

const featureTwoData: FeatureTwoData = {
	title: "Upgrade Your Business with Our CRM Solution",
	imgUrl: "/img/feature_12.png",
	features: [
		{
			id: 1,
			icon: "/img/icons/magnet-user.svg",
			title: "Smart Task Management",
			desc: "Effortlessly organize, plan, and track your tasks with intuitive tools, ensuring better productivity and time management.",
		},
		{
			id: 2,
			icon: "/img/icons/rocket-lunch.svg",
			title: "Real-Time Collaboration",
			desc: "Seamlessly work with your team, share updates instantly, and stay connected for efficient project coordination and communication.",
		},
		{
			id: 3,
			icon: "/img/icons/journey.svg",
			title: "Instant Notifications",
			desc: "Receive real-time alerts for important updates, messages, and reminders to stay informed and never miss a task.",
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
		{ id: 6, name: "Facebook", icon: "/img/icons/fscebook.svg" },
	],
};

const featuresSixData: FeaturesSixData = {
	title: "Discover our incredible features",
	subTitle:
		"With our intuitive dashboards and user-friendly interface, you can effortlessly explore and <br/> analyze your data, no matter your level of technical expertise.",
	features: [
		{
			id: 1,
			icon: "/img/icons/messages.svg",
			title: "Real‑Time Messaging",
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
			desc: "Make voice and video calls directly from the chat application, facilitating face‑to‑face.",
			url: "/features",
		},
	],
};

const ctaEightData: CtaEightData = {
	title: "Ready to enhance your sales & customer satisfaction?",
	features: [
		{ id: 1, title: "No credit card needed" },
		{ id: 2, title: "Free 14-day trial" },
	],
	btnText: "Sign Up Free",
};

const ctaNineData: CtaNineData = {
	imgUrl: "/img/support-img-group.png",
	title: "Any Questions? Our support team is available 24/7",
	btnText: "Live Chat Now",
};

const FeaturesPage: React.FC = () => {
	return (
		<>
			<PageHeadingStyle1
				title="Everything You Expect and <br /> More Features Beyond"
				subTitle="GoSaas delivers all the key features, offering a versatile <br /> platform to streamline your business operations."
			/>
			<CardStyle4 data={cardFourData} />
			<FeaturesStyle3
				data={featureThreeData}
				btnText="Get Started Now"
				btnUrl="/register"
			/>
			<FeaturesStyle2 data={featureTwoData} />
			<IntegrationStyle1 data={integrationData} />
			<div className="cs_height_140 cs_height_lg_80"></div>
			<FeaturesStyle6 data={featuresSixData} />
			<div className="cs_height_140 cs_height_lg_80"></div>
			<CtaStyle8 data={ctaEightData} />
			<div className="cs_height_135 cs_height_lg_80"></div>
			<CtaStyle9 data={ctaNineData} />
		</>
	);
};

export default FeaturesPage;

// interface Feature {
// 	title: string;
// 	desc?: string;
// 	icon?: string;
// 	url?: string;
// }

// interface FeaturesData {
// 	title: string;
// 	subTitle?: string;
// 	imgUrl?: string;
// 	imgUrl2?: string;
// 	features: Feature[];
// }

// interface IntegrationTool {
// 	id: number;
// 	name: string;
// 	icon: string;
// }

// interface IntegrationData {
// 	title: string;
// 	subtitle: string;
// 	tools: IntegrationTool[];
// }
