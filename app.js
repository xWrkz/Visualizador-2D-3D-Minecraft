// app.js - Punto de Entrada Principal
// Este archivo inicializa la aplicación llamando a las funciones expuestas en los módulos.

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializar la configuración de la interfaz del catálogo y Patreon
    if (typeof initCatalog === 'function') {
        initCatalog();
    } else {
        console.error("El módulo catalog.js no está cargado correctamente.");
    }

    // 2. Inicializar el entorno 3D (Three.js)
    if (typeof window.init3D === 'function') {
        window.init3D();
    } else {
        console.error("El módulo visualizer.js no está cargado correctamente.");
    }

    // 3. Global UI Sounds
    document.addEventListener('click', (e) => {
        const target = e.target.closest('button, .control-btn, .build-card, .btn');
        if (target && window.UIAudioManager) {
            window.UIAudioManager.playClick();
        }
    });
});