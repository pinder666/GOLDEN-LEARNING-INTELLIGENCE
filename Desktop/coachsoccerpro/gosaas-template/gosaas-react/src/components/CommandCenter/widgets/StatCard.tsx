import { Icon } from '@iconify/react';
import { ReactNode } from 'react';

interface StatCardProps {
	label: string;
	value: string | number;
	icon: string;
	color?: string;
	alert?: boolean;
	onClick?: () => void;
	subtitle?: ReactNode;
}

const StatCard = ({ label, value, icon, color = '#2d5a1b', alert = false, onClick, subtitle }: StatCardProps) => {
	const displayColor = alert ? '#dc2626' : color;

	return (
		<div
			onClick={onClick}
			style={{
				backgroundColor: '#ffffff',
				borderRadius: '12px',
				padding: '16px',
				display: 'flex',
				alignItems: 'center',
				gap: '12px',
				boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
				cursor: onClick ? 'pointer' : 'default',
				minHeight: '44px',
				border: alert ? '2px solid #dc2626' : '1px solid #e2e8f0',
				transition: 'transform 0.15s ease',
			}}
		>
			<div
				style={{
					width: '44px',
					height: '44px',
					borderRadius: '10px',
					backgroundColor: `${displayColor}15`,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					flexShrink: 0
				}}
			>
				<Icon icon={icon} style={{ fontSize: '20px', color: displayColor }} />
			</div>
			<div style={{ flex: 1, minWidth: 0 }}>
				<div style={{ fontSize: '24px', fontWeight: 700, color: displayColor, lineHeight: 1.2 }}>
					{value}
				</div>
				<div style={{ fontSize: '13px', color: '#718096', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
					{label}
				</div>
				{subtitle && (
					<div style={{ fontSize: '12px', color: '#a0aec0', marginTop: '2px' }}>
						{subtitle}
					</div>
				)}
			</div>
		</div>
	);
};

export default StatCard;
