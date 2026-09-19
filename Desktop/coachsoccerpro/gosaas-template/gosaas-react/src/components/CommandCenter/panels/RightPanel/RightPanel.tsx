import { Icon } from '@iconify/react';

interface AutomatedItem {
	id: string;
	title: string;
	sendTime: string;
	recipientCount: number;
	needsApproval: boolean;
}

interface PrivateClient {
	id: string;
	name: string;
	nextSession: string;
	isPaid: boolean;
}

interface RightPanelProps {
	automatedQueue: AutomatedItem[];
	privateClients: PrivateClient[];
	tier: 'grassroots' | 'first_team' | 'gaffer';
	onQuickAction: (action: string) => void;
	onApprove: (itemId: string) => void;
	onSkip: (itemId: string) => void;
}

const RightPanel = ({
	automatedQueue,
	privateClients,
	tier,
	onQuickAction,
	onApprove,
	onSkip
}: RightPanelProps) => {
	const quickActions = [
		{ id: 'voice', icon: 'fa6-solid:microphone', label: 'Voice Note', color: '#2d5a1b' },
		{ id: 'badge', icon: 'fa6-solid:award', label: 'Badge', color: '#d97706' },
		{ id: 'payment', icon: 'fa6-solid:dollar-sign', label: 'Payment', color: '#0284c7' },
		{ id: 'event', icon: 'fa6-solid:calendar-plus', label: 'Event', color: '#7c3aed' },
	];

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
			{/* Quick Actions */}
			<div>
				<div style={{
					fontSize: '11px',
					fontWeight: 600,
					color: '#64748b',
					textTransform: 'uppercase',
					letterSpacing: '0.5px',
					marginBottom: '8px'
				}}>
					Quick Actions
				</div>
				<div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
					{quickActions.map((action) => (
						<button
							key={action.id}
							onClick={() => onQuickAction(action.id)}
							style={{
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								justifyContent: 'center',
								gap: '4px',
								padding: '12px 8px',
								backgroundColor: `${action.color}10`,
								border: 'none',
								borderRadius: '8px',
								cursor: 'pointer',
								minHeight: '60px'
							}}
						>
							<Icon icon={action.icon} style={{ fontSize: '18px', color: action.color }} />
							<span style={{ fontSize: '10px', fontWeight: 500, color: action.color }}>
								{action.label}
							</span>
						</button>
					))}
				</div>
			</div>

			{/* Automated Queue */}
			<div>
				<div style={{
					fontSize: '11px',
					fontWeight: 600,
					color: '#64748b',
					textTransform: 'uppercase',
					letterSpacing: '0.5px',
					marginBottom: '8px'
				}}>
					Automated This Week
				</div>

				{automatedQueue.length === 0 ? (
					<div style={{
						padding: '12px',
						backgroundColor: '#f8fafc',
						borderRadius: '6px',
						fontSize: '12px',
						color: '#64748b'
					}}>
						No automated messages scheduled
					</div>
				) : (
					<div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
						{automatedQueue.map((item) => (
							<div
								key={item.id}
								style={{
									padding: '10px',
									backgroundColor: '#f8fafc',
									borderRadius: '6px'
								}}
							>
								<div style={{ fontSize: '12px', fontWeight: 500, color: '#1a202c' }}>{item.title}</div>
								<div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
									{item.sendTime} · {item.recipientCount} parents
								</div>
								{item.needsApproval && (
									<div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
										<button
											onClick={() => onApprove(item.id)}
											style={{
												flex: 1,
												padding: '6px',
												fontSize: '11px',
												fontWeight: 500,
												backgroundColor: '#2d5a1b',
												color: '#ffffff',
												border: 'none',
												borderRadius: '4px',
												cursor: 'pointer'
											}}
										>
											Approve
										</button>
										<button
											onClick={() => onSkip(item.id)}
											style={{
												flex: 1,
												padding: '6px',
												fontSize: '11px',
												fontWeight: 500,
												backgroundColor: '#ffffff',
												color: '#64748b',
												border: '1px solid #e2e8f0',
												borderRadius: '4px',
												cursor: 'pointer'
											}}
										>
											Skip
										</button>
									</div>
								)}
							</div>
						))}
					</div>
				)}
			</div>

			{/* Private Coaching */}
			<div>
				<div style={{
					fontSize: '11px',
					fontWeight: 600,
					color: '#64748b',
					textTransform: 'uppercase',
					letterSpacing: '0.5px',
					marginBottom: '8px'
				}}>
					Private Coaching
				</div>

				{privateClients.length === 0 ? (
					<button
						style={{
							width: '100%',
							padding: '10px',
							fontSize: '12px',
							color: '#64748b',
							backgroundColor: '#f8fafc',
							border: '1px dashed #cbd5e0',
							borderRadius: '6px',
							cursor: 'pointer'
						}}
					>
						+ Add Private Client
					</button>
				) : (
					<div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
						{privateClients.map((client) => (
							<div
								key={client.id}
								style={{
									padding: '10px',
									backgroundColor: '#f8fafc',
									borderRadius: '6px',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'space-between'
								}}
							>
								<div>
									<div style={{ fontSize: '12px', fontWeight: 500, color: '#1a202c' }}>{client.name}</div>
									<div style={{ fontSize: '11px', color: '#64748b' }}>{client.nextSession}</div>
								</div>
								<div style={{
									fontSize: '10px',
									fontWeight: 500,
									padding: '2px 6px',
									borderRadius: '4px',
									backgroundColor: client.isPaid ? '#dcfce7' : '#fef2f2',
									color: client.isPaid ? '#166534' : '#dc2626'
								}}>
									{client.isPaid ? 'Paid' : 'Due'}
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Social Media */}
			<div>
				<div style={{
					fontSize: '11px',
					fontWeight: 600,
					color: '#64748b',
					textTransform: 'uppercase',
					letterSpacing: '0.5px',
					marginBottom: '8px'
				}}>
					Social Media
				</div>

				{tier === 'grassroots' ? (
					<div style={{
						padding: '16px',
						backgroundColor: '#f8fafc',
						borderRadius: '6px',
						textAlign: 'center'
					}}>
						<Icon icon="fa6-solid:lock" style={{ fontSize: '20px', color: '#a0aec0', marginBottom: '6px' }} />
						<div style={{ fontSize: '12px', color: '#64748b' }}>Upgrade to unlock</div>
					</div>
				) : (
					<div style={{
						padding: '12px',
						backgroundColor: '#f8fafc',
						borderRadius: '6px',
						fontSize: '12px',
						color: '#64748b'
					}}>
						Connect accounts to auto-post
					</div>
				)}
			</div>
		</div>
	);
};

export default RightPanel;
