import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Message {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  profiles: {
    full_name: string;
    avatar_url: string | null;
  };
}

interface ChatRoomProps {
  lessonId?: string;
  levelClassroom?: 'Beginner' | 'Intermediate' | 'Advanced';
  title: string;
}

export function ChatRoom({ lessonId, levelClassroom, title }: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    fetchMessages();
    
    const channel = supabase
      .channel('chat_messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: lessonId 
            ? `lesson_id=eq.${lessonId}` 
            : `level_classroom=eq.${levelClassroom}`
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [lessonId, levelClassroom]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      let query = supabase
        .from('chat_messages')
        .select(`
          *,
          profiles:user_id (
            full_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: true });

      if (lessonId) {
        query = query.eq('lesson_id', lessonId);
      } else if (levelClassroom) {
        query = query.eq('level_classroom', levelClassroom);
      }

      const { data, error } = await query;

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: 'خطأ',
        description: 'فشل تحميل الرسائل',
        variant: 'destructive',
      });
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUserId) return;

    setLoading(true);
    try {
      const messageData: any = {
        user_id: currentUserId,
        message: newMessage.trim(),
      };

      if (lessonId) {
        messageData.lesson_id = lessonId;
      } else if (levelClassroom) {
        messageData.level_classroom = levelClassroom;
      }

      const { error } = await supabase
        .from('chat_messages')
        .insert([messageData]);

      if (error) throw error;

      setNewMessage('');
      toast({
        title: 'تم الإرسال',
        description: 'تم إرسال رسالتك بنجاح',
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'خطأ',
        description: 'فشل إرسال الرسالة',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      toast({
        title: 'تم الحذف',
        description: 'تم حذف الرسالة بنجاح',
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: 'خطأ',
        description: 'فشل حذف الرسالة',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="flex flex-col h-[600px]">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${
                msg.user_id === currentUserId ? 'flex-row-reverse' : ''
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium">
                  {msg.profiles?.full_name?.charAt(0) || '؟'}
                </span>
              </div>
              
              <div className={`flex-1 ${msg.user_id === currentUserId ? 'text-right' : ''}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">
                    {msg.profiles?.full_name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(msg.created_at), 'HH:mm', { locale: ar })}
                  </span>
                  {msg.user_id === currentUserId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMessage(msg.id)}
                      className="h-6 w-6 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <div
                  className={`p-3 rounded-lg ${
                    msg.user_id === currentUserId
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                </div>
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="اكتب رسالتك..."
            className="resize-none"
            rows={2}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <Button
            onClick={sendMessage}
            disabled={loading || !newMessage.trim()}
            size="icon"
            className="h-auto"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
