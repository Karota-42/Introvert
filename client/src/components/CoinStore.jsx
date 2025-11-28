import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CoinStore = ({ onClose }) => {
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    useEffect(() => {
        fetchPackages();
    }, []);

    const fetchPackages = async () => {
        try {
            const res = await fetch('http://localhost:3001/api/monetization/plans');
            const data = await res.json();
            setPackages(data.coinPackages);
            setLoading(false);
        } catch (err) {
            console.error('Failed to load coin packages');
            setLoading(false);
        }
    };

    const handleBuy = async (packageId) => {
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const res = await fetch('http://localhost:3001/api/monetization/buy-coins', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ packageId })
            });
            const data = await res.json();

            if (res.ok) {
                alert(`Successfully purchased coins! New balance: ${data.coins}`);
                window.location.reload();
            } else {
                alert(data.error || 'Purchase failed');
            }
        } catch (err) {
            alert('Something went wrong');
        }
    };

    if (loading) return <div className="p-4 text-green-500">Loading...</div>;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-green-500/50 rounded-lg max-w-2xl w-full p-6 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white"
                >
                    ✕
                </button>

                <h2 className="text-2xl font-bold mb-6 text-green-500 font-mono">ACQUIRE CREDITS</h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {packages.map((pkg) => (
                        <div key={pkg.id} className="border border-green-500/30 bg-black/40 p-4 rounded hover:bg-green-900/10 transition-colors text-center">
                            <div className="text-3xl font-bold text-yellow-400 mb-2">{pkg.coins}</div>
                            <div className="text-sm text-gray-400 mb-4">COINS</div>
                            <div className="text-xl font-bold text-white mb-4">₹{pkg.price}</div>
                            <button
                                onClick={() => handleBuy(pkg.id)}
                                className="w-full py-2 bg-green-600 hover:bg-green-500 text-black font-bold rounded text-sm uppercase"
                            >
                                Buy
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CoinStore;
