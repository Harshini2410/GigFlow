import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { HiPaperAirplane, HiLink, HiCheckCircle } from 'react-icons/hi';
import socket from '../utils/socket';
import {
  fetchMessages,
  sendMessage,
  addMessage,
  updateMessageRead,
  setTypingUser,
  removeTypingUser,
  markMessageAsRead,
} from '../store/slices/messageSlice';
import Card from './Card';
import Button from './Button';
import Input from './Input';
import Loading from './Loading';
import EmptyState from './EmptyState';

const Chat = ({ gigId, gigStatus }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { messagesByGigId, loading, typingUsers } = useSelector((state) => state.messages);

  const messages = messagesByGigId[gigId] || [];
  const typingUserNames = typingUsers[gigId] ? Object.values(typingUsers[gigId]) : [];

  const [messageContent, setMessageContent] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [messageType, setMessageType] = useState('text'); // 'text' or 'file'
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch messages on mount
  useEffect(() => {
    if (gigId && gigStatus === 'assigned') {
      dispatch(fetchMessages(gigId));
    }
  }, [gigId, gigStatus, dispatch]);

  // Socket.io: Join gig room on mount
  useEffect(() => {
    if (gigId && gigStatus === 'assigned') {
      socket.emit('join_gig_room', { gigId });

      // Listen for new messages
      const handleNewMessage = (message) => {
        if (message.gigId === gigId) {
          dispatch(addMessage({ gigId, message }));
          // Mark as read if user is viewing chat
          if (chatContainerRef.current) {
            dispatch(markMessageAsRead(message._id));
          }
        }
      };

      // Listen for typing indicators
      const handleTyping = (data) => {
        if (data.gigId === gigId && data.userId !== user?._id) {
          dispatch(setTypingUser({ gigId, userId: data.userId, userName: data.userName }));
        }
      };

      const handleStopTyping = (data) => {
        if (data.gigId === gigId) {
          dispatch(removeTypingUser({ gigId, userId: data.userId }));
        }
      };

      // Listen for read receipts
      const handleMessageRead = (data) => {
        if (data.gigId === gigId) {
          dispatch(updateMessageRead({ gigId, messageId: data.messageId, readBy: data.readBy }));
        }
      };

      socket.on('new_message', handleNewMessage);
      socket.on('user_typing', handleTyping);
      socket.on('user_stopped_typing', handleStopTyping);
      socket.on('message_read', handleMessageRead);

      return () => {
        socket.emit('leave_gig_room', { gigId });
        socket.off('new_message', handleNewMessage);
        socket.off('user_typing', handleTyping);
        socket.off('user_stopped_typing', handleStopTyping);
        socket.off('message_read', handleMessageRead);
      };
    }
  }, [gigId, gigStatus, user, dispatch]);

  // Mark messages as read when they're visible
  useEffect(() => {
    if (messages.length > 0 && chatContainerRef.current) {
      const unreadMessages = messages.filter(
        (msg) => msg.sender._id !== user?._id && !msg.readBy?.some((r) => r._id === user?._id)
      );

      // Mark messages as read (debounced to avoid too many API calls)
      const timeoutId = setTimeout(() => {
        unreadMessages.forEach((msg) => {
          dispatch(markMessageAsRead(msg._id));
        });
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [messages, user, dispatch]);

  // Typing indicator debounce
  const handleTyping = () => {
    if (messageType === 'text' && messageContent.trim()) {
      socket.emit('typing', { gigId });

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stop_typing', { gigId });
      }, 2000);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (isSending) return;

    if (messageType === 'text' && !messageContent.trim()) {
      return;
    }

    if (messageType === 'file' && !fileUrl.trim()) {
      alert('Please enter a file URL');
      return;
    }

    setIsSending(true);

    try {
      await dispatch(
        sendMessage({
          gigId,
          content: messageContent.trim(),
          type: messageType,
          fileUrl: fileUrl.trim(),
        })
      ).unwrap();

      setMessageContent('');
      setFileUrl('');
      setMessageType('text');
      socket.emit('stop_typing', { gigId });
    } catch (error) {
      alert(error || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const isMessageRead = (message) => {
    if (message.sender._id === user?._id) {
      // For sent messages, check if other user has read it
      return message.readBy?.some((r) => r._id !== user?._id);
    }
    return false;
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <div className="border-b border-dark-700 pb-4 mb-4">
        <h3 className="text-xl font-semibold text-gray-100">Messages</h3>
        <p className="text-sm text-gray-400 mt-1">Chat with your project partner</p>
      </div>

      {/* Messages container */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2"
        style={{ maxHeight: '400px' }}
      >
        {loading && messages.length === 0 ? (
          <div className="flex justify-center py-12">
            <Loading />
          </div>
        ) : messages.length === 0 ? (
          <EmptyState message="No messages yet. Start the conversation!" icon={HiLink} />
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.sender._id === user?._id;
            return (
              <motion.div
                key={message._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] ${
                    isOwnMessage
                      ? 'bg-accent-teal/20 border border-accent-teal/50'
                      : 'bg-dark-700 border border-dark-600'
                  } rounded-xl px-4 py-2`}
                >
                  {!isOwnMessage && (
                    <p className="text-xs font-medium text-gray-400 mb-1">{message.sender.name}</p>
                  )}
                  {message.type === 'text' ? (
                    <p className="text-gray-200 whitespace-pre-wrap">{message.content}</p>
                  ) : (
                    <a
                      href={message.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent-teal hover:text-accent-teal-light flex items-center gap-2 break-all"
                    >
                      <HiLink className="w-4 h-4 flex-shrink-0" />
                      <span className="underline">{message.fileUrl}</span>
                    </a>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">{formatTime(message.createdAt)}</span>
                    {isOwnMessage && isMessageRead(message) && (
                      <HiCheckCircle className="w-3 h-3 text-green-400" title="Read" />
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}

        {/* Typing indicator */}
        <AnimatePresence>
          {typingUserNames.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex justify-start"
            >
              <div className="bg-dark-700 border border-dark-600 rounded-xl px-4 py-2">
                <p className="text-sm text-gray-400 italic">
                  {typingUserNames.join(', ')} {typingUserNames.length === 1 ? 'is' : 'are'} typing...
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <form onSubmit={handleSendMessage} className="space-y-3">
        {/* Message type toggle */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMessageType('text')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              messageType === 'text'
                ? 'bg-accent-teal/20 text-accent-teal border border-accent-teal/50'
                : 'bg-dark-700 text-gray-400 border border-dark-600 hover:border-dark-500'
            }`}
          >
            Text
          </button>
          <button
            type="button"
            onClick={() => setMessageType('file')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              messageType === 'file'
                ? 'bg-accent-teal/20 text-accent-teal border border-accent-teal/50'
                : 'bg-dark-700 text-gray-400 border border-dark-600 hover:border-dark-500'
            }`}
          >
            File Link
          </button>
        </div>

        {messageType === 'text' ? (
          <div className="flex gap-2">
            <Input
              value={messageContent}
              onChange={(e) => {
                setMessageContent(e.target.value);
                handleTyping();
              }}
              placeholder="Type your message..."
              className="flex-1"
            />
            <Button
              type="submit"
              variant="primary"
              disabled={!messageContent.trim() || isSending}
              className="px-6"
            >
              <HiPaperAirplane className="w-5 h-5" />
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder="Paste file URL (e.g., https://drive.google.com/...)"
              type="url"
              className="flex-1"
            />
            <Button
              type="submit"
              variant="primary"
              disabled={!fileUrl.trim() || isSending}
              className="px-6"
            >
              <HiPaperAirplane className="w-5 h-5" />
            </Button>
          </div>
        )}
      </form>
    </Card>
  );
};

export default Chat;

