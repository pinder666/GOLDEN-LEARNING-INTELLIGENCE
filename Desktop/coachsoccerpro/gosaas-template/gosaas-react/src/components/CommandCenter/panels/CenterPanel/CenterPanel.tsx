import { Icon } from '@iconify/react';

interface Event {
	id: string;
	title: string;
	type: 'practice' | 'game' | 'tournament';
	when: string;
	team: string;
	confirmedCount: number;
	totalCount: number;
}

interface Message {
	id: string;
	title: string;
	sentAgo: string;
	readCount: number;
	totalCount: number;
}

interface CenterPanelProps {
	briefingLines: string[];
	upcomingEvents: Event[];
	recentMessages: Message[];
	revenueThisMonth: number;
	outstandingThisMonth: number;
	onEventClick: (eventId: string) => void;
}

const CenterPanel = ({
	briefingLines,
	upcomingEvents,
	recentMessages,
	revenueThisMonth,
	outstandingThisMonth,
	onEventClick
}: CenterPanelProps) => {
	const getEventIcon = (type: Event['type']) => {
		switch (type) {
			case 'game': return 'fa6-solid:trophy';
			case 'tournament': return 'fa6-solid:medal';
			default: return 'fa6-solid:whistle';
		}
	};

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
			{/* Morning Briefing */}
			<div style={{
				backgroundColor: '#ffffff',
				borderRadius: '8px',
				padding: '16px',
				borderLeft: '4px solid #2d5a1b'
			}}>
				<div style={{
					fontSize: '11px',
					fontWeight: 600,
					color: '#2d5a1b',
					textTransform: 'uppercase',
					letterSpacing: '0.5px',
					marginBottom: '10px'
				}}>
					Morning Briefing
				</div>
				{briefingLines.length === 0 ? (
					<div style={{ fontSize: '14px', color: '#2d5a1b', fontWeight: 500 }}>
						All good. No action needed today.
					</div>
				) : (
					<ul style={{ margin: 0, paddingLeft: '16px' }}>
						{briefingLines.map((line, i) => (
							<li key={i} style={{ fontSize: '13px', color: '#374151', lineHeight: 1.5, marginBottom: '4px' }}>
								{line}
							</li>
						))}
					</ul>
				)}
			</div>

			{/* Two Column Grid: Schedule + Messages */}
			<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
				{/* Upcoming Schedule */}
				<div style={{
					backgroundColor: '#ffffff',
					borderRadius: '8px',
					padding: '16px'
				}}>
					<div style={{
						fontSize: '11px',
						fontWeight: 600,
						color: '#64748b',
						textTransform: 'uppercase',
						letterSpacing: '0.5px',
						marginBottom: '12px'
					}}>
						Upcoming
					</div>

					{upcomingEvents.length === 0 ? (
						<div style={{ fontSize: '13px', color: '#64748b' }}>No upcoming events</div>
					) : (
						<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
							{upcomingEvents.map((event) => (
								<div
									key={event.id}
									onClick={() => onEventClick(event.id)}
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '10px',
										padding: '8px',
										backgroundColor: '#f8fafc',
										borderRadius: '6px',
										cursor: 'pointer'
									}}
								>
									<div style={{
										width: '32px',
										height: '32px',
										borderRadius: '6px',
										backgroundColor: event.type === 'game' ? '#fef3c7' : '#e0f2fe',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center'
									}}>
										<Icon
											icon={getEventIcon(event.type)}
											style={{
												fontSize: '14px',
												color: event.type === 'game' ? '#d97706' : '#0284c7'
											}}
										/>
									</div>
									<div style={{ flex: 1, minWidth: 0 }}>
										<div style={{ fontSize: '13px', fontWeight: 500, color: '#1a202c' }}>{event.title}</div>
										<div style={{ fontSize: '11px', color: '#64748b' }}>{event.when} · {event.team}</div>
									</div>
									<div style={{ fontSize: '11px', color: '#64748b', textAlign: 'right' }}>
										{event.confirmedCount}/{event.totalCount}
									</div>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Recent Messages */}
				<div style={{
					backgroundColor: '#ffffff',
					borderRadius: '8px',
					padding: '16px'
				}}>
					<div style={{
						fontSize: '11px',
						fontWeight: 600,
						color: '#64748b',
						textTransform: 'uppercase',
						letterSpacing: '0.5px',
						marginBottom: '12px'
					}}>
						Recent Messages
					</div>

					{recentMessages.length === 0 ? (
						<div style={{ fontSize: '13px', color: '#64748b' }}>No messages sent</div>
					) : (
						<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
							{recentMessages.map((msg) => (
								<div
									key={msg.id}
									style={{
										padding: '8px',
										backgroundColor: '#f8fafc',
										borderRadius: '6px'
									}}
								>
									<div style={{ fontSize: '13px', fontWeight: 500, color: '#1a202c' }}>{msg.title}</div>
									<div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
										{msg.sentAgo} · {msg.readCount}/{msg.totalCount} read
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>

			{/* Revenue Snapshot */}
			<div style={{
				backgroundColor: '#ffffff',
				borderRadius: '8px',
				padding: '16px',
				display: 'flex',
				alignItems: 'center',
				gap: '32px'
			}}>
				<div>
					<div style={{
						fontSize: '11px',
						fontWeight: 600,
						color: '#64748b',
						textTransform: 'uppercase',
						letterSpacing: '0.5px',
						marginBottom: '4px'
					}}>
						Collected This Month
					</div>
					<div style={{ fontSize: '28px', fontWeight: 700, color: '#2d5a1b' }}>
						${revenueThisMonth.toLocaleString()}
					</div>
				</div>
				<div style={{ width: '1px', height: '40px', backgroundColor: '#e2e8f0' }} />
				<div>
					<div style={{
						fontSize: '11px',
						fontWeight: 600,
						color: '#64748b',
						textTransform: 'uppercase',
						letterSpacing: '0.5px',
						marginBottom: '4px'
					}}>
						Outstanding
					</div>
					<div style={{
						fontSize: '28px',
						fontWeight: 700,
						color: outstandingThisMonth > 0 ? '#dc2626' : '#64748b'
					}}>
						${outstandingThisMonth.toLocaleString()}
					</div>
				</div>
			</div>
		</div>
	);
};

export default CenterPanel;
