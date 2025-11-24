import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, MoreVertical, Flag, UserPlus, RefreshCw } from 'lucide-react';
import Avatar from '../components/Avatar';

const Chat = () => {
    const { socket, user } = useSocket();
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [partner, setPartner] = useState(null);
    const [status, setStatus] = useState('SEARCHING'); // SEARCHING, CHATTING, DISCONNECTED
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (!socket) return;

        // Start searching immediately
        socket.emit('find_match');

        socket.on('match_found', ({ roomId }) => {
            setStatus('CHATTING');
            setMessages([]); // Clear previous chat
        });

        socket.on('partner_info', (data) => {
            setPartner(data);
        });

        socket.on('receive_message', (msg) => {
            setMessages((prev) => [...prev, { ...msg, isSelf: false }]);
        });

        socket.on('partner_disconnected', () => {
            setStatus('DISCONNECTED');
            setPartner(null);
        });

        return () => {
            socket.off('match_found');
            socket.off('partner_info');
            socket.off('receive_message');
            socket.off('partner_disconnected');
        };
    }, [socket]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = (e) => {
        e.preventDefault();
        if (!inputText.trim() || status !== 'CHATTING') return;

        const msg = {
            text: inputText,
            senderId: socket.id,
            timestamp: new Date().toISOString(),
            isSelf: true
        };

        socket.emit('send_message', { text: inputText });
        setMessages((prev) => [...prev, msg]);
        setInputText('');
    };

    const handleSkip = () => {
        socket.emit('skip_user');
        setStatus('SEARCHING');
        setPartner(null);
        setMessages([]);
        socket.emit('find_match'); // Auto search next
    };

    return (
        <div className="h-screen bg-dark flex flex-col relative overflow-hidden">
            {/* Header */}
            <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 p-4 flex items-center justify-between z-20">
                <div className="flex items-center space-x-3">
                    {partner ? (
                        <>
                            <Avatar seed={partner.username} className="w-10 h-10" />
                            <div>
                                <h2 className="font-bold text-white">{partner.username}</h2>
                                <p className="text-xs text-slate-400">{partner.country} • {partner.interests?.join(', ') || 'No interests'}</p>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center space-x-3 animate-pulse">
                            <div className="w-10 h-10 bg-slate-700 rounded-full"></div>
                            <div>
                                <div className="h-4 w-24 bg-slate-700 rounded mb-1"></div>
                                <div className="h-3 w-16 bg-slate-800 rounded"></div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center space-x-2">
                    {user?.isPremium && (
                        <button className="p-2 text-slate-400 hover:text-yellow-500 transition-colors" title="Add Friend">
                            <UserPlus className="w-5 h-5" />
                        </button>
                    )}
                    <button className="p-2 text-slate-400 hover:text-red-500 transition-colors" title="Report">
                        <Flag className="w-5 h-5" />
                    </button>
                    <button
                        onClick={handleSkip}
                        className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                    >
                        <RefreshCw className={`w-4 h-4 ${status === 'SEARCHING' ? 'animate-spin' : ''}`} />
                        <span>{status === 'SEARCHING' ? 'Searching...' : 'Skip'}</span>
                    </button>
                </div>
            </header>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 relative">
                {status === 'SEARCHING' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                        <div className="w-16 h-16 border-4 border-slate-700 border-t-primary rounded-full animate-spin mb-4"></div>
                        <p>Looking for a stranger...</p>
                    </div>
                )}

                {status === 'DISCONNECTED' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 bg-dark/50 z-10">
                        <p className="mb-4">Stranger disconnected.</p>
                        <button
                            onClick={handleSkip}
                            className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-full font-bold shadow-lg transition-transform hover:scale-105"
                        >
                            Find New Match
                        </button>
                    </div>
                )}

                <AnimatePresence>
                    {messages.map((msg, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            className={`flex ${msg.isSelf ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[80%] px-4 py-3 rounded-2xl shadow-sm ${msg.isSelf
                                        ? 'bg-gradient-to-br from-primary to-indigo-600 text-white rounded-br-none'
                                        : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
                                    }`}
                            >
                                <p>{msg.text}</p>
                                <p className={`text-[10px] mt-1 ${msg.isSelf ? 'text-indigo-200' : 'text-slate-500'} text-right`}>
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-slate-900/80 backdrop-blur-md border-t border-slate-800">
                <form onSubmit={sendMessage} className="flex items-center space-x-2 max-w-4xl mx-auto">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder={status === 'CHATTING' ? "Type a message..." : "Waiting for match..."}
                        disabled={status !== 'CHATTING'}
                        className="flex-1 bg-slate-800 border border-slate-700 rounded-full px-6 py-3 text-white focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <button
                        type="submit"
                        disabled={!inputText.trim() || status !== 'CHATTING'}
                        className="p-3 bg-primary hover:bg-primary/90 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:scale-100"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Chat;
