#!/usr/bin/env node

/**
 * Google OAuth Refresh Token Generator
 * 
 * This script helps you get a refresh token for Google Drive API access.
 * 
 * Usage:
 * 1. Run: node scripts/get-refresh-token.js
 * 2. Open the URL that appears in your browser
 * 3. Authorize the app
 * 4. Paste the authorization code back in the terminal
 * 5. Your refresh token will be displayed!
 */

const http = require('http');
const url = require('url');
const { promisify } = require('util');

// Your OAuth credentials from Google Cloud Console
const CLIENT_ID = '492866044354-ffhovm3goidgmt5d8shmddtgonepqgvd.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_PORT = 3000;
const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}`;

// Google OAuth endpoints
const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

// Scopes needed for Google Drive API
const SCOPES = [
  'https://www.googleapis.com/auth/drive',
].join(' ');

async function getRefreshToken() {
  console.log('🔐 Google OAuth Refresh Token Generator\n');
  console.log('This will help you get a refresh token for Google Drive API access.\n');

  // Step 1: Generate authorization URL
  const authUrl = new URL(AUTH_URL);
  authUrl.searchParams.set('client_id', CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', SCOPES);
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent'); // Force refresh token generation

  console.log('📋 Step 1: Authorize the application\n');
  console.log('Open this URL in your browser:\n');
  console.log(authUrl.toString());
  console.log('\n');

  // Step 2: Start local server to catch the redirect
  console.log(`🌐 Step 2: Waiting for authorization...`);
  console.log(`   (A browser window should open. If not, paste the URL above manually.)\n`);

  const authCode = await startLocalServer();

  // Step 3: Exchange authorization code for refresh token
  console.log('\n✅ Authorization code received!\n');
  console.log('🔄 Step 3: Exchanging for refresh token...\n');

  const refreshToken = await exchangeCodeForToken(authCode);

  console.log('\n🎉 SUCCESS! Your refresh token:\n');
  console.log('─'.repeat(80));
  console.log(refreshToken);
  console.log('─'.repeat(80));
  console.log('\n📝 Add this to your .env.local file as:');
  console.log('   GOOGLE_DRIVE_REFRESH_TOKEN=' + refreshToken + '\n');
  console.log('✅ Done! You can now use the Google Drive API.\n');
}

function startLocalServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      const parsedUrl = url.parse(req.url, true);
      const query = parsedUrl.query;
      
      // Accept any request with a code parameter
      if (!query.code) {
        res.writeHead(404);
        res.end('Not found - no authorization code in URL');
        return;
      }
      
      if (query.error) {
        res.writeHead(400);
        res.end(`Error: ${query.error}`);
        server.close();
        reject(new Error(query.error));
        return;
      }

      if (!query.code) {
        res.writeHead(400);
        res.end('No authorization code received');
        server.close();
        reject(new Error('No code'));
        return;
      }

      // Success! Show a nice page
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Authorization Successful</title>
          <style>
            body { font-family: system-ui; padding: 50px; text-align: center; }
            h1 { color: #4285f4; }
            p { color: #666; }
          </style>
        </head>
        <body>
          <h1>✅ Authorization Successful!</h1>
          <p>You can close this window and return to the terminal.</p>
          <p style="font-size: 12px; color: #999;">Authorization code: ${query.code.substring(0, 20)}...</p>
        </body>
        </html>
      `);

      server.close();
      resolve(query.code);
    });

    server.listen(REDIRECT_PORT, () => {
      console.log(`   Local server running on port ${REDIRECT_PORT}`);
      console.log(`   Paste this URL in your browser:\n`);
      console.log(`   http://localhost:${REDIRECT_PORT}/authorize\n`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`   Port ${REDIRECT_PORT} is already in use.`);
        console.log(`   Please close any other apps using this port, or try a different port.\n`);
      }
      reject(err);
    });
  });
}

async function exchangeCodeForToken(code) {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code: code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error_description || data.error || 'Unknown error');
  }

  if (!data.refresh_token) {
    throw new Error('No refresh token received. Make sure you set access_type=offline and prompt=consent.');
  }

  return data.refresh_token;
}

// Run the script
getRefreshToken().catch((err) => {
  console.error('\n❌ Error:', err.message);
  console.error('\nIf the problem persists, try:');
  console.error('1. Make sure port 3001 is not in use');
  console.error('2. Check that your OAuth credentials are correct');
  console.error('3. Try using the OAuth Playground instead: https://developers.google.com/oauthplayground\n');
  process.exit(1);
});
