import { supabase } from '../lib/supabase';

// VAPID public key - generate your own at https://vapidkeys.com/
// This is a placeholder - replace with your actual VAPID public key
const VAPID_PUBLIC_KEY = 'YOUR_VAPID_PUBLIC_KEY_HERE';

export const isPushSupported = () => {
  return 'serviceWorker' in navigator && 'PushManager' in window;
};

export const getNotificationPermission = () => {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isPushSupported()) {
    console.log('Push notifications not supported');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) {
    console.log('Service workers not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service worker registered:', registration);
    return registration;
  } catch (error) {
    console.error('Service worker registration failed:', error);
    return null;
  }
};

export const subscribeToPush = async (): Promise<PushSubscription | null> => {
  try {
    const registration = await navigator.serviceWorker.ready;

    // Check existing subscription
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // Create new subscription
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
    }

    // Save subscription to database
    await saveSubscription(subscription);

    return subscription;
  } catch (error) {
    console.error('Failed to subscribe to push:', error);
    return null;
  }
};

export const unsubscribeFromPush = async (): Promise<boolean> => {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
      await removeSubscription(subscription);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Failed to unsubscribe from push:', error);
    return false;
  }
};

const saveSubscription = async (subscription: PushSubscription) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const subscriptionData = subscription.toJSON();

  await supabase
    .from('push_subscriptions')
    .upsert({
      user_id: user.id,
      endpoint: subscriptionData.endpoint,
      p256dh: subscriptionData.keys?.p256dh,
      auth: subscriptionData.keys?.auth,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    });
};

const removeSubscription = async (subscription: PushSubscription) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', user.id);
};

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Local notification (doesn't require push server)
export const showLocalNotification = async (
  title: string,
  body: string,
  options?: {
    icon?: string;
    tag?: string;
    data?: any;
  }
) => {
  if (Notification.permission !== 'granted') {
    const granted = await requestNotificationPermission();
    if (!granted) return;
  }

  const registration = await navigator.serviceWorker.ready;

  await registration.showNotification(title, {
    body,
    icon: options?.icon || '/soccercoachprologo.png',
    badge: '/badge-icon.png',
    tag: options?.tag || 'local-notification',
    vibrate: [200, 100, 200],
    data: options?.data || { url: '/dashboard' }
  });
};

// Notification types for the app
export const NotificationTypes = {
  BADGE_AWARDED: 'badge_awarded',
  EVENT_REMINDER: 'event_reminder',
  MESSAGE_RECEIVED: 'message_received',
  ATTENDANCE_REMINDER: 'attendance_reminder',
  STREAK_ALERT: 'streak_alert',
  MILESTONE_REACHED: 'milestone_reached'
};

// Send notification based on type
export const sendNotification = async (
  type: string,
  data: { playerName?: string; badgeName?: string; eventTitle?: string; message?: string }
) => {
  let title = 'CoachSoccerPro';
  let body = '';

  switch (type) {
    case NotificationTypes.BADGE_AWARDED:
      title = '🏆 Badge Awarded!';
      body = `${data.playerName} earned the "${data.badgeName}" badge!`;
      break;
    case NotificationTypes.EVENT_REMINDER:
      title = '⚽ Event Reminder';
      body = `${data.eventTitle} starts in 1 hour`;
      break;
    case NotificationTypes.MESSAGE_RECEIVED:
      title = '💬 New Message';
      body = data.message || 'You have a new message from your coach';
      break;
    case NotificationTypes.ATTENDANCE_REMINDER:
      title = '📋 Take Attendance';
      body = `Don't forget to take attendance for ${data.eventTitle}`;
      break;
    case NotificationTypes.STREAK_ALERT:
      title = '🔥 Streak Alert!';
      body = `${data.playerName}'s streak is about to end!`;
      break;
    case NotificationTypes.MILESTONE_REACHED:
      title = '🎉 Milestone Reached!';
      body = `${data.playerName} reached a new milestone!`;
      break;
    default:
      body = data.message || 'Check your app for updates';
  }

  await showLocalNotification(title, body, { tag: type });
};
