import { useEffect, useRef, useState } from "react";

interface FunFactBlackItemProps {
	count: number;
	suffix?: string;
	title?: string;
}

const FunFactBlackItem: React.FC<FunFactBlackItemProps> = ({
	count,
	suffix,
	title,
}) => {
	const [displayCount, setDisplayCount] = useState<number>(0);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry?.isIntersecting) {
					const end = typeof count === "string" ? parseInt(count, 10) : count;
					if (isNaN(end)) return;

					let start = 0;
					const duration = 1000;
					const step = Math.max(1, Math.ceil(end / (duration / 20)));

					const interval = setInterval(() => {
						start += step;
						if (start >= end) {
							setDisplayCount(end);
							clearInterval(interval);
						} else {
							setDisplayCount(start);
						}
					}, 20);

					return () => clearInterval(interval);
				}
			},
			{ threshold: 0.6 }
		);

		const currentRef = ref.current;
		if (currentRef) {
			observer.observe(currentRef);
		}

		return () => {
			if (currentRef) {
				observer.unobserve(currentRef);
			}
		};
	}, [count]);

	return (
		<div className="cs_funfact cs_style_1">
			<div
				ref={ref}
				className="cs_funfact_number cs_center cs_fs_68 cs_semibold cs_heading_color cs_mb_4"
				aria-live="polite"
			>
				{displayCount.toLocaleString()}
				{suffix}
			</div>
			<h3 className="cs_heading_color cs_fs_29 cs_normal mb-0">{title}</h3>
		</div>
	);
};

export default FunFactBlackItem;
