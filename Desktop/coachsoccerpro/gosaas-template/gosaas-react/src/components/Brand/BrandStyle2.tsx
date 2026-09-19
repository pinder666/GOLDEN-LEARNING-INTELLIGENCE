import React from "react";
import parser from "html-react-parser";

interface IntegrationItem {
	icon: string;
	name: string;
	url?: string;
	description?: string;
}

interface IntegrationsData {
	integrations1: IntegrationItem[];
	integrations2: IntegrationItem[];
}

interface BrandStyle2Props {
	data: {
		mintTitle: string;
		title: string;
		integrations: IntegrationsData;
	};
}

const renderIconBox = (items: IntegrationItem[] | undefined) =>
	items?.map((item, index) => (
		<div
			className="cs_iconbox cs_style_5 cs_center_column cs_radius_10 text-center"
			key={`${item.name}-${index}`}
		>
			<span className="cs_iconbox_icon cs_center cs_mb_13">
				<img
					src={item.icon}
					alt={`${item.name} icon`}
					title={item.name}
					loading="lazy"
				/>
			</span>
			<h3 className="cs_fs_21 cs_white_color mb-0">{item.name}</h3>
		</div>
	));

const BrandStyle2: React.FC<BrandStyle2Props> = ({ data }) => {
	const { mintTitle, title, integrations } = data;

	return (
		<section>
			<div className="cs_height_130 cs_height_lg_80" />
			<div className="container">
				<div className="cs_section_heading cs_style_1 text-center">
					<p
						className="cs_section_subtitle cs_accent_color cs_border cs_radius_15 cs_semibold aos fadeInDown"
						data-aos="fade-down"
						data-aos-duration="800"
					>
						{parser(mintTitle)}
					</p>
					<h2
						className="cs_section_title cs_fs_50 cs_white_color mb-0 aos fadeInUp"
						data-aos="fade-up"
						data-aos-duration="800"
					>
						{parser(title)}
					</h2>
				</div>
			</div>

			<div className="cs_height_75 cs_height_lg_50" />

			<div className="cs_horizontal_slider_wrapper">
				<div className="cs_slider_in">
					<div className="cs_tools_wrapper">
						{renderIconBox(integrations.integrations1)}
					</div>
					<div className="cs_tools_wrapper">
						{renderIconBox(integrations.integrations1)}
					</div>
				</div>
			</div>

			<div className="cs_horizontal_slider_wrapper cs_type_2">
				<div className="cs_slider_in">
					<div className="cs_tools_wrapper">
						{renderIconBox(integrations.integrations2)}
					</div>
					<div className="cs_tools_wrapper">
						{renderIconBox(integrations.integrations2)}
					</div>
				</div>
			</div>

			<div className="cs_height_140 cs_height_lg_80" />
		</section>
	);
};

export default BrandStyle2;
