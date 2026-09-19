import { ReactNode } from 'react';

interface DesktopLayoutProps {
	leftPanel: ReactNode;
	centerPanel: ReactNode;
	rightPanel: ReactNode;
	topBar: ReactNode;
}

const DesktopLayout = ({ leftPanel, centerPanel, rightPanel, topBar }: DesktopLayoutProps) => {
	return (
		<div style={{
			height: '100vh',
			backgroundColor: '#f1f5f9',
			display: 'flex',
			flexDirection: 'column',
			overflow: 'hidden'
		}}>
			{/* Fixed Top Bar */}
			<div style={{
				backgroundColor: '#ffffff',
				borderBottom: '1px solid #e2e8f0',
				flexShrink: 0
			}}>
				{topBar}
			</div>

			{/* Three Column Grid */}
			<div style={{
				display: 'grid',
				gridTemplateColumns: '280px 1fr 300px',
				flex: 1,
				overflow: 'hidden'
			}}>
				{/* Left Panel */}
				<div style={{
					backgroundColor: '#ffffff',
					borderRight: '1px solid #e2e8f0',
					overflowY: 'auto',
					padding: '16px'
				}}>
					{leftPanel}
				</div>

				{/* Center Panel */}
				<div style={{
					overflowY: 'auto',
					padding: '16px'
				}}>
					{centerPanel}
				</div>

				{/* Right Panel */}
				<div style={{
					backgroundColor: '#ffffff',
					borderLeft: '1px solid #e2e8f0',
					overflowY: 'auto',
					padding: '16px'
				}}>
					{rightPanel}
				</div>
			</div>
		</div>
	);
};

export default DesktopLayout;
