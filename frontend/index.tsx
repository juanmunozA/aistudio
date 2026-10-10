import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from './src/features/auth/AuthProvider';
import { RequireAuth } from './src/features/auth/RequireAuth';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <RequireAuth>
        <App />
      </RequireAuth>
    </AuthProvider>
  </React.StrictMode>
);
