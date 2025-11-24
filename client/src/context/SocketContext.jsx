import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [user, setUser] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Connect to backend
        // In dev, Vite proxies /socket.io to localhost:3001
        // In prod, it should point to the server URL
        const newSocket = io('/', {
            transports: ['websocket'],
            autoConnect: true
        });

        newSocket.on('connect', () => {
            console.log('Connected to server:', newSocket.id);
            setIsConnected(true);
        });

        newSocket.on('disconnect', () => {
            console.log('Disconnected from server');
            setIsConnected(false);
        });

        newSocket.on('login_success', (userData) => {
            console.log('Logged in:', userData);
            setUser(userData);
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, []);

    const login = (username, country, interests, isPremium, targetCountry) => {
        if (socket) {
            socket.emit('login', { username, country, interests, isPremium, targetCountry });
        }
    };

    return (
        <SocketContext.Provider value={{ socket, isConnected, user, login }}>
            {children}
        </SocketContext.Provider>
    );
};
