import { useEffect, useRef, useState } from "react";

interface FunFactWhiteItemProps {
	count: number;
	suffix?: string;
	title?: string;
}

const FunFactWhiteItem: React.FC<FunFactWhiteItemProps> = ({
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
					const increment = Math.max(1, Math.ceil(end / (duration / 20)));

					const interval = setInterval(() => {
						start += increment;
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

		const currentElement = ref.current;
		if (currentElement) {
			observer.observe(currentElement);
		}

		return () => {
			if (currentElement) {
				observer.unobserve(currentElement);
			}
		};
	}, [count]);

	return (
		<div className="cs_funfact cs_style_1">
			<div
				ref={ref}
				className="cs_funfact_number cs_center cs_fs_68 cs_semibold cs_white_color cs_mb_4"
				aria-live="polite"
			>
				{displayCount.toLocaleString()}
				{suffix}
			</div>
			<h3 className="cs_white_color cs_fs_29 cs_normal mb-0">{title}</h3>
		</div>
	);
};

export default FunFactWhiteItem;
