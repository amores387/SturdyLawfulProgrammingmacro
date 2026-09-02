import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Route, Switch, Link, useLocation, useParams, Router as WouterRouter } from 'wouter';
import {
  Activity, AlertTriangle, ArrowUpRight, Bell, Bot, Check, ChevronRight, CircleHelp,
  ChevronDown, Command as CommandIcon, Copy, Gauge, Hash, LayoutDashboard, Menu, MessageCircle,
  MoreHorizontal, Search, Settings,
  Shield, SlidersHorizontal, Sparkles, Terminal, UserRound, Wifi, X, Zap,
} from 'lucide-react';
import { activityEvents, commands, optionalBots, platforms, type ActivityEvent, type BotModule, type Command, type CommandCategory, type CommandStatus, type PlatformId } from '@/lib/data';
import { initialMessengerBotRules, initialMessengerConversations, type MessengerBotRule, type MessengerConversation } from '@/lib/messenger-data';
import MessengerWorkspace from '@/components/MessengerWorkspace';
import '@/index.css';

const platformIcons: Record<PlatformId, typeof MessageCircle> = {
  telegram: MessageCircle,
  facebook: UserRound,
  discord: Hash,
};

const statusCopy: Record<CommandStatus, string> = {
  operational: 'Operational',
  partial: 'Partial coverage',
  unsupported: 'Unsupported',
};

const statusTone: Record<CommandStatus, string> = {
  operational: 'bg-[#E1F5F1] text-[#14766F] dark:bg-[#17443F] dark:text-[#7CE0D6]',
  partial: 'bg-[#FFF1D7] text-[#986119] dark:bg-[#4B361A] dark:text-[#F4C875]',
  unsupported: 'bg-[#F0E5E5] text-[#9B5555] dark:bg-[#442B2D] dark:text-[#E99B9B]',
};

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(' ');
}

function useLocalStorageState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    const stored = window.localStorage.getItem(key);
    if (!stored) return initialValue;
    try {
      return JSON.parse(stored) as T;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    if (typeof window !== 'undefined') window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}

function Logo() {
  return (
    <div className="flex items-center gap-3" data-testid="brand-gioxbot">
      <div className="relative flex size-9 items-center justify-center rounded-xl bg-[#F6B745] text-[#273244] shadow-[0_4px_12px_rgba(246,183,69,.28)]">
        <Bot size={19} strokeWidth={2.5} />
        <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full border-2 border-[#1A2435] bg-[#5DE0D2]" />
      </div>
      <div className="leading-none">
        <div className="text-[14px] font-extrabold tracking-[-.03em] text-white">Gioxbot</div>
        <div className="mt-1 font-mono text-[9px] uppercase tracking-[.2em] text-[#8C9AAD]">Command desk</div>
      </div>
    </div>
  );
}

function PlatformMark({ id, size = 'sm' }: { id: PlatformId; size?: 'sm' | 'lg' }) {
  const Icon = platformIcons[id];
  const platform = platforms.find((item) => item.id === id);
  return (
    <span
      className={cx('inline-flex shrink-0 items-center justify-center rounded-lg', size === 'lg' ? 'size-11 rounded-xl' : 'size-7')}
      style={{ backgroundColor: `${platform?.accent}20`, color: platform?.accent }}
      data-testid={`platform-mark-${id}`}
    >
      <Icon size={size === 'lg' ? 20 : 14} strokeWidth={2.2} />
    </span>
  );
}

function StatusPill({ status, compact = false }: { status: CommandStatus; compact?: boolean }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full font-mono uppercase tracking-[.08em]', compact ? 'px-2 py-1 text-[9px]' : 'px-2.5 py-1.5 text-[10px]', statusTone[status])} data-testid={`status-${status}`}>
      <span className="size-1.5 rounded-full bg-current" />
      {statusCopy[status]}
    </span>
  );
}

function Sidebar({ open, onClose, commandCount }: { open: boolean; onClose: () => void; commandCount: number }) {
  const [location] = useLocation();
  const links = [
    { href: '/', label: 'Overview', icon: LayoutDashboard },
    { href: '/commands', label: 'Commands', icon: CommandIcon, count: commandCount },
    { href: '/messenger', label: 'Messenger', icon: MessageCircle },
    { href: '/create-bot', label: 'Build bot', icon: Bot },
    { href: '/channels', label: 'Channels', icon: Wifi },
    { href: '/activity', label: 'Activity', icon: Activity },
  ];
  return (
    <>
      {open && <button aria-label="Close navigation" className="fixed inset-0 z-30 bg-[#152033]/40 backdrop-blur-sm lg:hidden" onClick={onClose} data-testid="button-close-sidebar" />}
      <aside className={cx('fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col border-r border-[#2D394B] bg-[#1A2435] px-4 py-5 transition-transform duration-300 lg:static lg:translate-x-0', open ? 'translate-x-0' : '-translate-x-full')} data-testid="sidebar">
        <div className="mb-9 flex items-center justify-between px-2">
          <Logo />
          <button onClick={onClose} className="text-[#7C8A9C] hover:text-white lg:hidden" aria-label="Close navigation" data-testid="button-sidebar-close"><X size={18} /></button>
        </div>
        <div className="mb-3 px-3 font-mono text-[9px] font-medium uppercase tracking-[.18em] text-[#637288]">Workspace</div>
        <nav className="space-y-1" aria-label="Main navigation">
          {links.map(({ href, label, icon: Icon, count }) => {
            const active = href === '/' ? location === '/' : location.startsWith(href);
            return (
              <Link href={href} key={href} onClick={onClose} className={cx('group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[12px] font-semibold transition-all', active ? 'bg-[#2A394D] text-white shadow-[inset_3px_0_0_#5DE0D2]' : 'text-[#9BA8B8] hover:bg-[#233147] hover:text-white')} data-testid={`link-${label.toLowerCase()}`}>
                <Icon size={17} className={cx(active ? 'text-[#5DE0D2]' : 'text-[#718197]', 'transition-colors')} />
                <span>{label}</span>
                {count && <span className={cx('ml-auto rounded-md px-1.5 py-0.5 font-mono text-[10px]', active ? 'bg-[#415268] text-[#C9EAE5]' : 'bg-[#253246] text-[#7E8EA4]')}>{count}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="mt-8 mb-3 px-3 font-mono text-[9px] font-medium uppercase tracking-[.18em] text-[#637288]">System</div>
        <nav className="space-y-1">
          <Link href="/settings" onClick={onClose} className={cx('group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[12px] font-semibold transition-all', location.startsWith('/settings') ? 'bg-[#2A394D] text-white shadow-[inset_3px_0_0_#5DE0D2]' : 'text-[#9BA8B8] hover:bg-[#233147] hover:text-white')} data-testid="link-settings">
            <Settings size={17} /><span>Settings</span>
          </Link>
        </nav>
        <div className="mt-auto rounded-2xl border border-[#324158] bg-[#202D40] p-3.5">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-bold text-[#D4DDE7]"><span className="size-2 rounded-full bg-[#5DE0D2] shadow-[0_0_0_4px_rgba(93,224,210,.1)]" />All systems nominal</div>
          <p className="font-mono text-[10px] leading-relaxed text-[#7C8EA3]">Last registry check<br /><span className="text-[#B3C0CF]">Today, 09:42:18 UTC</span></p>
        </div>
        <div className="mt-4 flex items-center gap-2 px-2 text-[10px] text-[#718197]"><div className="flex size-7 items-center justify-center rounded-full bg-[#F6B745] font-bold text-[#273244]">AM</div><span>Alex Morgan</span><MoreHorizontal size={15} className="ml-auto" /></div>
      </aside>
    </>
  );
}

function Header({ title, eyebrow, onMenu }: { title: string; eyebrow: string; onMenu: () => void }) {
  return (
    <header className="flex min-h-[76px] items-center justify-between border-b border-border bg-card/75 px-5 backdrop-blur-md md:px-9">
      <div className="flex items-center gap-3">
        <button className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground lg:hidden" onClick={onMenu} aria-label="Open navigation" data-testid="button-open-sidebar"><Menu size={20} /></button>
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[.19em] text-muted-foreground">{eyebrow}</div>
          <h1 className="mt-1 text-[20px] font-extrabold tracking-[-.04em] text-foreground md:text-[22px]">{title}</h1>
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        <button className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground" aria-label="Notifications" data-testid="button-notifications"><Bell size={17} /><span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-[#F6B745]" /></button>
        <div className="hidden h-6 w-px bg-border sm:block" />
        <span className="hidden font-mono text-[10px] text-muted-foreground sm:inline">UTC · 09:45</span>
        <div className="flex size-8 items-center justify-center rounded-full bg-[#D8EDEA] text-[10px] font-extrabold text-[#14766F] dark:bg-[#204844] dark:text-[#84E5D9]">AM</div>
      </div>
    </header>
  );
}

function StatCard({ label, value, detail, icon: Icon, tone }: { label: string; value: string; detail: string; icon: typeof Gauge; tone: 'teal' | 'amber' | 'ink' }) {
  return (
    <div className="panel-shadow fade-up group rounded-2xl border border-border bg-card p-4 transition-transform hover:-translate-y-0.5 md:p-5" data-testid={`stat-${label.toLowerCase().replaceAll(' ', '-')}`}>
      <div className="mb-6 flex items-start justify-between"><span className="font-mono text-[10px] uppercase tracking-[.14em] text-muted-foreground">{label}</span><div className={cx('rounded-lg p-2', tone === 'teal' ? 'bg-[#DDF3F0] text-[#167F77] dark:bg-[#1A4541] dark:text-[#7CE0D6]' : tone === 'amber' ? 'bg-[#FFF0D2] text-[#A36A16] dark:bg-[#4B361A] dark:text-[#F4C875]' : 'bg-secondary text-muted-foreground')}><Icon size={15} /></div></div>
      <div className="flex items-end justify-between"><span className="text-[30px] font-extrabold tracking-[-.07em] text-foreground">{value}</span><span className="mb-1 text-right font-mono text-[10px] leading-tight text-muted-foreground">{detail}</span></div>
    </div>
  );
}

function PlatformCoverage({ commandList }: { commandList: Command[] }) {
  const total = commandList.length;
  return (
    <section className="panel-shadow rounded-2xl border border-border bg-card p-5 md:p-6" data-testid="section-platform-coverage">
      <div className="mb-5 flex items-start justify-between"><div><div className="font-mono text-[10px] uppercase tracking-[.14em] text-muted-foreground">Surface map</div><h2 className="mt-1 text-[16px] font-extrabold tracking-[-.03em]">Platform coverage</h2></div><Link href="/channels" className="flex items-center gap-1 text-[11px] font-bold text-primary hover:underline" data-testid="link-view-channels">View channels <ArrowUpRight size={13} /></Link></div>
      <div className="space-y-4">
        {platforms.map((platform) => {
           const operational = commandList.filter((command) => command.platforms[platform.id] === 'operational').length;
           const partial = commandList.filter((command) => command.platforms[platform.id] === 'partial').length;
           const percentage = total ? Math.round(((operational + partial * .5) / total) * 100) : 0;
          return <div key={platform.id} className="group" data-testid={`coverage-row-${platform.id}`}>
            <div className="mb-2 flex items-center gap-3"><PlatformMark id={platform.id} /><div className="min-w-0 flex-1"><div className="flex items-center justify-between"><span className="text-[12px] font-bold">{platform.name}</span><span className="font-mono text-[10px] text-muted-foreground">{operational} live · {partial} partial</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full transition-all duration-700" style={{ width: `${percentage}%`, backgroundColor: platform.accent }} /></div></div><span className="w-9 text-right font-mono text-[11px] font-medium text-foreground">{percentage}%</span></div>
           </div>;
        })}
      </div>
      <div className="mt-5 flex gap-4 border-t border-border pt-4 font-mono text-[9px] uppercase tracking-[.08em] text-muted-foreground"><span className="flex items-center gap-1.5"><i className="size-1.5 rounded-full bg-[#27B8B1]" />Live</span><span className="flex items-center gap-1.5"><i className="size-1.5 rounded-full bg-[#F6B745]" />Partial</span><span className="flex items-center gap-1.5"><i className="size-1.5 rounded-full bg-[#BD9292]" />Gap</span></div>
    </section>
  );
}

function ActivityList({ compact = false }: { compact?: boolean }) {
  const events = compact ? activityEvents.slice(0, 4) : activityEvents;
  return <div className="space-y-0" data-testid="activity-list">{events.map((event, index) => <ActivityRow event={event} key={event.id} first={index === 0} />)}</div>;
}

function ActivityRow({ event, first }: { event: ActivityEvent; first: boolean }) {
  const Icon = event.type === 'warning' ? AlertTriangle : event.type === 'connect' ? Wifi : event.type === 'edit' ? SlidersHorizontal : Zap;
  const tone = event.type === 'warning' ? 'text-[#B17A26] bg-[#FFF1D7] dark:bg-[#4B361A] dark:text-[#F4C875]' : event.type === 'connect' ? 'text-[#6875C8] bg-[#E7E9FB] dark:bg-[#303565] dark:text-[#A8B2F4]' : 'text-[#19857B] bg-[#E0F4F1] dark:bg-[#1A4541] dark:text-[#7CE0D6]';
  return <div className={cx('relative flex gap-3.5 py-4', !first && 'border-t border-border')} data-testid={`activity-event-${event.id}`}>
    <div className={cx('z-10 flex size-8 shrink-0 items-center justify-center rounded-lg', tone)}><Icon size={14} /></div>
    <div className="min-w-0 flex-1"><div className="flex flex-wrap items-baseline justify-between gap-2"><p className="text-[12px] font-bold">{event.title}</p><span className="font-mono text-[9px] text-muted-foreground">{event.time}</span></div><p className="mt-1 truncate text-[11px] leading-relaxed text-muted-foreground">{event.detail}</p></div>
  </div>;
}

function CommandRow({ command, onSelect, selected = false }: { command: Command; onSelect: (id: string) => void; selected?: boolean }) {
  return <button onClick={() => onSelect(command.id)} className={cx('group flex w-full items-center gap-3 border-b border-border px-4 py-3.5 text-left transition-colors last:border-0 hover:bg-secondary/60', selected && 'bg-[#E6F4F1] dark:bg-[#183C39]')} data-testid={`command-row-${command.id}`}>
    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary font-mono text-[11px] font-medium text-muted-foreground transition-colors group-hover:bg-[#D8EDEA] group-hover:text-[#14766F] dark:group-hover:bg-[#204844] dark:group-hover:text-[#84E5D9]"><Terminal size={14} /></div>
    <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="font-mono text-[12px] font-medium">{command.name}</span><span className="hidden rounded bg-secondary px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground sm:inline">{command.category}</span></div><p className="mt-1 truncate text-[11px] text-muted-foreground">{command.description}</p></div>
    <div className="hidden items-center gap-1.5 sm:flex">{platforms.map((platform) => <span key={platform.id} className={cx('size-1.5 rounded-full', command.platforms[platform.id] === 'operational' ? 'bg-[#27B8B1]' : command.platforms[platform.id] === 'partial' ? 'bg-[#F6B745]' : 'bg-[#C9AAAA]')} title={`${platform.name}: ${statusCopy[command.platforms[platform.id]]}`} />)}</div>
    <StatusPill status={command.status} compact />
    <ChevronRight size={15} className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
  </button>;
}

function Inventory({ compact = false, onSelect, commandList }: { compact?: boolean; onSelect: (id: string) => void; commandList: Command[] }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<'All' | CommandCategory>('All');
  const [platformFilter, setPlatformFilter] = useState<'all' | PlatformId>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | CommandStatus>('all');
  const shown = useMemo(() => commandList.filter((command) => {
    const matchesText = `${command.name} ${command.description} ${command.category}`.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = category === 'All' || command.category === category;
    const matchesPlatform = platformFilter === 'all' || command.platforms[platformFilter] !== 'unsupported';
    const matchesStatus = statusFilter === 'all' || command.status === statusFilter;
    return matchesText && matchesCategory && matchesPlatform && matchesStatus;
  }).slice(0, compact ? 5 : commandList.length), [query, category, platformFilter, statusFilter, compact, commandList]);
  return <section className="panel-shadow overflow-hidden rounded-2xl border border-border bg-card" data-testid="section-command-inventory">
      <div className="border-b border-border p-5 md:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="font-mono text-[10px] uppercase tracking-[.14em] text-muted-foreground">Registry</div><h2 className="mt-1 text-[16px] font-extrabold tracking-[-.03em]">{compact ? 'Command inventory' : 'All commands'}</h2></div>{compact && <Link href="/commands" className="flex items-center gap-1 text-[11px] font-bold text-primary hover:underline" data-testid="link-view-all-commands">View full catalog <ArrowUpRight size={13} /></Link>}</div>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row"><label className="relative flex-1"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search commands or descriptions" className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-[11px] outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15" data-testid="input-command-search" /></label><div className="flex gap-1.5 overflow-x-auto">{(['All', 'Moderation', 'Utility', 'Messaging', 'Automation', 'Admin'] as const).map((item) => <button key={item} onClick={() => setCategory(item)} className={cx('whitespace-nowrap rounded-lg px-3 text-[10px] font-bold transition-colors', category === item ? 'bg-[#203346] text-[#B9F0E9] dark:bg-[#66DCD0] dark:text-[#172E3A]' : 'bg-secondary text-muted-foreground hover:text-foreground')} data-testid={`filter-category-${item.toLowerCase()}`}>{item}</button>)}</div></div>
      {!compact && <div className="mt-2 flex flex-wrap gap-2">
        <label className="flex items-center gap-2 rounded-lg border border-input bg-background px-2.5 py-2 font-mono text-[9px] uppercase tracking-wider text-muted-foreground"><span>Platform</span><select value={platformFilter} onChange={(event) => setPlatformFilter(event.target.value as 'all' | PlatformId)} className="bg-transparent text-[10px] font-bold normal-case tracking-normal text-foreground outline-none" data-testid="filter-platform"><option value="all">All surfaces</option>{platforms.map((platform) => <option value={platform.id} key={platform.id}>{platform.name}</option>)}</select></label>
        <label className="flex items-center gap-2 rounded-lg border border-input bg-background px-2.5 py-2 font-mono text-[9px] uppercase tracking-wider text-muted-foreground"><span>Status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'all' | CommandStatus)} className="bg-transparent text-[10px] font-bold normal-case tracking-normal text-foreground outline-none" data-testid="filter-status"><option value="all">All statuses</option><option value="operational">Operational</option><option value="partial">Partial coverage</option><option value="unsupported">Unsupported</option></select></label>
        <span className="ml-auto self-center font-mono text-[10px] text-muted-foreground">{shown.length} matches</span>
      </div>}
    </div>
     {shown.length > 0 ? <div>{shown.map((command) => <CommandRow command={command} onSelect={onSelect} key={command.id} />)}</div> : <EmptyResults onReset={() => { setQuery(''); setCategory('All'); setPlatformFilter('all'); setStatusFilter('all'); }} />}
  </section>;
}

function EmptyResults({ onReset }: { onReset: () => void }) {
  return <div className="flex flex-col items-center justify-center px-6 py-14 text-center" data-testid="empty-command-results"><div className="mb-3 flex size-11 items-center justify-center rounded-2xl bg-secondary text-muted-foreground"><Search size={18} /></div><p className="text-[13px] font-bold">No commands found</p><p className="mt-1 max-w-[250px] text-[11px] leading-relaxed text-muted-foreground">Try a different term or clear the category filter.</p><button onClick={onReset} className="mt-4 rounded-lg bg-secondary px-3 py-2 text-[10px] font-bold hover:bg-border" data-testid="button-reset-command-search">Clear filters</button></div>;
}

type NewCommandInput = {
  name: string;
  description: string;
  category: CommandCategory;
  targetPlatforms: PlatformId[];
  syntax: string;
};

function CommandComposer({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (input: NewCommandInput) => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CommandCategory>('Utility');
  const [targetPlatforms, setTargetPlatforms] = useState<PlatformId[]>(['telegram', 'facebook', 'discord']);
  const [syntax, setSyntax] = useState('');

  if (!open) return null;

  const togglePlatform = (id: PlatformId) => {
    setTargetPlatforms((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || !description.trim() || targetPlatforms.length === 0) return;
    onCreate({ name, description, category, targetPlatforms, syntax });
    setName('');
    setDescription('');
    setCategory('Utility');
    setTargetPlatforms(['telegram', 'facebook', 'discord']);
    setSyntax('');
    onClose();
  };

  return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#152033]/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="new-command-title" data-testid="dialog-new-command">
    <form onSubmit={submit} className="panel-shadow max-h-[92vh] w-full max-w-[560px] overflow-y-auto rounded-2xl border border-border bg-card p-5 md:p-7">
      <div className="flex items-start justify-between gap-4">
        <div><p className="font-mono text-[10px] uppercase tracking-[.14em] text-primary">Registry / create</p><h2 id="new-command-title" className="mt-1 text-[20px] font-extrabold tracking-[-.04em]">Add a new command</h2><p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">Define it once, then choose where Gioxbot should make it available.</p></div>
        <button type="button" onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label="Close new command form" data-testid="button-close-new-command"><X size={17} /></button>
      </div>
      <div className="mt-6 space-y-4">
        <label className="block text-[11px] font-bold">Command name<div className="mt-2 flex h-10 items-center rounded-lg border border-input bg-background focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15"><span className="pl-3 font-mono text-[12px] text-muted-foreground">/</span><input value={name.replace(/^\//, '')} onChange={(event) => setName(event.target.value)} placeholder="broadcast" className="min-w-0 flex-1 bg-transparent px-1.5 pr-3 text-[12px] outline-none" autoFocus data-testid="input-new-command-name" /></div></label>
        <label className="block text-[11px] font-bold">What does it do?<textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Describe the job this command should perform." className="mt-2 min-h-[80px] w-full resize-y rounded-lg border border-input bg-background px-3 py-2.5 text-[12px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" data-testid="input-new-command-description" /></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-[11px] font-bold">Category<select value={category} onChange={(event) => setCategory(event.target.value as CommandCategory)} className="mt-2 h-10 w-full rounded-lg border border-input bg-background px-3 text-[11px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" data-testid="select-new-command-category">{(['Moderation', 'Utility', 'Messaging', 'Automation', 'Admin'] as const).map((item) => <option value={item} key={item}>{item}</option>)}</select></label>
          <label className="block text-[11px] font-bold">Syntax <input value={syntax} onChange={(event) => setSyntax(event.target.value)} placeholder="/broadcast [message]" className="mt-2 h-10 w-full rounded-lg border border-input bg-background px-3 font-mono text-[11px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" data-testid="input-new-command-syntax" /></label>
        </div>
        <fieldset><legend className="text-[11px] font-bold">Apply to surfaces</legend><div className="mt-2 grid gap-2 sm:grid-cols-3">{platforms.map((platform) => { const selected = targetPlatforms.includes(platform.id); return <button type="button" key={platform.id} onClick={() => togglePlatform(platform.id)} className={cx('flex items-center gap-2 rounded-xl border p-3 text-left transition-colors', selected ? 'border-primary bg-[#E8F6F3] dark:bg-[#183C39]' : 'border-border bg-background hover:bg-secondary')} aria-pressed={selected} data-testid={`toggle-new-command-${platform.id}`}><PlatformMark id={platform.id} /><span className="min-w-0 flex-1 text-[10px] font-bold">{platform.name}</span>{selected && <Check size={14} className="text-primary" />}</button>; })}</div></fieldset>
      </div>
      <div className="mt-7 flex flex-col-reverse gap-2 border-t border-border pt-5 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} className="rounded-lg px-4 py-2.5 text-[11px] font-bold text-muted-foreground hover:bg-secondary hover:text-foreground" data-testid="button-cancel-new-command">Cancel</button><button type="submit" disabled={!name.trim() || !description.trim() || targetPlatforms.length === 0} className="rounded-lg bg-[#203346] px-4 py-2.5 text-[11px] font-bold text-[#C5F1EB] transition-colors hover:bg-[#29465D] disabled:cursor-not-allowed disabled:opacity-40 dark:bg-[#65D9CE] dark:text-[#172E3A]" data-testid="button-create-command"><Sparkles size={14} className="mr-1.5 inline" /> Create command</button></div>
    </form>
  </div>;
}

function OptionalBotsPanel({ modules, onToggle }: { modules: BotModule[]; onToggle: (id: string) => void }) {
  return <section className="panel-shadow rounded-2xl border border-border bg-card p-5 md:p-6" data-testid="section-optional-bots">
    <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-end"><div><p className="font-mono text-[10px] uppercase tracking-[.14em] text-primary">Optional bots</p><h3 className="mt-1 text-[16px] font-extrabold tracking-[-.03em]">Extend Gioxbot when you need it.</h3><p className="mt-1 max-w-xl text-[11px] leading-relaxed text-muted-foreground">Apply a bot module to add a focused workflow without changing your core command desk.</p></div><span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{modules.filter((module) => module.enabled).length} applied</span></div>
    <div className="grid gap-3 md:grid-cols-2">{modules.map((module) => { const platform = platforms.find((item) => item.id === module.platform); const waiting = module.status === 'needs-connection'; return <div key={module.id} className={cx('rounded-xl border p-4 transition-colors', module.enabled ? 'border-primary/50 bg-[#F0FAF8] dark:bg-[#183C39]' : 'border-border bg-background')} data-testid={`optional-bot-${module.id}`}>
      <div className="flex items-start gap-3"><PlatformMark id={module.platform} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h4 className="text-[12px] font-extrabold">{module.name}</h4><span className={cx('rounded-full px-2 py-1 font-mono text-[8px] uppercase tracking-wider', module.enabled ? 'bg-[#DDF3F0] text-[#167F77] dark:bg-[#204844] dark:text-[#7CE0D6]' : waiting ? 'bg-[#FFF1D7] text-[#986119] dark:bg-[#4B361A] dark:text-[#F4C875]' : 'bg-secondary text-muted-foreground')}>{module.enabled ? 'Applied' : waiting ? 'Connection needed' : 'Available'}</span></div><p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">{module.description}</p></div></div>
      <div className="mt-4 flex items-end justify-between gap-3"><div><p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{platform?.shortLabel} · {module.commandCount} commands</p><div className="mt-2 flex flex-wrap gap-1.5">{module.capabilities.map((capability) => <span key={capability} className="rounded-md bg-secondary px-2 py-1 text-[9px] text-muted-foreground">{capability}</span>)}</div></div><button onClick={() => onToggle(module.id)} className={cx('shrink-0 rounded-lg px-3 py-2 text-[10px] font-bold transition-colors', module.enabled ? 'border border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground' : 'bg-[#203346] text-[#C5F1EB] hover:bg-[#29465D] dark:bg-[#65D9CE] dark:text-[#172E3A]')} aria-pressed={module.enabled} data-testid={`button-apply-bot-${module.id}`}>{module.enabled ? 'Remove' : 'Apply bot'}</button></div>
    </div>; })}</div>
  </section>;
}

function CommandDetail({ command, onClose }: { command: Command; onClose: () => void }) {
  return <aside className="panel-shadow fixed inset-y-0 right-0 z-50 flex w-full max-w-[460px] flex-col border-l border-border bg-card shadow-2xl" data-testid="command-detail-panel">
    <div className="flex items-center justify-between border-b border-border px-5 py-4"><span className="font-mono text-[10px] uppercase tracking-[.14em] text-muted-foreground">Command detail</span><button onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label="Close command detail" data-testid="button-close-detail"><X size={17} /></button></div>
    <div className="flex-1 overflow-y-auto p-6"><div className="flex items-start justify-between gap-4"><div><div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-[#DDF3F0] text-[#167F77] dark:bg-[#1A4541] dark:text-[#7CE0D6]"><Terminal size={22} /></div><h2 className="font-mono text-[24px] font-medium tracking-[-.06em]">{command.name}</h2><p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">{command.description}</p></div><StatusPill status={command.status} /></div>
      <div className="mt-7 grid grid-cols-2 gap-2"><div className="rounded-xl bg-secondary/70 p-3"><div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Category</div><div className="mt-1 text-[12px] font-bold">{command.category}</div></div><div className="rounded-xl bg-secondary/70 p-3"><div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Usage</div><div className="mt-1 text-[12px] font-bold">{command.usage.toLocaleString()} calls</div></div></div>
      <div className="mt-6"><div className="mb-3 flex items-center justify-between"><h3 className="text-[12px] font-extrabold">Platform readiness</h3><span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">3 surfaces</span></div><div className="space-y-2">{platforms.map((platform) => <div className="flex items-center gap-3 rounded-xl border border-border p-3" key={platform.id}><PlatformMark id={platform.id} /><span className="flex-1 text-[11px] font-bold">{platform.name}</span><StatusPill status={command.platforms[platform.id]} compact /></div>)}</div></div>
      <div className="mt-6"><h3 className="mb-3 text-[12px] font-extrabold">Command syntax</h3><div className="flex items-center justify-between gap-3 rounded-xl bg-[#202D40] px-4 py-3 font-mono text-[11px] text-[#C6D2DF]"><code>{command.syntax}</code><button onClick={() => navigator.clipboard?.writeText(command.syntax)} className="text-[#7CDDD3] hover:text-white" aria-label="Copy command syntax" data-testid="button-copy-syntax"><Copy size={14} /></button></div></div>
      <div className="mt-6"><h3 className="mb-3 text-[12px] font-extrabold">Required permissions</h3><div className="flex flex-wrap gap-2">{command.permissions.map((permission) => <span className="rounded-lg border border-border bg-secondary/50 px-2.5 py-1.5 text-[10px] font-medium text-muted-foreground" key={permission}>{permission}</span>)}</div></div>
      <div className="mt-6"><h3 className="mb-3 text-[12px] font-extrabold">Response example</h3><div className="rounded-xl border-l-2 border-[#5DE0D2] bg-[#EAF6F4] p-4 text-[11px] leading-relaxed text-[#316962] dark:bg-[#183C39] dark:text-[#A5E2DA]">{command.responseExample}</div></div>
    </div>
    <div className="border-t border-border p-5"><button className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#203346] text-[11px] font-bold text-[#C5F1EB] transition-colors hover:bg-[#29465D] dark:bg-[#65D9CE] dark:text-[#172E3A] dark:hover:bg-[#8AE9E0]" onClick={() => alert(`Editing ${command.name} is available in the connected workspace.`)} data-testid="button-edit-command">Edit command <ArrowUpRight size={14} /></button></div>
  </aside>;
}

function OverviewPage({ commandList }: { commandList: Command[] }) {
  const [, navigate] = useLocation();
  const total = commandList.length;
  const operational = commandList.filter((command) => command.status === 'operational').length;
  const attention = commandList.filter((command) => command.status !== 'operational').length;
  const coverage = total ? Math.round((operational / total) * 100) : 0;
  const calls = commandList.reduce((sum, command) => sum + command.usage, 0);
  return <PageFrame title="Overview" eyebrow="Command control / Overview" commandCount={total}><div className="mx-auto max-w-[1240px] space-y-5">
    <div className="fade-up flex flex-col justify-between gap-3 pt-1 sm:flex-row sm:items-end"><div><p className="font-mono text-[10px] uppercase tracking-[.16em] text-primary">Good morning, Alex</p><h2 className="mt-2 text-[27px] font-extrabold tracking-[-.06em] md:text-[32px]">The desk is clear.</h2><p className="mt-1 text-[12px] text-muted-foreground">A quick read on your command surface across every connected channel.</p></div><div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 font-mono text-[10px] text-muted-foreground"><span className="size-1.5 rounded-full bg-[#27B8B1]" /> Registry synced 18m ago</div></div>
     <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Total commands" value={String(total)} detail={`across ${platforms.length} platforms`} icon={CommandIcon} tone="ink" /><StatCard label="Live coverage" value={`${coverage}%`} detail={`${operational} of ${total} operational`} icon={Gauge} tone="teal" /><StatCard label="Needs attention" value={String(attention).padStart(2, '0')} detail="partial or unsupported" icon={AlertTriangle} tone="amber" /><StatCard label="Calls this week" value={calls.toLocaleString()} detail="from the command registry" icon={Activity} tone="teal" /></div>
     <div className="grid gap-5 xl:grid-cols-[1.18fr_.82fr]"><PlatformCoverage commandList={commandList} /><section className="panel-shadow rounded-2xl border border-border bg-card p-5 md:p-6"><div className="mb-1 flex items-start justify-between"><div><div className="font-mono text-[10px] uppercase tracking-[.14em] text-muted-foreground">Signal feed</div><h2 className="mt-1 text-[16px] font-extrabold tracking-[-.03em]">Recent activity</h2></div><Link href="/activity" className="text-muted-foreground hover:text-foreground" aria-label="View all activity" data-testid="link-view-all-activity"><ArrowUpRight size={16} /></Link></div><ActivityList compact /></section></div>
     <Inventory compact commandList={commandList} onSelect={(id) => navigate(`/commands/${id}`)} />
  </div></PageFrame>;
}

function CommandsPage({ commandList, onCreateCommand }: { commandList: Command[]; onCreateCommand: (input: NewCommandInput) => void }) {
  const params = useParams<{ id?: string }>();
  const [, navigate] = useLocation();
  const [composerOpen, setComposerOpen] = useState(false);
  const selected = commandList.find((command) => command.id === params.id);
  return <PageFrame title="Commands" eyebrow="Command control / Registry" commandCount={commandList.length}><div className="mx-auto max-w-[1240px]"><div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="font-mono text-[10px] uppercase tracking-[.16em] text-primary">Registry / {commandList.length} definitions</p><p className="mt-2 max-w-xl text-[12px] leading-relaxed text-muted-foreground">Inspect every capability, see where it is live, and spot the gaps before your operators do.</p></div><button className="flex h-9 items-center justify-center gap-2 rounded-lg bg-[#203346] px-3 text-[11px] font-bold text-[#C5F1EB] hover:bg-[#29465D] dark:bg-[#65D9CE] dark:text-[#172E3A]" onClick={() => setComposerOpen(true)} data-testid="button-new-command"><Sparkles size={14} /> New command</button></div><Inventory commandList={commandList} onSelect={(id) => navigate(`/commands/${id}`)} />{selected && <CommandDetail command={selected} onClose={() => navigate('/commands')} />}<CommandComposer open={composerOpen} onClose={() => setComposerOpen(false)} onCreate={onCreateCommand} /></div></PageFrame>;
}

function ChannelsPage({ commandList }: { commandList: Command[] }) {
  return <PageFrame title="Channels" eyebrow="Command control / Coverage" commandCount={commandList.length}><div className="mx-auto max-w-[1240px] space-y-5"><div className="fade-up mb-7"><p className="font-mono text-[10px] uppercase tracking-[.16em] text-primary">Coverage matrix</p><h2 className="mt-2 text-[27px] font-extrabold tracking-[-.06em]">Three surfaces, one view.</h2><p className="mt-1 max-w-xl text-[12px] text-muted-foreground">Capability parity is a moving target. This is the honest version of what Gioxbot can do today.</p></div><div className="grid gap-4 md:grid-cols-3">{platforms.map((platform) => { const supported = commandList.filter((command) => command.platforms[platform.id] !== 'unsupported').length; const coverage = commandList.length ? Math.round((supported / commandList.length) * 100) : 0; return <div className="panel-shadow rounded-2xl border border-border bg-card p-5 transition-transform hover:-translate-y-0.5" key={platform.id} data-testid={`channel-card-${platform.id}`}><div className="flex items-start justify-between"><PlatformMark id={platform.id} size="lg" /><span className={cx('rounded-full px-2 py-1 font-mono text-[9px] uppercase tracking-wider', platform.status === 'connected' ? 'bg-[#E1F5F1] text-[#14766F] dark:bg-[#17443F] dark:text-[#7CE0D6]' : 'bg-[#FFF1D7] text-[#986119] dark:bg-[#4B361A] dark:text-[#F4C875]')}>{platform.status === 'connected' ? 'Connected' : 'Attention'}</span></div><h3 className="mt-5 text-[16px] font-extrabold">{platform.name}</h3><p className="mt-1 text-[11px] text-muted-foreground">{platform.description}</p><div className="mt-6 border-t border-border pt-4"><div className="mb-2 flex justify-between"><span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Coverage</span><span className="font-mono text-[10px] font-medium">{supported} / {commandList.length}</span></div><div className="h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full" style={{ width: `${coverage}%`, backgroundColor: platform.accent }} /></div></div><Link href="/commands" className="mt-5 flex items-center gap-1 text-[11px] font-bold text-primary hover:underline" data-testid={`link-inspect-${platform.id}`}>Inspect commands <ChevronRight size={13} /></Link></div>; })}</div><section className="panel-shadow overflow-hidden rounded-2xl border border-border bg-card"><div className="border-b border-border p-5"><div className="font-mono text-[10px] uppercase tracking-[.14em] text-muted-foreground">Parity matrix</div><h2 className="mt-1 text-[16px] font-extrabold">Command availability by platform</h2></div><div className="overflow-x-auto"><table className="w-full min-w-[670px] text-left"><thead className="bg-secondary/55 font-mono text-[9px] uppercase tracking-[.12em] text-muted-foreground"><tr><th className="px-5 py-3 font-medium">Command</th><th className="px-4 py-3 font-medium">Category</th>{platforms.map((platform) => <th className="px-4 py-3 font-medium" key={platform.id}>{platform.shortLabel}</th>)}</tr></thead><tbody>{commandList.map((command) => <tr className="border-t border-border transition-colors hover:bg-secondary/35" key={command.id}><td className="px-5 py-3 font-mono text-[11px] font-medium">{command.name}</td><td className="px-4 py-3 text-[10px] text-muted-foreground">{command.category}</td>{platforms.map((platform) => <td className="px-4 py-3" key={platform.id}><StatusPill status={command.platforms[platform.id]} compact /></td>)}</tr>)}</tbody></table></div></section></div></PageFrame>;
}

function MessengerPage({ conversations, rules, botEnabled, onConversationsChange, onRulesChange, onBotEnabledChange }: { conversations: MessengerConversation[]; rules: MessengerBotRule[]; botEnabled: boolean; onConversationsChange: (next: MessengerConversation[]) => void; onRulesChange: (next: MessengerBotRule[]) => void; onBotEnabledChange: (next: boolean) => void }) {
  return <PageFrame title="Messenger" eyebrow="Command control / Bot builder"><div className="mx-auto max-w-[1500px]"><div className="fade-up mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="font-mono text-[10px] uppercase tracking-[.16em] text-primary">Bot builder / Facebook Page preview</p><h2 className="mt-2 text-[27px] font-extrabold tracking-[-.06em]">Build, test, and tune your Messenger bot.</h2><p className="mt-1 max-w-2xl text-[12px] text-muted-foreground">Use simulated customer messages to test keyword replies before connecting a live Facebook Page.</p></div><Link href="/create-bot" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#203346] px-3.5 text-[11px] font-bold text-[#C5F1EB] transition-transform hover:-translate-y-0.5 hover:bg-[#29465D] dark:bg-[#65D9CE] dark:text-[#172E3A]" data-testid="link-create-bot"><Bot size={15} /> Create new bot</Link></div><MessengerWorkspace initialConversations={conversations} initialRules={rules} initialBotEnabled={botEnabled} onConversationsChange={onConversationsChange} onRulesChange={onRulesChange} onBotEnabledChange={onBotEnabledChange} /></div></PageFrame>;
}

type BotPlatform = 'discord' | 'telegram' | 'facebook-page' | 'facebook-messenger';

const botPlatformOptions: Array<{ id: BotPlatform; label: string; detail: string; accent: string }> = [
  { id: 'discord', label: 'Discord', detail: 'Gateway bot', accent: '#8C78E8' },
  { id: 'telegram', label: 'Telegram', detail: 'Bot API', accent: '#27B8B1' },
  { id: 'facebook-page', label: 'Facebook Page', detail: 'Page messaging', accent: '#5976D9' },
  { id: 'facebook-messenger', label: 'Facebook Messenger', detail: 'Messenger bot', accent: '#5976D9' },
];

function CreateBotPage() {
  const [, navigate] = useLocation();
  const [selectedPlatform, setSelectedPlatform] = useState<BotPlatform | ''>('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [verified, setVerified] = useState(false);
  const selected = botPlatformOptions.find((platform) => platform.id === selectedPlatform);

  const selectPlatform = (id: BotPlatform) => {
    setSelectedPlatform(id);
    setVerified(false);
    setDropdownOpen(false);
  };

  return <PageFrame title="Create bot" eyebrow="Command control / Bot builder"><div className="mx-auto max-w-[980px]"><div className="bot-setup-surface -mx-5 min-h-[calc(100dvh-132px)] px-5 py-7 md:-mx-9 md:px-9 md:py-12"><div className="mx-auto max-w-[720px]"><div className="fade-up mb-8"><p className="font-mono text-[10px] uppercase tracking-[.16em] text-[#3F6BAA]">Bot builder / Setup</p><h2 className="mt-2 text-[30px] font-extrabold tracking-[-.06em] text-[#101827] md:text-[36px]">Create New Bot</h2><p className="mt-2 max-w-xl text-[14px] leading-relaxed text-[#3E4C60]">Set up your bot in three steps. Each field is verified before you proceed.</p></div><section className="rounded-[22px] border border-[#C9D3DE] bg-white p-5 shadow-[0_12px_30px_rgba(40,56,73,.12)] md:p-8" data-testid="create-bot-flow"><div className="flex items-center gap-3 md:gap-5"><div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#4674C8] text-white shadow-[0_0_0_4px_#E5EDF9]"><Check size={21} strokeWidth={3} /></div><div className="h-1 flex-1 rounded-full bg-[#9BBBEA]" /><div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#4674C8] font-mono text-[14px] font-bold text-white shadow-[0_0_0_4px_#E5EDF9]">2</div><div className="h-1 flex-1 rounded-full bg-[#D7DADD]" /><div className="flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-[#E3E5E8] font-mono text-[14px] text-[#A8ADB5]">3</div></div><div className="mt-4 grid grid-cols-3 items-center text-center text-[12px] text-[#7F8792]"><span>Step 1 of 3</span><span className="font-bold text-[#111827]">Platform</span><span>Step 3</span></div></section><section className="mt-6 rounded-[22px] border border-[#C9D3DE] bg-white p-5 shadow-[0_12px_30px_rgba(40,56,73,.12)] md:p-8" data-testid="create-bot-platform-card"><div className="relative"><button type="button" onClick={() => setDropdownOpen((open) => !open)} className={cx('flex h-14 w-full items-center justify-between rounded-xl border-2 bg-[#F8FAFC] px-4 text-left transition-colors focus:outline-none', dropdownOpen ? 'border-[#4674C8] ring-4 ring-[#4674C8]/10' : 'border-[#4674C8]')} aria-expanded={dropdownOpen} aria-haspopup="listbox" data-testid="button-select-bot-platform"><span className={cx('text-[16px] font-medium', selected ? 'text-[#1E293B]' : 'text-[#45556B]')}>{selected?.label ?? 'Select a platform'}</span><ChevronDown size={21} className={cx('text-[#111827] transition-transform', dropdownOpen && 'rotate-180')} /></button>{dropdownOpen && <div className="absolute inset-x-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-xl border border-[#AEB8C5] bg-white shadow-[0_12px_28px_rgba(30,43,60,.22)]" role="listbox" aria-label="Bot platforms" data-testid="menu-bot-platforms">{botPlatformOptions.map((platform) => <button type="button" role="option" aria-selected={selectedPlatform === platform.id} key={platform.id} onClick={() => selectPlatform(platform.id)} className={cx('flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[#EEF4FC]', selectedPlatform === platform.id && 'bg-[#EEF4FC]')} data-testid={`option-bot-platform-${platform.id}`}><span className="size-2.5 rounded-full" style={{ backgroundColor: platform.accent }} /><span className="flex-1"><span className="block text-[15px] font-medium text-[#141A24]">{platform.label}</span><span className="mt-0.5 block font-mono text-[9px] uppercase tracking-wider text-[#7F8B9B]">{platform.detail}</span></span>{selectedPlatform === platform.id && <Check size={16} className="text-[#4674C8]" />}</button>)}</div>}</div>{verified && <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#B9DFD4] bg-[#EAF8F4] px-3.5 py-3 text-[11px] font-bold text-[#176B62]" role="status" data-testid="status-bot-platform-verified"><Check size={15} /> {selected?.label} is ready for bot setup.</div>}<div className="mt-10 flex items-center justify-between gap-4"><button type="button" onClick={() => navigate('/messenger')} className="rounded-lg px-2 py-2 text-[14px] font-bold text-[#111827] transition-colors hover:bg-[#F0F2F5]" data-testid="button-back-create-bot">Back</button><button type="button" disabled={!selectedPlatform} onClick={() => setVerified(true)} className="rounded-xl bg-[#AEC2E8] px-8 py-3.5 text-[14px] font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-[#94ADDC] disabled:cursor-not-allowed disabled:opacity-60" data-testid="button-verify-bot-platform">{verified ? 'Verified' : 'Verify'}</button></div></section></div></div></div></PageFrame>;
}

function ActivityPage() {
  const [filter, setFilter] = useState<'all' | 'warning' | 'deploy'>('all');
  const shown = filter === 'all' ? activityEvents : activityEvents.filter((event) => event.type === filter);
  return <PageFrame title="Activity" eyebrow="Command control / Signal feed"><div className="mx-auto max-w-[920px]"><div className="fade-up mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="font-mono text-[10px] uppercase tracking-[.16em] text-primary">Operational timeline</p><h2 className="mt-2 text-[27px] font-extrabold tracking-[-.06em]">What changed recently.</h2></div><div className="flex gap-1.5 rounded-xl border border-border bg-card p-1">{(['all', 'deploy', 'warning'] as const).map((item) => <button onClick={() => setFilter(item)} className={cx('rounded-lg px-3 py-2 font-mono text-[9px] uppercase tracking-wider transition-colors', filter === item ? 'bg-[#203346] text-[#C5F1EB] dark:bg-[#65D9CE] dark:text-[#172E3A]' : 'text-muted-foreground hover:text-foreground')} key={item} data-testid={`filter-activity-${item}`}>{item === 'all' ? 'Everything' : item}</button>)}</div></div><section className="panel-shadow rounded-2xl border border-border bg-card px-5 md:px-7"><div className="border-b border-border py-5"><span className="font-mono text-[10px] uppercase tracking-[.14em] text-muted-foreground">{shown.length} events · last 30 days</span></div>{shown.length ? <ActivityList /> : <div className="py-16 text-center"><CircleHelp className="mx-auto mb-3 text-muted-foreground" size={22} /><p className="text-[13px] font-bold">No matching events</p></div>}</section></div></PageFrame>;
}

 function SettingsPage({ modules, onToggleModule }: { modules: BotModule[]; onToggleModule: (id: string) => void }) {
  const [saved, setSaved] = useState(false);
  const [compact, setCompact] = useState(false);
  return <PageFrame title="Settings" eyebrow="Command control / Workspace"><div className="mx-auto max-w-[920px]"><div className="fade-up mb-7"><p className="font-mono text-[10px] uppercase tracking-[.16em] text-primary">Workspace preferences</p><h2 className="mt-2 text-[27px] font-extrabold tracking-[-.06em]">Keep the desk yours.</h2><p className="mt-1 text-[12px] text-muted-foreground">Small choices that shape how operators read and maintain the command surface.</p></div><div className="space-y-5"><section className="panel-shadow rounded-2xl border border-border bg-card p-5 md:p-6"><div className="mb-5"><h3 className="text-[14px] font-extrabold">Workspace identity</h3><p className="mt-1 text-[11px] text-muted-foreground">The name operators see in the command desk.</p></div><label className="block text-[11px] font-bold">Workspace name<input defaultValue="Gioxbot Operations" className="mt-2 h-10 w-full rounded-lg border border-input bg-background px-3 text-[12px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" data-testid="input-workspace-name" /></label></section><section className="panel-shadow rounded-2xl border border-border bg-card p-5 md:p-6"><div className="mb-5"><h3 className="text-[14px] font-extrabold">Connected channels</h3><p className="mt-1 text-[11px] text-muted-foreground">Facebook Page connection is pending; Messenger delivery activates after connection.</p></div><div className="space-y-2">{platforms.map((platform) => <div className="flex items-center gap-3 rounded-xl border border-border p-3" key={platform.id}><PlatformMark id={platform.id} /><div className="flex-1"><div className="text-[11px] font-bold">{platform.name}</div><div className="mt-0.5 font-mono text-[9px] text-muted-foreground">{platform.description}</div></div><span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-[#167F77] dark:text-[#7CE0D6]"><span className="size-1.5 rounded-full bg-current" />{platform.status}</span><button className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label={`Open ${platform.name} settings`} data-testid={`button-channel-settings-${platform.id}`}><SlidersHorizontal size={14} /></button></div>)}</div></section><OptionalBotsPanel modules={modules} onToggle={onToggleModule} /><section className="panel-shadow rounded-2xl border border-border bg-card p-5 md:p-6"><div className="mb-5"><h3 className="text-[14px] font-extrabold">Desk behavior</h3><p className="mt-1 text-[11px] text-muted-foreground">Tune the density of your daily command view.</p></div><div className="flex items-center justify-between gap-4"><div><div className="text-[11px] font-bold">Compact inventory rows</div><div className="mt-1 text-[10px] text-muted-foreground">Show more commands without scrolling.</div></div><button onClick={() => setCompact(!compact)} className={cx('relative h-6 w-11 rounded-full transition-colors', compact ? 'bg-primary' : 'bg-secondary')} aria-label="Toggle compact inventory rows" data-testid="switch-compact-rows"><span className={cx('absolute top-1 size-4 rounded-full bg-card shadow-sm transition-transform', compact ? 'translate-x-6' : 'translate-x-1')} /></button></div></section><div className="flex items-center justify-end gap-3"><span className={cx('font-mono text-[10px] text-primary transition-opacity', saved ? 'opacity-100' : 'opacity-0')}>Preferences saved</span><button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2200); }} className="rounded-lg bg-[#203346] px-4 py-2.5 text-[11px] font-bold text-[#C5F1EB] hover:bg-[#29465D] dark:bg-[#65D9CE] dark:text-[#172E3A]" data-testid="button-save-settings"><Check size={14} className="mr-1.5 inline" /> Save preferences</button></div></div></div></PageFrame>;
}

function PageFrame({ title, eyebrow, children, commandCount = commands.length }: { title: string; eyebrow: string; children: ReactNode; commandCount?: number }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return <div className="noise flex min-h-[100dvh] bg-background"><Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} commandCount={commandCount} /><div className="flex min-w-0 flex-1 flex-col"><Header title={title} eyebrow={eyebrow} onMenu={() => setSidebarOpen(true)} /><main className="shell-grid flex-1 px-5 py-7 md:px-9 md:py-9">{children}</main></div></div>;
}

function NotFoundPage() {
  return <PageFrame title="Not found" eyebrow="Command control / 404"><div className="flex min-h-[60vh] items-center justify-center"><div className="text-center"><div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-secondary text-muted-foreground"><CircleHelp size={24} /></div><h2 className="text-2xl font-extrabold">That surface does not exist.</h2><p className="mt-2 text-sm text-muted-foreground">Return to the overview to pick up where you left off.</p><Link href="/" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#203346] px-4 py-2.5 text-[11px] font-bold text-[#C5F1EB] dark:bg-[#65D9CE] dark:text-[#172E3A]" data-testid="link-return-overview">Return to overview <ArrowUpRight size={14} /></Link></div></div></PageFrame>;
}

function Router({ commandList, onCreateCommand, modules, onToggleModule, messengerConversations, messengerRules, messengerBotEnabled, onMessengerConversationsChange, onMessengerRulesChange, onMessengerBotEnabledChange }: { commandList: Command[]; onCreateCommand: (input: NewCommandInput) => void; modules: BotModule[]; onToggleModule: (id: string) => void; messengerConversations: MessengerConversation[]; messengerRules: MessengerBotRule[]; messengerBotEnabled: boolean; onMessengerConversationsChange: (next: MessengerConversation[]) => void; onMessengerRulesChange: (next: MessengerBotRule[]) => void; onMessengerBotEnabledChange: (next: boolean) => void }) {
  return <Switch><Route path="/" component={() => <OverviewPage commandList={commandList} />} /><Route path="/commands/:id" component={() => <CommandsPage commandList={commandList} onCreateCommand={onCreateCommand} />} /><Route path="/commands" component={() => <CommandsPage commandList={commandList} onCreateCommand={onCreateCommand} />} /><Route path="/messenger" component={() => <MessengerPage conversations={messengerConversations} rules={messengerRules} botEnabled={messengerBotEnabled} onConversationsChange={onMessengerConversationsChange} onRulesChange={onMessengerRulesChange} onBotEnabledChange={onMessengerBotEnabledChange} />} /><Route path="/create-bot" component={CreateBotPage} /><Route path="/channels" component={() => <ChannelsPage commandList={commandList} />} /><Route path="/activity" component={ActivityPage} /><Route path="/settings" component={() => <SettingsPage modules={modules} onToggleModule={onToggleModule} />} /><Route component={NotFoundPage} /></Switch>;
}

function App() {
  const [commandList, setCommandList] = useLocalStorageState<Command[]>('gioxbot-commands', commands);
  const [modules, setModules] = useLocalStorageState<BotModule[]>('gioxbot-bot-modules', optionalBots);
  const [messengerConversations, setMessengerConversations] = useLocalStorageState<MessengerConversation[]>('gioxbot-messenger-conversations', initialMessengerConversations);
  const [messengerRules, setMessengerRules] = useLocalStorageState<MessengerBotRule[]>('gioxbot-messenger-rules', initialMessengerBotRules);
  const [messengerBotEnabled, setMessengerBotEnabled] = useLocalStorageState<boolean>('gioxbot-messenger-bot-enabled', false);

  const createCommand = (input: NewCommandInput) => {
    const commandName = input.name.trim().startsWith('/') ? input.name.trim() : `/${input.name.trim()}`;
    const slug = commandName.slice(1).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '') || 'new-command';
    const supportedPlatforms = new Set(input.targetPlatforms);
    const newCommand: Command = {
      id: `${slug}-${Date.now()}`,
      name: commandName,
      description: input.description.trim(),
      category: input.category,
      platforms: {
        telegram: supportedPlatforms.has('telegram') ? 'operational' : 'unsupported',
        facebook: supportedPlatforms.has('facebook') ? 'operational' : 'unsupported',
        discord: supportedPlatforms.has('discord') ? 'operational' : 'unsupported',
      },
      status: input.targetPlatforms.length === platforms.length ? 'operational' : 'partial',
      usage: 0,
      updatedAt: 'Just now',
      risk: 'low',
      syntax: input.syntax.trim() || commandName,
      permissions: ['Read messages'],
      responseExample: `${commandName} is ready on ${input.targetPlatforms.map((platform) => platforms.find((item) => item.id === platform)?.shortLabel).join(', ')}.`,
    };
    setCommandList((current) => [newCommand, ...current]);
  };

  const toggleModule = (id: string) => {
    setModules((current) => current.map((module) => module.id === id ? { ...module, enabled: !module.enabled } : module));
  };

  return <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router commandList={commandList} onCreateCommand={createCommand} modules={modules} onToggleModule={toggleModule} messengerConversations={messengerConversations} messengerRules={messengerRules} messengerBotEnabled={messengerBotEnabled} onMessengerConversationsChange={setMessengerConversations} onMessengerRulesChange={setMessengerRules} onMessengerBotEnabledChange={setMessengerBotEnabled} /></WouterRouter>;
}

export default App;