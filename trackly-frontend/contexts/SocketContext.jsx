'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'react-hot-toast';
import jwt from 'jsonwebtoken';

const SocketContext = createContext();

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      console.log('No token found, skipping socket connection');
      return;
    }

    try {
      // Decode the token to get user ID
      const decoded = jwt.decode(token);
      const userId = decoded?.id;

      if (!userId) {
        console.error('No user ID found in token');
        return;
      }

      console.log('Connecting socket for user:', userId);

      const socketInstance = io('http://localhost:5000', {
        query: { userId },
        extraHeaders: {
          Authorization: `Bearer ${token}`
        },
        transports: ['polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000,
        forceNew: true,
        autoConnect: true,
        path: '/socket.io/',
        withCredentials: true
      });

      socketInstance.on('connect', () => {
        console.log('Socket connected successfully');
        // After successful connection, try to upgrade to WebSocket
        socketInstance.io.engine.on('upgrade', () => {
          console.log('Transport upgraded to WebSocket');
        });
      });

      socketInstance.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        console.error('Error details:', {
          message: error.message,
          description: error.description,
          type: error.type,
          context: error.context
        });
      });

      socketInstance.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        if (reason === 'io server disconnect') {
          socketInstance.connect();
        }
      });

      socketInstance.on('task:assigned', (data) => {
        console.log('Received task assignment:', data);
        toast.success(`New task assigned: ${data.title}`, {
          duration: 5000,
          position: 'top-right',
          style: {
            background: '#333',
            color: '#fff',
          },
        });
      });

      setSocket(socketInstance);

      return () => {
        console.log('Cleaning up socket connection');
        socketInstance.disconnect();
      };
    } catch (error) {
      console.error('Error setting up socket:', error);
    }
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
} 