import BlogStyle2 from "../components/Blog/BlogStyle2";
import CtaStyle8 from "../components/Cta/CtaStyle8";
import CtaStyle9 from "../components/Cta/CtaStyle9";
import PageHeadingStyle1 from "../components/PageHeading/PageHeadingStyle1";

interface BlogPost {
	id: number; // Changed to number type
	title: string;
	imgUrl: string;
	desc: string;
	date: string;
	author: string;
	blogSlug: string;
}

interface BlogData {
	title: string;
	subTitle: string;
	blogs: BlogPost[];
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

const blogData: BlogData = {
	title: "Latest Insights & Updates",
	subTitle:
		"Stay informed with our latest articles and updates, covering <br/> trends, tips, and insights to help you grow.",
	blogs: [
		{
			id: 1, // Changed to number
			title: "Strategies for your Post-Pandemic Workplace",
			imgUrl: "/img/post-5.jpg",
			desc: "Discover key strategies to adapt your workplace after the pandemic, from flexible policies and hybrid models to employee well-being, technology integration, and maintaining strong team collaboration post-crisis.",
			date: "Jun 25, 2025",
			author: "Emma Carter",
			blogSlug: "strategies-for-your-post-pandemic-workplace",
		},
		{
			id: 2,
			title: "Making a Positive Impact Beyond your Profits",
			imgUrl: "/img/post-6.jpg",
			desc: "Explore how businesses can make a meaningful difference beyond financial success by focusing on sustainability, social responsibility, ethical practices, and creating value for communities and future generations.",
			date: "Aug 01, 2025",
			author: "Liam Bennett",
			blogSlug: "making-a-positive-impact-beyond-your-profits",
		},
		{
			id: 3,
			title: "Protecting Your Business from Data Breaches",
			imgUrl: "/img/post-7.jpg",
			desc: "Learn how to shield your company from data breaches with strong cybersecurity practices, employee training, threat detection, backup strategies, secure systems, and a clear incident response plan.",
			date: "Sep 14, 2025",
			author: "Sophia Reynolds",
			blogSlug: "protecting-your-business-from-data-breaches",
		},
		{
			id: 4,
			title: "Navigating the Complex Path to Corporate Growth",
			imgUrl: "/img/post-8.jpg",
			desc: "Understand how to grow your business strategically by leveraging innovation, market expansion, smart investments, performance tracking, and leadership development while managing risks and aligning with long-term vision.",
			date: "Jun 25, 2025",
			author: "Noah Mitchell",
			blogSlug: "navigating-the-complex-path-to-corporate-growth",
		},
		{
			id: 5,
			title: "Enhancing User Experience with Custom Web Designs",
			imgUrl: "/img/post-1.jpg",
			desc: "Discover how custom web design can set your brand apart and create a more engaging user experience. This blog covers the benefits of personalized designs, from improving navigation to reinforcing brand identity.",
			date: "Jun 25, 2025",
			author: "Syful Khan",
			blogSlug: "enhancing-user-experience-with-custom-web-designs",
		},
		{
			id: 6,
			title: "The Importance of SEO in Growing Your Online Store",
			imgUrl: "/img/post-2.jpg",
			desc: "Learn why SEO is essential for any online business and how it can help drive organic traffic to your store. This blog provides tips on optimizing product listings, keywords, and content to rank higher in search results.",
			date: "Aug 01, 2025",
			author: "Shariful UK",
			blogSlug: "the-importance-of-seo-in-growing-your-online-store",
		},
		{
			id: 7,
			title: "Effective Marketing Strategies for Small Businesses",
			imgUrl: "/img/post-3.jpg",
			desc: "This blog offers actionable marketing strategies tailored for small businesses. Learn how to make the most of your limited resources with cost-effective tactics like content marketing, email campaigns, and local SEO.",
			date: "Sep 14, 2025",
			author: "Ripon Hossain",
			blogSlug: "effective-marketing-strategies-for-small-businesses",
		},
		{
			id: 8,
			title: "How to Streamline Your Business with Automation",
			imgUrl: "/img/post-4.jpg",
			desc: "Discover how automation tools can help you save time, reduce errors, and improve productivity. This blog covers the best practices for automating tasks like order management, customer communication, and data syncing across different platforms.",
			date: "Jun 25, 2025",
			author: "Mamun",
			blogSlug: "how-to-streamline-your-business-with-automation",
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

const BlogPage: React.FC = () => {
	return (
		<>
			<PageHeadingStyle1
				title="Latest Insights & Updates"
				subTitle="Stay informed with our latest articles and updates, covering <br/> trends, tips, and insights to help you grow."
			/>
			<BlogStyle2 data={blogData} />
			<div className="cs_height_132 cs_height_lg_70"></div>
			<CtaStyle8 data={ctaEightData} />
			<div className="cs_height_135 cs_height_lg_80"></div>
			<CtaStyle9 data={ctaNineData} />
		</>
	);
};

export default BlogPage;
