#!/usr/bin/env python3
"""
Simple HTTPS server for testing Google APIs
Google APIs often require HTTPS for security reasons
"""
import http.server
import socketserver
import ssl
import os
import sys
from pathlib import Path

PORT = 8443

class HTTPSHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers for development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()

def create_self_signed_cert():
    """Create a self-signed certificate for HTTPS testing"""
    try:
        import subprocess
        
        # Check if cert already exists
        if os.path.exists('server.crt') and os.path.exists('server.key'):
            print("✅ Certificate files already exist")
            return True
            
        # Create self-signed certificate
        print("🔐 Creating self-signed certificate for HTTPS testing...")
        subprocess.run([
            'openssl', 'req', '-x509', '-newkey', 'rsa:4096', '-keyout', 'server.key',
            '-out', 'server.crt', '-days', '365', '-nodes', '-subj',
            '/C=US/ST=GA/L=Atlanta/O=CochranFilms/CN=localhost'
        ], check=True, capture_output=True)
        
        print("✅ Certificate created successfully")
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ OpenSSL not available or failed to create certificate")
        print("💡 On macOS, install with: brew install openssl")
        return False

def start_https_server():
    """Start HTTPS server"""
    try:
        # Create certificate if needed
        if not create_self_signed_cert():
            print("❌ Cannot start HTTPS server without certificate")
            return False
        
        # Start server
        handler = HTTPSHandler
        httpd = socketserver.TCPServer(("", PORT), handler)
        
        # Add SSL
        context = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
        context.load_cert_chain('server.crt', 'server.key')
        httpd.socket = context.wrap_socket(httpd.socket, server_side=True)
        
        print(f"🚀 HTTPS Server running on https://localhost:{PORT}")
        print("🔐 You'll see a 'Not Secure' warning - click 'Advanced' → 'Continue to localhost'")
        print("📝 This is normal for self-signed certificates in development")
        print("⏹️  Press Ctrl+C to stop the server")
        print()
        print(f"🌐 Open: https://localhost:{PORT}/admin-dashboard.html")
        print()
        
        httpd.serve_forever()
        
    except KeyboardInterrupt:
        print("\n🛑 Server stopped")
    except Exception as e:
        print(f"❌ Server error: {e}")

if __name__ == "__main__":
    start_https_server()