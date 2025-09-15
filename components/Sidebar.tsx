import React, { useContext } from 'react';
import { NavItemType } from '../types';
import { NAV_ITEMS } from '../constants';
import { AppContext } from '../contexts/AppContext';

const Logo = () => (
    <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-10 h-10 flex-shrink-0">
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <path d="M50 50C-1.39665 116.397 -1.39665 -16.3967 50 50Z" fill="url(#paint0_linear_logo)"/>
                <path d="M50 50C101.397 -16.3967 -1.39665 -16.3967 50 50Z" fill="url(#paint1_linear_logo)"/>
                <path d="M50 50C101.397 116.397 101.397 -16.3967 50 50Z" fill="url(#paint2_linear_logo)"/>
                <path d="M50 50C-1.39665 116.397 101.397 116.397 50 50Z" fill="url(#paint3_linear_logo)"/>
                <path d="M50 15C50 26.0457 51.8954 32.0457 53.3431 37.1213C55.1213 43.1213 59.8787 47.8787 65.8787 49.6569C70.9543 51.1046 75.9543 52 85 52C73.9543 52 68.9543 52.8954 64.8787 54.3431C58.8787 56.1213 54.1213 60.8787 52.3431 66.8787C50.8954 70.9543 50 76.9543 50 88C50 76.9543 49.1046 70.9543 47.6569 66.8787C45.8787 60.8787 41.1213 56.1213 35.1213 54.3431C30.0457 52.8954 25.0457 52 15 52C26.0457 52 31.0457 51.1046 36.1213 49.6569C42.1213 47.8787 46.8787 43.1213 48.6569 37.1213C50.1046 32.0457 50 26.0457 50 15Z" fill="white" fillOpacity="0.9"/>
                <defs>
                    <linearGradient id="paint0_linear_logo" x1="-1.39665" y1="50" x2="50" y2="-16.3967" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#3B82F6"/>
                        <stop offset="1" stopColor="#6366F1"/>
                    </linearGradient>
                    <linearGradient id="paint1_linear_logo" x1="50" y1="-16.3967" x2="101.397" y2="50" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#D946EF"/>
                        <stop offset="1" stopColor="#F472B6"/>
                    </linearGradient>
                    <linearGradient id="paint2_linear_logo" x1="101.397" y1="50" x2="50" y2="116.397" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#F97316"/>
                        <stop offset="1" stopColor="#F59E0B"/>
                    </linearGradient>
                    <linearGradient id="paint3_linear_logo" x1="50" y1="116.397" x2="-1.39665" y2="50" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#A855F7"/>
                        <stop offset="1" stopColor="#6366F1"/>
                    </linearGradient>
                </defs>
            </svg>
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">AI Animation Suite</h1>
    </div>
);

const Sidebar: React.FC = () => {
    const {
        activeView,
        setActiveView,
        isDirty,
    } = useContext(AppContext);

    const handleNavigation = (viewId: NavItemType) => {
        if (viewId === activeView) {
            return;
        }

        if (isDirty) {
            if (!window.confirm("You have unsaved changes that will be lost. Are you sure you want to leave this page?")) {
                return;
            }
        }
        setActiveView(viewId);
    };

    return (
        <nav className="w-64 h-full bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl border-r border-slate-200 dark:border-slate-800 flex flex-col p-4 transition-colors duration-300">
            <Logo />
            <ul className="flex flex-col space-y-2">
                {NAV_ITEMS.map((item) => (
                    <li key={item.id}>
                        <button
                            onClick={() => handleNavigation(item.id)}
                            className={`flex items-center w-full text-left p-3 rounded-lg transition-all duration-200 group ${
                                activeView === item.id
                                ? 'bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-500/30'
                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            <span className={`mr-3 transition-colors duration-200 ${activeView !== item.id && 'group-hover:text-fuchsia-500'}`}>{item.icon}</span>
                            <span className="font-medium">{item.label}</span>
                        </button>
                    </li>
                ))}
            </ul>
            <div className="mt-auto text-center text-slate-500 dark:text-slate-500 text-xs">
                <p>Powered by Gemini & Imagen 3</p>
                <p>&copy; 2024</p>
            </div>
        </nav>
    );
};

export default Sidebar;