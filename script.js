// --- SPA Routing ---
const navBtns = document.querySelectorAll('.nav-btn');
const pages = document.querySelectorAll('.page');
let currentPage = 'home';

function switchPage(targetId) {
    const terminalWindow = document.querySelector('.terminal-window');
    if (terminalWindow) {
        terminalWindow.classList.remove('hidden');
    }

    navBtns.forEach(b => b.classList.remove('active'));
    pages.forEach(p => p.classList.remove('active'));
    
    const navBtn = Array.from(navBtns).find(btn => btn.dataset.target === targetId);
    if(navBtn) navBtn.classList.add('active');
    
    currentPage = targetId;
    const targetPage = document.getElementById(targetId);
    if (targetPage) targetPage.classList.add('active');
    
    if (currentPage === 'social') {
        setTimeout(() => {
            const socialContainer = document.getElementById('social');
            if (socialContainer && socialContainer.classList.contains('active')) {
                if (typeof initNetwork === 'function') initNetwork();
            }
        }, 100); 
    }
}

navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        switchPage(btn.dataset.target);
    });
});

let isWhoamiHovered = false;
const whoamiBtn = document.getElementById('whoami-btn');
if (whoamiBtn) {
    whoamiBtn.addEventListener('click', () => switchPage('about'));
    whoamiBtn.addEventListener('mouseenter', () => isWhoamiHovered = true);
    whoamiBtn.addEventListener('mouseleave', () => isWhoamiHovered = false);
}

const exitBtn = document.getElementById('exit-btn');
if (exitBtn) {
    exitBtn.addEventListener('click', () => switchPage('home'));
}

const closeBtn = document.querySelector('.close');
if (closeBtn) {
    closeBtn.addEventListener('click', () => {
        const terminalWindow = document.querySelector('.terminal-window');
        if (terminalWindow) terminalWindow.classList.add('hidden');
    });
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

// Touch support for mobile devices
document.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
        mouse.active = true;
    }
});

document.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
        mouse.active = true;
    }
    // Prevent scrolling if touching the background so touchmove doesn't get cancelled
    if (!e.target.closest('.terminal-body')) {
        if (e.cancelable) {
            e.preventDefault();
        }
    }
}, { passive: false });

document.addEventListener('touchend', () => {
    mouse.active = false;
});

document.addEventListener('touchcancel', () => {
    mouse.active = false;
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
    
    // Spawn new fireflies near center only if hovered
    if (isWhoamiHovered && Math.random() < 0.6) {
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
    
    bgCtx.fillStyle = "rgba(10, 10, 10, 1)";
    bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);

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

// --- Easter Egg Scattering ---
function scatterEasterEggs() {
    const easterEggs = document.querySelectorAll('.ee-text');
    const placed = [];
    const minDistance = 250; // Minimum pixel distance between eggs
    
    easterEggs.forEach((egg, index) => {
        // "There's no place like 127.0.0.1" is the 4th element (index 3). It must remain horizontal.
        if (index !== 3) {
            if (Math.random() > 0.5) {
                egg.style.writingMode = 'vertical-rl';
                if (Math.random() > 0.5) {
                    egg.style.transform = 'rotate(180deg)';
                }
            }
        }
        
        // Wait a frame for writing-mode to apply and dimensions to compute
        setTimeout(() => {
            const rect = egg.getBoundingClientRect();
            // Nav bar and status take up roughly top 100px.
            const minY = 120; 
            const maxY = window.innerHeight - rect.height - 20;
            const minX = 20;
            const maxX = window.innerWidth - rect.width - 20;
            
            let randomX, randomY;
            let valid = false;
            let attempts = 0;
            
            while (!valid && attempts < 50) {
                randomX = minX + Math.random() * Math.max(0, maxX - minX);
                randomY = minY + Math.random() * Math.max(0, maxY - minY);
                valid = true;
                
                for (let p of placed) {
                    const dx = randomX - p.x;
                    const dy = randomY - p.y;
                    if (Math.sqrt(dx * dx + dy * dy) < minDistance) {
                        valid = false;
                        break;
                    }
                }
                attempts++;
            }
            
            placed.push({ x: randomX, y: randomY });
            
            egg.style.left = `${randomX}px`;
            egg.style.top = `${randomY}px`;
        }, 10);
    });
}
scatterEasterEggs();

// --- Social Network Graph Physics ---
let networkInitialized = false;

function initNetwork() {
    if (networkInitialized) return;
    networkInitialized = true;
    
    const canvas = document.getElementById('network-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let width, height;
    let nodes = [];
    let pulses = [];
    let centerNode = { label: 'mujaffar', x: 0, y: 0 };
    
    function initLayout() {
        const rect = canvas.parentElement.getBoundingClientRect();
        width = canvas.width = rect.width;
        height = canvas.height = rect.height;
        
        centerNode.x = width / 2;
        centerNode.y = height / 2;
        
        let boxW = 160;
        let boxH = 40;
        
        let ghX = Math.max(20, width * 0.15 - boxW/2);
        let ghY = height * 0.25;
        let liX = Math.max(20, width * 0.15 - boxW/2);
        let liY = height * 0.75;
        
        let lcX = Math.min(width - 20 - boxW, width * 0.85 - boxW/2);
        let lcY = height * 0.35;
        let cfX = Math.min(width - 20 - boxW, width * 0.85 - boxW/2);
        let cfY = height * 0.85;
        
        nodes = [
            { id: 'github', label: 'Github', url: 'https://github.com/sheikhabibi', box: {x: ghX, y: ghY, w: boxW, h: boxH}, side: 'left', hitFlash: 0 },
            { id: 'linkedin', label: 'Linkedin', url: 'https://www.linkedin.com/in/mujaffar-sheikh', box: {x: liX, y: liY, w: boxW, h: boxH}, side: 'left', hitFlash: 0 },
            { id: 'leetcode', label: 'Leetcode', url: 'https://leetcode.com/u/mujaffarsheikh/', box: {x: lcX, y: lcY, w: boxW, h: boxH}, side: 'right', hitFlash: 0 },
            { id: 'codeforces', label: 'Codeforces', url: 'https://codeforces.com/profile/xymat', box: {x: cfX, y: cfY, w: boxW, h: boxH}, side: 'right', hitFlash: 0 }
        ];
        
        for (let n of nodes) {
            n.path = [];
            n.path.push({x: centerNode.x, y: centerNode.y});
            
            let attachX = (n.side === 'left') ? n.box.x + n.box.w : n.box.x;
            let attachY = n.box.y + n.box.h / 2;
            
            let hLen = (n.side === 'left') ? 80 : -80;
            let midX = attachX + hLen;
            
            n.path.push({x: midX, y: attachY});
            n.path.push({x: attachX, y: attachY});
            
            n.pathLen = 0;
            for(let i=0; i<n.path.length-1; i++) {
                n.pathLen += Math.hypot(n.path[i+1].x - n.path[i].x, n.path[i+1].y - n.path[i].y);
            }
        }
    }
    
    initLayout();
    window.addEventListener('resize', initLayout);
    
    let hoveredNode = null;
    let m = { x: -1000, y: -1000, active: false };
    
    function getMousePos(e) {
        const rect = canvas.getBoundingClientRect();
        let clientX = e.clientX;
        let clientY = e.clientY;
        if(e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        }
        return {
            x: clientX - rect.left,
            y: clientY - rect.top,
            cx: clientX,
            cy: clientY
        };
    }
    
    function moveHandler(e) {
        const pos = getMousePos(e);
        m.x = pos.x;
        m.y = pos.y;
        m.active = true;
        
        hoveredNode = null;
        for (let n of nodes) {
            if (m.x >= n.box.x && m.x <= n.box.x + n.box.w &&
                m.y >= n.box.y && m.y <= n.box.y + n.box.h) {
                hoveredNode = n;
                break;
            }
        }
        
        canvas.style.cursor = hoveredNode ? 'pointer' : 'crosshair';
    }
    
    canvas.addEventListener('mousemove', moveHandler);
    canvas.addEventListener('touchmove', (e) => {
        if(e.cancelable) e.preventDefault();
        moveHandler(e);
    }, { passive: false });
    
    canvas.addEventListener('mouseleave', () => {
        m.active = false;
        hoveredNode = null;
        canvas.style.cursor = 'crosshair';
    });
    
    canvas.addEventListener('click', () => {
        if (hoveredNode && hoveredNode.url) {
            window.open(hoveredNode.url, '_blank');
        }
    });
    
    function spawnPulse() {
        if (!networkInitialized || nodes.length === 0) return;
        
        let target = nodes[Math.floor(Math.random() * nodes.length)];
        pulses.push({
            target: target,
            progress: 0,
            speed: 5 + Math.random() * 4
        });
        
        setTimeout(spawnPulse, 1500 + Math.random() * 2500);
    }
    
    setTimeout(spawnPulse, 1000);
    
    function getPathPoint(path, distance) {
        let traveled = 0;
        for (let i=0; i<path.length-1; i++) {
            let p1 = path[i];
            let p2 = path[i+1];
            let segLen = Math.hypot(p2.x - p1.x, p2.y - p1.y);
            if (distance <= traveled + segLen) {
                let pct = (distance - traveled) / segLen;
                return {
                    x: p1.x + (p2.x - p1.x) * pct,
                    y: p1.y + (p2.y - p1.y) * pct
                };
            }
            traveled += segLen;
        }
        return path[path.length-1];
    }
    
    function update() {
        for (let n of nodes) {
            if (n.hitFlash > 0) {
                n.hitFlash -= 0.005;
                if (n.hitFlash < 0) n.hitFlash = 0;
            }
        }
        
        for (let i = pulses.length - 1; i >= 0; i--) {
            let p = pulses[i];
            p.progress += p.speed;
            
            if (p.progress >= p.target.pathLen) {
                p.target.hitFlash = 1.5;
                pulses.splice(i, 1);
            }
        }
    }
    
    function draw() {
        ctx.clearRect(0, 0, width, height);
        
        for (let n of nodes) {
            let isHovered = (hoveredNode === n);
            
            ctx.beginPath();
            ctx.moveTo(n.path[0].x, n.path[0].y);
            for(let i=1; i<n.path.length; i++) {
                ctx.lineTo(n.path[i].x, n.path[i].y);
            }
            
            let grad = ctx.createLinearGradient(centerNode.x, centerNode.y, n.path[1].x, n.path[1].y);
            
            if (isHovered) {
                grad.addColorStop(0, 'rgba(0, 255, 0, 0)');
                grad.addColorStop(0.35, 'rgba(0, 255, 0, 0.8)');
                grad.addColorStop(1, 'rgba(0, 255, 0, 0.8)');
                
                ctx.strokeStyle = grad;
                ctx.lineWidth = 2;
                ctx.shadowColor = '#00ff00';
                ctx.shadowBlur = 5;
            } else {
                grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
                grad.addColorStop(0.35, 'rgba(255, 255, 255, 0.15)');
                grad.addColorStop(1, 'rgba(255, 255, 255, 0.15)');
                
                ctx.strokeStyle = grad;
                ctx.lineWidth = 1;
                ctx.shadowBlur = 0;
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
        
        for (let p of pulses) {
            let point = getPathPoint(p.target.path, p.progress);
            ctx.beginPath();
            ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#00ff00';
            ctx.shadowColor = '#00ff00';
            ctx.shadowBlur = 15;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
        
        ctx.font = '32px "MatrixType", "VT323", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#00ff00';
        ctx.fillText(centerNode.label, centerNode.x, centerNode.y);
        
        for (let n of nodes) {
            let isHovered = (hoveredNode === n);
            let flashRatio = Math.max(Math.min(n.hitFlash, 1.0), isHovered ? 1.0 : 0);
            
            let r = Math.round(150 + (0 - 150) * flashRatio);
            let g = Math.round(150 + (255 - 150) * flashRatio);
            let b = Math.round(150 + (0 - 150) * flashRatio);
            
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.3 + 0.5 * flashRatio})`;
            ctx.lineWidth = 1;
            ctx.strokeRect(n.box.x, n.box.y, n.box.w, n.box.h);
            
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.font = '18px "Space Mono", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            if (flashRatio > 0.1) {
                ctx.shadowColor = '#00ff00';
                ctx.shadowBlur = 15 * flashRatio;
            }
            ctx.fillText(n.label, n.box.x + n.box.w / 2, n.box.y + n.box.h / 2);
            ctx.shadowBlur = 0;
        }
    }
    
    function loop() {
        if (!document.getElementById('social').classList.contains('active')) {
            networkInitialized = false;
            return;
        }
        
        update();
        draw();
        requestAnimationFrame(loop);
    }
    
    loop();
}
