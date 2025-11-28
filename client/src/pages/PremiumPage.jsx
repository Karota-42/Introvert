import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const PremiumPage = () => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const res = await fetch('http://localhost:3001/api/monetization/plans');
            const data = await res.json();
            setPlans(data.subscriptions);
            setLoading(false);
        } catch (err) {
            setError('Failed to load plans');
            setLoading(false);
        }
    };

    const handleSubscribe = async (planId) => {
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const res = await fetch('http://localhost:3001/api/monetization/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ planId })
            });
            const data = await res.json();

            if (res.ok) {
                alert(`Successfully subscribed to ${planId}!`);
                // Update local user data if needed or force refresh
                window.location.reload();
            } else {
                alert(data.error || 'Subscription failed');
            }
        } catch (err) {
            alert('Something went wrong');
        }
    };

    if (loading) return <div className="text-center mt-20 text-green-500">Loading plans...</div>;
    if (error) return <div className="text-center mt-20 text-red-500">{error}</div>;

    return (
        <div className="min-h-screen bg-black text-green-500 p-8 pt-24 font-mono">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-4xl font-bold mb-8 text-center glitch-text">UPGRADE YOUR ACCESS</h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {plans.map((plan) => (
                        <div key={plan.id} className="border border-green-500/30 bg-gray-900/50 p-6 rounded-lg hover:border-green-500 transition-all duration-300 flex flex-col">
                            <h2 className="text-2xl font-bold mb-2 text-green-400 uppercase">{plan.name}</h2>
                            <div className="text-3xl font-bold mb-6 text-white">
                                ₹{plan.price}<span className="text-sm text-gray-400 font-normal">/month</span>
                            </div>

                            <ul className="mb-8 flex-grow space-y-3">
                                {plan.benefits.map((benefit, index) => (
                                    <li key={index} className="flex items-start">
                                        <span className="mr-2 text-green-400">►</span>
                                        <span className="text-gray-300">{benefit}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => handleSubscribe(plan.id)}
                                className="w-full py-3 bg-green-600 hover:bg-green-500 text-black font-bold rounded uppercase tracking-wider transition-colors"
                            >
                                Initialize {plan.name}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PremiumPage;
