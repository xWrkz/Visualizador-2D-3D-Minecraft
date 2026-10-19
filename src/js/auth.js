// --- Módulo Central de Autenticación y Seguridad ---

export function getTierName(tier) {
    if (tier === 3) return "Arquitecto";
    if (tier === 2) return "Maestro";
    if (tier === 1) return "Básico";
    return "Público";
}

// Variables reactivas en window para acceso global
window.currentUserTier = 0;
window.currentUserName = null;
window.currentUserAvatar = null;
window.currentUserTierName = "Público";
window.isAuthenticated = false;

let resolveAuthReady;
export const authReadyPromise = new Promise((resolve) => {
    resolveAuthReady = resolve;
});

/**
 * Consulta la sesión verificada en el backend
 */
export async function checkSession() {
    try {
        const response = await fetch('/.netlify/functions/get-session', {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            cache: 'no-store'
        });

        if (response.ok) {
            const data = await response.json();
            window.currentUserTier = data.tier || 0;
            window.currentUserName = data.user || null;
            window.currentUserAvatar = data.avatar || null;
            window.currentUserTierName = data.tierName || getTierName(data.tier || 0);
            window.isAuthenticated = !!data.authenticated;

            window.dispatchEvent(new CustomEvent('session-updated', { detail: data }));
            resolveAuthReady(data);
            return data;
        } else {
            throw new Error(`Status ${response.status}`);
        }
    } catch (err) {
        // En entorno local Vite sin Netlify Dev, fallback seguro a nivel público (0)
        console.warn('[Auth] Netlify get-session no disponible o en entorno local offline. Nivel asignado: Público.', err.message);
        const fallback = {
            authenticated: false,
            tier: 0,
            user: null,
            avatar: null,
            tierName: "Público"
        };
        window.currentUserTier = 0;
        window.currentUserName = null;
        window.currentUserAvatar = null;
        window.currentUserTierName = "Público";
        window.isAuthenticated = false;

        window.dispatchEvent(new CustomEvent('session-updated', { detail: fallback }));
        resolveAuthReady(fallback);
        return fallback;
    }
}

/**
 * Abre el modal de Patreon informando del nivel requerido
 */
export function showPatreonModal(requiredTier = 2) {
    const modal = document.getElementById('patreon-modal');
    const requiredTierName = document.getElementById('required-tier-name');
    if (!modal) return;

    if (window.currentUserTier < requiredTier) {
        if (requiredTierName) {
            requiredTierName.textContent = requiredTier === 3 ? "Arquitecto ($9/mes)" : "Maestro ($6/mes)";
        }
        modal.querySelector('h2').textContent = "Acceso Restringido";
        modal.querySelector('#modal-message').textContent = "Para acceder a este contenido necesitas mejorar tu nivel en Patreon.";
        const tierInfo = modal.querySelector('.tier-info');
        if (tierInfo) tierInfo.style.display = 'flex';
        const patreonBtn = modal.querySelector('.patreon-btn');
        if (patreonBtn) {
            patreonBtn.href = "https://www.patreon.com/c/WrkzUwU";
            patreonBtn.textContent = "Mejorar en Patreon";
        }
        modal.classList.add('active');
    } else {
        modal.querySelector('h2').textContent = "¡Gracias por tu apoyo!";
        modal.querySelector('#modal-message').textContent = "Los archivos de descarga directa los publico exclusivamente en mis posts de Patreon para los miembros de este nivel. ¡Revisa tu feed para descargarlos!";
        const tierInfo = modal.querySelector('.tier-info');
        if (tierInfo) tierInfo.style.display = 'none';
        const patreonBtn = modal.querySelector('.patreon-btn');
        if (patreonBtn) {
            patreonBtn.href = "https://www.patreon.com/c/WrkzUwU";
            patreonBtn.textContent = "Ir a Patreon";
        }
        modal.classList.add('active');
    }
}

// Iniciar comprobación inmediatamente al cargar el script
checkSession();
