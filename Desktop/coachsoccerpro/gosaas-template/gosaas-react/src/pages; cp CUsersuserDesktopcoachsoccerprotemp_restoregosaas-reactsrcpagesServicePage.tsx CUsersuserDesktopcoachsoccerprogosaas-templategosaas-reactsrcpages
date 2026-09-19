import CtaStyle8 from "../components/Cta/CtaStyle8";
import CtaStyle9 from "../components/Cta/CtaStyle9";
import FaqStyle2 from "../components/Faq/FaqStyle2";
import PricingStyle4 from "../components/Pricing/PricingStyle4";

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
	subTitle: string;
	faqs: FaqItem[];
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
	title: "Answers to Your Frequently<br/>Asked Questions",
	subTitle:
		"Find answers to common questions about our CRM application, including features, usage, and troubleshooting tips to help you get the most out of our solution.",
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
				"Yes, we offer a 14-day free trial so you can explore all features before purchasing.",
		},
		{
			id: 3,
			question: "Can I upgrade or downgrade my plan at any time?",
			answer:
				"Absolutely! You can change your plan at any time directly from your dashboard.",
		},
		{
			id: 4,
			question: "Do you offer discounts for annual subscriptions?",
			answer:
				"Yes! We offer up to 20% discounts on yearly plans compared to monthly subscriptions.",
		},
		{
			id: 5,
			question: "What support options are available if I need help?",
			answer:
				"We provide 24/7 chat support, a help center, and personal onboarding for enterprise plans.",
		},
		{
			id: 6,
			question: "Is there a mobile app available?",
			answer:
				"Yes, we have both iOS and Android apps available for download on their respective stores.",
		},
		{
			id: 7,
			question: "What are benefits of using your analytics application?",
			answer:
				"Real-time data tracking, AI-driven insights, custom reports, and integration with over 100 tools.",
		},
		{
			id: 8,
			question: "Is there any future prediction for business?",
			answer:
				"Yes, our platform uses machine learning to offer predictive analytics tailored to your data.",
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

const PricingPage: React.FC = () => {
	return (
		<>
			<PricingStyle4 data={pricingData} />
			<div className="cs_height_130 cs_height_lg_80"></div>
			<FaqStyle2 data={faqData} />
			<div className="cs_height_122 cs_height_lg_70"></div>
			<CtaStyle8 data={ctaData} />
			<div className="cs_height_135 cs_height_lg_80"></div>
			<CtaStyle9 data={ctaTwoData} />
		</>
	);
};

export default PricingPage;
