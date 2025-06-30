import { CONFIG } from '../config/constants.js';

// ===== ESTADO GLOBAL DE LA APLICACIÓN =====
export class AppState {
    constructor() {
        this.allRawData = [];
        this.currentFilteredData = [];
        this.currentEvolutionData = [];
        this.currentSubcontractData = [];
        this.charts = {};
        this.previousStats = null;
        this.currentSubcontractName = '';
        this.currentTab = 'overview';
        this.currentMainTab = 'dashboard';
        this.detailsPage = 1;
        this.sidebarOpen = false;
        this.currentTimelineView = 'card';
        this.filteredTimelineData = null;
        this.isProcessing = false;
    }
    
    // Métodos para gestionar el estado
    setData(key, value) {
        this[key] = value;
    }
    
    getData(key) {
        return this[key];
    }
    
    clearData() {
        this.allRawData = [];
        this.currentFilteredData = [];
        this.currentEvolutionData = [];
        this.currentSubcontractData = [];
        this.previousStats = null;
    }
    
    // Persistencia
    saveToStorage() {
        try {
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(this.allRawData));
        } catch (error) {
            console.error('Error saving to storage:', error);
        }
    }
    
    loadFromStorage() {
        try {
            const stored = localStorage.getItem(CONFIG.STORAGE_KEY);
            this.allRawData = stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading from storage:', error);
            this.allRawData = [];
        }
    }
} 