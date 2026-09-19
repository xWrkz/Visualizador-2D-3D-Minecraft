// app.js - Punto de Entrada Principal
// Este archivo inicializa la aplicación llamando a las funciones expuestas en los módulos.


import { initCatalog } from './js/catalog.js';
import { init3D, switchTo3DMode, openVisualizer } from './js/visualizer.js';
import { getBuildBySlug } from './js/data.js';
import { UIAudioManager } from './js/audioManager.js';
import './js/preview.js';
import './js/pdfGenerator.js';
import './js/skyboxManager.js';
import './js/craftingUI.js';

document.addEventListener('DOMContentLoaded', () => {

    // 1. Inicializar la configuración de la interfaz del catálogo y Patreon
    if (typeof initCatalog === 'function') {
        initCatalog();
    } else {
        console.error("El módulo catalog.js no está cargado correctamente.");
    }

    // 2. Inicializar el entorno 3D (Three.js)
    if (typeof init3D === 'function') {
        init3D();
    } else {
        console.error("El módulo visualizer.js no está cargado correctamente.");
    }

    // 3. Global UI Sounds
    document.addEventListener('click', (e) => {
        const target = e.target.closest('button, .control-btn, .btn');
        if (target && UIAudioManager) {
            UIAudioManager.playClick();
        }
    });

    // 4. Mobile Menu Logic
    const mobileBtns = document.querySelectorAll('.mobile-menu-btn');

    function toggleMobileMenu() {
        const activeView = document.querySelector('.screen-view.active');
        if (activeView) {
            const sidebar = activeView.querySelector('.sidebar');
            const overlay = activeView.querySelector('.mobile-overlay');
            if (sidebar && overlay) {
                sidebar.classList.toggle('open');
                overlay.classList.toggle('active');
            }
        }
    }

    mobileBtns.forEach(btn => btn.addEventListener('click', toggleMobileMenu));

    // Close menu when clicking on overlay
    document.querySelectorAll('.mobile-overlay').forEach(overlay => {
        overlay.addEventListener('click', () => {
            document.querySelectorAll('.sidebar.open').forEach(sb => sb.classList.remove('open'));
            document.querySelectorAll('.mobile-overlay.active').forEach(ov => ov.classList.remove('active'));
        });
    });

    // Close menu when clicking on sidebar links (on mobile)
    document.querySelectorAll('.sidebar .menu-btn, .sidebar .premium-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                document.querySelectorAll('.sidebar.open').forEach(sb => sb.classList.remove('open'));
                document.querySelectorAll('.mobile-overlay.active').forEach(ov => ov.classList.remove('active'));
            }
        });
    });

    // Desktop Toggle Sidebar
    const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
    if (btnToggleSidebar) {
        btnToggleSidebar.addEventListener('click', () => {
            const visualizerView = document.getElementById('view-visualizer');
            if (visualizerView) {
                visualizerView.classList.toggle('sidebar-collapsed');
                // Disparar evento de resize después de la animación para que Three.js actualice el canvas
                setTimeout(() => {
                    window.dispatchEvent(new Event('resize'));
                }, 300);
            }
        });
    }

    // 5. Browser Back Button Support (History API)
    function handleHistoryChange() {
        // Close any open sidebars or overlays
        document.querySelectorAll('.sidebar.open').forEach(sb => sb.classList.remove('open'));
        document.querySelectorAll('.mobile-overlay.active').forEach(ov => ov.classList.remove('active'));

        // Handle View Switching based on Query Params
        const params = new URLSearchParams(window.location.search);
        const buildSlug = params.get('build');
        const viewName = params.get('view');

        if (buildSlug) {
            const build = getBuildBySlug(buildSlug);
            if (build) {
                // Prevent duplicate history entries if openVisualizer is called manually
                openVisualizer(build, true);
                return;
            }
        }
        
        if (viewName === 'catalog') {
            document.getElementById('view-landing').classList.remove('active');
            document.getElementById('view-visualizer').classList.remove('active');
            document.getElementById('view-catalog').classList.add('active');
            if (typeof switchTo3DMode === 'function') switchTo3DMode();
        } else {
            // Default to landing page
            document.getElementById('view-catalog').classList.remove('active');
            document.getElementById('view-visualizer').classList.remove('active');
            document.getElementById('view-landing').classList.add('active');
        }
        
        // Also close modals if we are going back
        document.querySelectorAll('.modal-overlay.active').forEach(modal => modal.classList.remove('active'));
    }

    window.addEventListener('popstate', handleHistoryChange);
    
    // Check URL on initial load
    handleHistoryChange();
});