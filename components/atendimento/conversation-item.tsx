import { ChatConversation } from '@/lib/api';

interface ConversationItemProps {
  conversation: ChatConversation;
  isSelected: boolean;
  onClick: () => void;
  formatTime: (timestamp: string) => string;
}

export function ConversationItem({
  conversation,
  isSelected,
  onClick,
  formatTime,
}: ConversationItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full p-4 flex items-center gap-3 hover:bg-slate-50 transition-colors border-b border-slate-100 ${
        isSelected ? 'bg-primary/5' : ''
      }`}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        {conversation.profile_picture_url ? (
          <img
            src={conversation.profile_picture_url}
            alt={conversation.name}
            className="size-12 rounded-full object-cover"
          />
        ) : (
          <div className="size-12 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-lg">
            {conversation.name?.charAt(0).toUpperCase() || '?'}
          </div>
        )}
        {conversation.unread_count > 0 && (
          <div className="absolute -top-1 -right-1 size-5 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
            {conversation.unread_count}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between gap-2 mb-1">
          <p className="font-semibold text-slate-900 truncate">
            {conversation.name || conversation.phone_number}
          </p>
          <span className="text-xs text-slate-400 shrink-0">
            {formatTime(conversation.last_message_time)}
          </span>
        </div>
        <p
          className={`text-sm truncate ${
            conversation.unread_count > 0
              ? 'text-slate-900 font-medium'
              : 'text-slate-500'
          }`}
        >
          {conversation.last_message}
        </p>
      </div>
    </button>
  );
}
