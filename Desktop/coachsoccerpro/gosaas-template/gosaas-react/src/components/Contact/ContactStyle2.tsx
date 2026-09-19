import React from "react";
import parser from "html-react-parser";
import ContactForm from "./ContactForm";

interface ContactStyle2Props {
	data: {
		mintTitle: string;
		title: string;
	};
}

const ContactStyle2: React.FC<ContactStyle2Props> = ({ data }) => {
	const { mintTitle, title } = data;

	return (
		<section className={`cs_contact_section`}>
			<div className="cs_height_131 cs_height_lg_70"></div>
			<div className="container">
				<div className="row cs_gap_y_40">
					<div className="col-xl-5 col-lg-5">
						<div className="cs_section_heading cs_style_1">
							{mintTitle && (
								<p className={`cs_section_subtitle cs_mb_23`}>
									{parser(mintTitle)}
									<span className="cs_pill"></span>
								</p>
							)}
							<h2
								className={`cs_section_title cs_fs_50 mb-0 aos fadeInDown`}
								data-aos="fade-down"
								data-aos-duration="800"
							>
								{parser(title)}
							</h2>
						</div>
					</div>
					<div className="col-xl-6 col-lg-7 offset-xl-1">
						<ContactForm />
					</div>
				</div>
			</div>
			<div className="cs_height_140 cs_height_lg_80"></div>
		</section>
	);
};

export default ContactStyle2;
