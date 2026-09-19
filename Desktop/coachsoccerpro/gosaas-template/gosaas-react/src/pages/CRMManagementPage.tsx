import React from "react";
import FaqStyle1 from "../components/Faq/FaqStyle1";
import FeaturesStyle1 from "../components/Features/FeaturesStyle1";
import HeroStyle1 from "../components/Hero/HeroStyle1";
import SoccerPricing from "../components/Pricing/SoccerPricing";
import TestimonialStyle1 from "../components/Testimonial/TestimonialStyle1";

/* =========================
   Interfaces
========================= */

interface HeroData {
	title: string;
	subTitle: string;
	imgUrl: string;
	btnText1: string;
	btnUrl1: string;
	videoBtnText: string;
	videoSrc: string;
}

interface FeatureItem {
	id: number;
	title: string;
	description: string;
	icon: string;
	icon_bg: string;
}

interface FeatureOneData {
	title: string;
	subTitle: string;
	features: FeatureItem[];
}

interface TestimonialItem {
	id: number;
	avatar?: string;
	name: string;
	designation?: string;
	message: string;
	rating?: number;
}

interface TestimonialData {
	title: string;
	subTitle: string;
	testimonial: TestimonialItem[];
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

/* =========================
   Data
========================= */

const heroData: HeroData = {
	title: "The Coaching Platform Built for the Beautiful Game",
	subTitle:
		"A coach's greatest moment isn't a trophy. It's the parent who pulls you aside and says my kid talks about you every night at dinner. <span style=\"display: block; margin-top: 12px; font-size: 1.2em; font-weight: 700; color: #2d5a1b; border-left: 4px solid #2d5a1b; padding-left: 12px;\">We give you the time to be that coach.</span>",
	imgUrl: "/img/hero_img_4.jpg",
	btnText1: "Start Free",
	btnUrl1: "/register",
	videoBtnText: "Watch Demo",
	videoSrc: "https://www.youtube.com/embed/U3IfeAqciL0",
};

const featureOneData: FeatureOneData = {
	title: "The Assistant You Always Needed. <br /> Powered by AI.",
	subTitle:
		"The AI handles the messages, the payments, the updates, the reports, the session plans and the parent questions. You just show up and coach. Finally.",
	features: [
		{
			id: 1,
			title: "WhatsApp Messaging",
			description:
				"One message inside SoccerCoachPro <br /> reaches every parent on WhatsApp <br /> instantly. Parents reply on WhatsApp. <br /> AI answers the routine questions. <br /> You never pick up your phone.",
			icon: "/img/icons/browser.svg",
			icon_bg: "cs_accent_bg",
		},
		{
			id: 2,
			title: "Payment Collection",
			description:
				"Set your dues, parents pay securely, <br /> late payments get chased automatically. <br /> No spreadsheets. No awkward <br /> conversations. Money handled.",
			icon: "/img/icons/stats.svg",
			icon_bg: "cs_bg_1",
		},
		{
			id: 3,
			title: "Player Development Analytics",
			description:
				"AI reads every note, badge, attendance <br /> record and wellness score across the <br /> season and tells you exactly what each <br /> player needs to work on next. You just act.",
			icon: "/img/icons/point-of-sale-bill.svg",
			icon_bg: "cs_bg_2",
		},
		{
			id: 4,
			title: "Badge and Confidence Engine",
			description:
				"Award a badge in one tap. Kid gets <br /> notified. Parent gets notified. Player <br /> card updates. The moment of recognition <br /> that keeps a child in the sport.",
			icon: "/img/icons/browser.svg",
			icon_bg: "cs_accent_bg",
		},
		{
			id: 5,
			title: "AI Session Planner",
			description:
				"Tell the AI what your team struggled <br /> with last game. It builds your entire <br /> training session with drills, timing <br /> and progressions. Coach never spends <br /> Sunday night on YouTube again.",
			icon: "/img/icons/stats.svg",
			icon_bg: "cs_bg_1",
		},
		{
			id: 6,
			title: "End of Season Reports",
			description:
				"Nine months of data compiled <br /> automatically into a personal <br /> development report for every single <br /> player. Coach approves in one tap. <br /> Parents never forget it.",
			icon: "/img/icons/point-of-sale-bill.svg",
			icon_bg: "cs_bg_2",
		},
	],
};

const testimonialData: TestimonialData = {
	title: "What Coaches Are Saying",
	subTitle: "",
	testimonial: [
		{
			id: 1,
			avatar: "/img/avatar-1.jpg",
			name: "Coach Mike R.",
			designation: "Youth Academy Coach, Las Vegas",
			message:
				"I used to spend three hours a week on admin every evening. Now it takes me twenty minutes and every parent knows exactly how their child is progressing.",
			rating: 5,
		},
		{
			id: 2,
			avatar: "/img/avatar-2.jpg",
			name: "Sarah T.",
			designation: "Club Director, London FC",
			message:
				"The badge system changed everything. Kids who used to quit at 13 are staying because they finally feel seen by their coach.",
			rating: 5,
		},
		{
			id: 3,
			avatar: "/img/avatar-3.jpg",
			name: "James K.",
			designation: "Grassroots Coach, Chicago",
			message:
				"My parents thought I just rolled out a ball. Now they can see every note I write, every badge I award. My retention is up 40 percent this season.",
			rating: 5,
		},
	],
};

const faqData: FaqData = {
	title: "Questions? We've Got Answers.",
	subTitle: "",
	faqs: [
		{
			id: 1,
			question: "Do I need to download an app?",
			answer:
				"No. SoccerCoachPro is a Progressive Web App. Access it from any browser and add it to your home screen in one tap. Nothing to download.",
		},
		{
			id: 2,
			question: "How does the WhatsApp integration work?",
			answer:
				"You type once inside SoccerCoachPro. It sends through WhatsApp to every parent automatically. Parents reply on WhatsApp as normal and our AI answers routine questions automatically.",
		},
		{
			id: 3,
			question: "What ages does this work for?",
			answer:
				"We built this for youth players ages 8-16, but coaches use it for younger kids too. The badge system works for any age.",
		},
		{
			id: 4,
			question: "Can I use this in Spanish?",
			answer:
				"Absolutely. Full Spanish support built in from day one — not just translations, but native Spanish written by Spanish speakers.",
		},
		{
			id: 5,
			question: "How do payments work?",
			answer:
				"You can collect dues, tournament fees, and equipment payments right in the app. Parents pay by card, you get paid in 2 days. We charge 1.5% per transaction.",
		},
	],
};

/* =========================
   Page
========================= */

const CRMManagementPage: React.FC = () => {
	return (
		<>
			<HeroStyle1 data={heroData} />
			<FeaturesStyle1 data={featureOneData} />
			<div className="cs_height_132 cs_height_lg_72" />
			<TestimonialStyle1 data={testimonialData} />
			<SoccerPricing />
			<FaqStyle1 data={faqData} />
		</>
	);
};

export default CRMManagementPage;
