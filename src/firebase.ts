import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";
import { getStripePayments, createCheckoutSession } from '@stripe/firestore-stripe-payments';
import firebaseConfig from "../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const auth = getAuth(app);

export const initializeGuestSession = async () => {
  try {
    console.log("Guest detected. Initiating secure anonymous session...");
    const userCredential = await signInAnonymously(auth);
    return userCredential.user;
  } catch (error: any) {
    console.error("Anonymous Authentication failed: ", error.message);
    
    // Fallback logic for Sandbox/Mock environments
    if (process.env.NODE_ENV === 'development' || error.code === 'auth/admin-restricted-operation') {
      console.warn("Using mock guest session fallback due to restricted environment.");
      return { uid: "mock_guest_user_id", isAnonymous: true } as any;
    }
    
    throw error;
  }
};

// Initialize Stripe Payments Extension
export const stripePayments = getStripePayments(app, {
  productsCollection: 'products',
  customersCollection: 'customers',
});

// Avoid Firebase double-bundling / version mismatch issue by supplying a custom UserDAO component
(stripePayments as any).setComponent('user-dao', {
  getCurrentUser: (): string => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      throw new Error("Failed to determine currently signed in user. User not signed in.");
    }
    return uid;
  }
});

// Price IDs provided
export const PRICE_IDS = {
  MONTHLY: 'price_1TiOSZBMbxh6jv0CPBbMA11B', // $29.99/mo
  YEARLY: 'price_1TiOSZBMbxh6jv0CFWshMKFt',  // $299.99/yr
};

/**
 * Triggers the Stripe Checkout redirect for a selected tier
 * @param priceId The Stripe Price ID to purchase
 * @param onProgress Callback function to report checkout progress/state changes
 */
export const checkout = async (
  priceId: string,
  onProgress?: (status: 'loading' | 'redirecting' | 'closed' | 'error' | 'success', message?: string) => void
) => {
  let checkoutWindow: Window | null = null;
  let isCompleted = false;
  let monitorInterval: NodeJS.Timeout | null = null;
  let handleMessage: ((event: MessageEvent) => void) | null = null;

  try {
    onProgress?.('loading');

    // 1. If no user is logged in, silently sign them in anonymously so checkout doesn't crash
    let currentUser = auth.currentUser;
    if (!currentUser) {
      try {
        onProgress?.('loading', "Guest detected. Initiating secure anonymous session...");
        currentUser = (await initializeGuestSession()) as any;
      } catch (authErr: any) {
        console.error("Anonymous Authentication failed: ", authErr);
        throw new Error(`Anonymous Auth failed: ${authErr?.message || authErr}`);
      }
    }

    // To prevent popup blockers (by keeping it in the synchronous user click handler context),
    // we open a blank window immediately and style it with a loading state.
    checkoutWindow = window.open('about:blank', '_blank');
    if (checkoutWindow) {
      try {
        checkoutWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Connecting to Secure Checkout...</title>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body {
                  background: #0f172a;
                  color: #e2e8f0;
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                  display: flex;
                  flex-direction: column;
                  justify-content: center;
                  align-items: center;
                  height: 100vh;
                  margin: 0;
                  padding: 24px;
                  box-sizing: border-box;
                  text-align: center;
                }
                .container {
                  max-width: 400px;
                  background: #1e293b;
                  border: 1px solid #334155;
                  border-radius: 12px;
                  padding: 32px;
                  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
                }
                .spinner {
                  border: 3px solid rgba(255, 255, 255, 0.1);
                  width: 48px;
                  height: 48px;
                  border-radius: 50%;
                  border-left-color: #f59e0b;
                  animation: spin 1s linear infinite;
                  margin: 0 auto 24px auto;
                }
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
                h2 {
                  font-weight: 600;
                  font-size: 1.25rem;
                  color: #f8fafc;
                  margin: 0 0 12px 0;
                }
                p {
                  color: #94a3b8;
                  font-size: 0.875rem;
                  line-height: 1.5;
                  margin: 0;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="spinner"></div>
                <h2>Connecting to Stripe Secure Servers</h2>
                <p>Establishing handshakes with checkout endpoints. Please keep this window open and do-not refresh...</p>
              </div>
            </body>
          </html>
        `);
      } catch (docErr) {
        console.warn("Could not write initial loader to checkout popup.", docErr);
      }
    }

    // 2. Proceed with checkout if user exists
    const session = await createCheckoutSession(stripePayments, {
      price: priceId,
      success_url: window.location.origin + '?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: window.location.origin,
    });
    
    // Redirect user to Stripe Hosted Checkout Page
    if (session.url) {
      onProgress?.('redirecting');
      if (checkoutWindow && !checkoutWindow.closed) {
        checkoutWindow.location.assign(session.url);
      } else {
        // Fallback if popup was blocked/closed
        window.location.assign(session.url);
      }

      // Track whether checkout completed successfully via postMessage
      handleMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        if (event.data?.type === 'STRIPE_CHECKOUT_SUCCESS') {
          isCompleted = true;
          onProgress?.('success');
          cleanup();
        }
      };
      window.addEventListener('message', handleMessage);

      // Now monitor the checkout window to see if the user closes it!
      monitorInterval = setInterval(() => {
        if (!checkoutWindow || checkoutWindow.closed) {
          cleanup();
          if (!isCompleted) {
            onProgress?.('closed', "The Stripe Checkout window was closed before completion.");
          }
        }
      }, 1000);

    } else {
      throw new Error("No URL returned from checkout session creation.");
    }
  } catch (error: any) {
    console.error("Stripe Checkout Error: ", error);
    if (checkoutWindow && !checkoutWindow.closed) {
      checkoutWindow.close();
    }
    alert(`Could not initiate checkout: ${error?.message || "Please try again."}`);
    onProgress?.('error', error?.message);
    cleanup();
  }

  function cleanup() {
    if (monitorInterval) {
      clearInterval(monitorInterval);
      monitorInterval = null;
    }
    if (handleMessage) {
      window.removeEventListener('message', handleMessage);
      handleMessage = null;
    }
  }
};

// Error Handling from Firebase Integration Skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// CRITICAL CONSTRAINT: Test connection on app boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();
