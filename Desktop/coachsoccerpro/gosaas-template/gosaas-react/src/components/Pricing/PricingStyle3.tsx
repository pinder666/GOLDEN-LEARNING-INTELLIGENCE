import { Icon } from "@iconify/react";
import parser from "html-react-parser";
import { Link } from "react-router-dom";
import { usePricingToggle } from "../../utils/hooks/usePricingToggle";
import { FC } from "react";

interface Feature {
	label: string;
	available: boolean;
}

interface Plan {
	id: number;
	title: string;
	monthlyPrice: number;
	features: Feature[];
	badge: string | null;
}

interface PricingStyle3Props {
	data: { title: string; subtitle: string; plans: Plan[] };
}

const PricingStyle3: FC<PricingStyle3Props> = ({ data }) => {
	const { subtitle, title, plans } = data;
	const { pricingType, togglePricingType, getPrice } = usePricingToggle();

	return (
		<section>
			<div className="cs_height_140 cs_height_lg_80" />
			<div className="container">
				<div className="cs_section_heading cs_style_1 cs_mb_60 text-center">
					<p
						className="cs_section_subtitle cs_accent_color cs_border cs_radius_15 cs_semibold aos fadeInDown"
						data-aos="fade-down"
						data-aos-duration="800"
					>
						{parser(subtitle)}
					</p>
					<h2
						className="cs_section_title cs_fs_50 cs_white_color mb-0 aos fadeInUp"
						data-aos="fade-up"
						data-aos-duration="800"
					>
						{parser(title)}
					</h2>
				</div>

				<ul className="cs_pricing_control cs_type_2 cs_center p-0 position-relative">
					<li className={pricingType === "monthly" ? "active" : ""}>
						<span>Monthly</span>
						<span
							onClick={togglePricingType}
							className="cs_switch cursor-pointer"
						/>
					</li>
					<li className={pricingType === "annually" ? "active" : ""}>
						<span>Annually</span>
					</li>
				</ul>

				<div className="cs_pricing_table_wrapper">
					{plans.map((plan, index) => (
						<div
							key={index}
							className={`cs_pricing_table cs_style_1 cs_type_2 cs_white_bg cs_radius_15 wow overflow-hidden ${
								index === 0
									? "fade-in-left"
									: index === 1
									? "animate__fadeInDown active"
									: "fade-in-right"
							}`}
						>
							{plan.badge && (
								<span className="cs_pricing_badge cs_fs_16 position-absolute">
									{plan.badge}
								</span>
							)}
							<div className="cs_pricing_head cs_center_column cs_mb_24 text-center">
								<p className="cs_medium cs_purple_color cs_mb-5">
									{plan.title}
								</p>
								<h2 className="cs_fs_50 cs_white_color cs_mb-5">
									${getPrice(plan.monthlyPrice)}
								</h2>
								<p className="cs_pricing_head_subtitle cs_fs_18 cs_body_color cs_mb_29">
									{pricingType === "monthly" ? "Per month" : "Per year"}, billed
									annually
								</p>
								<Link
									to="/contact"
									className="cs_pricing_btn cs_fs_16 cs_semibold cs_white_color"
								>
									Try It For Free
								</Link>
							</div>

							<div className="mt-auto">
								<ul className="cs_pricing_feature_list cs_mp_0">
									{plan.features.map((feature, i) => (
										<li
											key={i}
											className={
												feature.available ? "cs_white_color" : "cs_body_color"
											}
										>
											<Icon
												icon={
													feature.available
														? "fa6-solid:check"
														: "fa6-solid:xmark"
												}
												className={
													feature.available
														? "cs_purple_color"
														: "cs_body_color"
												}
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

export default PricingStyle3;
