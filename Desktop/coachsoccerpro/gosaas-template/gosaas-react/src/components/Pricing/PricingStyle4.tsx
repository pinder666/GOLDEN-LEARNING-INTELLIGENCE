import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import { usePricingToggle } from "../../utils/hooks/usePricingToggle";
import PageHeadingStyle1 from "../PageHeading/PageHeadingStyle1";

interface Feature {
	label: string;
	available: boolean;
}

interface Plan {
	label: string;
	monthlyPrice: number;
	active?: boolean;
	buttonUrl?: string;
	buttonText?: string;
	features?: Feature[];
}

interface PricingData {
	title: string;
	plans: Plan[];
}

interface PricingStyle4Props {
	data: PricingData;
}

const PricingStyle4: React.FC<PricingStyle4Props> = ({ data }) => {
	const { title, plans } = data;
	const { pricingType, togglePricingType, getPrice } = usePricingToggle();

	return (
		<section>
			<PageHeadingStyle1 title={title} />
			<div className="container">
				<ul
					className="cs_pricing_control cs_center p-0 position-relative"
					data-aos="fade-up"
					data-aos-duration="800"
				>
					<li className={pricingType === "monthly" ? "active" : ""}>
						<span aria-label="Monthly Pricing Toggle">Monthly</span>
						<span className="cs_switch" onClick={togglePricingType}></span>
					</li>
					<li className={pricingType === "yearly" ? "active" : ""}>
						<span aria-label="Annual Pricing Toggle">Annually</span>
						<div className="cs_offer_info cs_accent_color position-absolute">
							<svg
								width="80"
								height="50"
								viewBox="0 0 100 70"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M95.4467 61.5972C83.1576 64.6609 68.4841 65.243 57.6842 57.5057C50.7824 52.5611 47.1174 42.5625 49.6968 34.4469C52.1328 26.7823 57.8215 20.0479 66.3461 20.2532C70.7894 20.3602 74.6205 22.4045 75.4294 27.0838C76.6651 34.2327 69.5335 41.6306 63.8633 44.7403C46.1676 54.445 21.1344 53.9049 4.27723 42.6404"
									stroke="currentColor"
									strokeWidth="3"
									strokeLinecap="round"
								/>
								<path
									d="M11.707 55.8442C9.64507 52.963 5.14232 46.2413 3.62706 42.4049"
									stroke="currentColor"
									strokeWidth="3"
									strokeLinecap="round"
								/>
								<path
									d="M3.62695 42.4053C7.1396 41.9418 15.124 40.636 18.9603 39.1207"
									stroke="currentColor"
									strokeWidth="3"
									strokeLinecap="round"
								/>
							</svg>
							<span>Save 25%</span>
						</div>
					</li>
				</ul>

				<div
					className="cs_pricing_table_wrapper"
					data-aos="fade-up"
					data-aos-duration="800"
				>
					{plans?.map((plan, index) => (
						<div
							key={index}
							className={`cs_pricing_table cs_style_1 cs_white_bg cs_radius_15 ${
								plan.active ? "active" : ""
							}`}
						>
							<div className="cs_pricing_head cs_center_column cs_mb_24 text-center">
								<p className="cs_medium cs_purple_color cs_mb-5">
									{plan.label}
								</p>
								<h2 className="cs_fs_50  cs_mb-5">
									${getPrice(plan.monthlyPrice)}
								</h2>
								<p className="cs_pricing_head_subtitle cs_mb_29">
									{pricingType === "monthly" ? "Per month" : "Per year"}, billed
									{pricingType === "monthly" ? " monthly" : " annually"}
								</p>
								<Link
									to="/contact"
									aria-label="Buy service button"
									className="cs_pricing_btn cs_fs_16 cs_semibold cs_heading_color"
								>
									{plan.buttonText || "Purchase Now"}
								</Link>
							</div>
							<div className="mt-auto">
								<ul className="cs_pricing_feature_list cs_mp_0">
									{plan?.features?.map((feature, i) => (
										<li
											key={i}
											className={
												feature.available ? "cs_heading_color" : "cs_body_color"
											}
										>
											<Icon
												icon={
													feature.available
														? "fa6-solid:check"
														: "fa6-solid:xmark"
												}
												className={feature.available ? "cs_purple_color" : ""}
											/>
											{feature.label}
										</li>
									))}
								</ul>
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
};

export default PricingStyle4;
