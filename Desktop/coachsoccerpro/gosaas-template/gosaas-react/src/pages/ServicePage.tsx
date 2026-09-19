import CtaStyle8 from "../components/Cta/CtaStyle8";
import CtaStyle9 from "../components/Cta/CtaStyle9";
import FaqStyle2 from "../components/Faq/FaqStyle2";
import FeaturesStyle8 from "../components/Features/FeaturesStyle8";
import TestimonialStyle1 from "../components/Testimonial/TestimonialStyle1";

interface FeatureItem {
	id: number;
	icon: string;
	iconBg: string;
	title: string;
	desc: string;
}

interface FeaturesData {
	title: string;
	subTitle: string;
	features?: FeatureItem[];
}

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

const featuresData: FeaturesData = {
	title: "GoSaas: Your All-in-One <br/> Solution for Business Success",
	subTitle:
		"We offers a comprehensive platform with all the tools you need <br/> to streamline and grow your business efficiently.",
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

const faqData: FaqData = {
	title: "Got Questions? We've <br/> Got Answers!",
	subTitle:
		"Get answers to frequently asked questions about our app, covering features, security, pricing, availability, and more to ensure a smooth and informed user experience.",
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

const ServicePage: React.FC = () => {
	return (
		<>
			<FeaturesStyle8 data={featuresData} />
			<TestimonialStyle1 data={testimonialData} />
			<FaqStyle2 data={faqData} />
			<div className="cs_height_122 cs_height_lg_70"></div>
			<CtaStyle8 data={ctaEightData} />
			<div className="cs_height_135 cs_height_lg_80"></div>
			<CtaStyle9 data={ctaNineData} />
		</>
	);
};

export default ServicePage;
