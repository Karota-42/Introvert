import React, { useMemo } from 'react';

const Avatar = ({ seed, className = "w-12 h-12" }) => {
    // Generate a consistent color based on seed
    const color = useMemo(() => {
        const colors = [
            'bg-red-500', 'bg-orange-500', 'bg-amber-500',
            'bg-green-500', 'bg-emerald-500', 'bg-teal-500',
            'bg-cyan-500', 'bg-sky-500', 'bg-blue-500',
            'bg-indigo-500', 'bg-violet-500', 'bg-purple-500',
            'bg-fuchsia-500', 'bg-pink-500', 'bg-rose-500'
        ];
        let hash = 0;
        for (let i = 0; i < seed.length; i++) {
            hash = seed.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    }, [seed]);

    const initials = seed.substring(0, 2).toUpperCase();

    return (
        <div className={`${className} ${color} rounded-full flex items-center justify-center text-white font-bold shadow-lg`}>
            {initials}
        </div>
    );
};

export default Avatar;
