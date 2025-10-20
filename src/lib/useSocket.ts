import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialize socket connection
    if (!socket) {
      socket = io(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', {
        path: '/api/socket',
      });

      socket.on('connect', () => {
        console.log('✅ Socket connected:', socket?.id);
        setIsConnected(true);
      });

      socket.on('disconnect', () => {
        console.log('❌ Socket disconnected');
        setIsConnected(false);
      });
    }

    return () => {
      // Don't disconnect on unmount, keep connection alive
    };
  }, []);

  // Join an activity chat room
  const joinActivity = (activityId: string) => {
    if (socket) {
      socket.emit('join-activity', activityId);
      console.log('🔵 Joined activity:', activityId);
    }
  };

  // Leave an activity chat room
  const leaveActivity = (activityId: string) => {
    if (socket) {
      socket.emit('leave-activity', activityId);
      console.log('🔴 Left activity:', activityId);
    }
  };

  // Emit typing event
  const emitTyping = (activityId: string, userName: string) => {
    if (socket) {
      socket.emit('typing', { activityId, userName });
    }
  };

  // Emit stop typing event
  const emitStopTyping = (activityId: string) => {
    if (socket) {
      socket.emit('stop-typing', { activityId });
    }
  };

  // Listen for new messages
  const onNewMessage = (callback: (message: any) => void) => {
    if (socket) {
      socket.on('new-message', callback);
    }
  };

  // Listen for typing events
  const onUserTyping = (callback: (data: { userName: string }) => void) => {
    if (socket) {
      socket.on('user-typing', callback);
    }
  };

  // Listen for stop typing events
  const onUserStoppedTyping = (callback: () => void) => {
    if (socket) {
      socket.on('user-stopped-typing', callback);
    }
  };

  // Listen for user joined activity
  const onUserJoined = (callback: (data: { userName: string }) => void) => {
    if (socket) {
      socket.on('user-joined-activity', callback);
    }
  };

  // Listen for user left activity
  const onUserLeft = (callback: (data: { userName: string }) => void) => {
    if (socket) {
      socket.on('user-left-activity', callback);
    }
  };

  // Remove listeners
  const offNewMessage = () => {
    if (socket) socket.off('new-message');
  };

  const offUserTyping = () => {
    if (socket) socket.off('user-typing');
  };

  const offUserStoppedTyping = () => {
    if (socket) socket.off('user-stopped-typing');
  };

  const offUserJoined = () => {
    if (socket) socket.off('user-joined-activity');
  };

  const offUserLeft = () => {
    if (socket) socket.off('user-left-activity');
  };

  return {
    socket,
    isConnected,
    joinActivity,
    leaveActivity,
    emitTyping,
    emitStopTyping,
    onNewMessage,
    onUserTyping,
    onUserStoppedTyping,
    onUserJoined,
    onUserLeft,
    offNewMessage,
    offUserTyping,
    offUserStoppedTyping,
    offUserJoined,
    offUserLeft,
  };
};