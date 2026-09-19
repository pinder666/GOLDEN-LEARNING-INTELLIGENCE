import CtaStyle8 from "../components/Cta/CtaStyle8";
import CtaStyle9 from "../components/Cta/CtaStyle9";
import IntegrationStyle2 from "../components/Integration/IntegrationStyle2";
import IntegrationStyle3 from "../components/Integration/IntegrationStyle3";

// ---------- Type Definitions ----------
interface IntegrationTwoTools {
	id: number;
	name: string;
	icon: string;
	desc?: string;
}

interface IntegrationTwoData {
	title: string;
	subtitle: string;
	tools: IntegrationTwoTools[];
}

interface IntegrationThreeTools {
	id: number;
	name: string;
	icon: string;
	desc?: string;
}

interface IntegrationThreeData {
	title: string;
	subtitle: string;
	tools: IntegrationThreeTools[];
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

const integrationTwoData: IntegrationTwoData = {
	title: "Seamless App Integration <br /> for  Effortless Connectivity",
	subtitle:
		"Effortlessly connect and integrate your favorite apps to enhance             <br /> functionality and streamline your workflows.",
	tools: [
		{ id: 1, name: "Discord", icon: "/img/icons/discord.svg" },
		{ id: 2, name: "Slack", icon: "/img/icons/slack.svg" },
		{ id: 3, name: "Microsoft", icon: "/img/icons/microsoft.svg" },
		{ id: 4, name: "Spotify", icon: "/img/icons/spotify.svg" },
		{ id: 5, name: "Google", icon: "/img/icons/google.svg" },
		{ id: 6, name: "Facebook", icon: "/img/icons/fscebook.svg" },
	],
};

const integrationThreeData: IntegrationThreeData = {
	title: "Essential Tools Integration",
	subtitle:
		"Unlock the full potential of your data with our comprehensive analytics solutions. we <br/> provide the tools you need to make informed decisions & drive business growth.",
	tools: [
		{
			id: 1,
			name: "Discord",
			icon: "/img/icons/discord-l.svg",
			desc: "Sync with platforms like Twitch or YouTube to notify your community when you go live or upload new content.",
		},
		{
			id: 2,
			name: "Slack",
			icon: "/img/icons/slack-l.svg",
			desc: "Sync with platforms like Twitch or YouTube to notify your community when you go live or upload new content.",
		},
		{
			id: 3,
			name: "Microsoft",
			icon: "/img/icons/microsoft-l.svg",
			desc: "Sync with platforms like Twitch or YouTube to notify your community when you go live or upload new content.",
		},
		{
			id: 4,
			name: "Jira",
			icon: "/img/icons/jira-l.svg",
			desc: "Sync with platforms like Twitch or YouTube to notify your community when you go live or upload new content.",
		},
		{
			id: 5,
			name: "Google",
			icon: "/img/icons/google-l.svg",
			desc: "Sync with platforms like Twitch or YouTube to notify your community when you go live or upload new content.",
		},
		{
			id: 6,
			name: "Zapier",
			icon: "/img/icons/zapier-l.svg",
			desc: "Sync with platforms like Twitch or YouTube to notify your community when you go live or upload new content.",
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

const IntegrationPage: React.FC = () => {
	return (
		<>
			<IntegrationStyle2 data={integrationTwoData} />
			<div className="cs_height_140 cs_height_lg_80"></div>
			<IntegrationStyle3 data={integrationThreeData} />
			<div className="cs_height_132 cs_height_lg_70"></div>
			<CtaStyle8 data={ctaEightData} />
			<div className="cs_height_135 cs_height_lg_80"></div>
			<CtaStyle9 data={ctaNineData} />
		</>
	);
};

export default IntegrationPage;
