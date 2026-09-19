// BackToTop.tsx

import { useBackToTop } from "./hooks/useBackToTop";

const BackToTop = () => {
	const { isVisible, scrollToTop } = useBackToTop();

	return (
		<button
			type="button"
			aria-label="Scroll to top"
			className={`cs_scrollup cs_purple_bg cs_white_color cs_radius_100 cs_back_to_top ${
				isVisible ? "cs_scrollup_show" : ""
			}`}
			onClick={scrollToTop}
		>
			<svg
				width="20"
				height="20"
				viewBox="0 0 20 20"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					d="M0 10L1.7625 11.7625L8.75 4.7875V20H11.25V4.7875L18.225 11.775L20 10L10 0L0 10Z"
					fill="currentColor"
				/>
			</svg>
		</button>
	);
};

export default BackToTop;
