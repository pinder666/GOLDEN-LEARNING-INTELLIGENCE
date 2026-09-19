import React from "react";
import ContactMethods from "../components/Contact/ContactMethods";
import ContactStyle2 from "../components/Contact/ContactStyle2";
import CtaStyle9 from "../components/Cta/CtaStyle9";

// ---------- Types (match ContactMethods props exactly) ----------
interface ContactLink {
	href: string;
	label: string;
	text: string;
}

interface ContactMethod {
	id: number;
	icon: string;
	title: string;
	text: string;
	link?: ContactLink;
	afterLink?: string;
	animation: string;
}

interface ContactMethodsData {
	methods: ContactMethod[];
}

interface ContactData {
	mintTitle: string;
	title: string;
}

interface CtaData {
	imgUrl: string;
	title: string;
	btnText: string;
}

// ---------- Data ----------
const contactMethodsData: ContactMethodsData = {
	methods: [
		{
			id: 1,
			icon: "/img/icons/phone.svg",
			title: "Call Us",
			text: "Call us at ",
			link: {
				href: "tel:+08823456790",
				label: "Call us link",
				text: "(+088-234-567-90)",
			},
			afterLink: ", available Monday to Friday, 9 AM to 5 PM.",
			animation: "fade-in-left",
		},
		{
			id: 2,
			icon: "/img/icons/email.svg",
			title: "Email Us",
			text: "Send us an email at ",
			link: {
				href: "mailto:info@gmail.com",
				label: "Send mail link",
				text: "info@gmail.com",
			},
			afterLink: ", and we’ll get back to you within 24 hours.",
			animation: "fade-in-down",
		},
		{
			id: 3,
			icon: "/img/icons/chat.svg",
			title: "Chat with us",
			text: "We're here to assist you Monday through Friday, from 9 AM to 5 PM EST.",
			// link: {
			// 	href: "mailto:info@gmail.com",
			// 	label: "Send mail link",
			// 	text: "info@gmail.com",
			// },
			afterLink: ", and we’ll get back to you within 24 hours.",
			animation: "fade-in-down",
		},
	],
};

const contactData: ContactData = {
	mintTitle: "ANY QUERY",
	title: "Feel free to fill out this form & contact us.",
};

const ctaData: CtaData = {
	imgUrl: "/img/support-img-group.png",
	title: "Any Questions? Our support team is available 24/7",
	btnText: "Live Chat Now",
};

const ContactPage: React.FC = () => {
	return (
		<>
			<ContactMethods data={contactMethodsData} />
			<ContactStyle2 data={contactData} />
			<CtaStyle9 data={ctaData} />
		</>
	);
};

export default ContactPage;
