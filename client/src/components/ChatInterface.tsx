import { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Send, Loader2, Trash2, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { ChatMessage, PageCitation } from '@shared/schema';

interface ChatInterfaceProps {
  sessionId: string;
  onCitationClick: (page: number) => void;
}

export function ChatInterface({ sessionId, onCitationClick }: ChatInterfaceProps) {
  const [question, setQuestion] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { data: messages = [], isLoading } = useQuery<ChatMessage[]>({
    queryKey: ['/api/chat', sessionId, 'messages'],
  });

  const [streamingMessage, setStreamingMessage] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { question: string }) => {
      setIsStreaming(true);
      setStreamingMessage('');

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          question: data.question,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response stream');
      }

      let fullMessage = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        // Decode chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });
        
        // Process complete SSE events (separated by double newline)
        const events = buffer.split('\n\n');
        
        // Keep the last incomplete event in buffer
        buffer = events.pop() || '';

        for (const event of events) {
          const lines = event.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.type === 'chunk') {
                  fullMessage += data.content;
                  setStreamingMessage(fullMessage);
                } else if (data.type === 'complete') {
                  setIsStreaming(false);
                  setStreamingMessage('');
                  return data.message;
                } else if (data.type === 'error') {
                  throw new Error(data.error);
                }
              } catch (e) {
                console.error('Failed to parse SSE data:', line, e);
              }
            }
          }
        }
      }

      // Handle any remaining buffered data
      if (buffer.trim()) {
        const lines = buffer.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'complete') {
                setIsStreaming(false);
                setStreamingMessage('');
                return data.message;
              }
            } catch (e) {
              console.error('Failed to parse final SSE data:', line, e);
            }
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat', sessionId, 'messages'] });
      setQuestion('');
      setIsStreaming(false);
      setStreamingMessage('');
    },
    onError: (error: any) => {
      setIsStreaming(false);
      setStreamingMessage('');
      toast({
        title: 'Failed to send message',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    },
  });

  const clearChatMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('DELETE', `/api/chat/${sessionId}/clear`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat', sessionId, 'messages'] });
      toast({
        title: 'Chat cleared',
        description: 'All messages have been removed',
      });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim() && !sendMessageMutation.isPending) {
      sendMessageMutation.mutate({ question: question.trim() });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
        <h2 className="text-lg font-semibold text-foreground">Chat with PDF</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => clearChatMutation.mutate()}
          disabled={clearChatMutation.isPending || messages.length === 0}
          className="gap-2"
          data-testid="button-clear-chat"
        >
          <Trash2 className="w-4 h-4" />
          Clear Chat
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-6 space-y-4" data-testid="chat-messages-container">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div className="flex items-center justify-center w-20 h-20 rounded-full bg-accent">
              <MessageCircle className="w-10 h-10 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-foreground">Start a conversation</h3>
              <p className="text-base text-muted-foreground max-w-md">
                Ask questions about your PDF and get intelligent answers with page citations
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                data-testid={`message-${message.role}-${message.id}`}
              >
                <div
                  className={`max-w-[85%] px-4 py-3 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground ml-auto'
                      : 'bg-muted text-foreground mr-auto'
                  }`}
                >
                  <p className="text-base whitespace-pre-wrap break-words">{message.content}</p>
                  {message.role === 'assistant' && message.citations && message.citations.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3" data-testid="citations-container">
                      {message.citations.map((citation: PageCitation, index: number) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="cursor-pointer hover-elevate active-elevate-2 transition-transform"
                          onClick={() => onCitationClick(citation.page)}
                          data-testid={`citation-page-${citation.page}`}
                        >
                          Page {citation.page}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isStreaming && streamingMessage && (
              <div className="flex justify-start" data-testid="streaming-message">
                <div className="max-w-[85%] px-4 py-3 rounded-2xl bg-muted text-foreground">
                  <p className="text-base whitespace-pre-wrap break-words">{streamingMessage}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Generating...</span>
                  </div>
                </div>
              </div>
            )}
            {sendMessageMutation.isPending && !isStreaming && (
              <div className="flex justify-start">
                <div className="max-w-[85%] px-4 py-3 rounded-2xl bg-muted text-foreground">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-base">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border bg-card p-4">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <Textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about your PDF..."
            className="resize-none min-h-[60px] max-h-[120px]"
            disabled={sendMessageMutation.isPending}
            data-testid="input-question"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!question.trim() || sendMessageMutation.isPending}
            className="shrink-0 h-[60px] w-[60px]"
            data-testid="button-send"
          >
            <Send className="w-5 h-5" />
          </Button>
        </form>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
