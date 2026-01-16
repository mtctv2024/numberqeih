// ========== المتغيرات العامة ==========
let currentQueue = parseInt(localStorage.getItem('currentQueue')) || 1;
let ticketHistory = JSON.parse(localStorage.getItem('ticketHistory')) || [];
let adminPassword = localStorage.getItem('adminPassword') || '1234';
let isAdminAuthenticated = false;

// ========== التهيئة عند تحميل الصفحة ==========
window.onload = function() {
    updateQueueDisplay();
    loadSettings();
    updateTimestamp();
    setInterval(updateTimestamp, 1000);
    checkDailyReset();
    setInterval(checkDailyReset, 60000);
};

// ========== إدارة التبويبات ==========
function showTab(tabName, event) {
    // الخروج من وضع المسؤول عند العودة للرئيسية
    if (tabName === 'main') {
        isAdminAuthenticated = false;
        
        // إخفاء تبويبات المسؤول
        const settingsBtn = document.getElementById('settingsTabBtn');
        const historyBtn = document.getElementById('historyTabBtn');
        const statsBtn = document.getElementById('statsTabBtn');
        
        if (settingsBtn) settingsBtn.style.display = 'none';
        if (historyBtn) historyBtn.style.display = 'none';
        if (statsBtn) statsBtn.style.display = 'none';
    }
    
    // التحقق من صلاحيات الوصول للتبويبات المحمية
    if ((tabName === 'settings' || tabName === 'history' || tabName === 'stats') && !isAdminAuthenticated) {
        openAdminLoginModal();
        return;
    }
    
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(tabName).classList.add('active');
    if (event && event.target) event.target.classList.add('active');
    
    if (tabName === 'history') {
        loadHistory();
    }
    if (tabName === 'stats') {
        loadStats();
    }
}


// ========== اختيار الخدمة ==========
function selectService(button) {
    const buttons = document.querySelectorAll('.service-btn');
    buttons.forEach(btn => btn.classList.remove('selected'));
    
    button.classList.add('selected');
    
    const service = button.getAttribute('data-service');
    document.getElementById('serviceType').value = service;
    
    document.getElementById('selectedServiceText').textContent = service;
    document.getElementById('selectedServiceDisplay').style.display = 'block';
    
    showAlert('تم اختيار: ' + service, 'success');
}

// ========== توليد وطباعة التذكرة ==========
function generateAndPrintTicket() {
    const customerName = document.getElementById('customerName').value.trim();
    const serviceType = document.getElementById('serviceType').value;
    
    if (!customerName) {
        showAlert('الرجاء إدخال رقم الهوية', 'error');
        return;
    }
    
    if (!serviceType) {
        showAlert('الرجاء اختيار نوع الخدمة', 'error');
        return;
    }
    
    const queueNum = String(currentQueue).padStart(3, '0');
    const now = new Date();
    const dateStr = now.toLocaleDateString('ar-SA');
    const timeStr = now.toLocaleTimeString('ar-SA');
    
    const ticket = {
        id: Date.now(),
        queueNumber: queueNum,
        customerName: customerName,
        serviceType: serviceType,
        date: dateStr,
        time: timeStr,
        timestamp: now.getTime(),
        status: 'مطبوع'
    };
    
    ticketHistory.push(ticket);
    localStorage.setItem('ticketHistory', JSON.stringify(ticketHistory));
    
    currentQueue++;
    localStorage.setItem('currentQueue', currentQueue);
    updateQueueDisplay();
    
    showPrintModal(ticket);
    
    document.getElementById('customerName').value = '';
    document.getElementById('serviceType').value = '';
    document.getElementById('selectedServiceDisplay').style.display = 'none';
    
    const buttons = document.querySelectorAll('.service-btn');
    buttons.forEach(btn => btn.classList.remove('selected'));
    
    showAlert('تم إنشاء التذكرة بنجاح!', 'success');
}

// ========== عرض نافذة الطباعة ==========
function showPrintModal(ticket) {
    const orgName = localStorage.getItem('orgName') || 'أمانة منطقة الرياض - بلدية محافظة القويعية';
    const logoTicket = localStorage.getItem('logoTicket') || '';
    const footerMessage = localStorage.getItem('footerMessage') || '';
    
    document.getElementById('modalOrgName').textContent = orgName;
    document.getElementById('modalQueueNum').textContent = ticket.queueNumber;
    document.getElementById('modalCustomer').textContent = ticket.customerName;
    document.getElementById('modalService').textContent = ticket.serviceType;
    document.getElementById('modalDate').textContent = ticket.date;
    document.getElementById('modalTime').textContent = ticket.time;
    document.getElementById('modalFooter').textContent = footerMessage;
    
    const modalLogo = document.getElementById('modalLogo');
    if (logoTicket) {
        modalLogo.src = logoTicket;
        modalLogo.style.display = 'block';
    } else {
        modalLogo.style.display = 'none';
    }
    
    document.getElementById('printModal').classList.add('active');
}

// ========== طباعة التذكرة (الحل الأكثر موثوقية) ==========
function printTicketAndClose() {
    const ticketContent = document.querySelector('#printModal .ticket-preview').innerHTML;
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>طباعة التذكرة</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: 'Bahij', 'Noto Sans Arabic', 'Segoe UI', sans-serif;
                    padding: 20px;
                    direction: rtl;
                    text-align: center;
                }
                .ticket-preview {
                    max-width: 380px;
                    margin: 0 auto;
                    font-family: 'Courier New', monospace;
                    font-size: 12px;
                    line-height: 1.6;
                }
                .ticket-header {
                    border-bottom: 2px dashed #ddd;
                    padding-bottom: 10px;
                    margin-bottom: 10px;
                }
                .ticket-logo {
                    width: 60px;
                    height: 60px;
                    border-radius: 4px;
                    object-fit: cover;
                    margin: 0 auto 10px;
                    display: block;
                }
                .ticket-number {
                    font-size: 24px;
                    font-weight: bold;
                    color: #016948;
                    margin: 15px 0;
                }
                .ticket-footer {
                    border-top: 2px dashed #ddd;
                    padding-top: 10px;
                    margin-top: 10px;
                    font-size: 10px;
                    color: #666;
                }
                @media print {
                    body { padding: 0; }
                    @page { margin: 10mm; }
                }
            </style>
        </head>
        <body>
            <div class="ticket-preview">${ticketContent}</div>
            <script>
                window.onload = function() {
                    window.print();
                    setTimeout(function() { window.close(); }, 500);
                };
            </script>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    closePrintModal();
}

// ========== إغلاق نافذة الطباعة ==========
function closePrintModal() {
    document.getElementById('printModal').classList.remove('active');
}

// ========== تحديث عرض رقم الانتظار ==========
function updateQueueDisplay() {
    const queueNum = String(currentQueue).padStart(3, '0');
    document.getElementById('currentQueue').textContent = queueNum;
}

// ========== تحديث الطابع الزمني ==========
function updateTimestamp() {
    const now = new Date();
    const dateStr = now.toLocaleDateString('ar-SA');
    const timeStr = now.toLocaleTimeString('ar-SA');
    document.getElementById('timestamp').textContent = `${dateStr} | ${timeStr}`;
}

// ========== معاينة الشعار (الهيدر) ==========
function previewLogoHeader(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('logoPreviewHeader').src = e.target.result;
            document.getElementById('logoPreviewHeader').style.display = 'block';
            document.getElementById('logoFileNameHeader').textContent = file.name;
        };
        reader.readAsDataURL(file);
    }
}

// ========== معاينة الشعار (التذكرة) ==========
function previewLogoTicket(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('logoPreviewTicket').src = e.target.result;
            document.getElementById('logoPreviewTicket').style.display = 'block';
            document.getElementById('logoFileNameTicket').textContent = file.name;
        };
        reader.readAsDataURL(file);
    }
}

// ========== حفظ الإعدادات ==========
function saveSettings() {
    const orgName = document.getElementById('orgName').value.trim();
    const footerMessage = document.getElementById('footerMessage').value.trim();
    const logoHeader = document.getElementById('logoPreviewHeader').src;
    const logoTicket = document.getElementById('logoPreviewTicket').src;
    const resetTime = document.getElementById('resetTime').value;
    const paperWidth = document.getElementById('paperWidth').value;
    const printerSelect = document.getElementById('printerSelect').value;
    
    if (orgName) localStorage.setItem('orgName', orgName);
    if (footerMessage) localStorage.setItem('footerMessage', footerMessage);
    if (logoHeader && logoHeader !== window.location.href) localStorage.setItem('logoHeader', logoHeader);
    if (logoTicket && logoTicket !== window.location.href) localStorage.setItem('logoTicket', logoTicket);
    if (resetTime) localStorage.setItem('resetTime', resetTime);
    if (paperWidth) localStorage.setItem('paperWidth', paperWidth);
    if (printerSelect) localStorage.setItem('printerSelect', printerSelect);
    
    showAlert('تم حفظ الإعدادات بنجاح!', 'success');
    loadSettings();
}

// ========== تحميل الإعدادات ==========
function loadSettings() {
    const orgName = localStorage.getItem('orgName');
    const footerMessage = localStorage.getItem('footerMessage');
    const logoHeader = localStorage.getItem('logoHeader');
    const logoTicket = localStorage.getItem('logoTicket');
    const resetTime = localStorage.getItem('resetTime');
    const paperWidth = localStorage.getItem('paperWidth');
    const printerSelect = localStorage.getItem('printerSelect');
    
    if (orgName) document.getElementById('orgName').value = orgName;
    if (footerMessage) document.getElementById('footerMessage').value = footerMessage;
    if (resetTime) document.getElementById('resetTime').value = resetTime;
    if (paperWidth) document.getElementById('paperWidth').value = paperWidth;
    if (printerSelect) document.getElementById('printerSelect').value = printerSelect;
    
    if (logoHeader) {
        document.getElementById('headerLogo').src = logoHeader;
        document.getElementById('headerLogo').style.display = 'block';
        document.getElementById('logoPreviewHeader').src = logoHeader;
        document.getElementById('logoPreviewHeader').style.display = 'block';
    }
    
    if (logoTicket) {
        document.getElementById('logoPreviewTicket').src = logoTicket;
        document.getElementById('logoPreviewTicket').style.display = 'block';
    }
}

// ========== طباعة تجريبية ==========
function testPrint() {
    const testTicket = {
        queueNumber: '000',
        customerName: 'اختبار',
        serviceType: 'اختبار الطباعة',
        date: new Date().toLocaleDateString('ar-SA'),
        time: new Date().toLocaleTimeString('ar-SA')
    };
    showPrintModal(testTicket);
    showAlert('تم فتح نافذة الطباعة التجريبية', 'info');
}

// ========== إعادة تعيين العداد ==========
function resetCounter() {
    if (confirm('هل أنت متأكد من إعادة تعيين العداد إلى 1؟')) {
        currentQueue = 1;
        localStorage.setItem('currentQueue', currentQueue);
        updateQueueDisplay();
        showAlert('تم إعادة تعيين العداد بنجاح!', 'success');
    }
}

// ========== تصفير فوري ==========
function resetCounterNow() {
    if (confirm('هل أنت متأكد من التصفير الفوري للعداد؟')) {
        resetCounter();
    }
}

// ========== التحقق من التصفير اليومي ==========
function checkDailyReset() {
    const resetTime = localStorage.getItem('resetTime') || '05:00';
    const now = new Date();
    const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    const lastReset = localStorage.getItem('lastReset');
    const today = now.toDateString();
    
    if (currentTime === resetTime && lastReset !== today) {
        currentQueue = 1;
        localStorage.setItem('currentQueue', currentQueue);
        localStorage.setItem('lastReset', today);
        updateQueueDisplay();
    }
}

// ========== حذف السجل ==========
function clearHistory() {
    if (confirm('هل أنت متأكد من حذف جميع السجلات؟ لا يمكن التراجع عن هذا الإجراء!')) {
        ticketHistory = [];
        localStorage.setItem('ticketHistory', JSON.stringify(ticketHistory));
        showAlert('تم حذف السجل بنجاح!', 'success');
        loadHistory();
    }
}

// ========== إعادة تعيين كامل ==========
function resetAll() {
    if (confirm('هل أنت متأكد من إعادة تعيين جميع البيانات والإعدادات؟ لا يمكن التراجع عن هذا الإجراء!')) {
        if (confirm('تحذير أخير: سيتم حذف كل شيء!')) {
            localStorage.clear();
            currentQueue = 1;
            ticketHistory = [];
            adminPassword = '1234';
            showAlert('تم إعادة تعيين كل شيء! سيتم تحديث الصفحة...', 'info');
            setTimeout(() => location.reload(), 2000);
        }
    }
}

// ========== تحميل السجل ==========
function loadHistory() {
    const tbody = document.getElementById('historyBody');
    tbody.innerHTML = '';
    
    if (ticketHistory.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color: #999;">لا توجد بيانات</td></tr>';
        return;
    }
    
    const sortedHistory = [...ticketHistory].reverse();
    
    sortedHistory.forEach((ticket, index) => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${ticket.queueNumber}</td>
            <td>${ticket.customerName}</td>
            <td>${ticket.serviceType}</td>
            <td>${ticket.date} ${ticket.time}</td>
            <td><span class="badge badge-success">${ticket.status}</span></td>
        `;
    });
}

// ========== فلترة السجل ==========
function filterHistory() {
    const searchValue = document.getElementById('searchHistory').value.toLowerCase();
    const tbody = document.getElementById('historyBody');
    const rows = tbody.getElementsByTagName('tr');
    
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchValue) ? '' : 'none';
    }
}

// ========== تحميل الإحصائيات ==========
function loadStats() {
    const now = new Date();
    const today = now.toDateString();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const todayTickets = ticketHistory.filter(t => new Date(t.timestamp).toDateString() === today).length;
    const weekTickets = ticketHistory.filter(t => new Date(t.timestamp) >= weekAgo).length;
    const monthTickets = ticketHistory.filter(t => new Date(t.timestamp) >= monthAgo).length;
    
    document.getElementById('totalTickets').textContent = ticketHistory.length;
    document.getElementById('todayTickets').textContent = todayTickets;
    document.getElementById('weekTickets').textContent = weekTickets;
    document.getElementById('monthTickets').textContent = monthTickets;
    
    loadServicesChart();
    loadHourlyChart();
}

// ========== رسم بياني للخدمات الأكثر طلباً ==========
function loadServicesChart() {
    const serviceCount = {};
    ticketHistory.forEach(ticket => {
        serviceCount[ticket.serviceType] = (serviceCount[ticket.serviceType] || 0) + 1;
    });
    
    const chartDiv = document.getElementById('servicesChart');
    
    if (Object.keys(serviceCount).length === 0) {
        chartDiv.innerHTML = '<p style="text-align: center; color: #999;">لا توجد بيانات</p>';
        return;
    }
    
    const sorted = Object.entries(serviceCount).sort((a, b) => b[1] - a[1]);
    const maxCount = sorted[0][1];
    
    let html = '';
    sorted.forEach(([service, count]) => {
        const percentage = (count / maxCount) * 100;
        html += `
            <div style="margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span style="font-weight: 600;">${service}</span>
                    <span style="color: #016948; font-weight: bold;">${count}</span>
                </div>
                <div style="background: #e0e0e0; height: 25px; border-radius: 5px; overflow: hidden;">
                    <div style="background: linear-gradient(135deg, #018b72, #016948); height: 100%; width: ${percentage}%; transition: width 0.5s ease;"></div>
                </div>
            </div>
        `;
    });
    
    chartDiv.innerHTML = html;
}

// ========== رسم بياني للتوزيع بالساعات ==========
function loadHourlyChart() {
    const hourCount = {};
    for (let i = 0; i < 24; i++) {
        hourCount[i] = 0;
    }
    
    ticketHistory.forEach(ticket => {
        const hour = new Date(ticket.timestamp).getHours();
        hourCount[hour]++;
    });
    
    const chartDiv = document.getElementById('hourlyChart');
    
    const totalTickets = ticketHistory.length;
    if (totalTickets === 0) {
        chartDiv.innerHTML = '<p style="text-align: center; color: #999;">لا توجد بيانات</p>';
        return;
    }
    
    const maxCount = Math.max(...Object.values(hourCount));
    
    let html = '<div style="display: flex; align-items: flex-end; justify-content: space-between; height: 200px; gap: 3px;">';
    
    for (let hour = 0; hour < 24; hour++) {
        const count = hourCount[hour];
        const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
        html += `
            <div style="flex: 1; display: flex; flex-direction: column; align-items: center;">
                <div style="font-size: 10px; color: #016948; font-weight: bold; margin-bottom: 5px;">${count > 0 ? count : ''}</div>
                <div style="background: linear-gradient(to top, #016948, #018b72); width: 100%; height: ${height}%; min-height: ${count > 0 ? '5px' : '0'}; border-radius: 3px 3px 0 0;"></div>
                <div style="font-size: 9px; color: #666; margin-top: 5px;">${hour}</div>
            </div>
        `;
    }
    
    html += '</div>';
    chartDiv.innerHTML = html;
}

// ========== تصدير CSV ==========
function exportToCSV() {
    if (ticketHistory.length === 0) {
        showAlert('لا توجد بيانات للتصدير', 'error');
        return;
    }
    
    let csv = 'الرقم,رقم الهوية,الخدمة,التاريخ,الوقت,الحالة\n';
    ticketHistory.forEach(ticket => {
        csv += `${ticket.queueNumber},${ticket.customerName},${ticket.serviceType},${ticket.date},${ticket.time},${ticket.status}\n`;
    });
    
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `tickets_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showAlert('تم تحميل ملف CSV بنجاح!', 'success');
}

// ========== تصدير JSON ==========
function exportToJSON() {
    if (ticketHistory.length === 0) {
        showAlert('لا توجد بيانات للتصدير', 'error');
        return;
    }
    
    const dataStr = JSON.stringify(ticketHistory, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `tickets_${new Date().getTime()}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showAlert('تم تحميل ملف JSON بنجاح!', 'success');
}

// ========== عرض التنبيهات ==========
function showAlert(message, type) {
    const alertContainer = document.getElementById('alertContainer');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    alertContainer.appendChild(alert);
    
    setTimeout(() => {
        alert.style.animation = 'slideDown 0.3s ease reverse';
        setTimeout(() => alert.remove(), 300);
    }, 3000);
}

// ========== فتح نافذة تسجيل دخول المسؤول ==========
function openAdminLoginModal() {
    document.getElementById('adminLoginModal').classList.add('active');
    document.getElementById('adminPasswordInput').value = '';
    document.getElementById('adminPasswordInput').focus();
}

// ========== إغلاق نافذة تسجيل دخول المسؤول ==========
function closeAdminLoginModal() {
    document.getElementById('adminLoginModal').classList.remove('active');
}

// ========== إرسال كلمة مرور المسؤول ==========
function submitAdminPassword() {
    const inputPassword = document.getElementById('adminPasswordInput').value;
    
    if (inputPassword === adminPassword) {
        isAdminAuthenticated = true;
        closeAdminLoginModal();
        openAdminMenuModal();
    } else {
        showAlert('كلمة المرور غير صحيحة!', 'error');
        document.getElementById('adminPasswordInput').value = '';
    }
}

// ========== فتح قائمة المسؤول ==========
function openAdminMenuModal() {
    document.getElementById('adminMenuModal').classList.add('active');
}

// ========== إغلاق قائمة المسؤول ==========
function closeAdminMenuModal() {
    document.getElementById('adminMenuModal').classList.remove('active');
}

// ========== فتح تبويب محمي ==========
function openProtectedTab(tabName) {
    closeAdminMenuModal();
    
    const tabsContainer = document.querySelector('.tabs');
    
    // إضافة زر الإعدادات إذا لم يكن موجوداً
    if (!document.getElementById('settingsTabBtn')) {
        const settingsBtn = document.createElement('button');
        settingsBtn.id = 'settingsTabBtn';
        settingsBtn.className = 'tab-btn';
        settingsBtn.onclick = (e) => showTab('settings', e);
        settingsBtn.textContent = 'الإعدادات';
        tabsContainer.appendChild(settingsBtn);
    }
    
    // إضافة زر السجل إذا لم يكن موجوداً
    if (!document.getElementById('historyTabBtn')) {
        const historyBtn = document.createElement('button');
        historyBtn.id = 'historyTabBtn';
        historyBtn.className = 'tab-btn';
        historyBtn.onclick = (e) => showTab('history', e);
        historyBtn.textContent = 'السجل';
        tabsContainer.appendChild(historyBtn);
    }
    
    // إضافة زر الإحصائيات إذا لم يكن موجوداً
    if (!document.getElementById('statsTabBtn')) {
        const statsBtn = document.createElement('button');
        statsBtn.id = 'statsTabBtn';
        statsBtn.className = 'tab-btn';
        statsBtn.onclick = (e) => showTab('stats', e);
        statsBtn.textContent = 'الإحصائيات';
        tabsContainer.appendChild(statsBtn);
    }
    
    // فتح التبويب المطلوب
    let targetButton;
    if (tabName === 'settings') {
        targetButton = document.getElementById('settingsTabBtn');
    } else if (tabName === 'history') {
        targetButton = document.getElementById('historyTabBtn');
    } else if (tabName === 'stats') {
        targetButton = document.getElementById('statsTabBtn');
    }
    
    if (targetButton) {
        showTab(tabName, { target: targetButton });
    }
}

// ========== تغيير رمز مرور المسؤول ==========
function changeAdminPassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
        showAlert('الرجاء ملء جميع الحقول', 'error');
        return;
    }
    
    if (currentPassword !== adminPassword) {
        showAlert('رمز المرور الحالي غير صحيح!', 'error');
        document.getElementById('currentPassword').value = '';
        return;
    }
    
    if (newPassword.length < 4) {
        showAlert('رمز المرور الجديد يجب أن يكون 4 أحرف على الأقل', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showAlert('رمز المرور الجديد غير متطابق!', 'error');
        document.getElementById('confirmPassword').value = '';
        return;
    }
    
    if (newPassword === currentPassword) {
        showAlert('رمز المرور الجديد يجب أن يكون مختلفاً عن القديم', 'error');
        return;
    }
    
    adminPassword = newPassword;
    localStorage.setItem('adminPassword', newPassword);
    
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
    
    showAlert('تم تغيير رمز المرور بنجاح! ✓', 'success');
}


// ========== دعم Enter للنماذج ==========
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('adminPasswordInput')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            submitAdminPassword();
        }
    });
});
