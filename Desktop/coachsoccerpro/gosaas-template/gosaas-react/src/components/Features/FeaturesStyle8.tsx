import PageHeadingStyle1 from "../PageHeading/PageHeadingStyle1";

interface FeatureItem {
	id: number;
	icon: string;
	iconBg: string;
	title: string;
	desc: string;
}

interface FeaturesStyle8Props {
	data: {
		title: string;
		subTitle: string;
		features?: FeatureItem[];
	};
}

const FeaturesStyle8: React.FC<FeaturesStyle8Props> = ({ data }) => {
	const { title, subTitle, features } = data;

	return (
		<section>
			<PageHeadingStyle1 title={title} subTitle={subTitle} />
			<div className="container" data-aos="fade-up" data-aos-duration="800">
				<div className="row cs_gap_y_24 justify-content-center">
					{features?.map((item, index) => (
						<div className="col-lg-4 col-md-6 fadeInRight" key={index}>
							<div className="cs_iconbox cs_style_2 cs_type_1 cs_radius_15">
								<span
									className={`cs_iconbox_icon cs_center ${item.iconBg} cs_radius_100 cs_mb_25`}
								>
									<img src={item.icon} alt={`${item.title} icon`} />
								</span>
								<div className="cs_iconbox_info">
									<h3 className="cs_fs_21 cs_normal cs_mb_13">{item.title}</h3>
									<p className="mb-0">{item.desc}</p>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
};

export default FeaturesStyle8;
