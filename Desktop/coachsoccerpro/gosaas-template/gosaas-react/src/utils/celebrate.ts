import confetti from 'canvas-confetti';

// Sound URLs - using free sound effects
const SOUNDS = {
	badge: '/sounds/badge-earned.mp3',
	levelUp: '/sounds/level-up.mp3',
	cheer: '/sounds/cheer.mp3',
	success: '/sounds/success.mp3',
};

// Play a celebration sound
export const playSound = (type: keyof typeof SOUNDS) => {
	try {
		const audio = new Audio(SOUNDS[type]);
		audio.volume = 0.5;
		audio.play().catch(() => {
			// Ignore autoplay errors
		});
	} catch (e) {
		// Sound not available
	}
};

// Basic confetti burst
export const celebrate = () => {
	confetti({
		particleCount: 100,
		spread: 70,
		origin: { y: 0.6 }
	});
	playSound('success');
};

// Badge awarded celebration
export const celebrateBadge = () => {
	// First burst
	confetti({
		particleCount: 50,
		angle: 60,
		spread: 55,
		origin: { x: 0 },
		colors: ['#2d5a1b', '#4a8c2a', '#6bb33d', '#ffd700', '#ffeb3b']
	});
	// Second burst from other side
	confetti({
		particleCount: 50,
		angle: 120,
		spread: 55,
		origin: { x: 1 },
		colors: ['#2d5a1b', '#4a8c2a', '#6bb33d', '#ffd700', '#ffeb3b']
	});
	playSound('badge');
};

// Level up / frame upgrade celebration
export const celebrateLevelUp = () => {
	const duration = 3000;
	const end = Date.now() + duration;

	const frame = () => {
		confetti({
			particleCount: 3,
			angle: 60,
			spread: 55,
			origin: { x: 0 },
			colors: ['#ffd700', '#ffeb3b', '#fff59d']
		});
		confetti({
			particleCount: 3,
			angle: 120,
			spread: 55,
			origin: { x: 1 },
			colors: ['#ffd700', '#ffeb3b', '#fff59d']
		});

		if (Date.now() < end) {
			requestAnimationFrame(frame);
		}
	};
	frame();
	playSound('levelUp');
};

// Goal scored celebration
export const celebrateGoal = () => {
	confetti({
		particleCount: 150,
		spread: 100,
		origin: { y: 0.5 },
		colors: ['#2d5a1b', '#ffffff', '#000000']
	});
	playSound('cheer');
};

// Fireworks celebration for big achievements
export const celebrateFireworks = () => {
	const duration = 5000;
	const animationEnd = Date.now() + duration;
	const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

	const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

	const interval = setInterval(() => {
		const timeLeft = animationEnd - Date.now();

		if (timeLeft <= 0) {
			return clearInterval(interval);
		}

		const particleCount = 50 * (timeLeft / duration);

		confetti({
			...defaults,
			particleCount,
			origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
		});
		confetti({
			...defaults,
			particleCount,
			origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
		});
	}, 250);

	playSound('cheer');
};

// Star burst for streaks
export const celebrateStreak = (streakCount: number) => {
	const intensity = Math.min(streakCount * 10, 100);

	confetti({
		particleCount: intensity,
		spread: 360,
		startVelocity: 20,
		origin: { x: 0.5, y: 0.5 },
		colors: ['#ff6b35', '#ff9f1c', '#ffcc00'],
		shapes: ['star'],
		scalar: 1.2
	});
	playSound('success');
};
