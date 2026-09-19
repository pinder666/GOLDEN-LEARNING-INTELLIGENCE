import { Icon } from '@iconify/react';

interface FlaggedItem {
	id: string;
	type: 'payment' | 'rsvp' | 'unread' | 'attendance';
	title: string;
	subtitle: string;
	actionLabel?: string;
}

interface Team {
	id: string;
	name: string;
	ageGroup: string;
	playerCount: number;
	nextEvent: string;
	hasOverdue: boolean;
}

interface LeftPanelProps {
	flaggedItems: FlaggedItem[];
	teams: Team[];
	onTeamClick: (teamId: string) => void;
	onFlagAction: (itemId: string) => void;
}

const LeftPanel = ({ flaggedItems, teams, onTeamClick, onFlagAction }: LeftPanelProps) => {
	const getIcon = (type: FlaggedItem['type']) => {
		switch (type) {
			case 'payment': return 'fa6-solid:dollar-sign';
			case 'rsvp': return 'fa6-solid:calendar-xmark';
			case 'unread': return 'fa6-solid:envelope';
			case 'attendance': return 'fa6-solid:user-clock';
			default: return 'fa6-solid:flag';
		}
	};

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
			{/* Flagged Items */}
			<div>
				<div style={{
					fontSize: '11px',
					fontWeight: 600,
					color: '#64748b',
					textTransform: 'uppercase',
					letterSpacing: '0.5px',
					marginBottom: '8px'
				}}>
					Flagged Items
				</div>

				{flaggedItems.length === 0 ? (
					<div style={{
						padding: '12px',
						backgroundColor: '#f0fdf4',
						borderRadius: '6px',
						fontSize: '13px',
						color: '#2d5a1b',
						display: 'flex',
						alignItems: 'center',
						gap: '8px'
					}}>
						<Icon icon="fa6-solid:check-circle" />
						All clear — no issues
					</div>
				) : (
					<div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
						{flaggedItems.map((item) => (
							<div
								key={item.id}
								style={{
									padding: '10px 12px',
									backgroundColor: '#fef2f2',
									borderRadius: '6px',
									borderLeft: '3px solid #dc2626'
								}}
							>
								<div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
									<Icon icon={getIcon(item.type)} style={{ fontSize: '14px', color: '#dc2626', marginTop: '2px' }} />
									<div style={{ flex: 1, minWidth: 0 }}>
										<div style={{ fontSize: '13px', fontWeight: 500, color: '#1a202c' }}>{item.title}</div>
										<div style={{ fontSize: '11px', color: '#718096', marginTop: '2px' }}>{item.subtitle}</div>
									</div>
									{item.actionLabel && (
										<button
											onClick={() => onFlagAction(item.id)}
											style={{
												padding: '4px 8px',
												fontSize: '11px',
												fontWeight: 500,
												backgroundColor: '#dc2626',
												color: '#ffffff',
												border: 'none',
												borderRadius: '4px',
												cursor: 'pointer',
												whiteSpace: 'nowrap'
											}}
										>
											{item.actionLabel}
										</button>
									)}
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Teams */}
			<div>
				<div style={{
					fontSize: '11px',
					fontWeight: 600,
					color: '#64748b',
					textTransform: 'uppercase',
					letterSpacing: '0.5px',
					marginBottom: '8px'
				}}>
					Teams
				</div>

				{teams.length === 0 ? (
					<div style={{
						padding: '12px',
						backgroundColor: '#f8fafc',
						borderRadius: '6px',
						fontSize: '13px',
						color: '#64748b',
						textAlign: 'center'
					}}>
						No teams yet
					</div>
				) : (
					<div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
						{teams.map((team) => (
							<div
								key={team.id}
								onClick={() => onTeamClick(team.id)}
								style={{
									padding: '10px 12px',
									backgroundColor: '#f8fafc',
									borderRadius: '6px',
									cursor: 'pointer',
									display: 'flex',
									alignItems: 'center',
									gap: '10px',
									transition: 'background-color 0.15s'
								}}
							>
								<div style={{
									width: '36px',
									height: '36px',
									borderRadius: '8px',
									backgroundColor: '#2d5a1b',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									flexShrink: 0
								}}>
									<Icon icon="fa6-solid:futbol" style={{ fontSize: '16px', color: '#ffffff' }} />
								</div>
								<div style={{ flex: 1, minWidth: 0 }}>
									<div style={{
										fontSize: '13px',
										fontWeight: 600,
										color: '#1a202c',
										display: 'flex',
										alignItems: 'center',
										gap: '6px'
									}}>
										{team.name}
										{team.hasOverdue && (
											<span style={{
												width: '6px',
												height: '6px',
												borderRadius: '50%',
												backgroundColor: '#dc2626'
											}} />
										)}
									</div>
									<div style={{ fontSize: '11px', color: '#64748b', marginTop: '1px' }}>
										{team.ageGroup} · {team.playerCount} players
									</div>
								</div>
								<Icon icon="fa6-solid:chevron-right" style={{ fontSize: '12px', color: '#a0aec0' }} />
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
};

export default LeftPanel;
