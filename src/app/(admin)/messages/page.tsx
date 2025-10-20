'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/lib/useSocket';
import { useTheme } from '@/context/ThemeContext';

interface Message {
  _id: string;
  activityId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: 'text' | 'system';
  createdAt: string;
}

interface Activity {
  _id: string;
  name: string;
  participants: string[];
  lastMessage?: string;
  lastMessageAt: string;
  unreadCount?: number;
}

export default function ActivityChatPage() {
  const { data: sessionData, isPending } = useSession();
  const router = useRouter();
  const { theme } = useTheme();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    isConnected,
    joinActivity,
    leaveActivity,
    emitTyping,
    emitStopTyping,
    onNewMessage,
    onUserTyping,
    onUserStoppedTyping,
    offNewMessage,
    offUserTyping,
    offUserStoppedTyping,
  } = useSocket();

  // Fix: Access session correctly - useSession returns { data: { session, user } }
  const session = sessionData?.session;
  const user = sessionData?.user;

  // Redirect if not authenticated
  useEffect(() => {
    if (!isPending && !sessionData) {
      router.push('/signin');
    }
  }, [sessionData, isPending, router]);

  const currentUserId = user?.id || '';
  const currentUserName = user?.name || 'Unknown User';

  // Debug: Log when user ID changes
  useEffect(() => {
    console.log('🆔 Current User ID updated:', currentUserId);
  }, [currentUserId]);

  // Debug: Log when messages change
  useEffect(() => {
    console.log('💬 Messages state updated:', messages.length, 'messages');
  }, [messages]);

  // Fetch user's activities
  useEffect(() => {
    if (sessionData?.session) {
      fetchActivities();
    }
  }, [sessionData]);

  // Handle activity selection and socket events
  useEffect(() => {
    if (selectedActivity && isConnected) {
      joinActivity(selectedActivity);
      fetchMessages(selectedActivity);

      onNewMessage((message: Message) => {
        if (message.activityId === selectedActivity) {
          setMessages((prev) => [...prev, message]);
        }
      });

      onUserTyping(({ userName }) => {
        setTypingUser(userName);
        setIsTyping(true);
      });

      onUserStoppedTyping(() => {
        setIsTyping(false);
        setTypingUser('');
      });

      return () => {
        leaveActivity(selectedActivity);
        offNewMessage();
        offUserTyping();
        offUserStoppedTyping();
      };
    }
  }, [selectedActivity, isConnected]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/activities/my-activities');
      const data = await response.json();
      if (data.activities) {
        setActivities(data.activities);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (activityId: string) => {
    try {
      console.log('🔍 Fetching messages for activity:', activityId);
      const response = await fetch(`/api/activities/${activityId}/messages`);
      const data = await response.json();
      console.log('📦 Received data:', data);
      console.log('👤 Current user ID:', currentUserId);
      if (data.messages) {
        console.log('✅ Setting messages:', data.messages.length, 'messages');
        setMessages(data.messages);
      } else {
        console.log('❌ No messages in response');
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleTyping = () => {
    if (selectedActivity) {
      emitTyping(selectedActivity, currentUserName);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        emitStopTyping(selectedActivity);
      }, 1000);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !selectedActivity) return;

    try {
      const response = await fetch(`/api/activities/${selectedActivity}/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newMessage,
        }),
      });

      if (response.ok) {
        setNewMessage('');
        if (selectedActivity) {
          emitStopTyping(selectedActivity);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const filteredActivities = activities.filter((activity) =>
    activity.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedActivityData = activities.find((a) => a._id === selectedActivity);

  if (isPending) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!sessionData) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Breadcrumb */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-title-md2 font-semibold text-black dark:text-white">
          Activity Chats
        </h2>
        <nav>
          <ol className="flex items-center gap-2">
            <li>
              <a className="font-medium text-black dark:text-white" href="/">
                Dashboard /
              </a>
            </li>
            <li className="font-medium text-primary">Messages</li>
          </ol>
        </nav>
      </div>

      {/* Messages Container */}
      <div className="h-[calc(100vh-12rem)] rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark xl:flex">
        {/* Activities Sidebar */}
        <div className="hidden h-full flex-col xl:flex xl:w-1/4 border-r border-stroke dark:border-strokedark overflow-hidden">
          {/* User Info Header */}
          <div className="flex items-center gap-3 border-b border-stroke px-6 py-4.5 dark:border-strokedark bg-white dark:bg-boxdark">
            <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-white font-medium shadow-lg">
              {currentUserName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h5 className="font-medium text-black dark:text-white">
                {currentUserName}
              </h5>
              <p className="text-xs text-bodydark dark:text-bodydark flex items-center gap-2">
                <span className={`inline-block h-2 w-2 rounded-full ${isConnected ? 'bg-meta-3' : 'bg-meta-1'}`}></span>
                {isConnected ? 'Connected' : 'Disconnected'}
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="sticky top-0 z-50 flex items-center justify-between gap-4 border-b border-stroke px-6 py-4 dark:border-strokedark bg-white dark:bg-boxdark">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search activities..."
                className="w-full rounded-lg border border-stroke bg-gray-2 dark:bg-meta-4 py-2.5 pl-10 pr-4 text-black dark:text-white outline-none focus:border-primary dark:focus:border-primary transition-colors"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-bodydark dark:text-bodydark"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Activities List */}
          <div className="flex flex-col overflow-y-auto flex-1 bg-white dark:bg-boxdark">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-10 px-6">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                <p className="text-sm text-bodydark dark:text-bodydark mt-4">Loading activities...</p>
              </div>
            ) : filteredActivities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-6">
                <svg className="w-16 h-16 text-bodydark dark:text-bodydark mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-sm text-bodydark dark:text-bodydark font-medium">No activities found</p>
                <p className="text-xs text-bodydark dark:text-bodydark mt-2">Join an activity to start chatting!</p>
              </div>
            ) : (
              filteredActivities.map((activity) => (
                <button
                  key={activity._id}
                  onClick={() => setSelectedActivity(activity._id)}
                  className={`flex items-center gap-4 border-b border-stroke px-6 py-4 hover:bg-gray-2 dark:border-strokedark dark:hover:bg-meta-4 transition-colors ${
                    selectedActivity === activity._id
                      ? 'bg-gray-2 dark:bg-meta-4 border-l-4 border-l-primary'
                      : ''
                  }`}
                >
                  <div className="relative h-14 w-14 rounded-full flex-shrink-0">
                    <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {activity.name.charAt(0).toUpperCase()}
                    </div>
                    {activity.unreadCount && activity.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-meta-1 flex items-center justify-center text-white text-xs font-bold shadow-md">
                        {activity.unreadCount > 9 ? '9+' : activity.unreadCount}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col text-left min-w-0">
                    <h5 className="font-semibold text-black dark:text-white truncate">
                      {activity.name}
                    </h5>
                    <p className="text-sm text-bodydark dark:text-bodydark line-clamp-1">
                      {activity.lastMessage || 'No messages yet'}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-xs text-bodydark dark:text-bodydark">
                      {new Date(activity.lastMessageAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-bodydark dark:text-bodydark">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                      </svg>
                      <span>{activity.participants.length}</span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex h-full flex-col border-l border-stroke dark:border-strokedark xl:w-3/4 bg-white dark:bg-boxdark overflow-hidden">
          {selectedActivity && selectedActivityData ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center justify-between border-b border-stroke px-6 py-4 dark:border-strokedark bg-white dark:bg-boxdark flex-shrink-0">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
                    {selectedActivityData.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h5 className="font-semibold text-black dark:text-white">
                      {selectedActivityData.name}
                    </h5>
                    <p className="text-sm text-bodydark dark:text-bodydark flex items-center gap-2">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                      </svg>
                      <span>{selectedActivityData.participants.length} participants</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 bg-gray-2 dark:bg-boxdark-2">
                {messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center">
                    <div className="text-center">
                      <div className="mb-4 h-20 w-20 mx-auto rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                        <svg className="w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <p className="text-bodydark dark:text-bodydark font-medium">No messages yet</p>
                      <p className="text-sm text-bodydark dark:text-bodydark mt-1">Be the first to say hi! 👋</p>
                      <p className="text-xs text-bodydark dark:text-bodydark mt-2">Debug: {messages.length} messages loaded</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-xs text-bodydark dark:text-bodydark text-center mb-2">
                      Debug: Showing {messages.length} messages | Your ID: {currentUserId}
                    </div>
                    {messages.map((message) => (
                      <div
                        key={message._id}
                        className={`flex ${
                          message.senderId === currentUserId
                            ? 'justify-end'
                            : 'justify-start'
                        }`}
                      >
                        {message.type === 'system' ? (
                          <div className="w-full flex justify-center">
                            <div className="px-4 py-2 rounded-lg bg-gray-3 dark:bg-meta-4 text-bodydark dark:text-bodydark text-sm">
                              {message.content}
                            </div>
                          </div>
                        ) : (
                          <div
                            className={`max-w-[70%] ${
                              message.senderId === currentUserId
                                ? 'order-2'
                                : 'order-1'
                            }`}
                          >
                            {message.senderId !== currentUserId && (
                              <p className="text-xs font-medium text-bodydark dark:text-bodydark mb-1 px-1">
                                {message.senderName}
                              </p>
                            )}
                            <div
                              className={`rounded-2xl px-5 py-3 shadow-sm ${
                                message.senderId === currentUserId
                                  ? 'bg- text-black'
                                  : 'bg-white dark:bg-boxdark text-black dark:text-white border border-stroke dark:border-strokedark'
                              }`}
                            >
                              <p className="break-words">{message.content}</p>
                            </div>
                            <p
                              className={`mt-1 text-xs ${
                                message.senderId === currentUserId
                                  ? 'text-right'
                                  : 'text-left'
                              } text-bodydark dark:text-bodydark px-1`}
                            >
                              {new Date(message.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        )}
                      </div>
                ))}
                  </>
                )}
                <div ref={messagesEndRef} />

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex items-center gap-2 text-sm text-bodydark dark:text-bodydark px-1">
                    <span className="italic">{typingUser} is typing</span>
                    <div className="flex gap-1">
                      <span className="h-2 w-2 rounded-full bg-bodydark dark:bg-bodydark animate-bounce"></span>
                      <span className="h-2 w-2 rounded-full bg-bodydark dark:bg-bodydark animate-bounce [animation-delay:0.2s]"></span>
                      <span className="h-2 w-2 rounded-full bg-bodydark dark:bg-bodydark animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="border-t border-stroke bg-white px-6 py-4 dark:border-strokedark dark:bg-boxdark flex-shrink-0">
                <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      handleTyping();
                    }}
                    placeholder={`Message ${selectedActivityData.name}...`}
                    className="flex-1 rounded-lg border border-stroke bg-gray-2 dark:bg-meta-4 px-5 py-3 text-black dark:text-white outline-none focus:border-primary dark:focus:border-primary transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 font-medium text-white hover:bg-opacity-90 disabled:bg-bodydark disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center bg-gray-2 dark:bg-boxdark-2">
              <div className="text-center">
                <div className="mb-4 h-24 w-24 mx-auto rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                  <svg className="w-12 h-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                </div>
                <p className="text-bodydark dark:text-bodydark font-medium text-lg">Select an activity to start chatting</p>
                <p className="text-sm text-bodydark dark:text-bodydark mt-2">Choose an activity from the list to view messages</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}