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
const collectionTabs = document.querySelectorAll('#collection-tabs .menu-btn');
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
                modal.classList.add('active');
            } else {
                alert("Iniciando descarga del archivo...");
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

    const banners = {
        1: "Portadas/MC.jpg",
        2: "Portadas/MCAL.png",
        3: "Portadas/MCA.jpg",
        4: "Portadas/MCI.jpg",
        5: "Portadas/MCM.png"
    };

    if (banners[collectionId]) {
        const heroCard = document.createElement('div');
        heroCard.className = 'collection-hero-card';
        heroCard.innerHTML = `<img src="${banners[collectionId]}" alt="${collectionName}">`;
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
            
            if (mPath && oFile && mFile && window.start3DPreview) {
                const imgContainer = card.querySelector('.card-image');
                
                const previewContainer = document.createElement('div');
                previewContainer.className = 'preview-3d-container';
                imgContainer.appendChild(previewContainer);
                
                previewInstance = window.start3DPreview(previewContainer, mPath, oFile, mFile);
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
                openInfoModal(buildTitle, desc, img, difficulty, time);
            });
        }

        card.addEventListener('click', () => {
            if (i > 1 && currentUserTier < 2) {
                requiredTierName.textContent = "Maestro ($6/mes)";
                modal.classList.add('active');
            } else {
                if (typeof window.openVisualizer === 'function') {
                    window.openVisualizer({
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
window.openInfoModal = function(title, description, imageSrc, difficulty, time) {
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
                    'models/item/wooden_axe.png',
                    'models/item/stone_axe.png',
                    'models/item/iron_axe.png',
                    'models/item/diamond_axe.png',
                    'models/item/netherite_axe.png'
                ];
                const axesHtml = axes.map((axe, index) => {
                    const style = index < difficulty ? '' : 'filter: brightness(0); opacity: 0.25;';
                    return `<img src="${axe}" alt="Axe" style="width: 24px; height: 24px; image-rendering: pixelated; ${style}">`;
                }).join('');
                difficultyHtml = `<span title="Dificultad" style="display:flex; align-items:center; gap: 2px;">${axesHtml}</span>`;
            }

            let timeHtml = '';
            if (time) {
                timeHtml = `<span title="Tiempo estimado" style="display:flex; align-items:center;"><img src="models/item/clock_00.png" alt="Reloj" style="width: 24px; height: 24px; image-rendering: pixelated; margin-right: 6px;">${time}</span>`;
            }

            if (difficultyHtml || timeHtml) {
                infoStats.innerHTML = `${difficultyHtml}${timeHtml}`;
                infoStats.style.display = 'flex';
            } else {
                infoStats.style.display = 'none';
            }
        }

        infoModal.classList.add('active');
    }
};

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

function initCatalog() {
    renderUserProfile('catalog-user-profile');
    renderUserProfile('visualizer-user-profile');
    initPatreonModals();
    initCatalogTabs();
    
    // Load first collection by default
    generateCards(collections[0].id, collections[0].name);
}
