import { CommandCenterProvider } from './CommandCenterContext';
import LayoutSwitcher from './layout/LayoutSwitcher';
import TopBar from './panels/TopBar';
import LeftPanel from './panels/LeftPanel/LeftPanel';
import CenterPanel from './panels/CenterPanel/CenterPanel';
import RightPanel from './panels/RightPanel/RightPanel';

const CommandCenter = () => {
	// Phase 1: Static placeholder data for layout verification
	// Phase 2 will wire to Supabase

	const mockFlaggedItems = [
		{ id: '1', type: 'payment' as const, title: 'Martinez Family', subtitle: '$120 overdue 14 days', actionLabel: 'Chase' },
		{ id: '2', type: 'rsvp' as const, title: 'Saturday Match', subtitle: '0 RSVPs received', actionLabel: 'Remind' },
		{ id: '3', type: 'unread' as const, title: 'Thompson Family', subtitle: 'Last 3 messages unread', actionLabel: 'Follow Up' },
	];

	const mockTeams = [
		{ id: '1', name: 'Lightning U12', ageGroup: 'Under 12', playerCount: 14, nextEvent: 'Tomorrow', hasOverdue: true },
		{ id: '2', name: 'Thunder U10', ageGroup: 'Under 10', playerCount: 12, nextEvent: 'Saturday', hasOverdue: false },
	];

	const mockEvents = [
		{ id: '1', title: 'Training Session', type: 'practice' as const, when: 'Tomorrow 6pm', team: 'Lightning U12', confirmedCount: 8, totalCount: 14 },
		{ id: '2', title: 'vs Eagles FC', type: 'game' as const, when: 'Saturday 10am', team: 'Lightning U12', confirmedCount: 12, totalCount: 14 },
		{ id: '3', title: 'Training Session', type: 'practice' as const, when: 'Next Tue 6pm', team: 'Thunder U10', confirmedCount: 0, totalCount: 12 },
	];

	const mockMessages = [
		{ id: '1', title: 'Week ahead update', sentAgo: '2 days ago', readCount: 8, totalCount: 14 },
		{ id: '2', title: 'Match reminder', sentAgo: '5 days ago', readCount: 13, totalCount: 14 },
	];

	const mockAutomatedQueue = [
		{ id: '1', title: 'Training Reminder', sendTime: 'Tomorrow 9am', recipientCount: 14, needsApproval: false },
		{ id: '2', title: 'Match Day Prep', sendTime: 'Friday 6pm', recipientCount: 14, needsApproval: true },
	];

	const mockPrivateClients = [
		{ id: '1', name: 'Marcus Johnson', nextSession: 'Thursday 4pm', isPaid: true },
	];

	const handlePlayersClick = () => console.log('Navigate to roster');
	const handleTeamClick = (teamId: string) => console.log('Team clicked:', teamId);
	const handleFlagAction = (itemId: string) => console.log('Flag action:', itemId);
	const handleEventClick = (eventId: string) => console.log('Event clicked:', eventId);
	const handleQuickAction = (action: string) => console.log('Quick action:', action);
	const handleApprove = (itemId: string) => console.log('Approve:', itemId);
	const handleSkip = (itemId: string) => console.log('Skip:', itemId);

	return (
		<CommandCenterProvider>
			<LayoutSwitcher
				topBar={
					<TopBar
						attentionCount={3}
						outstandingPayments={340}
						nextEvent={{ title: 'Training', when: 'Tomorrow 6pm', isToday: false }}
						totalPlayers={26}
						teamMood={null}
						onPlayersClick={handlePlayersClick}
					/>
				}
				leftPanel={
					<LeftPanel
						flaggedItems={mockFlaggedItems}
						teams={mockTeams}
						onTeamClick={handleTeamClick}
						onFlagAction={handleFlagAction}
					/>
				}
				centerPanel={
					<CenterPanel
						briefingLines={[
							'$340 outstanding from Martinez and Thompson families.',
							'Training tomorrow — 8 of 14 confirmed.',
							'Last parent message sent 2 days ago.'
						]}
						upcomingEvents={mockEvents}
						recentMessages={mockMessages}
						revenueThisMonth={1260}
						outstandingThisMonth={340}
						onEventClick={handleEventClick}
					/>
				}
				rightPanel={
					<RightPanel
						automatedQueue={mockAutomatedQueue}
						privateClients={mockPrivateClients}
						tier="first_team"
						onQuickAction={handleQuickAction}
						onApprove={handleApprove}
						onSkip={handleSkip}
					/>
				}
			/>
		</CommandCenterProvider>
	);
};

export default CommandCenter;
