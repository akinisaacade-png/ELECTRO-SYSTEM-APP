import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";
import { getStripePayments, createCheckoutSession } from '@stripe/firestore-stripe-payments';
import firebaseConfig from "../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const auth = getAuth(app);

// Initialize Stripe Payments Extension
export const stripePayments = getStripePayments(app, {
  productsCollection: 'products',
  customersCollection: 'customers',
});

// Price IDs provided
export const PRICE_IDS = {
  MONTHLY: 'price_1TiOSZBMbxh6jv0CPBbMA11B', // $29.99/mo
  YEARLY: 'price_1TiOSZBMbxh6jv0CFWshMKFt',  // $299.99/yr
};

/**
 * Triggers the Stripe Checkout redirect for a selected tier
 * @param priceId The Stripe Price ID to purchase
 */
export const checkout = async (priceId: string) => {
  try {
    const session = await createCheckoutSession(stripePayments, {
      price: priceId,
      success_url: window.location.origin + '?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: window.location.origin,
    });
    
    // Redirect user to Stripe Hosted Checkout Page
    if (session.url) {
      window.location.assign(session.url);
    } else {
      throw new Error("No URL returned from checkout session creation.");
    }
  } catch (error) {
    console.error("Stripe Checkout Error: ", error);
    alert("Could not initiate checkout. Please try again.");
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
