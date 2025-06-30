import { CONFIG } from '../config/constants.js';

// ===== GESTIÓN DE NOTIFICACIONES =====
export class NotificationManager {
    constructor(domManager) {
        this.dom = domManager;
    }
    
    showToast(message, type = 'info', duration = CONFIG.ANIMATION.TOAST_DURATION) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = this.getToastIcon(type);
        toast.innerHTML = `
            <i class="${icon}"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.remove()" style="margin-left: auto; background: none; border: none; color: inherit; cursor: pointer;">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        const container = this.dom.get('toastContainer');
        if (container) {
            container.appendChild(toast);
            setTimeout(() => toast.classList.add('show'), 100);
            
            if (duration > 0) {
                setTimeout(() => {
                    toast.classList.remove('show');
                    setTimeout(() => toast.remove(), 300);
                }, duration);
            }
        }
    }
    
    showAlert(message, type = 'info', duration = 5000) {
        const alertBox = this.dom.get('alertBox');
        if (!alertBox) return;
        
        alertBox.className = `alert alert-${type}`;
        alertBox.innerHTML = `
            <i class="${this.getToastIcon(type)}"></i>
            <span>${message}</span>
        `;
        alertBox.classList.remove('hidden');
        
        if (duration > 0) {
            setTimeout(() => alertBox.classList.add('hidden'), duration);
        }
    }
    
    showGlobalLoader(message = 'Cargando...') {
        const loader = this.dom.get('globalLoader');
        if (loader) {
            const messageEl = loader.querySelector('p');
            if (messageEl) messageEl.textContent = message;
            loader.classList.remove('hidden');
        }
    }
    
    hideGlobalLoader() {
        const loader = this.dom.get('globalLoader');
        if (loader) loader.classList.add('hidden');
    }
    
    getToastIcon(type) {
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        return icons[type] || icons.info;
    }
} 