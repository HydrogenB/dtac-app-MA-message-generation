// Main Application Logic

// Thai weekday mapping
const weekdayEnToTh = {
    'Sunday': 'วันอาทิตย์',
    'Monday': 'วันจันทร์',
    'Tuesday': 'วันอังคาร',
    'Wednesday': 'วันพุธ',
    'Thursday': 'วันพฤหัสบดี',
    'Friday': 'วันศุกร์',
    'Saturday': 'วันเสาร์'
};

// Thai month abbreviations
const monthNumToThAbbr = {
    1: 'ม.ค.', 2: 'ก.พ.', 3: 'มี.ค.', 4: 'เม.ย.', 5: 'พ.ค.', 6: 'มิ.ย.',
    7: 'ก.ค.', 8: 'ส.ค.', 9: 'ก.ย.', 10: 'ต.ค.', 11: 'พ.ย.', 12: 'ธ.ค.'
};

// English month names
const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

// English weekday names
const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Global state
let timeGrid;
let currentDate;
let currentInterval = 30;
let startTime = null;
let endTime = null;
let startDayOffset = 0;
let endDayOffset = 0;
let generatedMessages = {};

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeDateInput();
    initializeTimeGrid();
    initializeIntervalButtons();
    initializeCopyButtons();
});

function initializeDateInput() {
    const dateInput = document.getElementById('maintenanceDate');
    const today = new Date();
    
    // Set today as default and min date
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    
    dateInput.value = `${year}-${month}-${day}`;
    dateInput.min = `${year}-${month}-${day}`;
    
    // Normalize to midnight to avoid timezone issues
    currentDate = new Date(year, today.getMonth(), today.getDate(), 0, 0, 0, 0);
    
    dateInput.addEventListener('change', function() {
        const [y, m, d] = this.value.split('-').map(Number);
        // Normalize to midnight to avoid timezone issues
        currentDate = new Date(y, m - 1, d, 0, 0, 0, 0);
        
        console.log('Date changed to:', currentDate, 'Input value:', this.value);
        
        if (timeGrid) {
            timeGrid.setDate(currentDate);
        }
    });
}

function initializeTimeGrid() {
    const container = document.getElementById('timeGridContainer');
    
    timeGrid = new TimeGrid(container, {
        interval: currentInterval,
        date: currentDate,
        onSelectionChange: handleSelectionChange
    });
}

function initializeIntervalButtons() {
    const buttons = document.querySelectorAll('.interval-btn');
    
    buttons.forEach(btn => {
        btn.addEventListener('click', function() {
            buttons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            currentInterval = parseInt(this.dataset.interval);
            
            if (timeGrid) {
                timeGrid.setInterval(currentInterval);
            }
        });
    });
}

function initializeCopyButtons() {
    // Individual copy buttons
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('copy-btn')) {
            const messageId = e.target.dataset.message;
            copyMessage(messageId, e.target);
        }
    });
    
    // Copy all button
    const copyAllBtn = document.getElementById('copyAllBtn');
    if (copyAllBtn) {
        copyAllBtn.addEventListener('click', copyAllMessages);
    }
}

function handleSelectionChange(start, end, startDay, endDay) {
    startTime = start;
    endTime = end;
    startDayOffset = startDay || 0;
    endDayOffset = endDay || 0;
    
    if (start && end) {
        generateMessages();
    }
}

function generateMessages() {
    if (!startTime || !endTime || !currentDate) return;
    
    console.log('Generating messages with currentDate:', currentDate, 'startDay:', startDayOffset, 'endDay:', endDayOffset);
    
    // Parse times
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    // Create dates and apply day offsets
    const startDate = new Date(currentDate);
    startDate.setDate(startDate.getDate() + startDayOffset);
    startDate.setHours(startHour, startMinute, 0, 0);
    
    const endDate = new Date(currentDate);
    endDate.setDate(endDate.getDate() + endDayOffset);
    endDate.setHours(endHour, endMinute, 0, 0);
    
    // Check if crosses day (end day is after start day)
    const crossesDay = endDayOffset > startDayOffset;
    if (!crossesDay && startTime >= endTime) {
        // Same day but end time is before start time
        endDate.setDate(endDate.getDate() + 1);
    }
    
    // Format dates
    const thaiDate = formatThaiDate(startDate);
    const englishDate = formatEnglishDate(startDate);
    const startTimeStr = startTime;
    const endTimeStr = endTime;
    
    // Generate messages
    const crossDaySuffix = crossesDay ? ' ของวันถัดไป' : '';
    const crossDaySuffixEN = crossesDay ? ' of the following day' : '';
    
    const preMA_TH = `เรียนลูกค้าที่เคารพ ดีแทคแอปจะปิดปรับปรุงเพื่อบริการที่ดียิ่งขึ้นใน${thaiDate} เวลา ${startTimeStr} – ${endTimeStr}${crossDaySuffix} ขออภัยในความไม่สะดวก`;
    const preMA_EN = `Dear customers, please note that dtac app will be closed for upgrading the service on ${englishDate}, from ${startTimeStr} until ${endTimeStr}${crossDaySuffixEN}. We sincerely apologize for the inconvenience.`;
    const maMode_TH = `ขณะนี้ dtac app กำลังปิดปรับปรุงเพื่อพัฒนาการให้บริการ ใน${thaiDate} เวลา ${startTimeStr} – ${endTimeStr}${crossDaySuffix} ขออภัยในความไม่สะดวก`;
    const maMode_EN = `dtac app is now upgrading the service on ${englishDate}, from ${startTimeStr} until ${endTimeStr}${crossDaySuffixEN}. We sincerely apologize for the inconvenience.`;
    
    // Store messages
    generatedMessages = {
        preTH: preMA_TH,
        preEN: preMA_EN,
        maTH: maMode_TH,
        maEN: maMode_EN
    };
    
    // Display messages
    document.getElementById('preTH').textContent = preMA_TH;
    document.getElementById('preEN').textContent = preMA_EN;
    document.getElementById('maTH').textContent = maMode_TH;
    document.getElementById('maEN').textContent = maMode_EN;
    
    // Show messages section
    document.getElementById('messagesSection').style.display = 'block';
    
    // Scroll to messages
    document.getElementById('messagesSection').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function formatThaiDate(date) {
    const weekdayEn = weekdayNames[date.getDay()];
    const thaiWeekday = weekdayEnToTh[weekdayEn];
    const dayTh = date.getDate();
    const monthNum = date.getMonth() + 1;
    const monthTh = monthNumToThAbbr[monthNum];
    const yearThBe = date.getFullYear() + 543;
    
    return `${thaiWeekday}ที่ ${dayTh} ${monthTh} ${yearThBe}`;
}

function formatEnglishDate(date) {
    const weekday = weekdayNames[date.getDay()];
    const day = date.getDate();
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    
    return `${weekday}, ${day} ${month} ${year}`;
}

function copyMessage(messageId, button) {
    const text = generatedMessages[messageId];
    if (!text) return;
    
    navigator.clipboard.writeText(text).then(() => {
        const originalText = button.textContent;
        button.textContent = '✓ Copied';
        button.classList.add('copied');
        
        setTimeout(() => {
            button.textContent = originalText;
            button.classList.remove('copied');
        }, 2000);
        
        showToast('Message copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy:', err);
        showToast('Failed to copy message', 'error');
    });
}

function copyAllMessages() {
    const allText = `Pre-MA Announcement
TH:  ${generatedMessages.preTH}
EN (also for MY/KM):  ${generatedMessages.preEN}

MA Mode (during maintenance)
TH: ${generatedMessages.maTH}
EN (also for MY/KM): ${generatedMessages.maEN}`;

    navigator.clipboard.writeText(allText).then(() => {
        showToast('All messages copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy:', err);
        showToast('Failed to copy messages', 'error');
    });
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.background = type === 'error' ? '#ef4444' : '#10b981';
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
