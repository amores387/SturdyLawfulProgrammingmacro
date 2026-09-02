export type MessengerMessageAuthor = 'customer' | 'operator' | 'bot';
export type MessengerConversationStatus = 'open' | 'waiting' | 'resolved';
export type MessengerMessageStatus = 'sent' | 'delivered' | 'failed';

export type MessengerMessage = {
  id: string;
  author: MessengerMessageAuthor;
  text: string;
  sentAt: string;
  status: MessengerMessageStatus;
};

export type MessengerConversation = {
  id: string;
  customerName: string;
  customerHandle: string;
  initials: string;
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
  status: MessengerConversationStatus;
  messages: MessengerMessage[];
};

export type MessengerBotRule = {
  id: string;
  keyword: string;
  reply: string;
  enabled: boolean;
  matchCount: number;
};

export const initialMessengerConversations: MessengerConversation[] = [
  {
    id: 'conv-mara',
    customerName: 'Mara Velez',
    customerHandle: '@mara.velez',
    initials: 'MV',
    lastMessage: 'Do you ship to Lisbon?',
    lastMessageAt: '09:42',
    unread: 2,
    status: 'open',
    messages: [
      { id: 'msg-mara-1', author: 'customer', text: 'Hi, I need a hand with an order.', sentAt: '09:36', status: 'delivered' },
      { id: 'msg-mara-2', author: 'operator', text: 'I can help with that. What would you like to check?', sentAt: '09:38', status: 'delivered' },
      { id: 'msg-mara-3', author: 'customer', text: 'Do you ship to Lisbon?', sentAt: '09:42', status: 'delivered' },
    ],
  },
  {
    id: 'conv-owen',
    customerName: 'Owen Park',
    customerHandle: '@owen.park',
    initials: 'OP',
    lastMessage: 'Thanks, that fixed it.',
    lastMessageAt: '08:57',
    unread: 0,
    status: 'resolved',
    messages: [
      { id: 'msg-owen-1', author: 'customer', text: 'Where can I find the setup guide?', sentAt: '08:51', status: 'delivered' },
      { id: 'msg-owen-2', author: 'bot', text: 'The setup guide is in the Help Center under Getting started.', sentAt: '08:52', status: 'delivered' },
      { id: 'msg-owen-3', author: 'customer', text: 'Thanks, that fixed it.', sentAt: '08:57', status: 'delivered' },
    ],
  },
  {
    id: 'conv-northstar',
    customerName: 'Northstar Labs',
    customerHandle: '@northstar.labs',
    initials: 'NL',
    lastMessage: 'Can a human call me back?',
    lastMessageAt: 'Yesterday',
    unread: 1,
    status: 'waiting',
    messages: [
      { id: 'msg-northstar-1', author: 'customer', text: 'I have a question about our invoice.', sentAt: 'Yesterday', status: 'delivered' },
      { id: 'msg-northstar-2', author: 'bot', text: 'I can help route billing questions. Please share your invoice number.', sentAt: 'Yesterday', status: 'delivered' },
      { id: 'msg-northstar-3', author: 'customer', text: 'Can a human call me back?', sentAt: 'Yesterday', status: 'delivered' },
    ],
  },
  {
    id: 'conv-jules',
    customerName: 'Jules Nwosu',
    customerHandle: '@jules.nwosu',
    initials: 'JN',
    lastMessage: 'Hello there',
    lastMessageAt: 'Mon',
    unread: 0,
    status: 'open',
    messages: [
      { id: 'msg-jules-1', author: 'customer', text: 'Hello there', sentAt: 'Mon', status: 'delivered' },
    ],
  },
];

export const initialMessengerBotRules: MessengerBotRule[] = [
  {
    id: 'rule-help',
    keyword: 'help',
    reply: 'I can help with orders, shipping, billing, and getting started. What would you like to sort out?',
    enabled: true,
    matchCount: 18,
  },
  {
    id: 'rule-hours',
    keyword: 'hours',
    reply: 'Our team is online Monday to Friday, 09:00–18:00 UTC. Leave a message and we will pick it up next.',
    enabled: true,
    matchCount: 7,
  },
  {
    id: 'rule-human',
    keyword: 'human',
    reply: 'I am flagging this for an operator now. Someone from the team will follow up shortly.',
    enabled: false,
    matchCount: 3,
  },
];