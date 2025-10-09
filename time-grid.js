// Time Grid Component
class TimeGrid {
    constructor(container, options = {}) {
        this.container = container;
        this.interval = options.interval || 30;
        this.date = options.date || new Date();
        this.onSelectionChange = options.onSelectionChange || (() => {});
        
        this.slotsPerDay = Math.floor((24 * 60) / this.interval);
        this.totalCols = this.slotsPerDay * 2; // 48 hours
        this.slotWidth = 50;
        
        this.selStart = null;
        this.selEnd = null;
        this.isDragging = false;
        this.dragMode = null; // 'range', 'start', 'end'
        this.hoverCell = null;
        
        this.init();
    }
    
    init() {
        this.render();
        this.attachEvents();
        this.centerOnMidnight();
    }
    
    setInterval(interval) {
        this.interval = interval;
        this.slotsPerDay = Math.floor((24 * 60) / this.interval);
        this.totalCols = this.slotsPerDay * 2;
        this.render();
        this.attachEvents();
        this.centerOnMidnight();
    }
    
    setDate(date) {
        this.date = date;
        this.render();
        this.attachEvents();
        this.updateSelection();
    }
    
    render() {
        const day0 = new Date(this.date);
        day0.setHours(0, 0, 0, 0);
        const day1 = new Date(day0);
        day1.setDate(day1.getDate() + 1);
        
        const html = `
            <div class="time-grid-header">
                <div class="time-grid-header-content">
                    <div class="time-grid-title">
                        <h3>🕐 Time Selection</h3>
                        <span class="time-grid-date">
                            Maintenance Date: <strong>${this.formatFullDate(day0)}</strong>
                        </span>
                    </div>
                    <div class="time-grid-summary" id="selectionSummary">
                        ${this.getSelectionSummary()}
                    </div>
                </div>
            </div>
            
            <div class="time-grid-wrapper">
                <div class="time-grid-scroll" id="timeGridScroll" style="width: ${this.totalCols * this.slotWidth}px">
                    ${this.renderDates(day0, day1)}
                    ${this.renderLabels()}
                    ${this.renderCells()}
                </div>
            </div>
            
            <div class="quick-actions">
                <button class="quick-action-btn" data-preset="business">Business Hours (9am-5pm)</button>
                <button class="quick-action-btn" data-preset="overnight">Overnight (10pm-6am)</button>
                <button class="quick-action-btn" data-preset="all">All 48 Hours</button>
                <button class="quick-action-btn clear" data-preset="clear">Clear Selection</button>
            </div>
        `;
        
        this.container.innerHTML = html;
        this.scrollContainer = this.container.querySelector('#timeGridScroll');
        this.cellsContainer = this.container.querySelector('.time-grid-cells');
    }
    
    renderDates(day0, day1) {
        return `
            <div class="time-grid-dates" style="grid-template-columns: repeat(${this.totalCols}, ${this.slotWidth}px)">
                <div class="date-header" style="grid-column: 1 / span ${this.slotsPerDay}">
                    <div class="date-badge blue">
                        <span>${this.formatFullDate(day0)}</span>
                        <span class="date-badge-label">Maintenance Date</span>
                    </div>
                </div>
                <div class="date-header" style="grid-column: ${this.slotsPerDay + 1} / span ${this.slotsPerDay}">
                    <div class="date-badge purple">
                        <span>${this.formatFullDate(day1)}</span>
                        <span class="date-badge-label">Next Day</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderLabels() {
        let html = `<div class="time-grid-labels" style="grid-template-columns: repeat(${this.totalCols}, ${this.slotWidth}px)">`;
        
        for (let lin = 0; lin < this.totalCols; lin++) {
            const i = lin % this.slotsPerDay;
            const totalMin = i * this.interval;
            const hour = Math.floor(totalMin / 60);
            const major = totalMin % 180 === 0;
            const hourly = totalMin % 60 === 0;
            const isMidnight = lin === this.slotsPerDay;
            
            const classes = ['time-label'];
            if (major) classes.push('major');
            else if (hourly) classes.push('hourly');
            else classes.push('minor');
            if (isMidnight) classes.push('midnight');
            
            const label = major ? this.pad2(hour) + ':00' : (hourly ? hour : '');
            
            html += `<div class="${classes.join(' ')}" data-lin="${lin}">${label}</div>`;
        }
        
        html += '</div>';
        return html;
    }
    
    renderCells() {
        let html = `<div class="time-grid-cells" style="grid-template-columns: repeat(${this.totalCols}, ${this.slotWidth}px)">`;
        
        for (let lin = 0; lin < this.totalCols; lin++) {
            const i = lin % this.slotsPerDay;
            const totalMin = i * this.interval;
            const hour = Math.floor(totalMin / 60);
            const isMidnight = lin === this.slotsPerDay;
            
            const classes = ['time-cell'];
            if (hour >= 0 && hour < 6) classes.push('early-morning');
            else if (hour >= 6 && hour < 12) classes.push('morning');
            else if (hour >= 12 && hour < 18) classes.push('afternoon');
            else if (hour >= 18 && hour < 22) classes.push('evening');
            else classes.push('night');
            
            if (isMidnight) classes.push('midnight');
            
            const title = this.minutesToHHmm(totalMin) + (isMidnight ? ' (Midnight)' : '');
            
            html += `<div class="${classes.join(' ')}" data-lin="${lin}" title="${title}"></div>`;
        }
        
        html += '<div id="selectionOverlay" class="selection-overlay" style="display: none;"></div>';
        html += '<button class="selection-handle start" id="handleStart" style="display: none;"></button>';
        html += '<button class="selection-handle end" id="handleEnd" style="display: none;"></button>';
        html += '</div>';
        
        return html;
    }
    
    attachEvents() {
        const cells = this.container.querySelectorAll('.time-cell');
        const overlay = this.container.querySelector('#selectionOverlay');
        const handleStart = this.container.querySelector('#handleStart');
        const handleEnd = this.container.querySelector('#handleEnd');
        
        // Cell events
        cells.forEach(cell => {
            cell.addEventListener('mousedown', (e) => this.onCellMouseDown(e));
            cell.addEventListener('mouseenter', (e) => this.onCellMouseEnter(e));
        });
        
        // Global mouse events
        document.addEventListener('mouseup', () => this.onMouseUp());
        document.addEventListener('mousemove', (e) => this.onMouseMove(e));
        
        // Handle events
        if (handleStart) {
            handleStart.addEventListener('mousedown', (e) => this.onHandleMouseDown(e, 'start'));
        }
        if (handleEnd) {
            handleEnd.addEventListener('mousedown', (e) => this.onHandleMouseDown(e, 'end'));
        }
        
        // Preset buttons
        const presetBtns = this.container.querySelectorAll('[data-preset]');
        presetBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.onPresetClick(e.target.dataset.preset));
        });
    }
    
    onCellMouseDown(e) {
        e.preventDefault();
        const lin = parseInt(e.target.dataset.lin);
        this.isDragging = true;
        this.dragMode = 'range';
        this.selStart = lin;
        this.selEnd = lin;
        this.updateSelection();
    }
    
    onCellMouseEnter(e) {
        const lin = parseInt(e.target.dataset.lin);
        if (this.isDragging && this.dragMode === 'range') {
            this.selEnd = lin;
            this.updateSelection();
        }
    }
    
    onMouseUp() {
        if (this.isDragging) {
            this.isDragging = false;
            this.dragMode = null;
            this.commitSelection();
        }
    }
    
    onMouseMove(e) {
        if (this.isDragging && this.dragMode && this.dragMode !== 'range') {
            const rect = this.cellsContainer.getBoundingClientRect();
            const wrapper = this.container.querySelector('.time-grid-wrapper');
            const scrollLeft = wrapper ? wrapper.scrollLeft : 0;
            const x = e.clientX - rect.left + scrollLeft;
            const lin = Math.max(0, Math.min(this.totalCols - 1, Math.floor(x / this.slotWidth)));
            
            if (this.dragMode === 'start') {
                this.selStart = lin;
            } else if (this.dragMode === 'end') {
                this.selEnd = lin;
            }
            this.updateSelection();
        }
    }
    
    onHandleMouseDown(e, mode) {
        e.preventDefault();
        e.stopPropagation();
        this.isDragging = true;
        this.dragMode = mode;
    }
    
    onPresetClick(preset) {
        const step = this.interval;
        
        switch (preset) {
            case 'business':
                this.selStart = Math.floor((9 * 60) / step);
                this.selEnd = Math.floor((17 * 60) / step) - 1;
                break;
            case 'overnight':
                this.selStart = Math.floor((22 * 60) / step);
                this.selEnd = this.slotsPerDay + Math.floor((6 * 60) / step) - 1;
                break;
            case 'all':
                this.selStart = 0;
                this.selEnd = this.totalCols - 1;
                break;
            case 'clear':
                this.selStart = null;
                this.selEnd = null;
                break;
        }
        
        this.updateSelection();
        this.commitSelection();
    }
    
    updateSelection() {
        // Update cell highlights
        const cells = this.container.querySelectorAll('.time-cell');
        cells.forEach((cell, idx) => {
            const lin = parseInt(cell.dataset.lin);
            const isSelected = this.selStart !== null && this.selEnd !== null &&
                lin >= Math.min(this.selStart, this.selEnd) &&
                lin <= Math.max(this.selStart, this.selEnd);
            cell.classList.toggle('selected', isSelected);
        });
        
        // Update overlay and handles
        if (this.selStart !== null && this.selEnd !== null) {
            const start = Math.min(this.selStart, this.selEnd);
            const end = Math.max(this.selStart, this.selEnd);
            
            const left = start * this.slotWidth;
            const width = (end - start + 1) * this.slotWidth;
            
            const overlay = this.container.querySelector('#selectionOverlay');
            const handleStart = this.container.querySelector('#handleStart');
            const handleEnd = this.container.querySelector('#handleEnd');
            
            if (overlay) {
                overlay.style.display = 'block';
                overlay.style.left = left + 'px';
                overlay.style.width = width + 'px';
            }
            
            if (handleStart) {
                handleStart.style.display = 'block';
                handleStart.style.left = (left - 14) + 'px';
            }
            
            if (handleEnd) {
                handleEnd.style.display = 'block';
                handleEnd.style.left = (left + width - 14) + 'px';
            }
        } else {
            const overlay = this.container.querySelector('#selectionOverlay');
            const handleStart = this.container.querySelector('#handleStart');
            const handleEnd = this.container.querySelector('#handleEnd');
            
            if (overlay) overlay.style.display = 'none';
            if (handleStart) handleStart.style.display = 'none';
            if (handleEnd) handleEnd.style.display = 'none';
        }
        
        // Update summary
        const summary = this.container.querySelector('#selectionSummary');
        if (summary) {
            summary.textContent = this.getSelectionSummary();
        }
    }
    
    commitSelection() {
        if (this.selStart === null || this.selEnd === null) {
            this.onSelectionChange(null, null);
            return;
        }
        
        const start = Math.min(this.selStart, this.selEnd);
        const end = Math.max(this.selStart, this.selEnd);
        
        const startMin = (start % this.slotsPerDay) * this.interval;
        const endMin = ((end + 1) % this.slotsPerDay) * this.interval;
        
        const startTime = this.minutesToHHmm(startMin);
        const endTime = this.minutesToHHmm(endMin);
        
        this.onSelectionChange(startTime, endTime);
    }
    
    getSelectionSummary() {
        if (this.selStart === null || this.selEnd === null) {
            return 'Select a time range';
        }
        
        const start = Math.min(this.selStart, this.selEnd);
        const end = Math.max(this.selStart, this.selEnd);
        const bDay = Math.floor(end / this.slotsPerDay);
        
        const startTime = this.minutesToHHmm((start % this.slotsPerDay) * this.interval);
        const endTime = this.minutesToHHmm(((end + 1) % this.slotsPerDay) * this.interval);
        
        const day0 = new Date(this.date);
        day0.setHours(0, 0, 0, 0);
        const baseDate = this.formatShortDate(day0);
        const nextDaySuffix = bDay > 0 ? ' (next day)' : '';
        
        const mins = (end - start + 1) * this.interval;
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        const dur = m === 0 ? `${h}h` : `${h}h ${m}m`;
        
        return `${baseDate} ${startTime} → ${endTime}${nextDaySuffix} (${dur})`;
    }
    
    centerOnMidnight() {
        setTimeout(() => {
            const wrapper = this.container.querySelector('.time-grid-wrapper');
            if (wrapper) {
                const midnightPos = this.slotsPerDay * this.slotWidth;
                const scrollTarget = midnightPos - wrapper.clientWidth / 2;
                wrapper.scrollLeft = Math.max(0, scrollTarget);
            }
        }, 100);
    }
    
    // Utility methods
    pad2(n) {
        return String(n).padStart(2, '0');
    }
    
    minutesToHHmm(mins) {
        const h = Math.floor(mins / 60) % 24;
        const m = mins % 60;
        return `${this.pad2(h)}:${this.pad2(m)}`;
    }
    
    formatFullDate(date) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    }
    
    formatShortDate(date) {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
    }
}
