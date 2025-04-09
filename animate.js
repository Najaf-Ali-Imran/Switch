
const canvas = document.getElementById('canvas');
const ctx = canvas?.getContext('2d');


const colors = [
    '#03624c', '#00df82', '#027757', '#01a36b', '#015239', '#01d177'
];

let particles = [];
const particleCount = 600; 
const noiseScale = 0.004;
const noiseSpeed = 0.0015;
const particleSpeed = 0.8; 
const trailLifespan = 50; 
const baseMaxTrailLength = 20; 


const SimplexNoise = function() {
  const grad3 = [[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],[1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],[0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]];
  const p = []; for (let i=0; i<256; i++) { p[i] = Math.floor(Math.random()*256); }
  const perm = new Array(512); const permMod12 = new Array(512);
  for(let i=0; i<512; i++) { perm[i] = p[i & 255]; permMod12[i] = perm[i] % 12; }
  const F2 = 0.5*(Math.sqrt(3.0)-1.0); const G2 = (3.0-Math.sqrt(3.0))/6.0;
  const dot = (g, x, y) => g[0]*x + g[1]*y;
  return {
    noise: function(xin, yin) {
      let n0, n1, n2;
      const s = (xin+yin)*F2; const i = Math.floor(xin+s); const j = Math.floor(yin+s);
      const t = (i+j)*G2; const X0 = i-t; const Y0 = j-t; const x0 = xin-X0; const y0 = yin-Y0;
      const i1 = (x0>y0) ? 1:0; const j1 = (x0>y0) ? 0:1;
      const x1 = x0 - i1 + G2; const y1 = y0 - j1 + G2; const x2 = x0 - 1.0 + 2.0 * G2; const y2 = y0 - 1.0 + 2.0 * G2;
      const ii = i & 255; const jj = j & 255;
      const gi0 = permMod12[ii+perm[jj]]; const gi1 = permMod12[ii+i1+perm[jj+j1]]; const gi2 = permMod12[ii+1+perm[jj+1]];
      let t0 = 0.5 - x0*x0-y0*y0; if(t0<0) n0 = 0.0; else { t0 *= t0; n0 = t0 * t0 * dot(grad3[gi0], x0, y0); }
      let t1 = 0.5 - x1*x1-y1*y1; if(t1<0) n1 = 0.0; else { t1 *= t1; n1 = t1 * t1 * dot(grad3[gi1], x1, y1); }
      let t2 = 0.5 - x2*x2-y2*y2; if(t2<0) n2 = 0.0; else { t2 *= t2; n2 = t2 * t2 * dot(grad3[gi2], x2, y2); }
      return 70.0 * (n0 + n1 + n2);
    }
  };
};
const simplex = new SimplexNoise();

let time = 0;

class Particle {
  constructor(initialX, initialY) {
    this.x = initialX ?? Math.random() * canvas.width;
    this.y = initialY ?? Math.random() * canvas.height;
    this.color = colors[Math.floor(Math.random() * colors.length)];
    this.baseSize = Math.random() * 1.5 + 1.0; 
    this.opacity = Math.random() * 0.4 + 0.2;
    this.speed = Math.random() * 0.5 + particleSpeed; 
    this.trailFadeFactor = 0.92;
    this.lifespan = Math.random() * 150 + 150; 
    this.resetPosition(); 
  }

 
  resetState() {
    this.age = 0;
    this.trail = [];
    this.maxTrailLength = Math.floor(Math.random() * 8) + baseMaxTrailLength; 
    this.trailOpacity = this.opacity; 
    this.size = this.baseSize; 
  }

  
  resetPosition() {
      const side = Math.floor(Math.random() * 4);
      if (side === 0) { 
          this.x = Math.random() * canvas.width; this.y = -5;
      } else if (side === 1) { 
          this.x = canvas.width + 5; this.y = Math.random() * canvas.height;
      } else if (side === 2) { 
          this.x = Math.random() * canvas.width; this.y = canvas.height + 5;
      } else { 
          this.x = -5; this.y = Math.random() * canvas.height;
      }
      this.resetState();
  }

  update() {
    if (!canvas || !ctx) return; 

    this.age++;
    if (this.age > this.lifespan) {
      this.resetPosition(); 
      return;
    }

  
    this.trail.push({x: this.x, y: this.y, age: 0});

  
    for (let i = 0; i < this.trail.length; i++) {
      this.trail[i].age++;
    }
    this.trail = this.trail.filter(point => point.age < trailLifespan);

   
    if (this.trail.length > this.maxTrailLength) {
      this.trail.shift();
    }

  
    const noiseValue = simplex.noise(this.x * noiseScale, this.y * noiseScale + time);
    const baseAngle = noiseValue * Math.PI * 2;

    const waveInfluence = Math.sin(time * 1.5 + this.x * 0.01 + this.y * 0.005) * 0.2;
    const angle = baseAngle + waveInfluence;


    this.x += Math.cos(angle) * this.speed;
    this.y += Math.sin(angle) * this.speed;

    if (this.x < -10 || this.x > canvas.width + 10 || this.y < -10 || this.y > canvas.height + 10) {
      this.resetPosition();
      return; 
    }

    if (this.age > this.lifespan * 0.7) {
      this.trailOpacity = Math.max(0, this.trailOpacity * this.trailFadeFactor);
    }

    this.draw();
  }

  draw() {
     if (!ctx || this.trail.length < 2) return; 

    const sizeVariation = Math.sin(time * 2.5 + this.x * 0.03) * 0.3 + 0.85; 
    const currentSize = Math.max(0.5, this.baseSize * sizeVariation); 

    ctx.beginPath();
    ctx.moveTo(this.trail[0].x, this.trail[0].y);

    for (let i = 1; i < this.trail.length - 1; i++) {
      const xc = (this.trail[i].x + this.trail[i+1].x) / 2;
      const yc = (this.trail[i].y + this.trail[i+1].y) / 2;
      ctx.quadraticCurveTo(this.trail[i].x, this.trail[i].y, xc, yc);
    }

    const last = this.trail.length - 1;
    ctx.quadraticCurveTo(this.trail[last].x, this.trail[last].y, this.x, this.y);


    const gradient = ctx.createLinearGradient(this.trail[0].x, this.trail[0].y, this.x, this.y);
    const headOpacity = Math.max(0, Math.min(1, this.trailOpacity));
    const tailOpacity = Math.max(0, Math.min(1, this.trailOpacity * 0.1)); 

    gradient.addColorStop(0, this.getRGBA(0)); 
    gradient.addColorStop(0.3, this.getRGBA(tailOpacity * 0.5));
    gradient.addColorStop(0.7, this.getRGBA(headOpacity * 0.8));
    gradient.addColorStop(1, this.getRGBA(headOpacity));

    ctx.strokeStyle = gradient;
    ctx.lineWidth = currentSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    if (Math.random() > 0.85) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, currentSize * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = this.getRGBA(headOpacity * 0.9); 
      ctx.fill();
    }
  }

  getRGBA(opacity) {
    const hex = this.color.substring(1);
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const validOpacity = (isNaN(opacity) || opacity < 0) ? 0 : Math.min(1, opacity); 
    return `rgba(${r}, ${g}, ${b}, ${validOpacity.toFixed(3)})`;
  }
}

function initFlowField() {
  if (!canvas) return; 
  particles = [];
  const startWidth = canvas.width;
  const startHeight = canvas.height;
  for (let i = 0; i < particleCount; i++) {
    const x = Math.random() * startWidth;
    const y = Math.random() * startHeight;
    particles.push(new Particle(x,y));
  }
  console.log("Flow field initialized with " + particleCount + " particles.");
}

let animationFrameId = null;
function animate() {
  if (!canvas || !ctx) {
    console.warn("Canvas or context not available, stopping animation.");
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    return;
  }

  ctx.fillStyle = 'rgba(3, 15, 15, 0.18)'; 
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  time += noiseSpeed;

  particles.forEach(particle => particle.update());

  applyWaveEffect();

  animationFrameId = requestAnimationFrame(animate);
}

function applyWaveEffect() {
   if (!canvas || !ctx || Math.random() > 0.95) return; 

  try {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;

    for (let y = 0; y < height; y += 8) { 
        for (let x = 0; x < width; x += 8) { 
            const i = (y * width + x) * 4;

            const waveTime = time * 2.5;
            const waveAmplitude = 2.5;
            const distortion = Math.sin(x * 0.015 + y * 0.02 + waveTime) * waveAmplitude;

            const srcX = Math.floor(Math.min(Math.max(x + distortion, 0), width - 1));
            const srcY = y;
            const srcIndex = (srcY * width + srcX) * 4;

            if (srcIndex >= 0 && srcIndex < data.length - 3) {
                data[i] = data[srcIndex];         
                data[i + 1] = data[srcIndex + 1]; 
                data[i + 2] = data[srcIndex + 2]; 
            }
        }
    }
    ctx.putImageData(imageData, 0, 0);
  } catch (e) {
    if (Math.random() < 0.01) console.warn("Error in wave effect (logged occasionally):", e.name);
  }
}


function resizeCanvas() {
  if (!canvas) return;
  const container = canvas.parentElement;
  if (!container) {
      console.error("Canvas container not found for resizing.");
      return;
  }
  const newWidth = container.clientWidth;
  const newHeight = container.clientHeight;

  if (canvas.width !== newWidth || canvas.height !== newHeight) {
      canvas.width = newWidth;
      canvas.height = newHeight;
      console.log(`Canvas resized to ${canvas.width}x${canvas.height}`);
       initFlowField(); 
  }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function setupAnimation() {
    if (!canvas || !ctx) {
        console.error("Cannot setup animation: Canvas or Context not available.");
        return;
    }
    console.log("Setting up animation...");
    resizeCanvas(); 
    initFlowField(); 
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    animate(); 

    const debouncedResize = debounce(() => {
        console.log("Window resize detected, rescheduling canvas resize and init.");
        resizeCanvas();
    }, 250); 

    window.addEventListener('resize', debouncedResize);
}

document.addEventListener('DOMContentLoaded', () => {
     console.log("DOM Loaded, attempting to start animation setup.");
    setTimeout(setupAnimation, 50);
});

