// dashboard.jsx
import React, { useState, useEffect } from 'react';
// REMOVE: import { useNavigate } from 'react-router-dom';
import { auth, db } from '/src/firebasejs/config';
import { signOut } from 'firebase/auth';
import {
  doc, getDoc, setDoc, updateDoc,
  collection, addDoc, query, where, getDocs, serverTimestamp
} from 'firebase/firestore';
import './Dashboard.css';

const Dashboard = ({ onNavigate, user }) => {  // Add onNavigate and user props
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState({ fullName: 'User', wallet: 0 });
  const [transactions, setTransactions] = useState([]);
  const [activeNumbers, setActiveNumbers] = useState([]);
  const [paystackKey, setPaystackKey] = useState('pk_live_639470fbe710a9b3503068dd875e4b027bd096fe');
  
  // Form states
  const [amount, setAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [loading, setLoading] = useState(false);
  const [showNumbers, setShowNumbers] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);

  // 5sim states
  const [countries, setCountries] = useState([]);
  const [operators, setOperators] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedOperator, setSelectedOperator] = useState('');
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState('');
  const [smsMessages, setSmsMessages] = useState([]);
  const [selectedNumber, setSelectedNumber] = useState(null);

  // Load user data when component mounts or user changes
  useEffect(() => {
    if (user) {
      setCurrentUser(user);
      loadUserData(user);
      loadPaystackKey();
      loadTransactions(user);
      loadActiveNumbers(user);
      loadCountries();
    }
  }, [user]);

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [sidebarOpen]);

  const loadUserData = async (user) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        const newUserData = {
          email: user.email,
          fullName: user.displayName || user.email?.split('@')[0] || 'User',
          phone: '',
          country: '',
          address: '',
          wallet: 0,
          createdAt: serverTimestamp()
        };
        await setDoc(userRef, newUserData);
        setUserData(newUserData);
      } else {
        setUserData(userSnap.data());
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadPaystackKey = async () => {
    console.log('Using Paystack key:', paystackKey);
  };

  const loadTransactions = async (user) => {
    try {
      const q = query(
        collection(db, 'transactions'), 
        where('uid', '==', user.uid)
      );
      const snap = await getDocs(q);
      const txList = [];
      snap.forEach(doc => {
        const data = doc.data();
        txList.push({ 
          id: doc.id, 
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date()
        });
      });
      // Sort by date descending
      txList.sort((a, b) => b.createdAt - a.createdAt);
      setTransactions(txList);
      setShowTransactions(txList.length > 0);
    } catch (e) {
      console.error('Error loading transactions:', e);
    }
  };

  const loadActiveNumbers = async (user) => {
    try {
      const q = query(collection(db, 'activeNumbers'), where('uid', '==', user.uid));
      const snap = await getDocs(q);
      const numbers = [];
      snap.forEach(doc => {
        const data = doc.data();
        numbers.push({ 
          id: doc.id, 
          ...data,
          purchasedAt: data.purchasedAt?.toDate?.() || new Date()
        });
      });
      setActiveNumbers(numbers);
      setShowNumbers(numbers.length > 0);
    } catch (e) {
      console.error('Error loading active numbers:', e);
    }
  };

  // 5sim Functions
  const loadCountries = async () => {
    // Mock data for now - replace with actual API call later
    setCountries(['Russia', 'Ukraine', 'Kazakhstan', 'USA', 'UK']);
  };

  const loadOperators = async (country) => {
    // Mock data for now
    setOperators(['MTS', 'Beeline', 'Megafon', 'Tele2']);
  };

  const loadServices = async (country, operator) => {
    // Mock data for now
    setServices(['WhatsApp', 'Telegram', 'Viber', 'Facebook', 'Google']);
  };

  const handleBuyNumber = async () => {
    if (!selectedCountry || !selectedOperator || !selectedService) {
      alert('Please select country, operator, and service');
      return;
    }

    if (userData.wallet < 1) {
      alert('Insufficient balance. Please fund your wallet first.');
      return;
    }

    setLoading(true);
    
    // Mock purchase for now
    setTimeout(() => {
      const mockPhone = '+7' + Math.floor(Math.random() * 1000000000);
      alert(`✅ Number purchased successfully: ${mockPhone}`);
      setSelectedCountry('');
      setSelectedOperator('');
      setSelectedService('');
      setLoading(false);
    }, 1000);
  };

  const handlePaystackPayment = () => {
    if (!amount || parseFloat(amount) < 1) {
      alert('Please enter a valid amount (minimum $1)');
      return;
    }
    if (!phoneNumber) {
      alert('Please enter your phone number');
      return;
    }

    // Mock payment for now
    alert(`Payment processing for $${amount}...`);
    
    // Simulate successful payment
    setTimeout(() => {
      const newWallet = (userData.wallet || 0) + parseFloat(amount);
      setUserData({ ...userData, wallet: newWallet });
      alert(`✅ Wallet funded successfully with $${amount}`);
      setAmount('');
      setPhoneNumber('');
      setCurrency('USD');
    }, 1000);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      if (onNavigate) {
        onNavigate('home');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleNavigation = (page) => {
    if (onNavigate) {
      onNavigate(page);
    }
    setSidebarOpen(false);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="head">
        <div className="menu-icon" onClick={() => setSidebarOpen(true)}>☰</div>
        <div className="log">
          <img src="/hero.png" alt="PrimeSmsHub" />
        </div>
        <div className="header-right">
          <button className="wallet-btn">
            Wallet: ${(userData.wallet || 0).toFixed(2)}
          </button>
          <a href="#" onClick={(e) => { e.preventDefault(); handleNavigation('profile'); }} className="profile-link" title="Profile">👤</a>
        </div>
      </div>

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="close-btn" onClick={() => setSidebarOpen(false)}>✕</div>
        <nav>
          <ul>
            <li>
              <a href="#" onClick={(e) => { e.preventDefault(); handleNavigation('dashboard'); }}>
                <span>🏠</span>Dashboard
              </a>
            </li>
            <li>
              <a href="#" onClick={(e) => { e.preventDefault(); handleNavigation('buy-numbers'); }}>
                <span>📱</span>Buy Numbers
              </a>
            </li>
            <li>
              <a href="#" onClick={(e) => { e.preventDefault(); handleNavigation('usa-numbers'); }}>
                <span>🇺🇸</span>USA Numbers
              </a>
            </li>
            <li>
              <a href="#" onClick={(e) => { e.preventDefault(); handleNavigation('my-orders'); }}>
                <span>📦</span>My Orders 
                <span className="badge">{activeNumbers.length}</span>
              </a>
            </li>
            <li>
              <a href="#" onClick={(e) => { e.preventDefault(); handleNavigation('transactions'); }}>
                <span>💳</span>My Transactions 
                <span className="badge">{transactions.length}</span>
              </a>
            </li>
            <li>
              <a href="#" onClick={(e) => { e.preventDefault(); handleNavigation('support'); }}>
                <span>❓</span>Support
              </a>
            </li>
            <li>
              <a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }}>
                <span>🚪</span>Logout
              </a>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="overlay show" onClick={() => setSidebarOpen(false)}></div>
      )}

      {/* Main Content */}
      <div className="container">
        {/* Hero Section */}
        <div className="hero">
          <h1>Welcome, <span>{userData.fullName}</span>! 👋</h1>
          <p>Verify more for less with virtual phone numbers</p>
          <div className="wallet-amount">
            ${(userData.wallet || 0).toFixed(2)}
          </div>
          <p style={{ fontSize: '14px', opacity: 0.9 }}>Current Wallet Balance</p>
        </div>

        {/* Features */}
        <div className="feature">
          <div className="feature-cad">
            <div className="icon">🔒</div>
            <h4>Secure</h4>
            <p>Protected transactions</p>
          </div>
          <div className="feature-cad">
            <div className="icon">⚡</div>
            <h4>Instant</h4>
            <p>Immediate activation</p>
          </div>
          <div className="feature-cad">
            <div className="icon">💰</div>
            <h4>Affordable</h4>
            <p>Best prices</p>
          </div>
          <div className="feature-cad">
            <div className="icon">🌍</div>
            <h4>Global</h4>
            <p>Multiple countries</p>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid">
          {/* Fund Wallet Card */}
          <div className="cad">
            <h3>💳 Fund Your Wallet</h3>
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="form-group">
                <label htmlFor="amount">Amount (USD)</label>
                <input
                  type="number"
                  id="amount"
                  placeholder="Enter amount"
                  min="1"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="currency">Currency</label>
                <select
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  required
                >
                  <option value="NGN">🇳🇬 Nigerian Naira (NGN)</option>
                  <option value="GHS">🇬🇭 Ghanaian Cedi (GHS)</option>
                  <option value="KES">🇰🇪 Kenyan Shilling (KES)</option>
                  <option value="ZAR">🇿🇦 South African Rand (ZAR)</option>
                  <option value="USD">🇺🇸 US Dollar (USD)</option>
                  <option value="ZMW">🇿🇲 Zambian Kwacha (ZMW)</option>
                  <option value="EGP">🇪🇬 Egyptian Pound (EGP)</option>
                  <option value="RWF">🇷🇼 Rwandan Franc (RWF)</option>
                  <option value="UGX">🇺🇬 Ugandan Shilling (UGX)</option>
                  <option value="TZS">🇹🇿 Tanzanian Shilling (TZS)</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="phoneNumber">Phone Number</label>
                <input
                  type="tel"
                  id="phoneNumber"
                  placeholder="Your phone number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                />
              </div>
              <button
                type="button"
                className="btn"
                onClick={handlePaystackPayment}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Proceed to Payment'}
              </button>
            </form>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h3>🚀 Quick Actions</h3>
            <button
              className="btn"
              onClick={() => handleNavigation('buy-numbers')}
              style={{ marginBottom: '10px', background: '#28a745' }}
            >
              Buy Number Now
            </button>
            <button
              className="btn"
              onClick={() => handleNavigation('usa-numbers')}
              style={{ marginBottom: '10px', background: '#17a2b8' }}
            >
              View Pricing
            </button>
            <button
              className="btn"
              onClick={() => handleNavigation('support')}
              style={{ background: '#6c757d' }}
            >
              Contact Support
            </button>
          </div>
        </div>

        {/* 5sim Integration Section */}
        <div className="card" style={{ marginTop: '20px' }}>
          <h3>📱 Buy Virtual Number (5sim)</h3>
          <div className="form-group">
            <label>Country</label>
            <select
              value={selectedCountry}
              onChange={(e) => {
                setSelectedCountry(e.target.value);
                loadOperators(e.target.value);
                setSelectedOperator('');
                setServices([]);
              }}
            >
              <option value="">Select Country</option>
              {countries.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Operator</label>
            <select
              value={selectedOperator}
              onChange={(e) => {
                setSelectedOperator(e.target.value);
                loadServices(selectedCountry, e.target.value);
                setSelectedService('');
              }}
              disabled={!selectedCountry}
            >
              <option value="">Select Operator</option>
              {operators.map(op => (
                <option key={op} value={op}>{op}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Service</label>
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              disabled={!selectedOperator}
            >
              <option value="">Select Service</option>
              {services.map(service => (
                <option key={service} value={service}>{service}</option>
              ))}
            </select>
          </div>
          <button
            className="btn"
            onClick={handleBuyNumber}
            disabled={loading || !selectedService}
            style={{ background: '#007bff' }}
          >
            {loading ? 'Processing...' : 'Buy Number'}
          </button>
        </div>

        {/* Active Numbers Section */}
        {showNumbers && (
          <div id="numbersSection" style={{ marginTop: '30px' }}>
            <h3 style={{ marginBottom: '20px' }}>📱 Active Numbers</h3>
            <div className="numbers-grid">
              {activeNumbers.map(number => (
                <div key={number.id} className="number-card">
                  <div className="number">{number.phoneNumber}</div>
                  <div className="service">Service: {number.service}</div>
                  <div className="country">Country: {number.country}</div>
                  <div className="operator">Operator: {number.operator}</div>
                  <div className="date">Purchased: {formatDate(number.purchasedAt)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transactions Section */}
        {showTransactions && (
          <div id="transactionsSection" style={{ marginTop: '30px' }}>
            <h3 style={{ marginBottom: '20px' }}>📊 Recent Transactions</h3>
            <div className="transactions-list">
              {transactions.slice(0, 10).map(tx => (
                <div key={tx.id} className="tx-item">
                  <div>
                    <div style={{ fontWeight: 600 }}>
                      {tx.type === 'credit' ? 'Payment Received' : 'Payment Made'}
                    </div>
                    <div className="date">
                      {formatDate(tx.createdAt)}
                    </div>
                    {tx.txId && (
                      <div className="tx-id" style={{ fontSize: '12px', color: '#999' }}>
                        ID: {tx.txId.slice(0, 8)}...
                      </div>
                    )}
                  </div>
                  <div className={`amount ${tx.type === 'credit' ? 'credit' : 'debit'}`}>
                    {tx.type === 'credit' ? '+' : '-'}${tx.amount}
                  </div>
                </div>
              ))}
            </div>
            {transactions.length > 10 && (
              <button 
                className="btn"
                onClick={() => handleNavigation('transactions')}
                style={{ marginTop: '20px', background: '#6c757d' }}
              >
                View All Transactions
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;