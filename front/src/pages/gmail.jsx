import { useState } from 'react';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function GmailPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [tokenExists, setTokenExists] = useState(false);
  const [maxEmails, setMaxEmails] = useState(10);
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);

  // ------------------------
  // Login with DB email/password
  // ------------------------
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${BACKEND_URL}/auth/login`, { email, password });
      setLoggedIn(true);
      setTokenExists(res.data.tokenExists);
      if (res.data.tokenExists) alert('Logged in! Gmail token exists, ready to import.');
      else alert('Logged in! No Gmail token found, you need to login with Gmail.');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Login failed');
    }
  };

  // ------------------------
  // Login with Gmail OAuth
  // ------------------------
  const loginWithGmail = () => {
    window.location.href = `${BACKEND_URL}/auth/google`;
  };

  // ------------------------
  // Import Emails
  // ------------------------
  const importEmails = async () => {
    if (!email) return alert('No user email found!');
    let max = parseInt(maxEmails);
    if (isNaN(max) || max < 1) max = 1;
    if (max > 50) max = 50;

    setLoading(true);
    try {
      const res = await axios.get(`${BACKEND_URL}/messages/import`, {
        params: { user_email: email, max },
      });
      setEmails(res.data.emails || []);
      alert(`Imported ${res.data.imported} emails`);
    } catch (err) {
      console.error(err);
      alert('Error importing emails');
    }
    setLoading(false);
  };

  // ------------------------
  // Render login or import UI
  // ------------------------
  if (!loggedIn) {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <h1>User Login</h1>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ padding: '10px', fontSize: '16px', width: '250px', marginBottom: '10px' }}
          />
          <br />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ padding: '10px', fontSize: '16px', width: '250px', marginBottom: '10px' }}
          />
          <br />
          <button type="submit" style={{ padding: '10px 20px' }}>Login</button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ padding: '30px', maxWidth: '800px', margin: 'auto' }}>
      <h1>Gmail Importer</h1>

      {!tokenExists && (
        <div>
          <p>No Gmail token found. Please login with Gmail:</p>
          <button onClick={loginWithGmail} style={{ padding: '10px 20px', marginBottom: '20px' }}>
            Login with Gmail
          </button>
        </div>
      )}

      {tokenExists && (
        <div>
          <p>Logged in as: <b>{email}</b></p>
          <label>
            Max emails to import (1-50):{' '}
            <input
              type="number"
              value={maxEmails}
              onChange={(e) => setMaxEmails(e.target.value)}
              style={{ width: '60px', padding: '5px' }}
            />
          </label>
          <button onClick={importEmails} style={{ padding: '10px 20px', marginLeft: '10px' }}>
            {loading ? 'Importing...' : 'Import Emails'}
          </button>

          <h2 style={{ marginTop: '30px' }}>Imported Emails</h2>
          <ul>
            {emails.map((e, idx) => (
              <li key={idx} style={{ marginBottom: '15px', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
                <b>Subject:</b> {e.subject} <br />
                <b>From:</b> {e.sender_name} &lt;{e.sender_email}&gt; <br />
                <b>Snippet:</b> {e.text_body?.substring(0, 100)}... <br />
                <b>Brand:</b> {e.brand} | <b>Language:</b> {e.language} | <b>Country:</b> {e.country}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
