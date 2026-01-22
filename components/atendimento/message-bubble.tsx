import { ChatMessage } from '@/lib/api';

interface MessageBubbleProps {
  message: ChatMessage;
  formatTime: (timestamp: string) => string;
}

export function MessageBubble({ message, formatTime }: MessageBubbleProps) {
  return (
    <div className={`flex ${message.from_me ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[70%] rounded-lg px-4 py-2 shadow-sm ${
          message.from_me
            ? 'bg-[#d9fdd3] rounded-tr-none'
            : 'bg-white rounded-tl-none'
        }`}
      >
        <p className="text-sm text-slate-900 whitespace-pre-wrap break-words">
          {message.text}
        </p>
        <div className="flex items-center justify-end gap-1 mt-1">
          <span className="text-[10px] text-slate-500">
            {formatTime(message.timestamp)}
          </span>
          {message.from_me && (
            <span className="material-symbols-outlined text-[12px] text-blue-500">
              done_all
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
