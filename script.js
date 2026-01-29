document.addEventListener('DOMContentLoaded', function() {

    // (كل تعريفات العناصر تبقى كما هي)
    const imageInput = document.getElementById('imageInput');
    const logoInput = document.getElementById('logoInput');
    const templateInput = document.getElementById('templateInput');
    const imageCountLabel = document.getElementById('imageCountLabel');
    const logoStatusLabel = document.getElementById('logoStatusLabel');
    const templateStatusLabel = document.getElementById('templateStatusLabel');
    const logoSizeSlider = document.getElementById('logoSize');
    const logoOpacitySlider = document.getElementById('logoOpacity');
    const templateOpacitySlider = document.getElementById('templateOpacity');
    const logoPositionSelect = document.getElementById('logoPosition');
    const previewCanvas = document.getElementById('previewCanvas');
    const previewPlaceholder = document.getElementById('previewPlaceholder');
    const processButton = document.getElementById('processButton');
    const resetButton = document.getElementById('resetButton');
    const progressBar = document.getElementById('progressBar');
    const progressLabel = document.getElementById('progressLabel');
    const postProcessModal = document.getElementById('post-process-modal');
    const btnKeepSettings = document.getElementById('btn-keep-settings');
    const btnResetAfterProcess = document.getElementById('btn-reset-after-process');
    const cameraModal = document.getElementById('camera-modal');
    const btnTakePicture = document.getElementById('btn-take-picture');
    const btnCapturePhoto = document.getElementById('btn-capture-photo');
    const btnCancelCamera = document.getElementById('btn-cancel-camera');
    const btnSwitchCamera = document.getElementById('btn-switch-camera'); // جديد
    const videoFeed = document.getElementById('camera-feed');
    const captureCanvas = document.getElementById('capture-canvas');

    // (كل متغيرات الحالة تبقى كما هي، مع إضافة متغير جديد)
    let imageFiles = [];
    let logoFile = null;
    let templateFile = null;
    let preloadedLogo = null;
    let preloadedTemplate = null;
    let preloadedBaseImage = null;
    let cameraStream = null;
    let currentFacingMode = 'environment'; // ****** جديد: لتتبع وضع الكاميرا الحالي ******

    // ============================================================
    // ****** تعديل: إعادة كتابة منطق الكاميرا بالكامل ******
    // ============================================================
    async function startCamera() {
        // إيقاف أي بث قديم قبل البدء ببث جديد
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
        }
        
        const constraints = {
            video: { facingMode: currentFacingMode }
        };

        try {
            cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
            videoFeed.srcObject = cameraStream;
            cameraModal.style.display = 'flex';
        } catch (err) {
            console.error("خطأ في الوصول إلى الكاميرا: ", err);
            alert("لا يمكن الوصول إلى الكاميرا. قد تكون غير متاحة أو أن الإذن مرفوض.");
        }
    }

    function stopCamera() {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
        }
        cameraModal.style.display = 'none';
    }

    function switchCamera() {
        // تبديل وضع الكاميرا
        currentFacingMode = (currentFacingMode === 'environment') ? 'user' : 'environment';
        // إعادة تشغيل الكاميرا بالوضع الجديد
        startCamera();
    }

    async function capturePhoto() {
        // ... (هذه الوظيفة تبقى كما هي)
        const ctx = captureCanvas.getContext('2d');
        captureCanvas.width = videoFeed.videoWidth;
        captureCanvas.height = videoFeed.videoHeight;
        ctx.drawImage(videoFeed, 0, 0, videoFeed.videoWidth, videoFeed.videoHeight);
        const dataUrl = captureCanvas.toDataURL('image/jpeg', 0.95);
        const blob = await (await fetch(dataUrl)).blob();
        const newFile = new File([blob], `captured-${Date.now()}.jpg`, { type: 'image/jpeg' });
        imageFiles.push(newFile);
        imageCountLabel.textContent = `${imageFiles.length} صورة`;
        preloadedBaseImage = new Image();
        preloadedBaseImage.onload = updateLivePreview;
        preloadedBaseImage.src = dataUrl;
        stopCamera();
    }
    
    // (باقي الكود كما هو بدون أي تغيير)
    function saveSettings(){const settings={logoSize:logoSizeSlider.value,logoOpacity:logoOpacitySlider.value,logoPosition:logoPositionSelect.value,templateOpacity:templateOpacitySlider.value,imageSizeMode:document.querySelector('input[name="imageSizeMode"]:checked').value};localStorage.setItem('rakaz_app_settings',JSON.stringify(settings))}
    function loadSettings(){const savedSettings=localStorage.getItem('rakaz_app_settings');if(savedSettings){const settings=JSON.parse(savedSettings);logoSizeSlider.value=settings.logoSize;logoOpacitySlider.value=settings.logoOpacity;logoPositionSelect.value=settings.logoPosition;templateOpacitySlider.value=settings.templateOpacity;document.querySelector(`input[name="imageSizeMode"][value="${settings.imageSizeMode}"]`).checked=true;document.getElementById('logoSizeValue').textContent=settings.logoSize;document.getElementById('logoOpacityValue').textContent=settings.logoOpacity;document.getElementById('templateOpacityValue').textContent=settings.templateOpacity}}
    window.openTab=function(evt,tabName){let i,tabcontent,tablinks;tabcontent=document.getElementsByClassName("tab-content");for(i=0;i<tabcontent.length;i++){tabcontent[i].style.display="none"}tablinks=document.getElementsByClassName("tab-link");for(i=0;i<tablinks.length;i++){tablinks[i].className=tablinks[i].className.replace(" active","")}document.getElementById(tabName).style.display="block";evt.currentTarget.className+=" active"}
    window.updateLivePreview=function(){if(!preloadedBaseImage){previewCanvas.style.display='none';previewPlaceholder.style.display='block';return}previewCanvas.style.display='block';previewPlaceholder.style.display='none';drawOnCanvas(previewCanvas,preloadedBaseImage,()=>{})}
    function drawOnCanvas(canvas,baseImage,callback){const ctx=canvas.getContext('2d');const imageSizeMode=document.querySelector('input[name="imageSizeMode"]:checked').value;let targetWidth=baseImage.width;let targetHeight=baseImage.height;if(preloadedTemplate&&imageSizeMode==="fit_to_template"){targetWidth=preloadedTemplate.width;targetHeight=preloadedTemplate.height}canvas.width=targetWidth;canvas.height=targetHeight;ctx.drawImage(baseImage,0,0,targetWidth,targetHeight);if(preloadedTemplate){const templateOpacity=templateOpacitySlider.value/100;ctx.globalAlpha=templateOpacity;ctx.drawImage(preloadedTemplate,0,0,targetWidth,targetHeight);ctx.globalAlpha=1.0}if(preloadedLogo){const logoSettings={size_percent:logoSizeSlider.value,opacity:logoOpacitySlider.value,position:logoPositionSelect.value};const scale=logoSettings.size_percent/100;const new_w=canvas.width*scale;const new_h=preloadedLogo.height*(new_w/preloadedLogo.width);const margin=25;const positions={"Top-Left":[margin,margin],"Top-Right":[canvas.width-new_w-margin,margin],"Bottom-Left":[margin,canvas.height-new_h-margin],"Bottom-Right":[canvas.width-new_w-margin,canvas.height-new_h-margin],"Center":[(canvas.width-new_w)/2,(canvas.height-new_h)/2]};const[x,y]=positions[logoSettings.position];ctx.globalAlpha=logoSettings.opacity/100;ctx.drawImage(preloadedLogo,x,y,new_w,new_h);ctx.globalAlpha=1.0}callback(canvas)}
    async function startProcessing(){if(imageFiles.length===0){alert("لم يتم اختيار الصور");return}processButton.disabled=true;progressBar.value=0;progressLabel.textContent="0%";const tempCanvas=document.createElement('canvas');for(let i=0;i<imageFiles.length;i++){const file=imageFiles[i];const baseImage=await new Promise(resolve=>{const reader=new FileReader();reader.onload=e=>{const img=new Image();img.onload=()=>resolve(img);img.src=e.target.result};reader.readAsDataURL(file)});drawOnCanvas(tempCanvas,baseImage,(canvas)=>{const link=document.createElement('a');const fileName=file.name.split('.').slice(0,-1).join('.');link.download=`${fileName}_processed.jpg`;link.href=canvas.toDataURL('image/jpeg',0.95);link.click()});const progress=((i+1)/imageFiles.length)*100;progressBar.value=progress;progressLabel.textContent=`${Math.round(progress)}%`}processButton.disabled=false;postProcessModal.style.display='flex'}
    function resetAll(){imageFiles=[];logoFile=null;templateFile=null;preloadedLogo=null;preloadedTemplate=null;preloadedBaseImage=null;imageInput.value="";logoInput.value="";templateInput.value="";imageCountLabel.textContent='0 صورة';logoStatusLabel.textContent='لا يوجد شعار';templateStatusLabel.textContent='لا يوجد قالب';logoSizeSlider.value=15;logoOpacitySlider.value=100;templateOpacitySlider.value=100;logoPositionSelect.value="Bottom-Right";document.querySelector('input[name="imageSizeMode"][value="fit_to_template"]').checked=true;document.getElementById('logoSizeValue').textContent=15;document.getElementById('logoOpacityValue').textContent=100;document.getElementById('templateOpacityValue').textContent=100;progressBar.value=0;progressLabel.textContent='0%';localStorage.removeItem('rakaz_app_settings');updateLivePreview();alert("تمت إعادة ضبط التطبيق إلى الإعدادات الافتراضية.")}
    
    // ============================================================
    // ربط الأحداث بالعناصر
    // ============================================================
    btnTakePicture.addEventListener('click', startCamera);
    btnCapturePhoto.addEventListener('click', capturePhoto);
    btnCancelCamera.addEventListener('click', stopCamera);
    btnSwitchCamera.addEventListener('click', switchCamera); // ****** جديد ******

    // (باقي روابط الأحداث كما هي)
    imageInput.addEventListener('change',(e)=>{imageFiles=Array.from(e.target.files);imageCountLabel.textContent=`${imageFiles.length} صورة`;if(imageFiles.length>0){const reader=new FileReader();reader.onload=(event)=>{preloadedBaseImage=new Image();preloadedBaseImage.onload=updateLivePreview;preloadedBaseImage.src=event.target.result};reader.readAsDataURL(imageFiles[0])}else{preloadedBaseImage=null;updateLivePreview()}});
    logoInput.addEventListener('change',(e)=>{logoFile=e.target.files[0];logoStatusLabel.textContent=logoFile?'✔ تم اختيار الشعار':'لا يوجد شعار';if(logoFile){const reader=new FileReader();reader.onload=(event)=>{preloadedLogo=new Image();preloadedLogo.onload=updateLivePreview;preloadedLogo.src=event.target.result};reader.readAsDataURL(logoFile)}else{preloadedLogo=null;updateLivePreview()}});
    templateInput.addEventListener('change',(e)=>{templateFile=e.target.files[0];templateStatusLabel.textContent=templateFile?'✔ تم اختيار القالب':'لا يوجد قالب';if(templateFile){const reader=new FileReader();reader.onload=(event)=>{preloadedTemplate=new Image();preloadedTemplate.onload=updateLivePreview;preloadedTemplate.src=event.target.result};reader.readAsDataURL(templateFile)}else{preloadedTemplate=null;updateLivePreview()}});
    document.querySelectorAll('input[type="range"], select, input[type="radio"]').forEach(el=>{el.addEventListener('input',()=>{if(el.type==='range'){const valueSpan=document.getElementById(el.id+'Value');if(valueSpan)valueSpan.textContent=el.value}updateLivePreview();saveSettings()})});
    processButton.addEventListener('click',startProcessing);
    resetButton.addEventListener('click',resetAll);
    btnKeepSettings.addEventListener('click',()=>{postProcessModal.style.display='none'});
    btnResetAfterProcess.addEventListener('click',()=>{resetAll();postProcessModal.style.display='none'});
    
    // (منطق شاشة البداية كما هو)
    const splashScreen=document.getElementById('splash-screen');const header=document.querySelector('.header');const mainContainer=document.querySelector('.main-container');setTimeout(()=>{splashScreen.style.opacity='0'},1000);setTimeout(()=>{splashScreen.style.display='none';header.style.display='block';mainContainer.style.display='flex'},1500);
    
    loadSettings();
});
