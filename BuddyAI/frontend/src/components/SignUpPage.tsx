import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

const SignUpPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post('http://localhost:8000/api/users/register/', {
        username,
        email,
        password,
      });
      console.log('Registration successful:', response.data);
      navigate('/login'); // Redirect to login page on successful registration
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        // Handle specific API errors
        setError('Registration failed. Please check your details and try again.');
        console.error('Registration error:', err.response.data);
      } else {
        setError('An unexpected error occurred. Please try again.');
        console.error('Unexpected error:', err);
      }
    }
  };

  return (
    <div className="flex h-screen font-sans">
      {/* Left Panel */}
      <div className="w-full md:w-1/2 flex flex-col justify-center px-10 md:px-20 bg-gray-50 relative">
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Homie</span>{' '}
              <span className="text-gray-800">AI</span>
            </h1>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Create Your Account</h2>
          <p className="text-sm text-gray-600">to start your learning journey</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username"
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none bg-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none bg-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a strong password"
              className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none bg-white"
              required
            />
          </div>
          
          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-700 to-blue-800 text-white py-3 px-4 rounded-lg hover:from-blue-800 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 font-medium"
          >
            Create Account
          </button>

          <p className="text-sm text-center mt-4 text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-800 font-medium">
              Sign In
            </Link>
          </p>
        </form>
      </div>

      {/* Right Panel (Image) */}
      <div className="hidden md:block w-1/2 relative">
        <img
                      src="/login-illustration.png"
          alt="AI Teaching Classroom"
          className="object-cover h-full w-full"
        />
      </div>
    </div>
  );
};

export default SignUpPage; 