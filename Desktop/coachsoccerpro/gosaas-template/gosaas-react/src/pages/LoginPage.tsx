import Login from "../components/Auth/Login";
import CtaStyle9 from "../components/Cta/CtaStyle9";

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

const LoginPage: React.FC = () => {
	return (
		<>
			<Login />
			<CtaStyle9 data={ctaData} />
		</>
	);
};

export default LoginPage;
