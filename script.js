// --- SPA Routing ---
const navBtns = document.querySelectorAll('.nav-btn');
const pages = document.querySelectorAll('.page');
let currentPage = 'home';

function switchPage(targetId) {
    navBtns.forEach(b => b.classList.remove('active'));
    pages.forEach(p => p.classList.remove('active'));
    
    const navBtn = Array.from(navBtns).find(btn => btn.dataset.target === targetId);
    if(navBtn) navBtn.classList.add('active');
    
    currentPage = targetId;
    const targetPage = document.getElementById(targetId);
    if (targetPage) targetPage.classList.add('active');
    
    if (currentPage === 'social') {
        setTimeout(() => {
            const globeContainer = document.getElementById('social');
            if (globeContainer && globeContainer.classList.contains('active')) {
                if (typeof initGlobe === 'function') initGlobe();
            }
        }, 100); 
    }
}

navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        switchPage(btn.dataset.target);
    });
});

const whoamiBtn = document.getElementById('whoami-btn');
if (whoamiBtn) {
    whoamiBtn.addEventListener('click', () => switchPage('about'));
}

const exitBtn = document.getElementById('exit-btn');
if (exitBtn) {
    exitBtn.addEventListener('click', () => switchPage('home'));
}

let mouse = { x: -1000, y: -1000, active: false };
document.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
});
document.addEventListener('mouseout', (e) => {
    if (!e.relatedTarget && !e.toElement) {
        mouse.active = false;
    }
});

// --- Interactive Background (Spiders) ---
const bgCanvas = document.getElementById('interactive-bg');
const bgCtx = bgCanvas.getContext('2d');
const { sin, cos, PI, hypot, min, max } = Math;

// Helpers
function rnd(x = 1, dx = 0) {
    return Math.random() * x + dx;
}
function drawCircle(x, y, r, color) {
    bgCtx.beginPath();
    bgCtx.ellipse(x, y, r, r, 0, 0, PI * 2);
    bgCtx.fill();
}
function drawLine(x0, y0, x1, y1) {
    bgCtx.beginPath();
    bgCtx.moveTo(x0, y0);
    many(100, (i) => {
        i = (i + 1) / 100;
        let x = lerp(x0, x1, i);
        let y = lerp(y0, y1, i);
        let k = noise(x/5+x0, y/5+y0) * 2;
        bgCtx.lineTo(x + k, y + k);
    });
    bgCtx.stroke();
}
function many(n, f) {
    return [...Array(n)].map((_, i) => f(i));
}
function lerp(a, b, t) {
    return a + (b - a) * t;
}
function noise(x, y, t = 101) {
    let w0 = sin(0.3 * x + 1.4 * t + 2.0 + 
                 2.5 * sin(0.4 * y + -1.3 * t + 1.0));
    let w1 = sin(0.2 * y + 1.5 * t + 2.8 + 
                 2.3 * sin(0.5 * x + -1.2 * t + 0.5));
    return w0 + w1;
}
function pt(x,y){
    return {x,y}
}

// Spider logic
function spawn() {
    const pts = many(333, () => {
        return {
            x: rnd(innerWidth),
            y: rnd(innerHeight),
            len: 0,
            r: 0
        };
    });
    
    const pts2 = many(9, (i) => {
        return {
            x: cos((i / 9) * PI * 2),
            y: sin((i / 9) * PI * 2)
        };
    });
    
    let seed = rnd(100);
    let tx = rnd(innerWidth); 
    let ty = rnd(innerHeight);
    let x = rnd(innerWidth);
    let y = rnd(innerHeight);
    let kx = rnd(0.5, 0.5);
    let ky = rnd(0.5, 0.5);
    let walkRadius = pt(rnd(50,50), rnd(50,50));
    let r = innerWidth / rnd(100, 150);
    
    function paintPt(pt){
        pts2.forEach((pt2) => {
            if (!pt.len ) return;
            drawLine(
                lerp(x + pt2.x * r, pt.x, pt.len * pt.len),
                lerp(y + pt2.y * r, pt.y, pt.len * pt.len),
                x + pt2.x * r,
                y + pt2.y * r
            );
        });
        drawCircle(pt.x, pt.y, pt.r);
    }
  
    return {
        follow(new_x, new_y) {
            tx = new_x;
            ty = new_y;
        },
        
        tick(t) {
            const selfMoveX = cos(t*kx+seed)*walkRadius.x;        
            const selfMoveY = sin(t*ky+seed)*walkRadius.y;      
            let fx = tx + selfMoveX;         
            let fy = ty + selfMoveY; 
                    
            x += min(innerWidth/100, (fx - x)/10);
            y += min(innerWidth/100, (fy - y)/10);
                    
            let i = 0;
            pts.forEach((pt) => {
                const dx = pt.x - x,
                      dy = pt.y - y;
                const len = hypot(dx, dy);
                let r = min(2, innerWidth / len / 5);
                pt.t = 0;
                const increasing = len < innerWidth / 10 && (i++) < 8;
                let dir = increasing ? 0.1 : -0.1;
                if (increasing) {
                    r *= 1.5;
                }
                pt.r = r;
                pt.len = max(0, min(pt.len + dir, 1));
                paintPt(pt);
            });
        } 
    };
}

let spiders = [];
function initBg() {
    bgCanvas.width = window.innerWidth;
    bgCanvas.height = window.innerHeight;
    spiders = many(2, spawn);
}
window.addEventListener('resize', initBg);
initBg();

// For now, completely disable the globe on the social page
const globeCanvas = document.getElementById('globe-canvas');
const globeTooltip = document.getElementById('globe-tooltip');
if (globeCanvas) globeCanvas.style.display = 'none';
if (globeTooltip) globeTooltip.style.display = 'none';

// --- Firefly Logic ---
const fireflyCanvas = document.getElementById('firefly-canvas');
let fCtx = null;
if (fireflyCanvas) fCtx = fireflyCanvas.getContext('2d');
let fireflies = [];

function createFirefly(x, y, cx, cy) {
    let dx = x - cx;
    let dy = y - cy;
    let dist = Math.sqrt(dx*dx + dy*dy);
    if (dist === 0) { dx = 1; dy = 0; dist = 1; }
    
    // Restored to previous better spread speed
    let speed = Math.random() * 0.2 + 0.1;

    return {
        x: x,
        y: y,
        vx: (dx / dist) * speed,
        vy: (dy / dist) * speed,
        life: 1,
        lifeRate: Math.random() * 0.008 + 0.002,
        size: Math.random() * 1.5 + 0.5,
        phase: Math.random() * Math.PI * 2 // for twinkling
    };
}

function drawFireflies() {
    if (!fCtx || currentPage !== 'home') return;
    
    const homeSection = document.getElementById('home');
    if (fireflyCanvas.width !== homeSection.clientWidth || fireflyCanvas.height !== homeSection.clientHeight) {
        fireflyCanvas.width = homeSection.clientWidth;
        fireflyCanvas.height = homeSection.clientHeight;
    }

    fCtx.clearRect(0, 0, fireflyCanvas.width, fireflyCanvas.height);
    
    const cx = fireflyCanvas.width / 2;
    const cy = fireflyCanvas.height / 2;
    
    // Spawn new fireflies near center
    if (Math.random() < 0.6) {
        const bx = cx + (Math.random() - 0.5) * 280;
        const by = cy + (Math.random() - 0.5) * 80;
        fireflies.push(createFirefly(bx, by, cx, cy));
    }

    fCtx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    
    for (let i = fireflies.length - 1; i >= 0; i--) {
        let f = fireflies[i];
        f.x += f.vx;
        f.y += f.vy;
        
        // Very slight outward acceleration or steady speed
        f.x += f.vx * 0.5; // just a bit of extra push
        f.y += f.vy * 0.5;

        f.life -= f.lifeRate;
        f.phase += 0.05; // slower twinkle
        
        // Vanish condition (distance from center)
        const dx = f.x - cx;
        const dy = f.y - cy;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist > 250) {
            f.life -= 0.05; // fade out quickly when hitting the boundary
        }

        if (f.life <= 0) {
            fireflies.splice(i, 1);
            continue;
        }

        const twinkle = 0.5 + 0.5 * Math.sin(f.phase);
        fCtx.beginPath();
        fCtx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
        fCtx.globalAlpha = Math.max(0, f.life * twinkle);
        fCtx.fill();
    }
    fCtx.globalAlpha = 1;
}

// --- Main Animation Loop ---
function animate(t) {
    if (bgCanvas.width !== window.innerWidth || bgCanvas.height !== window.innerHeight) {
        initBg();
    }
    
    bgCtx.fillStyle = "#000";
    bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
    
    if (currentPage === 'social') {
        // Just render the black background
        requestAnimationFrame(animate);
        return;
    }

    bgCtx.fillStyle = bgCtx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    bgCtx.lineWidth = 1;
    
    if (mouse.active) {
        spiders.forEach(spider => spider.follow(mouse.x, mouse.y));
    }
    
    t /= 1000;
    spiders.forEach(spider => spider.tick(t));
    
    drawFireflies();
    
    requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
