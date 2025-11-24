import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageCircle, User, LogIn } from 'lucide-react';

const Welcome = () => {
    return (
        <div className="min-h-screen bg-dark flex flex-col items-center justify-center p-4 text-light relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="z-10 max-w-md w-full text-center space-y-8"
            >
                <div>
                    <h1 className="text-6xl font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">
                        Introvert
                    </h1>
                    <p className="text-xl text-slate-400">
                        The anonymous chat for the rest of us.
                    </p>
                </div>

                <div className="space-y-4">
                    <Link
                        to="/guest"
                        className="block w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/25 transition-transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-2"
                    >
                        <MessageCircle className="w-5 h-5" />
                        <span>Chat Anonymously</span>
                    </Link>

                    <div className="grid grid-cols-2 gap-4">
                        <Link
                            to="/login"
                            className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-xl border border-slate-700 transition-colors flex items-center justify-center space-x-2"
                        >
                            <LogIn className="w-5 h-5" />
                            <span>Login</span>
                        </Link>
                        <Link
                            to="/signup"
                            className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-xl border border-slate-700 transition-colors flex items-center justify-center space-x-2"
                        >
                            <User className="w-5 h-5" />
                            <span>Sign Up</span>
                        </Link>
                    </div>
                </div>

                <p className="text-xs text-slate-600">
                    By continuing, you agree to our Terms & Privacy Policy.
                </p>
            </motion.div>
        </div>
    );
};

export default Welcome;
