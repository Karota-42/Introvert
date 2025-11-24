import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Lock, AlertCircle } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

const Login = () => {
    const navigate = useNavigate();
    const { login } = useSocket();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';
            const response = await fetch(`${serverUrl}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            // Store token and user data
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Login to socket with user data
            login(data.user.username, data.user.country, data.user.interests, data.user.isPremium, 'GLOBAL');

            navigate('/chat');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-dark flex flex-col items-center justify-center p-4 text-light relative">
            <Link to="/" className="absolute top-8 left-8 text-slate-400 hover:text-white transition-colors">
                <ArrowLeft className="w-6 h-6" />
            </Link>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full bg-slate-800/50 backdrop-blur-xl p-8 rounded-3xl border border-slate-700 shadow-2xl"
            >
                <h2 className="text-3xl font-bold text-white mb-6 text-center">Welcome Back</h2>

                {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-xl flex items-center gap-2 text-red-400">
                        <AlertCircle className="w-5 h-5" />
                        <span className="text-sm">{error}</span>
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="you@example.com"
                                required
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="••••••••"
                                required
                                disabled={loading}
                            />
                        </div>
                        <div className="flex justify-end mt-2">
                            <Link to="/forgot-password" className="text-xs text-primary hover:text-primary/80 transition-colors">
                                Forgot Password?
                            </Link>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Logging in...' : 'Log In'}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-slate-400">
                    Don't have an account? <Link to="/signup" className="text-primary hover:underline">Sign up</Link>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
