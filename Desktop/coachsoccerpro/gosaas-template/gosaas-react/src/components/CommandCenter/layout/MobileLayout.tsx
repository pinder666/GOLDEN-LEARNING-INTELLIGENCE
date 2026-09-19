import { ReactNode, useState } from 'react';
import { Icon } from '@iconify/react';

type MobileTab = 'home' | 'teams' | 'messages' | 'actions';

interface MobileLayoutProps {
	homeContent: ReactNode;
	teamsContent: ReactNode;
	messagesContent: ReactNode;
	actionsContent: ReactNode;
	topBar: ReactNode;
}

const MobileLayout = ({ homeContent, teamsContent, messagesContent, actionsContent, topBar }: MobileLayoutProps) => {
	const [activeTab, setActiveTab] = useState<MobileTab>('home');

	const renderContent = () => {
		switch (activeTab) {
			case 'home': return homeContent;
			case 'teams': return teamsContent;
			case 'messages': return messagesContent;
			case 'actions': return actionsContent;
			default: return homeContent;
		}
	};

	const tabs: { id: MobileTab; icon: string; label: string }[] = [
		{ id: 'home', icon: 'fa6-solid:house', label: 'Home' },
		{ id: 'teams', icon: 'fa6-solid:users', label: 'Teams' },
		{ id: 'messages', icon: 'fa6-solid:message', label: 'Messages' },
		{ id: 'actions', icon: 'fa6-solid:bolt', label: 'Actions' },
	];

	return (
		<div style={{
			minHeight: '100vh',
			backgroundColor: '#f7fafc',
			display: 'flex',
			flexDirection: 'column',
			paddingBottom: '80px'
		}}>
			{/* Fixed Top Bar */}
			<div style={{
				position: 'sticky',
				top: 0,
				zIndex: 100,
				backgroundColor: '#ffffff',
				borderBottom: '1px solid #e2e8f0',
				padding: '12px 16px'
			}}>
				{topBar}
			</div>

			{/* Content Area */}
			<div style={{
				flex: 1,
				padding: '16px',
				overflowY: 'auto'
			}}>
				{renderContent()}
			</div>

			{/* Fixed Bottom Navigation */}
			<div style={{
				position: 'fixed',
				bottom: 0,
				left: 0,
				right: 0,
				backgroundColor: '#ffffff',
				borderTop: '1px solid #e2e8f0',
				display: 'flex',
				justifyContent: 'space-around',
				padding: '8px 0 16px 0',
				zIndex: 100
			}}>
				{tabs.map((tab) => (
					<button
						key={tab.id}
						onClick={() => setActiveTab(tab.id)}
						style={{
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							gap: '4px',
							background: 'none',
							border: 'none',
							cursor: 'pointer',
							padding: '8px 16px',
							minWidth: '64px',
							minHeight: '44px',
							color: activeTab === tab.id ? '#2d5a1b' : '#718096'
						}}
					>
						<Icon icon={tab.icon} style={{ fontSize: '20px' }} />
						<span style={{ fontSize: '11px', fontWeight: activeTab === tab.id ? 600 : 400 }}>
							{tab.label}
						</span>
					</button>
				))}
			</div>
		</div>
	);
};

export default MobileLayout;
