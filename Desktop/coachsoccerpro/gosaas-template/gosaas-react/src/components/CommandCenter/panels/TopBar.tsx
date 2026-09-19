import { Icon } from '@iconify/react';

interface TopBarProps {
	attentionCount: number;
	outstandingPayments: number;
	nextEvent: { title: string; when: string; isToday: boolean } | null;
	totalPlayers: number;
	teamMood: number | null;
	onPlayersClick: () => void;
}

const TopBar = ({
	attentionCount,
	outstandingPayments,
	nextEvent,
	totalPlayers,
	teamMood,
	onPlayersClick
}: TopBarProps) => {
	return (
		<div style={{
			display: 'flex',
			alignItems: 'center',
			gap: '0',
			backgroundColor: '#ffffff',
		}}>
			{/* Stat Item */}
			<div
				style={{
					flex: 1,
					display: 'flex',
					alignItems: 'center',
					gap: '10px',
					padding: '12px 16px',
					borderRight: '1px solid #e2e8f0',
					backgroundColor: attentionCount > 0 ? '#fef2f2' : 'transparent'
				}}
			>
				<Icon icon="fa6-solid:exclamation-circle" style={{ fontSize: '18px', color: attentionCount > 0 ? '#dc2626' : '#a0aec0' }} />
				<div>
					<div style={{ fontSize: '20px', fontWeight: 700, color: attentionCount > 0 ? '#dc2626' : '#1a202c', lineHeight: 1 }}>
						{attentionCount}
					</div>
					<div style={{ fontSize: '11px', color: '#718096', marginTop: '2px' }}>Attention</div>
				</div>
			</div>

			<div
				style={{
					flex: 1,
					display: 'flex',
					alignItems: 'center',
					gap: '10px',
					padding: '12px 16px',
					borderRight: '1px solid #e2e8f0',
					backgroundColor: outstandingPayments > 0 ? '#fef2f2' : 'transparent'
				}}
			>
				<Icon icon="fa6-solid:dollar-sign" style={{ fontSize: '18px', color: outstandingPayments > 0 ? '#dc2626' : '#2d5a1b' }} />
				<div>
					<div style={{ fontSize: '20px', fontWeight: 700, color: outstandingPayments > 0 ? '#dc2626' : '#1a202c', lineHeight: 1 }}>
						${outstandingPayments}
					</div>
					<div style={{ fontSize: '11px', color: '#718096', marginTop: '2px' }}>Outstanding</div>
				</div>
			</div>

			<div
				style={{
					flex: 1.5,
					display: 'flex',
					alignItems: 'center',
					gap: '10px',
					padding: '12px 16px',
					borderRight: '1px solid #e2e8f0',
					backgroundColor: nextEvent?.isToday ? '#f0fdf4' : 'transparent'
				}}
			>
				<Icon icon="fa6-solid:calendar" style={{ fontSize: '18px', color: nextEvent?.isToday ? '#2d5a1b' : '#3182ce' }} />
				<div>
					<div style={{ fontSize: '14px', fontWeight: 600, color: '#1a202c', lineHeight: 1.2 }}>
						{nextEvent ? nextEvent.title : 'No events'}
					</div>
					<div style={{ fontSize: '11px', color: '#718096', marginTop: '2px' }}>{nextEvent?.when || '—'}</div>
				</div>
			</div>

			<div
				onClick={onPlayersClick}
				style={{
					flex: 1,
					display: 'flex',
					alignItems: 'center',
					gap: '10px',
					padding: '12px 16px',
					borderRight: '1px solid #e2e8f0',
					cursor: 'pointer'
				}}
			>
				<Icon icon="fa6-solid:users" style={{ fontSize: '18px', color: '#2d5a1b' }} />
				<div>
					<div style={{ fontSize: '20px', fontWeight: 700, color: '#1a202c', lineHeight: 1 }}>
						{totalPlayers}
					</div>
					<div style={{ fontSize: '11px', color: '#718096', marginTop: '2px' }}>Players</div>
				</div>
			</div>

			<div
				style={{
					flex: 1,
					display: 'flex',
					alignItems: 'center',
					gap: '10px',
					padding: '12px 16px',
				}}
			>
				<Icon icon="fa6-solid:heart-pulse" style={{ fontSize: '18px', color: teamMood !== null ? '#2d5a1b' : '#a0aec0' }} />
				<div>
					<div style={{ fontSize: '20px', fontWeight: 700, color: teamMood !== null ? '#1a202c' : '#a0aec0', lineHeight: 1 }}>
						{teamMood !== null ? `${teamMood}%` : '—'}
					</div>
					<div style={{ fontSize: '11px', color: '#718096', marginTop: '2px' }}>Mood</div>
				</div>
			</div>
		</div>
	);
};

export default TopBar;
