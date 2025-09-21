#!/usr/bin/env python3
"""
Linked HTML to PDF Converter for Cochran Films Pitch Deck
Embeds images as base64 and includes real links from the original HTML.
"""

import os
import subprocess
import tempfile
import base64
import mimetypes

def image_to_base64(image_path):
    """Convert an image file to base64 data URL."""
    try:
        with open(image_path, 'rb') as img_file:
            img_data = img_file.read()
            
        # Determine MIME type
        mime_type, _ = mimetypes.guess_type(image_path)
        if mime_type is None:
            # Default to image/png for unknown types
            mime_type = 'image/png'
            
        # Convert to base64
        base64_data = base64.b64encode(img_data).decode('utf-8')
        return f"data:{mime_type};base64,{base64_data}"
    except Exception as e:
        print(f"Warning: Could not convert {image_path} to base64: {e}")
        return None

def create_pdf_version():
    """Convert the HTML pitch deck to PDF using Chrome with embedded images and real links."""
    
    html_file = "Pitch.html"
    pdf_file = "Pitch.pdf"
    
    if not os.path.exists(html_file):
        print(f"Error: {html_file} not found!")
        return False
    
    print("Converting HTML pitch deck to PDF with embedded images and real links...")
    
    # Convert images to base64
    print("Converting images to base64...")
    image_mappings = {
        'Logo.png': 'logo_base64',
        'Matthias Brown (TraceLoops) - Double Exposure.gif': 'slide1_bg',
        'Din Perlis - Crash Zoom.gif': 'slide2_bg',
        'Vincent Haycock - Echo print.gif': 'slide3_bg',
        'Dave Meyers - Bolt Cam.gif': 'slide4_bg',
        'Zac Dov Wiesel - Bolt Cam.gif': 'slide5_bg',
        'Fixed Cam.gif': 'slide6_bg',
        'Valentin Petit - Object Portal.gif': 'slide7_bg'
    }
    
    base64_images = {}
    for image_file, key in image_mappings.items():
        if os.path.exists(image_file):
            base64_data = image_to_base64(image_file)
            if base64_data:
                base64_images[key] = base64_data
                print(f"✅ Converted {image_file}")
            else:
                print(f"❌ Failed to convert {image_file}")
        else:
            print(f"⚠️  Image not found: {image_file}")
    
    # Create a PDF-optimized HTML version with embedded images and real links
    pdf_html = create_pdf_optimized_html(base64_images)
    
    # Write to temporary file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.html', delete=False) as temp_html:
        temp_html.write(pdf_html)
        temp_html_path = temp_html.name
    
    try:
        # Use Chrome to convert to PDF
        chrome_path = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
        
        if not os.path.exists(chrome_path):
            print(f"Chrome not found at {chrome_path}")
            return False
        
        # Convert file path to URL
        html_url = f"file://{os.path.abspath(temp_html_path)}"
        
        cmd = [
            chrome_path,
            '--headless',
            '--disable-gpu',
            '--no-sandbox',
            '--print-to-pdf-no-header',
            f'--print-to-pdf={pdf_file}',
            '--print-to-pdf-landscape',
            '--disable-web-security',
            '--allow-file-access-from-files',
            '--disable-features=VizDisplayCompositor',
            html_url
        ]
        
        print("Running Chrome conversion with embedded images and real links...")
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0 and os.path.exists(pdf_file):
            print(f"✅ Chrome conversion successful: {pdf_file}")
            return True
        else:
            print(f"❌ Chrome conversion failed: {result.stderr}")
            return False
            
    finally:
        # Clean up temporary file
        if os.path.exists(temp_html_path):
            os.unlink(temp_html_path)

def create_pdf_optimized_html(base64_images):
    """Create a PDF-optimized version of the HTML with embedded images and real links."""
    
    # Get base64 data for images
    logo_b64 = base64_images.get('logo_base64', '')
    slide1_bg = base64_images.get('slide1_bg', '')
    slide2_bg = base64_images.get('slide2_bg', '')
    slide3_bg = base64_images.get('slide3_bg', '')
    slide4_bg = base64_images.get('slide4_bg', '')
    slide5_bg = base64_images.get('slide5_bg', '')
    slide6_bg = base64_images.get('slide6_bg', '')
    slide7_bg = base64_images.get('slide7_bg', '')
    
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cochran Films - Media Production Pitch Deck</title>
    
    <style>
        @font-face {{
            font-family: 'Poppins Bold';
            src: url('Poppins-Bold.ttf') format('truetype');
            font-weight: bold;
            font-style: normal;
        }}

        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}

        body {{
            font-family: 'Arial', sans-serif;
            background: #000;
            color: #fff;
            margin: 0;
            padding: 0;
        }}

        .pdf-page {{
            page-break-after: always;
            width: 100%;
            height: 100vh;
            position: relative;
            background-size: cover;
            background-position: center;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            padding: 2rem;
            box-sizing: border-box;
        }}

        .pdf-page:last-child {{
            page-break-after: avoid;
        }}

        .page-overlay {{
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            padding: 2rem;
            box-sizing: border-box;
        }}

        .pdf-page h1 {{
            font-size: 3.5rem;
            margin-bottom: 1rem;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
            text-align: center;
            max-width: 100%;
            font-weight: 700;
            line-height: 1.2;
        }}

        .pdf-page h2 {{
            font-size: 2.2rem;
            margin-bottom: 1rem;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
            text-align: center;
            max-width: 100%;
            font-weight: 600;
            line-height: 1.3;
        }}

        .pdf-page p {{
            font-size: 1.1rem;
            max-width: 800px;
            line-height: 1.6;
            margin-bottom: 2rem;
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
            text-align: center;
            margin-left: auto;
            margin-right: auto;
            opacity: 0.9;
        }}

        .cta-button {{
            display: inline-block;
            padding: 14px 36px;
            background: #000000;
            color: #FFB200;
            text-decoration: none;
            border-radius: 6px;
            font-family: 'Poppins Bold', sans-serif;
            font-size: 1rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            border: 2px solid #FFB200;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            margin: 1rem 0;
            transition: all 0.3s ease;
        }}

        .cta-button:hover {{
            background: #FFB200;
            color: #000000;
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(255, 178, 0, 0.3);
        }}

        .stats {{
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 2rem;
            margin: 2rem auto;
            max-width: 800px;
            width: 100%;
            flex-wrap: wrap;
        }}

        .stat {{
            text-align: center;
            padding: 1.5rem 1.2rem;
            background: rgba(0, 0, 0, 0.4);
            border-radius: 6px;
            border: 1px solid rgba(255, 178, 0, 0.3);
            min-width: 140px;
        }}

        .stat-number {{
            font-size: 2.2rem;
            font-weight: 900;
            color: #FFB200;
            font-family: 'Poppins Bold', sans-serif;
            margin-bottom: 0.3rem;
            letter-spacing: 0.5px;
        }}

        .stat-label {{
            font-size: 0.85rem;
            color: #FFFFFF;
            font-family: 'Poppins Bold', sans-serif;
            font-weight: 600;
            opacity: 0.9;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            line-height: 1.2;
        }}

        .logo {{
            position: absolute;
            top: 30px;
            left: 30px;
            height: 60px;
            width: auto;
            z-index: 10;
        }}

        .contact-info {{
            position: absolute;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            text-align: center;
            font-size: 0.9rem;
            opacity: 0.8;
            z-index: 10;
        }}

        /* PDF-specific optimizations */
        @page {{
            size: A4 landscape;
            margin: 0;
        }}

        @media print {{
            body {{
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
            }}
            
            .pdf-page {{
                page-break-after: always;
                height: 100vh;
            }}
        }}
    </style>
</head>
<body>
    <img src="{logo_b64}" alt="Cochran Films" class="logo">

    <!-- Slide 1: Hero/Introduction -->
    <div class="pdf-page" style="background-image: url('{slide1_bg}');">
        <div class="page-overlay">
            <h1>STORIES THAT TELL THEMSELVES</h1>
            <p>Through data-driven content strategy and omnichannel marketing, we ensure your visuals aren't just seen—they convert across all platforms.</p>
            <div class="stats">
                <div class="stat">
                    <div class="stat-number">500+</div>
                    <div class="stat-label">Projects Completed</div>
                </div>
                <div class="stat">
                    <div class="stat-number">100+</div>
                    <div class="stat-label">Happy Clients</div>
                </div>
                <div class="stat">
                    <div class="stat-number">24/7</div>
                    <div class="stat-label">Support</div>
                </div>
            </div>
            <a href="https://www.cochranfilms.com/contact" class="cta-button" target="_blank">START YOUR STORY</a>
        </div>
        <div class="contact-info">Available for projects worldwide • Atlanta based • Remote friendly</div>
    </div>

    <!-- Slide 2: Videography -->
    <div class="pdf-page" style="background-image: url('{slide2_bg}');">
        <div class="page-overlay">
            <h2>CINEMATIC VIDEOGRAPHY</h2>
            <p>From corporate documentaries to artistic music videos, we craft visual narratives that captivate audiences and drive engagement. Our team combines technical expertise with creative vision to deliver content that moves both hearts and metrics.</p>
            <div class="stats">
                <div class="stat">
                    <div class="stat-number">4K</div>
                    <div class="stat-label">Ultra HD Quality</div>
                </div>
                <div class="stat">
                    <div class="stat-number">48HR</div>
                    <div class="stat-label">Quick Turnaround</div>
                </div>
            </div>
            <a href="https://www.cochranfilms.com/portfolio" class="cta-button" target="_blank">SEE OUR WORK</a>
        </div>
        <div class="contact-info">Available for projects worldwide • Atlanta based • Remote friendly</div>
    </div>

    <!-- Slide 3: Photography -->
    <div class="pdf-page" style="background-image: url('{slide3_bg}');">
        <div class="page-overlay">
            <h2>PROFESSIONAL PHOTOGRAPHY</h2>
            <p>Whether it's capturing the energy of a corporate event, the intimacy of portraits, or the elegance of product shots, our photography services ensure every frame tells a compelling story that resonates with your audience.</p>
            <div class="stats">
                <div class="stat">
                    <div class="stat-number">∞</div>
                    <div class="stat-label">Creative Possibilities</div>
                </div>
                <div class="stat">
                    <div class="stat-number">Live</div>
                    <div class="stat-label">Event Printing</div>
                </div>
            </div>
            <a href="https://www.cochranfilms.com/service-page/professional-event-photography" class="cta-button" target="_blank">BOOK A SESSION</a>
        </div>
        <div class="contact-info">Available for projects worldwide • Atlanta based • Remote friendly</div>
    </div>

    <!-- Slide 4: Brand Creation -->
    <div class="pdf-page" style="background-image: url('{slide4_bg}');">
        <div class="page-overlay">
            <h2>COMPLETE BRAND DEVELOPMENT</h2>
            <p>From strategy to execution, we build brands from scratch. Our comprehensive approach includes logo design, website development, content strategy, and ongoing digital presence management—everything you need to establish and grow your brand.</p>
            <div class="stats">
                <div class="stat">
                    <div class="stat-number">360°</div>
                    <div class="stat-label">Full Service</div>
                </div>
                <div class="stat">
                    <div class="stat-number">2 Days</div>
                    <div class="stat-label">Website Build</div>
                </div>
            </div>
            <a href="https://www.cochranfilms.com/brand-building" class="cta-button" target="_blank">BUILD MY BRAND</a>
        </div>
        <div class="contact-info">Available for projects worldwide • Atlanta based • Remote friendly</div>
    </div>

    <!-- Slide 5: Live Event Services -->
    <div class="pdf-page" style="background-image: url('{slide5_bg}');">
        <div class="page-overlay">
            <h2>LIVE EVENT PRINTING</h2>
            <p>Capture the moment. Print it instantly. From proms to corporate events, we deliver high-quality prints on-site with our smart camera-to-printer system. Guests walk away with real memories in hand—custom-branded and professionally captured.</p>
            <div class="stats">
                <div class="stat">
                    <div class="stat-number">Instant</div>
                    <div class="stat-label">Photo Delivery</div>
                </div>
                <div class="stat">
                    <div class="stat-number">Custom</div>
                    <div class="stat-label">Branded Templates</div>
                </div>
            </div>
            <a href="https://www.cochranfilms.com/service-page/on-site-event-photo-printing" class="cta-button" target="_blank">BOOK EVENT SERVICES</a>
        </div>
        <div class="contact-info">Available for projects worldwide • Atlanta based • Remote friendly</div>
    </div>

    <!-- Slide 6: Web Development -->
    <div class="pdf-page" style="background-image: url('{slide6_bg}');">
        <div class="page-overlay">
            <h2>WEBSITE DEVELOPMENT & MAINTENANCE</h2>
            <p>We don't just build beautiful websites — we help your brand grow online for the long haul. From strategy and design to publishing and upkeep, we handle everything so you can focus on growing your brand.</p>
            <div class="stats">
                <div class="stat">
                    <div class="stat-number">2 Days</div>
                    <div class="stat-label">Website Build</div>
                </div>
                <div class="stat">
                    <div class="stat-number">24/7</div>
                    <div class="stat-label">Maintenance</div>
                </div>
                <div class="stat">
                    <div class="stat-number">100%</div>
                    <div class="stat-label">Mobile Optimized</div>
                </div>
            </div>
            <a href="https://www.cochranfilms.com/service-page/custom-website-design" class="cta-button" target="_blank">LAUNCH MY SITE</a>
        </div>
        <div class="contact-info">Available for projects worldwide • Atlanta based • Remote friendly</div>
    </div>

    <!-- Slide 7: Call to Action -->
    <div class="pdf-page" style="background-image: url('{slide7_bg}');">
        <div class="page-overlay">
            <h1>READY TO ELEVATE YOUR BRAND?</h1>
            <p>Join hundreds of businesses, entrepreneurs, and creatives who have transformed their brand presence with Cochran Films. Let's create something extraordinary together.</p>
            <div class="stats">
                <div class="stat">
                    <div class="stat-number">Contact</div>
                    <div class="stat-label">info@cochranfilms.com</div>
                </div>
                <div class="stat">
                    <div class="stat-number">Visit</div>
                    <div class="stat-label">cochranfilms.com</div>
                </div>
            </div>
            <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                <a href="https://www.cochranfilms.com/contact" class="cta-button" target="_blank">GET STARTED TODAY</a>
                <a href="https://www.cochranfilms.com/pricing" class="cta-button" target="_blank">VIEW PRICING</a>
            </div>
        </div>
        <div class="contact-info">Available for projects worldwide • Atlanta based • Remote friendly</div>
    </div>
</body>
</html>"""

if __name__ == "__main__":
    print("🎬 Linked Cochran Films Pitch Deck PDF Converter")
    print("=" * 60)
    
    if create_pdf_version():
        print("\n🎉 Conversion completed successfully!")
        print(f"📄 PDF saved as: {os.path.abspath('Pitch.pdf')}")
        print("\n🔗 Links included:")
        print("• Slide 1: https://www.cochranfilms.com/contact")
        print("• Slide 2: https://www.cochranfilms.com/portfolio")
        print("• Slide 3: https://www.cochranfilms.com/service-page/professional-event-photography")
        print("• Slide 4: https://www.cochranfilms.com/brand-building")
        print("• Slide 5: https://www.cochranfilms.com/service-page/on-site-event-photo-printing")
        print("• Slide 6: https://www.cochranfilms.com/service-page/custom-website-design")
        print("• Slide 7: https://www.cochranfilms.com/contact & https://www.cochranfilms.com/pricing")
    else:
        print("\n❌ Conversion failed!")
        exit(1) 