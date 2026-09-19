import React from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import parser from "html-react-parser";
import { Link } from "react-router-dom";
import { usePricingToggle } from "../../utils/hooks/usePricingToggle";

/* ---------- Types ---------- */

interface Feature {
	available?: boolean;
	label?: string;
}

/** Accept either boolean flags or full Feature objects */
type PlanFeature = boolean | Feature;

interface PricingPlan {
	id: number;
	title: string;
	subtitle: string;
	monthly: number;
	yearly?: number;
	features: PlanFeature[];
	badge?: string;
}

interface PricingData {
	title: string;
	subTitle: string;
	icon: string;
	plan: PricingPlan[];
}

interface PricingStyle5Props {
	data: PricingData;
	styleVariant?: string;
	switchBtn?: boolean;
}

/* ---------- Component ---------- */

const PricingStyle5: React.FC<PricingStyle5Props> = ({
	data,
	styleVariant,
	switchBtn = true,
}) => {
	const { title, plan } = data;
	const { pricingType, togglePricingType, getPrice } = usePricingToggle();

	// Default labels used when you only provide boolean[] in data.plan[].features
	const defaultFeatures = [
		"Unlimited cards",
		"Up to 10 boards per",
		"Unlimited Power-Ups per board",
		"Unlimited storage (10MB/file)",
		"Unlimited activity log",
		"Assignee and due dates",
		"Assignee and due dates",
	];

	// Normalize features to { available, label } for rendering
	const normalizeFeatures = (
		features: PlanFeature[] = []
	): Required<Feature>[] =>
		features.map((f, i) => {
			if (typeof f === "boolean") {
				return {
					available: f,
					label: defaultFeatures[i] ?? "Feature",
				};
			}
			return {
				available: !!f.available,
				label: f.label ?? defaultFeatures[i] ?? "Feature",
			};
		});

	return (
		<section className={`position-relative ${styleVariant || "cs_accent_bg"}`}>
			<div className="cs_height_125 cs_height_lg_70" />
			<div className="container position-relative z-1">
				<div className="cs_section_heading cs_style_1 cs_mb_42 text-center">
					<h2
						className="cs_section_title cs_fs_50 mb-0 aos fadeInDown"
						data-aos="fade-down"
						data-aos-duration="800"
					>
						{parser(title)}
					</h2>
				</div>

				{/* Monthly / Annual switch */}
				<ul
					className={`cs_pricing_control cs_type_1 cs_center p-0 position-relative ${
						!switchBtn ? "d-none" : ""
					}`}
				>
					<li className={pricingType === "monthly" ? "active" : ""}>
						<span>Monthly</span>
						<span
							onClick={togglePricingType}
							className="cs_switch cursor-pointer"
						/>
					</li>
					<li className={pricingType === "annually" ? "active" : ""}>
						<span>Annually</span>
						<div className="cs_offer_info cs_type_1 cs_heading_color position-absolute">
							<svg
								width="64"
								height="27"
								viewBox="0 0 64 27"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
								aria-hidden="true"
							>
								<path
									d="M63.2728 3.31355C62.7609 2.99354 62.1574 2.63567 61.6072 2.40842C57.7794 0.50156 53.6369 -0.123714 49.2796 0.0309426C42.8353 0.300803 36.7947 1.93186 30.8527 4.36371C21.1406 8.38715 12.8326 14.7279 5.70033 22.6402C5.66202 22.7329 5.6237 22.8257 5.45538 22.9733C6.05891 23.3312 6.57075 23.6512 7.26597 24.047C6.08085 24.3175 4.98743 24.6259 3.894 24.9344C3.80231 24.8965 3.74893 24.7659 3.74893 24.7659C4.22376 23.8762 4.75197 23.1171 5.2268 22.2274C7.73785 18.487 10.2489 14.7465 12.7599 11.0061C12.8366 10.8206 12.8749 10.7278 12.9515 10.5423C12.8981 10.4117 12.8064 10.3738 12.7148 10.3359C10.9959 9.30018 10.9959 9.30018 9.67942 10.9281C7.0233 14.5 4.32887 18.1647 1.67275 21.7366C1.27455 22.4408 0.929723 23.2756 0.714902 24.0556C0.423455 25.021 0.782037 25.712 1.66064 26.1835C2.68432 26.8235 3.82294 27.1853 5.17638 26.7671C8.71667 25.732 12.3103 24.8276 15.9423 23.8304C16.3324 23.6658 16.7224 23.5011 17.1658 23.4671C17.2041 23.3743 17.1124 23.3365 17.1124 23.3365C15.6384 21.9675 14.0181 21.7326 12.2514 22.6316C11.5631 22.9987 10.768 23.1047 9.80453 23.3582C9.88116 23.1727 9.91947 23.0799 10.0495 23.025C15.9872 17.2254 22.3218 12.024 29.6336 8.09485C37.1137 4.0181 45.2111 1.82507 53.819 1.25449C56.441 1.14314 59.0015 1.4407 61.3623 2.74158C61.9658 3.09945 62.6843 3.17906 63.2344 3.4063L63.2728 3.31355Z"
									fill="#6C6C6C"
								/>
							</svg>
							<span>Save 20%</span>
						</div>
					</li>
				</ul>

				<div
					className="cs_pricing_table_wrapper_2"
					data-aos="fade-up"
					data-aos-duration="800"
				>
					{plan?.map((item, index) => {
						const features = normalizeFeatures(item.features);

						return (
							<div
								key={item.id ?? index}
								className={`cs_pricing_table cs_style_1 cs_type_3 cs_white_bg cs_radius_20 position-relative wow  ${
									index === 0
										? "fade-in-left"
										: index === 1
										? "animate__fadeInDown active overflow-hidden"
										: "fade-in-right"
								}`}
							>
								{item.badge && (
									<span className="cs_pricing_badge cs_fs_16 position-absolute">
										{item.badge}
									</span>
								)}

								<div className="cs_pricing_head cs_mb_14">
									<h2 className="cs_fs_38 mb-0">{item.title}</h2>
									<p className="cs_mb_18">{item.subtitle}</p>
									<hr />
								</div>

								<h3 className="cs_fs_38 cs_mb_17">
									$
									{getPrice(
										pricingType === "monthly"
											? item.monthly
											: item.yearly ?? item.monthly
									)}
									<small className="cs_fs_18 cs_normal cs_gray2_color">
										/{pricingType}
									</small>
								</h3>

								<div className="cs_mb_36">
									<ul className="cs_pricing_feature_list cs_mp_0">
										{features.map((feature, i) => (
											<li key={i}>
												<span className="cs_feature_icon cs_center cs_radius_100 cs_accent_bg cs_white_color">
													<Icon
														icon={
															feature.available
																? "fa6-solid:check"
																: "fa6-solid:xmark"
														}
														aria-hidden="true"
													/>
												</span>
												{feature.label}
											</li>
										))}
									</ul>
								</div>

								<Link
									to="/contact"
									aria-label="Buy service button"
									className="cs_pricing_btn cs_center cs_fs_16 cs_semibold"
								>
									Choose Plan
								</Link>
							</div>
						);
					})}
				</div>
			</div>
			<div className="cs_height_140 cs_height_lg_80" />
		</section>
	);
};

export default PricingStyle5;
