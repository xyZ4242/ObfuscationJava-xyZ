let currentLevel = 'high';

function setLevel(level, element) {
    currentLevel = level;
    document.querySelectorAll('.level-opt').forEach(el => el.classList.remove('active'));
    element.classList.add('active');
}

// --- DETEKSI BAHASA (LANGUAGE GUARD) ---
function isLikelyNotJS(code) {
    // 1. Cek Ciri Khas Java
    if (code.includes('public class') && code.includes('static void main')) return "Terdeteksi kode JAVA, bukan JavaScript!";
    if (code.includes('System.out.println')) return "Terdeteksi kode JAVA!";
    
    // 2. Cek Ciri Khas HTML
    if (code.trim().startsWith('<!DOCTYPE html>') || code.includes('<html>')) return "Terdeteksi kode HTML! Harap ambil bagian <script> saja.";
    
    // 3. Cek Ciri Khas PHP
    if (code.includes('<?php') || code.includes('echo $')) return "Terdeteksi kode PHP!";
    
    // 4. Cek Ciri Khas CSS
    if (code.includes('{') && code.includes(':') && !code.includes('var ') && !code.includes('const ') && !code.includes('function')) {
        // Ini deteksi kasar CSS (jika ada selector { prop: val } tanpa keyword JS)
        // Agak tricky karena object JS mirip CSS, jadi kita skip warning keras, hanya return null jika ragu.
    }

    return null; // Lolos pemeriksaan dasar
}

function processCode() {
    const input = document.getElementById('inputCode').value;
    const errorBox = document.getElementById('errorMsg');
    
    // Reset Error
    errorBox.classList.add('hidden');
    errorBox.innerHTML = '';

    if (!input.trim()) {
        showError("Masukin dulu kode JavaScript-nya!");
        return;
    }

    // --- STEP 1: Language Detection ---
    const notJsWarning = isLikelyNotJS(input);
    if (notJsWarning) {
        showError(`<i class="fas fa-exclamation-triangle"></i> ${notJsWarning}`);
        return;
    }

    // --- STEP 2: Syntax Validation (Basic) ---
    try {
        // Mencoba parsing syntax dasar JS (tanpa eksekusi)
        new Function(input); 
    } catch (e) {
        showError(`<i class="fas fa-times-circle"></i> Error Syntax: Kode JS kamu tidak valid!<br><span style="opacity:0.7; font-size:10px">${e.message}</span>`);
        return;
    }

    // --- STEP 3: Obfuscation ---
    let options = {};
    if (currentLevel === 'low') {
        options = { compact: true, controlFlowFlattening: false, mangle: true };
    } else if (currentLevel === 'medium') {
        options = {
            compact: true, controlFlowFlattening: true, controlFlowFlatteningThreshold: 0.75,
            numbersToExpressions: true, simplify: true, stringArray: true
        };
    } else {
        // High - Premium Config
        options = {
            compact: true, controlFlowFlattening: true, controlFlowFlatteningThreshold: 1,
            numbersToExpressions: true, simplify: true, stringArray: true,
            stringArrayEncoding: ['rc4'], stringArrayThreshold: 1,
            deadCodeInjection: true, deadCodeInjectionThreshold: 0.4,
            selfDefending: true, splitStrings: true, debugProtection: false
        };
    }

    try {
        const result = JavaScriptObfuscator.obfuscate(input, options);
        
        // Success UI Transition
        document.getElementById('outputCode').value = result.getObfuscatedCode();
        document.getElementById('section-input').classList.add('hidden');
        
        const outSec = document.getElementById('section-output');
        outSec.classList.remove('hidden');
        outSec.classList.add('fade-in');

        // Ubah tombol bawah menjadi Copy
        const mainBtn = document.getElementById('actionBtn');
        mainBtn.innerHTML = 'COPY RESULT <i class="fas fa-copy"></i>';
        mainBtn.onclick = copyResult;

    } catch (err) {
        showError("Obfuscation Failed: " + err.message);
    }
}

function showError(msg) {
    const box = document.getElementById('errorMsg');
    box.innerHTML = msg;
    box.classList.remove('hidden');
    
    // Shake animation input
    const card = document.querySelector('.card');
    card.classList.add('shake');
    setTimeout(() => card.classList.remove('shake'), 300);
}

async function pasteCode() {
    try {
        const text = await navigator.clipboard.readText();
        document.getElementById('inputCode').value = text;
        document.getElementById('errorMsg').classList.add('hidden');
    } catch (err) {
        document.getElementById('inputCode').focus();
        alert('Silakan tempel manual (Ctrl+V)');
    }
}

function copyResult() {
    const output = document.getElementById('outputCode');
    output.select();
    document.execCommand('copy');
    
    const status = document.getElementById('copyStatus');
    status.innerHTML = "<i class='fas fa-check'></i> Copied to clipboard!";
    setTimeout(() => status.innerHTML = "", 2000);
}

function resetView() {
    document.getElementById('section-output').classList.add('hidden');
    document.getElementById('section-input').classList.remove('hidden');
    document.getElementById('inputCode').value = '';
    document.getElementById('errorMsg').classList.add('hidden');
    
    const mainBtn = document.getElementById('actionBtn');
    mainBtn.innerHTML = 'ENCRYPT NOW <i class="fas fa-rocket"></i>';
    mainBtn.onclick = processCode;
}
