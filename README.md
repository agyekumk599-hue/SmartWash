# SmartWash Laundry Management System

A multi-tenant laundry management app with Firebase backend support.

## Features

- Order management with workflow (pending → washing → ready → delivered)
- Customer notifications (SMS/WhatsApp)
- Receipt printing
- Multi-tenant architecture for multiple laundry companies
- Firebase Firestore integration with localStorage fallback

## Setup

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. Enable Authentication and Firestore Database
4. Create a web app and copy the config values
5. Replace the placeholder config in `firebase.js`

### 2. Firestore Security Rules

Add these rules in Firebase Console > Firestore > Rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Orders: tenant isolation
    match /orders/{orderId} {
      allow read, write: if request.auth != null &&
        resource.data.tenantId == request.auth.uid ||
        request.auth.token.email in ['admin@smartwash.com'];
    }

    // Notifications: tenant isolation
    match /notifications/{notifId} {
      allow read, write: if request.auth != null &&
        resource.data.tenantId == request.auth.uid;
    }

    // Users: self-access only
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Tenants: admin access
    match /tenants/{tenantId} {
      allow read, write: if request.auth != null &&
        request.auth.token.email in ['admin@smartwash.com'];
    }
  }
}
```

### 3. Authentication Setup

In Firebase Console > Authentication:

- Enable Email/Password sign-in
- Add test users if needed

### 4. Run the App

Open `index.html` in a web browser. The app will automatically fall back to localStorage if Firebase isn't configured.

## Testing Firebase Connection

Open browser console and run:

```javascript
testFirebaseConnection();
```

## Multi-Tenant Usage

Each laundry company gets their own tenant ID. Data is isolated by tenantId in Firestore collections.

## Development

- `app.html`: Main UI
- `script.js`: Application logic and DataStore
- `firebase.js`: Firebase service wrapper
- `index.html`: Entry point
