export type PlatformId = 'telegram' | 'facebook' | 'discord';
export type CommandStatus = 'operational' | 'partial' | 'unsupported';
export type CommandCategory = 'Moderation' | 'Utility' | 'Messaging' | 'Automation' | 'Admin';

export type Platform = {
  id: PlatformId;
  name: string;
  shortLabel: string;
  description: string;
  status: 'connected' | 'attention' | 'offline';
  commandCount: number;
  accent: string;
};

export type Command = {
  id: string;
  name: string;
  description: string;
  category: CommandCategory;
  platforms: Record<PlatformId, CommandStatus>;
  status: CommandStatus;
  usage: number;
  updatedAt: string;
  risk: 'low' | 'medium' | 'high';
  syntax: string;
  permissions: string[];
  responseExample: string;
};

export type ActivityEvent = {
  id: string;
  title: string;
  detail: string;
  time: string;
  platform: PlatformId | 'system';
  type: 'deploy' | 'edit' | 'warning' | 'connect';
};

export const platforms: Platform[] = [
  { id: 'telegram', name: 'Telegram', shortLabel: 'TG', description: 'Bot API · @gioxbot_ops', status: 'connected', commandCount: 14, accent: '#27B8B1' },
  { id: 'facebook', name: 'Facebook Page', shortLabel: 'FB', description: 'Page messaging · Gioxbot HQ', status: 'attention', commandCount: 9, accent: '#5976D9' },
  { id: 'discord', name: 'Discord', shortLabel: 'DS', description: 'Gateway · Gioxbot Command', status: 'connected', commandCount: 11, accent: '#8C78E8' },
];

export const commands: Command[] = [
  { id: 'ban-user', name: '/ban', description: 'Remove a member and prevent them from rejoining the workspace.', category: 'Moderation', platforms: { telegram: 'operational', facebook: 'partial', discord: 'operational' }, status: 'operational', usage: 482, updatedAt: '18 min ago', risk: 'high', syntax: '/ban @member [reason]', permissions: ['Moderate members', 'Manage channels'], responseExample: 'Member @rhea was banned. Reason: repeated link spam.' },
  { id: 'mute-user', name: '/mute', description: 'Silence a member for a defined period without removing them.', category: 'Moderation', platforms: { telegram: 'operational', facebook: 'unsupported', discord: 'operational' }, status: 'partial', usage: 218, updatedAt: '2 hours ago', risk: 'medium', syntax: '/mute @member 30m [reason]', permissions: ['Moderate members'], responseExample: '@marco muted for 30 minutes.' },
  { id: 'purge', name: '/purge', description: 'Clear recent messages from a channel in one controlled action.', category: 'Moderation', platforms: { telegram: 'operational', facebook: 'unsupported', discord: 'operational' }, status: 'partial', usage: 96, updatedAt: 'Yesterday', risk: 'high', syntax: '/purge 25', permissions: ['Manage messages'], responseExample: '25 messages removed from #general.' },
  { id: 'warn-user', name: '/warn', description: 'Log a formal warning against a member and notify the operator.', category: 'Moderation', platforms: { telegram: 'operational', facebook: 'partial', discord: 'operational' }, status: 'operational', usage: 164, updatedAt: '3 days ago', risk: 'medium', syntax: '/warn @member [reason]', permissions: ['Moderate members'], responseExample: 'Warning 04-118 logged for @sasha.' },
  { id: 'status', name: '/status', description: 'Return channel health, latency, and the active command set.', category: 'Utility', platforms: { telegram: 'operational', facebook: 'operational', discord: 'operational' }, status: 'operational', usage: 1204, updatedAt: '11 min ago', risk: 'low', syntax: '/status', permissions: ['Read messages'], responseExample: 'All systems nominal · 142ms gateway latency.' },
  { id: 'whois', name: '/whois', description: 'Inspect a member profile, roles, and recent moderation history.', category: 'Utility', platforms: { telegram: 'operational', facebook: 'partial', discord: 'operational' }, status: 'partial', usage: 347, updatedAt: '5 hours ago', risk: 'low', syntax: '/whois @member', permissions: ['Read member profiles'], responseExample: '@rhea · Operator · joined 14 Mar 2024 · 0 active flags.' },
  { id: 'help', name: '/help', description: 'Show a contextual list of commands available in the current channel.', category: 'Messaging', platforms: { telegram: 'operational', facebook: 'operational', discord: 'operational' }, status: 'operational', usage: 1889, updatedAt: '6 days ago', risk: 'low', syntax: '/help [category]', permissions: ['Read messages'], responseExample: 'Showing 14 commands available in this channel.' },
  { id: 'announce', name: '/announce', description: 'Send a formatted announcement to every connected channel.', category: 'Messaging', platforms: { telegram: 'operational', facebook: 'partial', discord: 'operational' }, status: 'partial', usage: 72, updatedAt: '2 days ago', risk: 'high', syntax: '/announce "message" [--preview]', permissions: ['Publish announcements'], responseExample: 'Preview ready across 3 platforms. Awaiting confirmation.' },
  { id: 'remind', name: '/remind', description: 'Schedule a one-time reminder in the current channel.', category: 'Automation', platforms: { telegram: 'operational', facebook: 'unsupported', discord: 'operational' }, status: 'partial', usage: 134, updatedAt: '12 days ago', risk: 'low', syntax: '/remind 16:00 "message"', permissions: ['Manage automations'], responseExample: 'Reminder scheduled for today at 16:00 UTC.' },
  { id: 'digest', name: '/digest', description: 'Compile recent channel activity into a compact operator brief.', category: 'Automation', platforms: { telegram: 'operational', facebook: 'partial', discord: 'operational' }, status: 'partial', usage: 54, updatedAt: '1 day ago', risk: 'low', syntax: '/digest [24h|7d]', permissions: ['Read message history'], responseExample: 'Digest prepared · 86 messages · 4 flagged events.' },
  { id: 'sync', name: '/sync', description: 'Reconcile command registration with the selected platform.', category: 'Admin', platforms: { telegram: 'operational', facebook: 'partial', discord: 'operational' }, status: 'partial', usage: 43, updatedAt: '41 min ago', risk: 'medium', syntax: '/sync [platform]', permissions: ['Manage integrations'], responseExample: 'Telegram command registry is current.' },
  { id: 'audit-log', name: '/audit-log', description: 'Review operator actions and system changes across the workspace.', category: 'Admin', platforms: { telegram: 'operational', facebook: 'unsupported', discord: 'partial' }, status: 'partial', usage: 27, updatedAt: '8 days ago', risk: 'low', syntax: '/audit-log [--since 7d]', permissions: ['View audit log'], responseExample: 'Showing 18 events from the last 7 days.' },
  { id: 'lockdown', name: '/lockdown', description: 'Temporarily restrict channel activity while an incident is reviewed.', category: 'Admin', platforms: { telegram: 'operational', facebook: 'unsupported', discord: 'unsupported' }, status: 'partial', usage: 8, updatedAt: '22 days ago', risk: 'high', syntax: '/lockdown [duration]', permissions: ['Manage channels', 'Incident response'], responseExample: 'Telegram channel locked for 15 minutes.' },
  { id: 'slowmode', name: '/slowmode', description: 'Set a message interval to slow down fast-moving channels.', category: 'Moderation', platforms: { telegram: 'partial', facebook: 'unsupported', discord: 'operational' }, status: 'partial', usage: 31, updatedAt: '4 days ago', risk: 'medium', syntax: '/slowmode 10s', permissions: ['Manage channels'], responseExample: 'Slowmode set to one message every 10 seconds.' },
];

export const activityEvents: ActivityEvent[] = [
  { id: 'evt-1', title: 'Command registry synced', detail: 'Telegram · 14 commands checked, no drift detected', time: '18 min ago', platform: 'telegram', type: 'deploy' },
  { id: 'evt-2', title: 'Facebook capability flagged', detail: '/announce is available in preview mode only', time: '43 min ago', platform: 'facebook', type: 'warning' },
  { id: 'evt-3', title: 'Permission policy updated', detail: 'Added “Incident response” to the lockdown command', time: '2 hours ago', platform: 'system', type: 'edit' },
  { id: 'evt-4', title: 'Discord gateway reconnected', detail: 'Healthy connection restored after 22s interruption', time: 'Yesterday', platform: 'discord', type: 'connect' },
  { id: 'evt-5', title: 'New command published', detail: '/digest · v1.4 · Telegram and Discord', time: 'Yesterday', platform: 'system', type: 'deploy' },
  { id: 'evt-6', title: 'Workspace preferences saved', detail: 'Default response language set to English (US)', time: '2 days ago', platform: 'system', type: 'edit' },
];