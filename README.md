[](/images/mykk-2560x1440.jpeg)

# MyKK.us

A minimalist, responsive web page for [MyKK.us](https://mykk.us/) that displays a Krispy Kreme-themed image, optimized for different viewport sizes, and redirects to the official Krispy Kreme website upon clicking. The image is centered both vertically and horizontally, ensuring it is never cropped, with different image resolutions served based on the device's screen size.

## Features

- **Responsive Images**: Uses the HTML `<picture>` element to serve different image sizes based on viewport width:
    - `mykk-800x1063.jpg` for screens ≤800px (phones).
    - `mykk-1653-1136.jpg` for screens ≤1653px (tablets/small laptops).
    - `mykk-1680x1050.jpg` for screens ≤1680px (laptops).
    - `mykk-1920x1080.jpg` for screens ≤1920px (desktops).
    - `mykk-2560x1440.jpeg` for screens ≤2560px (high-res displays).
    - `mykk-3648x2736.jpeg` for screens >2560px (4K displays).
    - `mykk-3508x2480.jpg` as the fallback image.
- **No Cropping**: Images are displayed using `object-fit: contain` to ensure the entire image is visible without cropping.
- **Centered Alignment**: Images are centered both vertically and horizontally using Flexbox and `object-position: center`.
- **Mobile Optimization**: On smaller screens (≤768px), images fit the full width with natural height, maintaining aspect ratio.
- **Click Redirect**: Clicking the image redirects to [Krispy Kreme's official website](https://www.krispykreme.com/).
- **Clean Design**: Minimal CSS with a fallback background color for empty space around images.

## Project Structure

```
mykk.us/
├── index.html         # Main HTML file
├── images/            # Directory for image assets
│   ├── mykk-800x1063.jpg
│   ├── mykk-1653-1136.jpg
│   ├── mykk-1680x1050.jpg
│   ├── mykk-1920x1080.jpg
│   ├── mykk-2560x1440.jpeg
│   ├── mykk-3508x2480.jpg
│   └── mykk-3648x2736.jpeg
└── README.md          # This file
```

## Setup

1. **Clone the Repository**:
    
    ```bash
    git clone https://github.com/MichalAFerber/mykk.us.git
    cd mykk.us
    ```
    
2. **Add Image Assets**:
    
    - Place the required images (`mykk-*.jpg/jpeg`) in the `images/` directory.
    - Update the `<source>` and `<img>` `srcset`/`src` attributes in `index.html` with the correct paths or URLs to your images (e.g., `https://mykk.us/images/mykk-800x1063.jpg`).
3. **Host the Website**:
    
    - **Local Development**: Use a local server like `live-server` or Python’s HTTP server:
        
        ```bash
        python -m http.server 8000
        ```
        
        Then open `http://localhost:8000` in your browser.
    - **Deploy**: Upload the files to a web server or hosting service (e.g., GitHub Pages, Netlify, or your own server). Ensure the `images/` directory is accessible.
4. **Test Responsiveness**:
    
    - Use browser developer tools to simulate different screen sizes.
    - Verify that the correct image loads based on viewport width and that it is centered without cropping.

## Usage

- Open the website ([https://mykk.us](https://mykk.us/)) in a browser.
- The appropriate image will load based on your device’s viewport size.
- Click the image to be redirected to [https://www.krispykreme.com/](https://www.krispykreme.com/).

## Customization

- **Image Paths**: Replace placeholder paths (`/images/mykk-*.jpg`) in `index.html` with actual URLs or file paths (e.g., `https://mykk.us/images/mykk-800x1063.jpg`).
- **Background Color**: Modify `background-color: #f0f0f0` in the `<style>` section of `index.html` to change the color of empty space around images.
- **Breakpoints**: Adjust the `media` queries in the `<source>` tags (e.g., `max-width: 800px`) to change which image is served for specific viewport sizes.
- **Image Optimization**: Compress images to reduce load times, especially for mobile devices.

## Notes

- Ensure images are optimized for web use to improve performance.
- Test across various devices and screen sizes to confirm proper image selection and centering.
- The fallback background color (`#f0f0f0`) can be customized to match your design or Krispy Kreme’s branding.
- If hosting images externally, ensure the URLs are reliable and accessible.
- The website is live at [https://mykk.us](https://mykk.us/).

### License

This project is for personal or demonstration purposes. Ensure you have permission to use and distribute the Krispy Kreme-themed images.
