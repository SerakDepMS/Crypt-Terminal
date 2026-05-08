(function() {

    const FIXED_MAPPING = {
        'A':'1897','B':'2346','C':'6182','D':'4242','E':'4284','F':'0007','G':'1010','H':'0000',
        'I':'4218','J':'1033','K':'0942','L':'9033','M':'5111','N':'2225','Ñ':'5262','O':'4645',
        'P':'7523','Q':'9988','R':'0321','S':'9653','T':'5264','U':'9145','V':'2086','W':'3568',
        'X':'7983','Y':'0230','Z':'3798',
        'a':'7981','b':'6432','c':'2816','d':'2424','e':'4824','f':'7000','g':'0101','h':'0000',
        'i':'8124','j':'3301','k':'2490','l':'3309','m':'1115','n':'5222','ñ':'2625','o':'5464',
        'p':'3257','q':'8894','r':'1230','s':'3569','t':'4625','u':'5419','v':'6802','w':'8653',
        'x':'3897','y':'0320','z':'8973',
        'Á':'010184','É':'743258','Í':'861290','Ó':'556213','Ú':'334401','Ü':'999358',
        'á':'93416','é':'87765','í':'92340','ó':'76813','ú':'10132','ü':'00319',
        '0':'_','1':'{','2':'*','3':']','4':'-','5':'¿','6':'/','7':'"','8':'[','9':'@',
        ',':'=','.':'x',';':'sc','|':'pp',
    };

    function getReverseMapping() {
        const rev = {};
        for (const [ch, val] of Object.entries(FIXED_MAPPING)) {
            if (!(val in rev)) rev[val] = ch;
        }
        return rev;
    }

    function encrypt(text) {
        if (!text.trim()) return '';
        return text.split(/[\s]+/).filter(w=>w.length>0).map(word =>
            [...word].map(c => FIXED_MAPPING[c] || c).join(';')
        ).join(' | ');
    }

    function decrypt(text) {
        if (!text.trim()) return '';
        const rev = getReverseMapping();
        return text.split('|').map(t=>t.trim()).filter(t=>t).map(token =>
            token.split(';').map(v=>v.trim()).filter(v=>v).map(val => rev[val] || val).join('')
        ).join(' ');
    }


    let soundEnabled = false;
    let audioCtx = null;
    function getAudioCtx() {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        return audioCtx;
    }
    function playBeep(freq=880, dur=0.06, type='square', vol=0.04) {
        if (!soundEnabled) return;
        try {
            const ctx = getAudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.type = type; osc.frequency.value = freq;
            gain.gain.setValueAtTime(vol, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
            osc.start(ctx.currentTime); osc.stop(ctx.currentTime + dur);
        } catch(e) {}
    }
    function playSound() {
        if (!soundEnabled) return;
        [440,550,660,880].forEach((f,i) => setTimeout(() => playBeep(f,0.05,'square',0.03), i*40));
    }
    function playDeSound() {
        if (!soundEnabled) return;
        [880,660,550,440].forEach((f,i) => setTimeout(() => playBeep(f,0.05,'sawtooth',0.03), i*40));
    }
    function playClickSound() { playBeep(600, 0.04, 'sine', 0.03); }
    function playSwapSound() {
        if (!soundEnabled) return;
        [500,700].forEach((f,i) => setTimeout(() => playBeep(f,0.06,'triangle',0.04), i*60));
    }


    const MAX_HISTORY = 10;
    let history = [];

    function addHistory(type, input, output) {
        const now = new Date();
        const time = now.toLocaleTimeString('es', {hour:'2-digit', minute:'2-digit', second:'2-digit'});
        history.unshift({ type, input: input.slice(0,60), output: output.slice(0,60), time });
        if (history.length > MAX_HISTORY) history.pop();
        renderHistory();
    }

    function renderHistory() {
        const list = document.getElementById('historyList');
        const badge = document.getElementById('historyBadge');
        if (!history.length) {
            list.innerHTML = '<div class="history-empty">[ SIN OPERACIONES RECIENTES ]</div>';
            badge.textContent = '';
            return;
        }
        badge.textContent = `[${history.length}]`;
        list.innerHTML = history.map((h, i) => `
            <div class="history-item" data-index="${i}">
                <span class="history-badge ${h.type==='enc'?'badge-enc':'badge-dec'}">${h.type==='enc'?'CIFRADO':'DESCIFR.'}</span>
                <span class="history-text" title="${h.input} → ${h.output}">${h.input}…</span>
                <span class="history-time">${h.time}</span>
            </div>
        `).join('');
        list.querySelectorAll('.history-item').forEach(el => {
            el.addEventListener('click', () => {
                const idx = parseInt(el.dataset.index);
                const h = history[idx];
                document.getElementById('inputText').value = h.input;
                document.getElementById('outputText').value = h.output;
                updateStats();
                showToast('HISTORIAL CARGADO');
                playClickSound();
            });
        });
    }


    function showProgress(cb) {
        const wrap = document.getElementById('progressWrap');
        const fill = document.getElementById('progressFill');
        wrap.classList.add('show');
        fill.style.width = '0%';
        let p = 0;
        const iv = setInterval(() => {
            p += 15 + Math.random() * 20;
            if (p >= 90) { clearInterval(iv); fill.style.width = '90%'; }
            else fill.style.width = p + '%';
        }, 40);
        setTimeout(() => {
            clearInterval(iv);
            fill.style.width = '100%';
            setTimeout(() => { wrap.classList.remove('show'); fill.style.width='0%'; cb(); }, 200);
        }, 280);
    }


    function updateStats() {
        const input = document.getElementById('inputText').value;
        const output = document.getElementById('outputText').value;
        const words = input.trim() ? input.trim().split(/\s+/).length : 0;
        document.getElementById('inChars').textContent = input.length + ' chars';
        document.getElementById('inWords').textContent = words + ' words';
        document.getElementById('outChars').textContent = output.length + ' chars';
        autoDetect(input);
    }


    function looksEncrypted(text) {
        if (!text.trim()) return false;
        return /[\d]+;[\d]|a\d+;|[A-Z]\d{2}|;\d{2}| \| /.test(text);
    }

    function autoDetect(text) {
        const hint = document.getElementById('detectHint');
        if (looksEncrypted(text)) hint.classList.add('show');
        else hint.classList.remove('show');
    }


    function glitchOutput() {
        const out = document.getElementById('outputText');
        out.classList.remove('output-glitch');
        void out.offsetWidth;
        out.classList.add('output-glitch');
        setTimeout(() => out.classList.remove('output-glitch'), 500);
    }


    const toast = document.getElementById('toast');
    function showToast(msg) {
        toast.textContent = msg;
        toast.classList.add('show');
        clearTimeout(toast._timeout);
        toast._timeout = setTimeout(() => toast.classList.remove('show'), 2000);
    }


    const canvas = document.getElementById('matrixCanvas');
    const ctx = canvas.getContext('2d');
    let width, height, columns, drops;
    const chars = "0123456789ABCDEFｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿ";
    const fontSize = 12;

    function resizeCanvas() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        columns = Math.floor(width / fontSize);
        drops = Array(columns).fill(1);
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    function drawMatrix() {
        ctx.fillStyle = 'rgba(0,0,0,0.05)';
        ctx.fillRect(0,0,width,height);
        ctx.fillStyle = '#0f0';
        ctx.font = `${fontSize}px 'Share Tech Mono'`;
        drops.forEach((d, i) => {
            ctx.fillText(chars[Math.floor(Math.random()*chars.length)], i*fontSize, d*fontSize);
            if (d*fontSize > height && Math.random() > 0.975) drops[i] = 0;
            drops[i]++;
        });
    }
    setInterval(drawMatrix, 45);


    const bootSequence = [
        "> INICIANDO SISTEMA SMS v5.1...",
        "> Verificando integridad del kernel... OK",
        "> Cargando módulos de cifrado... 0%",
        "> Cargando módulos de cifrado... 25%",
        "> Cargando módulos de cifrado... 50%",
        "> Cargando módulos de cifrado... 75%",
        "> Cargando módulos de cifrado... 100%",
        "> Estableciendo conexión segura... CONEXIÓN ESTABLECIDA",
        "> Descargando componentes:",
        ">   - core.bin (2048 bytes) OK",
        ">   - protocol_handler.sys OK",
        ">   - secure_channel.drv OK",
        ">   - history_engine.mod OK",
        ">   - sound_module.drv OK",
        "> Verificando firmas digitales... VÁLIDAS",
        "> Comprobando permisos de acceso... AUTORIZADO",
        "> Escaneando puertos de red... ABIERTO: 443, 8080",
        "> Montando sistema de archivos cifrado... /secure_mount OK",
        "> Cargando claves RSA-4096 desde HSM... [OK]",
        "> Verificando checksum de base de datos... A1B2C3D4 (OK)",
        "> Iniciando servicio de autenticación... ESCUCHANDO EN 127.0.0.1:9050",
        "> Ejecutando self-test de algoritmos: AES-256... OK, SHA-512... OK",
        "> Sincronizando reloj con servidor NTP... HORA EXACTA (UTC -5)",
        "> Cargando perfiles de usuario... ADMIN AUTENTICADO",
        "> Inicializando motor de cifrado simétrico... CLAVE MAESTRA CARGADA",
        "> Configurando túnel VPN... CONEXIÓN ESTABLECIDA CON NODO X",
        "> Cargando base de datos de hashes... 1.2M ENTRADAS CARGADAS",
        "> Comprobando sensores de intrusión... SIN AMENAZAS DETECTADAS",
        "> Descargando tabla de mapeo... COMPLETADO (98 caracteres)",
        "> Verificando cadena de confianza... CERTIFICADO VÁLIDO (CA Root)",
        "> Inicializando subsistema de entropía... RUIDO SEMILLA OK (hw_random)",
        "> Cargando módulos anti-forense... ACTIVADO (secure_delete)",
        "> Realizando handshake TLS 1.3... COMPLETADO (0.2ms)",
        "> Inicializando motor de historial cifrado... ACTIVO (10 entradas max)",
        "> Cargando motor de detección automática... ACTIVO",
        "> Inicializando módulo de exportación... OK",
        "> Inicializando subsistema de audio retro... LISTO",
        "> Inicializando sistema de detección de anomalías... ML ENTRENADO (99.7%)",
        "> Cargando perfiles de AppArmor... PERFILES CARGADOS (12)",
        "> Configurando enrutamiento Tor... CIRCUITO ESTABLECIDO (3 nodos)",
        "> Realizando benchmark de rendimiento... 85.3 Mops/s (AES)",
        "> Comprobando latencia de red... 12ms (aceptable)",
        "> Verificando mapa de memoria seguro... NO EXEC EN HEAP Y STACK",
        "> Preparando entorno aislado... SANDBOX LISTA",
        "> Verificando integridad de GPU... NVIDIA Tesla T4 OK",
        "> Cargando módulo de aceleración criptográfica (AES-NI)... ACTIVADO",
        "> Configurando atajos de teclado avanzados... OK",
        "> Montando partición de recuperación... /rescue OK",
        "> Comprobando integridad del cargador de arranque... EFI FIRMADO",
        "> Inicializando registro de auditoría... audit.log en rotación",
        "> Bienvenido, Operador. v5.1 ENHANCED EDITION LISTA."
    ];

    const loginScreen = document.getElementById('login-screen');
    const mainSystem = document.getElementById('main-system');
    const enterBtn = document.getElementById('enter-btn');
    const bootTerminal = document.getElementById('boot-terminal');

    enterBtn.addEventListener('click', () => {
        playBeep(440, 0.1, 'square', 0.05);
        enterBtn.style.display = 'none';
        bootTerminal.classList.add('active');
        bootTerminal.innerHTML = '';
        let lineIndex = 0;

        function addLine() {
            if (lineIndex < bootSequence.length) {
                const line = document.createElement('div');
                line.className = 'boot-line';
                line.textContent = bootSequence[lineIndex];
                bootTerminal.appendChild(line);
                bootTerminal.scrollTop = bootTerminal.scrollHeight;
                lineIndex++;
                const delay = lineIndex === bootSequence.length ? 500 : 80 + Math.random() * 120;
                setTimeout(addLine, delay);
            } else {
                const finalLine = document.createElement('div');
                finalLine.className = 'boot-line cursor-blink';
                finalLine.textContent = '> ACCESO CONCEDIDO. CARGANDO SISTEMA DE CIFRADO v5.1...';
                bootTerminal.appendChild(finalLine);
                bootTerminal.scrollTop = bootTerminal.scrollHeight;
                setTimeout(() => {
                    loginScreen.classList.add('fade-out');
                    mainSystem.style.display = 'block';
                    setTimeout(() => { mainSystem.style.opacity = '1'; }, 50);
                    document.body.style.alignItems = 'flex-start';
                    showToast('CRYPT v5.1 ENHANCED — BOOT COMPLETO');
                    playBeep(660, 0.2, 'sine', 0.05);
                }, 1200);
            }
        }
        addLine();
    });


    const inputText  = document.getElementById('inputText');
    const outputText = document.getElementById('outputText');

    document.getElementById('encryptBtn').addEventListener('click', () => {
        if (!inputText.value.trim()) return showToast('⚠ ESCRIBE ALGO');
        showProgress(() => {
            outputText.value = encrypt(inputText.value);
            glitchOutput();
            updateStats();
            addHistory('enc', inputText.value, outputText.value);
            showToast('▲ TEXTO CIFRADO');
            playSound();
        });
    });

    document.getElementById('decryptBtn').addEventListener('click', () => {
        if (!inputText.value.trim()) return showToast('⚠ ESCRIBE ALGO');
        showProgress(() => {
            outputText.value = decrypt(inputText.value);
            glitchOutput();
            updateStats();
            addHistory('dec', inputText.value, outputText.value);
            showToast('▼ TEXTO DESCIFRADO');
            playDeSound();
        });
    });

    document.getElementById('copyBtn').addEventListener('click', () => {
        if (!outputText.value) return showToast('⚠ NADA QUE COPIAR');
        navigator.clipboard?.writeText(outputText.value).then(() => {
            showToast('✔ OUTPUT COPIADO');
            playClickSound();
        }).catch(() => showToast('✘ ERROR'));
    });

    document.getElementById('copyInputBtn').addEventListener('click', () => {
        if (!inputText.value) return showToast('⚠ NADA QUE COPIAR');
        navigator.clipboard?.writeText(inputText.value).then(() => {
            showToast('✔ INPUT COPIADO');
            playClickSound();
        }).catch(() => showToast('✘ ERROR'));
    });

    document.getElementById('clearBtn').addEventListener('click', () => {
        inputText.value = ''; outputText.value = '';
        updateStats();
        showToast('⌧ LIMPIO');
        playClickSound();
    });


    document.getElementById('swapBtn').addEventListener('click', () => {
        const tmp = inputText.value;
        inputText.value = outputText.value;
        outputText.value = tmp;
        updateStats();
        showToast('⇅ SWAP REALIZADO');
        playSwapSound();
    });


    document.getElementById('exportBtn').addEventListener('click', () => {
        if (!outputText.value) return showToast('⚠ SIN OUTPUT QUE EXPORTAR');
        const ts = new Date().toISOString().replace(/[:.]/g,'-');
        const content = `CRYPT v5.1 — EXPORT ${ts}\n${'='.repeat(40)}\n\nINPUT:\n${inputText.value}\n\nOUTPUT:\n${outputText.value}\n\n[ FIN DEL ARCHIVO ]`;
        const blob = new Blob([content], {type: 'text/plain'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `crypt_${ts}.txt`; a.click();
        URL.revokeObjectURL(url);
        showToast('⬇ EXPORTADO COMO .TXT');
        playClickSound();
    });


    const soundToggle = document.getElementById('soundToggle');
    soundToggle.addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        soundToggle.textContent = soundEnabled ? '🔊 SONIDO ON' : '🔇 SONIDO OFF';
        soundToggle.classList.toggle('active', soundEnabled);
        if (soundEnabled) playBeep(880, 0.1, 'sine', 0.05);
        showToast(soundEnabled ? '🔊 SONIDO ACTIVADO' : '🔇 SONIDO DESACTIVADO');
    });


    document.getElementById('clearHistoryBtn').addEventListener('click', () => {
        history = []; renderHistory();
        showToast('⌧ HISTORIAL BORRADO');
        playClickSound();
    });


    inputText.addEventListener('input', updateStats);


    function makeCollapsible(toggleId, bodyId) {
        const toggle = document.getElementById(toggleId);
        const body   = document.getElementById(bodyId);
        toggle.addEventListener('click', () => {
            body.classList.toggle('expanded');
            toggle.classList.toggle('open');
            playClickSound();
        });
    }
    makeCollapsible('historyToggle', 'historyBody');
    makeCollapsible('shortcutsToggle', 'shortcutsBody');
    makeCollapsible('mappingToggle', 'mappingBody');

    document.addEventListener('keydown', e => {
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault(); document.getElementById('encryptBtn').click();
        }
        if (e.ctrlKey && e.shiftKey && e.key === 'D') {
            e.preventDefault(); document.getElementById('decryptBtn').click();
        }
        if (e.ctrlKey && e.shiftKey && e.key === 'C') {
            e.preventDefault(); document.getElementById('copyBtn').click();
        }
        if (e.ctrlKey && e.shiftKey && e.key === 'S') {
            e.preventDefault(); document.getElementById('swapBtn').click();
        }
        if (e.ctrlKey && e.shiftKey && e.key === 'X') {
            e.preventDefault(); document.getElementById('clearBtn').click();
        }
        if (e.ctrlKey && e.shiftKey && e.key === 'E') {
            e.preventDefault(); document.getElementById('exportBtn').click();
        }
    });


    function buildMappingTable() {
        const mappingInner = document.getElementById('mappingInner');
        mappingInner.innerHTML = '';
        const groups = [
            { name: 'MAYÚSCULAS (A-Z, Ñ)', chars: 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('') },
            { name: 'MINÚSCULAS (a-z, ñ)', chars: 'abcdefghijklmnñopqrstuvwxyz'.split('') },
            { name: 'ACENTUADAS MAY.', chars: ['Á','É','Í','Ó','Ú','Ü'] },
            { name: 'ACENTUADAS MIN.', chars: ['á','é','í','ó','ú','ü'] },
            { name: 'NÚMEROS', chars: '0123456789'.split('') },
            { name: 'SÍMBOLOS', chars: [',','.',';','|'] }
        ];
        groups.forEach(group => {
            const groupDiv = document.createElement('div');
            groupDiv.className = 'mapping-group';
            const title = document.createElement('div');
            title.className = 'mapping-group-title group-open';
            title.innerHTML = `<span class="group-arrow">▶</span> ${group.name}`;
            const grid = document.createElement('div');
            grid.className = 'mapping-grid';
            group.chars.forEach(char => {
                const item = document.createElement('div');
                item.className = 'mapping-item';
                item.innerHTML = `<span class="mapping-char">${char}</span><span class="mapping-value-readonly">${FIXED_MAPPING[char]||'?'}</span>`;
                grid.appendChild(item);
            });
            title.addEventListener('click', () => {
                grid.classList.toggle('collapsed');
                title.classList.toggle('group-open');
            });
            groupDiv.appendChild(title); groupDiv.appendChild(grid);
            mappingInner.appendChild(groupDiv);
        });
    }

    buildMappingTable();
    renderHistory();
    updateStats();
    mainSystem.style.display = 'none';
    mainSystem.style.opacity = '0';
    mainSystem.style.transition = 'opacity 0.8s ease';
    document.body.style.alignItems = 'center';
})();