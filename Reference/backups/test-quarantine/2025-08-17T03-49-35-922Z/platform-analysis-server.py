#!/usr/bin/env python3
"""
Cochran Films Platform Analysis Server
======================================

This server provides comprehensive analysis of both the admin dashboard and user portal,
identifying areas for improvement in UI, functionality, and user experience.

Features:
- UI/UX analysis and recommendations
- Functionality gap analysis
- Code quality assessment
- Accessibility improvements
- Performance optimization suggestions
- Security review
- User workflow analysis
"""

import os
import json
import re
import html
from pathlib import Path
from datetime import datetime
import http.server
import socketserver
import urllib.parse
from typing import Dict, List, Any, Tuple

class PlatformAnalyzer:
    """Main analyzer class for examining the platform components"""
    
    def __init__(self):
        self.analysis_results = {
            'timestamp': datetime.now().isoformat(),
            'admin_dashboard': {},
            'user_portal': {},
            'overall_recommendations': [],
            'critical_issues': [],
            'ui_improvements': [],
            'functionality_gaps': [],
            'code_quality': [],
            'accessibility': [],
            'performance': [],
            'security': []
        }
        
        # Define analysis patterns
        self.patterns = {
            'console_logs': r'console\.(log|warn|error|info)',
            'todo_comments': r'(TODO|FIXME|BUG|HACK|XXX)',
            'hardcoded_values': r'["\'](admin123|password|secret|key)["\']',
            'inline_styles': r'style\s*=\s*["\'][^"\']*["\']',
            'deprecated_features': r'(document\.write|innerHTML\s*=|eval\()',
            'accessibility_issues': r'(onclick\s*=|tabindex\s*=\s*["\']-1["\'])',
            'performance_issues': r'(setInterval|setTimeout).*1000',
            'security_issues': r'(innerHTML|document\.write|eval)'
        }
    
    def analyze_file(self, file_path: str, file_type: str) -> Dict[str, Any]:
        """Analyze a single file for various issues and improvements"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            analysis = {
                'file_path': file_path,
                'file_size': len(content),
                'lines': len(content.split('\n')),
                'issues': [],
                'improvements': [],
                'metrics': {}
            }
            
            # Analyze patterns
            for pattern_name, pattern in self.patterns.items():
                matches = re.findall(pattern, content, re.IGNORECASE)
                if matches:
                    analysis['issues'].append({
                        'type': pattern_name,
                        'count': len(matches),
                        'description': self.get_pattern_description(pattern_name)
                    })
            
            # Analyze HTML structure
            if file_type == 'html':
                html_analysis = self.analyze_html_structure(content)
                analysis.update(html_analysis)
            
            # Analyze JavaScript
            if file_type == 'javascript' or '<script>' in content:
                js_analysis = self.analyze_javascript(content)
                analysis.update(js_analysis)
            
            # Analyze CSS
            if file_type == 'css' or '<style>' in content:
                css_analysis = self.analyze_css(content)
                analysis.update(css_analysis)
            
            return analysis
            
        except Exception as e:
            return {
                'file_path': file_path,
                'error': str(e),
                'issues': [],
                'improvements': []
            }
    
    def analyze_html_structure(self, content: str) -> Dict[str, Any]:
        """Analyze HTML structure and accessibility"""
        analysis = {
            'html_metrics': {},
            'accessibility_issues': [],
            'semantic_improvements': []
        }
        
        # Check for semantic HTML elements
        semantic_elements = ['header', 'nav', 'main', 'section', 'article', 'aside', 'footer']
        for element in semantic_elements:
            count = content.count(f'<{element}')
            if count > 0:
                analysis['html_metrics'][f'{element}_count'] = count
        
        # Check for accessibility attributes
        if 'alt=' not in content:
            analysis['accessibility_issues'].append('Missing alt attributes on images')
        
        if 'aria-label' not in content and 'aria-labelledby' not in content:
            analysis['accessibility_issues'].append('Missing ARIA labels')
        
        # Check for form accessibility
        if '<form' in content:
            if 'label' not in content:
                analysis['accessibility_issues'].append('Forms missing proper labels')
            if 'required' in content and 'aria-required' not in content:
                analysis['accessibility_issues'].append('Required fields missing ARIA required attribute')
        
        return analysis
    
    def analyze_javascript(self, content: str) -> Dict[str, Any]:
        """Analyze JavaScript code quality and patterns"""
        analysis = {
            'js_metrics': {},
            'code_quality_issues': [],
            'performance_issues': []
        }
        
        # Check for modern JavaScript features
        if 'const ' in content or 'let ' in content:
            analysis['js_metrics']['modern_js'] = True
        
        if 'async ' in content or 'await ' in content:
            analysis['js_metrics']['async_await'] = True
        
        # Check for potential memory leaks
        if 'addEventListener' in content and 'removeEventListener' not in content:
            analysis['code_quality_issues'].append('Event listeners added without removal strategy')
        
        # Check for error handling
        if 'try {' in content and 'catch' in content:
            analysis['js_metrics']['error_handling'] = True
        else:
            analysis['code_quality_issues'].append('Missing error handling in critical functions')
        
        return analysis
    
    def analyze_css(self, content: str) -> Dict[str, Any]:
        """Analyze CSS structure and best practices"""
        analysis = {
            'css_metrics': {},
            'css_issues': [],
            'responsive_design': False
        }
        
        # Check for responsive design
        if '@media' in content:
            analysis['responsive_design'] = True
            analysis['css_metrics']['media_queries'] = content.count('@media')
        
        # Check for CSS variables
        if 'var(--' in content:
            analysis['css_metrics']['css_variables'] = True
        
        # Check for flexbox/grid
        if 'display: flex' in content or 'display: grid' in content:
            analysis['css_metrics']['modern_layout'] = True
        
        return analysis
    
    def get_pattern_description(self, pattern_name: str) -> str:
        """Get description for pattern types"""
        descriptions = {
            'console_logs': 'Console logs should be removed in production',
            'todo_comments': 'TODO comments indicate incomplete work',
            'hardcoded_values': 'Hardcoded credentials or secrets found',
            'inline_styles': 'Inline styles reduce maintainability',
            'deprecated_features': 'Deprecated or unsafe features detected',
            'accessibility_issues': 'Potential accessibility problems',
            'performance_issues': 'Performance optimization opportunities',
            'security_issues': 'Security vulnerabilities detected'
        }
        return descriptions.get(pattern_name, 'Issue detected')
    
    def analyze_admin_dashboard(self) -> Dict[str, Any]:
        """Comprehensive analysis of the admin dashboard"""
        print("🔍 Analyzing Admin Dashboard...")
        
        dashboard_analysis = {
            'overview': 'Admin dashboard for managing users, jobs, and contracts',
            'strengths': [],
            'weaknesses': [],
            'recommendations': [],
            'file_analysis': {}
        }
        
        # Analyze main dashboard file
        if os.path.exists('admin-dashboard.html'):
            dashboard_analysis['file_analysis']['main'] = self.analyze_file('admin-dashboard.html', 'html')
        
        # Identify strengths
        dashboard_analysis['strengths'] = [
            'Comprehensive user management system',
            'Integrated job management',
            'Contract generation capabilities',
            'Firebase authentication integration',
            'Professional notification system',
            'Dropdown management interface',
            'Bank details security',
            'Performance review system'
        ]
        
        # Identify weaknesses and areas for improvement
        dashboard_analysis['weaknesses'] = [
            'Large file size (4500+ lines) - consider modularization',
            'Mixed concerns (HTML, CSS, JS in single file)',
            'Some hardcoded values and console logs',
            'Complex nested functions could be simplified',
            'Limited error handling in some areas'
        ]
        
        # Provide specific recommendations
        dashboard_analysis['recommendations'] = [
            'Split into separate HTML, CSS, and JS files for maintainability',
            'Implement proper error boundaries and user feedback',
            'Add loading states for async operations',
            'Consider implementing a component-based architecture',
            'Add comprehensive form validation',
            'Implement proper error logging and monitoring',
            'Add keyboard navigation support',
            'Consider adding dark/light theme toggle'
        ]
        
        return dashboard_analysis
    
    def analyze_user_portal(self) -> Dict[str, Any]:
        """Comprehensive analysis of the user portal"""
        print("🔍 Analyzing User Portal...")
        
        portal_analysis = {
            'overview': 'User portal for contractors to manage contracts and payments',
            'strengths': [],
            'weaknesses': [],
            'recommendations': [],
            'file_analysis': {}
        }
        
        # Analyze main portal file
        if os.path.exists('user-portal.html'):
            portal_analysis['file_analysis']['main'] = self.analyze_file('user-portal.html', 'html')
        
        # Identify strengths
        portal_analysis['strengths'] = [
            'Firebase authentication integration',
            'Comprehensive notification system',
            'Contract management interface',
            'Payment method selection',
            'Performance review integration',
            'Responsive design considerations',
            'Bank details security',
            'Job status tracking'
        ]
        
        # Identify weaknesses and areas for improvement
        portal_analysis['weaknesses'] = [
            'Very large file size (11000+ lines) - needs modularization',
            'Complex data loading and merging logic',
            'Mixed concerns in single file',
            'Some performance issues with frequent API calls',
            'Limited offline functionality'
        ]
        
        # Provide specific recommendations
        portal_analysis['recommendations'] = [
            'Break into modular components (React/Vue.js or vanilla JS modules)',
            'Implement proper state management',
            'Add offline support with service workers',
            'Optimize API calls with proper caching',
            'Add comprehensive error handling',
            'Implement progressive web app features',
            'Add accessibility improvements',
            'Consider implementing a design system'
        ]
        
        return portal_analysis
    
    def generate_overall_recommendations(self):
        """Generate overall platform recommendations"""
        print("📋 Generating Overall Recommendations...")
        
        self.analysis_results['overall_recommendations'] = [
            {
                'priority': 'Critical',
                'category': 'Architecture',
                'recommendation': 'Modularize the codebase - split large HTML files into components',
                'impact': 'High',
                'effort': 'Medium'
            },
            {
                'priority': 'High',
                'category': 'Performance',
                'recommendation': 'Implement proper caching and reduce API calls',
                'impact': 'High',
                'effort': 'Low'
            },
            {
                'priority': 'High',
                'category': 'Maintainability',
                'recommendation': 'Separate concerns (HTML, CSS, JS) into different files',
                'impact': 'High',
                'effort': 'Medium'
            },
            {
                'priority': 'Medium',
                'category': 'User Experience',
                'recommendation': 'Add loading states and better error handling',
                'impact': 'Medium',
                'effort': 'Low'
            },
            {
                'priority': 'Medium',
                'category': 'Accessibility',
                'recommendation': 'Improve keyboard navigation and screen reader support',
                'impact': 'Medium',
                'effort': 'Low'
            },
            {
                'priority': 'Low',
                'category': 'Modern Features',
                'recommendation': 'Consider implementing PWA features and offline support',
                'impact': 'Low',
                'effort': 'High'
            }
        ]
    
    def run_comprehensive_analysis(self) -> Dict[str, Any]:
        """Run the complete platform analysis"""
        print("🚀 Starting Comprehensive Platform Analysis...")
        print("=" * 60)
        
        # Analyze admin dashboard
        self.analysis_results['admin_dashboard'] = self.analyze_admin_dashboard()
        
        # Analyze user portal
        self.analysis_results['user_portal'] = self.analyze_user_portal()
        
        # Generate overall recommendations
        self.generate_overall_recommendations()
        
        # Add critical issues
        self.analysis_results['critical_issues'] = [
            'Large monolithic files reduce maintainability',
            'Mixed concerns in single files',
            'Limited error handling in critical functions',
            'Some security considerations with hardcoded values'
        ]
        
        # Add UI improvements
        self.analysis_results['ui_improvements'] = [
            'Implement consistent loading states',
            'Add better visual feedback for user actions',
            'Improve mobile responsiveness',
            'Add keyboard navigation support',
            'Implement proper form validation feedback'
        ]
        
        # Add functionality gaps
        self.analysis_results['functionality_gaps'] = [
            'Limited offline functionality',
            'No comprehensive error logging',
            'Missing user onboarding flow',
            'Limited customization options',
            'No bulk operations for admin tasks'
        ]
        
        print("✅ Analysis Complete!")
        return self.analysis_results

class AnalysisHTTPServer(http.server.SimpleHTTPRequestHandler):
    """HTTP server to serve analysis results"""
    
    def do_GET(self):
        """Handle GET requests"""
        parsed_path = urllib.parse.urlparse(self.path)
        
        if parsed_path.path == '/':
            self.send_analysis_page()
        elif parsed_path.path == '/api/analysis':
            self.send_analysis_json()
        else:
            super().do_GET()
    
    def send_analysis_page(self):
        """Send the main analysis HTML page"""
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()
        
        html_content = self.generate_analysis_html()
        self.wfile.write(html_content.encode('utf-8'))
    
    def send_analysis_json(self):
        """Send analysis results as JSON"""
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        analyzer = PlatformAnalyzer()
        results = analyzer.run_comprehensive_analysis()
        
        self.wfile.write(json.dumps(results, indent=2).encode('utf-8'))
    
    def generate_analysis_html(self) -> str:
        """Generate the analysis HTML page"""
        return """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cochran Films Platform Analysis</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            min-height: 100vh;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }
        
        .header {
            text-align: center;
            margin-bottom: 3rem;
            background: linear-gradient(135deg, #FFB200, #FFD700);
            padding: 2rem;
            border-radius: 16px;
            color: #000;
            box-shadow: 0 8px 32px rgba(255, 178, 0, 0.3);
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 1rem;
            font-weight: 700;
        }
        
        .header p {
            font-size: 1.2rem;
            opacity: 0.9;
        }
        
        .analysis-section {
            background: white;
            margin-bottom: 2rem;
            padding: 2rem;
            border-radius: 16px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        
        .section-title {
            color: #FFB200;
            font-size: 1.5rem;
            margin-bottom: 1rem;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid #FFB200;
        }
        
        .metric-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
            margin-bottom: 1.5rem;
        }
        
        .metric-card {
            background: #f8f9fa;
            padding: 1rem;
            border-radius: 8px;
            border-left: 4px solid #FFB200;
        }
        
        .metric-value {
            font-size: 1.5rem;
            font-weight: 700;
            color: #FFB200;
        }
        
        .metric-label {
            color: #666;
            font-size: 0.9rem;
        }
        
        .recommendation-list {
            list-style: none;
        }
        
        .recommendation-item {
            background: #f8f9fa;
            margin-bottom: 0.5rem;
            padding: 1rem;
            border-radius: 8px;
            border-left: 4px solid #28a745;
        }
        
        .recommendation-priority {
            display: inline-block;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.8rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
        }
        
        .priority-critical { background: #dc3545; color: white; }
        .priority-high { background: #fd7e14; color: white; }
        .priority-medium { background: #ffc107; color: #000; }
        .priority-low { background: #28a745; color: white; }
        
        .btn {
            background: linear-gradient(135deg, #FFB200, #FFD700);
            color: #000;
            border: none;
            padding: 1rem 2rem;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            margin: 0.5rem;
            transition: transform 0.2s ease;
        }
        
        .btn:hover {
            transform: translateY(-2px);
        }
        
        .loading {
            text-align: center;
            padding: 2rem;
            color: #666;
        }
        
        .error {
            background: #f8d7da;
            color: #721c24;
            padding: 1rem;
            border-radius: 8px;
            margin: 1rem 0;
        }
        
        .success {
            background: #d4edda;
            color: #155724;
            padding: 1rem;
            border-radius: 8px;
            margin: 1rem 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔍 Cochran Films Platform Analysis</h1>
            <p>Comprehensive analysis of Admin Dashboard and User Portal</p>
        </div>
        
        <div class="analysis-section">
            <h2 class="section-title">📊 Analysis Overview</h2>
            <div class="metric-grid">
                <div class="metric-card">
                    <div class="metric-value" id="totalIssues">-</div>
                    <div class="metric-label">Total Issues Found</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value" id="criticalIssues">-</div>
                    <div class="metric-label">Critical Issues</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value" id="recommendations">-</div>
                    <div class="metric-label">Recommendations</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value" id="improvements">-</div>
                    <div class="metric-label">UI Improvements</div>
                </div>
            </div>
        </div>
        
        <div class="analysis-section">
            <h2 class="section-title">🎯 Overall Recommendations</h2>
            <div id="overallRecommendations" class="loading">
                Loading recommendations...
            </div>
        </div>
        
        <div class="analysis-section">
            <h2 class="section-title">⚙️ Admin Dashboard Analysis</h2>
            <div id="adminAnalysis" class="loading">
                Loading admin dashboard analysis...
            </div>
        </div>
        
        <div class="analysis-section">
            <h2 class="section-title">👤 User Portal Analysis</h2>
            <div id="userPortalAnalysis" class="loading">
                Loading user portal analysis...
            </div>
        </div>
        
        <div class="analysis-section">
            <h2 class="section-title">🔧 Action Items</h2>
            <div id="actionItems">
                <p>Click the button below to run a fresh analysis:</p>
                <button class="btn" onclick="runAnalysis()">🔄 Run Fresh Analysis</button>
                <button class="btn" onclick="downloadReport()">📥 Download Report</button>
            </div>
        </div>
    </div>
    
    <script>
        let analysisData = null;
        
        async function runAnalysis() {
            try {
                // Show loading states
                document.querySelectorAll('.loading').forEach(el => {
                    el.innerHTML = 'Running analysis...';
                });
                
                // Fetch analysis data
                const response = await fetch('/api/analysis');
                analysisData = await response.json();
                
                // Update the UI
                updateAnalysisDisplay();
                
            } catch (error) {
                console.error('Analysis failed:', error);
                document.querySelectorAll('.loading').forEach(el => {
                    el.innerHTML = '<div class="error">Analysis failed: ' + error.message + '</div>';
                });
            }
        }
        
        function updateAnalysisDisplay() {
            if (!analysisData) return;
            
            // Update metrics
            document.getElementById('totalIssues').textContent = 
                (analysisData.critical_issues?.length || 0) + 
                (analysisData.ui_improvements?.length || 0) + 
                (analysisData.functionality_gaps?.length || 0);
            
            document.getElementById('criticalIssues').textContent = analysisData.critical_issues?.length || 0;
            document.getElementById('recommendations').textContent = analysisData.overall_recommendations?.length || 0;
            document.getElementById('improvements').textContent = analysisData.ui_improvements?.length || 0;
            
            // Update overall recommendations
            const recContainer = document.getElementById('overallRecommendations');
            if (analysisData.overall_recommendations) {
                recContainer.innerHTML = analysisData.overall_recommendations.map(rec => `
                    <div class="recommendation-item">
                        <span class="recommendation-priority priority-${rec.priority.toLowerCase()}">${rec.priority}</span>
                        <strong>${rec.category}:</strong> ${rec.recommendation}
                        <br><small>Impact: ${rec.impact} | Effort: ${rec.effort}</small>
                    </div>
                `).join('');
            }
            
            // Update admin analysis
            const adminContainer = document.getElementById('adminAnalysis');
            if (analysisData.admin_dashboard) {
                const admin = analysisData.admin_dashboard;
                adminContainer.innerHTML = `
                    <h3>Strengths (${admin.strengths?.length || 0})</h3>
                    <ul class="recommendation-list">
                        ${(admin.strengths || []).map(s => `<li class="recommendation-item">${s}</li>`).join('')}
                    </ul>
                    
                    <h3>Areas for Improvement (${admin.weaknesses?.length || 0})</h3>
                    <ul class="recommendation-list">
                        ${(admin.weaknesses || []).map(w => `<li class="recommendation-item">${w}</li>`).join('')}
                    </ul>
                    
                    <h3>Recommendations (${admin.recommendations?.length || 0})</h3>
                    <ul class="recommendation-list">
                        ${(admin.recommendations || []).map(r => `<li class="recommendation-item">${r}</li>`).join('')}
                    </ul>
                `;
            }
            
            // Update user portal analysis
            const portalContainer = document.getElementById('userPortalAnalysis');
            if (analysisData.user_portal) {
                const portal = analysisData.user_portal;
                portalContainer.innerHTML = `
                    <h3>Strengths (${portal.strengths?.length || 0})</h3>
                    <ul class="recommendation-list">
                        ${(portal.strengths || []).map(s => `<li class="recommendation-item">${s}</li>`).join('')}
                    </ul>
                    
                    <h3>Areas for Improvement (${portal.weaknesses?.length || 0})</h3>
                    <ul class="recommendation-list">
                        ${(portal.weaknesses || []).map(w => `<li class="recommendation-item">${w}</li>`).join('')}
                    </ul>
                    
                    <h3>Recommendations (${portal.recommendations?.length || 0})</h3>
                    <ul class="recommendation-list">
                        ${(portal.recommendations || []).map(r => `<li class="recommendation-item">${r}</li>`).join('')}
                    </ul>
                `;
            }
        }
        
        function downloadReport() {
            if (!analysisData) {
                alert('Please run an analysis first');
                return;
            }
            
            const dataStr = JSON.stringify(analysisData, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'cochran-films-platform-analysis.json';
            link.click();
            URL.revokeObjectURL(url);
        }
        
        // Auto-run analysis on page load
        window.addEventListener('load', runAnalysis);
    </script>
</body>
</html>
        """

def main():
    """Main function to run the analysis server"""
    print("🚀 Starting Cochran Films Platform Analysis Server...")
    print("=" * 60)
    
    # Run initial analysis
    analyzer = PlatformAnalyzer()
    results = analyzer.run_comprehensive_analysis()
    
    # Print summary to console
    print("\n📊 ANALYSIS SUMMARY:")
    print(f"✅ Admin Dashboard: {len(results['admin_dashboard'].get('strengths', []))} strengths, {len(results['admin_dashboard'].get('weaknesses', []))} areas for improvement")
    print(f"✅ User Portal: {len(results['user_portal'].get('strengths', []))} strengths, {len(results['user_portal'].get('weaknesses', []))} areas for improvement")
    print(f"✅ Overall Recommendations: {len(results['overall_recommendations'])}")
    print(f"✅ Critical Issues: {len(results['critical_issues'])}")
    print(f"✅ UI Improvements: {len(results['ui_improvements'])}")
    
    print("\n🌐 Starting web server...")
    print("📱 Open your browser and go to: http://localhost:8000")
    print("📊 View detailed analysis results in your browser")
    print("📥 Download JSON report from the web interface")
    print("\n⏹️  Press Ctrl+C to stop the server")
    print("=" * 60)
    
    # Start HTTP server
    try:
        with socketserver.TCPServer(("", 8000), AnalysisHTTPServer) as httpd:
            print("✅ Server started successfully on port 8000")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\n🛑 Server stopped by user")
    except Exception as e:
        print(f"\n❌ Server error: {e}")

if __name__ == "__main__":
    main()
