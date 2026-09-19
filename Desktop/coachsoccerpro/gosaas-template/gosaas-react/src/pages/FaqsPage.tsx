import CtaStyle8 from "../components/Cta/CtaStyle8";
import CtaStyle9 from "../components/Cta/CtaStyle9";
import FaqStyle1 from "../components/Faq/FaqStyle1";

interface FaqItem {
	question: string;
	answer: string;
}

interface FaqData {
	title: string;
	subTitle?: string;
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

const faqData: FaqData = {
	title: "Answers to Your Frequently <br /> Asked Questions",
	subTitle: "",
	faqs: [
		{
			question: "What data types does your analytics application support?",
			answer:
				"Lorem, ipsum dolor sit amet consectetur adipisicing elit. Temporibus quos vitae, consectetur eos, aut porro repellat quas eum reprehenderit magnam natus, voluptatem tempore numquam. Similique, dicta porro.",
		},
		{
			question: "Do you offer a free trial of your analytics application?",
			answer:
				"Yes, we offer a 14-day free trial so you can explore all features before purchasing.",
		},
		{
			question: "Can I upgrade or downgrade my plan at any time?",
			answer:
				"Absolutely! You can change your plan at any time directly from your dashboard.",
		},
		{
			question: "Do you offer discounts for annual subscriptions?",
			answer:
				"Yes! We offer up to 20% discounts on yearly plans compared to monthly subscriptions.",
		},
		{
			question: "What support options are available if I need help?",
			answer:
				"We provide 24/7 chat support, a help center, and personal onboarding for enterprise plans.",
		},
		{
			question: "Is there a mobile app available?",
			answer:
				"Yes, we have both iOS and Android apps available for download on their respective stores.",
		},
		{
			question: "What are benefits of using your analytics application?",
			answer:
				"Real-time data tracking, AI-driven insights, custom reports, and integration with over 100 tools.",
		},
		{
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

const FaqsPage: React.FC = () => {
	return (
		<>
			<FaqStyle1 data={faqData} />
			<div className="cs_height_132 cs_height_lg_70"></div>
			<CtaStyle8 data={ctaData} />
			<div className="cs_height_135 cs_height_lg_80"></div>
			<CtaStyle9 data={ctaTwoData} />
		</>
	);
};

export default FaqsPage;
