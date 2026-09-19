import { collections, specificBuilds } from './data.js';
import { start3DPreview } from './preview.js';
import { openVisualizer } from './visualizer.js';
import { UIAudioManager } from './audioManager.js';

// --- Cookie Parsing for Patreon ---
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

const cookieTier = getCookie('mc_tier');
const cookieUser = getCookie('mc_user');

const currentUserTier = cookieTier !== null ? parseInt(cookieTier) : 0;
const currentUserName = cookieUser ? decodeURIComponent(cookieUser) : null;

function getTierName(tier) {
    if (tier === 3) return "Arquitecto";
    if (tier === 2) return "Maestro";
    if (tier === 1) return "Básico";
    return "Público";
}

// --- DOM Elements for Catalog ---
const catalogGrid = document.getElementById('catalog-grid');
let collectionTabs = document.querySelectorAll('#collection-tabs .menu-btn');
const currentCollectionTitle = document.getElementById('current-collection-title');

const modal = document.getElementById('patreon-modal');
const closeModalBtn = document.getElementById('close-modal');
const premiumBtns = document.querySelectorAll('.premium-btn');
const requiredTierName = document.getElementById('required-tier-name');

// --- Renderizar Perfil ---
function renderUserProfile(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (currentUserTier > 0) {
        container.innerHTML = `
            <span class="user-tier">Nivel: ${getTierName(currentUserTier)}</span>
            <img src="https://ui-avatars.com/api/?name=${currentUserName || 'User'}&background=6366f1&color=fff" alt="User">
        `;
    } else {
        container.innerHTML = `
            <a href="/.netlify/functions/patreon-login" class="login-btn" style="background-color: #ff424d; color: white; padding: 0.5rem 1rem; border-radius: 0.5rem; text-decoration: none; font-weight: bold; font-size: 0.9rem;">
                <i class="fa-brands fa-patreon"></i> Conectar Patreon
            </a>
        `;
    }
}

// --- Patreon Locking Logic ---
function initPatreonModals() {
    premiumBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const requiredTier = parseInt(btn.getAttribute('data-tier') || "3");

            if (currentUserTier < requiredTier) {
                requiredTierName.textContent = requiredTier === 3 ? "Arquitecto ($9/mes)" : "Maestro ($6/mes)";
                modal.querySelector('h2').textContent = "Acceso Restringido";
                modal.querySelector('#modal-message').textContent = "Para acceder a este contenido necesitas mejorar tu nivel en Patreon.";
                modal.querySelector('.tier-info').style.display = 'flex';
                modal.querySelector('.patreon-btn').textContent = "Mejorar en Patreon";
                modal.classList.add('active');
            } else {
                modal.querySelector('h2').textContent = "¡Gracias por tu apoyo!";
                modal.querySelector('#modal-message').textContent = "Los archivos de descarga directa los publico exclusivamente en mis posts de Patreon para los miembros de este nivel. ¡Revisa tu feed para descargarlos!";
                modal.querySelector('.tier-info').style.display = 'none';
                modal.querySelector('.patreon-btn').textContent = "Ir a Patreon";
                modal.classList.add('active');
            }
        });
    });

    closeModalBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });
    
    modal.addEventListener('click', (e) => { 
        if (e.target === modal) modal.classList.remove('active'); 
    });
}

// --- Catalog Generation Logic ---
function generateCards(collectionId, collectionName) {
    catalogGrid.innerHTML = '';

    const collectionData = collections.find(c => c.id === collectionId);
    
    if (collectionData && collectionData.image) {
        const heroCard = document.createElement('div');
        heroCard.className = 'collection-hero-card';
        heroCard.innerHTML = `<img src="${collectionData.image}" alt="${collectionName}">`;
        catalogGrid.appendChild(heroCard);
    }

    const buildsData = specificBuilds[collectionId] || [];

    for (let i = 1; i <= 24; i++) {
        const specificData = buildsData.find(b => b.id === i);
        
        // Skip rendering empty boxes from the 2nd box onwards
        if (i > 1 && !specificData) continue;

        const buildTitle = specificData ? specificData.title : `Construcción #${i}`;
        const buildImage = specificData && specificData.imagePath ? `<img src="${specificData.imagePath}" alt="${buildTitle}" style="width:100%; height:100%; object-fit:cover;">` : `<i class="fa-solid fa-cube"></i>`;

        const isFree = i === 1;
        const freeBadge = isFree ? `<div class="free-badge"><i class="fa-solid fa-unlock"></i> Gratis</div>` : '';

        const card = document.createElement('div');
        card.className = 'build-card';
        card.setAttribute('data-collection', collectionId);
        
        if (specificData && specificData.modelPath && specificData.objFile && specificData.mtlFile) {
            card.setAttribute('data-model-path', specificData.modelPath);
            card.setAttribute('data-obj-file', specificData.objFile);
            card.setAttribute('data-mtl-file', specificData.mtlFile);
        }
        
        card.innerHTML = `
            ${freeBadge}
            <div class="card-image" style="position: relative;">
                ${buildImage}
            </div>
            <div class="card-info" style="position: relative;">
                <h4>${buildTitle}</h4>
                <p>${collectionName}</p>
                <button class="info-btn" aria-label="Más información" title="Más información">
                    <i class="fa-solid fa-ellipsis"></i>
                </button>
            </div>
        `;
        
        let previewInstance = null;
        card.addEventListener('mouseenter', () => {
            const mPath = card.getAttribute('data-model-path');
            const oFile = card.getAttribute('data-obj-file');
            const mFile = card.getAttribute('data-mtl-file');
            
            if (mPath && oFile && mFile && start3DPreview) {
                const imgContainer = card.querySelector('.card-image');
                
                const previewContainer = document.createElement('div');
                previewContainer.className = 'preview-3d-container';
                imgContainer.appendChild(previewContainer);
                
                previewInstance = start3DPreview(previewContainer, mPath, oFile, mFile);
            }
        });
        
        card.addEventListener('mouseleave', () => {
            if (previewInstance) {
                previewInstance.stop();
                previewInstance = null;
            }
            const previewContainer = card.querySelector('.preview-3d-container');
            if (previewContainer) {
                previewContainer.remove();
            }
        });


        const infoBtn = card.querySelector('.info-btn');
        if (infoBtn) {
            infoBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Evitar que se abra la construcción
                const desc = specificData && specificData.description ? specificData.description : "Información detallada próximamente...";
                const img = specificData ? (specificData.descImagePath || specificData.imagePath || "") : "";
                const difficulty = specificData && specificData.difficulty ? specificData.difficulty : null;
                const time = specificData && specificData.time ? specificData.time : null;
                const dims = specificData && specificData.dimensions ? specificData.dimensions : null;
                const blocks = specificData && specificData.totalBlocks ? specificData.totalBlocks : null;
                openInfoModal(buildTitle, desc, img, difficulty, time, dims, blocks);
            });
        }

        card.addEventListener('click', () => {
            if (i > 1 && currentUserTier < 2) {
                requiredTierName.textContent = "Maestro ($6/mes)";
                modal.classList.add('active');
            } else {
                if (typeof UIAudioManager !== 'undefined') {
                    const st = specificData ? specificData.soundType : '';
                    if (st === 'grass' && UIAudioManager.playGrassSound) UIAudioManager.playGrassSound();
                    else if (st === 'stone' && UIAudioManager.playStoneSound) UIAudioManager.playStoneSound();
                    else if (st === 'wood' && UIAudioManager.playWoodSound) UIAudioManager.playWoodSound();
                    else if (st === 'glass' && UIAudioManager.playGlassSound) UIAudioManager.playGlassSound();
                    else UIAudioManager.playClick();
                }
                
                if (typeof openVisualizer === 'function') {
                    openVisualizer({
                        title: buildTitle,
                        collection: collectionName,
                        data: specificData
                    });
                }
            }
        });

        catalogGrid.appendChild(card);
    }
}

// Global function to open the info modal
export function openInfoModal(title, description, imageSrc, difficulty, time, dimensions, totalBlocks) {
    const infoModal = document.getElementById('info-modal');
    const infoTitle = document.getElementById('info-modal-title');
    const infoDesc = document.getElementById('info-modal-desc');
    const infoImg = document.getElementById('info-modal-image');
    const infoStats = document.getElementById('info-modal-stats');
    
    if (infoModal && infoTitle && infoDesc) {
        infoTitle.textContent = title;
        infoDesc.textContent = description;
        if (infoImg) {
            infoImg.src = imageSrc;
            infoImg.style.display = imageSrc ? 'block' : 'none';
        }

        if (infoStats) {
            let difficultyHtml = '';
            if (difficulty) {
                const axes = [
                    'models/items/wooden_axe.png',
                    'models/items/stone_axe.png',
                    'models/items/iron_axe.png',
                    'models/items/diamond_axe.png',
                    'models/items/netherite_axe.png'
                ];
                const axesHtml = axes.map((axe, index) => {
                    const style = index < difficulty ? '' : 'filter: brightness(0); opacity: 0.25;';
                    return `<img src="${axe}" alt="Axe" style="width: 32px; height: 32px; image-rendering: pixelated; ${style}">`;
                }).join('');
                difficultyHtml = `<span title="Dificultad" style="display:flex; align-items:center; gap: 4px;">${axesHtml}</span>`;
            }

            let timeHtml = '';
            if (time) {
                timeHtml = `<span title="Tiempo estimado" style="display:flex; align-items:center; font-size: 1.1rem; color:#aaa"><img src="models/items/clock.png" alt="Reloj" style="width: 32px; height: 32px; image-rendering: pixelated; margin-right: 6px;">${time}</span>`;
            }

            let dimsHtml = '';
            if (dimensions) {
                dimsHtml = `<span title="Dimensiones (Ancho x Alto x Profundidad)" style="display:flex; align-items:center; font-size: 1.1rem; color:#aaa; margin-left: 10px;">
                    <svg style="width: 20px; height: 20px; margin-right: 6px; fill: currentColor;" viewBox="0 0 24 24">
                        <path d="M21,15H23V17H21V15M21,11H23V13H21V11M23,19H21V21C22.1,21 23,20.1 23,19M13,3H15V5H13V3M21,7H23V9H21V7M21,3V5H23C23,3.89 22.1,3 21,3M1,7H3V9H1V7M17,3H19V5H17V3M17,19H19V21H17V19M3,3C1.89,3 1,3.89 1,5H3V3M9,3H11V5H9V3M5,3H7V5H5V3M1,11H3V13H1V11M1,15H3V17H1V15M1,19V21H3V19H1M5,19H7V21H5V19M9,19H11V21H9V19M13,19H15V21H13V19Z" />
                    </svg>${dimensions}
                </span>`;
            }

            let blocksHtml = '';
            if (totalBlocks) {
                blocksHtml = `<span title="Total de Bloques" style="display:flex; align-items:center; font-size: 1.1rem; color:#aaa; margin-left: 10px;">
                    <img src="models/items/grass_block.png" alt="Bloques" style="width: 24px; height: 24px; image-rendering: pixelated; margin-right: 6px;">
                    ${totalBlocks}
                </span>`;
            }

            if (difficultyHtml || timeHtml || dimsHtml || blocksHtml) {
                infoStats.innerHTML = `${difficultyHtml}${timeHtml}${dimsHtml}${blocksHtml}`;
                infoStats.style.display = 'flex';
                infoStats.style.flexWrap = 'wrap';
            } else {
                infoStats.style.display = 'none';
            }
        }

        infoModal.classList.add('active');
    }
};

function renderDynamicCollections() {
    const tabsContainer = document.getElementById('collection-tabs');
    const landingGrid = document.getElementById('landing-books-grid');
    
    if (tabsContainer) tabsContainer.innerHTML = '';
    if (landingGrid) landingGrid.innerHTML = '';
    
    collections.forEach((col, index) => {
        // Build Sidebar Tab
        if (tabsContainer) {
            const btn = document.createElement('button');
            btn.className = `menu-btn ${index === 0 ? 'active' : ''}`;
            btn.setAttribute('data-collection', col.id);
            btn.innerHTML = `<i class="fa-solid ${col.icon || 'fa-cube'}"></i> ${col.name}`;
            tabsContainer.appendChild(btn);
        }
        
        // Build Landing Grid Card
        if (landingGrid && col.image) {
            const card = document.createElement('div');
            card.className = 'book-card';
            card.setAttribute('data-collection-target', col.id);
            card.innerHTML = `
                <div class="book-cover">
                    <img src="${col.image}" alt="${col.name}" style="width: 100%; height: 100%; object-fit: contain;">
                </div>
                <div class="book-info">
                    <h3>${col.name}</h3>
                    <p>${col.description || 'Explora construcciones increíbles.'}</p>
                    <div class="book-action">Ver colección <i class="fa-solid fa-arrow-right"></i></div>
                </div>
            `;
            landingGrid.appendChild(card);
        }
    });
    
    collectionTabs = document.querySelectorAll('#collection-tabs .menu-btn');
}

function initCatalogTabs() {
    collectionTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            collectionTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const collectionId = parseInt(tab.getAttribute('data-collection'));
            const collection = collections.find(c => c.id === collectionId);
            if (collection) {
                currentCollectionTitle.textContent = collection.name;
                generateCards(collectionId, collection.name);
            }
        });
    });
}

export function initCatalog() {
    renderUserProfile('catalog-user-profile');
    renderUserProfile('visualizer-user-profile');
    renderUserProfile('landing-auth-container');
    initPatreonModals();
    renderDynamicCollections();
    initCatalogTabs();
    
    // Load first collection by default
    generateCards(collections[0].id, collections[0].name);

    // Landing Page Navigation
    const viewLanding = document.getElementById('view-landing');
    const viewCatalog = document.getElementById('view-catalog');
    
    const btnExploreLanding = document.getElementById('btn-explore-landing');
    if (btnExploreLanding) {
        btnExploreLanding.addEventListener('click', () => {
            history.pushState({ view: 'catalog' }, '', '?view=catalog');
            viewLanding.classList.remove('active');
            viewCatalog.classList.add('active');
        });
    }

    // Catalog Logo -> Returns to Landing Page top
    const catalogLogo = document.getElementById('catalog-logo');
    if (catalogLogo) {
        catalogLogo.addEventListener('click', () => {
            window.history.pushState({ view: 'landing' }, '', window.location.pathname);
            window.dispatchEvent(new Event('popstate'));
            setTimeout(() => {
                viewLanding.scrollTo({ top: 0, behavior: 'smooth' });
            }, 50);
        });
    }

    const bookCards = document.querySelectorAll('.book-card');
    bookCards.forEach(card => {
        card.addEventListener('click', () => {
            const targetCollection = card.getAttribute('data-collection-target');
            const targetTab = document.querySelector(`.menu-btn[data-collection="${targetCollection}"]`);
            if (targetTab) {
                targetTab.click();
            }
            history.pushState({ view: 'catalog' }, '', '?view=catalog');
            viewLanding.classList.remove('active');
            viewCatalog.classList.add('active');
        });
    });

    // Features Section Interactivity
    const featureItems = document.querySelectorAll('.feature-item');
    featureItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            // Remove active from all
            document.querySelectorAll('.feature-item').forEach(f => f.classList.remove('active'));
            document.querySelectorAll('.feature-media-item').forEach(m => m.classList.remove('active'));
            
            // Add active to current
            item.classList.add('active');
            const featureId = item.getAttribute('data-feature');
            const mediaItem = document.getElementById(`media-feature-${featureId}`);
            if (mediaItem) {
                mediaItem.classList.add('active');
                // Play video if it exists
                const video = mediaItem.querySelector('video');
                if (video) {
                    video.currentTime = 0;
                    video.play().catch(e => console.log('Video autoplay blocked'));
                }
            }
        });
    });

    // Start playing the first feature video by default
    const firstFeatureMedia = document.getElementById('media-feature-1');
    if (firstFeatureMedia) {
        const firstVideo = firstFeatureMedia.querySelector('video');
        if (firstVideo) {
            firstVideo.play().catch(e => console.log('Video autoplay blocked'));
        }
    }
}
