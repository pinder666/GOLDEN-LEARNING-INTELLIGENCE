import React from "react";
import Register from "../components/Auth/Register";
import CtaStyle9 from "../components/Cta/CtaStyle9";

// Define interface for CTA data (can be moved to a shared types file if reused)
interface CtaData {
	imgUrl: string;
	title: string;
	btnText: string;
}

// CTA data with type annotation
const ctaData: CtaData = {
	imgUrl: "/img/support-img-group.png",
	title: "Any Questions? Our support team is available 24/7",
	btnText: "Live Chat Now",
};

const RegisterPage: React.FC = () => {
	return (
		<>
			<Register />
			<CtaStyle9 data={ctaData} />
		</>
	);
};

export default RegisterPage;
