import { Icon } from "@iconify/react/dist/iconify.js";
import { Link } from "react-router-dom";
import { FC } from "react";

interface PricingTier {
	title: string;
	price: number;
	subtitle: string;
	features: string[];
	buttonText: string;
	buttonLink: string;
	highlighted?: boolean;
}

const tiers: PricingTier[] = [
	{
		title: "Grassroots",
		price: 0,
		subtitle: "For the volunteer coach running one small team. Get organised and collect payments without the chaos.",
		features: [
			"Up to 10 Players",
			"Parent WhatsApp Messaging",
			"Payment Collection",
			"Basic Schedule and Attendance",
			"Player Profiles",
		],
		buttonText: "Get Started Free",
		buttonLink: "/register",
	},
	{
		title: "First Team",
		price: 79,
		subtitle: "For the serious coach who wants to develop players properly and run their operation like a professional club.",
		features: [
			"Up to 40 Players Across 2 Teams",
			"Everything in Grassroots",
			"AI Voice to Parent Updates",
			"Badge and Confidence System",
			"Individual Player Development Dashboard",
			"AI Analytics and Weekly Briefing",
			"Squad Mood Dashboard",
			"AI Session Planner",
			"Voice Stats During Match",
			"Pro Habits Library",
			"Social Media Auto-Posting",
			"End of Season Development Reports",
		],
		buttonText: "Start First Team",
		buttonLink: "/register",
		highlighted: true,
	},
	{
		title: "The Gaffer",
		price: 149,
		subtitle: "For the club director who wants the full operation running under their own brand.",
		features: [
			"Unlimited Teams and Players",
			"Everything in First Team",
			"Computer Vision Match Clips",
			"White Label Your Club Brand",
			"Club Director Dashboard",
			"Player Recruitment Profiles",
			"Priority Support",
		],
		buttonText: "Become The Gaffer",
		buttonLink: "/register",
	},
];

const SoccerPricing: FC = () => {
	return (
		<section className="position-relative" id="pricing">
			<div
				className="cs_bg_shape_1 cs_radius_15 position-absolute"
				style={{ backgroundColor: '#2d5a1b' }}
			/>
			<div className="cs_height_125 cs_height_lg_70" />
			<div className="container position-relative z-1">
				<div className="cs_section_heading cs_style_1 cs_mb_42 text-center">
					<h2
						className="cs_section_title cs_fs_50 mb-0 aos fadeInDown"
						data-aos="fade-down"
						data-aos-duration="800"
					>
						Simple Pricing. No Surprises.
					</h2>
				</div>

				<div
					className="row cs_gap_y_30"
					data-aos="fade-up"
					data-aos-duration="800"
				>
					{tiers.map((tier, index) => (
						<div key={index} className="col-lg-4">
							<div
								className={`cs_pricing_table cs_style_1 cs_white_bg cs_radius_20 position-relative h-100 ${
									tier.highlighted ? "active overflow-hidden" : ""
								}`}
								style={{ display: 'flex', flexDirection: 'column' }}
							>
								{tier.highlighted && (
									<span
										className="cs_pricing_badge cs_fs_16 position-absolute"
										style={{ backgroundColor: '#2d5a1b' }}
									>
										Most Popular
									</span>
								)}
								<div className="cs_pricing_head cs_mb_14">
									<h2 className="cs_fs_38 mb-0">{tier.title}</h2>
									<p className="cs_mb_18" style={{ minHeight: '60px' }}>{tier.subtitle}</p>
									<hr />
								</div>
								<h3 className="cs_fs_38 cs_mb_17">
									${tier.price}
									<small className="cs_fs_18 cs_normal">/month</small>
								</h3>
								<div className="cs_mb_36" style={{ flex: 1 }}>
									<ul className="cs_pricing_feature_list cs_mp_0">
										{tier.features.map((feature, i) => (
											<li key={i}>
												<span
													className="cs_feature_icon cs_center cs_radius_100 cs_white_color"
													style={{ backgroundColor: '#2d5a1b' }}
												>
													<i>
														<Icon icon="fa6-solid:check" />
													</i>
												</span>
												{feature}
											</li>
										))}
									</ul>
								</div>
								<Link
									to={tier.buttonLink}
									aria-label={tier.buttonText}
									className="cs_pricing_btn cs_center cs_fs_16 cs_semibold"
									style={{
										backgroundColor: '#2d5a1b',
										color: '#ffffff',
										borderColor: '#2d5a1b',
									}}
								>
									{tier.buttonText}
								</Link>
							</div>
						</div>
					))}
				</div>
			</div>
			<div className="cs_height_140 cs_height_lg_80" />
		</section>
	);
};

export default SoccerPricing;
