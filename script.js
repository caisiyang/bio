/**
 * Lightweight CMS - Main Script
 * Features: Data rendering, Admin panel, GitHub Gist integration, Theme switching, Real-time preview
 */

// ============================================
// Global State
// ============================================
let appData = null;
let isAdminMode = false;
let githubToken = null;
let isTokenVerified = false;

// GitHub Config
const GITHUB_OWNER = 'caisiyang';
const GITHUB_REPO_NAME = 'bio';
const GITHUB_BRANCH = 'main';
const GITHUB_REPO = `${GITHUB_OWNER}/${GITHUB_REPO_NAME}`;

// Gist Config (for data storage - no deployments triggered!)
const GIST_ID = '12ee1a78423030775fd70a6ba478a8b9';
const GIST_FILENAME = 'data.json';

// Default color presets
const DEFAULT_BG_COLORS = [
    { color: '#F5EFEA', name: '默认奶茶' },
    { color: '#ffffff', name: '纯白' },
    { color: '#f3f4f6', name: '浅灰' },
    { color: '#fff1f2', name: '浅粉' },
    { color: '#ecfdf5', name: '薄荷' },
    { color: '#eff6ff', name: '淡蓝' },
];

// Common Icons (FontAwesome) - Expanded Library
const COMMON_ICONS = [
    // Communication
    'fas fa-envelope', 'fas fa-phone', 'fas fa-comment', 'fas fa-comments', 'fas fa-paper-plane',

    // Social Media - Major Platforms
    'fab fa-github', 'fab fa-twitter', 'fab fa-instagram', 'fab fa-linkedin', 'fab fa-youtube',
    'fab fa-facebook', 'fab fa-tiktok', 'fab fa-discord', 'fab fa-telegram', 'fab fa-whatsapp',
    'fab fa-weixin', 'fab fa-weibo', 'fab fa-bilibili', 'fab fa-reddit', 'fab fa-pinterest',
    'fab fa-snapchat', 'fab fa-twitch', 'fab fa-spotify', 'fab fa-apple', 'fab fa-google',

    // Professional & Dev
    'fab fa-medium', 'fab fa-dev', 'fab fa-dribbble', 'fab fa-behance', 'fab fa-figma',
    'fab fa-codepen', 'fab fa-stack-overflow', 'fab fa-npm', 'fab fa-product-hunt',

    // General & Utility
    'fas fa-globe', 'fas fa-link', 'fas fa-code', 'fas fa-terminal', 'fas fa-database',
    'fas fa-server', 'fas fa-cloud', 'fas fa-rocket', 'fas fa-bolt', 'fas fa-fire',

    // Creative
    'fas fa-pen', 'fas fa-pencil-alt', 'fas fa-paint-brush', 'fas fa-palette', 'fas fa-camera',
    'fas fa-video', 'fas fa-music', 'fas fa-headphones', 'fas fa-microphone', 'fas fa-film',

    // Lifestyle
    'fas fa-gamepad', 'fas fa-book', 'fas fa-book-open', 'fas fa-graduation-cap', 'fas fa-coffee',
    'fas fa-utensils', 'fas fa-plane', 'fas fa-car', 'fas fa-bicycle', 'fas fa-running',

    // Business & Finance
    'fas fa-briefcase', 'fas fa-building', 'fas fa-store', 'fas fa-shopping-bag', 'fas fa-wallet',
    'fas fa-chart-line', 'fas fa-coins', 'fab fa-bitcoin', 'fab fa-ethereum',

    // Objects & Symbols
    'fas fa-heart', 'fas fa-star', 'fas fa-gem', 'fas fa-crown', 'fas fa-gift',
    'fas fa-lightbulb', 'fas fa-sun', 'fas fa-moon', 'fas fa-leaf', 'fas fa-paw',

    // Tech
    'fas fa-laptop', 'fas fa-desktop', 'fas fa-mobile-alt', 'fas fa-tablet-alt', 'fas fa-keyboard',
    'fas fa-wifi', 'fas fa-bluetooth', 'fas fa-usb', 'fas fa-memory', 'fas fa-microchip'
];

// ============================================
// Utility Functions
// ============================================

async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function showToast(message, type = 'info', duration = 3000) {
    const toast = document.getElementById('toast');
    const msgEl = document.getElementById('toast-message');
    const iconEl = document.getElementById('toast-icon');

    msgEl.textContent = message;
    iconEl.textContent = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';

    toast.classList.remove('hidden', 'opacity-0', 'translate-y-4');

    if (window.toastTimer) clearTimeout(window.toastTimer);
    window.toastTimer = setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-4');
        setTimeout(() => toast.classList.add('hidden'), 300);
    }, duration);
}

function getColorHistory(key) {
    try {
        return JSON.parse(localStorage.getItem(key)) || [];
    } catch {
        return [];
    }
}

function saveColorToHistory(key, color) {
    let history = getColorHistory(key);
    history = history.filter(c => c !== color);
    history.unshift(color);
    history = history.slice(0, 5);
    localStorage.setItem(key, JSON.stringify(history));
}

function isValidLink(url) {
    if (!url || url.trim() === '' || url === '#') return false;
    // Only recognize actual URLs with proper protocols
    const trimmed = url.trim().toLowerCase();
    return trimmed.startsWith('http://') ||
        trimmed.startsWith('https://') ||
        trimmed.startsWith('mailto:') ||
        trimmed.startsWith('tel:') ||
        trimmed.startsWith('sms:');
}

// ============================================
// Data Loading & Migration (from Gist)
// ============================================

async function loadData() {
    try {
        // Try to load from Gist first (using raw URL for public/secret gists)
        // For authenticated access, we use the API later in sync
        const gistRawUrl = `https://gist.githubusercontent.com/${GITHUB_OWNER}/${GIST_ID}/raw/${GIST_FILENAME}?t=${Date.now()}`;

        let response = await fetch(gistRawUrl);

        if (!response.ok) {
            // Fallback to local data.json if Gist fails (initial setup)
            console.warn('Failed to fetch from Gist, falling back to local data.json');
            response = await fetch('data.json?t=' + Date.now());
        }

        appData = await response.json();
        migrateData();

        renderPage();
        applyTheme();
        checkAdminAccess();
    } catch (error) {
        console.error('Failed to load data:', error);
        showToast('加载数据失败', 'error');
    }
}

function migrateData() {
    // Ensure theme settings exist
    if (!appData.theme) appData.theme = {};
    if (!appData.theme.font) appData.theme.font = 'sans';
    if (!appData.theme.fontSize) appData.theme.fontSize = 16;
    if (!appData.theme.bgColor) appData.theme.bgColor = '#F5EFEA';

    // Ensure settings exist
    if (!appData.settings) appData.settings = {};

    // Ensure section headers exist
    if (!appData.sections) appData.sections = {};
    if (!appData.sections.socials) {
        appData.sections.socials = {
            visible: true,
            title: 'SNS Contact',
            fontSize: 16,
            color: '#605652'
        };
    }
    if (!appData.sections.projects) {
        appData.sections.projects = {
            visible: true,
            title: 'Recent Projects',
            fontSize: 18,
            color: '#605652'
        };
    }

    // Ensure projects have width and newTab
    if (appData.projects) {
        appData.projects.forEach(p => {
            if (!p.width) p.width = '1x1';
            if (typeof p.newTab === 'undefined') p.newTab = true;
        });
    }

    // Ensure socials have icon class and newTab
    if (appData.socials) {
        appData.socials.forEach(s => {
            if (typeof s.newTab === 'undefined') s.newTab = true;
            if (!s.icon) {
                const map = {
                    'github': 'fab fa-github',
                    'twitter': 'fab fa-twitter',
                    'instagram': 'fab fa-instagram',
                    'linkedin': 'fab fa-linkedin',
                    'youtube': 'fab fa-youtube',
                    'email': 'fas fa-envelope',
                    'web': 'fas fa-globe',
                    'wechat': 'fab fa-weixin',
                    'medium': 'fab fa-medium'
                };
                s.icon = map[s.platform] || 'fas fa-link';
            }
        });
    }
}

// ============================================
// Rendering
// ============================================

function renderPage() {
    if (!appData) return;
    renderProfile();
    renderSectionHeaders();
    renderSocials();
    renderProjects();
    renderFooter();

    if (isAdminMode) {
        initSortable();
    }
}

function renderSectionHeaders() {
    // Socials Section
    const socialsSection = document.getElementById('socials-section');
    const socialsHeader = document.getElementById('socials-header');
    const socialsTitle = document.getElementById('socials-title');

    if (appData.sections.socials.visible) {
        socialsSection.classList.remove('hidden');
        socialsHeader.classList.remove('hidden');
        socialsTitle.textContent = appData.sections.socials.title;
        socialsTitle.style.fontSize = `${appData.sections.socials.fontSize}px`;
        socialsTitle.style.color = appData.sections.socials.color;
    } else {
        socialsSection.classList.add('hidden');
    }

    // Projects Section
    const projectsSection = document.getElementById('projects-section');
    const projectsHeader = document.getElementById('projects-header');
    const projectsTitle = document.getElementById('projects-title');

    if (appData.sections.projects.visible) {
        projectsSection.classList.remove('hidden');
        projectsHeader.classList.remove('hidden');
        projectsTitle.textContent = appData.sections.projects.title;
        projectsTitle.style.fontSize = `${appData.sections.projects.fontSize}px`;
        projectsTitle.style.color = appData.sections.projects.color;
    } else {
        projectsSection.classList.add('hidden');
    }
}

function renderProfile() {
    document.getElementById('avatar').src = appData.profile.avatar;
    document.getElementById('profile-name').textContent = appData.profile.name;

    // Handle long profile title with marquee animation
    const profileTitle = document.getElementById('profile-title');
    profileTitle.textContent = appData.profile.title;

    // Check if text overflows and add marquee if needed
    setTimeout(() => {
        if (profileTitle.scrollWidth > profileTitle.clientWidth) {
            // Text is too long, wrap in marquee container
            const text = appData.profile.title;
            profileTitle.innerHTML = `<span class="marquee-text animate">${text}</span>`;
            profileTitle.classList.add('marquee-container');
            profileTitle.style.containerType = 'inline-size';
        } else {
            profileTitle.classList.remove('marquee-container');
        }
    }, 100);

    document.getElementById('contact-text').textContent = appData.profile.contactText;

    const contactLink = document.getElementById('contact-link');
    const url = appData.profile.contactUrl;

    if (isValidLink(url)) {
        contactLink.href = url;
        contactLink.classList.remove('pointer-events-none', 'opacity-75');
        contactLink.querySelector('button').classList.remove('cursor-default');
        contactLink.target = '_blank';
        contactLink.rel = 'noopener noreferrer';
    } else {
        contactLink.removeAttribute('href');
        contactLink.removeAttribute('target');
        contactLink.classList.add('pointer-events-none', 'opacity-75');
        contactLink.querySelector('button').classList.add('cursor-default');
    }
}

function renderSocials() {
    const socialsGrid = document.getElementById('socials-grid');
    socialsGrid.innerHTML = appData.socials.map(social => {
        const hasLink = isValidLink(social.url);
        const urlValue = social.url && social.url.trim() !== '' && social.url !== '#' ? social.url.trim() : '';

        // Determine back content
        let backContent = '';
        if (hasLink) {
            backContent = `<div class="back-link">跳转链接 <i class="fas fa-external-link-alt"></i></div>`;
        } else if (urlValue) {
            // Show the URL field value (e.g., WeChat ID, phone number, etc.)
            backContent = `<div class="back-content">${urlValue}</div>`;
        } else if (social.label) {
            // Fallback to label if no URL value
            backContent = `<div class="back-content">${social.label}</div>`;
        }

        return `
        <div class="social-item flip-card relative group" data-id="${social.id}" 
             data-has-link="${hasLink}" data-url="${social.url || ''}" data-new-tab="${social.newTab}">
            <div class="flip-card-inner w-full aspect-square">
                <!-- Front -->
                <div class="flip-card-front neu-button w-full h-full rounded-2xl flex flex-col items-center justify-center gap-2 p-2" style="color: ${social.color}">
                    <i class="${social.icon} text-2xl"></i>
                    ${social.label ? `<span class="text-[10px] font-medium text-text-sub truncate w-full text-center">${social.label}</span>` : ''}
                </div>
                <!-- Back -->
                <div class="flip-card-back rounded-2xl">
                    ${backContent}
                </div>
            </div>
            ${isAdminMode ? `
            <div class="delete-btn-overlay" onclick="event.stopPropagation(); deleteSocial('${social.id}')">
                <i class="fas fa-times"></i>
            </div>
            ` : ''}
        </div>
    `}).join('');

    // Attach flip event listeners
    attachFlipListeners();
}

function renderProjects() {
    const projectsGrid = document.getElementById('projects-grid');
    // Filter out hidden projects for display
    const visibleProjects = appData.projects.filter(p => !p.hidden);
    projectsGrid.innerHTML = visibleProjects.map(project => {
        const hasLink = isValidLink(project.link);

        let gridClass = 'col-span-1';
        let heightClass = 'aspect-square';

        if (project.width === '1x2') {
            gridClass = 'col-span-1 row-span-2';
            heightClass = 'aspect-[1/2]';
        } else if (project.width === '2x1') {
            gridClass = 'col-span-2';
            heightClass = 'aspect-[2/1]';
        } else if (project.width === '3x1') {
            gridClass = 'col-span-2 sm:col-span-3';
            heightClass = 'aspect-[3/1]';
        } else if (project.width === '4x1') {
            gridClass = 'col-span-2 sm:col-span-4';
            heightClass = 'aspect-[4/1]';
        } else if (project.width === '2x2') {
            gridClass = 'col-span-2 row-span-2';
            heightClass = 'aspect-square';
        }

        // Determine back content
        let backContent = '';
        if (project.backImage) {
            backContent = `<img src="${project.backImage}" class="w-full h-full object-cover rounded-2xl" alt="${project.title} Back">`;
            // If it's a link, add an overlay icon
            if (hasLink) {
                backContent += `<div class="absolute inset-0 flex items-center justify-center bg-black/30 rounded-2xl"><i class="fas fa-external-link-alt text-white text-2xl"></i></div>`;
            }
        } else if (hasLink) {
            backContent = `<div class="back-link">跳转链接 <i class="fas fa-external-link-alt"></i></div>`;
        } else if (project.link) {
            // Show text content if it's not a valid link but has content
            backContent = `<div class="back-content p-4 text-center break-words text-sm">${project.link}</div>`;
        } else {
            // Fallback to title
            backContent = `<div class="back-content">${project.title}</div>`;
        }

        // Determine front content
        const hasImage = project.image && !project.image.includes('via.placeholder.com');
        const showIcon = !hasImage && project.icon;
        const isFullImage = hasImage && !project.title;

        let frontContent = '';
        let frontClasses = 'flip-card-front neu-card flex flex-col';

        if (isFullImage) {
            frontClasses += ' p-0 overflow-hidden border-none full-image-mode';
            frontContent = `
                <img src="${project.image}" alt="Project Image" class="w-full h-full object-cover" loading="lazy">
            `;
        } else {
            frontClasses += ' p-3';

            let visualContent = '';
            if (showIcon) {
                visualContent = `
                    <div class="w-full ${heightClass} rounded-xl overflow-hidden mb-2 flex items-center justify-center text-text-sub relative flex-shrink-0">
                        <i class="${project.icon} text-5xl opacity-80"></i>
                    </div>
                `;
            } else {
                visualContent = `
                    <div class="w-full ${heightClass} rounded-xl overflow-hidden mb-2 bg-gray-200 relative flex-shrink-0">
                        <img src="${project.image}" alt="${project.title}" class="w-full h-full object-cover" loading="lazy">
                    </div>
                `;
            }

            frontContent = `
                ${visualContent}
                ${project.title ? `<h3 class="project-title-text font-semibold text-xs text-text-main leading-tight mt-auto flex-shrink-0 overflow-hidden w-full" style="container-type: inline-size;"><span class="project-title-inner inline-block whitespace-nowrap">${project.title}</span></h3>` : ''}
            `;
        }

        return `
        <div class="project-item flip-card relative group ${gridClass}" data-id="${project.id}"
             data-has-link="${hasLink}" data-url="${project.link || ''}" 
             data-auto-flip="${project.autoFlip || false}" 
             data-flip-interval="${project.flipInterval || 3000}"
             data-flip-effect="${project.flipEffect || 'flip-left'}">
            <div class="flip-card-inner ${project.flipEffect || 'flip-left'}">
                <!-- Front -->
                <div class="${frontClasses}">
                    ${frontContent}
                </div>
                <!-- Back -->
                <div class="flip-card-back rounded-2xl ${project.backImage ? 'p-0 overflow-hidden border-none' : ''}">
                    ${backContent}
                </div>
            </div>
            ${isAdminMode ? `
            <div class="delete-btn-overlay" onclick="event.stopPropagation(); deleteProject('${project.id}')">
                <i class="fas fa-times"></i>
            </div>
            ` : ''}
        </div>
    `}).join('');

    // Attach flip event listeners
    attachFlipListeners();
    // Initialize auto-flip
    initAutoFlip();
    // Initialize marquee for long project titles
    initProjectTitleMarquee();
}

// Auto Flip Logic
let flipIntervals = [];

function initAutoFlip() {
    // Clear existing intervals
    flipIntervals.forEach(interval => clearInterval(interval));
    flipIntervals = [];

    const autoFlipCards = document.querySelectorAll('.project-item[data-auto-flip="true"]');

    autoFlipCards.forEach(card => {
        const intervalTime = parseInt(card.dataset.flipInterval) || 3000;

        const startFlip = () => {
            const interval = setInterval(() => {
                card.classList.toggle('flipped');
            }, intervalTime);
            flipIntervals.push(interval);
            return interval;
        };

        let currentInterval = startFlip();

        // Pause on hover
        card.addEventListener('mouseenter', () => {
            clearInterval(currentInterval);
        });

        card.addEventListener('mouseleave', () => {
            currentInterval = startFlip();
        });
    });
}

// Project Title Marquee Animation for long text
function initProjectTitleMarquee() {
    // Wait a bit for DOM to fully render
    setTimeout(() => {
        document.querySelectorAll('.project-title-text').forEach(container => {
            const inner = container.querySelector('.project-title-inner');
            if (!inner) return;

            // Calculate overflow amount
            const textWidth = inner.scrollWidth;
            const containerWidth = container.clientWidth;
            const overflow = textWidth - containerWidth;

            // Check if text overflows
            if (overflow > 0) {
                // Text is too long, set CSS variable for scroll distance and add animation
                inner.style.setProperty('--scroll-distance', `-${overflow}px`);
                inner.classList.add('project-title-marquee');
            } else {
                // Text fits, remove animation if any
                inner.classList.remove('project-title-marquee');
                inner.style.removeProperty('--scroll-distance');
            }
        });
    }, 100);
}

// Flip Card Event Handler
function attachFlipListeners() {
    document.querySelectorAll('.flip-card').forEach(card => {
        card.removeEventListener('click', handleFlipClick);
        card.addEventListener('click', handleFlipClick);
    });
}

function handleFlipClick(e) {
    // Ignore if clicking delete button
    if (e.target.closest('.delete-btn-overlay')) return;

    const card = e.currentTarget;
    const hasLink = card.dataset.hasLink === 'true';
    const url = card.dataset.url;
    const isAutoFlip = card.dataset.autoFlip === 'true';

    // If card is already flipped
    if (card.classList.contains('flipped')) {
        // If has link, navigate
        if (hasLink && url) {
            window.open(url, '_blank', 'noopener,noreferrer');
        }
        // Flip back
        card.classList.remove('flipped');
    } else {
        // Flip the card
        card.classList.add('flipped');

        // Auto flip back after 2 seconds ONLY if not in auto-flip mode
        if (!isAutoFlip) {
            setTimeout(() => {
                card.classList.remove('flipped');
            }, 2000);
        }
    }
}

function renderFooter() {
    document.getElementById('copyright').textContent = `© ${new Date().getFullYear()} ${appData.profile.name} · All Rights Reserved`;
}

function applyTheme() {
    if (!appData) return;

    const { style, bgColor, font, fontSize } = appData.theme;

    document.body.classList.remove('theme-default', 'theme-glass');
    document.body.classList.add(`theme-${style}`);

    if (style === 'glass') {
        document.body.style.background = `linear-gradient(135deg, ${bgColor} 0%, ${adjustColor(bgColor, -40)} 100%)`;
    } else {
        document.body.style.background = bgColor;
    }

    document.body.classList.remove('font-sans', 'font-serif');
    document.body.classList.add(font === 'serif' ? 'font-serif' : 'font-sans');

    document.documentElement.style.fontSize = `${fontSize}px`;
}

function adjustColor(color, amount) {
    const hex = color.replace('#', '');
    const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
    const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
    const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// ============================================
// Admin Mode & Logic
// ============================================

function checkAdminAccess() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('admin') === 'true' || localStorage.getItem('admin_logged_in') === 'true') {
        isAdminMode = true;
        document.body.classList.add('admin-mode');
        document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));
        initSortable();
    }

    if (localStorage.getItem('github_token_verified') === 'true') {
        isTokenVerified = true;
        githubToken = localStorage.getItem('github_token');
    }
}

function initSortable() {
    new Sortable(document.getElementById('socials-grid'), {
        animation: 150,
        ghostClass: 'sortable-ghost',
        dragClass: 'sortable-drag',
        delay: 100,
        delayOnTouchOnly: true,
        onEnd: function (evt) {
            const newOrder = [];
            document.querySelectorAll('#socials-grid .social-item').forEach(item => {
                const id = item.dataset.id;
                const social = appData.socials.find(s => s.id === id);
                if (social) newOrder.push(social);
            });
            appData.socials = newOrder;
        }
    });

    new Sortable(document.getElementById('projects-grid'), {
        animation: 150,
        ghostClass: 'sortable-ghost',
        dragClass: 'sortable-drag',
        delay: 100,
        delayOnTouchOnly: true,
        onEnd: function (evt) {
            const newOrder = [];
            document.querySelectorAll('#projects-grid .project-item').forEach(item => {
                const id = item.dataset.id;
                const project = appData.projects.find(p => p.id === id);
                if (project) newOrder.push(project);
            });
            appData.projects = newOrder;
        }
    });
}

function showLoginModal() {
    isAdminMode = true;
    localStorage.setItem('admin_logged_in', 'true');
    openAdminPanel();
    showToast('Admin Mode Activated', 'success');
    document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));
    initSortable();
}

function hideLoginModal() {
    // Functionality removed as modal is no longer used, but kept empty/stubbed if referenced elsewhere, 
    // or can be safe to delete if we are sure. For now, let's just make it do nothing or remove it if not needed.
    // Checking references: called by login-cancel click.
    document.getElementById('login-modal').classList.add('hidden');
}

// attemptLogin function removed


function openAdminPanel() {
    document.getElementById('admin-panel').classList.remove('hidden');

    const savedToken = localStorage.getItem('github_token');
    if (savedToken) {
        githubToken = savedToken;
        document.getElementById('github-token').value = savedToken;
    }
    updateTokenUI();
    populateEditors();
    switchTab('profile');
}

function closeAdminPanel() {
    document.getElementById('admin-panel').classList.add('hidden');
}

function switchTab(tabId) {
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        if (btn.dataset.tab === tabId) {
            btn.classList.add('bg-white', 'text-blue-600', 'shadow-sm');
            btn.classList.remove('text-gray-600', 'hover:bg-white/80');
        } else {
            btn.classList.remove('bg-white', 'text-blue-600', 'shadow-sm');
            btn.classList.add('text-gray-600', 'hover:bg-white/80');
        }
    });

    document.querySelectorAll('.admin-tab-content').forEach(content => {
        if (content.id === `tab-${tabId}`) {
            content.classList.remove('hidden');
        } else {
            content.classList.add('hidden');
        }
    });
}

function populateEditors() {
    document.getElementById('edit-name').value = appData.profile.name;
    document.getElementById('edit-title').value = appData.profile.title;
    document.getElementById('edit-contact-text').value = appData.profile.contactText;
    document.getElementById('edit-contact-url').value = appData.profile.contactUrl;

    document.querySelectorAll('.theme-btn').forEach(btn => {
        const isActive = btn.dataset.style === appData.theme.style;
        btn.classList.toggle('ring-2', isActive);
        btn.classList.toggle('ring-blue-500', isActive);
    });

    document.getElementById('bg-color').value = appData.theme.bgColor;
    document.getElementById('bg-color-hex').textContent = appData.theme.bgColor;
    renderColorPresets();

    document.querySelectorAll('.font-btn').forEach(btn => {
        const isActive = btn.dataset.font === appData.theme.font;
        btn.classList.toggle('ring-2', isActive);
        btn.classList.toggle('ring-blue-500', isActive);
    });
    document.getElementById('font-size-slider').value = appData.theme.fontSize;

    // Section Headers
    document.getElementById('socials-section-visible').checked = appData.sections.socials.visible;
    document.getElementById('socials-section-title').value = appData.sections.socials.title;
    document.getElementById('socials-section-size').value = appData.sections.socials.fontSize;
    document.getElementById('socials-section-color').value = appData.sections.socials.color;

    document.getElementById('projects-section-visible').checked = appData.sections.projects.visible;
    document.getElementById('projects-section-title').value = appData.sections.projects.title;
    document.getElementById('projects-section-size').value = appData.sections.projects.fontSize;
    document.getElementById('projects-section-color').value = appData.sections.projects.color;

    renderSocialsEditor();
    renderProjectsEditor();
}

function renderColorPresets() {
    const container = document.getElementById('bg-color-presets');
    const history = getColorHistory('bg_color_history');
    let presets = [...DEFAULT_BG_COLORS];

    history.forEach(c => {
        if (!presets.find(p => p.color === c)) {
            presets.unshift({ color: c, name: '历史' });
        }
    });

    container.innerHTML = presets.slice(0, 8).map(p => `
        <button class="color-preset w-8 h-8 rounded-lg border-2 border-white shadow-sm hover:scale-110 transition-transform cursor-pointer" 
                style="background: ${p.color}" 
                data-color="${p.color}" 
                title="${p.name}"></button>
    `).join('');
}

function renderSocialsEditor() {
    const container = document.getElementById('socials-editor');
    container.innerHTML = appData.socials.map((social, index) => `
        <div class="p-3 bg-white rounded-lg border border-gray-200 space-y-2" data-index="${index}">
            <div class="flex items-center gap-2">
                <button class="icon-select-btn w-8 h-8 flex items-center justify-center bg-gray-100 rounded border border-gray-300 hover:bg-gray-200"
                        onclick="openIconPicker(${index}, 'social')">
                    <i class="${social.icon}"></i>
                </button>
                <input type="color" class="social-color-input w-8 h-8 rounded cursor-pointer" value="${social.color}" onchange="updateSocial(${index}, 'color', this.value)">
                <div class="flex-1"></div>
                <button class="text-red-500 hover:text-red-600 p-1" onclick="deleteSocial('${social.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <input type="text" class="w-full bg-white text-gray-800 border border-gray-300 rounded p-1.5 text-xs" 
                   value="${social.label || ''}" placeholder="显示文字（如：微信）" 
                   oninput="updateSocial(${index}, 'label', this.value)">
            <input type="text" class="w-full bg-white text-gray-800 border border-gray-300 rounded p-1.5 text-xs" 
                   value="${social.url || ''}" placeholder="链接或ID（如：https://... 或 微信号）" 
                   oninput="updateSocial(${index}, 'url', this.value)">
        </div>
    `).join('');
}

function renderProjectsEditor() {
    const container = document.getElementById('projects-editor');
    container.innerHTML = appData.projects.map((project, index) => `
        <div class="p-3 bg-white rounded-lg border border-gray-200 space-y-2 ${project.hidden ? 'opacity-50' : ''}" data-index="${index}">
            <div class="flex items-center gap-2">
                <input type="text" class="flex-1 bg-white text-gray-800 border border-gray-300 rounded p-2 text-sm font-bold" 
                       value="${project.title}" placeholder="项目名称"
                       oninput="updateProject(${index}, 'title', this.value)">
                <button class="px-2 py-1 text-xs rounded ${project.hidden ? 'bg-gray-200 text-gray-600' : 'bg-green-100 text-green-600'}" 
                        onclick="toggleProjectVisibility(${index})">
                    <i class="fas ${project.hidden ? 'fa-eye-slash' : 'fa-eye'}"></i>
                    ${project.hidden ? '已隐藏' : '显示中'}
                </button>
            </div>
            
            <div class="flex gap-2">
                <select class="bg-white border border-gray-300 rounded p-1 text-xs flex-1"
                        onchange="updateProject(${index}, 'width', this.value)">
                    <option value="1x1" ${project.width === '1x1' ? 'selected' : ''}>1x1 正方形 (小)</option>
                    <option value="1x2" ${project.width === '1x2' ? 'selected' : ''}>1x2 纵向长方形</option>
                    <option value="2x1" ${project.width === '2x1' ? 'selected' : ''}>2x1 横向长方形</option>
                    <option value="2x2" ${project.width === '2x2' ? 'selected' : ''}>2x2 正方形 (大)</option>
                    <option value="3x1" ${project.width === '3x1' ? 'selected' : ''}>3x1 超宽横幅</option>
                    <option value="4x1" ${project.width === '4x1' ? 'selected' : ''}>4x1 全宽横幅</option>
                </select>
            </div>

            <input type="text" class="w-full bg-white text-gray-800 border border-gray-300 rounded p-2 text-sm" 
                   value="${project.link || ''}" placeholder="项目链接（可选）"
                   oninput="updateProject(${index}, 'link', this.value)">

            <!-- Images -->
            <div class="grid grid-cols-2 gap-2">
                <div class="space-y-1">
                    <label class="text-xs text-gray-500">封面图片</label>
                    <div class="flex items-center gap-2">
                        <img src="${project.image}" class="w-10 h-10 rounded object-cover bg-gray-100">
                        <input type="file" class="text-xs w-full" accept="image/*" onchange="uploadProjectImage(this, ${index}, 'image')">
                        <button class="icon-select-btn w-8 h-8 flex-shrink-0 flex items-center justify-center bg-gray-100 rounded border border-gray-300 hover:bg-gray-200"
                                onclick="openIconPicker(${index}, 'project')" title="选择图标 (无图片时显示)">
                            <i class="${project.icon || 'fas fa-image'}"></i>
                        </button>
                        <button class="w-8 h-8 flex-shrink-0 flex items-center justify-center text-gray-400 hover:text-red-500"
                                onclick="updateProject(${index}, 'image', '')" title="移除图片">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                <div class="space-y-1">
                    <label class="text-xs text-gray-500">背面图片 (可选)</label>
                    <div class="flex items-center gap-2">
                        ${project.backImage ? `<img src="${project.backImage}" class="w-10 h-10 rounded object-cover bg-gray-100">` : '<div class="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-400 text-xs">无</div>'}
                        <input type="file" class="text-xs w-full" accept="image/*" onchange="uploadProjectImage(this, ${index}, 'backImage')">
                    </div>
                </div>
            </div>

            <!-- Auto Flip Settings -->
            <div class="border-t border-gray-100 pt-2 space-y-2">
                <label class="flex items-center gap-2 text-xs text-gray-600">
                    <input type="checkbox" ${project.autoFlip ? 'checked' : ''} onchange="updateProject(${index}, 'autoFlip', this.checked)">
                    启用自动翻转
                </label>
                
                ${project.autoFlip ? `
                <div class="grid grid-cols-2 gap-2 pl-4">
                    <div>
                        <label class="block text-[10px] text-gray-500 mb-1">间隔 (毫秒)</label>
                        <input type="number" class="w-full bg-white border border-gray-300 rounded p-1 text-xs" 
                               value="${project.flipInterval || 3000}" min="1000" step="500"
                               oninput="updateProject(${index}, 'flipInterval', parseInt(this.value))">
                    </div>
                    <div>
                        <label class="block text-[10px] text-gray-500 mb-1">动画效果</label>
                        <select class="w-full bg-white border border-gray-300 rounded p-1 text-xs"
                                onchange="updateProject(${index}, 'flipEffect', this.value)">
                            <option value="flip-left" ${project.flipEffect === 'flip-left' ? 'selected' : ''}>左右翻转 (默认)</option>
                            <option value="flip-up" ${project.flipEffect === 'flip-up' ? 'selected' : ''}>上下翻转</option>
                            <option value="fade" ${project.flipEffect === 'fade' ? 'selected' : ''}>淡入淡出</option>
                        </select>
                    </div>
                </div>
                ` : ''}
            </div>

            <div class="flex justify-end pt-2">
                <button class="text-red-500 hover:text-red-600 p-1 text-xs flex items-center gap-1" onclick="deleteProject('${project.id}')">
                    <i class="fas fa-trash"></i> 删除项目
                </button>
            </div>
        </div>
    `).join('');
}

// ============================================
// Real-time Updates
// ============================================

function updateProfile(field, value) {
    appData.profile[field] = value;
    renderProfile();
}

function updateSocial(index, field, value) {
    appData.socials[index][field] = value;
    renderSocials();
}

function updateProject(index, field, value) {
    appData.projects[index][field] = value;
    renderProjects();
}

function toggleProjectVisibility(index) {
    appData.projects[index].hidden = !appData.projects[index].hidden;
    renderProjects();
    renderProjectsEditor();
}

function addSocial() {
    appData.socials.push({
        id: generateId(),
        platform: 'web',
        icon: 'fas fa-link',
        url: '#',
        color: '#333333',
        label: 'New Link',
        newTab: true
    });
    renderSocials();
    renderSocialsEditor();
}

function deleteSocial(id) {
    if (confirm('确定删除吗？')) {
        appData.socials = appData.socials.filter(s => s.id !== id);
        renderSocials();
        renderSocialsEditor();
    }
}

function addProject() {
    const randomIcon = COMMON_ICONS[Math.floor(Math.random() * COMMON_ICONS.length)];
    appData.projects.push({
        id: generateId(),
        title: 'New Project',
        image: '', // Default to empty image so icon shows
        icon: randomIcon, // Random default icon
        link: '#',
        width: '1x1',
        newTab: true
    });
    renderProjects();
    renderProjectsEditor();
}

function deleteProject(id) {
    if (confirm('确定删除吗？')) {
        appData.projects = appData.projects.filter(p => p.id !== id);
        renderProjects();
        renderProjectsEditor();
    }
}

// ============================================
// Icon Picker
// ============================================

let currentIconContext = { type: null, index: null };

function openIconPicker(index, type = 'social') {
    currentIconContext = { type, index };
    const modal = document.getElementById('icon-picker-modal');
    modal.classList.remove('hidden');
    renderIconGrid(COMMON_ICONS);
}

function renderIconGrid(icons) {
    const grid = document.getElementById('icon-grid');
    const { type, index } = currentIconContext;
    let currentIcon = '';

    if (type === 'social') {
        currentIcon = appData.socials[index].icon;
    } else if (type === 'project') {
        currentIcon = appData.projects[index].icon;
    }

    grid.innerHTML = icons.map(icon => `
        <div class="icon-item ${currentIcon === icon ? 'selected' : ''}" 
             onclick="selectIcon('${icon}')">
            <i class="${icon} text-xl"></i>
        </div>
    `).join('');
}

function selectIcon(icon) {
    const { type, index } = currentIconContext;
    if (index !== null) {
        if (type === 'social') {
            appData.socials[index].icon = icon;
            renderSocials();
            renderSocialsEditor();
        } else if (type === 'project') {
            appData.projects[index].icon = icon;
            renderProjects();
            renderProjectsEditor();
        }
    }
    document.getElementById('icon-picker-modal').classList.add('hidden');
}

// ============================================
// GitHub API (Token Verification & Image Upload)
// ============================================

function updateTokenUI() {
    const inputSection = document.getElementById('token-input-section');
    const statusSection = document.getElementById('token-status-section');

    if (isTokenVerified && githubToken) {
        inputSection.classList.add('hidden');
        statusSection.classList.remove('hidden');
    } else {
        inputSection.classList.remove('hidden');
        statusSection.classList.add('hidden');
    }
}

async function verifyToken() {
    const token = document.getElementById('github-token').value.trim();
    if (!token) {
        showToast('请输入 Token', 'error');
        return;
    }

    const verifyBtn = document.getElementById('verify-token-btn');
    const originalText = verifyBtn.textContent;
    verifyBtn.textContent = '验证中...';
    verifyBtn.disabled = true;

    try {
        // Verify token by checking Gist access
        const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (response.ok) {
            githubToken = token;
            isTokenVerified = true;
            localStorage.setItem('github_token', token);
            localStorage.setItem('github_token_verified', 'true');
            updateTokenUI();
            showToast('Token 验证成功！', 'success');
        } else {
            throw new Error('Token 无效或权限不足（需要 gist 权限）');
        }
    } catch (error) {
        showToast('验证失败: ' + error.message, 'error');
    } finally {
        verifyBtn.textContent = originalText;
        verifyBtn.disabled = false;
    }
}

function resetToken() {
    if (confirm('确定要重置 GitHub Token 吗？')) {
        localStorage.removeItem('github_token');
        localStorage.removeItem('github_token_verified');
        isTokenVerified = false;
        githubToken = null;
        document.getElementById('github-token').value = '';
        updateTokenUI();
        showToast('Token 已重置', 'info');
    }
}

// GitHub Repo API (for image uploads only - these still go to repo)
async function getFileSha(path) {
    const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${path}?ref=${GITHUB_BRANCH}&_t=${Date.now()}`;
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `token ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            return data.sha;
        } else if (response.status === 404) {
            return null;
        } else {
            throw new Error(`Failed to get file info: ${response.status}`);
        }
    } catch (error) {
        console.error('Error getting SHA:', error);
        throw error;
    }
}

async function uploadImageToGitHub(file, fileName) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async () => {
            try {
                const base64Content = reader.result.split(',')[1];
                const path = `images/${fileName}`;

                let sha = null;
                try {
                    sha = await getFileSha(path);
                } catch (e) {
                    // Ignore
                }

                const body = {
                    message: `Upload image: ${fileName}`,
                    content: base64Content,
                    branch: GITHUB_BRANCH
                };

                if (sha) {
                    body.sha = sha;
                }

                const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `token ${githubToken}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(body)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Image upload failed');
                }

                const data = await response.json();
                resolve(data.content.download_url);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ============================================
// Gist API (for data storage - NO DEPLOYMENTS!)
// ============================================

async function saveToGist() {
    if (!isTokenVerified || !githubToken) {
        showToast('请先验证 GitHub Token', 'error');
        return;
    }

    const saveBtn = document.getElementById('save-btn');
    const originalText = saveBtn.innerHTML;
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 保存中...';

    try {
        const jsonContent = JSON.stringify(appData, null, 2);

        const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `token ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                files: {
                    [GIST_FILENAME]: {
                        content: jsonContent
                    }
                }
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Save failed');
        }

        showToast('保存成功！（已保存到 Gist，不会触发部署）', 'success');
        renderPage();
    } catch (error) {
        console.error('Save failed:', error);
        showToast('保存失败: ' + error.message, 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = originalText;
    }
}

async function syncFromGist() {
    if (!isTokenVerified || !githubToken) {
        showToast('请先验证 GitHub Token', 'error');
        return;
    }

    if (!confirm('确定要从 Gist 拉取最新数据吗？\n这将覆盖当前未保存的修改。')) {
        return;
    }

    const btn = document.getElementById('sync-github-btn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 拉取中...';
    btn.disabled = true;

    try {
        const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
            headers: {
                'Authorization': `token ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!response.ok) throw new Error('Failed to fetch Gist');

        const gist = await response.json();
        const content = gist.files[GIST_FILENAME]?.content;

        if (!content) throw new Error('Gist 中找不到 data.json 文件');

        appData = JSON.parse(content);
        migrateData();
        renderPage();
        applyTheme();
        populateEditors();

        showToast('数据已从 Gist 同步', 'success');
    } catch (error) {
        console.error('Sync failed:', error);
        showToast('同步失败: ' + error.message, 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

function downloadData() {
    if (!appData) return;

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "data.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

async function uploadProjectImage(input, index, field = 'image') {
    const file = input.files[0];
    if (!file) return;

    if (!isTokenVerified || !githubToken) {
        showToast('请先验证 GitHub Token', 'error');
        return;
    }

    showToast('上传图片中...', 'info');
    try {
        const fileName = `project-${field}-${Date.now()}.${file.name.split('.').pop()}`;
        const url = await uploadImageToGitHub(file, fileName);
        appData.projects[index][field] = url;
        renderProjects();
        renderProjectsEditor();
        showToast('图片上传成功', 'success');
    } catch (error) {
        showToast('图片上传失败: ' + error.message, 'error');
    }
}

// ============================================
// Event Listeners
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    loadData();

    // Admin Entry via Copyright
    document.getElementById('copyright').addEventListener('click', showLoginModal);
    document.getElementById('close-admin').addEventListener('click', () => {
        localStorage.removeItem('admin_logged_in');
        const url = new URL(window.location.href);
        url.searchParams.delete('admin');
        window.history.replaceState({}, '', url);
        window.location.reload();
    });
    document.getElementById('admin-backdrop').addEventListener('click', closeAdminPanel);

    // Tab Switching
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            switchTab(btn.dataset.tab);
        });
    });

    // Login
    // Login Listeners - Removed
    // document.getElementById('login-submit').addEventListener('click', attemptLogin);
    // document.getElementById('login-cancel').addEventListener('click', hideLoginModal);
    // document.getElementById('login-password').addEventListener('keypress', (e) => {
    //     if (e.key === 'Enter') attemptLogin();
    // });

    // Token
    document.getElementById('verify-token-btn').addEventListener('click', verifyToken);
    document.getElementById('reset-token-btn').addEventListener('click', resetToken);

    // Sync & Download
    document.getElementById('sync-github-btn').addEventListener('click', syncFromGist);
    document.getElementById('download-data-btn').addEventListener('click', downloadData);

    // Profile Inputs (Real-time)
    document.getElementById('edit-name').addEventListener('input', (e) => updateProfile('name', e.target.value));
    document.getElementById('edit-title').addEventListener('input', (e) => updateProfile('title', e.target.value));
    document.getElementById('edit-contact-text').addEventListener('input', (e) => updateProfile('contactText', e.target.value));
    document.getElementById('edit-contact-url').addEventListener('input', (e) => updateProfile('contactUrl', e.target.value));

    // Theme Buttons
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            appData.theme.style = btn.dataset.style;
            if (btn.dataset.style === 'glass' && appData.theme.bgColor === '#F5EFEA') {
                appData.theme.bgColor = '#667eea';
            } else if (btn.dataset.style === 'default') {
                if (['#1a1a2e', '#667eea'].includes(appData.theme.bgColor)) {
                    appData.theme.bgColor = '#F5EFEA';
                }
            }
            applyTheme();
            populateEditors();
        });
    });

    // Font Buttons
    document.querySelectorAll('.font-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            appData.theme.font = btn.dataset.font;
            applyTheme();
            populateEditors();
        });
    });

    // Font Size Slider
    document.getElementById('font-size-slider').addEventListener('input', (e) => {
        appData.theme.fontSize = e.target.value;
        applyTheme();
    });

    // Background Color
    document.getElementById('bg-color').addEventListener('input', (e) => {
        appData.theme.bgColor = e.target.value;
        document.getElementById('bg-color-hex').textContent = e.target.value;
        saveColorToHistory('bg_color_history', e.target.value);
        applyTheme();
    });

    // Color Presets
    document.getElementById('bg-color-presets').addEventListener('click', (e) => {
        const preset = e.target.closest('.color-preset');
        if (preset) {
            appData.theme.bgColor = preset.dataset.color;
            applyTheme();
            populateEditors();
        }
    });

    // Add Buttons
    document.getElementById('add-social-btn-editor')?.addEventListener('click', addSocial);
    document.getElementById('add-project-editor-btn').addEventListener('click', addProject);

    // Section Header Settings - Socials
    document.getElementById('socials-section-visible').addEventListener('change', (e) => {
        appData.sections.socials.visible = e.target.checked;
        renderSectionHeaders();
    });
    document.getElementById('socials-section-title').addEventListener('input', (e) => {
        appData.sections.socials.title = e.target.value;
        renderSectionHeaders();
    });
    document.getElementById('socials-section-size').addEventListener('input', (e) => {
        appData.sections.socials.fontSize = parseInt(e.target.value);
        renderSectionHeaders();
    });
    document.getElementById('socials-section-color').addEventListener('input', (e) => {
        appData.sections.socials.color = e.target.value;
        renderSectionHeaders();
    });

    // Section Header Settings - Projects
    document.getElementById('projects-section-visible').addEventListener('change', (e) => {
        appData.sections.projects.visible = e.target.checked;
        renderSectionHeaders();
    });
    document.getElementById('projects-section-title').addEventListener('input', (e) => {
        appData.sections.projects.title = e.target.value;
        renderSectionHeaders();
    });
    document.getElementById('projects-section-size').addEventListener('input', (e) => {
        appData.sections.projects.fontSize = parseInt(e.target.value);
        renderSectionHeaders();
    });
    document.getElementById('projects-section-color').addEventListener('input', (e) => {
        appData.sections.projects.color = e.target.value;
        renderSectionHeaders();
    });

    // Avatar Upload
    document.getElementById('avatar-upload-btn').addEventListener('click', () => {
        document.getElementById('avatar-input').click();
    });
    document.getElementById('avatar-input').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!isTokenVerified || !githubToken) {
            showToast('请先验证 GitHub Token', 'error');
            return;
        }

        showToast('上传头像中...', 'info');
        try {
            const fileName = `avatar-${Date.now()}.${file.name.split('.').pop()}`;
            const url = await uploadImageToGitHub(file, fileName);
            appData.profile.avatar = url;
            renderProfile();
            showToast('头像上传成功', 'success');
        } catch (error) {
            showToast('头像上传失败: ' + error.message, 'error');
        }
    });

    // Save Button (Now saves to Gist!)
    document.getElementById('save-btn').addEventListener('click', saveToGist);

    // Password Change - Removed


    // Icon Picker Search
    document.getElementById('icon-search').addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = COMMON_ICONS.filter(icon => icon.includes(term));
        renderIconGrid(filtered);
    });

    document.getElementById('close-icon-picker').addEventListener('click', () => {
        document.getElementById('icon-picker-modal').classList.add('hidden');
    });
});
