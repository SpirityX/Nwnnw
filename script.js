// =============================================
// FASODOC - APPLICATION JAVASCRIPT
// Firebase RealTime Database + Full Functionality
// =============================================

// ---------- FIREBASE CONFIG ----------
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { 
    getDatabase, 
    ref, 
    onValue, 
    push, 
    set, 
    update, 
    remove,
    query,
    orderByChild,
    equalTo,
    increment 
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyCN06ZZbSnm9BWVpZ14GzB3aWkvsYhlI2s",
    authDomain: "fasodoc-c6171.firebaseapp.com",
    databaseURL: "https://fasodoc-c6171-default-rtdb.firebaseio.com",
    projectId: "fasodoc-c6171",
    storageBucket: "fasodoc-c6171.firebasestorage.app",
    messagingSenderId: "828641018562",
    appId: "1:828641018562:web:a76ca4620ce76d8633b15b"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// ---------- DOM ELEMENTS ----------
const splashScreen = document.getElementById('splashScreen');
const appContainer = document.getElementById('app');
const mainContent = document.getElementById('mainContent');
const themeToggle = document.getElementById('themeToggle');
const bottomNav = document.getElementById('bottomNav');
const toastContainer = document.getElementById('toastContainer');

// ---------- APP STATE ----------
let currentScreen = 'home';
let allDocuments = [];
let favorites = JSON.parse(localStorage.getItem('fasodoc_favorites') || '[]');
let userLevel = localStorage.getItem('fasodoc_level') || '';
let isDarkMode = localStorage.getItem('fasodoc_darkmode') === 'true';
let activeFilters = {
    category: '',
    level: '',
    subject: '',
    year: ''
};

// ---------- CATEGORIES DATA ----------
const categoriesData = [
    { id: 'roman', name: 'Romans', icon: 'ph-book-open-text', cssClass: 'cat-roman', color: '#E67E22', bg: '#FFF0E6' },
    { id: 'epreuve', name: 'Épreuves', icon: 'ph-exam', cssClass: 'cat-epreuve', color: '#2980B9', bg: '#E8F4FD' },
    { id: 'cours', name: 'Cours', icon: 'ph-notebook', cssClass: 'cat-cours', color: '#6C3CE0', bg: '#EDE8FF' },
    { id: 'resume', name: 'Résumés', icon: 'ph-article', cssClass: 'cat-resume', color: '#F39C12', bg: '#FFF8EB' },
    { id: 'exercice', name: 'Exercices', icon: 'ph-pencil-line', cssClass: 'cat-exercice', color: '#00B894', bg: '#E6FAF4' },
    { id: 'corrige', name: 'Corrigés', icon: 'ph-check-circle', cssClass: 'cat-corrige', color: '#E74C3C', bg: '#FDEDEC' }
];

// ---------- INITIALIZATION ----------
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    // Apply saved theme
    if (isDarkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
        updateThemeIcon();
    }
    
    // Load data from Firebase
    loadDocuments();
    
    // Setup event listeners
    setupNavigation();
    setupThemeToggle();
    setupSearchListeners();
    setupFilterListeners();
    setupModalListeners();
    setupSuggestForm();
    setupLevelSelector();
    setupProfileButtons();
    
    // Render categories
    renderHomeCategories();
    renderFullCategories();
    
    // Hide splash after load
    setTimeout(() => {
        splashScreen.classList.add('hidden');
        setTimeout(() => {
            if (splashScreen.parentNode) {
                splashScreen.style.display = 'none';
            }
        }, 400);
    }, 2000);
}

// ---------- FIREBASE DATA LOADING ----------
function loadDocuments() {
    const documentsRef = ref(database, 'documents');
    
    onValue(documentsRef, (snapshot) => {
        const data = snapshot.val();
        allDocuments = [];
        
        if (data) {
            Object.keys(data).forEach(key => {
                const doc = data[key];
                if (doc.status === 'approved' || !doc.status) {
                    allDocuments.push({
                        id: key,
                        ...doc,
                        favorites: doc.favorites || 0,
                        views: doc.views || 0,
                        downloads: doc.downloads || 0
                    });
                }
            });
        }
        
        // Update all views
        renderPopularDocuments();
        renderRecentDocuments();
        renderSearchResults();
        renderFavorites();
    }, (error) => {
        console.error('Erreur Firebase:', error);
        showToast('Erreur de connexion. Mode hors-ligne.', 'error');
        loadMockData();
    });
}

// ---------- MOCK DATA (FALLBACK) ----------
function loadMockData() {
    allDocuments = [
        {
            id: 'mock1',
            title: "L'Étranger - Albert Camus",
            category: 'Roman',
            level: 'Terminale',
            subject: 'Français',
            year: 2024,
            description: "Roman philosophique majeur d'Albert Camus, publié en 1942. L'histoire suit Meursault, un homme détaché qui commet un meurtre absurde sur une plage algérienne. Une œuvre incontournable pour le baccalauréat.",
            link: 'https://drive.google.com/file/d/example1',
            type: 'PDF',
            views: 1250,
            downloads: 340,
            favorites: 89,
            createdAt: Date.now() - 86400000 * 2
        },
        {
            id: 'mock2',
            title: "Mathématiques 3ème - Exercices corrigés",
            category: 'Exercice',
            level: '3ème',
            subject: 'Mathématiques',
            year: 2024,
            description: "Recueil complet d'exercices de mathématiques niveau 3ème avec corrections détaillées. Couvre l'algèbre, la géométrie et les statistiques.",
            link: 'https://drive.google.com/file/d/example2',
            type: 'PDF',
            views: 890,
            downloads: 210,
            favorites: 45,
            createdAt: Date.now() - 86400000 * 5
        },
        {
            id: 'mock3',
            title: "Histoire du Burkina Faso - Cours complet",
            category: 'Cours',
            level: '1ère',
            subject: 'Histoire',
            year: 2024,
            description: "Cours détaillé sur l'histoire du Burkina Faso, de la période précoloniale à nos jours. Inclut des cartes et des frises chronologiques.",
            link: 'https://drive.google.com/file/d/example3',
            type: 'PDF',
            views: 2100,
            downloads: 560,
            favorites: 120,
            createdAt: Date.now() - 86400000 * 1
        },
        {
            id: 'mock4',
            title: "SVT Terminale - Résumé Génétique",
            category: 'Résumé',
            level: 'Terminale',
            subject: 'SVT',
            year: 2024,
            description: "Fiche de révision complète sur la génétique pour le bac. Transmission des caractères, brassage génétique, et exercices types.",
            link: 'https://drive.google.com/file/d/example4',
            type: 'PDF',
            views: 670,
            downloads: 180,
            favorites: 33,
            createdAt: Date.now() - 86400000 * 7
        },
        {
            id: 'mock5',
            title: "Épreuve BAC Maths 2023",
            category: 'Épreuve',
            level: 'Terminale',
            subject: 'Mathématiques',
            year: 2023,
            description: "Sujet complet du baccalauréat mathématiques session 2023 avec barème officiel.",
            link: 'https://drive.google.com/file/d/example5',
            type: 'PDF',
            views: 3400,
            downloads: 1200,
            favorites: 230,
            createdAt: Date.now() - 86400000 * 30
        },
        {
            id: 'mock6',
            title: "Corrigé BAC Physique 2024",
            category: 'Corrigé',
            level: 'Terminale',
            subject: 'Physique',
            year: 2024,
            description: "Correction détaillée du sujet de physique-chimie du BAC 2024. Tous les exercices sont corrigés étape par étape.",
            link: 'https://drive.google.com/file/d/example6',
            type: 'PDF',
            views: 5100,
            downloads: 1800,
            favorites: 310,
            createdAt: Date.now() - 86400000 * 10
        }
    ];
    
    renderPopularDocuments();
    renderRecentDocuments();
    renderSearchResults();
    renderFavorites();
}

// ---------- RENDER CATEGORIES ----------
function renderHomeCategories() {
    const grid = document.getElementById('homeCategoriesGrid');
    grid.innerHTML = categoriesData.map(cat => `
        <div class="category-card ${cat.cssClass}" data-category="${cat.id}" onclick="navigateToCategory('${cat.id}')">
            <div class="category-card-icon">
                <i class="ph ${cat.icon}"></i>
            </div>
            <div class="category-card-name">${cat.name}</div>
            <div class="category-card-count">${getCategoryCount(cat.id)} docs</div>
        </div>
    `).join('');
}

function renderFullCategories() {
    const grid = document.getElementById('categoriesFullGrid');
    grid.innerHTML = categoriesData.map(cat => `
        <div class="category-card ${cat.cssClass}" data-category="${cat.id}" onclick="navigateToCategory('${cat.id}')">
            <div class="category-card-icon">
                <i class="ph ${cat.icon}"></i>
            </div>
            <div class="category-card-name">${cat.name}</div>
            <div class="category-card-count">${getCategoryCount(cat.id)} documents</div>
        </div>
    `).join('');
}

function getCategoryCount(categoryId) {
    const categoryName = categoriesData.find(c => c.id === categoryId)?.name || '';
    return allDocuments.filter(d => d.category === categoryName).length;
}

// ---------- RENDER DOCUMENTS ----------
function renderPopularDocuments() {
    const container = document.getElementById('popularDocuments');
    const popular = [...allDocuments].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);
    container.innerHTML = popular.map(doc => createDocumentCard(doc)).join('');
}

function renderRecentDocuments() {
    const container = document.getElementById('recentDocuments');
    const recent = [...allDocuments].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 5);
    container.innerHTML = recent.map(doc => createDocumentCard(doc)).join('');
}

function renderSearchResults() {
    const container = document.getElementById('searchResults');
    const empty = document.getElementById('searchEmpty');
    const searchInput = document.getElementById('searchPageInput');
    const query = searchInput?.value?.toLowerCase() || '';
    
    let filtered = allDocuments;
    
    // Text search
    if (query) {
        filtered = filtered.filter(doc => 
            doc.title?.toLowerCase().includes(query) ||
            doc.description?.toLowerCase().includes(query) ||
            doc.subject?.toLowerCase().includes(query)
        );
    }
    
    // Active filters
    if (activeFilters.category) {
        filtered = filtered.filter(doc => doc.category === activeFilters.category);
    }
    if (activeFilters.level) {
        filtered = filtered.filter(doc => doc.level === activeFilters.level);
    }
    if (activeFilters.subject) {
        filtered = filtered.filter(doc => doc.subject?.toLowerCase().includes(activeFilters.subject.toLowerCase()));
    }
    if (activeFilters.year) {
        filtered = filtered.filter(doc => doc.year?.toString() === activeFilters.year);
    }
    
    if (filtered.length === 0) {
        empty.style.display = 'block';
        container.innerHTML = '';
    } else {
        empty.style.display = 'none';
        container.innerHTML = filtered.map(doc => createDocumentCard(doc)).join('');
    }
}

function renderFavorites() {
    const container = document.getElementById('favoritesList');
    const empty = document.getElementById('favoritesEmpty');
    const favDocs = allDocuments.filter(doc => favorites.includes(doc.id));
    
    if (favDocs.length === 0) {
        empty.style.display = 'block';
        container.innerHTML = '';
    } else {
        empty.style.display = 'none';
        container.innerHTML = favDocs.map(doc => createDocumentCard(doc)).join('');
    }
}

function createDocumentCard(doc) {
    const isFav = favorites.includes(doc.id);
    const categoryClass = categoriesData.find(c => c.name === doc.category)?.cssClass || '';
    const categoryIcon = categoriesData.find(c => c.name === doc.category)?.icon || 'ph-file';
    
    return `
        <div class="document-card" data-id="${doc.id}" onclick="openDocumentDetail('${doc.id}')">
            <div class="document-card-header">
                <div class="document-card-title">${doc.title || 'Sans titre'}</div>
                <button class="document-card-favorite ${isFav ? 'active' : ''}" 
                    onclick="event.stopPropagation(); toggleFavorite('${doc.id}')"
                    aria-label="${isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}">
                    <i class="ph ${isFav ? 'ph-heart-fill' : 'ph-heart'}"></i>
                </button>
            </div>
            <div class="document-card-meta">
                <span class="document-badge category">
                    <i class="ph ${categoryIcon}"></i> ${doc.category || 'N/A'}
                </span>
                <span class="document-badge level">${doc.level || 'N/A'}</span>
                ${doc.subject ? `<span class="document-badge">${doc.subject}</span>` : ''}
            </div>
            <div class="document-card-actions" onclick="event.stopPropagation();">
                <a href="${doc.link || '#'}" target="_blank" rel="noopener noreferrer" class="btn-sm btn-sm-primary">
                    <i class="ph ph-arrow-square-out"></i> Ouvrir
                </a>
                <button class="btn-sm btn-sm-outline" onclick="shareDocument('${doc.id}')">
                    <i class="ph ph-share-network"></i>
                </button>
            </div>
        </div>
    `;
}

// ---------- FAVORITES ----------
function toggleFavorite(docId) {
    const index = favorites.indexOf(docId);
    if (index > -1) {
        favorites.splice(index, 1);
        showToast('Retiré des favoris', 'success');
    } else {
        favorites.push(docId);
        showToast('Ajouté aux favoris ❤️', 'success');
    }
    localStorage.setItem('fasodoc_favorites', JSON.stringify(favorites));
    
    // Refresh all views
    renderPopularDocuments();
    renderRecentDocuments();
    renderSearchResults();
    renderFavorites();
}

// ---------- DOCUMENT DETAIL MODAL ----------
function openDocumentDetail(docId) {
    const doc = allDocuments.find(d => d.id === docId);
    if (!doc) return;
    
    const modal = document.getElementById('documentModal');
    const body = document.getElementById('modalBody');
    const isFav = favorites.includes(docId);
    
    // Increment views in Firebase
    const docRef = ref(database, `documents/${docId}`);
    update(docRef, {
        views: increment(1)
    }).catch(() => {});
    
    body.innerHTML = `
        <h2 class="document-detail-title">${doc.title || 'Sans titre'}</h2>
        <div class="document-detail-meta">
            <span class="document-badge category">${doc.category || 'N/A'}</span>
            <span class="document-badge level">${doc.level || 'N/A'}</span>
            ${doc.subject ? `<span class="document-badge">${doc.subject}</span>` : ''}
            ${doc.year ? `<span class="document-badge">${doc.year}</span>` : ''}
        </div>
        <p class="document-detail-description">${doc.description || 'Aucune description disponible.'}</p>
        
        <div class="document-detail-stats">
            <div class="document-stat">
                <i class="ph ph-eye"></i>
                <span>${formatNumber(doc.views || 0)} vues</span>
            </div>
            <div class="document-stat">
                <i class="ph ph-download"></i>
                <span>${formatNumber(doc.downloads || 0)} téléchargements</span>
            </div>
            <div class="document-stat">
                <i class="ph ph-heart"></i>
                <span>${formatNumber(doc.favorites || 0)} favoris</span>
            </div>
        </div>
        
        <div class="document-detail-actions">
            <a href="${doc.link || '#'}" target="_blank" rel="noopener noreferrer" class="btn-block btn-primary" id="btnReadOnline">
                <i class="ph ph-book-open"></i> Lire en ligne
            </a>
            <a href="${doc.link || '#'}" target="_blank" rel="noopener noreferrer" class="btn-block btn-secondary" id="btnDownload">
                <i class="ph ph-download"></i> Télécharger
            </a>
            <button class="btn-block btn-outline" onclick="toggleFavoriteFromModal('${docId}')">
                <i class="ph ${isFav ? 'ph-heart-fill' : 'ph-heart'}"></i>
                ${isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            </button>
            <button class="btn-block btn-outline" onclick="shareDocument('${docId}')">
                <i class="ph ph-share-network"></i> Partager
            </button>
        </div>
        
        <div class="comments-section">
            <h3 class="comments-title">Commentaires</h3>
            <div class="comments-list" id="commentsList">
                <div class="skeleton skeleton-text"></div>
                <div class="skeleton skeleton-text short"></div>
            </div>
            <div class="comment-form">
                <input type="text" class="comment-input" id="commentInput" placeholder="Ajouter un commentaire...">
                <button class="btn-comment" onclick="addComment('${docId}')">
                    <i class="ph ph-paper-plane-tilt"></i>
                </button>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Load comments
    loadComments(docId);
    
    // Track download clicks
    document.getElementById('btnDownload')?.addEventListener('click', () => {
        update(docRef, { downloads: increment(1) }).catch(() => {});
    });
}

// ---------- COMMENTS ----------
function loadComments(docId) {
    const commentsRef = ref(database, `comments/${docId}`);
    const commentsList = document.getElementById('commentsList');
    
    if (!commentsList) return;
    
    onValue(commentsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const comments = Object.values(data).sort((a, b) => b.timestamp - a.timestamp);
            commentsList.innerHTML = comments.map(c => `
                <div class="comment-item">
                    <div class="comment-author">${c.author || 'Anonyme'}</div>
                    <div class="comment-text">${c.text}</div>
                    <div class="comment-date">${formatDate(c.timestamp)}</div>
                </div>
            `).join('');
        } else {
            commentsList.innerHTML = '<p style="color: var(--color-text-tertiary); font-size: 0.85rem; text-align: center;">Aucun commentaire. Soyez le premier !</p>';
        }
    });
}

function addComment(docId) {
    const input = document.getElementById('commentInput');
    const text = input?.value?.trim();
    if (!text) return;
    
    const commentsRef = ref(database, `comments/${docId}`);
    push(commentsRef, {
        author: 'Utilisateur',
        text: text,
        timestamp: Date.now()
    }).then(() => {
        input.value = '';
        showToast('Commentaire ajouté !', 'success');
    }).catch(() => {
        showToast('Erreur lors de l\'ajout', 'error');
    });
}

// ---------- SHARE ----------
function shareDocument(docId) {
    const doc = allDocuments.find(d => d.id === docId);
    if (!doc) return;
    
    const shareText = `📚 ${doc.title} - FasoDoc\n${doc.description?.substring(0, 100) || ''}\n👉 ${doc.link || ''}\n\nTéléchargez FasoDoc !`;
    
    if (navigator.share) {
        navigator.share({
            title: doc.title,
            text: shareText,
            url: doc.link
        }).catch(() => {});
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(shareText).then(() => {
            showToast('Lien copié ! Partagez-le sur WhatsApp', 'success');
        }).catch(() => {
            // Open WhatsApp share
            window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
        });
    }
}

// ---------- NAVIGATION ----------
function setupNavigation() {
    // Bottom nav
    bottomNav.addEventListener('click', (e) => {
        const navItem = e.target.closest('.nav-item');
        if (!navItem) return;
        
        const screen = navItem.dataset.screen;
        navigateTo(screen);
    });
    
    // Section links
    document.addEventListener('click', (e) => {
        const link = e.target.closest('[data-nav]');
        if (!link) return;
        
        const screen = link.dataset.nav;
        navigateTo(screen);
    });
}

function navigateTo(screen) {
    // Update screens
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const targetScreen = document.getElementById(`screen-${screen}`);
    if (targetScreen) {
        targetScreen.classList.add('active');
    }
    
    // Update nav
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const navItem = document.querySelector(`[data-screen="${screen}"]`);
    if (navItem) {
        navItem.classList.add('active');
    }
    
    // Scroll to top
    mainContent.scrollTop = 0;
    
    // Update state
    currentScreen = screen;
    
    // Refresh views
    if (screen === 'favorites') renderFavorites();
    if (screen === 'categories') renderFullCategories();
    if (screen === 'home') {
        renderHomeCategories();
        renderPopularDocuments();
        renderRecentDocuments();
    }
}

function navigateToCategory(categoryId) {
    const category = categoriesData.find(c => c.id === categoryId);
    if (!category) return;
    
    activeFilters = { category: category.name, level: '', subject: '', year: '' };
    navigateTo('search');
    
    // Update search filters display
    updateFilterDisplay();
    renderSearchResults();
    
    // Set search input value
    document.getElementById('searchPageInput').value = '';
    document.getElementById('searchPageInput').focus();
}

// ---------- SEARCH ----------
function setupSearchListeners() {
    const homeSearch = document.getElementById('homeSearchInput');
    const searchPageInput = document.getElementById('searchPageInput');
    const homeSearchBar = document.getElementById('homeSearchBar');
    
    // Home search bar click navigates to search
    homeSearchBar?.addEventListener('click', () => {
        navigateTo('search');
        setTimeout(() => {
            document.getElementById('searchPageInput')?.focus();
        }, 300);
    });
    
    // Search page input
    searchPageInput?.addEventListener('input', debounce(() => {
        renderSearchResults();
    }, 300));
}

function setupFilterListeners() {
    const filtersContainer = document.getElementById('filtersContainer');
    
    filtersContainer?.addEventListener('click', (e) => {
        const chip = e.target.closest('.filter-chip');
        if (!chip) return;
        
        const filterType = chip.dataset.filter;
        
        // Toggle active class
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        
        // Show appropriate filter options
        showFilterOptions(filterType);
    });
}

function showFilterOptions(filterType) {
    if (filterType === 'all') {
        activeFilters = { category: '', level: '', subject: '', year: '' };
        updateFilterDisplay();
        renderSearchResults();
        return;
    }
    
    const options = getFilterOptions(filterType);
    if (options.length === 0) return;
    
    // Simple prompt-based filter (mobile-friendly)
    const selected = prompt(`Filtrer par ${filterType}:\n\n${options.join('\n')}\n\nTapez votre choix ou laissez vide pour annuler:`);
    
    if (selected && options.includes(selected)) {
        activeFilters[filterType] = selected;
    } else if (selected === '') {
        activeFilters[filterType] = '';
    }
    
    updateFilterDisplay();
    renderSearchResults();
}

function getFilterOptions(filterType) {
    switch(filterType) {
        case 'category':
            return [...new Set(allDocuments.map(d => d.category).filter(Boolean))];
        case 'level':
            return ['6ème', '5ème', '4ème', '3ème', '2nde', '1ère', 'Terminale'];
        case 'subject':
            return [...new Set(allDocuments.map(d => d.subject).filter(Boolean))];
        case 'year':
            return [...new Set(allDocuments.map(d => d.year?.toString()).filter(Boolean))].sort().reverse();
        default:
            return [];
    }
}

function updateFilterDisplay() {
    const container = document.getElementById('activeFilters');
    const tags = [];
    
    Object.entries(activeFilters).forEach(([key, value]) => {
        if (value) {
            tags.push(`
                <span class="active-filter-tag">
                    ${key}: ${value}
                    <i class="ph ph-x" onclick="removeFilter('${key}')"></i>
                </span>
            `);
        }
    });
    
    if (tags.length > 0) {
        container.innerHTML = tags.join('');
        container.style.display = 'flex';
    } else {
        container.style.display = 'none';
    }
}

function removeFilter(key) {
    activeFilters[key] = '';
    updateFilterDisplay();
    renderSearchResults();
    
    // Reset filter chips
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    document.querySelector('[data-filter="all"]')?.classList.add('active');
}

// ---------- THEME ----------
function setupThemeToggle() {
    themeToggle.addEventListener('click', () => {
        isDarkMode = !isDarkMode;
        
        if (isDarkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
        
        localStorage.setItem('fasodoc_darkmode', isDarkMode);
        updateThemeIcon();
    });
}

function updateThemeIcon() {
    const icon = themeToggle.querySelector('i');
    if (isDarkMode) {
        icon.className = 'ph ph-sun';
    } else {
        icon.className = 'ph ph-moon';
    }
}

// ---------- SUGGEST FORM ----------
function setupSuggestForm() {
    const form = document.getElementById('suggestForm');
    const success = document.getElementById('suggestSuccess');
    
    form?.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const suggestData = {
            title: document.getElementById('suggestTitle').value.trim(),
            description: document.getElementById('suggestDescription').value.trim(),
            category: document.getElementById('suggestCategory').value,
            level: document.getElementById('suggestLevel').value,
            subject: document.getElementById('suggestSubject').value.trim() || '',
            link: document.getElementById('suggestLink').value.trim(),
            status: 'pending',
            suggestedAt: Date.now()
        };
        
        // Push to Firebase suggestions
        const suggestionsRef = ref(database, 'suggestions');
        push(suggestionsRef, suggestData)
            .then(() => {
                form.style.display = 'none';
                success.style.display = 'block';
                showToast('Suggestion envoyée avec succès !', 'success');
            })
            .catch((error) => {
                console.error('Erreur:', error);
                showToast('Erreur lors de l\'envoi. Réessayez.', 'error');
            });
    });
}

// ---------- LEVEL SELECTOR ----------
function setupLevelSelector() {
    const grid = document.getElementById('levelGrid');
    if (!grid) return;
    
    const levels = ['6ème', '5ème', '4ème', '3ème', '2nde', '1ère', 'Terminale'];
    
    grid.innerHTML = levels.map(level => `
        <div class="level-option ${userLevel === level ? 'selected' : ''}" 
             data-level="${level}"
             onclick="selectLevel('${level}')">
            ${level}
        </div>
    `).join('');
}

function selectLevel(level) {
    userLevel = level;
    localStorage.setItem('fasodoc_level', level);
    
    // Update UI
    document.querySelectorAll('.level-option').forEach(opt => {
        opt.classList.toggle('selected', opt.dataset.level === level);
    });
    
    // Update profile display
    updateProfileLevel();
    
    showToast(`Niveau défini : ${level}`, 'success');
    
    // Close modal
    setTimeout(() => {
        closeModal('levelModal');
    }, 500);
}

function updateProfileLevel() {
    const levelEl = document.querySelector('.profile-level');
    if (levelEl) {
        levelEl.textContent = userLevel ? `Niveau : ${userLevel}` : 'Niveau scolaire non défini';
    }
}

// ---------- PROFILE BUTTONS ----------
function setupProfileButtons() {
    document.getElementById('btnSuggest')?.addEventListener('click', () => {
        openModal('suggestModal');
    });
    
    document.getElementById('btnSetLevel')?.addEventListener('click', () => {
        setupLevelSelector();
        openModal('levelModal');
    });
    
    document.getElementById('btnShareApp')?.addEventListener('click', () => {
        const shareText = '📚 Découvrez FasoDoc - La bibliothèque éducative du Burkina Faso !\n\nAccédez à des milliers de documents scolaires gratuitement.\n\n👉 Rejoignez-nous !';
        
        if (navigator.share) {
            navigator.share({
                title: 'FasoDoc',
                text: shareText
            }).catch(() => {});
        } else {
            window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
        }
    });
    
    document.getElementById('btnAbout')?.addEventListener('click', () => {
        showToast('FasoDoc v1.0.0 - Made with ❤️ for Burkina Faso', 'success');
    });
}

// ---------- MODALS ----------
function setupModalListeners() {
    // Close modals on backdrop click
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
        backdrop.addEventListener('click', () => {
            closeAllModals();
        });
    });
    
    // Close buttons
    document.getElementById('closeModal')?.addEventListener('click', () => closeModal('documentModal'));
    document.getElementById('closeSuggestModal')?.addEventListener('click', () => closeModal('suggestModal'));
    document.getElementById('closeLevelModal')?.addEventListener('click', () => closeModal('levelModal'));
    
    // Swipe down to close
    document.querySelectorAll('.modal-content').forEach(content => {
        let startY = 0;
        
        content.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
        });
        
        content.addEventListener('touchmove', (e) => {
            const deltaY = e.touches[0].clientY - startY;
            if (deltaY > 80 && content.scrollTop <= 0) {
                closeAllModals();
            }
        });
    });
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Reset suggest form if opening suggest modal
    if (modalId === 'suggestModal') {
        document.getElementById('suggestForm').style.display = 'flex';
        document.getElementById('suggestSuccess').style.display = 'none';
        document.getElementById('suggestForm').reset();
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    modal.classList.remove('active');
    
    // Check if any modal is still open
    const openModals = document.querySelectorAll('.modal.active');
    if (openModals.length === 0) {
        document.body.style.overflow = '';
    }
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
    document.body.style.overflow = '';
}

// Expose to global scope for onclick handlers
window.openModal = openModal;
window.closeModal = closeModal;
window.closeAllModals = closeAllModals;

// ---------- TOAST ----------
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? 'ph-check-circle' : 'ph-warning-circle';
    toast.innerHTML = `<i class="ph ${icon}"></i> ${message}`;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentNode) {
            toast.remove();
        }
    }, 3000);
}

// ---------- UTILITY FUNCTIONS ----------
function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
}

function formatDate(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'À l\'instant';
    if (diff < 3600000) return `Il y a ${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return `Il y a ${Math.floor(diff / 3600000)}h`;
    if (diff < 604800000) return `Il y a ${Math.floor(diff / 86400000)}j`;
    
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
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

// ---------- RIPPLE EFFECT ----------
document.addEventListener('click', function(e) {
    const rippleTarget = e.target.closest('.ripple, .btn-primary, .btn-primary-full, .btn-block');
    if (!rippleTarget) return;
    
    const ripple = document.createElement('span');
    ripple.className = 'ripple-effect';
    
    const rect = rippleTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    
    rippleTarget.appendChild(ripple);
    
    ripple.addEventListener('animationend', () => {
        ripple.remove();
    });
});

// ---------- KEYBOARD SHORTCUTS ----------
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeAllModals();
    }
});

// Expose functions to global scope for inline onclick
window.navigateTo = navigateTo;
window.navigateToCategory = navigateToCategory;
window.toggleFavorite = toggleFavorite;
window.openDocumentDetail = openDocumentDetail;
window.shareDocument = shareDocument;
window.addComment = addComment;
window.selectLevel = selectLevel;
window.removeFilter = removeFilter;
window.toggleFavoriteFromModal = (docId) => {
    toggleFavorite(docId);
    const doc = allDocuments.find(d => d.id === docId);
    if (doc) {
        openDocumentDetail(docId);
    }
};

// ---------- INIT APP ----------
initApp();
console.log('🚀 FasoDoc initialized successfully!');
