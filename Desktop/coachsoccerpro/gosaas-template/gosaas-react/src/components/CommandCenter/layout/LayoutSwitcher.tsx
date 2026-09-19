import { ReactNode } from 'react';
import { useViewport } from '../hooks/useViewport';
import DesktopLayout from './DesktopLayout';
import MobileLayout from './MobileLayout';

interface LayoutSwitcherProps {
	topBar: ReactNode;
	leftPanel: ReactNode;
	centerPanel: ReactNode;
	rightPanel: ReactNode;
}

const LayoutSwitcher = ({ topBar, leftPanel, centerPanel, rightPanel }: LayoutSwitcherProps) => {
	const viewport = useViewport();

	if (viewport === 'mobile') {
		return (
			<MobileLayout
				topBar={topBar}
				homeContent={
					<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
						{centerPanel}
					</div>
				}
				teamsContent={leftPanel}
				messagesContent={<div>Messages content</div>}
				actionsContent={rightPanel}
			/>
		);
	}

	if (viewport === 'tablet') {
		return (
			<DesktopLayout
				topBar={topBar}
				leftPanel={leftPanel}
				centerPanel={centerPanel}
				rightPanel={rightPanel}
			/>
		);
	}

	return (
		<DesktopLayout
			topBar={topBar}
			leftPanel={leftPanel}
			centerPanel={centerPanel}
			rightPanel={rightPanel}
		/>
	);
};

export default LayoutSwitcher;
