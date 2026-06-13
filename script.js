document.addEventListener('DOMContentLoaded', function () {
  const imageInput           = document.getElementById('imageInput');
  const logoInput            = document.getElementById('logoInput');
  const templateInput        = document.getElementById('templateInput');
  const imageCountLabel      = document.getElementById('imageCountLabel');
  const logoStatusLabel      = document.getElementById('logoStatusLabel');
  const templateStatusLabel  = document.getElementById('templateStatusLabel');
  const logoSizeSlider       = document.getElementById('logoSize');
  const logoOpacitySlider    = document.getElementById('logoOpacity');
  const templateOpacitySlider= document.getElementById('templateOpacity');
  const logoPositionSelect   = document.getElementById('logoPosition');
  const previewCanvas        = document.getElementById('previewCanvas');
  const previewArea          = document.getElementById('previewArea');
  const previewPlaceholder   = document.getElementById('previewPlaceholder');
  const processButton        = document.getElementById('processButton');
  const resetButton          = document.getElementById('resetButton');
  const progressBar          = document.getElementById('progressBar');
  const progressLabel        = document.getElementById('progressLabel');
  const postProcessModal     = document.getElementById('post-process-modal');
  const progressContainer    = document.getElementById('progress-container');
  const postProcessMessage   = document.getElementById('post-process-message');
  const btnKeepSettings      = document.getElementById('btn-keep-settings');
  const btnResetAfterProcess = document.getElementById('btn-reset-after-process');
  const btnResetLogo         = document.getElementById('btn-reset-logo');
  const btnResetTemplate     = document.getElementById('btn-reset-template');
  const infoOverlay          = document.querySelector('.info-overlay');
  const previewNav           = document.getElementById('previewNav');
  const previewIndexLabel    = document.getElementById('previewIndexLabel');
  const btnPrevImage         = document.getElementById('btnPrevImage');
  const btnNextImage         = document.getElementById('btnNextImage');

  let imageFiles          = [];
  let preloadedLogo       = null;
  let preloadedTemplate   = null;
  let preloadedBaseImage  = null;
  let currentPreviewIndex = 0;

  // --- كشف نوع الجهاز ---
  function isMobileDevice() {
    return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  }
  function isIOS() {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  // --- منطق التبويبات ---
  window.openTab = function (evt, tabName) {
    document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
    document.querySelectorAll('.tab-link').forEach(t => t.classList.remove('active'));
    document.getElementById(tabName).style.display = 'block';
    evt.currentTarget.classList.add('active');
  };

  // --- تحميل صورة كـ Promise ---
  function loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
      if (!file) return reject(new Error('لا يوجد ملف'));
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('فشل تحميل: ' + file.name));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('فشل قراءة الملف'));
      reader.readAsDataURL(file);
    });
  }

  // --- رسم الشعار ---
  function drawLogo(ctx, drawW, drawH, offsetX, offsetY) {
    if (!preloadedLogo) return;
    const scale   = logoSizeSlider.value / 100;
    const lw      = drawW * scale;
    const lh      = lw * (preloadedLogo.height / preloadedLogo.width);
    const margin  = Math.max(10, drawW * 0.02);
    const pos = {
      'Top-Left':     [offsetX + margin,           offsetY + margin],
      'Top-Right':    [offsetX + drawW - lw - margin, offsetY + margin],
      'Bottom-Left':  [offsetX + margin,           offsetY + drawH - lh - margin],
      'Bottom-Right': [offsetX + drawW - lw - margin, offsetY + drawH - lh - margin],
      'Center':       [offsetX + (drawW - lw) / 2, offsetY + (drawH - lh) / 2],
    };
    const [lx, ly] = pos[logoPositionSelect.value] || pos['Bottom-Right'];
    ctx.globalAlpha = logoOpacitySlider.value / 100;
    ctx.drawImage(preloadedLogo, lx, ly, lw, lh);
    ctx.globalAlpha = 1.0;
  }

  // --- محرك المعاينة ---
  window.updateLivePreview = function () {
    if (!preloadedBaseImage) {
      previewCanvas.style.display = 'none';
      previewPlaceholder.style.display = 'block';
      return;
    }
    previewCanvas.style.display = 'block';
    previewPlaceholder.style.display = 'none';

    const ctx = previewCanvas.getContext('2d');
    const cW  = previewArea.clientWidth  || 300;
    const cH  = previewArea.clientHeight || 300;
    previewCanvas.width  = cW;
    previewCanvas.height = cH;

    const mode = document.querySelector('input[name="imageSizeMode"]:checked').value;
    let tW = preloadedBaseImage.width;
    let tH = preloadedBaseImage.height;
    if (mode === 'fit_to_template' && preloadedTemplate) {
      tW = preloadedTemplate.width;
      tH = preloadedTemplate.height;
    }

    const scale  = Math.min(cW / tW, cH / tH);
    const dW     = tW * scale;
    const dH     = tH * scale;
    const offX   = (cW - dW) / 2;
    const offY   = (cH - dH) / 2;

    ctx.clearRect(0, 0, cW, cH);
    ctx.drawImage(preloadedBaseImage, offX, offY, dW, dH);

    if (preloadedTemplate) {
      ctx.globalAlpha = templateOpacitySlider.value / 100;
      ctx.drawImage(preloadedTemplate, offX, offY, dW, dH);
      ctx.globalAlpha = 1.0;
    }
    drawLogo(ctx, dW, dH, offX, offY);
  };

  // --- محرك المعالجة النهائية ---
  function drawOnCanvasForProcessing(canvas, baseImage) {
    return new Promise((resolve) => {
      const mode = document.querySelector('input[name="imageSizeMode"]:checked').value;
      let tW = baseImage.width;
      let tH = baseImage.height;
      if (mode === 'fit_to_template' && preloadedTemplate) {
        tW = preloadedTemplate.width;
        tH = preloadedTemplate.height;
      }
      canvas.width  = tW;
      canvas.height = tH;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, tW, tH);
      ctx.drawImage(baseImage, 0, 0, tW, tH);
      if (preloadedTemplate) {
        ctx.globalAlpha = templateOpacitySlider.value / 100;
        ctx.drawImage(preloadedTemplate, 0, 0, tW, tH);
        ctx.globalAlpha = 1.0;
      }
      drawLogo(ctx, tW, tH, 0, 0);
      resolve(canvas);
    });
  }

  // --- تحميل صورة واحدة متوافق مع جميع البيئات ---
  async function downloadSingleImage(canvas, fileName) {
    const qualityEl = document.getElementById('exportQuality');
    const quality   = qualityEl ? parseFloat(qualityEl.value) / 100 : 0.95;
    const dataUrl   = canvas.toDataURL('image/jpeg', quality);

    if (isIOS()) {
      const newTab = window.open();
      if (newTab) {
        newTab.document.write(
          '<html><head><title>' + fileName + '</title>' +
          '<meta name="viewport" content="width=device-width"></head>' +
          '<body style="margin:0;background:#000;display:flex;flex-direction:column;' +
          'justify-content:center;align-items:center;min-height:100vh;">' +
          '<img src="' + dataUrl + '" style="max-width:100%;max-height:90vh;" />' +
          '<p style="color:white;font-family:Arial;font-size:14px;margin:12px;text-align:center;">' +
          'اضغط مطوّلاً على الصورة ثم اختر "حفظ الصورة"</p>' +
          '</body></html>'
        );
        newTab.document.close();
      }
    } else {
      const link    = document.createElement('a');
      link.href     = dataUrl;
      link.download = fileName + '.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      await new Promise(r => setTimeout(r, 300));
    }
  }

  // --- بدء المعالجة ---
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

    const tempCanvas   = document.createElement('canvas');
    let   successCount = 0;
    let   failCount    = 0;

    for (let i = 0; i < imageFiles.length; i++) {
      try {
        const baseImage = await loadImageFromFile(imageFiles[i]);
        await drawOnCanvasForProcessing(tempCanvas, baseImage);
        const baseName = imageFiles[i].name.replace(/\.[^/.]+$/, '');
        await downloadSingleImage(tempCanvas, baseName + '_wasim');
        successCount++;
      } catch (err) {
        console.error('خطأ:', imageFiles[i].name, err);
        failCount++;
      }
      const pct = Math.round(((i + 1) / imageFiles.length) * 100);
      if (progressBar)   progressBar.value = pct;
      if (progressLabel) progressLabel.textContent = (i + 1) + ' / ' + imageFiles.length;
    }

    processButton.disabled = false;
    resetButton.disabled   = false;
    if (progressContainer)  progressContainer.style.display = 'none';
    if (postProcessMessage) {
      postProcessMessage.style.display = 'block';
      postProcessMessage.textContent   = failCount > 0
        ? 'تمت معالجة ' + successCount + ' صورة بنجاح، وفشلت ' + failCount + '.'
        : 'تم تحميل ' + successCount + ' صورة بنجاح. ماذا تريد أن تفعل الآن؟';
    }
  }

  // --- حفظ الإعدادات ---
  function saveSettings() {
    const mode = document.querySelector('input[name="imageSizeMode"]:checked');
    localStorage.setItem('rakaz_app_settings', JSON.stringify({
      logoSize:        logoSizeSlider.value,
      logoOpacity:     logoOpacitySlider.value,
      logoPosition:    logoPositionSelect.value,
      templateOpacity: templateOpacitySlider.value,
      imageSizeMode:   mode ? mode.value : 'fit_to_template',
    }));
  }

  // --- تحميل الإعدادات ---
  function loadSettings() {
    const saved = localStorage.getItem('rakaz_app_settings');
    if (!saved) return;
    try {
      const s = JSON.parse(saved);
      if (s.logoSize)        { logoSizeSlider.value = s.logoSize; document.getElementById('logoSizeValue').textContent = s.logoSize; }
      if (s.logoOpacity)     { logoOpacitySlider.value = s.logoOpacity; document.getElementById('logoOpacityValue').textContent = s.logoOpacity; }
      if (s.logoPosition)    { logoPositionSelect.value = s.logoPosition; }
      if (s.templateOpacity) { templateOpacitySlider.value = s.templateOpacity; document.getElementById('templateOpacityValue').textContent = s.templateOpacity; }
      if (s.imageSizeMode) {
        const radio = document.querySelector('input[name="imageSizeMode"][value="' + s.imageSizeMode + '"]');
        if (radio) radio.checked = true;
      }
    } catch (e) { console.warn('خطأ في تحميل الإعدادات', e); }
  }

  // --- إعادة تعيين الشعار ---
  function resetLogo() {
    preloadedLogo = null;
    logoInput.value = '';
    logoStatusLabel.textContent = 'لا يوجد شعار';
    updateLivePreview();
  }

  // --- إعادة تعيين القالب ---
  function resetTemplate() {
    preloadedTemplate = null;
    templateInput.value = '';
    templateStatusLabel.textContent = 'لا يوجد قالب';
    updateLivePreview();
  }

  // --- إعادة ضبط الكل ---
  function resetAll() {
    imageFiles          = [];
    preloadedBaseImage  = null;
    currentPreviewIndex = 0;
    imageInput.value    = '';
    imageCountLabel.textContent = '0 صورة';
    resetLogo();
    resetTemplate();
    logoSizeSlider.value      = 15;
    logoOpacitySlider.value   = 100;
    logoPositionSelect.value  = 'Bottom-Right';
    templateOpacitySlider.value = 100;
    document.querySelector('input[name="imageSizeMode"][value="fit_to_template"]').checked = true;
    document.getElementById('logo
