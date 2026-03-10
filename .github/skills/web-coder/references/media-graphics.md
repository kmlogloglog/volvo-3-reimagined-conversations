# Media & Graphics Reference

Images, video, audio, SVG, Canvas, and WebGL for web development.

## Images

### Formats

| Format | Best For | Transparency | Animation |
|--------|---------|--------------|-----------|
| JPEG/JPG | Photos | ❌ | ❌ |
| PNG | Graphics, screenshots | ✅ | ❌ |
| GIF | Simple animations | ✅ | ✅ |
| WebP | General purpose | ✅ | ✅ |
| AVIF | Modern compression | ✅ | ✅ |
| SVG | Icons, logos | ✅ | ✅ |
| ICO | Favicons | ✅ | ❌ |

### Responsive Images

```html
<!-- Srcset with sizes -->
<img
  srcset="
    image-300.jpg 300w,
    image-600.jpg 600w,
    image-900.jpg 900w"
  sizes="
    (max-width: 600px) 100vw,
    (max-width: 1200px) 50vw,
    33vw"
  src="image-600.jpg"
  alt="Description">

<!-- Art direction with picture -->
<picture>
  <source
    media="(min-width: 1200px)"
    srcset="wide.webp"
    type="image/webp">
  <source
    media="(min-width: 1200px)"
    srcset="wide.jpg">
  <source
    media="(min-width: 600px)"
    srcset="medium.webp"
    type="image/webp">
  <img src="small.jpg" alt="Description">
</picture>
```

### Performance

```html
<!-- Lazy loading -->
<img loading="lazy" src="image.jpg" alt="...">

<!-- Eager loading (above fold) -->
<img loading="eager" src="hero.jpg" alt="...">

<!-- Decoding hint -->
<img decoding="async" src="image.jpg" alt="...">

<!-- Priority hints -->
<img fetchpriority="high" src="hero.jpg" alt="...">
<img fetchpriority="low" src="thumbnail.jpg" alt="...">
```

## SVG (Scalable Vector Graphics)

Resolution-independent vector format.

```html
<!-- Inline SVG -->
<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 100 100"
  width="100"
  height="100"
  aria-hidden="true">
  <circle cx="50" cy="50" r="40" fill="blue" stroke="navy" stroke-width="2"/>
</svg>

<!-- Common SVG elements -->
<rect x="10" y="10" width="80" height="80" fill="red"/>
<line x1="0" y1="0" x2="100" y2="100" stroke="black"/>
<polyline points="0,0 50,100 100,0" fill="none" stroke="black"/>
<polygon points="50,0 100,100 0,100" fill="yellow"/>
<ellipse cx="50" cy="50" rx="40" ry="20"/>
<path d="M 10 80 C 40 10 65 10 95 80 S 150 150 180 80" fill="none" stroke="blue"/>
<text x="50" y="50" text-anchor="middle" font-size="16">Text</text>
```

### SVG Styling

```css
/* External CSS for SVG */
svg circle {
  fill: blue;
  stroke: navy;
  stroke-width: 2;
}

/* CSS variables work! */
svg path {
  fill: var(--primary-color);
}
```

### SVG with JavaScript

```javascript
// Create SVG programmatically
const svgNS = 'http://www.w3.org/2000/svg';
const svg = document.createElementNS(svgNS, 'svg');
svg.setAttribute('viewBox', '0 0 100 100');

const circle = document.createElementNS(svgNS, 'circle');
circle.setAttribute('cx', '50');
circle.setAttribute('cy', '50');
circle.setAttribute('r', '40');
circle.setAttribute('fill', 'blue');
svg.appendChild(circle);

document.body.appendChild(svg);
```

## Canvas (2D)

Raster graphics via JavaScript API.

```javascript
const canvas = document.querySelector('#canvas');
const ctx = canvas.getContext('2d');

// Drawing shapes
ctx.fillStyle = 'red';
ctx.fillRect(10, 10, 100, 50);
ctx.strokeStyle = 'blue';
ctx.strokeRect(10, 10, 100, 50);
ctx.clearRect(10, 10, 100, 50);

// Paths
ctx.beginPath();
ctx.moveTo(0, 0);
ctx.lineTo(100, 100);
ctx.arc(75, 75, 50, 0, Math.PI * 2);
ctx.closePath();
ctx.fill();
ctx.stroke();

// Text
ctx.font = '20px Arial';
ctx.fillText('Hello Canvas', 50, 50);

// Images
const img = new Image();
img.onload = () => ctx.drawImage(img, 0, 0, 100, 100);
img.src = 'image.jpg';

// Canvas to data URL
const dataURL = canvas.toDataURL('image/png');

// Transformations
ctx.save();
ctx.translate(100, 100);
ctx.rotate(Math.PI / 4);
ctx.scale(2, 2);
ctx.fillRect(-25, -25, 50, 50);
ctx.restore();
```

## WebGL

3D graphics in the browser.

```javascript
const canvas = document.querySelector('#canvas');
const gl = canvas.getContext('webgl2');

// Basic setup
gl.clearColor(0.0, 0.0, 0.0, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT);

// WebGL requires shaders (GLSL)
const vertShader = `
  attribute vec4 aPosition;
  void main() {
    gl_Position = aPosition;
  }
`;

const fragShader = `
  precision mediump float;
  void main() {
    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
  }
`;
```

**Libraries**: Three.js, Babylon.js, A-Frame, p5.js

## Video

```html
<video
  id="myVideo"
  controls
  autoplay
  muted
  loop
  preload="metadata"
  poster="thumbnail.jpg"
  playsinline>
  <source src="video.webm" type="video/webm">
  <source src="video.mp4" type="video/mp4">
  <track kind="captions" src="captions.vtt" srclang="en" label="English">
  Your browser doesn't support video.
</video>
```

### JavaScript Video Control

```javascript
const video = document.querySelector('#myVideo');

video.play();
video.pause();
video.currentTime = 30;
video.playbackRate = 1.5;
video.volume = 0.5;
video.muted = true;

// Events
video.addEventListener('play', () => console.log('Playing'));
video.addEventListener('pause', () => console.log('Paused'));
video.addEventListener('ended', () => console.log('Ended'));
video.addEventListener('timeupdate', () => {
  const progress = video.currentTime / video.duration;
  updateProgressBar(progress);
});
```

### Video Formats

| Format | Container | Video Codec | Browser Support |
|--------|-----------|-------------|----------------|
| MP4 | .mp4 | H.264 | Universal |
| WebM | .webm | VP8/VP9 | Modern |
| OGV | .ogv | Theora | Firefox |
| AV1 | .webm | AV1 | Modern (2023+) |

## Audio

```html
<audio controls>
  <source src="audio.ogg" type="audio/ogg">
  <source src="audio.mp3" type="audio/mpeg">
  <source src="audio.wav" type="audio/wav">
</audio>
```

### Web Audio API

```javascript
const audioCtx = new AudioContext();

// Load and play
async function loadAudio(url) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

  const source = audioCtx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioCtx.destination);
  source.start();
}
```

## CSS Filters and Effects

```css
/* Image filters */
.element {
  filter: blur(5px);
  filter: brightness(1.5);
  filter: contrast(200%);
  filter: grayscale(100%);
  filter: hue-rotate(90deg);
  filter: invert(100%);
  filter: opacity(50%);
  filter: saturate(200%);
  filter: sepia(100%);
  filter: drop-shadow(5px 5px 5px rgba(0,0,0,0.5));
}

/* Background filter (blur behind element) */
.frosted-glass {
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.2);
}
```

## CSS Background and Gradients

```css
.element {
  /* Background image */
  background-image: url('image.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;

  /* Gradient */
  background: linear-gradient(135deg, #f0f0f0 0%, #fff 100%);
  background: radial-gradient(circle at center, #fff 0%, #f0f0f0 100%);
  background: conic-gradient(from 0deg, red, green, blue);

  /* Multiple backgrounds */
  background:
    url('icon.svg') no-repeat top right,
    linear-gradient(to bottom, #fff 0%, #f0f0f0 100%);
}
```

## Image Optimization Tips

1. **Use modern formats**: WebP, AVIF (with fallbacks)
2. **Set dimensions**: Always specify width and height
3. **Compress images**: Use tools like ImageOptim, Squoosh
4. **Lazy load**: Off-screen images
5. **Use CDN**: Serve from edge locations
6. **Responsive images**: Serve correct size for screen
7. **SVG for icons**: Scalable, tiny file size

## Glossary Terms

**Key Terms Covered**:
- Alpha (blending), Aspect ratio, Canvas, Color model
- Compositing, Compression, Decoding, Encoding
- GIF, JPEG, Media, PNG, Pixel, Resolution, RGB
- SVG, Sprite, Transparent, Vector, WebGL, WebP

## Additional Resources

- [MDN Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [MDN SVG](https://developer.mozilla.org/en-US/docs/Web/SVG)
- [Google Images Guide](https://web.dev/fast/#optimize-your-images)
- [Three.js](https://threejs.org/)
