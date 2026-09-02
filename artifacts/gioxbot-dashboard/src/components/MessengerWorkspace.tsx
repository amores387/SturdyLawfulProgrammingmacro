import { useMemo, useRef, useState, type FormEvent } from 'react';
import {
  AlertTriangle,
  Bot,
  Check,
  CheckCheck,
  ChevronLeft,
  Circle,
  Clock3,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Power,
  RefreshCcw,
  Search,
  Send,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  UserRound,
  X,
  Zap,
} from 'lucide-react';
import { initialMessengerBotRules, initialMessengerConversations } from '@/lib/messenger-data';
import type {
  MessengerBotRule,
  MessengerConversation,
  MessengerConversationStatus,
  MessengerMessage,
  MessengerMessageAuthor,
} from '@/lib/messenger-data';

type MessengerWorkspaceProps = {
  initialConversations?: MessengerConversation[];
  initialRules?: MessengerBotRule[];
  initialBotEnabled?: boolean;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onConversationsChange?: (conversations: MessengerConversation[]) => void;
  onRulesChange?: (rules: MessengerBotRule[]) => void;
  onBotEnabledChange?: (enabled: boolean) => void;
};

type ComposeMode = 'operator' | 'customer';

const authorLabels: Record<MessengerMessageAuthor, string> = {
  customer: 'Customer',
  operator: 'Alex Morgan',
  bot: 'Gioxbot',
};

const statusLabels: Record<MessengerConversationStatus, string> = {
  open: 'Open',
  waiting: 'Waiting',
  resolved: 'Resolved',
};

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(' ');
}

function initialsTone(id: string) {
  const tones = [
    'bg-[#244B52] text-[#8DE7D9]',
    'bg-[#493C34] text-[#F4C875]',
    'bg-[#374665] text-[#B9C5F7]',
    'bg-[#4B394D] text-[#E0B5D7]',
  ];
  return tones[id.length % tones.length];
}

function StatusDot({ status }: { status: MessengerConversationStatus }) {
  return (
    <span
      className={cx(
        'size-1.5 rounded-full',
        status === 'open' && 'bg-[#78E2D3]',
        status === 'waiting' && 'bg-[#F4B942]',
        status === 'resolved' && 'bg-[#7C8998]',
      )}
      title={statusLabels[status]}
    />
  );
}

function LoadingWorkspace() {
  return (
    <section className="min-h-[680px] animate-pulse rounded-[22px] border border-[#31455B] bg-[#172536] p-4 md:p-6" data-testid="messenger-loading">
      <div className="h-10 w-64 rounded-lg bg-[#223449]" />
      <div className="mt-5 grid min-h-[570px] gap-3 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)_320px]">
        <div className="rounded-2xl bg-[#1E3044]" />
        <div className="rounded-2xl bg-[#1E3044]" />
        <div className="rounded-2xl bg-[#1E3044]" />
      </div>
    </section>
  );
}

function ErrorWorkspace({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <section className="flex min-h-[360px] flex-col items-center justify-center rounded-[22px] border border-[#5B4548] bg-[#241F2B] p-8 text-center text-[#E8EFF2]" data-testid="messenger-error">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-[#55363B] text-[#F4B2A8]"><AlertTriangle size={21} /></div>
      <p className="mt-4 text-[14px] font-extrabold">Messenger link needs attention</p>
      <p className="mt-2 max-w-sm text-[11px] leading-relaxed text-[#AEBAC6]">{message}</p>
      {onRetry && <button onClick={onRetry} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#F4B942] px-3.5 py-2.5 text-[10px] font-extrabold text-[#2B2C2B] transition-transform hover:-translate-y-0.5" data-testid="button-retry-messenger"><RefreshCcw size={13} /> Retry connection</button>}
    </section>
  );
}

function EmptyConversations() {
  return (
    <div className="flex min-h-[440px] flex-col items-center justify-center px-6 text-center" data-testid="messenger-empty-conversations">
      <div className="flex size-12 items-center justify-center rounded-2xl border border-[#385267] bg-[#24384B] text-[#78E2D3]"><MessageCircle size={20} /></div>
      <p className="mt-4 text-[13px] font-extrabold text-[#E6EFF2]">No conversations in the queue</p>
      <p className="mt-2 max-w-[240px] text-[11px] leading-relaxed text-[#8D9EAE]">New Facebook Page messages will appear here when the channel is connected.</p>
    </div>
  );
}

function Avatar({ conversation, small = false }: { conversation: MessengerConversation; small?: boolean }) {
  return <div className={cx('flex shrink-0 items-center justify-center rounded-xl font-mono font-medium', small ? 'size-8 text-[9px]' : 'size-9 text-[10px]', initialsTone(conversation.id))} data-testid={`avatar-conversation-${conversation.id}`}>{conversation.initials}</div>;
}

function ConversationRow({ conversation, selected, onSelect }: { conversation: MessengerConversation; selected: boolean; onSelect: () => void }) {
  return (
    <button onClick={onSelect} className={cx('group flex w-full items-start gap-3 border-b border-[#2B3E52] px-3.5 py-3.5 text-left transition-colors last:border-b-0 hover:bg-[#263C51]', selected && 'bg-[#263F4F] shadow-[inset_3px_0_0_#78E2D3]')} data-testid={`button-conversation-${conversation.id}`}>
      <Avatar conversation={conversation} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className={cx('truncate text-[11px] font-extrabold', selected ? 'text-[#F1F8F7]' : 'text-[#DCE7EC]')}>{conversation.customerName}</span>
          <span className="shrink-0 font-mono text-[9px] text-[#7F93A5]">{conversation.lastMessageAt}</span>
        </span>
        <span className="mt-1 flex items-center gap-1.5">
          <StatusDot status={conversation.status} />
          <span className="truncate text-[10px] text-[#90A1B1]">{conversation.lastMessage}</span>
        </span>
      </span>
      {conversation.unread > 0 && <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-[#F4B942] font-mono text-[9px] font-bold text-[#242C32]" data-testid={`badge-unread-${conversation.id}`}>{conversation.unread}</span>}
    </button>
  );
}

function InboxPanel({ conversations, selectedId, onSelect }: { conversations: MessengerConversation[]; selectedId?: string; onSelect: (id: string) => void }) {
  const [query, setQuery] = useState('');
  const shown = useMemo(() => conversations.filter((conversation) => `${conversation.customerName} ${conversation.customerHandle} ${conversation.lastMessage}`.toLowerCase().includes(query.toLowerCase())), [conversations, query]);

  return (
    <section className="min-h-[520px] overflow-hidden rounded-2xl border border-[#2F4458] bg-[#1D3043]" data-testid="panel-messenger-inbox">
      <div className="border-b border-[#2F4458] p-4">
        <div className="flex items-center justify-between">
          <div><p className="font-mono text-[9px] uppercase tracking-[.18em] text-[#78E2D3]">Queue / inbound</p><h2 className="mt-1 text-[14px] font-extrabold text-[#EDF5F5]">Conversations</h2></div>
          <span className="rounded-full bg-[#263E51] px-2 py-1 font-mono text-[9px] text-[#9CAEBB]" data-testid="text-conversation-count">{conversations.length.toString().padStart(2, '0')}</span>
        </div>
        <label className="relative mt-4 block">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#718699]" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search people or messages" className="h-9 w-full rounded-lg border border-[#385267] bg-[#172536] pl-9 pr-3 text-[10px] text-[#E6EFF2] outline-none transition-colors placeholder:text-[#718699] focus:border-[#78E2D3] focus:ring-2 focus:ring-[#78E2D3]/15" data-testid="input-search-conversations" />
        </label>
      </div>
      <div className="max-h-[630px] overflow-y-auto">
        {shown.length > 0 ? shown.map((conversation) => <ConversationRow key={conversation.id} conversation={conversation} selected={conversation.id === selectedId} onSelect={() => onSelect(conversation.id)} />) : (
          <div className="px-5 py-12 text-center" data-testid="empty-filtered-conversations"><Search size={17} className="mx-auto text-[#718699]" /><p className="mt-3 text-[11px] font-bold text-[#DCE7EC]">No matching threads</p><p className="mt-1 text-[10px] text-[#8295A6]">Try the customer name or a phrase from the message.</p></div>
        )}
      </div>
    </section>
  );
}

function MessageBubble({ message }: { message: MessengerMessage }) {
  const isCustomer = message.author === 'customer';
  const isBot = message.author === 'bot';
  return (
    <div className={cx('flex gap-2.5', isCustomer ? 'justify-start' : 'justify-end')} data-testid={`message-${message.id}`}>
      {isCustomer && <div className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-lg bg-[#30475A] text-[#9CB2BF]"><UserRound size={12} /></div>}
      <div className={cx('max-w-[78%]', isCustomer ? 'items-start' : 'items-end')}>
        <div className={cx('mb-1 flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[.08em] text-[#72889A]', !isCustomer && 'justify-end')}><span>{authorLabels[message.author]}</span>{isBot && <Zap size={10} className="text-[#F4B942]" />}</div>
        <div className={cx('rounded-2xl px-3.5 py-2.5 text-[11px] leading-relaxed', isCustomer ? 'rounded-tl-md border border-[#385267] bg-[#263B4E] text-[#DEE9ED]' : isBot ? 'rounded-tr-md border border-[#55766F] bg-[#294A48] text-[#E4F5F1]' : 'rounded-tr-md bg-[#E9B449] text-[#273039]')}>
          {message.text}
        </div>
        <div className={cx('mt-1 flex items-center gap-1.5 font-mono text-[8px] text-[#718699]', !isCustomer && 'justify-end')}><span>{message.sentAt}</span>{!isCustomer && (message.status === 'delivered' ? <CheckCheck size={11} className="text-[#78E2D3]" /> : message.status === 'sent' ? <Check size={11} /> : <AlertTriangle size={10} className="text-[#F4B2A8]" />)}</div>
      </div>
    </div>
  );
}

function ChatPanel({ conversation, botEnabled, rules, onSend, onBack }: { conversation?: MessengerConversation; botEnabled: boolean; rules: MessengerBotRule[]; onSend: (text: string, mode: ComposeMode) => void; onBack: () => void }) {
  const [text, setText] = useState('');
  const [mode, setMode] = useState<ComposeMode>('operator');

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!text.trim() || !conversation) return;
    onSend(text.trim(), mode);
    setText('');
  };

  if (!conversation) {
    return <section className="flex min-h-[520px] items-center justify-center rounded-2xl border border-[#2F4458] bg-[#1D3043] p-6 text-center" data-testid="panel-empty-chat"><div><div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[#263E51] text-[#78E2D3]"><MessageCircle size={20} /></div><p className="mt-4 text-[13px] font-extrabold text-[#E7F0F2]">Select a conversation</p><p className="mt-1 text-[11px] text-[#8295A6]">Choose a thread from the inbound queue to inspect messages.</p></div></section>;
  }

  return (
    <section className="flex min-h-[520px] flex-col overflow-hidden rounded-2xl border border-[#2F4458] bg-[#1A2C3F]" data-testid={`panel-chat-${conversation.id}`}>
      <div className="flex items-center gap-3 border-b border-[#2F4458] bg-[#1D3043] px-4 py-3.5">
        <button onClick={onBack} className="rounded-lg p-1.5 text-[#8EA0AF] transition-colors hover:bg-[#294157] hover:text-[#E8F1F3] lg:hidden" aria-label="Back to conversations" data-testid="button-back-to-inbox"><ChevronLeft size={17} /></button>
        <Avatar conversation={conversation} small />
        <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h2 className="truncate text-[12px] font-extrabold text-[#EEF6F5]">{conversation.customerName}</h2><span className="flex items-center gap-1.5 rounded-full bg-[#263E51] px-2 py-1 font-mono text-[8px] uppercase tracking-wider text-[#A6B5BE]"><StatusDot status={conversation.status} />{statusLabels[conversation.status]}</span></div><p className="mt-0.5 truncate font-mono text-[9px] text-[#758B9C]">{conversation.customerHandle} · Facebook Page</p></div>
        <button className="rounded-lg p-2 text-[#8EA0AF] transition-colors hover:bg-[#294157] hover:text-[#E8F1F3]" aria-label="Conversation actions" data-testid="button-conversation-actions"><MoreHorizontal size={16} /></button>
      </div>
      <div className="relative flex-1 space-y-5 overflow-y-auto px-4 py-5 md:px-6" style={{ backgroundImage: 'linear-gradient(rgba(120,226,211,.025) 1px, transparent 1px), linear-gradient(90deg, rgba(120,226,211,.025) 1px, transparent 1px)', backgroundSize: '28px 28px' }}>
        <div className="flex items-center justify-center gap-2"><span className="h-px w-10 bg-[#304559]" /><span className="font-mono text-[8px] uppercase tracking-[.15em] text-[#6F8596]">Thread start · Messenger</span><span className="h-px w-10 bg-[#304559]" /></div>
        {conversation.messages.length > 0 ? conversation.messages.map((message) => <MessageBubble key={message.id} message={message} />) : <p className="py-12 text-center font-mono text-[10px] text-[#8194A4]" data-testid="empty-chat-messages">No messages yet. Send a test message below.</p>}
      </div>
      <form onSubmit={submit} className="border-t border-[#2F4458] bg-[#1D3043] p-3.5">
        <div className="mb-2 flex items-center gap-1.5">
          <button type="button" onClick={() => setMode('operator')} className={cx('rounded-md px-2 py-1 font-mono text-[8px] uppercase tracking-wider transition-colors', mode === 'operator' ? 'bg-[#E9B449] text-[#273039]' : 'text-[#8297A7] hover:bg-[#294157] hover:text-[#DCE7EC]')} data-testid="button-mode-operator"><UserRound size={10} className="mr-1 inline" />Operator reply</button>
          <button type="button" onClick={() => setMode('customer')} className={cx('rounded-md px-2 py-1 font-mono text-[8px] uppercase tracking-wider transition-colors', mode === 'customer' ? 'bg-[#31595A] text-[#9DF0E2]' : 'text-[#8297A7] hover:bg-[#294157] hover:text-[#DCE7EC]')} data-testid="button-mode-customer"><Bot size={10} className="mr-1 inline" />Simulate customer</button>
          <span className="ml-auto font-mono text-[8px] text-[#718699]">{mode === 'customer' ? `${rules.filter((rule) => rule.enabled).length} active rules` : 'Manual channel'}</span>
        </div>
        {mode === 'customer' && <div className="mb-2 flex items-center gap-2 rounded-lg border border-[#4C665D] bg-[#263E45] px-2.5 py-2 text-[9px] leading-relaxed text-[#A6D8CE]" data-testid="text-customer-mode-note"><Sparkles size={12} className="shrink-0 text-[#78E2D3]" />Test an inbound message. Enabled keyword rules may reply automatically.</div>}
        <div className="flex items-end gap-2 rounded-xl border border-[#3A5266] bg-[#172536] p-2 transition-colors focus-within:border-[#78E2D3]">
          <textarea value={text} onChange={(event) => setText(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} rows={1} placeholder={mode === 'customer' ? 'Type an inbound test message…' : 'Write a reply to the customer…'} className="max-h-24 min-h-8 flex-1 resize-none bg-transparent px-1 py-1.5 text-[11px] leading-relaxed text-[#E5EFF1] outline-none placeholder:text-[#6F8596]" data-testid="input-message-compose" />
          <button type="submit" disabled={!text.trim()} className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#E9B449] text-[#273039] transition-all hover:-translate-y-0.5 hover:bg-[#F6C85E] disabled:cursor-not-allowed disabled:opacity-35" aria-label={mode === 'customer' ? 'Send simulated customer message' : 'Send operator reply'} data-testid="button-send-message"><Send size={14} /></button>
        </div>
        <p className="mt-2 px-1 font-mono text-[8px] text-[#6F8596]">Enter to send · Shift + Enter for a new line</p>
      </form>
    </section>
  );
}

function RuleCard({ rule, onToggle, onDelete }: { rule: MessengerBotRule; onToggle: () => void; onDelete: () => void }) {
  return (
    <div className={cx('group rounded-xl border p-3.5 transition-colors', rule.enabled ? 'border-[#41685F] bg-[#233E43]' : 'border-[#304559] bg-[#1B2C3E]')} data-testid={`card-bot-rule-${rule.id}`}>
      <div className="flex items-start gap-2">
        <div className={cx('mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg', rule.enabled ? 'bg-[#315C59] text-[#83E7D8]' : 'bg-[#2A3A4B] text-[#7E92A1]')}><Zap size={12} /></div>
        <div className="min-w-0 flex-1"><div className="flex items-center gap-1.5"><span className="font-mono text-[10px] font-medium text-[#F0C45C]">“{rule.keyword}”</span>{rule.enabled && <span className="size-1.5 rounded-full bg-[#78E2D3]" title="Rule enabled" />}</div><p className="mt-1.5 text-[10px] leading-relaxed text-[#AABAC3]">{rule.reply}</p></div>
        <button onClick={onDelete} className="rounded-md p-1.5 text-[#718697] opacity-70 transition-all hover:bg-[#503741] hover:text-[#F4B2A8] group-hover:opacity-100" aria-label={`Delete ${rule.keyword} rule`} data-testid={`button-delete-rule-${rule.id}`}><Trash2 size={13} /></button>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-[#385064] pt-2.5">
        <span className="font-mono text-[8px] uppercase tracking-wider text-[#718697]">{rule.matchCount} matches</span>
        <button onClick={onToggle} className={cx('flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-[8px] uppercase tracking-wider transition-colors', rule.enabled ? 'text-[#8DE7D9] hover:bg-[#31595A]' : 'text-[#8194A4] hover:bg-[#2B4054]')} aria-pressed={rule.enabled} data-testid={`button-toggle-rule-${rule.id}`}>{rule.enabled ? <Power size={11} /> : <Circle size={10} />}{rule.enabled ? 'Enabled' : 'Disabled'}</button>
      </div>
    </div>
  );
}

function RulesPanel({ rules, onAdd, onToggle, onDelete }: { rules: MessengerBotRule[]; onAdd: (keyword: string, reply: string) => void; onToggle: (id: string) => void; onDelete: (id: string) => void }) {
  const [keyword, setKeyword] = useState('');
  const [reply, setReply] = useState('');
  const [open, setOpen] = useState(false);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!keyword.trim() || !reply.trim()) return;
    onAdd(keyword.trim(), reply.trim());
    setKeyword('');
    setReply('');
    setOpen(false);
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-[#2F4458] bg-[#1D3043]" data-testid="panel-bot-rules">
      <div className="border-b border-[#2F4458] p-4">
        <div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[9px] uppercase tracking-[.18em] text-[#F4B942]">Automation / rules</p><h2 className="mt-1 text-[14px] font-extrabold text-[#EDF5F5]">Keyword responses</h2></div><div className="flex size-8 items-center justify-center rounded-lg bg-[#4A3D27] text-[#F4C875]"><SlidersHorizontal size={15} /></div></div>
        <p className="mt-2 text-[10px] leading-relaxed text-[#8497A7]">Rules are evaluated in order against inbound test messages.</p>
        <button onClick={() => setOpen((current) => !current)} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#496070] bg-[#253A4D] py-2.5 font-mono text-[9px] font-medium uppercase tracking-wider text-[#CDE4E4] transition-colors hover:border-[#78E2D3] hover:bg-[#294B54]" aria-expanded={open} data-testid="button-add-rule"><Plus size={13} /> Add response rule</button>
      </div>
      {open && <form onSubmit={submit} className="border-b border-[#2F4458] bg-[#1A2C3F] p-4" data-testid="form-add-rule">
        <div className="mb-3 flex items-center justify-between"><span className="font-mono text-[9px] uppercase tracking-wider text-[#78E2D3]">New rule</span><button type="button" onClick={() => setOpen(false)} className="text-[#718697] hover:text-[#E7F0F2]" aria-label="Close rule builder" data-testid="button-close-rule-builder"><X size={14} /></button></div>
        <label className="block text-[10px] font-bold text-[#CBD9DF]">When message contains<input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="shipping" className="mt-1.5 h-9 w-full rounded-lg border border-[#385267] bg-[#172536] px-2.5 font-mono text-[10px] text-[#EDF5F5] outline-none placeholder:text-[#718699] focus:border-[#78E2D3]" autoFocus data-testid="input-rule-keyword" /></label>
        <label className="mt-3 block text-[10px] font-bold text-[#CBD9DF]">Gioxbot replies<textarea value={reply} onChange={(event) => setReply(event.target.value)} placeholder="We ship worldwide…" rows={3} className="mt-1.5 w-full resize-y rounded-lg border border-[#385267] bg-[#172536] px-2.5 py-2 font-sans text-[10px] leading-relaxed text-[#EDF5F5] outline-none placeholder:text-[#718699] focus:border-[#78E2D3]" data-testid="input-rule-reply" /></label>
        <button type="submit" disabled={!keyword.trim() || !reply.trim()} className="mt-3 w-full rounded-lg bg-[#E9B449] py-2.5 text-[10px] font-extrabold text-[#273039] transition-all hover:-translate-y-0.5 hover:bg-[#F6C85E] disabled:cursor-not-allowed disabled:opacity-40" data-testid="button-save-rule">Save rule</button>
      </form>}
      <div className="max-h-[560px] space-y-2.5 overflow-y-auto p-3.5">
        {rules.length > 0 ? rules.map((rule) => <RuleCard key={rule.id} rule={rule} onToggle={() => onToggle(rule.id)} onDelete={() => onDelete(rule.id)} />) : <div className="rounded-xl border border-dashed border-[#3D5568] px-4 py-10 text-center" data-testid="empty-bot-rules"><div className="mx-auto flex size-9 items-center justify-center rounded-xl bg-[#263E51] text-[#F4B942]"><Zap size={15} /></div><p className="mt-3 text-[11px] font-bold text-[#DCE7EC]">No rules configured</p><p className="mt-1 text-[10px] leading-relaxed text-[#8295A6]">Add a keyword and approved reply to start testing automation.</p></div>}
      </div>
      <div className="border-t border-[#2F4458] px-4 py-3"><p className="flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-wider text-[#718697]"><Check size={11} className="text-[#78E2D3]" /> Changes are local until persisted</p></div>
    </section>
  );
}

export function MessengerWorkspace({
  initialConversations = initialMessengerConversations,
  initialRules = initialMessengerBotRules,
  initialBotEnabled = false,
  loading = false,
  error = null,
  onRetry,
  onConversationsChange,
  onRulesChange,
  onBotEnabledChange,
}: MessengerWorkspaceProps) {
  const [conversations, setConversations] = useState<MessengerConversation[]>(initialConversations);
  const [rules, setRules] = useState<MessengerBotRule[]>(initialRules);
  const [botEnabled, setBotEnabled] = useState(initialBotEnabled);
  const [selectedId, setSelectedId] = useState(initialConversations[0]?.id);
  const [mobileInbox, setMobileInbox] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const sequence = useRef(0);

  const selectedConversation = conversations.find((conversation) => conversation.id === selectedId);
  const activeRules = rules.filter((rule) => rule.enabled).length;
  const openCount = conversations.filter((conversation) => conversation.status === 'open').length;
  const unreadCount = conversations.reduce((total, conversation) => total + conversation.unread, 0);
  const makeId = (prefix: string) => `${prefix}-${Date.now()}-${sequence.current++}`;

  const flash = (message: string) => {
    setFeedback(message);
    window.setTimeout(() => setFeedback(null), 2600);
  };

  const selectConversation = (id: string) => {
    setSelectedId(id);
    setMobileInbox(false);
    setConversations((current) => {
      const next = current.map((conversation) => conversation.id === id ? { ...conversation, unread: 0 } : conversation);
      onConversationsChange?.(next);
      return next;
    });
  };

  const sendMessage = (text: string, mode: ComposeMode) => {
    if (!selectedConversation) return;
    const now = new Date();
    const sentAt = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const message: MessengerMessage = { id: makeId('msg'), author: mode === 'customer' ? 'customer' : 'operator', text, sentAt, status: 'delivered' };
    const matchingRule = mode === 'customer' && botEnabled ? rules.find((rule) => rule.enabled && text.toLowerCase().includes(rule.keyword.toLowerCase())) : undefined;
    const botMessage: MessengerMessage | undefined = matchingRule ? { id: makeId('bot'), author: 'bot', text: matchingRule.reply, sentAt, status: 'delivered' } : undefined;
    const nextRules = matchingRule ? rules.map((rule) => rule.id === matchingRule.id ? { ...rule, matchCount: rule.matchCount + 1 } : rule) : rules;
    const nextConversations: MessengerConversation[] = conversations.map((conversation) => conversation.id === selectedConversation.id ? {
      ...conversation,
      lastMessage: botMessage?.text ?? text,
      lastMessageAt: sentAt,
      status: mode === 'operator' ? 'open' : botMessage ? 'open' : 'waiting',
      messages: [...conversation.messages, message, ...(botMessage ? [botMessage] : [])],
    } : conversation);
    setConversations(nextConversations);
    onConversationsChange?.(nextConversations);
    if (matchingRule) {
      setRules(nextRules);
      onRulesChange?.(nextRules);
      flash(`Rule “${matchingRule.keyword}” matched · reply sent`);
    } else {
      flash(mode === 'customer' ? 'Inbound message added · operator reply needed' : 'Reply sent to Messenger');
    }
  };

  const addRule = (keyword: string, reply: string) => {
    const nextRules = [{ id: makeId('rule'), keyword, reply, enabled: true, matchCount: 0 }, ...rules];
    setRules(nextRules);
    onRulesChange?.(nextRules);
    flash('Response rule saved');
  };

  const toggleRule = (id: string) => {
    const nextRules = rules.map((rule) => rule.id === id ? { ...rule, enabled: !rule.enabled } : rule);
    setRules(nextRules);
    onRulesChange?.(nextRules);
    flash(nextRules.find((rule) => rule.id === id)?.enabled ? 'Rule enabled' : 'Rule disabled');
  };

  const deleteRule = (id: string) => {
    const removed = rules.find((rule) => rule.id === id);
    const nextRules = rules.filter((rule) => rule.id !== id);
    setRules(nextRules);
    onRulesChange?.(nextRules);
    flash(removed ? `Rule “${removed.keyword}” deleted` : 'Rule deleted');
  };

  const toggleBot = () => {
    const next = !botEnabled;
    setBotEnabled(next);
    onBotEnabledChange?.(next);
    flash(next ? 'Automation online · ready to answer' : 'Automation paused');
  };

  if (loading) return <LoadingWorkspace />;
  if (error) return <ErrorWorkspace message={error} onRetry={onRetry} />;
  if (conversations.length === 0) return <section className="rounded-[22px] border border-[#31455B] bg-[#172536] p-4 md:p-6" data-testid="messenger-workspace-empty"><EmptyConversations /></section>;

  return (
    <section className="relative overflow-hidden rounded-[22px] border border-[#31455B] bg-[#172536] text-[#E7EFF4] shadow-[0_22px_60px_rgba(17,31,47,.18)]" data-testid="messenger-workspace">
      <div className="pointer-events-none absolute -right-24 -top-28 size-72 rounded-full bg-[#2F817D]/10 blur-3xl" />
      <div className="relative border-b border-[#30465A] px-4 py-4 md:px-6 md:py-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#3B6570] bg-[#24444D] text-[#78E2D3] shadow-[0_8px_20px_rgba(56,158,149,.12)]"><MessageCircle size={19} /></div>
            <div><p className="font-mono text-[9px] uppercase tracking-[.2em] text-[#78E2D3]">Facebook / live surface</p><h1 className="mt-1 text-[20px] font-extrabold tracking-[-.05em] text-[#F0F7F7] md:text-[23px]">Messenger operations</h1><p className="mt-1 text-[10px] text-[#8498A8]">Inspect threads, test replies, keep a human in the loop.</p></div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
             <div className="flex items-center gap-2 rounded-lg border border-[#4A5260] bg-[#1D3043] px-2.5 py-2" data-testid="status-messenger-connection"><span className="size-1.5 rounded-full bg-[#F4B942] shadow-[0_0_0_3px_rgba(244,185,66,.12)]" /><span className="font-mono text-[9px] uppercase tracking-wider text-[#F0C45C]">Test mode · Page pending</span></div>
            <button onClick={toggleBot} className={cx('group flex items-center gap-2 rounded-lg px-3 py-2 font-mono text-[9px] font-medium uppercase tracking-wider transition-all hover:-translate-y-0.5', botEnabled ? 'bg-[#78E2D3] text-[#183338] shadow-[0_5px_18px_rgba(120,226,211,.18)]' : 'border border-[#4D5B63] bg-[#273746] text-[#B4C1C9] hover:border-[#F4B942] hover:text-[#F4C875]')} aria-pressed={botEnabled} data-testid="button-toggle-bot"><Power size={13} className={cx(botEnabled && 'group-hover:rotate-[-18deg]', 'transition-transform')} />Automation {botEnabled ? 'online' : 'offline'}</button>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#2D4255] pt-3 font-mono text-[9px] uppercase tracking-wider text-[#718697]">
          <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-[#78E2D3]" />{openCount} open threads</span>
          <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-[#F4B942]" />{unreadCount} unread</span>
          <span className="flex items-center gap-1.5"><Bot size={11} className={botEnabled ? 'text-[#78E2D3]' : 'text-[#718697]'} />{activeRules} active rules</span>
          <span className="ml-auto hidden items-center gap-1.5 md:flex"><Clock3 size={11} /> Last sync 09:45:12 UTC</span>
        </div>
      </div>
      {feedback && <div className="relative flex items-center gap-2 border-b border-[#49635C] bg-[#243E43] px-4 py-2.5 font-mono text-[9px] text-[#B9EEE5]" role="status" data-testid="status-messenger-feedback"><Check size={13} />{feedback}</div>}
      <div className="relative grid gap-3 p-3 md:p-4 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)_320px]">
        <div className={cx(!mobileInbox && 'hidden lg:block')}><InboxPanel conversations={conversations} selectedId={selectedId} onSelect={selectConversation} /></div>
        <div className={cx(mobileInbox && 'hidden lg:block')}><ChatPanel conversation={selectedConversation} botEnabled={botEnabled} rules={rules} onSend={sendMessage} onBack={() => setMobileInbox(true)} /></div>
        <div className="lg:col-span-2 xl:col-span-1"><RulesPanel rules={rules} onAdd={addRule} onToggle={toggleRule} onDelete={deleteRule} /></div>
      </div>
    </section>
  );
}

export default MessengerWorkspace;