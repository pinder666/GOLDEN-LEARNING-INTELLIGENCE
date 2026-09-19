import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
	isPushSupported,
	getNotificationPermission,
	requestNotificationPermission,
	registerServiceWorker,
	subscribeToPush,
	unsubscribeFromPush
} from "../../utils/pushNotifications";

const NotificationSettings = () => {
	const [supported, setSupported] = useState(false);
	const [permission, setPermission] = useState<string>('default');
	const [subscribed, setSubscribed] = useState(false);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		checkStatus();
	}, []);

	const checkStatus = async () => {
		const isSupported = isPushSupported();
		setSupported(isSupported);

		if (isSupported) {
			setPermission(getNotificationPermission());

			// Check if already subscribed
			try {
				const registration = await navigator.serviceWorker.ready;
				const subscription = await registration.pushManager.getSubscription();
				setSubscribed(!!subscription);
			} catch (e) {
				console.error('Error checking subscription:', e);
			}
		}

		setLoading(false);
	};

	const handleEnable = async () => {
		setLoading(true);

		try {
			// Register service worker first
			await registerServiceWorker();

			// Request permission
			const granted = await requestNotificationPermission();
			setPermission(granted ? 'granted' : 'denied');

			if (granted) {
				// Subscribe to push
				const subscription = await subscribeToPush();
				setSubscribed(!!subscription);

				if (subscription) {
					toast.success("Notifications enabled!");
				} else {
					toast.warning("Notifications enabled, but push subscription failed");
				}
			} else {
				toast.error("Notification permission denied");
			}
		} catch (error) {
			console.error('Error enabling notifications:', error);
			toast.error("Failed to enable notifications");
		} finally {
			setLoading(false);
		}
	};

	const handleDisable = async () => {
		setLoading(true);

		try {
			const success = await unsubscribeFromPush();
			setSubscribed(!success);

			if (success) {
				toast.success("Notifications disabled");
			}
		} catch (error) {
			console.error('Error disabling notifications:', error);
			toast.error("Failed to disable notifications");
		} finally {
			setLoading(false);
		}
	};

	if (!supported) {
		return (
			<div className="bg-white rounded-3 p-4 shadow-sm">
				<div className="d-flex align-items-center gap-3 mb-3">
					<div
						className="rounded-circle d-flex align-items-center justify-content-center"
						style={{ width: '48px', height: '48px', backgroundColor: '#e2e8f0' }}
					>
						<Icon icon="fa6-solid:bell-slash" style={{ color: '#a0aec0', fontSize: '20px' }} />
					</div>
					<div>
						<h3 className="fw-bold mb-0" style={{ fontSize: '16px' }}>Push Notifications</h3>
						<p className="text-muted mb-0" style={{ fontSize: '14px' }}>Not supported in this browser</p>
					</div>
				</div>
				<p className="text-muted" style={{ fontSize: '13px' }}>
					Push notifications require a modern browser with service worker support.
					Try using Chrome, Firefox, Edge, or Safari on iOS 16.4+.
				</p>
			</div>
		);
	}

	return (
		<div className="bg-white rounded-3 p-4 shadow-sm">
			<div className="d-flex align-items-center justify-content-between mb-4">
				<div className="d-flex align-items-center gap-3">
					<div
						className="rounded-circle d-flex align-items-center justify-content-center"
						style={{
							width: '48px',
							height: '48px',
							backgroundColor: subscribed ? '#2d5a1b15' : '#e2e8f0'
						}}
					>
						<Icon
							icon={subscribed ? "fa6-solid:bell" : "fa6-solid:bell-slash"}
							style={{ color: subscribed ? '#2d5a1b' : '#a0aec0', fontSize: '20px' }}
						/>
					</div>
					<div>
						<h3 className="fw-bold mb-0" style={{ fontSize: '16px' }}>Push Notifications</h3>
						<p className="text-muted mb-0" style={{ fontSize: '14px' }}>
							{subscribed ? 'Enabled' : permission === 'denied' ? 'Blocked by browser' : 'Disabled'}
						</p>
					</div>
				</div>
				{permission !== 'denied' && (
					<button
						className={`btn btn-sm rounded-pill px-3 ${subscribed ? 'btn-outline-secondary' : ''}`}
						style={!subscribed ? { backgroundColor: '#2d5a1b', color: 'white' } : {}}
						onClick={subscribed ? handleDisable : handleEnable}
						disabled={loading}
					>
						{loading ? (
							<Icon icon="eos-icons:loading" className="me-1" />
						) : (
							<Icon icon={subscribed ? "fa6-solid:toggle-on" : "fa6-solid:toggle-off"} className="me-1" />
						)}
						{subscribed ? 'Disable' : 'Enable'}
					</button>
				)}
			</div>

			{permission === 'denied' && (
				<div className="alert alert-warning mb-0" style={{ fontSize: '13px' }}>
					<Icon icon="fa6-solid:triangle-exclamation" className="me-2" />
					Notifications are blocked. To enable them:
					<ol className="mb-0 mt-2">
						<li>Click the lock icon in your browser's address bar</li>
						<li>Find "Notifications" and change to "Allow"</li>
						<li>Refresh this page</li>
					</ol>
				</div>
			)}

			{subscribed && (
				<div>
					<h4 className="fw-semibold mb-3" style={{ fontSize: '14px' }}>You'll receive notifications for:</h4>
					<div className="d-flex flex-column gap-2">
						{[
							{ icon: "fa6-solid:trophy", label: "Badge awards", color: "#dd6b20" },
							{ icon: "fa6-solid:calendar", label: "Event reminders", color: "#2b6cb0" },
							{ icon: "fa6-solid:message", label: "New messages", color: "#6b46c1" },
							{ icon: "fa6-solid:fire", label: "Streak alerts", color: "#c53030" },
							{ icon: "fa6-solid:star", label: "Milestones reached", color: "#2d5a1b" }
						].map((item, idx) => (
							<div key={idx} className="d-flex align-items-center gap-2">
								<Icon icon={item.icon} style={{ color: item.color, fontSize: '14px' }} />
								<span style={{ fontSize: '14px' }}>{item.label}</span>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
};

export default NotificationSettings;
