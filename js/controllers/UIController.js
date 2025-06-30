// ===== CONTROLADOR DE INTERFAZ DE USUARIO =====
export class UIController {
    constructor(appState, domManager, notificationManager) {
        this.state = appState;
        this.dom = domManager;
        this.notifications = notificationManager;
    }
    
    // Gestión de pestañas principales
    switchMainTab(tab) {
        document.querySelectorAll('.main-tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`.main-tab-btn[data-tab="${tab}"]`).classList.add('active');
        document.querySelectorAll('.main-tab-content').forEach(tabContent => tabContent.classList.add('hidden'));
        document.getElementById(`main-tab-${tab}`).classList.remove('hidden');
        this.state.currentMainTab = tab;
    }
    
    switchTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`.tab-btn[data-tab="${tab}"]`).classList.add('active');
        document.querySelectorAll('.tab-content').forEach(tabContent => tabContent.classList.add('hidden'));
        document.getElementById(`tab-${tab}`).classList.remove('hidden');
        this.state.currentTab = tab;
    }
    
    // Gestión de sidebar
    toggleSidebar() {
        const sidebar = this.dom.get('sidebar');
        const overlay = document.querySelector('.sidebar-overlay');
        
        if (this.state.sidebarOpen) {
            sidebar.classList.remove('open');
            this.removeOverlay();
            this.state.sidebarOpen = false;
        } else {
            sidebar.classList.add('open');
            this.createOverlay();
            this.state.sidebarOpen = true;
        }
    }
    
    createOverlay() {
        if (document.querySelector('.sidebar-overlay')) return;
        
        const overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        overlay.addEventListener('click', () => this.toggleSidebar());
        document.body.appendChild(overlay);
    }
    
    removeOverlay() {
        const overlay = document.querySelector('.sidebar-overlay');
        if (overlay) overlay.remove();
    }
    
    // Gestión de modales
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }
    
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = '';
        }
    }
    
    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('show');
        });
        document.body.style.overflow = '';
    }
    
    // Gestión de eventos de teclado
    handleKeyboard(event) {
        if (event.key === 'Escape') {
            this.closeAllModals();
        }
    }
    
    // Gestión de clicks fuera de modales
    handleOutsideClick(event) {
        if (event.target.classList.contains('modal')) {
            this.closeModal(event.target.id);
        }
    }
    
    // Gestión de resize
    handleResize() {
        if (window.innerWidth > 768 && this.state.sidebarOpen) {
            this.toggleSidebar();
        }
    }
    
    // Actualización de display de archivos
    updateFileDisplay(files) {
        const display = this.dom.get('fileNameDisplay');
        if (!display) return;
        
        if (typeof files === 'string') {
            display.innerHTML = `<i class="fas fa-info-circle"></i><span>${files}</span>`;
        } else {
            const fileNames = Array.from(files).map(f => f.name);
            const namesList = fileNames.join(', ');
            const truncatedNames = namesList.length > 60 ? namesList.substring(0, 60) + '...' : namesList;
            
            display.innerHTML = `
                <i class="fas fa-file-alt"></i>
                <span>${fileNames.length} archivo(s): ${truncatedNames}</span>
            `;
        }
    }
    
    // Limpieza de elementos de display
    clearDisplayElements() {
        const elementsToClear = [
            'headerTotalItems', 'headerTotalADC', 'headerTotalPAC',
            'headerIncorporated', 'headerEditorial'
        ];
        
        elementsToClear.forEach(id => {
            const element = this.dom.get(id);
            if (element) element.textContent = '0';
        });
    }
} 