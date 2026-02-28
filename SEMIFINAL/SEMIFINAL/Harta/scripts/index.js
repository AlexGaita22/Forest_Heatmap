const API_BASE_URL = 'nope';
const API_KEY = 'nope'; 

let map = null;
let heatmapSource = null;
let debounceTimer = null;


const ROMANIA_BOUNDS = [
    [20.0, 43.5], 
    [30.0, 48.5]  
];


const SIDEBAR_ZOOM_THRESHOLD = 9;

const getBufferedBbox = () => {
    if (!map) return null;
    const bounds = map.getBounds();
    
    let swLng = bounds.getSouthWest().lng;
    let swLat = bounds.getSouthWest().lat;
    let neLng = bounds.getNorthEast().lng;
    let neLat = bounds.getNorthEast().lat;

    const latSpan = neLat - swLat;
    const lngSpan = neLng - swLng;

    // Buffer 20%
    swLng -= lngSpan * 0.2;
    swLat -= latSpan * 0.2;
    neLng += lngSpan * 0.2;
    neLat += latSpan * 0.2;

    return `${swLng},${swLat},${neLng},${neLat}`;
};

/**
 * Funcția centrală de refresh (Debounced)
 */
const refreshData = async () => {
    if (!map) return;
    
    // 1. Heatmap (mereu activ)
    await fetchHeatmapData();

    // 2. Sidebar (doar dacă e zoom mare)
    const currentZoom = map.getZoom();
    if (currentZoom >= SIDEBAR_ZOOM_THRESHOLD) {
        await fetchTransports();
    } else {
        showZoomMessageInSidebar();
    }
};

// --- LOGICA HEATMAP ---

const fetchHeatmapData = async () => {
    const zoom = Math.floor(map.getZoom());
    const bbox = getBufferedBbox();
    
    if (!bbox) return;

    try {
        const url = `${API_BASE_URL}/heatmap?zoom=${zoom}&bbox=${bbox}`;
        const response = await fetch(url, { headers: { 'X-App-Key': API_KEY } });
        
        if (!response.ok) throw new Error(`Status: ${response.status}`);
        
        const data = await response.json();
        if (data && data.features) {
            updateHeatmapLayer(data);
        }
    } catch (error) {
        console.warn('Heatmap fetch error:', error);
    }
};

const updateHeatmapLayer = (geojsonData) => {
    if (!map) return;

    const source = map.getSource('heatmap-source');
    if (source) {
        source.setData(geojsonData);
    } else {
        map.addSource('heatmap-source', {
            type: 'geojson',
            data: geojsonData
        });

        map.addLayer({
            id: 'heatmap-layer',
            type: 'heatmap',
            source: 'heatmap-source',
            maxzoom: 15,
            paint: {
                'heatmap-weight': ['interpolate', ['linear'], ['get', 'weight'], 0, 0, 1, 1],
                'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 15, 3],
                'heatmap-color': [
                    'interpolate', ['linear'], ['heatmap-density'],
                    0, 'rgba(0,0,0,0)',
                    0.2, '#0d9488', // Teal
                    0.6, '#facc15', // Yellow
                    1.0, '#ef4444'  // Red
                ],
                'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 9, 20, 15, 50],
                'heatmap-opacity': 0.85
            }
        });
    }
};

// --- LOGICA SIDEBAR (MODIFICATĂ PENTRU COMPANII) ---

const showZoomMessageInSidebar = () => {
    const list = document.getElementById('transports-list');
    document.getElementById('feed-count').textContent = "---";
    list.innerHTML = `
        <div style="padding: 40px 20px; text-align: center; color: #64748b;">
            <i class="fas fa-search-plus" style="font-size: 32px; margin-bottom: 15px;"></i>
            <p>Zona prea mare.</p>
            <p style="font-size: 14px;">Dă Zoom In pentru a vedea companiile.</p>
        </div>
    `;
};

const fetchTransports = async () => {
    const list = document.getElementById('transports-list');
    const bbox = getBufferedBbox();
    
    list.innerHTML = `<div style="padding: 20px; text-align: center; color: #94a3b8;">
        <i class="fas fa-circle-notch fa-spin"></i> Se analizează companiile...
    </div>`;

    try {
        // Presupunem că API-ul returnează lista transporturilor brute filtrată pe zonă
        const url = `${API_BASE_URL}/area/companies/transports?bbox=${bbox}`;
        const response = await fetch(url, { headers: { 'X-App-Key': API_KEY } });
        if (!response.ok) throw new Error('Network error');
        
        const data = await response.json();
        const transports = data.transports || [];
        
        // AICI ESTE MODIFICAREA: Grupăm transporturile pe companii
        const groupedCompanies = groupTransportsByCompany(transports);
        
        renderCompanies(groupedCompanies);
        
    } catch (error) {
        console.error(error);
        list.innerHTML = `<div style="padding: 20px; text-align: center; color: #ef4444;">Eroare la încărcare date.</div>`;
    }
};

/**
 * Funcție logică care transformă lista de transporturi în listă de companii
 */
const groupTransportsByCompany = (transports) => {
    const map = {};

    transports.forEach(t => {
        const companyName = t.company_name || 'Necunoscut';
        const role = (t.role || '').toLowerCase(); // 'emitent' sau 'destinatar'

        if (!map[companyName]) {
            map[companyName] = {
                name: companyName,
                count: 0,
                isEmitent: false,
                isDestinatar: false
            };
        }

        // Incrementăm numărul de transporturi
        map[companyName].count++;

        // Determinăm rolurile active
        if (role === 'emitent') map[companyName].isEmitent = true;
        if (role === 'destinatar' || role === 'receptor') map[companyName].isDestinatar = true;
    });

    // Transformăm obiectul în array și sortăm descrescător după numărul de transporturi
    return Object.values(map).sort((a, b) => b.count - a.count);
};

const renderCompanies = (companies) => {
    const list = document.getElementById('transports-list');
    const countEl = document.getElementById('feed-count');
    
    countEl.textContent = `${companies.length} companii`;

    if (companies.length === 0) {
        list.innerHTML = `<div style="padding: 20px; text-align: center; color: #94a3b8;">Nicio companie activă în zonă.</div>`;
        return;
    }

    list.innerHTML = companies.map(comp => {
        // Determinare etichete și culori
        let badgesHtml = '';
        
        if (comp.isEmitent) {
            badgesHtml += `<span style="font-size: 10px; padding: 2px 6px; background: rgba(16, 185, 129, 0.2); color: #10b981; border-radius: 3px; margin-right:4px;">EMITENT</span>`;
        }
        if (comp.isDestinatar) {
            badgesHtml += `<span style="font-size: 10px; padding: 2px 6px; background: rgba(59, 130, 246, 0.2); color: #3b82f6; border-radius: 3px;">DESTINATAR</span>`;
        }

        // Culoarea bordurii (dacă e mixt, folosim mov, altfel verde sau albastru)
        let borderColor = '#64748b'; // default
        if (comp.isEmitent && comp.isDestinatar) borderColor = '#a855f7'; // Purple (Ambele)
        else if (comp.isEmitent) borderColor = '#10b981'; // Green
        else if (comp.isDestinatar) borderColor = '#3b82f6'; // Blue

        return `
            <div style="
                background: rgba(30, 41, 59, 0.6);
                border-left: 4px solid ${borderColor};
                margin-bottom: 8px;
                padding: 12px;
                border-radius: 4px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                transition: background 0.2s;
            " onmouseover="this.style.background='rgba(30, 41, 59, 0.9)'" onmouseout="this.style.background='rgba(30, 41, 59, 0.6)'">
                
                <div>
                    <div style="font-weight: 700; color: #f1f5f9; font-size: 14px; margin-bottom: 4px;">
                        ${comp.name}
                    </div>
                    <div>${badgesHtml}</div>
                </div>

                <div style="text-align: right;">
                    <div style="font-size: 18px; font-weight: bold; color: #fff;">
                        ${comp.count}
                    </div>
                    <div style="font-size: 10px; color: #94a3b8; text-transform: uppercase;">
                        Transporturi
                    </div>
                </div>

            </div>
        `;
    }).join('');
};

// --- INITIALIZARE MAP ---

const initMap = () => {
    map = new maplibregl.Map({
        container: 'map',
        style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
        center: [25.0, 46.0], 
        zoom: 7,
        maxBounds: ROMANIA_BOUNDS, 
        minZoom: 6
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.on('load', () => {
        refreshData();
    });

    map.on('moveend', () => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            refreshData();
        }, 500); 
    });
};

// Mobile menu functionality
const initMobileMenu = () => {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const mainNav = document.querySelector('.main-nav');
    const navLinks = document.querySelectorAll('.nav-link');

    if (mobileMenuToggle && mainNav) {
        mobileMenuToggle.addEventListener('click', function() {
            mainNav.classList.toggle('active');
            const icon = this.querySelector('i');
            if (icon) {
                if (mainNav.classList.contains('active')) {
                    icon.classList.remove('fa-bars');
                    icon.classList.add('fa-times');
                } else {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
        });

        // Close menu when clicking on a link
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                mainNav.classList.remove('active');
                const icon = mobileMenuToggle.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!mainNav.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
                mainNav.classList.remove('active');
                const icon = mobileMenuToggle.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
        });

        // Close menu on window resize (if it becomes desktop view)
        window.addEventListener('resize', function() {
            if (window.innerWidth > 768 && mainNav.classList.contains('active')) {
                mainNav.classList.remove('active');
                const icon = mobileMenuToggle.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    initMap();
    initMobileMenu();
});