import { Icon } from "@iconify/react";
import parser from "html-react-parser";
import { Link } from "react-router-dom";
import { usePricingToggle } from "../../utils/hooks/usePricingToggle";
import { FC } from "react";

interface PricingPlan {
	name: string;
	monthlyPrice: number;
	features: string[];
	popular?: boolean;
}

interface PricingData {
	title: string;
	plans: PricingPlan[];
}

interface PricingStyle2Props {
	data: PricingData;
	styleVariant?: string;
}

const PricingStyle2: FC<PricingStyle2Props> = ({ data, styleVariant }) => {
	const { title, plans } = data;
	const { pricingType, togglePricingType, getPrice } = usePricingToggle();

	return (
		<section className={`${styleVariant || ""}`}>
			<div className="cs_height_130 cs_height_lg_80" />
			<div className="container">
				<div className="cs_section_heading cs_style_1 cs_mb_60 text-center">
					<h2
						className="cs_section_title cs_fs_50 cs_bold mb-0 wow animate__aos fadeInDown"
						data-aos="fade-down"
						data-aos-duration="800"
					>
						{parser(title)}
					</h2>
				</div>

				<ul
					className="cs_pricing_control cs_type_1 cs_center p-0 position-relative"
					data-aos="fade-up"
					data-aos-duration="800"
				>
					<li className={pricingType === "monthly" ? "active" : ""}>
						<span>Monthly</span>
						<span
							className="cs_switch cursor-pointer"
							onClick={togglePricingType}
							title="Toggle Button"
						/>
					</li>
					<li className={pricingType === "annually" ? "active" : ""}>
						<span>Annually</span>
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
								></path>
							</svg>
							<span className="cs_custom_color">Save 25%</span>
						</div>
					</li>
				</ul>

				<div className="row cs_gap_y_24">
					{plans?.map((plan, index) => (
						<div
							key={index}
							className="col-xl-3 col-md-6 aos fadeInDown"
							data-aos="fade-up"
							data-aos-duration="800"
						>
							<div
								className={`cs_pricing_table cs_style_1 cs_type_1 cs_white_bg cs_radius_15 position-relative ${
									plan.popular ? "overflow-hidden" : ""
								}`}
							>
								{plan.popular && (
									<span className="cs_pricing_badge cs_fs_16 position-absolute">
										Most Popular
									</span>
								)}
								<div className="cs_pricing_head cs_center_column cs_mb_24 text-center">
									<p className="cs_medium cs_purple_color cs_mb_5">
										{plan.name}
									</p>
									<h2 className="cs_fs_50 cs_bold cs_mb_5">
										${getPrice(plan.monthlyPrice)}
										<small className="cs_fs_18 cs_normal">/{pricingType}</small>
									</h2>
									<p className="cs_pricing_head_subtitle cs_mb_29">
										Per person, billed {pricingType}
									</p>
									<Link
										to="/contact"
										className="cs_pricing_btn cs_fs_16 cs_semibold cs_heading_color"
									>
										Sign Up Free
									</Link>
								</div>
								<div className="mt-auto">
									<ul className="cs_pricing_feature_list cs_mp_0">
										{plan?.features?.map((feature, fIdx) => (
											<li key={fIdx} className="cs_heading_color">
												<Icon
													icon="fa6-solid:check"
													className="cs_purple_color"
												/>
												{feature}
											</li>
										))}
									</ul>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
			<div className="cs_height_140 cs_height_lg_80" />
		</section>
	);
};

export default PricingStyle2;
