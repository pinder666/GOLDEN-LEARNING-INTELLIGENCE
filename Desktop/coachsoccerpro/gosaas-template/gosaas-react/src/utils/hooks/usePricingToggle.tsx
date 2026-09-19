import { useCallback, useMemo, useState } from "react";

// Define possible pricing types
type PricingType = "monthly" | "annually";

interface UsePricingToggleReturn {
	pricingType: PricingType;
	isMonthly: boolean;
	togglePricingType: () => void;
	getPrice: (monthlyPrice: number) => number;
}

const usePricingToggle = (
	initialType: PricingType = "monthly"
): UsePricingToggleReturn => {
	const [pricingType, setPricingType] = useState<PricingType>(initialType);

	const togglePricingType = useCallback(() => {
		setPricingType((prevType) =>
			prevType === "monthly" ? "annually" : "monthly"
		);
	}, []);

	const getPrice = useCallback(
		(monthlyPrice: number) =>
			pricingType === "monthly" ? monthlyPrice : monthlyPrice * 10,
		[pricingType]
	);

	const isMonthly = useMemo(() => pricingType === "monthly", [pricingType]);

	return { pricingType, isMonthly, togglePricingType, getPrice };
};

export { usePricingToggle };
