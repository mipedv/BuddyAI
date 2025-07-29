import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);  // New state for password visibility
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            // Use the username field for login
            const response = await axios.post('http://localhost:8000/api/users/login/', {
                username: email,  // Note: using email as username
                password: password
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            // Store token and user data in local storage
            localStorage.setItem('token', response.data.access);
            localStorage.setItem('refresh_token', response.data.refresh);
            localStorage.setItem('user', JSON.stringify({
                username: email,
                class: '7th Standard'
            }));

            // Redirect to home page
            navigate('/home');
        } catch (err: any) {
            if (err.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                if (err.response.status === 401) {
                    setError('Invalid username or password. Please try again.');
                } else {
                    setError(`Login failed: ${err.response.data.detail || 'Unknown error'}`);
                }
            } else if (err.request) {
                // The request was made but no response was received
                setError('No response from server. Please check your network connection.');
            } else {
                // Something happened in setting up the request that triggered an Error
                setError('Error: ' + err.message);
            }
            console.error('Login error:', err);
        }
    };

    // Toggle password visibility
    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="flex h-screen font-sans bg-[#f5f4ef]">
            {/* Left Panel - Login Form */}
            <div className="w-full md:w-1/2 flex flex-col justify-center px-10 md:px-20 bg-[#f5f4ef] relative">
                {/* CBSE Syllabus Badge */}
                <div className="absolute top-4 right-4">
                    <div className="px-4 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        CBSE Syllabus
                    </div>
                </div>

                <div className="mb-8">
                    {/* Brand Logo - No Icon */}
                    <div className="flex items-center mb-4">
                        <h1 className="text-4xl font-bold">
                            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Buddy</span>{' '}
                            <span className="text-gray-800">AI</span>
                        </h1>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Login to Account</h2>
                    <p className="text-sm text-gray-600">with Email and Password</p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleLogin} className="space-y-4">
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                            {error}
                        </div>
                    )}
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Username:</label>
                        <input
                            type="text"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="zayan"
                            className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none bg-white"
                            required
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-sm font-medium text-gray-700">Password</label>
                            <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-800">
                                Forget Password?
                            </Link>
                        </div>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none bg-white pr-10"
                                required
                            />
                            <button
                                type="button"
                                onClick={togglePasswordVisibility}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.78zm4.261 4.262l1.514 1.514a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                                        <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.742L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.064 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="remember"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2" 
                        />
                        <label htmlFor="remember" className="text-sm text-gray-700">Remember Password</label>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-blue-700 to-blue-800 text-white py-3 px-4 rounded-lg hover:from-blue-800 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 font-medium"
                    >
                        Sign In
                    </button>

                    <p className="text-sm text-center mt-4 text-gray-600">
                        Don't have an account?{' '}
                        <Link to="/signup" className="text-blue-600 hover:text-blue-800 font-medium">
                            Create Account
                        </Link>
                    </p>
                </form>
            </div>

            {/* Right Panel - Illustration */}
            <div className="hidden md:block w-1/2 relative">
                <img 
                    src="/1.png"
                    alt="AI Teaching Classroom"
                    className="object-cover h-full w-full"
                />
            </div>
        </div>
    );
};

export default LoginPage; 