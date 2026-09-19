import React from "react";

interface Brand {
	id: number;
	imgUrl: string;
	name?: string;
	url?: string;
	altText?: string;
}
[];

interface BrandStyle1Props {
	data: {
		title: string;
		brands: Brand[];
		subtitle?: string;
		description?: string;
	};
}

const BrandStyle1: React.FC<BrandStyle1Props> = ({ data }) => {
	const { title, subtitle, description, brands } = data;

	// render one row of brands
	const renderRow = (rowIndex: number, ariaHidden = false) => (
		<div
			className="cs_brands_list"
			key={`brand-list-${rowIndex}`}
			aria-hidden={ariaHidden || undefined}
			role="list"
		>
			{brands?.map((item) => {
				const img = (
					<img
						src={item.imgUrl}
						alt={item.altText || item.name || "Brand logo"}
						title={item.name || undefined}
						loading="lazy"
					/>
				);

				return (
					<div
						className="cs_center"
						key={`${rowIndex}-${item.id}`}
						role="listitem"
					>
						{item.url ? (
							<a
								href={item.url}
								aria-label={item.name || "Brand"}
								target="_blank"
								rel="noopener noreferrer"
							>
								{img}
							</a>
						) : (
							img
						)}
					</div>
				);
			})}
		</div>
	);

	return (
		<section>
			<div className="container">
				<div className="cs_center">
					{subtitle && (
						<p
							className="cs_heading_color cs_mb_10 position-relative aos fadeInDown"
							data-aos="fade-down"
							data-aos-duration="800"
						>
							{subtitle}
						</p>
					)}
					<p
						className="cs_has_before_after cs_heading_color cs_mb_30 position-relative aos fadeInDown"
						data-aos="fade-down"
						data-aos-duration="800"
					>
						{title}
					</p>
					{description && (
						<p className="cs_text_muted cs_mb_45">{description}</p>
					)}
				</div>

				<div className="cs_horizontal_slider_wrapper cs_type_1">
					<div className="cs_slider_in">
						{renderRow(0)}
						{
							renderRow(
								1,
								true
							) /* duplicate for seamless scroll, hidden from SRs */
						}
					</div>
				</div>
			</div>
		</section>
	);
};

export default BrandStyle1;
