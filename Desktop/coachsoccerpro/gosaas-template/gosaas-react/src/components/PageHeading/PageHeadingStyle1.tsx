import parser from "html-react-parser";

interface PageHeadingStyle1Props {
	title?: string;
	subTitle?: string;
}

const PageHeadingStyle1 = ({ title, subTitle }: PageHeadingStyle1Props) => {
	return (
		<>
			<div className="cs_height_85 cs_height_lg_80" />
			<div className="container">
				<div className="text-center">
					<h2
						className={`cs_fs_50 ${subTitle ? "cs_mb_15" : "mb-0"} fadeInDown`}
						data-aos="fade-down"
						data-aos-duration="800"
					>
						{parser(title || "Page Heading Title")}
					</h2>
					{subTitle && (
						<p
							className="mb-0 aos fadeInUp"
							data-aos="fade-up"
							data-aos-duration="800"
						>
							{parser(subTitle)}
						</p>
					)}
				</div>
			</div>
			<div className="cs_height_80 cs_height_lg_50" />
		</>
	);
};

export default PageHeadingStyle1;
