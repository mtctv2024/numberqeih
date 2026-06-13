document.addEventListener('DOMContentLoaded', function () {

  // --- تعريفات العناصر ---
  const imageInput          = document.getElementById('imageInput');
  const logoInput           = document.getElementById('logoInput');
  const templateInput       = document.getElementById('templateInput');
  const imageCountLabel     = document.getElementById('imageCountLabel');
  const logoStatusLabel     = document.getElementById('logoStatusLabel');
  const templateStatusLabel = document.getElementById('templateStatusLabel');
  const logoSizeSlider      = document.getElementById('logoSize');
  const logoOpacitySlider   = document.getElementById('logoOpacity');
  const templateOpacitySlider = document.getElementById('templateOpacity');
  const logoPositionSelect  = document.getElementById('logoPosition');
  const previewCanvas       = document.getElementById('previewCanvas');
  const previewArea         = document.getElementById('previewArea');
  const previewPlaceholder  = document.getElementById('previewPlaceholder');
  const processButton       = document.getElementById('processButton');
  const resetButton         = document.getElementById('resetButton');
  const progressBar         = document.getElementById('progressBar');
  const progressLabel       = document.getElementById('progressLabel');
  const postProcessModal    = document.getElementById('post-process-modal');
  const progressContainer   = document.getElementById('progress-container');
  const postProcessMessage  = document.getElementById('post-process-message');
  const btnKeepSettings     = document.getElementById('btn-keep-settings');
  const btnResetAfterProcess = document.getElementById('btn-reset-after-process');
  const btnResetLogo        = document.getElementById('btn-reset-logo');
  const btnResetTemplate    = document.getElementById('btn-reset-template');
  const infoOverlay         = document.querySelector('.info-overlay');

  // --- متغيرات الحالة ---
  let imageFiles       = [];
  let preloadedLogo    = null;
  let preloadedTemplate = null;
  let preloadedBaseImage = null;
  let currentPreviewIndex = 0; // ✅ جديد: تتبع الصورة الحالية في المعاينة

  // ============================================================
  // --- كشف نوع الجهاز ---
  // ============================================================
  function isMobileDevice() {
    return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  }
  function isIOS() {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }
  function isAndroid() {
    return /Android/i.test(navigator.userAgent);
  }

  // ============================================================
  // --- منطق التبويبات ---
  // ============================================================
  window.openTab = function (evt, tabName) {
    document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
    document.querySelectorAll('.tab-link').forEach(t => t.classList.remove('active'));
    document.getElementById(tabName).style.display = 'block';
    evt.currentTarget.classList.add('active');
  };

  // ============================================================
  // --- تحميل صورة كـ Promise ---
  // ============================================================
  function loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
      if (!file) return reject(new Error('لا يوجد ملف'));
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('فشل تحميل الصورة: ' + file.name));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('فشل قراءة الملف'));
      reader.readAsDataURL(file);
    });
  }

  // ============================================================
  // --- رسم الشعار على الـ canvas ---
  // ============================================================
  function drawLogo(ctx, canvasW, canvasH, offsetX, offsetY, drawW, drawH) {
    if (!preloadedLogo) return;
    const logoScale = logoSizeSlider.value / 100;
    const logoRatio = preloadedLogo.width / preloadedLogo.height;
    const lw = drawW * logoScale;
    const lh = lw / logoRatio;
    const margin = Math.max(10, drawW * 0.02);
    const positions = {
      'Top-Left':     [offsetX + margin, offsetY + margin],
      'Top-Right':    [offsetX + drawW - lw - margin, offsetY + margin],
      'Bottom-Left':  [offsetX + margin, offsetY + drawH - lh - margin],
      'Bottom-Right': [offsetX + drawW - lw - margin, offsetY + drawH - lh - margin],
      'Center':       [offsetX + (drawW - lw) / 2, offsetY + (drawH - lh) / 2],
    };
    const [lx, ly] = positions[logoPositionSelect.value] || positions['Bottom-Right'];
    ctx.globalAlpha = logoOpacitySlider.value / 100;
    ctx.drawImage(preloadedLogo, lx, ly, lw, lh);
    ctx.globalAlpha = 1.0;
  }

  // ============================================================
  // --- ✅ محرك الرسم للمعاينة ---
  // ============================================================
  window.updateLivePreview = function () {
    if (!preloadedBaseImage) {
      previewCanvas.style.display = 'none';
      previewPlaceholder.style.display = 'block';
      return;
    }
    previewCanvas.style.display = 'block';
    previewPlaceholder.style.display = 'none';

    const ctx = previewCanvas.getContext('2d');
    const containerW = previewArea.clientWidth  || 300;
    const containerH = previewArea.clientHeight || 300;
    previewCanvas.width  = containerW;
    previewCanvas.height = containerH;

    const imageSizeMode = document.querySelector('input[name="imageSizeMode"]:checked').value;
    let targetW = preloadedBaseImage.width;
    let targetH = preloadedBaseImage.height;
    if (imageSizeMode === 'fit_to_template' && preloadedTemplate) {
      targetW = preloadedTemplate.width;
      targetH = preloadedTemplate.height;
    }

    const scale  = Math.min(containerW / targetW, containerH / targetH);
    const drawW  = targetW * scale;
    const drawH  = targetH * scale;
    const offsetX = (containerW - drawW) / 2;
    const offsetY = (containerH - drawH) / 2;

    ctx.clearRect(0, 0, containerW, containerH);
    ctx.drawImage(preloadedBaseImage, offsetX, offsetY, drawW, drawH);

    if (preloadedTemplate) {
      ctx.globalAlpha = templateOpacitySlider.value / 100;
      ctx.drawImage(preloadedTemplate, offsetX, offsetY, drawW, drawH);
      ctx.globalAlpha = 1.0;
    }

    drawLogo(ctx, containerW, containerH, offsetX, offsetY, drawW, drawH);
  };

  // ============================================================
  // --- ✅ محرك الرسم للمعالجة النهائية (بالأبعاد الحقيقية) ---
  // ============================================================
  function drawOnCanvasForProcessing(canvas, baseImage) {
    return new Promise((resolve) => {
      const imageSizeMode = document.querySelector('input[name="imageSizeMode"]:checked').value;
      let targetW = baseImage.width;
      let targetH = baseImage.height;
      if (imageSizeMode === 'fit_to_template' && preloadedTemplate) {
        targetW = preloadedTemplate.width;
        targetH = preloadedTemplate.height;
      }
      canvas.width  = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');

      ctx.clearRect(0, 0, targetW, targetH);
      ctx.drawImage(baseImage, 0, 0, targetW, targetH);

      if (preloadedTemplate) {
        ctx.globalAlpha = templateOpacitySlider.value / 100;
        ctx.drawImage(preloadedTemplate, 0, 0, targetW, targetH);
        ctx.globalAlpha = 1.0;
      }

      drawLogo(ctx, targetW, targetH, 0, 0, targetW, targetH);
      resolve(canvas);
    });
  }

  // ============================================================
  // --- ✅ تحميل صورة واحدة (متوافق مع Web / Android / iOS) ---
  // ============================================================
  async function downloadSingleImage(canvas, fileName) {
    const quality = parseFloat(
      (document.getElementById('exportQuality') || { value: '0.95' }).value
    );
    const dataUrl = canvas.toDataURL('image/jpeg', quality);

    if (isIOS()) {
      // iOS: نفتح الصورة في تبويب جديد - المستخدم يضغط مطوّلاً للحفظ
      const newTab = window.open();
      if (newTab) {
        newTab.document.write(
          `<html><head><title>${fileName}</title><meta name="viewport" content="width=device-width"></head>` +
          `<body style="margin:0;background:#000;display:flex;justify-content:center;align-items:center;min-height:100vh;">` +
          `<img src="${dataUrl}" style="max-width:100%;max-height:100vh;" />`+
          `<p style="position:fixed;bottom:10px;width:100%;text-align:center;color:white;font-size:14px;font-family:Arial;">` +
          `اضغط مطوّلاً على الصورة ثم اختر "حفظ"</p></body></html>`
        );
        newTab.document.close();
      } else {
        // Fallback: إذا حُجب التبويب الجديد
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = fileName + '.jpg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } else {
      // Web / Android: تحميل مباشر
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = fileName + '.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      // تأخير بسيط بين الصور لتجنب حجب المتصفح
      await new Promise(r => setTimeout(r, 300));
    }
  }

  // ============================================================
  // --- ✅ دالة بدء المعالجة الرئيسية ---
  // ============================================================
  async function startProcessing() {
    if (imageFiles.length === 0) {
      alert('الرجاء اختيار مجموعة صور أولاً.');
      return;
    }

    processButton.disabled = true;
    resetButton.disabled   = true;

    if (progressContainer)  progressContainer.style.display  = 'block';
    if (postProcessMessage) postProcessMessage.style.display = 'none';
    if (progressBar)        progressBar.value = 0;
    if (progressLabel)      progressLabel.textContent = '0 / ' + imageFiles.length;
    postProcessModal.style.display = 'flex';

    const tempCanvas = document.createElement('canvas');
    let successCount = 0;
    let failCount    = 0;

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];

      try {
        // تحميل الصورة
        const baseImage = await loadImageFromFile(file);

        // الرسم على الـ canvas
        await drawOnCanvasForProcessing(tempCanvas, baseImage);

        // استخراج اسم الملف بدون امتداد
        const baseName = file.name.replace(/\.[^/.]+$/, '');

        // تحميل الصورة المعالجة
        await downloadSingleImage(tempCanvas, baseName + '_wasim');

        successCount++;
      } catch (err) {
        console.error('خطأ في معالجة:', file.name, err);
        failCount++;
      }

      // تحديث شريط التقدم
      const progress = Math.round(((i + 1) / imageFiles.length) * 100);
      if (progressBar)   progressBar.value = progress;
      if (progressLabel) progressLabel.textContent = (i + 1) + ' / ' + imageFiles.length;
    }

    processButton.disabled = false;
    resetButton.disabled   = false;

    if (progressContainer)  progressContainer.style.display = 'none';
    if (postProcessMessage) {
      postProcessMessage.style.display = 'block';
      if (failCount > 0) {
        postProcessMessage.textContent =
          `تمت معالجة ${successCount} صورة بنجاح، وفشلت ${failCount} صورة.`;
      } else {
        postProcessMessage.textContent =
          `تم تحميل ${successCount} صورة بنجاح. ماذا تريد أن تفعل الآن؟`;
      }
    }
  }

  // ============================================================
  // --- حفظ / تحميل الإعدادات ---
  // ============================================================
  function saveSettings() {
    const settings = {
      logoSize:      logoSizeSlider.value,
      logoOpacity:   logoOpacitySlider.value,
      logoPosition:  logoPositionSelect.value,
      templateOpacity: templateOpacitySlider.value,
      imageSizeMode: document.querySelector('input[name="imageSizeMode"]:checked').value,
    };
    localStorage.setItem('rakaz_app_settings', JSON.stringify(settings));
  }

  function loadSettings() {
    const saved = localStorage.getItem('rakaz_app_settings');
    if (!saved) return;
    try {
      const s = JSON.parse(saved);
      if (s.logoSize)      { logoSizeSlider.value = s.logoSize; document.getElementById('logoSizeValue').textContent = s.logoSize; }
      if (s.logoOpacity)   { logoOpacitySlider.value = s.logoOpacity; document.getElementById('logoOpacityValue').textContent = s.logoOpacity; }
      if (s.logoPosition)  { logoPositionSelect.value = s.logoPosition; }
      if (s.templateOpacity) { templateOpacitySlider.value = s.templateOpacity; document.getElementById('templateOpacityValue').textContent = s.templateOpacity; }
