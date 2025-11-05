import React, { useState } from 'react';
import { saveUserToFirebase } from '../src/firebase/firebaseService';

interface AuthPageProps {
    onAuthSuccess: (userId: string, username: string) => void;
    onBack?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess, onBack }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Validations
        if (!username || !password) {
            setError('Please fill in all fields');
            setLoading(false);
            return;
        }

        if (username.length < 3) {
            setError('Username must be at least 3 characters');
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            setLoading(false);
            return;
        }

        if (!isLogin && password !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            if (isLogin) {
                // Login
                const users = JSON.parse(localStorage.getItem('poker_users') || '{}');
                const user = users[username];

                if (!user) {
                    setError('User not found');
                    setLoading(false);
                    return;
                }

                if (user.password !== password) {
                    setError('Incorrect password');
                    setLoading(false);
                    return;
                }

                // Login bem-sucedido
                localStorage.setItem('poker_current_user', JSON.stringify({
                    userId: user.id,
                    username: username
                }));
                onAuthSuccess(user.id, username);
            } else {
                // Cadastro
                const users = JSON.parse(localStorage.getItem('poker_users') || '{}');

                if (users[username]) {
                    setError('Username already exists');
                    setLoading(false);
                    return;
                }

                // Criar novo usuário
                const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                users[username] = {
                    id: userId,
                    password: password,
                    createdAt: new Date().toISOString()
                };

                localStorage.setItem('poker_users', JSON.stringify(users));
                localStorage.setItem('poker_current_user', JSON.stringify({
                    userId: userId,
                    username: username
                }));

                // Salvar usuário no Firebase
                try {
                    console.log('🔄 Attempting to save user to Firebase...', { userId, username });
                    await saveUserToFirebase(userId, username);
                    console.log('✅ ☁️ User saved to Firebase successfully!');
                    console.log('📊 Firebase Status: SYNCED ✓');
                } catch (firebaseError: any) {
                    console.error('❌ FIREBASE ERROR - Failed to save user:', {
                        error: firebaseError,
                        message: firebaseError?.message,
                        code: firebaseError?.code,
                        userId,
                        username
                    });
                    console.warn('⚠️ User saved to localStorage only (not synced to cloud)');
                    console.warn('💡 Check Firebase rules and network connection');
                    console.warn('📖 See DATABASE_DIAGNOSTIC.md for troubleshooting');
                    // Continue even if Firebase fails (localStorage as fallback)
                }

                onAuthSuccess(userId, username);
            }
        } catch (err) {
            setError('Failed to process request');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Back button */}
                {onBack && (
                    <div className="mb-4">
                        <button
                            onClick={onBack}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-800/70 hover:bg-gray-700/70 text-gray-300 hover:text-white rounded-lg transition-colors border border-gray-700"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back
                        </button>
                    </div>
                )}
                
                {/* Login/Register card */}
                <div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700 p-8">
                    {/* Logo/Título */}
                    <div className="text-center mb-8">
                        <div className="inline-block bg-gradient-to-r from-teal-500 to-blue-500 rounded-full p-3 mb-4">
                            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">
                            {isLogin ? 'Welcome back!' : 'Create account'}
                        </h1>
                        <p className="text-gray-400">
                            {isLogin ? 'Sign in to continue training' : 'Sign up to get started'}
                        </p>
                    </div>

                    {/* Formulário */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Username */}
                        <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                    Username
                            </label>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                placeholder="Enter your username"
                                disabled={loading}
                            />
                        </div>

                        {/* Password */}
                        <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                placeholder="Enter your password"
                                disabled={loading}
                            />
                        </div>

                        {/* Confirm Password (apenas no cadastro) */}
                        {!isLogin && (
                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                                    Confirm password
                                </label>
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                    placeholder="Confirm your password"
                                    disabled={loading}
                                />
                            </div>
                        )}

                        {/* Mensagem de erro */}
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
                                <p className="text-red-400 text-sm text-center">{error}</p>
                            </div>
                        )}

                        {/* Botão de submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Processing...
                                </span>
                            ) : (
                                isLogin ? 'Sign in' : 'Create account'
                            )}
                        </button>
                    </form>

                    {/* Toggle between Login and Register */}
                    <div className="mt-6 text-center">
                        <p className="text-gray-400">
                            {isLogin ? "Don't have an account?" : 'Already have an account?'}
                            {' '}
                            <button
                                type="button"
                                onClick={() => {
                                    setIsLogin(!isLogin);
                                    setError('');
                                    setPassword('');
                                    setConfirmPassword('');
                                }}
                                className="text-teal-400 hover:text-teal-300 font-semibold transition-colors"
                            >
                                {isLogin ? 'Sign up' : 'Sign in'}
                            </button>
                        </p>
                    </div>
                </div>

                {/* Informações adicionais */}
                <div className="mt-6 text-center">
                    <p className="text-gray-500 text-sm">
                        🔒 Your data is stored locally in your browser
                    </p>
                </div>
            </div>
        </div>
    );
};
