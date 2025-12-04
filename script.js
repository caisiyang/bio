/**
 * Lightweight CMS - Main Script
 * Features: Data rendering, Admin panel, GitHub API integration, Theme switching
 */

// ============================================
// Global State
// ============================================
let appData = null;
let isAdminMode = false;
let githubToken = null;
let isTokenVerified = false;

const GITHUB_REPO = 'caisiyang/bio';
const GITHUB_BRANCH = 'main';

// Default color presets
const DEFAULT_BG_COLORS = [
    { color: '#F5EFEA', name: '默认奶茶' },
    { color: '#667eea', name: '默认紫 (毛玻璃)' },
    { color: '#1a1a2e', name: '深夜蓝' },
    { color: '#f8f9fa', name: '纯白' },
    { color: '#ffecd2', name: '暖橙' },
    { color: '#a8edea', name: '薄荷' },
];

const DEFAULT_PRIMARY_COLORS = [
    { color: '#605652', name: '默认棕' },
    { color: '#667eea', name: '紫罗兰' },
    { color: '#f093fb', name: '浅粉' },
    { color: '#4facfe', name: '天蓝' },
    { color: '#43e97b', name: '翠绿' },
    { color: '#fa709a', name: '桃红' },
];

// ============================================
// Utility Functions
// ============================================

// SHA-256 Hash
async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// Show toast notification
function showToast(message, duration = 3000) {
    const toast = document.getElementById('toast');
    toast.querySelector('div').textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), duration);
}

// Get icon SVG by platform
function getIconSvg(platform) {
    const icons = {
        instagram: '<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>',
        linkedin: '<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>',
        twitter: '<path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>',
        email: '<path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>',
        github: '<path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>',
        youtube: '<path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>',
        web: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>',
        medium: '<path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z"/>',
        wechat: '<path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 01.598.082l1.584.926a.272.272 0 00.139.045c.133 0 .241-.108.241-.243 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 01-.023-.156.49.49 0 01.201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89l-.407-.03zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.969-.982z"/>',
    };
    return `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">${icons[platform] || icons.web}</svg>`;
}

// Get saved color history
function getColorHistory(key) {
    try {
        return JSON.parse(localStorage.getItem(key)) || [];
    } catch {
        return [];
    }
}

// Save color to history
function saveColorToHistory(key, color) {
    let history = getColorHistory(key);
    // Remove if exists, add to front
    history = history.filter(c => c !== color);
    history.unshift(color);
    // Keep only last 5
    history = history.slice(0, 5);
    localStorage.setItem(key, JSON.stringify(history));
}

// ============================================
// Data Loading & Rendering
// ============================================

async function loadData() {
    try {
        const response = await fetch('data.json?t=' + Date.now());
        appData = await response.json();

        // Ensure theme has bgColor
        if (!appData.theme.bgColor) {
            appData.theme.bgColor = appData.theme.style === 'glass' ? '#667eea' : '#F5EFEA';
        }

        renderPage();
        applyTheme();
    } catch (error) {
        console.error('Failed to load data:', error);
        showToast('加载数据失败');
    }
}

function renderPage() {
    if (!appData) return;

    // Profile
    document.getElementById('avatar').src = appData.profile.avatar;
    document.getElementById('profile-name').textContent = appData.profile.name;
    document.getElementById('profile-title').textContent = appData.profile.title;
    document.getElementById('contact-text').textContent = appData.profile.contactText;
    document.getElementById('contact-link').href = appData.profile.contactUrl;

    // Socials
    const socialsGrid = document.getElementById('socials-grid');
    socialsGrid.innerHTML = appData.socials.map(social => `
        <a href="${social.url}" target="_blank" rel="noopener noreferrer">
            <button class="neu-button w-full aspect-square rounded-2xl text-xl hover:scale-105 transition-transform" style="color: ${social.color}">
                ${getIconSvg(social.platform)}
            </button>
        </a>
    `).join('');

    // Projects
    const projectsGrid = document.getElementById('projects-grid');
    projectsGrid.innerHTML = appData.projects.map(project => `
        <a href="${project.link || '#'}" target="_blank" rel="noopener noreferrer" class="block">
            <div class="neu-card p-3 h-full flex flex-col transition-transform hover:-translate-y-1">
                <div class="w-full aspect-square rounded-xl overflow-hidden mb-3 bg-gray-200">
                    <img src="${project.image}" alt="${project.title}" class="w-full h-full object-cover" loading="lazy">
                </div>
                <h3 class="font-semibold text-xs text-text-main leading-tight mt-auto">${project.title}</h3>
            </div>
        </a>
    `).join('');

    // Copyright
    document.getElementById('copyright').textContent = `© ${new Date().getFullYear()} ${appData.profile.name}`;

    // If admin mode, populate editor forms
    if (isAdminMode) {
        populateEditors();
    }
}

function applyTheme() {
    if (!appData) return;

    const { style, primaryColor, bgColor } = appData.theme;
    document.body.classList.remove('theme-default', 'theme-glass');
    document.body.classList.add(`theme-${style}`);
    document.documentElement.style.setProperty('--primary-color', primaryColor);

    // Apply background color
    if (style === 'glass') {
        document.body.style.background = `linear-gradient(135deg, ${bgColor} 0%, ${adjustColor(bgColor, -20)} 100%)`;
    } else {
        document.body.style.background = bgColor;
    }
}

// Adjust color brightness
function adjustColor(color, amount) {
    const hex = color.replace('#', '');
    const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
    const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
    const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// ============================================
// Admin Mode
// ============================================

let secretClickCount = 0;
let secretClickTimer = null;

function checkAdminAccess() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('admin') === 'true') {
        document.getElementById('admin-toggle').classList.remove('hidden');
    }

    // Check if already logged in
    if (localStorage.getItem('admin_logged_in') === 'true') {
        isAdminMode = true;
    }

    // Check if token is verified
    if (localStorage.getItem('github_token_verified') === 'true') {
        isTokenVerified = true;
        githubToken = localStorage.getItem('github_token');
    }
}

function setupSecretTrigger() {
    const copyright = document.getElementById('copyright');
    copyright.style.cursor = 'default';
    copyright.style.userSelect = 'none';
    copyright.style.webkitUserSelect = 'none';
    copyright.style.webkitTapHighlightColor = 'transparent';

    const handleTrigger = (e) => {
        e.preventDefault();
        e.stopPropagation();
        secretClickCount++;

        if (secretClickTimer) clearTimeout(secretClickTimer);

        if (secretClickCount >= 5) {
            secretClickCount = 0;
            document.getElementById('admin-toggle').classList.remove('hidden');
            showToast('🔓 管理模式已激活');
        }

        secretClickTimer = setTimeout(() => { secretClickCount = 0; }, 2000);
    };

    copyright.addEventListener('click', handleTrigger);
    copyright.addEventListener('touchstart', handleTrigger);
}

function showLoginModal() {
    if (localStorage.getItem('admin_logged_in') === 'true') {
        isAdminMode = true;
        openAdminPanel();
        return;
    }
    document.getElementById('login-modal').classList.remove('hidden');
    document.getElementById('login-password').focus();
}

function hideLoginModal() {
    document.getElementById('login-modal').classList.add('hidden');
    document.getElementById('login-password').value = '';
    document.getElementById('login-error').classList.add('hidden');
}

async function attemptLogin() {
    const password = document.getElementById('login-password').value;
    const hash = await sha256(password);

    if (hash === appData.admin.passwordHash) {
        isAdminMode = true;
        localStorage.setItem('admin_logged_in', 'true');
        hideLoginModal();
        openAdminPanel();
        showToast('登录成功');
    } else {
        document.getElementById('login-error').classList.remove('hidden');
    }
}

function openAdminPanel() {
    document.getElementById('admin-panel').classList.remove('hidden');
    document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));

    // Load saved token
    const savedToken = localStorage.getItem('github_token');
    if (savedToken) {
        githubToken = savedToken;
        document.getElementById('github-token').value = savedToken;
    }

    // Update token UI
    updateTokenUI();

    populateEditors();
}

function updateTokenUI() {
    const tokenInput = document.getElementById('github-token');
    const verifyBtn = document.getElementById('verify-token-btn');
    const statusDiv = document.getElementById('token-status');

    if (isTokenVerified && githubToken) {
        tokenInput.disabled = true;
        tokenInput.classList.add('bg-gray-100', 'cursor-not-allowed');
        verifyBtn.textContent = '已验证 ✓';
        verifyBtn.disabled = true;
        verifyBtn.classList.remove('bg-green-500', 'hover:bg-green-600');
        verifyBtn.classList.add('bg-gray-400', 'cursor-not-allowed');
        statusDiv.classList.remove('hidden');
        statusDiv.classList.add('bg-green-100', 'text-green-700');
        statusDiv.textContent = '✓ Token 已验证，可以正常保存';
    }
}

async function verifyToken() {
    const token = document.getElementById('github-token').value;
    if (!token) {
        showToast('请输入 Token');
        return;
    }

    const verifyBtn = document.getElementById('verify-token-btn');
    verifyBtn.textContent = '验证中...';
    verifyBtn.disabled = true;

    try {
        // Test token by getting repo info
        const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}`, {
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
            showToast('Token 验证成功！');
        } else {
            throw new Error('Token 无效');
        }
    } catch (error) {
        verifyBtn.textContent = '验证';
        verifyBtn.disabled = false;
        showToast('Token 验证失败: ' + error.message);
    }
}

function closeAdminPanel() {
    document.getElementById('admin-panel').classList.add('hidden');
}

function populateEditors() {
    // Profile
    document.getElementById('edit-name').value = appData.profile.name;
    document.getElementById('edit-title').value = appData.profile.title;
    document.getElementById('edit-contact-text').value = appData.profile.contactText;
    document.getElementById('edit-contact-url').value = appData.profile.contactUrl;

    // Theme
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.toggle('ring-2', btn.dataset.style === appData.theme.style);
        btn.classList.toggle('ring-blue-500', btn.dataset.style === appData.theme.style);
    });

    // Colors
    document.getElementById('primary-color').value = appData.theme.primaryColor;
    document.getElementById('primary-color-hex').textContent = appData.theme.primaryColor;
    document.getElementById('bg-color').value = appData.theme.bgColor || '#F5EFEA';
    document.getElementById('bg-color-hex').textContent = appData.theme.bgColor || '#F5EFEA';

    // Render color presets
    renderColorPresets();

    // Socials Editor
    renderSocialsEditor();

    // Projects Editor
    renderProjectsEditor();
}

function renderColorPresets() {
    // Background color presets
    const bgPresetsContainer = document.getElementById('bg-color-presets');
    const bgHistory = getColorHistory('bg_color_history');
    let bgPresets = [...DEFAULT_BG_COLORS];

    // Add history colors that are not in defaults
    bgHistory.forEach(c => {
        if (!bgPresets.find(p => p.color === c)) {
            bgPresets.unshift({ color: c, name: '历史' });
        }
    });

    bgPresetsContainer.innerHTML = bgPresets.slice(0, 8).map(p => `
        <button class="color-preset w-8 h-8 rounded-lg border-2 border-white shadow-sm hover:scale-110 transition-transform" 
                style="background: ${p.color}" 
                data-color="${p.color}" 
                data-type="bg"
                title="${p.name}"></button>
    `).join('');

    // Primary color presets
    const primaryPresetsContainer = document.getElementById('primary-color-presets');
    const primaryHistory = getColorHistory('primary_color_history');
    let primaryPresets = [...DEFAULT_PRIMARY_COLORS];

    primaryHistory.forEach(c => {
        if (!primaryPresets.find(p => p.color === c)) {
            primaryPresets.unshift({ color: c, name: '历史' });
        }
    });

    primaryPresetsContainer.innerHTML = primaryPresets.slice(0, 8).map(p => `
        <button class="color-preset w-8 h-8 rounded-lg border-2 border-white shadow-sm hover:scale-110 transition-transform" 
                style="background: ${p.color}" 
                data-color="${p.color}" 
                data-type="primary"
                title="${p.name}"></button>
    `).join('');
}

function renderSocialsEditor() {
    const container = document.getElementById('socials-editor');
    container.innerHTML = appData.socials.map((social, index) => `
        <div class="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200" data-id="${social.id}">
            <select class="social-platform flex-shrink-0 bg-white text-gray-800 text-sm p-1 rounded border border-gray-300" data-index="${index}">
                ${['instagram', 'linkedin', 'twitter', 'email', 'github', 'youtube', 'web', 'medium', 'wechat'].map(p =>
        `<option value="${p}" ${p === social.platform ? 'selected' : ''}>${p}</option>`
    ).join('')}
            </select>
            <input type="text" class="social-url flex-1 bg-white text-gray-800 border border-gray-300 rounded p-1.5 text-xs" value="${social.url}" placeholder="URL" data-index="${index}">
            <input type="color" class="social-color w-8 h-8 rounded cursor-pointer" value="${social.color}" data-index="${index}">
            <button class="delete-social p-1 text-red-500 hover:text-red-600" data-index="${index}">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
        </div>
    `).join('');
}

function renderProjectsEditor() {
    const container = document.getElementById('projects-editor');
    container.innerHTML = appData.projects.map((project, index) => `
        <div class="p-3 bg-white rounded-lg border border-gray-200 space-y-2" data-id="${project.id}">
            <input type="text" class="project-title w-full bg-white text-gray-800 border border-gray-300 rounded p-2 text-sm" value="${project.title}" placeholder="项目名称" data-index="${index}">
            <input type="text" class="project-link w-full bg-white text-gray-800 border border-gray-300 rounded p-2 text-sm" value="${project.link || ''}" placeholder="项目链接" data-index="${index}">
            <div class="flex items-center gap-2">
                <img src="${project.image}" class="w-12 h-12 rounded object-cover">
                <input type="file" class="project-image flex-1 text-xs" accept="image/*" data-index="${index}">
                <button class="delete-project p-1.5 text-red-500 hover:text-red-600 rounded hover:bg-red-50" data-index="${index}">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
            </div>
        </div>
    `).join('');
}

// ============================================
// Data Update Functions
// ============================================

function updateProfileFromForm() {
    appData.profile.name = document.getElementById('edit-name').value;
    appData.profile.title = document.getElementById('edit-title').value;
    appData.profile.contactText = document.getElementById('edit-contact-text').value;
    appData.profile.contactUrl = document.getElementById('edit-contact-url').value;
}

function updateSocialsFromForm() {
    document.querySelectorAll('.social-platform').forEach((select, index) => {
        if (appData.socials[index]) appData.socials[index].platform = select.value;
    });
    document.querySelectorAll('.social-url').forEach((input, index) => {
        if (appData.socials[index]) appData.socials[index].url = input.value;
    });
    document.querySelectorAll('.social-color').forEach((input, index) => {
        if (appData.socials[index]) appData.socials[index].color = input.value;
    });
}

function updateProjectsFromForm() {
    document.querySelectorAll('.project-title').forEach((input, index) => {
        if (appData.projects[index]) appData.projects[index].title = input.value;
    });
    document.querySelectorAll('.project-link').forEach((input, index) => {
        if (appData.projects[index]) appData.projects[index].link = input.value;
    });
}

function addSocial() {
    appData.socials.push({
        id: generateId(),
        platform: 'web',
        url: '#',
        color: '#333333'
    });
    renderSocialsEditor();
}

function deleteSocial(index) {
    appData.socials.splice(index, 1);
    renderSocialsEditor();
}

function addProject() {
    appData.projects.push({
        id: generateId(),
        title: 'New Project',
        image: 'https://via.placeholder.com/300',
        link: '#'
    });
    renderProjectsEditor();
}

function deleteProject(index) {
    appData.projects.splice(index, 1);
    renderProjectsEditor();
}

// ============================================
// GitHub API Integration
// ============================================

async function getFileSha(path) {
    try {
        const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${path}?ref=${GITHUB_BRANCH}&_=${Date.now()}`, {
            headers: {
                'Authorization': `token ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache'
            },
            cache: 'no-store'
        });
        if (response.ok) {
            const data = await response.json();
            return data.sha;
        }
        return null;
    } catch (error) {
        console.error('Failed to get SHA:', error);
        return null;
    }
}

async function uploadToGitHub(path, content, message) {
    // Always get fresh SHA
    const sha = await getFileSha(path);

    if (!sha) {
        console.warn('Could not get SHA, file may not exist yet');
    }

    const body = {
        message: message,
        content: btoa(unescape(encodeURIComponent(content))),
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
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
    }

    return await response.json();
}

async function uploadImageToGitHub(file, fileName) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async () => {
            try {
                const base64Content = reader.result.split(',')[1];
                const path = `images/${fileName}`;
                const sha = await getFileSha(path);

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
                    throw new Error('Image upload failed');
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

async function saveToGitHub() {
    if (!isTokenVerified || !githubToken) {
        showToast('请先验证 GitHub Token');
        return;
    }

    // Update data from forms
    updateProfileFromForm();
    updateSocialsFromForm();
    updateProjectsFromForm();

    const saveBtn = document.getElementById('save-btn');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> 保存中...';

    try {
        const jsonContent = JSON.stringify(appData, null, 2);
        await uploadToGitHub('data.json', jsonContent, 'Update data.json via CMS');

        showToast('保存成功！');
        renderPage();
    } catch (error) {
        console.error('Save failed:', error);
        showToast('保存失败: ' + error.message);
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg> 保存到 GitHub';
    }
}

async function changePassword() {
    const newPassword = document.getElementById('new-password').value;
    if (!newPassword || newPassword.length < 4) {
        showToast('密码至少需要 4 位');
        return;
    }

    appData.admin.passwordHash = await sha256(newPassword);
    document.getElementById('new-password').value = '';
    showToast('密码已更新，请保存到 GitHub');
}

// ============================================
// Event Listeners
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    checkAdminAccess();
    setupSecretTrigger();

    // Admin Toggle
    document.getElementById('admin-toggle').addEventListener('click', showLoginModal);

    // Login Modal
    document.getElementById('login-submit').addEventListener('click', attemptLogin);
    document.getElementById('login-cancel').addEventListener('click', hideLoginModal);
    document.getElementById('login-password').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') attemptLogin();
    });

    // Admin Panel
    document.getElementById('close-admin').addEventListener('click', closeAdminPanel);
    document.getElementById('admin-backdrop').addEventListener('click', closeAdminPanel);

    // Verify Token
    document.getElementById('verify-token-btn').addEventListener('click', verifyToken);

    // Theme buttons
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            appData.theme.style = btn.dataset.style;
            // Set default bg for theme
            if (btn.dataset.style === 'glass' && appData.theme.bgColor === '#F5EFEA') {
                appData.theme.bgColor = '#667eea';
                document.getElementById('bg-color').value = '#667eea';
                document.getElementById('bg-color-hex').textContent = '#667eea';
            } else if (btn.dataset.style === 'default' && appData.theme.bgColor === '#667eea') {
                appData.theme.bgColor = '#F5EFEA';
                document.getElementById('bg-color').value = '#F5EFEA';
                document.getElementById('bg-color-hex').textContent = '#F5EFEA';
            }
            applyTheme();
            populateEditors();
        });
    });

    // Background color
    document.getElementById('bg-color').addEventListener('input', (e) => {
        appData.theme.bgColor = e.target.value;
        document.getElementById('bg-color-hex').textContent = e.target.value;
        saveColorToHistory('bg_color_history', e.target.value);
        applyTheme();
    });

    // Primary color
    document.getElementById('primary-color').addEventListener('input', (e) => {
        appData.theme.primaryColor = e.target.value;
        document.getElementById('primary-color-hex').textContent = e.target.value;
        saveColorToHistory('primary_color_history', e.target.value);
        applyTheme();
    });

    // Color presets (event delegation)
    document.addEventListener('click', (e) => {
        const preset = e.target.closest('.color-preset');
        if (preset) {
            const color = preset.dataset.color;
            const type = preset.dataset.type;
            if (type === 'bg') {
                appData.theme.bgColor = color;
                document.getElementById('bg-color').value = color;
                document.getElementById('bg-color-hex').textContent = color;
            } else {
                appData.theme.primaryColor = color;
                document.getElementById('primary-color').value = color;
                document.getElementById('primary-color-hex').textContent = color;
            }
            applyTheme();
        }
    });

    // Add social
    document.getElementById('add-social-btn').addEventListener('click', addSocial);

    // Add project
    document.getElementById('add-project-btn').addEventListener('click', addProject);
    document.getElementById('add-project-editor-btn').addEventListener('click', addProject);

    // Delete social (event delegation)
    document.getElementById('socials-editor').addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('.delete-social');
        if (deleteBtn) {
            deleteSocial(parseInt(deleteBtn.dataset.index));
        }
    });

    // Delete project (event delegation)
    document.getElementById('projects-editor').addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('.delete-project');
        if (deleteBtn) {
            deleteProject(parseInt(deleteBtn.dataset.index));
        }
    });

    // Avatar upload
    document.getElementById('avatar-upload-btn').addEventListener('click', () => {
        document.getElementById('avatar-input').click();
    });
    document.getElementById('avatar-input').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!githubToken) {
            showToast('请先验证 GitHub Token');
            return;
        }

        showToast('上传头像中...');
        try {
            const fileName = `avatar-${Date.now()}.${file.name.split('.').pop()}`;
            const url = await uploadImageToGitHub(file, fileName);
            appData.profile.avatar = url;
            document.getElementById('avatar').src = url;
            showToast('头像上传成功');
        } catch (error) {
            showToast('头像上传失败: ' + error.message);
        }
    });

    // Project image upload (event delegation)
    document.getElementById('projects-editor').addEventListener('change', async (e) => {
        if (e.target.classList.contains('project-image')) {
            const file = e.target.files[0];
            const index = parseInt(e.target.dataset.index);
            if (!file) return;

            if (!githubToken) {
                showToast('请先验证 GitHub Token');
                return;
            }

            showToast('上传图片中...');
            try {
                const fileName = `project-${Date.now()}.${file.name.split('.').pop()}`;
                const url = await uploadImageToGitHub(file, fileName);
                appData.projects[index].image = url;
                renderProjectsEditor();
                showToast('图片上传成功');
            } catch (error) {
                showToast('图片上传失败: ' + error.message);
            }
        }
    });

    // Save button
    document.getElementById('save-btn').addEventListener('click', saveToGitHub);

    // Change password
    document.getElementById('change-password-btn').addEventListener('click', changePassword);
});
