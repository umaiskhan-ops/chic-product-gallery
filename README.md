# Chic Product Gallery

You are building a COMPLETE Shopify product page section for a development store. This is NOT a React app, NOT a Vite app, and NOT a standalone website.

## CRITICAL INSTRUCTION
Generate ONLY pure Shopify Liquid theme code. Do NOT use React, Vite, Next.js, or any JavaScript framework. Use only:
- Shopify Liquid (for theme files)
- HTML5
- Tailwind CSS (via CDN)
- Vanilla JavaScript (ES6+)
- Shopify AJAX Cart API endpoints

## PROJECT CONTEXT
This is a Variant Image Grouping System for a Shopify product page. It filters product images based on selected variant color/size. This will be deployed to a Shopify development store as a custom section.

## DESIGN SYSTEM (Make It Jaw-Dropping)
- **Color Palette:** Clean white (#ffffff) background with soft gray (#f8f9fa) sections. Accent color: Soft Gold (#d4a574).
- **Typography:** Playfair Display for headings (elegant), Inter for body text. Load from Google Fonts with display=swap.
- **Animations:** Images fade in with a cinematic zoom effect. Variant switches feel like a photo gallery with 0.5s transitions.

## THE PRODUCT PAGE EXPERIENCE

### 1. Hero Image (The Showstopper)
- Main product image: Full-width (100% of container), height: 600px
- Hover effect: Image zooms in 1.1x with smooth transition (transform: scale(1.1))
- Next/Previous arrows: Appear on hover, semi-transparent background
- Use: {{ product.selected_or_first_available_variant.featured_image | default: product.featured_image | img_url: '800x' }}

### 2. Variant Thumbnail Gallery (The Magic)
**The Problem It Solves:** Currently all images display simultaneously. This filters them dynamically.

**How It Works:**
- Each variant (e.g., "Blue", "Red", "Black") has images with matching ALT text
- When user selects "Blue", ONLY images with ALT="Blue" appear
- Thumbnails: 5 columns, each thumbnail has hover scale effect (1.05x)

**Technical Implementation:**
```liquid
{% assign featured_image = product.selected_or_first_available_variant.featured_image | default: product.featured_image %}
{% assign featured_alt = product.selected_or_first_available_variant.option1 %}

<div class="thumbnail-gallery">
  {% for image in product.images %}
    {% if image.alt == featured_alt or image == featured_image %}
      <div class="thumbnail-item" data-image="{{ image | img_url: '800x' }}">
        <img src="{{ image | img_url: '100x100' }}" alt="{{ image.alt }}" loading="lazy">
      </div>
    {% endif %}
  {% endfor %}
</div>

3. Variant Selector (But Better)

Color swatches: Circle buttons with actual product color

Selected variant: Pulsing glow border (box-shadow animation)

When variant changes: Hero image transitions with 0.5s fade

For color variants: Use {{ variant.option1 }} as color name

For other options: Show as rounded pills

4. The "Style Guide" Feature (Unique)

Below thumbnails: "Style Inspiration" section showing outfit combinations

Uses product tags: {% if product.tags contains 'summer' %} show summer outfits

Dynamic based on selected color variant

5. Zoom on Hover (Magnifying Glass)

Hovering over main image shows a zoomed-in view (200% scale)

Moves with mouse cursor for a "looking through magnifying glass" effect

Implement using JavaScript mousemove event + CSS transform

SHOPIFY LIQUID VARIABLES TO USE

{{ product.title }} - Product title

{{ product.description }} - Product description

{{ product.price | money }} - Product price with currency

{{ product.compare_at_price | money }} - Compare at price

{{ product.available }} - Availability

{{ product.variants }} - All variants

{{ product.options_with_values }} - Options with values

{{ product.metafields }} - For additional data

FILES TO GENERATE

File 1: sections/product-main.liquid

Complete Shopify section file with:

{% schema %} block with:

name: "Custom Product Page"

settings: gallery_layout (grid/slider), image_size, show_style_inspiration

blocks: for product features (optional)

Full HTML structure for:

Two-column layout (image gallery | product info)

Hero image with zoom on hover

Thumbnail gallery with variant filtering

Variant selector (color swatches + options)

Add to cart with AJAX

Style inspiration section

File 2: assets/variant-images.js

Complete JavaScript file with:

Variant change handler: When variant selected, filter thumbnails

Image transition: Fade hero image when variant changes

Magnifying glass: Zoom on hover with mouse movement

AJAX add to cart: fetch('/cart/add.js', { method: 'POST', body: formData })

Debouncing for rapid clicks

File 3: assets/variant-images.css

Complete CSS file with:

Gallery styling (grid, spacing)

Zoom effect (transform + transition)

Magnifying glass (cursor: crosshair, zoomed view)

Color swatches (rounded circles, glow on selected)

Responsive (mobile: single column, tablet: 2 columns, desktop: 2 columns)

Animations (fade, pulse, scale)

File 4: snippets/style-inspiration.liquid

Liquid snippet for outfit combinations:

Accepts product_tags and selected_color as parameters

Uses product tags to show complementary items

Example: "Complete The Look - Summer Collection" with 3 items

SHOPIFY 2.0 THEME COMPATIBILITY

All files must follow Shopify's theme architecture standards

Use {{ content_for_header }} for Shopify assets

Section must be usable in theme customizer

RESPONSIVE REQUIREMENTS

Mobile: Single column, stacked layout

Tablet: Two columns (image left, info right)

Desktop: Two columns with larger images

BUSINESS METRICS (Display in dashboard)

Product page bounce rate: Target < 25% (from 65%)

Add-to-cart rate: Target +20% increase

Time on product page: Target +45% increase

DEPLOYMENT TARGET

Shopify development store: your-store-2.myshopify.com

Theme: Compatible with Dawn-based themes

FINAL INSTRUCTION

Generate complete, production-ready code for all 4 files. The code should be clean, well-commented, and follow Shopify Liquid best practices. No React, no Vite, no framework - ONLY Shopify Liquid + HTML + Tailwind + Vanilla JS.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/366c7a53-a2c2-4baa-ad2c-2cb993addfdb).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
