import { CONFIG } from '../config/constants.js';

// ===== UTILIDADES =====
export class Utils {
    static formatDate(dateStr) {
        if (!dateStr) return 'N/A';
        const parts = dateStr.split('-');
        return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateStr;
    }
    
    static formatDateShort(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
    }
    
    static animateNumber(element, targetNumber, duration = CONFIG.ANIMATION.NUMBER_DURATION) {
        if (!element) return;
        
        const startNumber = parseInt(element.textContent) || 0;
        const startTime = performance.now();
        
        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const currentNumber = Math.round(startNumber + (targetNumber - startNumber) * progress);
            element.textContent = currentNumber;
            
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }
        
        requestAnimationFrame(update);
    }
    
    static debounce(func, wait) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
        };
    }
    
    static throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    static generateUniqueKey(item) {
        return `${item.ID}_${item.Semana}_${item.FechaReporte}_${item.Item}_${item.Documento}`;
    }
    
    static sanitizeForFilename(str) {
        return str.replace(/[^a-zA-Z0-9]/g, '_');
    }
    
    static calculateWeekStartDate(weekNumber, year = 2024) {
        const d = new Date(Date.UTC(year, 0, 1));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);

        if (weekNo < weekNumber) {
            d.setUTCDate(d.getUTCDate() + (weekNumber - weekNo) * 7);
        } else if (weekNo > weekNumber) {
            d.setUTCDate(d.getUTCDate() - (weekNo - weekNumber) * 7);
        }
        
        d.setUTCDate(d.getUTCDate() - d.getUTCDay());
        return d;
    }
} 