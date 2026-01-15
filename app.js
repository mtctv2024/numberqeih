// DATABASE
let db = {
    queueCounter: 1,
    lastReset: new Date().toLocaleDateString(),
    organizationName: 'المنشأة',
    footerMessage: 'جميع الحقوق محفوظة',
    resetTime: '05:00',
    paperWidth: '3',
    logo: null,
    tickets: [],
    settings: {
        printer: ''
    }
};

function loadDatabase() {
    const saved = localStorage.getItem('queueDB');
    if (saved) {
        db = JSON.parse(saved);
    }
    updateQueue();
    updateStatistics();
}

function saveDatabase() {
    localStorage.setItem('queueDB', JSON.stringify(db));
}

// TABS
function showTab(tabName, ev) {
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));

    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));

    const tab = document.getElementById(tabName);
    if (tab) tab.classList.add('active');

    if (ev && ev.target) {
        ev.target.classList.add('active');
    }

    if (tabName === 'stats') {
        updateStatistics();
    }
}

// SERVICES
function selectService(button) {
    const allButtons = document.querySelectorAll('.service-btn');
    allButtons.forEach(btn => btn.classList.remove('selected'));

    button.classList.add('selected');

    const service = button.getAttribute('data-service');
    document.getElementById('serviceType').value = service;

    document.getElementById('selectedServiceDisplay').style.display = 'block';
    document.getElementById('selectedServiceText').textContent = service;
}

// TICKET GENERATION
function generateAndPrintTicket() {
    const nameInput = document.getElementById('customerName');
    const customerName = nameInput.value.trim();
    const serviceType = document.getElementById('serviceType').value;

    if (!customerName || !serviceType) {
        showAlert('الرجاء ملء جميع الحقول المطلوبة', 'error');
        return;
    }

    checkDailyReset();

    const ticket = {
        id: Date.now(),
        queueNumber: String(db.queueCounter).padStart(3, '0'),
        customerName: customerName,
        serviceType: serviceType,
        timestamp: new Date(),
        status: 'pending'
    };

    db.tickets.unshift(ticket);
    db.queueCounter++;
    saveDatabase();

    showPrintPreview(ticket, true);

    // PRIVACY
    nameInput.value = '';
    document.getElementById('serviceType').value = '';
    document.getElementById('selectedServiceDisplay').style.display = 'none';
    const allButtons = document.querySelectorAll('.service-btn');
    allButtons.forEach(btn => btn.classList.remove('selected'));

    updateQueue();
    updateStatistics();

    showAlert('تم إنشاء التذكرة بنجاح ✓ وتم مسح بيانات المراجع من الحقول', 'success');
}

function checkDailyReset() {
    const today = new Date().toLocaleDateString();
    const savedDate = db.lastReset;

    if (today !== savedDate) {
        db.queueCounter = 1;
        db.lastReset = today;
        saveDatabase();
    }
}

function updateQueue() {
    const queueNum = String(db.queueCounter).padStart(3, '0');
    document.getElementById('currentQueue').textContent = queueNum;
    
    const now = new Date();
    const timeStr = now.toLocaleTimeString('ar-SA');
    const dateStr = now.toLocaleDateString('ar-SA');
    document.getElementById('timestamp').textContent = `${dateStr} | ${timeStr}`;
}

// PRINT PREVIEW
function showPrintPreview(ticket, autoPrint = false) {
    document.getElementById('modalQueueNum').textContent = ticket.queueNumber;
    document.getElementById('modalCustomer').textContent = ticket.customerName;
    document.getElementById('modalService').textContent = ticket.serviceType;
    
    const date = new Date(ticket.timestamp);
    document.getElementById('modalDate').textContent = date.toLocaleDateString('ar-SA');
    document.getElementById('modalTime').textContent = date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    
    document.getElementById('modalOrgName').textContent = db.organizationName;
    document.getElementById('modalFooter').textContent = db.footerMessage;

    if (db.logo) {
        document.getElementById('modalLogo').src = db.logo;
        document.getElementById('modalLogo').style.display = 'block';
    }

    const modal = document.getElementById('printModal');
    modal.classList.add('active');

    if (autoPrint) {
        setTimeout(() => {
            printTicketAndClose();
        }, 300);
    }
}

function closePrintModal() {
    document.getElementById('printModal').classList.remove('active');
}

function printTicketAndClose() {
    if (window.Android && window.Android.printTicket) {
        const payload = {
            type: 'PRINT_TICKET',
            printer: db.settings.printer || null,
            ticketHtml: document.querySelector('.ticket-preview').innerHTML
        };
        window.Android.printTicket(JSON.stringify(payload));
    } else {
        window.print();
    }
    closePrintModal();
    showAlert('تم إرسال التذكرة للطابعة ✓', 'success');
}

// TEST PRINT
function testPrint() {
    const testTicket = {
        queueNumber: '999',
        customerName: 'اختبار النظام',
        serviceType: 'اختبار',
        timestamp: new Date()
    };
    showPrintPreview(testTicket, false);
    showAlert('هذه تذكرة اختبار - لم يتم حفظها', 'info');
}

// SETTINGS
function saveSettings() {
    const orgName = document.getElementById('orgName').value.trim();
    const footerMsg = document.getElementById('footerMessage').value.trim();
    const resetTime = document.getElementById('resetTime').value;
    const paperWidth = document.getElementById('paperWidth').value;
    const printer = document.getElementById('printerSelect').value;

    if (!orgName) {
        showAlert('الرجاء إدخال اسم المنشأة', 'error');
        return;
    }

    db.organizationName = orgName;
    db.footerMessage = footerMsg || 'جميع الحقوق محفوظة';
    db.resetTime = resetTime;
    db.paperWidth = paperWidth;
    db.settings.printer = printer;
    saveDatabase();

    showAlert('تم حفظ الإعدادات بنجاح ✓', 'success');
}

function previewLogo(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = e.target.result;
        db.logo = img;

        const preview = document.getElementById('logoPreview');
        preview.src = img;
        preview.style.display = 'block';

        const headerLogo = document.getElementById('headerLogo');
        headerLogo.src = img;
        headerLogo.style.display = 'block';

        document.getElementById('logoFileName').textContent = `✓ تم رفع: ${file.name}`;
        saveDatabase();
    };
    reader.readAsDataURL(file);
}

// RESET COUNTER (سابق كما هو)
function resetCounter() {
    if (confirm('هل أنت متأكد من إعادة تعيين العداد؟ سيبدأ من 1')) {
        db.queueCounter = 1;
        db.lastReset = new Date().toLocaleDateString();
        saveDatabase();
        updateQueue();
        showAlert('تم إعادة تعيين العداد ✓', 'success');
    }
}

// RESET COUNTER NOW (زر التصفير الفوري بجوار وقت التصفير)
function resetCounterNow() {
    const ok = confirm('تحذير: سيتم تصفير العداد فوراً وإعادة البدء من 1، هل تريد المتابعة؟');
    if (!ok) return;

    db.queueCounter = 1;
    db.lastReset = new Date().toLocaleDateString();
    saveDatabase();
    updateQueue();
    showAlert('تم تصفير العداد فوراً ✓', 'success');
}

function clearHistory() {
    if (confirm('هل أنت متأكد من حذف السجل بالكامل؟ هذا لا يمكن التراجع عنه!')) {
        db.tickets = [];
        saveDatabase();
        updateStatistics();
        showAlert('تم حذف السجل ✓', 'success');
    }
}

function resetAll() {
    if (confirm('هل أنت متأكد من إعادة تعيين النظام بالكامل؟')) {
        if (confirm('تحذير أخير: سيتم حذف جميع البيانات والإعدادات!')) {
            localStorage.clear();
            location.reload();
        }
    }
}

// HISTORY
function filterHistory() {
    const searchTerm = document.getElementById('searchHistory').value.toLowerCase();
    const table = document.getElementById('historyTable');

    if (!db.tickets || db.tickets.length === 0) {
        table.innerHTML = '<tr><td colspan="6" style="text-align:center; color: #999;">لا توجد بيانات</td></tr>';
        return;
    }

    const filtered = db.tickets.filter(ticket => 
        ticket.customerName.toLowerCase().includes(searchTerm) ||
        ticket.serviceType.toLowerCase().includes(searchTerm)
    );

    if (filtered.length === 0) {
        table.innerHTML = '<tr><td colspan="6" style="text-align:center; color: #999;">لم يتم العثور على نتائج</td></tr>';
        return;
    }

    table.innerHTML = filtered.map(ticket => {
        const date = new Date(ticket.timestamp);
        const timeStr = date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
        const dateStr = date.toLocaleDateString('ar-SA');
        return `
            <tr>
                <td>${db.tickets.indexOf(ticket) + 1}</td>
                <td>${ticket.queueNumber}</td>
                <td>${ticket.customerName}</td>
                <td><span class="badge badge-primary">${ticket.serviceType}</span></td>
                <td>${dateStr} ${timeStr}</td>
                <td><span class="badge badge-success">مُنجز</span></td>
            </tr>
        `;
    }).join('');
}

// EXPORT
function exportToCSV() {
    if (!db.tickets || db.tickets.length === 0) {
        showAlert('لا توجد بيانات للتحميل', 'error');
        return;
    }

    let csv = 'الرقم,المراجع,الخدمة,التاريخ,الوقت\n';
    db.tickets.forEach(ticket => {
        const date = new Date(ticket.timestamp);
        const dateStr = date.toLocaleDateString('ar-SA');
        const timeStr = date.toLocaleTimeString('ar-SA');
        csv += `${ticket.queueNumber},"${ticket.customerName}","${ticket.serviceType}",${dateStr},${timeStr}\n`;
    });

    downloadFile(csv, 'tickets.csv', 'text/csv');
    showAlert('تم تحميل الملف ✓', 'success');
}

function exportToJSON() {
    if (!db.tickets || db.tickets.length === 0) {
        showAlert('لا توجد بيانات للتحميل', 'error');
        return;
    }

    const json = JSON.stringify(db, null, 2);
    downloadFile(json, 'tickets.json', 'application/json');
    showAlert('تم تحميل الملف ✓', 'success');
}

function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type: type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

// STATS
function updateStatistics() {
    const now = new Date();
    const today = now.toLocaleDateString();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    document.getElementById('totalTickets').textContent = db.tickets.length;

    const todayCount = db.tickets.filter(t => new Date(t.timestamp).toLocaleDateString() === today).length;
    document.getElementById('todayTickets').textContent = todayCount;

    const weekCount = db.tickets.filter(t => new Date(t.timestamp) > oneWeekAgo).length;
    document.getElementById('weekTickets').textContent = weekCount;

    const monthCount = db.tickets.filter(t => new Date(t.timestamp) > oneMonthAgo).length;
    document.getElementById('monthTickets').textContent = monthCount;

    updateServicesChart();
    updateHourlyChart();
}

function updateServicesChart() {
    const services = {};
    db.tickets.forEach(ticket => {
        services[ticket.serviceType] = (services[ticket.serviceType] || 0) + 1;
    });

    let html = '<div style="display: grid; gap: 10px;">';
    Object.entries(services).forEach(([service, count]) => {
        const percentage = Math.round((count / db.tickets.length) * 100);
        html += `
            <div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span>${service}</span>
                    <span><strong>${count}</strong> (${percentage}%)</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    });
    html += '</div>';

    if (Object.keys(services).length === 0) {
        html = '<p style="text-align: center; color: #999;">لا توجد بيانات</p>';
    }

    document.getElementById('servicesChart').innerHTML = html;
}

function updateHourlyChart() {
    const hourly = {};
    db.tickets.forEach(ticket => {
        const hour = new Date(ticket.timestamp).getHours();
        const hourStr = String(hour).padStart(2, '0') + ':00';
        hourly[hourStr] = (hourly[hourStr] || 0) + 1;
    });

    let html = '<div style="display: grid; gap: 10px;">';
    const sortedHours = Object.keys(hourly).sort();
    const maxCount = sortedHours.length ? Math.max(...Object.values(hourly)) : 0;

    sortedHours.forEach(hour => {
        const count = hourly[hour];
        const percentage = maxCount ? Math.round((count / maxCount) * 100) : 0;
        html += `
            <div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span>${hour}</span>
                    <span><strong>${count}</strong></span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    });
    html += '</div>';

    if (!sortedHours.length) {
        html = '<p style="text-align: center; color: #999;">لا توجد بيانات</p>';
    }

    document.getElementById('hourlyChart').innerHTML = html;
}

// ALERTS
function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alertContainer');
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    alertContainer.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.remove();
    }, 4000);
}

// ADMIN MODALS
function openAdminLoginModal() {
    document.getElementById('adminPasswordInput').value = '';
    document.getElementById('adminLoginModal').classList.add('active');
}

function closeAdminLoginModal() {
    document.getElementById('adminLoginModal').classList.remove('active');
}

function closeAdminMenuModal() {
    document.getElementById('adminMenuModal').classList.remove('active');
}

function submitAdminPassword() {
    const pass = document.getElementById('adminPasswordInput').value.trim();
    if (pass === 'admin') {
        closeAdminLoginModal();
        document.getElementById('adminMenuModal').classList.add('active');
    } else {
        showAlert('رمز المرور غير صحيح', 'error');
    }
}

function openProtectedTab(tabName) {
    closeAdminMenuModal();
    showTab(tabName, null);
}

// ON LOAD
window.addEventListener('load', function() {
    loadDatabase();

    document.getElementById('orgName').value = db.organizationName;
    document.getElementById('footerMessage').value = db.footerMessage;
    document.getElementById('resetTime').value = db.resetTime;
    document.getElementById('paperWidth').value = db.paperWidth;

    if (db.settings && db.settings.printer) {
        const printerSelect = document.getElementById('printerSelect');
        if (printerSelect) printerSelect.value = db.settings.printer;
    }

    if (db.logo) {
        const preview = document.getElementById('logoPreview');
        preview.src = db.logo;
        preview.style.display = 'block';

        const headerLogo = document.getElementById('headerLogo');
        headerLogo.src = db.logo;
        headerLogo.style.display = 'block';
    }

    // CLEAR SENSITIVE FIELDS
    document.getElementById('customerName').value = '';
    document.getElementById('serviceType').value = '';
    document.getElementById('selectedServiceDisplay').style.display = 'none';
    const allButtons = document.querySelectorAll('.service-btn');
    allButtons.forEach(btn => btn.classList.remove('selected'));

    updateStatistics();
    filterHistory();
});

// SCHEDULED RESET CHECK
setInterval(checkDailyReset, 60000);
