/**
 * =========================================================
 * SOLAR YIELD DETECTOR — Shared Application JavaScript
 * Handles: Theme, Auth, Sidebar, Chatbot, Weather,
 *          Geocoding, Savings, Particles, Animations
 * =========================================================
 */

'use strict';

/* ─────────────────────────────────────────────────────────
   THEME MANAGER
───────────────────────────────────────────────────────── */
const ThemeManager = {
  KEY: 'syd_theme',

  init() {
    const saved = localStorage.getItem(this.KEY) || 'dark';
    this.apply(saved, false);
    document.querySelectorAll('[data-theme-toggle]').forEach(el =>
      el.addEventListener('click', () => this.toggle())
    );
  },

  apply(theme, animate = true) {
    if (animate) {
      document.documentElement.style.transition = 'background 0.3s ease, color 0.3s ease';
      setTimeout(() => document.documentElement.style.transition = '', 400);
    }
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(this.KEY, theme);

    // Sync all moon/sun icons
    document.querySelectorAll('.theme-icon-moon').forEach(el =>
      el.style.display = theme === 'dark' ? 'inline' : 'none'
    );
    document.querySelectorAll('.theme-icon-sun').forEach(el =>
      el.style.display = theme === 'light' ? 'inline' : 'none'
    );

    // Re-render particles if present (color changes)
    if (window._particlesCleanup) {
      window._particlesCleanup();
      if (typeof ParticlesManager !== 'undefined') {
        window._particlesCleanup = ParticlesManager.init('particles-canvas');
      }
    }
  },

  toggle() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    this.apply(current === 'dark' ? 'light' : 'dark');
  },

  get() { return document.documentElement.getAttribute('data-theme') || 'dark'; }
};

/* ─────────────────────────────────────────────────────────
   AUTH MANAGER
───────────────────────────────────────────────────────── */
const AuthManager = {
  KEY: 'syd_user',

  getUser() {
    try { return JSON.parse(localStorage.getItem(this.KEY)); } catch { return null; }
  },

  setUser(data) {
    localStorage.setItem(this.KEY, JSON.stringify(data));
  },

  isLoggedIn() { return !!this.getUser(); },

  logout() {
    localStorage.removeItem(this.KEY);
    // Use replace() — removes current page from history so Back button cannot
    // return the user to a protected page after logout.
    window.location.replace('login.html');
  },

  requireAuth() {
    // Use replace() so protected pages are never in the history stack
    // for unauthenticated sessions.
    if (!this.isLoggedIn()) window.location.replace('login.html');
  },

  initUserUI() {
    const user = this.getUser();
    if (!user) return;

    const initials = (user.name || 'U')
      .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    document.querySelectorAll('.user-avatar').forEach(el => {
      el.textContent = initials;
    });

    document.querySelectorAll('.user-name-display').forEach(el => {
      el.textContent = user.name || 'User';
    });

    if (user.city) {
      document.querySelectorAll('.user-location-display, .topbar-location').forEach(el => {
        el.innerHTML = `📍 ${user.city}`;
      });
    }

    // Greeting
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    document.querySelectorAll('.user-greeting').forEach(el => {
      el.textContent = `${greeting}, ${(user.name || 'User').split(' ')[0]}!`;
    });

    // Build dropdown on each avatar
    this.initUserDropdown(user);
  },

  initUserDropdown(user) {
    document.querySelectorAll('.user-avatar').forEach(avatar => {
      // Skip if already wrapped
      if (avatar.closest('.user-dropdown-wrap')) return;

      // Wrap avatar
      const wrap = document.createElement('div');
      wrap.className = 'user-dropdown-wrap';
      avatar.parentNode.insertBefore(wrap, avatar);
      wrap.appendChild(avatar);

      // Build menu HTML
      const menu = document.createElement('div');
      menu.className = 'user-dropdown-menu';
      menu.innerHTML = `
        <div class="dropdown-user-info">
          <div class="dropdown-user-initials">${(user.name||'U').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)}</div>
          <div>
            <div class="dropdown-user-name">${user.name || 'User'}</div>
            <div class="dropdown-user-email">${user.email || ''}</div>
          </div>
        </div>
        <div class="dropdown-divider"></div>
        <a href="about.html" class="dropdown-item"><span class="di-icon">ℹ️</span> About Us</a>
        <a href="contact.html" class="dropdown-item"><span class="di-icon">📧</span> Contact Us</a>
        <div class="dropdown-divider"></div>
        <button class="dropdown-item dropdown-logout-btn"><span class="di-icon">🚪</span> Logout</button>
      `;
      wrap.appendChild(menu);

      // Toggle open/close on avatar click
      avatar.addEventListener('click', e => {
        e.stopPropagation();
        // Close all others first
        document.querySelectorAll('.user-dropdown-wrap.open').forEach(w => {
          if (w !== wrap) w.classList.remove('open');
        });
        wrap.classList.toggle('open');
      });

      // Logout button inside dropdown
      menu.querySelector('.dropdown-logout-btn').addEventListener('click', () => {
        AuthManager.logout();
      });
    });

    // Close all dropdowns on outside click
    if (!window._syd_dropdown_listener) {
      window._syd_dropdown_listener = true;
      document.addEventListener('click', () => {
        document.querySelectorAll('.user-dropdown-wrap.open').forEach(w => w.classList.remove('open'));
      });
      // Close on Escape key
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
          document.querySelectorAll('.user-dropdown-wrap.open').forEach(w => w.classList.remove('open'));
        }
      });
    }
  }
};

/* ─────────────────────────────────────────────────────────
   SIDEBAR MANAGER
───────────────────────────────────────────────────────── */
const SidebarManager = {
  init() {
    const sidebar = document.querySelector('.sidebar');
    const main = document.querySelector('.main-content');
    const hamburger = document.querySelector('.topbar-hamburger');
    const overlay = document.querySelector('.sidebar-overlay');
    const collapseBtn = document.querySelector('.sidebar-collapse-btn');

    if (!sidebar) return;

    // Desktop collapse toggle
    if (collapseBtn) {
      collapseBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        main?.classList.toggle('expanded');
        const ico = collapseBtn.querySelector('.collapse-icon');
        if (ico) ico.textContent = sidebar.classList.contains('collapsed') ? '›' : '‹';
      });
    }

    // Mobile hamburger
    if (hamburger) {
      hamburger.addEventListener('click', () => {
        sidebar.classList.toggle('mobile-open');
        overlay?.classList.toggle('visible');
        document.body.style.overflow = sidebar.classList.contains('mobile-open') ? 'hidden' : '';
      });
    }

    // Overlay close
    if (overlay) {
      overlay.addEventListener('click', () => {
        sidebar.classList.remove('mobile-open');
        overlay.classList.remove('visible');
        document.body.style.overflow = '';
      });
    }

    // Active nav link
    const current = window.location.pathname.split('/').pop() || 'index.html';
    sidebar.querySelectorAll('.nav-item[href]').forEach(item => {
      if (item.getAttribute('href') === current) item.classList.add('active');
    });
  }
};

/* ─────────────────────────────────────────────────────────
   WEATHER MANAGER
───────────────────────────────────────────────────────── */
const WeatherManager = {
  WMO: {
    0:  { icon:'☀️',  desc:'Clear sky' },
    1:  { icon:'🌤️', desc:'Mostly clear' },
    2:  { icon:'⛅',  desc:'Partly cloudy' },
    3:  { icon:'☁️',  desc:'Overcast' },
    45: { icon:'🌫️', desc:'Fog' },
    48: { icon:'🌫️', desc:'Icy fog' },
    51: { icon:'🌦️', desc:'Light drizzle' },
    53: { icon:'🌦️', desc:'Drizzle' },
    55: { icon:'🌧️', desc:'Heavy drizzle' },
    61: { icon:'🌧️', desc:'Light rain' },
    63: { icon:'🌧️', desc:'Rain' },
    65: { icon:'🌧️', desc:'Heavy rain' },
    71: { icon:'🌨️', desc:'Light snow' },
    73: { icon:'❄️',  desc:'Snow' },
    75: { icon:'❄️',  desc:'Heavy snow' },
    80: { icon:'🌦️', desc:'Rain showers' },
    81: { icon:'⛈️',  desc:'Heavy showers' },
    82: { icon:'⛈️',  desc:'Violent showers' },
    85: { icon:'🌨️', desc:'Snow showers' },
    95: { icon:'⛈️',  desc:'Thunderstorm' },
    96: { icon:'⛈️',  desc:'Thunderstorm + hail' },
    99: { icon:'⛈️',  desc:'Severe thunderstorm' }
  },

  getInfo(code) {
    return this.WMO[code] || this.WMO[this.findClosest(code)] || { icon:'🌡️', desc:'Unknown' };
  },

  findClosest(code) {
    const keys = Object.keys(this.WMO).map(Number);
    return keys.reduce((a, b) => Math.abs(b - code) < Math.abs(a - code) ? b : a);
  },

  async fetch(lat, lon) {
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', lat);
    url.searchParams.set('longitude', lon);
    url.searchParams.set('current', 'temperature_2m,relative_humidity_2m,wind_speed_10m,cloud_cover,precipitation,weather_code');
    url.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,precipitation_sum,cloud_cover_mean,weather_code,wind_speed_10m_max');
    url.searchParams.set('wind_speed_unit', 'kmh');
    url.searchParams.set('timezone', 'auto');
    url.searchParams.set('forecast_days', '7');

    try {
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error('Weather API error');
      return await res.json();
    } catch (e) {
      console.warn('Weather fetch failed:', e);
      return null;
    }
  },

  shouldShowWashAlert(data) {
    if (!data?.daily) return false;
    const winds = data.daily.wind_speed_10m_max?.slice(0, 4) || [];
    const rains = data.daily.precipitation_sum?.slice(0, 7) || [];
    const highWind = winds.some(w => w > 28);
    const dryDays = rains.filter(r => r < 0.5).length;
    return highWind || dryDays >= 5;
  }
};

/* ─────────────────────────────────────────────────────────
   GEOCODER
───────────────────────────────────────────────────────── */
const Geocoder = {
  async fromPincode(pin) {
    // Indian Postal Code API
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const data = await res.json();
      if (data[0]?.Status === 'Success') {
        const po = data[0].PostOffice[0];
        const q = `${po.Division || po.District}, ${po.State}, India`;
        return await this.fromQuery(q);
      }
    } catch (_) {}
    // Fallback: treat as query
    return await this.fromQuery(pin);
  },

  async fromQuery(query) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      if (data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon),
          city: data[0].display_name.split(',').slice(0, 2).join(', ')
        };
      }
    } catch (_) {}
    return null;
  },

  async fromGPS() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) { reject(new Error('Not supported')); return; }
      navigator.geolocation.getCurrentPosition(async pos => {
        const { latitude: lat, longitude: lon } = pos.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
          const d = await res.json();
          const city = d.address?.city || d.address?.town || d.address?.village || 'Your Location';
          resolve({ lat, lon, city });
        } catch { resolve({ lat, lon, city: 'Your Location' }); }
      }, err => reject(err), { timeout: 10000 });
    });
  }
};

/* ─────────────────────────────────────────────────────────
   SAVINGS CALCULATOR
───────────────────────────────────────────────────────── */
const SavingsCalc = {
  getDailyKWh(user) {
    const kw = parseFloat(user.panelSize || 5);
    const eff = parseFloat(user.efficiency || 80) / 100;
    const psh = parseFloat(user.peakSunHours || 5); // default India avg
    return kw * eff * psh;
  },

  getDailySavings(user) {
    return this.getDailyKWh(user) * parseFloat(user.electricityRate || 8);
  },

  getDaysSinceInstall(user) {
    if (!user.installDate) return 0;
    const ms = Date.now() - new Date(user.installDate).getTime();
    return Math.max(0, Math.floor(ms / 86400000));
  },

  getTotalSavings(user) {
    return this.getDailySavings(user) * this.getDaysSinceInstall(user);
  },

  getPaybackDays(user) {
    const investment = parseFloat(user.investment || 150000);
    const daily = this.getDailySavings(user);
    return daily > 0 ? Math.ceil(investment / daily) : Infinity;
  }
};

/* ─────────────────────────────────────────────────────────
   PARTICLES CANVAS
───────────────────────────────────────────────────────── */
const ParticlesManager = {
  init(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return () => {};

    const ctx = canvas.getContext('2d');
    let raf;

    const resize = () => {
      canvas.width = canvas.parentElement.offsetWidth || window.innerWidth;
      canvas.height = canvas.parentElement.offsetHeight || window.innerHeight;
    };
    resize();
    const resizeHandler = () => resize();
    window.addEventListener('resize', resizeHandler);

    const count = Math.min(80, Math.floor(canvas.width / 16));
    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.4 + 0.5,
      op: Math.random() * 0.45 + 0.1
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const dark = document.documentElement.getAttribute('data-theme') !== 'light';
      const pc = dark ? '245,158,11' : '217,119,6';
      const lc = dark ? '59,130,246' : '37,99,235';

      particles.forEach(p => {
        p.x = (p.x + p.vx + canvas.width) % canvas.width;
        p.y = (p.y + p.vy + canvas.height) % canvas.height;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${pc},${p.op})`;
        ctx.fill();
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 110) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(${lc},${(1 - d / 110) * 0.13})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resizeHandler); };
  }
};

/* ─────────────────────────────────────────────────────────
   NUMBER ANIMATOR
───────────────────────────────────────────────────────── */
function animateNumber(el, to, { prefix = '', suffix = '', decimals = 0, duration = 1800 } = {}) {
  if (!el) return;
  const start = performance.now();
  const tick = now => {
    const t = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    const val = to * ease;
    el.textContent = prefix + (decimals > 0 ? val.toFixed(decimals) : Math.floor(val).toLocaleString('en-IN')) + suffix;
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/* ─────────────────────────────────────────────────────────
   TOAST NOTIFICATIONS
───────────────────────────────────────────────────────── */
const Toast = {
  show(msg, type = 'info', ms = 4000) {
    let box = document.getElementById('syd-toast-box');
    if (!box) {
      box = document.createElement('div');
      box.id = 'syd-toast-box';
      Object.assign(box.style, {
        position: 'fixed', top: '80px', right: '20px', zIndex: '9999',
        display: 'flex', flexDirection: 'column', gap: '10px', pointerEvents: 'none'
      });
      document.body.appendChild(box);
    }
    const colors = { info: 'var(--blue)', success: 'var(--green)', warning: 'var(--solar)', error: 'var(--red)' };
    const icons = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌' };
    const t = document.createElement('div');
    Object.assign(t.style, {
      background: 'var(--bg-card)', border: `1px solid ${colors[type]}`,
      borderLeft: `4px solid ${colors[type]}`, borderRadius: '12px',
      padding: '13px 18px', display: 'flex', alignItems: 'center', gap: '10px',
      boxShadow: 'var(--shadow-lg)', color: 'var(--text-primary)',
      fontSize: '0.88rem', fontFamily: 'var(--font-body)', maxWidth: '310px',
      pointerEvents: 'all', animation: 'toastIn 0.3s ease',
      minWidth: '220px'
    });
    if (!document.getElementById('syd-toast-css')) {
      const s = document.createElement('style');
      s.id = 'syd-toast-css';
      s.textContent = '@keyframes toastIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}@keyframes toastOut{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(20px)}}';
      document.head.appendChild(s);
    }
    t.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
    box.appendChild(t);
    setTimeout(() => { t.style.animation = 'toastOut 0.3s ease forwards'; setTimeout(() => t.remove(), 300); }, ms);
  }
};

/* ─────────────────────────────────────────────────────────
   CHATBOT
───────────────────────────────────────────────────────── */
const Chatbot = {
  open: false,
  greeted: false,

  RULES: [
    { re: /hello|hi\b|hey|good (morning|afternoon|evening)/i,
      reply: "Hello! 👋 I'm SolarBot, your solar energy assistant. Ask me anything about your solar panels, yield, savings, or maintenance!" },
    { re: /(yield|output|generation|power).*(drop|low|declin|reduc|less|fall)/i,
      reply: "A yield drop can be caused by:\n• ☁️ High cloud cover or fog\n• 🌫️ Dust or soiling on panels\n• 🌡️ Panels overheating (efficiency drops ~0.4%/°C above 25°C)\n• 🔌 Inverter or wiring issue\n• 🌳 Shading from nearby objects\n\nCheck the dashboard's efficiency gauge and compare with weather data." },
    { re: /storm|lightning|thunder|cyclone/i,
      reply: "Post-storm checklist:\n1. 🔍 Visual inspection for cracks or dislodged panels\n2. 🔌 Check MC4 connectors and DC isolators\n3. 📊 Compare current yield with pre-storm baseline\n4. 🧹 Clean any mud/debris deposited on panels\n\nNavigate to ML Prediction to see the expected impact." },
    { re: /clean|wash|dust|dirt|grime|soiling/i,
      reply: "Panel cleaning guidelines:\n• 🌧️ Rain naturally cleans panels — no action needed after rain\n• 🌬️ After dusty/windy days → clean within 24–48 hrs\n• ☀️ If no rain for 7+ days → cleaning can boost yield 5–15%\n• 🪣 Use soft cloth + plain water, early morning is best\n\nYour wash alert is auto-triggered on the dashboard!" },
    { re: /efficien|perform/i,
      reply: "Efficiency depends on:\n• 🌡️ Temperature (optimal: 25°C)\n• ☁️ Cloud cover & irradiance level\n• 🧹 Panel cleanliness\n• 📅 Inverter age & capacity\n\nYour real-time efficiency is shown on the dashboard." },
    { re: /roi|return|invest|payback/i,
      reply: "Your ROI details are in the **ROI Calculator** page! It shows:\n💰 Daily / monthly / yearly savings in ₹\n📅 Exact payback period\n📈 ROI % over 10, 20, 25 years\n🌿 CO₂ offset in kg" },
    { re: /irradiance|ghi|dni|dhi|radiation|nasa/i,
      reply: "The **Irradiance** page uses the NASA POWER API to show:\n☀️ GHI – Global Horizontal Irradiance\n📡 DNI – Direct Normal Irradiance\n🌤️ DHI – Diffuse Horizontal Irradiance\n\nEnter your ZIP/pincode or use GPS for real data!" },
    { re: /weather|cloud|forecast|rain|humid|temperature/i,
      reply: "Live weather is shown on your dashboard! Key insights:\n⛅ Every 10% cloud cover ≈ 5% yield drop\n🌡️ Panels lose 0.4–0.5% efficiency per °C > 25°C\n🌧️ Rain cleans panels naturally — free maintenance!\n\nCheck the 7-day forecast on your dashboard." },
    { re: /predict|ml|machine learn|forecast yield|tomor/i,
      reply: "The **ML Prediction** page lets you:\n🎛️ Adjust weather parameters with sliders\n⚡ Get AI-estimated yield for tomorrow\n📊 See confidence intervals & feature importance\n\nIt uses a regression model trained on historical solar + weather data." },
    { re: /faq|help|guide|troubleshoot|manual/i,
      reply: "The **FAQ** page has searchable answers for:\n🔧 Troubleshooting common issues\n🌦️ Weather impact explanations\n🧹 Maintenance schedules\n📋 Warranty & installation guidelines\n\nYou can also search by keyword!" },
    { re: /sav|money|rupee|inr|bill|cost|earn/i,
      reply: "Your savings are calculated as:\n**kW × Peak Sun Hours × Efficiency × ₹/kWh**\n\nThe dashboard shows total savings since installation. The ROI Calculator gives detailed breakdowns!" }
  ],

  DEFAULT: [
    "That's a great question! I can help with:\n• ⚡ Yield analysis & drops\n• 🧹 Panel cleaning schedules\n• 🌦️ Weather impact\n• 💰 ROI & savings\n• ☀️ Irradiance data\n• 🤖 ML yield prediction\n\nCould you be more specific?",
    "I'm here to help optimize your solar setup! Ask me about yield, weather, cleaning, ROI, or navigation between app sections.",
    "Interesting question! For best results, try asking about: solar yield, panel cleaning, weather effects, financial savings, or irradiance data."
  ],

  init() {
    const trigger = document.getElementById('chatbot-trigger');
    const panel   = document.getElementById('chatbot-panel');
    const close   = document.getElementById('chatbot-close');
    const input   = document.getElementById('chatbot-input');
    const send    = document.getElementById('chatbot-send');

    if (!trigger) return;

    trigger.addEventListener('click', () => this.toggle());
    close?.addEventListener('click', () => this.close());
    send?.addEventListener('click', () => this.send());
    input?.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.send(); } });
    document.querySelectorAll('.quick-reply-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (input) input.value = btn.dataset.msg || btn.textContent;
        this.send();
      });
    });
  },

  toggle() { this.open ? this.close() : this._open(); },

  _open() {
    document.getElementById('chatbot-panel')?.classList.add('open');
    this.open = true;
    if (!this.greeted) {
      this.greeted = true;
      const user = AuthManager.getUser();
      const name = user ? ` ${user.name.split(' ')[0]}` : '';
      setTimeout(() => this.addBot(`Hello${name}! 👋 I'm **SolarBot**, your solar assistant. How can I help you today?`), 500);
    }
    document.getElementById('chatbot-input')?.focus();
  },

  close() {
    document.getElementById('chatbot-panel')?.classList.remove('open');
    this.open = false;
  },

  send() {
    const input = document.getElementById('chatbot-input');
    const text = input?.value.trim();
    if (!text) return;
    this.addUser(text);
    if (input) input.value = '';
    document.querySelector('.chatbot-quick-replies')?.classList.add('hidden');
    this.addTyping();
    setTimeout(() => {
      this.removeTyping();
      this.addBot(this.respond(text));
    }, 700 + Math.random() * 700);
  },

  respond(text) {
    for (const rule of this.RULES) {
      if (rule.re.test(text)) return rule.reply;
    }
    return this.DEFAULT[Math.floor(Math.random() * this.DEFAULT.length)];
  },

  addUser(text) {
    const user = AuthManager.getUser();
    const init = user ? user.name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) : 'U';
    this._appendMsg('user', `<div class="chat-msg-avatar">${init}</div><div class="chat-msg-bubble">${this._esc(text)}</div>`);
  },

  addBot(text) {
    // Bold **text** support
    const html = this._esc(text).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g,'<br>');
    this._appendMsg('bot', `<div class="chat-msg-avatar">☀️</div><div class="chat-msg-bubble">${html}</div>`);
  },

  addTyping() {
    const box = document.getElementById('chatbot-messages');
    if (!box) return;
    const d = document.createElement('div');
    d.className = 'chat-msg bot'; d.id = 'chat-typing';
    d.innerHTML = `<div class="chat-msg-avatar">☀️</div><div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>`;
    box.appendChild(d); this._scroll();
  },

  removeTyping() { document.getElementById('chat-typing')?.remove(); },

  _appendMsg(role, inner) {
    const box = document.getElementById('chatbot-messages');
    if (!box) return;
    const d = document.createElement('div');
    d.className = `chat-msg ${role}`; d.innerHTML = inner;
    box.appendChild(d); this._scroll();
  },

  _scroll() {
    const box = document.getElementById('chatbot-messages');
    if (box) box.scrollTop = box.scrollHeight;
  },

  _esc(str) {
    const d = document.createElement('div'); d.textContent = str; return d.innerHTML;
  }
};

/* ─────────────────────────────────────────────────────────
   SCROLL REVEAL
───────────────────────────────────────────────────────── */
function initScrollReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.scroll-reveal').forEach(el => obs.observe(el));
}

/* ─────────────────────────────────────────────────────────
   INIT
───────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  ThemeManager.init();
  SidebarManager.init();
  Chatbot.init();
  AuthManager.initUserUI();
  initScrollReveal();

  document.querySelectorAll('[data-logout]').forEach(el =>
    el.addEventListener('click', () => AuthManager.logout())
  );
});

/* ─────────────────────────────────────────────────────────
   SECURITY: Back-button guard after logout
   The pageshow event fires when a page is shown from the
   browser's back-forward cache (bfcache). We re-check auth
   here so a logged-out user who presses Back is immediately
   redirected to login instead of seeing a stale cached page.
───────────────────────────────────────────────────────── */
window.addEventListener('pageshow', (e) => {
  // e.persisted = true means page was served from bfcache
  if (e.persisted) {
    const isProtectedPage = !window.location.pathname.includes('login.html')
      && !window.location.pathname.includes('index.html');
    if (isProtectedPage && !AuthManager.isLoggedIn()) {
      window.location.replace('login.html');
    }
  }
});

/* ─── Global Exports ─── */
window.SYD = {
  ThemeManager, AuthManager, SidebarManager,
  WeatherManager, Geocoder, SavingsCalc,
  ParticlesManager, Chatbot, Toast, animateNumber
};
