/**
 * Lightweight CMS - Main Script
 * Features: Data rendering, Admin panel, GitHub API integration, Theme switching, Real-time preview
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

// Default color presets
const DEFAULT_BG_COLORS = [
    { color: '#F5EFEA', name: '默认奶茶' },
    { color: '#ffffff', name: '纯白' },
    { color: '#f3f4f6', name: '浅灰' },
    { color: '#fff1f2', name: '浅粉' },
    { color: '#ecfdf5', name: '薄荷' },
    { color: '#eff6ff', name: '淡蓝' },
];

// Common Icons (FontAwesome)
const COMMON_ICONS = [
    'fas fa-envelope', 'fab fa-github', 'fab fa-twitter', 'fab fa-instagram',
    'fab fa-linkedin', 'fab fa-youtube', 'fab fa-weixin', 'fas fa-globe',
    'fab fa-medium', 'fab fa-tiktok', 'fab fa-discord', 'fab fa-telegram',
    'fab fa-facebook', 'fab fa-whatsapp', 'fab fa-bilibili', 'fab fa-weibo',
    'fas fa-link', 'fas fa-code', 'fas fa-pen', 'fas fa-camera',
    'fas fa-music', 'fas fa-gamepad', 'fas fa-book', 'fas fa-coffee'
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
    return url && url.trim() !== '' && url !== '#';
}

// ============================================
// Data Loading & Migration
// ============================================

async function loadData() {
    try {
        const response = await fetch('data.json?t=' + Date.now());
        appData = await response.json();
        migrateData(); // Ensure data structure is up to date

        renderPage();
        applyTheme();

        // Initialize Admin UI if logged in
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
                // Map old platform names to FontAwesome
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
    renderSocials();
    renderProjects();
    renderFooter();

    // Re-initialize Sortable if in admin mode
    if (isAdminMode) {
        initSortable();
    }
}

function renderProfile() {
    document.getElementById('avatar').src = appData.profile.avatar;
    document.getElementById('profile-name').textContent = appData.profile.name;
    document.getElementById('profile-title').textContent = appData.profile.title;
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
        return `
        <div class="social-item relative group" data-id="${social.id}">
            <a ${hasLink ? `href="${social.url}"` : ''} 
               ${hasLink && social.newTab ? 'target="_blank" rel="noopener noreferrer"' : ''} 
               class="block h-full ${!hasLink ? 'cursor-default' : ''}">
                <div class="neu-button w-full aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 p-2 transition-transform ${hasLink ? 'hover:scale-105' : 'opacity-60'}" style="color: ${social.color}">
                    <i class="${social.icon} text-2xl"></i>
                    ${social.label ? `<span class="text-[10px] font-medium text-text-sub truncate w-full text-center">${social.label}</span>` : ''}
                </div>
            </a>
            ${isAdminMode ? `
            <div class="delete-btn-overlay" onclick="deleteSocial('${social.id}')">
                <i class="fas fa-times"></i>
            </div>
            ` : ''}
        </div>
    `}).join('');
}

function renderProjects() {
    const projectsGrid = document.getElementById('projects-grid');
    projectsGrid.innerHTML = appData.projects.map(project => {
        const hasLink = isValidLink(project.link);

        // Calculate grid classes based on width
        let gridClass = 'col-span-1';
        let heightClass = 'aspect-square';

        if (project.width === '2x1') {
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

        return `
        <div class="project-item relative group ${gridClass}" data-id="${project.id}">
            <a ${hasLink ? `href="${project.link}"` : ''} 
               ${hasLink && project.newTab ? 'target="_blank" rel="noopener noreferrer"' : ''} 
               class="block h-full ${!hasLink ? 'cursor-default' : ''}">
                <div class="neu-card p-3 h-full flex flex-col transition-transform ${hasLink ? 'hover:-translate-y-1' : ''}">
                    <div class="w-full ${heightClass} rounded-xl overflow-hidden mb-2 bg-gray-200 relative">
                        <img src="${project.image}" alt="${project.title}" class="w-full h-full object-cover" loading="lazy">
                    </div>
                    <h3 class="font-semibold text-xs text-text-main leading-tight mt-auto truncate">${project.title}</h3>
                </div>
            </a>
            ${isAdminMode ? `
            <div class="delete-btn-overlay" onclick="deleteProject('${project.id}')">
                <i class="fas fa-times"></i>
            </div>
            ` : ''}
        </div>
    `}).join('');
}

function renderFooter() {
    document.getElementById('copyright').textContent = `© ${new Date().getFullYear()} ${appData.profile.name}`;
}

function applyTheme() {
    if (!appData) return;

    const { style, bgColor, font, fontSize } = appData.theme;

    // Style & Background
    document.body.classList.remove('theme-default', 'theme-glass');
    document.body.classList.add(`theme-${style}`);

    if (style === 'glass') {
        document.body.style.background = `linear-gradient(135deg, ${bgColor} 0%, ${adjustColor(bgColor, -40)} 100%)`;
    } else {
        // Default theme enforces light mode
        document.body.style.background = bgColor;
    }

    // Font Family
    document.body.classList.remove('font-sans', 'font-serif');
    document.body.classList.add(font === 'serif' ? 'font-serif' : 'font-sans');

    // Font Size (apply to root for rem scaling or body)
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
        document.getElementById('admin-toggle').classList.remove('hidden');
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
    // Socials Sortable
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

    // Projects Sortable
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
    if (localStorage.getItem('admin_logged_in') === 'true') {
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
        showToast('登录成功', 'success');
        document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));
        initSortable();
    } else {
        document.getElementById('login-error').classList.remove('hidden');
    }
}

function openAdminPanel() {
    document.getElementById('admin-panel').classList.remove('hidden');

    // Load Token
    const savedToken = localStorage.getItem('github_token');
    if (savedToken) {
        githubToken = savedToken;
        document.getElementById('github-token').value = savedToken;
    }
    updateTokenUI();

    // Populate Editors
    populateEditors();

    // Default to first tab
    switchTab('profile');
}

function closeAdminPanel() {
    document.getElementById('admin-panel').classList.add('hidden');
}

function switchTab(tabId) {
    // Update Sidebar Buttons
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        if (btn.dataset.tab === tabId) {
            btn.classList.add('bg-white', 'text-blue-600', 'shadow-sm');
            btn.classList.remove('text-gray-600', 'hover:bg-white/80');
        } else {
            btn.classList.remove('bg-white', 'text-blue-600', 'shadow-sm');
            btn.classList.add('text-gray-600', 'hover:bg-white/80');
        }
    });

    // Show Content
    document.querySelectorAll('.admin-tab-content').forEach(content => {
        if (content.id === `tab-${tabId}`) {
            content.classList.remove('hidden');
        } else {
            content.classList.add('hidden');
        }
    });
}

function populateEditors() {
    // Profile
    document.getElementById('edit-name').value = appData.profile.name;
    document.getElementById('edit-title').value = appData.profile.title;
    document.getElementById('edit-contact-text').value = appData.profile.contactText;
    document.getElementById('edit-contact-url').value = appData.profile.contactUrl;

    // Theme
    document.querySelectorAll('.theme-btn').forEach(btn => {
        const isActive = btn.dataset.style === appData.theme.style;
        btn.classList.toggle('ring-2', isActive);
        btn.classList.toggle('ring-blue-500', isActive);
    });

    document.getElementById('bg-color').value = appData.theme.bgColor;
    document.getElementById('bg-color-hex').textContent = appData.theme.bgColor;
    renderColorPresets();

    // Font
    document.querySelectorAll('.font-btn').forEach(btn => {
        const isActive = btn.dataset.font === appData.theme.font;
        btn.classList.toggle('ring-2', isActive);
        btn.classList.toggle('ring-blue-500', isActive);
    });
    document.getElementById('font-size-slider').value = appData.theme.fontSize;

    // Lists
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
                        onclick="openIconPicker(${index})">
                    <i class="${social.icon}"></i>
                </button>
                <input type="color" class="social-color-input w-8 h-8 rounded cursor-pointer" value="${social.color}" onchange="updateSocial(${index}, 'color', this.value)">
                <div class="flex-1"></div>
                <button class="text-red-500 hover:text-red-600 p-1" onclick="deleteSocial('${social.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <input type="text" class="w-full bg-white text-gray-800 border border-gray-300 rounded p-1.5 text-xs" 
                   value="${social.label || ''}" placeholder="显示文字" 
                   oninput="updateSocial(${index}, 'label', this.value)">
            <input type="text" class="w-full bg-white text-gray-800 border border-gray-300 rounded p-1.5 text-xs" 
                   value="${social.url}" placeholder="URL" 
                   oninput="updateSocial(${index}, 'url', this.value)">
            <label class="flex items-center gap-2 text-xs text-gray-600">
                <input type="checkbox" ${social.newTab ? 'checked' : ''} onchange="updateSocial(${index}, 'newTab', this.checked)">
                新标签页打开
            </label>
        </div>
    `).join('');
}

function renderProjectsEditor() {
    const container = document.getElementById('projects-editor');
    container.innerHTML = appData.projects.map((project, index) => `
        <div class="p-3 bg-white rounded-lg border border-gray-200 space-y-2" data-index="${index}">
            <input type="text" class="w-full bg-white text-gray-800 border border-gray-300 rounded p-2 text-sm font-bold" 
                   value="${project.title}" placeholder="项目名称"
                   oninput="updateProject(${index}, 'title', this.value)">
            
            <div class="flex gap-2">
                <select class="bg-white border border-gray-300 rounded p-1 text-xs flex-1"
                        onchange="updateProject(${index}, 'width', this.value)">
                    <option value="1x1" ${project.width === '1x1' ? 'selected' : ''}>1x1 (小方块)</option>
                    <option value="2x1" ${project.width === '2x1' ? 'selected' : ''}>2x1 (宽方块)</option>
                    <option value="2x2" ${project.width === '2x2' ? 'selected' : ''}>2x2 (大方块)</option>
                    <option value="3x1" ${project.width === '3x1' ? 'selected' : ''}>3x1 (超宽)</option>
                    <option value="4x1" ${project.width === '4x1' ? 'selected' : ''}>4x1 (全宽)</option>
                </select>
            </div>

            <input type="text" class="w-full bg-white text-gray-800 border border-gray-300 rounded p-2 text-sm" 
                   value="${project.link || ''}" placeholder="项目链接"
                   oninput="updateProject(${index}, 'link', this.value)">
            
            <div class="flex items-center justify-between">
                <label class="flex items-center gap-2 text-xs text-gray-600">
                    <input type="checkbox" ${project.newTab ? 'checked' : ''} onchange="updateProject(${index}, 'newTab', this.checked)">
                    新标签页打开
                </label>
            </div>

            <div class="flex items-center gap-2">
                <img src="${project.image}" class="w-10 h-10 rounded object-cover bg-gray-100">
                <input type="file" class="text-xs w-full" accept="image/*" onchange="uploadProjectImage(this, ${index})">
                <button class="text-red-500 hover:text-red-600 p-2" onclick="deleteProject('${project.id}')">
                    <i class="fas fa-trash"></i>
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
    // Don't re-render editor to avoid losing focus, except for color which is fine
}

function updateProject(index, field, value) {
    appData.projects[index][field] = value;
    renderProjects();
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
    appData.projects.push({
        id: generateId(),
        title: 'New Project',
        image: 'https://via.placeholder.com/300',
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

let currentIconIndex = null;

function openIconPicker(index) {
    currentIconIndex = index;
    const modal = document.getElementById('icon-picker-modal');
    modal.classList.remove('hidden');
    renderIconGrid(COMMON_ICONS);
}

function renderIconGrid(icons) {
    const grid = document.getElementById('icon-grid');
    grid.innerHTML = icons.map(icon => `
        <div class="icon-item ${appData.socials[currentIconIndex].icon === icon ? 'selected' : ''}" 
             onclick="selectIcon('${icon}')">
            <i class="${icon} text-xl"></i>
        </div>
    `).join('');
}

function selectIcon(icon) {
    if (currentIconIndex !== null) {
        appData.socials[currentIconIndex].icon = icon;
        renderSocials();
        renderSocialsEditor();
    }
    document.getElementById('icon-picker-modal').classList.add('hidden');
}

// ============================================
// GitHub API Integration (Preserved)
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
            showToast('Token 验证成功！', 'success');
        } else {
            throw new Error('Token 无效或权限不足');
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

async function uploadToGitHub(path, content, message) {
    let sha = null;
    try {
        sha = await getFileSha(path);
    } catch (error) {
        console.warn('Failed to get SHA, assuming new file or error:', error);
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

async function saveToGitHub() {
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
        await uploadToGitHub('data.json', jsonContent, 'Update data.json via CMS');

        showToast('保存成功！', 'success');
        renderPage();
    } catch (error) {
        console.error('Save failed:', error);
        showToast('保存失败: ' + error.message, 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = originalText;
    }
}

async function uploadProjectImage(input, index) {
    const file = input.files[0];
    if (!file) return;

    if (!isTokenVerified || !githubToken) {
        showToast('请先验证 GitHub Token', 'error');
        return;
    }

    showToast('上传图片中...', 'info');
    try {
        const fileName = `project-${Date.now()}.${file.name.split('.').pop()}`;
        const url = await uploadImageToGitHub(file, fileName);
        appData.projects[index].image = url;
        renderProjects();
        renderProjectsEditor(); // Refresh to show new image
        showToast('图片上传成功', 'success');
    } catch (error) {
        showToast('图片上传失败: ' + error.message, 'error');
    }
}

// ============================================
// Sync & Download
// ============================================

async function syncFromGitHub() {
    if (!isTokenVerified || !githubToken) {
        showToast('请先验证 GitHub Token', 'error');
        return;
    }

    if (!confirm('确定要从 GitHub 拉取最新数据吗？\n这将覆盖当前未保存的修改。')) {
        return;
    }

    const btn = document.getElementById('sync-github-btn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 拉取中...';
    btn.disabled = true;

    try {
        // Fetch raw content from GitHub API to ensure freshness
        const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/data.json?ref=${GITHUB_BRANCH}&_t=${Date.now()}`;
        const response = await fetch(url, {
            headers: {
                'Authorization': `token ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!response.ok) throw new Error('Failed to fetch data from GitHub');

        const data = await response.json();
        const content = decodeURIComponent(escape(atob(data.content)));
        appData = JSON.parse(content);

        migrateData();
        renderPage();
        applyTheme();
        populateEditors();

        showToast('数据已从 GitHub 同步', 'success');
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
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

// ============================================
// Event Listeners
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    loadData();

    // Admin Toggle
    document.getElementById('admin-toggle').addEventListener('click', showLoginModal);
    document.getElementById('footer-admin-link').addEventListener('click', showLoginModal);
    document.getElementById('close-admin').addEventListener('click', closeAdminPanel);
    document.getElementById('admin-backdrop').addEventListener('click', closeAdminPanel);

    // Tab Switching
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            switchTab(btn.dataset.tab);
        });
    });

    // Login
    document.getElementById('login-submit').addEventListener('click', attemptLogin);
    document.getElementById('login-cancel').addEventListener('click', hideLoginModal);
    document.getElementById('login-password').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') attemptLogin();
    });

    // Token
    document.getElementById('verify-token-btn').addEventListener('click', verifyToken);
    document.getElementById('reset-token-btn').addEventListener('click', resetToken);

    // Sync & Download
    document.getElementById('sync-github-btn').addEventListener('click', syncFromGitHub);
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
                appData.theme.bgColor = '#667eea'; // Auto switch to glass color
            } else if (btn.dataset.style === 'default') {
                // Force light mode for default
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
    document.getElementById('add-social-btn').addEventListener('click', addSocial);
    document.getElementById('add-project-btn').addEventListener('click', addProject);
    document.getElementById('add-project-editor-btn').addEventListener('click', addProject);

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

    // Save Button
    document.getElementById('save-btn').addEventListener('click', saveToGitHub);

    // Password Change
    document.getElementById('change-password-btn').addEventListener('click', async () => {
        const newPassword = document.getElementById('new-password').value;
        if (!newPassword || newPassword.length < 4) {
            showToast('密码至少需要 4 位', 'error');
            return;
        }
        appData.admin.passwordHash = await sha256(newPassword);
        document.getElementById('new-password').value = '';
        showToast('密码已更新，请保存到 GitHub', 'success');
    });

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
