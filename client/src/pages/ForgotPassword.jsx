import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await fetch('http://localhost:3001/api/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            setSubmitted(true);
        } catch (err) {
            console.error("Failed to send reset link", err);
        }
    };

    return (
        <div className="min-h-screen bg-dark flex flex-col items-center justify-center p-4 text-light relative">
            <Link to="/login" className="absolute top-8 left-8 text-slate-400 hover:text-white transition-colors">
                <ArrowLeft className="w-6 h-6" />
            </Link>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full bg-slate-800/50 backdrop-blur-xl p-8 rounded-3xl border border-slate-700 shadow-2xl"
            >
                {!submitted ? (
                    <>
                        <h2 className="text-3xl font-bold text-white mb-2 text-center">Forgot Password?</h2>
                        <p className="text-slate-400 text-center mb-8">Enter your email to receive reset instructions.</p>

                        <form onSubmit={handleSubmit} className="space-y-6">
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
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/25 transition-all"
                            >
                                Send Reset Link
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="text-center py-8">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4"
                        >
                            <CheckCircle className="w-8 h-8" />
                        </motion.div>
                        <h3 className="text-2xl font-bold text-white mb-2">Check your inbox</h3>
                        <p className="text-slate-400 mb-8">
                            We've sent a password reset link to <span className="text-white font-medium">{email}</span>.
                        </p>
                        <Link
                            to="/login"
                            className="block w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition-colors"
                        >
                            Back to Login
                        </Link>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
