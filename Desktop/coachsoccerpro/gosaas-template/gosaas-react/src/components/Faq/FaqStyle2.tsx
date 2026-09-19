import parser from "html-react-parser";
import { useState } from "react";

interface AccordionItemProps {
	question: string;
	answer: string;
	isOpen: boolean;
	onClick: () => void;
}

interface FaqItem {
	question: string;
	answer: string;
}

interface FaqStyle2Props {
	data: {
		title: string;
		subTitle?: string;
		faqs?: FaqItem[];
	};
}

const AccordionItem = ({
	question,
	answer,
	isOpen,
	onClick,
}: AccordionItemProps) => (
	<div className="cs_accordian cs_radius_15 cs_white_bg cs_type_2 position-relative">
		<div
			className={`cs_accordian_head cs_fs_21 cs_heading_color cursor-pointer ${
				isOpen ? "active" : ""
			}`}
			onClick={onClick}
		>
			{question}
			<span className="cs_accordian_toggle position-absolute" />
		</div>
		{isOpen && <div className="cs_accordian_body">{answer}</div>}
	</div>
);

const FaqStyle2 = ({ data }: FaqStyle2Props) => {
	const { title, subTitle, faqs } = data;
	const [openIndex, setOpenIndex] = useState<number | null>(null);

	const handleToggle = (index: number) => {
		setOpenIndex((prev) => (prev === index ? null : index));
	};

	return (
		<section className="position-relative">
			<div className="container">
				<div className="cs_section_heading cs_style_1 cs_type_1 cs_mb_58">
					<div className="cs_section_heading_left">
						<h2
							className="cs_section_title cs_fs_50 cs_bold mb-0 aos fadeInLeft"
							data-aos="fade-right"
							data-aos-duration="800"
						>
							{parser(title)}
						</h2>
					</div>
					<div
						className="cs_section_heading_right fadeInRight"
						data-aos="fade-left"
						data-aos-duration="800"
					>
						{subTitle && <p className="mb-0">{subTitle}</p>}
					</div>
				</div>

				<div className="row cs_gap_y_24 position-relative z-1">
					<div
						className="col-xl-6 aos fadeInLeft"
						data-aos="fade-up"
						data-aos-duration="800"
					>
						{faqs?.slice(0, 4).map((faq, index) => (
							<AccordionItem
								key={index}
								{...faq}
								isOpen={openIndex === index}
								onClick={() => handleToggle(index)}
							/>
						))}
					</div>
					<div
						className="col-xl-6 fadeInRight"
						data-aos="fade-up"
						data-aos-duration="800"
					>
						{faqs?.slice(4).map((faq, index) => (
							<AccordionItem
								key={index + 4}
								{...faq}
								isOpen={openIndex === index + 4}
								onClick={() => handleToggle(index + 4)}
							/>
						))}
					</div>
				</div>

				<div className="cs_faq_shape_1 cs_purple_bg cs_radius_100 position-absolute" />
				<div className="cs_faq_shape_2 cs_accent_bg cs_radius_100 position-absolute" />
			</div>
		</section>
	);
};

export default FaqStyle2;
