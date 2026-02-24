// App.jsx
import React, { useState, useEffect } from 'react';
import { auth } from './firebasejs/config';
import { onAuthStateChanged } from 'firebase/auth';
import './App.css';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check authentication status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      
      // If user is logged in and on home/login/signup, redirect to dashboard
      if (currentUser && ['home', 'login', 'signup'].includes(currentPage)) {
        setCurrentPage('dashboard');
      }
      // If user is not logged in and on dashboard, redirect to home
      else if (!currentUser && currentPage === 'dashboard') {
        setCurrentPage('home');
      }
    });

    return () => unsubscribe();
  }, [currentPage]);

  const handleNavigate = (page) => {
    console.log('Navigating to:', page);
    
    // Protect dashboard route
    if (page === 'dashboard' && !user) {
      setCurrentPage('login');
    } else {
      setCurrentPage(page);
    }
  };

  const renderPage = () => {
    console.log('Rendering page:', currentPage, 'User:', user?.email);
    
    switch (currentPage) {
      case 'login':
        return <Login onNavigate={handleNavigate} />;
      case 'signup':
        return <Signup onNavigate={handleNavigate} />;
      case 'dashboard':
        // Pass user data to dashboard if needed
        return <Dashboard onNavigate={handleNavigate} user={user} />;
      case 'home':
      default:
        return <Home onNavigate={handleNavigate} />;
    }
  };

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading PrimeSmsHub...</p>
      </div>
    );
  }

  return (
    <div className="App">
      {renderPage()}
    </div>
  );
}

export default App;