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
        2: "Portadas/MCAL.jpeg",
        3: "Portadas/MCA.webp",
        4: "Portadas/MCI.jpeg",
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
        const buildTitle = specificData ? specificData.title : `Construcción #${i}`;
        const buildImage = specificData && specificData.imagePath ? `<img src="${specificData.imagePath}" alt="${buildTitle}" style="width:100%; height:100%; object-fit:cover;">` : `<i class="fa-solid fa-cube"></i>`;

        const card = document.createElement('div');
        card.className = 'build-card';
        card.innerHTML = `
            <div class="card-image">
                ${buildImage}
            </div>
            <div class="card-info">
                <h4>${buildTitle}</h4>
                <p>${collectionName}</p>
            </div>
        `;

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
