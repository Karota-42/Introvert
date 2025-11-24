import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Globe, Lock, Star, User } from 'lucide-react';

const COUNTRIES = ['USA', 'UK', 'Canada', 'Australia', 'India', 'Germany', 'France', 'Japan', 'Brazil'];

const Home = ({ onStart }) => {
    const { login, user } = useSocket();
    const navigate = useNavigate();

    const [username, setUsername] = useState(user?.username || '');
    const [country, setCountry] = useState(user?.country || COUNTRIES[0]);
    const [interests, setInterests] = useState(user?.interests?.join(', ') || '');
    const [isPremium, setIsPremium] = useState(user?.isPremium || false);
    const [targetCountry, setTargetCountry] = useState(user?.targetCountry || 'GLOBAL');

    useEffect(() => {
        if (!user) {
            // Generate random username only if not logged in
            const randomId = Math.floor(Math.random() * 10000);
            setUsername(`User${randomId}`);
        }
    }, [user]);

    useEffect(() => {
        if (user && !onStart) {
            // If user is set and we are NOT in the MainHandler (onStart is missing),
            // it means we are in /guest and just logged in.
            navigate('/chat');
        }
    }, [user, onStart, navigate]);

    const handleStart = () => {
        if (onStart) {
            // Already logged in (Authenticated flow)
            onStart();
        } else {
            // Guest flow (Login first)
            const interestList = interests.split(',').map(i => i.trim()).filter(i => i);
            login(username, country, interestList, isPremium, targetCountry);
        }
    };

    return (
        <div className="min-h-screen bg-dark flex flex-col items-center justify-center p-4 text-light relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-10 left-10 w-64 h-64 bg-primary/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-10 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="z-10 max-w-md w-full bg-slate-800/50 backdrop-blur-xl p-8 rounded-3xl border border-slate-700 shadow-2xl"
            >
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
                        Introvert
                    </h1>
                    <p className="text-slate-400">Connect anonymously. Chat freely.</p>
                </div>

                <div className="space-y-6">
                    {/* Avatar & Username */}
                    <div className="flex items-center space-x-4 bg-slate-900/50 p-4 rounded-2xl border border-slate-700">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-xl font-bold">
                            {username.substring(0, 1)}
                        </div>
                        <div className="flex-1">
                            <label className="text-xs text-slate-500 uppercase font-bold tracking-wider">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-transparent border-none focus:ring-0 text-lg font-medium text-white p-0"
                            />
                        </div>
                    </div>

                    {/* Country Selection */}
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Your Location</label>
                        <div className="relative">
                            <Globe className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                            <select
                                value={country}
                                onChange={(e) => setCountry(e.target.value)}
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-primary focus:border-transparent appearance-none"
                            >
                                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Interests */}
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Interests (Optional)</label>
                        <input
                            type="text"
                            placeholder="coding, music, gaming..."
                            value={interests}
                            onChange={(e) => setInterests(e.target.value)}
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </div>

                    {/* Premium Toggle */}
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl border border-slate-700">
                        <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${isPremium ? 'bg-yellow-500/20 text-yellow-500' : 'bg-slate-700 text-slate-400'}`}>
                                <Star className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className={`font-bold ${isPremium ? 'text-yellow-500' : 'text-slate-300'}`}>Premium</h3>
                                <p className="text-xs text-slate-500">Global match & Friends</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={isPremium} onChange={(e) => setIsPremium(e.target.checked)} className="sr-only peer" />
                            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-primary peer-checked:to-secondary"></div>
                        </label>
                    </div>

                    {/* Premium Options */}
                    {isPremium && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            className="overflow-hidden"
                        >
                            <label className="block text-sm font-medium text-yellow-500 mb-2">Target Location</label>
                            <select
                                value={targetCountry}
                                onChange={(e) => setTargetCountry(e.target.value)}
                                className="w-full bg-slate-900/50 border border-yellow-500/50 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                            >
                                <option value="GLOBAL">Global (Anywhere)</option>
                                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </motion.div>
                    )}

                    <button
                        onClick={handleStart}
                        className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/25 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Start Chatting
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default Home;
