import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const HeaderRight: React.FC = () => {
    const [user, setUser] = useState({
        name: '',
        class: ''
    });
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Retrieve user data from local storage or authentication context
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser({
                name: parsedUser.username || 'User',
                class: parsedUser.class || '7th Standard'
            });
        }
    }, []);

    const handleLogout = () => {
        // Clear user data from local storage
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        // Redirect to login page
        navigate('/login');
    };

    return (
        <div className="flex items-center gap-x-6 bg-[#f6f6f1] p-2 rounded-lg">
            {/* Notification Bell */}
            <div className="relative">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-500">
                    <path d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.36 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.63 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16Z" fill="currentColor"/>
                </svg>
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">6</span>
            </div>

            {/* Language Selector */}
            <div className="flex items-center gap-x-2 bg-white rounded-full px-3 py-1 hover:bg-gray-100 transition">
                <img 
                    src="https://flagcdn.com/w40/ae.png" 
                    alt="UAE Flag" 
                    className="w-6 h-4 rounded"
                />
                <span className="text-sm">English</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 10l5 5 5-5z" fill="currentColor"/>
                </svg>
            </div>

            {/* User Profile */}
            <div 
                className="relative flex items-center gap-x-2 cursor-pointer"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
                <img 
                    src="/boy.png" 
                    alt="User Profile" 
                    className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                    <p className="font-bold text-sm">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.class}</p>
                </div>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 10l5 5 5-5z" fill="currentColor"/>
                </svg>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-white shadow-lg rounded-lg z-50">
                        <ul className="py-1">
                            <li 
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                onClick={() => navigate('/profile')}
                            >
                                My Profile
                            </li>
                            <li 
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                onClick={() => {/* Navigate to settings */}}
                            >
                                Settings
                            </li>
                            <li 
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-red-500"
                                onClick={handleLogout}
                            >
                                Logout
                            </li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HeaderRight; 