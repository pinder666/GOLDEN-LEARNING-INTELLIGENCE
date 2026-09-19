import { useState, useEffect } from 'react';

type Viewport = 'desktop' | 'tablet' | 'mobile';

export const useViewport = (): Viewport => {
	const getViewport = (): Viewport => {
		if (typeof window === 'undefined') return 'desktop';
		const width = window.innerWidth;
		if (width >= 1200) return 'desktop';
		if (width >= 768) return 'tablet';
		return 'mobile';
	};

	const [viewport, setViewport] = useState<Viewport>(getViewport);

	useEffect(() => {
		const handleResize = () => {
			setViewport(getViewport());
		};

		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	return viewport;
};
