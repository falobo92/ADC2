import { CONFIG, REQUIRED_FIELDS } from '../config/constants.js';
import { Utils } from '../utils/helpers.js';

// ===== GESTIÓN DE DATOS =====
export class DataManager {
    constructor(appState, notificationManager) {
        this.state = appState;
        this.notifications = notificationManager;
    }
    
    async handleFileUpload(files) {
        if (!files.length) return;
        
        this.notifications.showGlobalLoader('Procesando archivos...');
        
        let processedCount = 0;
        let itemsUpdated = 0;
        
        try {
            for (const file of files) {
                const result = await this.processFile(file);
                if (result.success) {
                    processedCount++;
                    itemsUpdated += result.itemsUpdated;
                }
            }
            
            if (processedCount > 0) {
                this.state.saveToStorage();
                this.notifications.showToast(
                    `${processedCount} archivo(s) procesados. ${itemsUpdated} items añadidos/actualizados.`, 
                    'success'
                );
                return { success: true, processedCount, itemsUpdated };
            } else {
                this.notifications.showAlert('No se procesaron nuevos datos válidos.', 'warning');
                return { success: false };
            }
        } catch (error) {
            console.error('Error processing files:', error);
            this.notifications.showToast('Error procesando archivos', 'error');
            return { success: false, error };
        } finally {
            this.notifications.hideGlobalLoader();
        }
    }
    
    async processFile(file) {
        try {
            const content = await this.readFileAsync(file);
            const jsonData = JSON.parse(content);
            const dataToProcess = jsonData.body && Array.isArray(jsonData.body) ? 
                jsonData.body : (Array.isArray(jsonData) ? jsonData : null);
            
            if (!dataToProcess || !this.validateDataStructure(dataToProcess)) {
                this.notifications.showToast(`Estructura JSON incorrecta: ${file.name}`, 'error');
                return { success: false };
            }
            
            const itemsUpdated = this.mergeData(dataToProcess);
            return { success: true, itemsUpdated };
            
        } catch (error) {
            this.notifications.showToast(`Error procesando ${file.name}: ${error.message}`, 'error');
            return { success: false, error };
        }
    }
    
    readFileAsync(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }
    
    validateDataStructure(data) {
        if (!Array.isArray(data) || data.length === 0) return false;
        return data.every(item => 
            REQUIRED_FIELDS.every(field => field in item)
        );
    }
    
    mergeData(newData) {
        let itemsUpdated = 0;
        
        newData.forEach(newItem => {
            const uniqueKey = Utils.generateUniqueKey(newItem);
            const existingIndex = this.state.allRawData.findIndex(existing => 
                Utils.generateUniqueKey(existing) === uniqueKey
            );
            
            if (existingIndex === -1) {
                this.state.allRawData.push(newItem);
                itemsUpdated++;
            } else {
                const existing = this.state.allRawData[existingIndex];
                if (JSON.stringify(existing) !== JSON.stringify(newItem)) {
                    this.state.allRawData[existingIndex] = newItem;
                    itemsUpdated++;
                }
            }
        });
        
        return itemsUpdated;
    }
    
    clearAllData() {
        this.state.clearData();
        try {
            localStorage.removeItem(CONFIG.STORAGE_KEY);
        } catch (error) {
            console.error('Error clearing storage:', error);
        }
    }
    
    getUniqueValues(field) {
        return [...new Set(this.state.allRawData.map(item => item[field]).filter(Boolean))];
    }
    
    filterData(filters) {
        return this.state.allRawData.filter(item => {
            return Object.entries(filters).every(([key, value]) => {
                if (value === 'all' || value === '' || !value) return true;
                
                // Filtro especial para personas (puede estar en elaborador, revisor o coordinador)
                if (key === 'person') {
                    return item.Elaborador === value || 
                           item.Revisor === value || 
                           item.Coordinador === value;
                }
                
                return item[key] === value;
            });
        });
    }
} 