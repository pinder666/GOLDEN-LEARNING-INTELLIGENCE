import React from "react";
import ResetPassword from "../components/Auth/ResetPassword";
import CtaStyle9 from "../components/Cta/CtaStyle9";

// Reusing the CtaData interface from shared types (recommended)
interface CtaData {
	imgUrl: string;
	title: string;
	btnText: string;
}

const ctaData: CtaData = {
	imgUrl: "/img/support-img-group.png",
	title: "Any Questions? Our support team is available 24/7",
	btnText: "Live Chat Now",
};

const ResetPasswordPage: React.FC = () => {
	return (
		<>
			<ResetPassword />
			<CtaStyle9 data={ctaData} />
		</>
	);
};

export default ResetPasswordPage;
