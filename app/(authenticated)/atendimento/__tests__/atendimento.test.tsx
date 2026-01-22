/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MessageBubble } from '@/components/atendimento/message-bubble';
import { ConversationItem } from '@/components/atendimento/conversation-item';
import { DateSeparator } from '@/components/atendimento/date-separator';
import { ChatMessage, ChatConversation } from '@/lib/api';

describe('Atendimento Components', () => {
  describe('MessageBubble', () => {
    const mockFormatTime = (timestamp: string) => {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    it('renders sent message correctly', () => {
      const message: ChatMessage = {
        id: '1',
        from: 'me',
        text: 'Olá, como posso ajudar?',
        timestamp: '2026-01-21T10:00:00Z',
        from_me: true,
      };

      render(<MessageBubble message={message} formatTime={mockFormatTime} />);

      expect(screen.getByText('Olá, como posso ajudar?')).toBeInTheDocument();
      expect(screen.getByText(/10:00/)).toBeInTheDocument();
    });

    it('renders received message correctly', () => {
      const message: ChatMessage = {
        id: '2',
        from: '5511999999999',
        text: 'Olá, doutor!',
        timestamp: '2026-01-21T10:01:00Z',
        from_me: false,
        push_name: 'João Silva',
      };

      render(<MessageBubble message={message} formatTime={mockFormatTime} />);

      expect(screen.getByText('Olá, doutor!')).toBeInTheDocument();
      expect(screen.getByText(/10:01/)).toBeInTheDocument();
    });

    it('shows double check for sent messages', () => {
      const message: ChatMessage = {
        id: '1',
        from: 'me',
        text: 'Test message',
        timestamp: '2026-01-21T10:00:00Z',
        from_me: true,
      };

      const { container } = render(<MessageBubble message={message} formatTime={mockFormatTime} />);

      const checkIcon = container.querySelector('.material-symbols-outlined');
      expect(checkIcon).toHaveTextContent('done_all');
    });

    it('applies correct styling for sent messages', () => {
      const message: ChatMessage = {
        id: '1',
        from: 'me',
        text: 'Test',
        timestamp: '2026-01-21T10:00:00Z',
        from_me: true,
      };

      const { container } = render(<MessageBubble message={message} formatTime={mockFormatTime} />);

      const messageDiv = container.querySelector('.bg-\\[\\#d9fdd3\\]');
      expect(messageDiv).toBeInTheDocument();
    });

    it('applies correct styling for received messages', () => {
      const message: ChatMessage = {
        id: '2',
        from: '5511999999999',
        text: 'Test',
        timestamp: '2026-01-21T10:00:00Z',
        from_me: false,
      };

      const { container } = render(<MessageBubble message={message} formatTime={mockFormatTime} />);

      const messageDiv = container.querySelector('.bg-white');
      expect(messageDiv).toBeInTheDocument();
    });
  });

  describe('ConversationItem', () => {
    const mockFormatTime = (timestamp: string) => '10:00';
    const mockOnClick = jest.fn();

    const conversation: ChatConversation = {
      id: 'conv_1',
      phone_number: '5511999999999',
      name: 'João Silva',
      unread_count: 2,
      last_message: 'Olá, doutor!',
      last_message_time: '2026-01-21T10:00:00Z',
    };

    beforeEach(() => {
      mockOnClick.mockClear();
    });

    it('renders conversation details correctly', () => {
      render(
        <ConversationItem
          conversation={conversation}
          isSelected={false}
          onClick={mockOnClick}
          formatTime={mockFormatTime}
        />
      );

      expect(screen.getByText('João Silva')).toBeInTheDocument();
      expect(screen.getByText('Olá, doutor!')).toBeInTheDocument();
      expect(screen.getByText('10:00')).toBeInTheDocument();
    });

    it('shows unread count badge', () => {
      render(
        <ConversationItem
          conversation={conversation}
          isSelected={false}
          onClick={mockOnClick}
          formatTime={mockFormatTime}
        />
      );

      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('does not show badge when unread_count is 0', () => {
      const readConversation = { ...conversation, unread_count: 0 };

      const { container } = render(
        <ConversationItem
          conversation={readConversation}
          isSelected={false}
          onClick={mockOnClick}
          formatTime={mockFormatTime}
        />
      );

      expect(container.querySelector('.bg-primary.text-white')).not.toBeInTheDocument();
    });

    it('calls onClick when clicked', () => {
      render(
        <ConversationItem
          conversation={conversation}
          isSelected={false}
          onClick={mockOnClick}
          formatTime={mockFormatTime}
        />
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('applies selected styling when isSelected is true', () => {
      const { container } = render(
        <ConversationItem
          conversation={conversation}
          isSelected={true}
          onClick={mockOnClick}
          formatTime={mockFormatTime}
        />
      );

      const button = container.querySelector('.bg-primary\\/5');
      expect(button).toBeInTheDocument();
    });

    it('shows phone number when name is not available', () => {
      const conversationWithoutName = { ...conversation, name: '' };

      render(
        <ConversationItem
          conversation={conversationWithoutName}
          isSelected={false}
          onClick={mockOnClick}
          formatTime={mockFormatTime}
        />
      );

      expect(screen.getByText('5511999999999')).toBeInTheDocument();
    });

    it('renders profile picture when available', () => {
      const conversationWithPicture = {
        ...conversation,
        profile_picture_url: 'https://example.com/avatar.jpg',
      };

      render(
        <ConversationItem
          conversation={conversationWithPicture}
          isSelected={false}
          onClick={mockOnClick}
          formatTime={mockFormatTime}
        />
      );

      const img = screen.getByAltText('João Silva');
      expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });

    it('renders avatar with first letter when no picture', () => {
      render(
        <ConversationItem
          conversation={conversation}
          isSelected={false}
          onClick={mockOnClick}
          formatTime={mockFormatTime}
        />
      );

      expect(screen.getByText('J')).toBeInTheDocument();
    });
  });

  describe('DateSeparator', () => {
    it('renders date correctly', () => {
      render(<DateSeparator date="Hoje" />);
      expect(screen.getByText('Hoje')).toBeInTheDocument();
    });

    it('renders formatted date correctly', () => {
      render(<DateSeparator date="21/01/2026" />);
      expect(screen.getByText('21/01/2026')).toBeInTheDocument();
    });

    it('applies correct styling', () => {
      const { container } = render(<DateSeparator date="Hoje" />);
      
      const separator = container.querySelector('.bg-white\\/90');
      expect(separator).toBeInTheDocument();
    });
  });

  describe('Integration Tests', () => {
    it('renders multiple messages with date separators', () => {
      const messages: ChatMessage[] = [
        {
          id: '1',
          from: 'me',
          text: 'Primeira mensagem',
          timestamp: '2026-01-21T09:00:00Z',
          from_me: true,
        },
        {
          id: '2',
          from: '5511999999999',
          text: 'Segunda mensagem',
          timestamp: '2026-01-21T10:00:00Z',
          from_me: false,
        },
      ];

      const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      };

      const { container } = render(
        <div>
          <DateSeparator date="Hoje" />
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} formatTime={formatTime} />
          ))}
        </div>
      );

      expect(screen.getByText('Hoje')).toBeInTheDocument();
      expect(screen.getByText('Primeira mensagem')).toBeInTheDocument();
      expect(screen.getByText('Segunda mensagem')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('conversation item is keyboard accessible', () => {
      const mockOnClick = jest.fn();
      const conversation: ChatConversation = {
        id: 'conv_1',
        phone_number: '5511999999999',
        name: 'João Silva',
        unread_count: 0,
        last_message: 'Olá',
        last_message_time: '2026-01-21T10:00:00Z',
      };

      render(
        <ConversationItem
          conversation={conversation}
          isSelected={false}
          onClick={mockOnClick}
          formatTime={() => '10:00'}
        />
      );

      const button = screen.getByRole('button');
      button.focus();
      
      expect(button).toHaveFocus();
    });

    it('message bubble has proper text contrast', () => {
      const message: ChatMessage = {
        id: '1',
        from: 'me',
        text: 'Test message',
        timestamp: '2026-01-21T10:00:00Z',
        from_me: true,
      };

      const { container } = render(
        <MessageBubble message={message} formatTime={() => '10:00'} />
      );

      const messageText = container.querySelector('.text-slate-900');
      expect(messageText).toBeInTheDocument();
    });
  });
});
