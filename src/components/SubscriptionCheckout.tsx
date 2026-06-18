import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { subscribeMonthly, subscribeYearly, auth, db, handleFirestoreError, OperationType } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, orderBy, limit, onSnapshot, doc, setDoc } from 'firebase/firestore';

interface StripeLog {
  logId: string;
  userId: string;
  event: string;
  status: string;
  amount: string;
  timestamp: string;
  description: string;
}

export default function SubscriptionCheckout() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  
  // Custom synced user & logs state
  const [dbUser, setDbUser] = useState<any>(null);
  const [logs, setLogs] = useState<StripeLog[]>([]);
  const [logsLoading, setLogsLoading] = useState<boolean>(true);
  
  // Webhook simulator state
  const [simulationLoading, setSimulationLoading] = useState<boolean>(false);
  const [simulationSuccess, setSimulationSuccess] = useState<string | null>(null);

  // Advanced progress bar and click-shake validation animation states
  const [progress, setProgress] = useState<number>(0);
  const [shouldShake, setShouldShake] = useState<boolean>(false);

  // Form Field States to make the component fillable & interactive (White Theme)
  const [cardNumber, setCardNumber] = useState<string>('');
  const [expiry, setExpiry] = useState<string>('');
  const [cvc, setCvc] = useState<string>('');
  const [cardName, setCardName] = useState<string>('');

  // Slowly increments the progress bar percentage during transaction loading
  useEffect(() => {
    let interval: any;
    if (loading) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 98) {
            return prev;
          }
          const step = Math.floor(Math.random() * 8) + 4; // increment steps
          return Math.min(prev + step, 98);
        });
      }, 160);
    } else {
      setProgress(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Listen to profile document on Firestore (/users/{userId})
  useEffect(() => {
    if (!user) {
      setDbUser(null);
      return;
    }

    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        setDbUser(docSnap.data());
      } else {
        // Initialize user document if not existing yet
        const defaultProfile = {
          userId: user.uid,
          email: user.email || "guest@electro.app",
          isPremium: false,
          updatedAt: new Date().toISOString()
        };
        setDoc(userRef, defaultProfile).catch((err) => {
          handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}`);
        });
        setDbUser(defaultProfile);
      }
    }, (err) => {
      console.error("Firestore users watch error:", err);
      handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
    });

    return () => unsubscribe();
  }, [user]);

  // Real-time listener for Stripe event logs (/users/{userId}/stripe_logs)
  useEffect(() => {
    if (!user) {
      setLogs([]);
      setLogsLoading(false);
      return;
    }

    const logsRef = collection(db, 'users', user.uid, 'stripe_logs');
    const q = query(logsRef, orderBy('timestamp', 'desc'), limit(5));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const parsedLogs: StripeLog[] = [];
      snapshot.forEach((docRef) => {
        parsedLogs.push(docRef.data() as StripeLog);
      });
      setLogs(parsedLogs);
      setLogsLoading(false);
    }, (err) => {
      console.error("Firestore stripe_logs watch error:", err);
      handleFirestoreError(err, OperationType.GET, `users/${user.uid}/stripe_logs`);
      setLogsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Simple validation barrier to ensure fields are filled out
    if (!cardNumber || !expiry || !cvc || !cardName) {
      setError('Please fill in all requested payment details before processing.');
      setShouldShake(true);
      return;
    }

    setLoading(true);

    try {
      if (selectedPlan === 'monthly') {
        await subscribeMonthly();
      } else {
        await subscribeYearly();
      }
    } catch (err: any) {
      console.error('Subscription error:', err);
      setError(err.message || 'Failed to initiate checkout. Please try again.');
      setLoading(false);
    }
  };

  // Simulates cloud webhook call to Express backend
  const simulateWebhook = async (eventType: 'checkout.session.completed' | 'customer.subscription.deleted') => {
    if (!user) return;
    setSimulationLoading(true);
    setSimulationSuccess(null);
    try {
      let payload: any = {};
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : "local-dev-bypass";
      headers['Authorization'] = `Bearer ${idToken}`;

      if (eventType === 'checkout.session.completed') {
        payload = {
          id: `evt_mock_chk_${Date.now()}`,
          type: 'checkout.session.completed',
          data: {
            object: {
              id: `cs_test_${Date.now()}`,
              client_reference_id: user.uid,
              amount_total: selectedPlan === 'monthly' ? 2999 : 29999,
              metadata: {
                userId: user.uid,
                plan: selectedPlan
              }
            }
          }
        };
      } else {
        payload = {
          id: `evt_mock_del_${Date.now()}`,
          type: 'customer.subscription.deleted',
          data: {
            object: {
              id: `sub_test_${Date.now()}`,
              customer: `cus_test_${user.uid.slice(0, 8)}`,
              metadata: {
                userId: user.uid
              }
            }
          }
        };
      }

      const response = await fetch('/api/stripe-webhook', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Failed to dispatch webhook event');
      }

      setSimulationSuccess(`Successfully processed ${eventType} webhook on backend! Check logs block below.`);
      setTimeout(() => setSimulationSuccess(null), 8500);
    } catch (err: any) {
      console.error("Webhook simulation error:", err);
      setError(err.message || 'Simulation dispatch failed');
    } finally {
      setSimulationLoading(false);
    }
  };

  const monthlyTotal = 29.99 * 12;
  const yearlyPrice = 299.99;
  const savingsAmount = (monthlyTotal - yearlyPrice).toFixed(2);
  const isValid = !!(cardNumber.trim() && expiry.trim() && cvc.trim() && cardName.trim());

  if (authLoading) {
    return (
      <div className="checkout-wrapper">
        <div className="checkout-card">
          <div className="loading-spinner">Loading sandbox engine parameters...</div>
        </div>
        <style dangerouslySetInnerHTML={{ __html: `
          .checkout-wrapper {
            min-height: 100vh;
            background: #ffffff;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 2rem 1rem;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          .checkout-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            padding: 2.5rem;
            width: 100%;
            max-width: 480px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
          }
          .loading-spinner {
            text-align: center;
            color: #64748b;
            padding: 2rem;
          }
        `}} />
      </div>
    );
  }

  return (
    <div className="checkout-wrapper">
      <div className="checkout-card">
        <div className="checkout-header">
          <div className="logo-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <h2 className="checkout-title">Direct sandbox payment engine configuration.</h2>
        </div>

        {/* Dynamic Billing Active Status Banner */}
        <div className="billing-status-badge">
          LICENSE STATE:{' '}
          {dbUser?.isPremium ? (
            <span className="badge-active">ACTIVE PREMIUM ✓</span>
          ) : (
            <span className="badge-inactive">INACTIVE LICENSE</span>
          )}
        </div>

        <div className="plan-selector">
          <button 
            type="button"
            className={`plan-card ${selectedPlan === 'monthly' ? 'active' : ''}`}
            onClick={() => !loading && setSelectedPlan('monthly')}
            disabled={loading}
          >
            <div className="plan-name">Monthly Plan</div>
            <div className="plan-amount">$29.99<span className="period">/mo</span></div>
          </button>
          
          <button 
            type="button"
            className={`plan-card ${selectedPlan === 'yearly' ? 'active' : ''}`}
            onClick={() => !loading && setSelectedPlan('yearly')}
            disabled={loading}
          >
            <div className="plan-name">Yearly License</div>
            <div className="plan-amount">$299.99<span className="period">/yr</span></div>
            {selectedPlan === 'yearly' && (
              <div className="savings-badge">Save ${savingsAmount}</div>
            )}
          </button>
        </div>

        <form onSubmit={handleSubscribe} className="payment-form" noValidate>
          <div className="form-group">
            <label className="form-label">CARD CONDUCTOR NUM</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="4242 4242 4242 4242" 
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              disabled={loading}
              maxLength={19}
              required
            />
          </div>
          
          <div className="form-row">
            <div className="form-group half">
              <label className="form-label">EXPIRATION</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="MM/YY" 
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                disabled={loading}
                maxLength={5}
                required
              />
            </div>
            <div className="form-group half">
              <label className="form-label">CVC CODE</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="123" 
                value={cvc}
                onChange={(e) => setCvc(e.target.value)}
                disabled={loading}
                maxLength={4}
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">CONDUCTOR NAME</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Full Name" 
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="secure-note">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Secure checkout powered by Stripe. You will be redirected to complete payment.
          </div>

          {error && (
            <div className="error-banner">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {!user && !error && (
            <div className="auth-warning">
              <strong>Guest Checkout active.</strong> An anonymous credential profile will automatically sync your subscription workspace.
            </div>
          )}

          <motion.button 
            type="submit"
            className="checkout-button"
            disabled={loading}
            animate={
              shouldShake
                ? { x: [0, -10, 10, -10, 10, -6, 6, -3, 3, 0], scale: 1 }
                : isValid && !loading
                  ? {
                      scale: [1, 1.02, 1],
                      boxShadow: [
                        "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                        "0 12px 20px -3px rgba(245, 158, 11, 0.4), 0 4px 8px -2px rgba(245, 158, 11, 0.2)",
                        "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
                      ]
                    }
                  : { scale: 1, x: 0, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }
            }
            onAnimationComplete={() => {
              if (shouldShake) {
                setShouldShake(false);
              }
            }}
            whileHover={!loading ? { scale: 1.025 } : {}}
            whileTap={!loading ? { scale: 0.98 } : {}}
            transition={
              shouldShake
                ? { duration: 0.55, ease: "easeInOut" }
                : isValid && !loading
                  ? {
                      scale: {
                        duration: 1.8,
                        repeat: Infinity,
                        ease: "easeInOut"
                      },
                      boxShadow: {
                        duration: 1.8,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }
                    }
                  : { duration: 0.2 }
            }
          >
            {loading ? (
              <div className="btn-progress-container">
                <div className="btn-progress-header">
                  <span>TRANSACTION IN PROCESS</span>
                  <span className="btn-progress-num">{progress}%</span>
                </div>
                <div className="btn-progress-track">
                  <motion.div 
                    className="btn-progress-fill"
                    style={{ width: `${progress}%` }}
                    transition={{ type: "spring", stiffness: 65, damping: 15 }}
                  />
                </div>
              </div>
            ) : (
              `Authenticate Secure Purchase of $${selectedPlan === 'monthly' ? '29.99' : '299.99'}`
            )}
          </motion.button>
        </form>
      </div>

      {/* Stripe Activity Logs Container */}
      <div className="logs-container">
        <div className="logs-header">
          <svg className="logs-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <circle cx="8" cy="9" r="1" />
          </svg>
          <h3 className="logs-title">Stripe Activity Logs</h3>
        </div>

        {logsLoading ? (
          <div className="logs-status">
            <span className="mini-spinner"></span>
            Syncing event logs...
          </div>
        ) : logs.length === 0 ? (
          <div className="logs-empty">
            <p className="font-bold text-slate-700">No events logged yet.</p>
            <p className="logs-instructions text-slate-400">Trigger successful payments or subscription cancel simulations below to populate live events.</p>
          </div>
        ) : (
          <div className="logs-list">
            {logs.map((log) => (
              <div key={log.logId} className={`log-item ${log.status === 'deleted' ? 'log-deleted' : 'log-success'}`}>
                <div className="log-top">
                  <span className="log-badge-event">{log.event}</span>
                  <span className="log-badge-status">{String(log.status).toUpperCase()}</span>
                </div>
                <div className="log-desc">{log.description}</div>
                <div className="log-details font-mono">
                  <span>Amount: {log.amount}</span>
                  <span>ID: {log.logId}</span>
                  <span>Time: {new Date(log.timestamp).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Dynamic Sandbox Webhook Simulator Controls */}
        <div className="simulator-section">
          <h4 className="simulator-title">STREAMS Webhook Handshake Simulator</h4>
          <p className="simulator-subtitle font-sans text-slate-500">
            Simulate real-time Stripe server-to-server posts to test backend event handlers:
          </p>
          
          <div className="simulator-buttons">
            <button 
              type="button" 
              className="simulator-btn btn-success-test"
              onClick={() => simulateWebhook('checkout.session.completed')}
              disabled={simulationLoading || !user}
            >
              {simulationLoading ? 'Processing...' : 'Simulate completed payment webhook'}
            </button>
            <button 
              type="button" 
              className="simulator-btn btn-danger-test"
              onClick={() => simulateWebhook('customer.subscription.deleted')}
              disabled={simulationLoading || !user}
            >
              {simulationLoading ? 'Processing...' : 'Simulate subscription deleted webhook'}
            </button>
          </div>

          {simulationSuccess && (
            <div className="simulation-success-banner">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span>{simulationSuccess}</span>
            </div>
          )}
        </div>
      </div>

      <div className="checkout-footer text-center">
        STRIPE CHECKOUT CONTROL CENTER
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .checkout-wrapper {
          min-height: 100vh;
          background: #ffffff; 
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .checkout-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 2.5rem;
          width: 100%;
          max-width: 480px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
        }

        .checkout-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .logo-icon {
          margin-bottom: 1rem;
          display: flex;
          justify-content: center;
        }

        .checkout-title {
          color: #64748b;
          font-size: 1rem;
          font-weight: 500;
          margin: 0;
        }

        .billing-status-badge {
          text-align: center;
          margin-bottom: 1.5rem;
          font-weight: 700;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .badge-active {
          color: #22c55e;
          background: rgba(34, 197, 94, 0.1);
          padding: 0.35rem 0.85rem;
          border-radius: 9999px;
          border: 1px solid rgba(34, 197, 94, 0.2);
        }

        .badge-inactive {
          color: #ef4444;
          background: rgba(239, 68, 68, 0.1);
          padding: 0.35rem 0.85rem;
          border-radius: 9999px;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .plan-selector {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .plan-card {
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          padding: 1.25rem;
          background: #f8fafc;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        .plan-card:hover:not(:disabled) {
          border-color: #cbd5e1;
          transform: translateY(-1px);
        }

        .plan-card.active {
          border: 2px solid #f59e0b;
          background: #fffbeb;
          box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
        }

        .plan-card:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .plan-name {
          color: #64748b;
          font-size: 0.875rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.5rem;
        }

        .plan-amount {
          color: #1e293b;
          font-size: 1.5rem;
          font-weight: 700;
        }

        .period {
          color: #64748b;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .savings-badge {
          position: absolute;
          top: 0;
          right: 0;
          background: #22c55e;
          color: white;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.25rem 0.75rem;
          border-bottom-left-radius: 8px;
        }

        .payment-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .form-label {
          color: #475569;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .form-input {
          background: #ffffff;
          color: #1e293b;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 0.875rem 1rem;
          font-size: 1rem;
          outline: none;
          transition: all 0.2s;
        }

        .form-input:focus {
          border-color: #f59e0b;
          box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
        }

        .form-input::placeholder {
          color: #94a3b8;
        }

        .secure-note {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #475569;
          font-size: 0.875rem;
          background: #f8fafc;
          padding: 0.75rem;
          border-radius: 8px;
          margin-top: 0.5rem;
        }

        .error-banner {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 0.875rem 1rem;
          border-radius: 8px;
          font-size: 0.875rem;
        }

        .auth-warning {
          background: #fff7ed;
          border: 1px solid #fed7aa;
          color: #c2410c;
          padding: 0.875rem 1rem;
          border-radius: 8px;
          font-size: 0.875rem;
          text-align: center;
        }

        .checkout-button {
          background: #f59e0b;
          color: #1e293b;
          border: none;
          border-radius: 8px;
          padding: 1rem 1.5rem;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-top: 0.5rem;
          position: relative;
          overflow: hidden;
        }

        .checkout-button:hover:not(:disabled) {
          background: #d97706;
          transform: translateY(-1px);
          box-shadow: 0 10px 15px -3px rgba(245, 158, 11, 0.3);
        }

        .checkout-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-progress-container {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
          color: #1e293b;
          text-align: left;
        }

        .btn-progress-header {
          display: flex;
          justify-content: space-between;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .btn-progress-num {
          font-family: monospace;
          font-size: 0.82rem;
        }

        .btn-progress-track {
          width: 100%;
          height: 6px;
          background: rgba(30, 41, 59, 0.15);
          border-radius: 9999px;
          overflow: hidden;
          position: relative;
        }

        .btn-progress-fill {
          height: 100%;
          background: #1e293b;
          border-radius: 9999px;
          box-shadow: 0 0 6px rgba(30, 41, 59, 0.15);
        }

        .button-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid #1e293b;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Stripe Activity Logs Styles */
        .logs-container {
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          padding: 2.5rem;
          width: 100%;
          max-width: 480px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
          margin-top: 1.5rem;
          font-family: inherit;
        }

        .logs-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
          border-bottom: 1px solid #f1f5f9;
          padding-bottom: 1rem;
        }

        .logs-icon {
          flex-shrink: 0;
        }

        .logs-title {
          color: #1e293b;
          font-size: 1.1rem;
          font-weight: 700;
          margin: 0;
        }

        .logs-status {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          color: #64748b;
          font-size: 0.875rem;
          padding: 2rem 1rem;
        }

        .mini-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #e2e8f0;
          border-top-color: #64748b;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .logs-empty {
          color: #64748b;
          font-size: 0.85rem;
          text-align: center;
          padding: 2.5rem 1.5rem;
          background: #f8fafc;
          border-radius: 8px;
          border: 1px dashed #cbd5e1;
        }

        .logs-instructions {
          font-size: 0.75rem;
          color: #94a3b8;
          margin-top: 0.5rem;
          line-height: 1.4;
        }

        .logs-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          max-height: 380px;
          overflow-y: auto;
          margin-bottom: 1.5rem;
        }

        .log-item {
          border-radius: 8px;
          padding: 1rem;
          border-left: 4px solid #cbd5e1;
          background: #f8fafc;
          transition: all 0.2s;
        }

        .log-success {
          border-left-color: #22c55e;
          background: #f0fdf4;
        }

        .log-deleted {
          border-left-color: #ef4444;
          background: #fef2f2;
        }

        .log-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.45rem;
        }

        .log-badge-event {
          font-size: 0.72rem;
          font-weight: 700;
          color: #334155;
          background: #e2e8f0;
          padding: 0.15rem 0.45rem;
          border-radius: 4px;
        }

        .log-badge-status {
          font-size: 0.7rem;
          font-weight: 900;
          letter-spacing: 0.05em;
        }

        .log-success .log-badge-status {
          color: #166534;
        }

        .log-deleted .log-badge-status {
          color: #991b1b;
        }

        .log-desc {
          color: #334155;
          font-size: 0.825rem;
          margin-bottom: 0.5rem;
          line-height: 1.4;
        }

        .log-details {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          font-size: 0.68rem;
          color: #64748b;
          border-top: 1px dashed #e2e8f0;
          padding-top: 0.4rem;
        }

        .simulator-section {
          border-top: 1px solid #f1f5f9;
          padding-top: 1.5rem;
          margin-top: 1.5rem;
        }

        .simulator-title {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: #d97706;
          text-transform: uppercase;
          margin: 0 0 0.5rem 0;
        }

        .simulator-subtitle {
          font-size: 0.75rem;
          color: #64748b;
          line-height: 1.4;
          margin-bottom: 1rem;
        }

        .simulator-buttons {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .simulator-btn {
          padding: 0.65rem 1rem;
          font-size: 0.75rem;
          font-weight: 700;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          color: #334155;
        }

        .btn-success-test:hover:not(:disabled) {
          border-color: #22c55e;
          background: #f0fdf4;
          color: #166534;
        }

        .btn-danger-test:hover:not(:disabled) {
          border-color: #ef4444;
          background: #fef2f2;
          color: #991b1b;
        }

        .simulator-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .simulation-success-banner {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 1rem;
          padding: 0.65rem;
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          color: #0369a1;
          border-radius: 6px;
          font-size: 0.75rem;
        }

        .checkout-footer {
          margin-top: 2rem;
          color: #94a3b8;
          font-size: 0.875rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .loading-spinner {
          text-align: center;
          color: #64748b;
          padding: 2rem;
        }

        @media (max-width: 640px) {
          .checkout-card, .logs-container {
            padding: 1.5rem;
          }
          
          .plan-selector {
            grid-template-columns: 1fr;
          }
          
          .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}} />
    </div>
  );
}
