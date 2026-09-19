import { FC, useMemo } from "react";
import parser from "html-react-parser";
import { Link } from "react-router-dom";

interface ServiceItem {
	icon: string;
	iconBg: string;
	title: string;
	desc: string;
}

interface CTA {
	btnText: string;
	btnUrl: string;
	iconText: string;
}

interface ServiceStyle2Props {
	data: {
		title: string;
		subTitle: string;
		services: ServiceItem[];
		cta?: Partial<CTA>; // allow partial without crashing
	};
}

const ServiceStyle2: FC<ServiceStyle2Props> = ({ data }) => {
	const { title, subTitle, services, cta } = data;

	// Normalize CTA safely
	const { btnText, btnUrl, iconText } = useMemo(
		() => ({
			btnText: cta?.btnText ?? "Contact",
			btnUrl: cta?.btnUrl ?? "#",
			iconText: cta?.iconText ?? "",
		}),
		[cta]
	);

	return (
		<section className="cs_gray_bg_1 position-relative">
			<div className="cs_height_130 cs_height_lg_80" />
			<div className="container">
				<div className="cs_section_heading cs_style_1 text-center cs_mb_55 position-relative z-2">
					<h2
						className="cs_section_title cs_fs_50 cs_mb_4 aos fadeInDown"
						data-aos="fade-down"
						data-aos-duration="800"
					>
						{parser(title)}
					</h2>
					<p className="cs_section_text cs_fs_21 mb-0">{parser(subTitle)}</p>
				</div>

				<div className="row cs_gap_y_24 cs_mb_60 position-relative z-1">
					{services?.map((item, index) => (
						<div
							className="col-lg-4 col-md-6 aos fadeInLeft"
							data-aos="fade-left"
							data-aos-duration="800"
							key={index}
						>
							<div className="cs_iconbox cs_style_2 cs_white_bg cs_radius_15">
								<span
									className={`cs_iconbox_icon cs_center cs_radius_100 ${item.iconBg} cs_mb_25`}
								>
									<img
										src={item.icon}
										alt={item.title ? `${item.title} icon` : "Service icon"}
										loading="lazy"
									/>
								</span>
								<div className="cs_iconbox_info">
									<h3 className="cs_fs_21 fw-normal cs_mb_13">{item.title}</h3>
									<p className="mb-0">{item.desc}</p>
								</div>
							</div>
						</div>
					))}
				</div>

				{cta && (
					<div className="cs_center_column position-relative z-1 text-center">
						<Link
							to={btnUrl}
							aria-label="Contact button"
							className="cs_btn cs_style_1 cs_accent_bg cs_white_color cs_mb_22 aos fadeInUp"
							data-aos="fade-up"
							data-aos-duration="800"
						>
							<span>{btnText}</span>
						</Link>
						<p className="mb-0">
							<img
								src="/img/cup.png"
								alt="Giftbox"
								className="me-2"
								loading="lazy"
							/>
							{parser(iconText)}
						</p>
					</div>
				)}

				<div className="cs_vector_shape_1 position-absolute" aria-hidden="true">
					<img src="/img/vector_1.svg" alt="" />
				</div>
				<div className="cs_vector_shape_2 position-absolute" aria-hidden="true">
					<img src="/img/vector_1.svg" alt="" />
				</div>
			</div>
			<div className="cs_height_130 cs_height_lg_80" />
		</section>
	);
};

export default ServiceStyle2;
