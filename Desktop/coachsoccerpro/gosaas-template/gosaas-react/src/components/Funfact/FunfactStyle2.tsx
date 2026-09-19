import React from "react";
import parser from "html-react-parser";
import FunFactBlackItem from "./FunFactBlackItem";

// ===== Type Definitions =====
interface FunfactItem {
	id: number;
	count: number;
	suffix?: string;
	prefix?: string;
	label?: string;
	title?: string;
}

interface FunfactData {
	title: string;
	imgUrl: string;
	funfacts: FunfactItem[];
}

interface FunfactStyle2Props {
	data: FunfactData;
	shapeIcon?: boolean;
	styleVariant?: string;
	className?: string;
}

// ===== Main Component =====
const FunfactStyle2: React.FC<FunfactStyle2Props> = ({
	data,
	shapeIcon,
	styleVariant,
}) => {
	const { title, funfacts } = data;

	return (
		<section className={`position-relative overflow-hidden ${styleVariant}`}>
			<div className="cs_height_124 cs_height_lg_80"></div>
			<div className="container">
				<div className="text-center position-relative z-1">
					<h2
						className="cs_contet_title cs_fs_50 cs_mb_46 aos fadeInDown"
						data-aos="fade-down"
						data-aos-duration="800"
					>
						{parser(title)}
					</h2>

					<div className="row">
						<div className="col-lg-10 offset-lg-1">
							<div className="row cs_gap_y_30">
								{funfacts?.slice(0, 4).map((item, index) => (
									<div className="col-md-3 col-sm-6" key={`funfact-${index}`}>
										<FunFactBlackItem
											count={item.count}
											suffix={item.suffix}
											title={item.label || item.title}
										/>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Optional shape icons */}
			{shapeIcon && (
				<div className="cs_shape_container">
					<div className="cs_counter_shape_3 position-absolute start-0 bottom-0">
						<img src="/img/stroke.svg" alt="Decorative shape" loading="lazy" />
					</div>
					<div className="cs_counter_shape_4 position-absolute">
						<img
							src="/img/celebration.svg"
							alt="Celebration decoration"
							loading="lazy"
						/>
					</div>
				</div>
			)}

			<div className="cs_height_130 cs_height_lg_80"></div>
		</section>
	);
};

export default FunfactStyle2;
