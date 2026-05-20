/* ==========================================================================
   트릭컬 성격 공명 링크 - 게임 플레이 로직 (면적 드래그 방식, 부드러운 타이머 적용)
   ========================================================================== */

// ==========================================================================
// 사운드 매니저 (Web Audio API 기반 합성음 + BGM)
// ==========================================================================
class SoundManager {
    constructor() {
        this.audioCtx = null;
        this.bgmElement = document.getElementById('bgm-audio');
        this.bgmVolume = 0.3;
        this.sfxVolume = 0.7;
        this._initialized = false;
    }

    init() {
        if (this._initialized) return;
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this._initialized = true;
    }

    setBgmVolume(val) {
        this.bgmVolume = val;
        if (this.bgmElement) this.bgmElement.volume = val;
    }

    setSfxVolume(val) {
        this.sfxVolume = val;
    }

    playBgm() {
        this.init();
        if (this.bgmElement) {
            this.bgmElement.volume = this.bgmVolume;
            this.bgmElement.currentTime = 0;
            this.bgmElement.play().catch(() => {});
        }
    }

    pauseBgm() {
        if (this.bgmElement) this.bgmElement.pause();
    }

    resumeBgm() {
        if (this.bgmElement) this.bgmElement.play().catch(() => {});
    }

    stopBgm() {
        if (this.bgmElement) {
            this.bgmElement.pause();
            this.bgmElement.currentTime = 0;
        }
    }

    // --- Web Audio API 합성 효과음 ---
    _playTone(freq, type, duration, volumeMult = 1) {
        this.init();
        if (!this.audioCtx || this.sfxVolume === 0) return;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
        gain.gain.setValueAtTime(this.sfxVolume * volumeMult * 0.3, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start();
        osc.stop(this.audioCtx.currentTime + duration);
    }

    playMatch() {
        this._playTone(523.25, 'sine', 0.12, 0.8);
        setTimeout(() => this._playTone(659.25, 'sine', 0.12, 0.8), 50);
        setTimeout(() => this._playTone(783.99, 'sine', 0.2, 0.6), 100);
    }

    playResonanceClick() {
        this._playTone(440, 'sine', 0.15, 0.5);
        setTimeout(() => this._playTone(554.37, 'triangle', 0.2, 0.6), 80);
        setTimeout(() => this._playTone(659.25, 'sine', 0.3, 0.4), 160);
    }

    playResonanceUse() {
        this._playTone(392, 'triangle', 0.1, 0.7);
        setTimeout(() => this._playTone(523.25, 'triangle', 0.1, 0.7), 60);
        setTimeout(() => this._playTone(659.25, 'triangle', 0.1, 0.7), 120);
        setTimeout(() => this._playTone(783.99, 'sine', 0.3, 0.5), 180);
    }

    playPause() {
        this._playTone(600, 'sine', 0.08, 0.4);
        setTimeout(() => this._playTone(400, 'sine', 0.12, 0.3), 60);
    }

    playGameStart() {
        this._playTone(523.25, 'sine', 0.12, 0.6);
        setTimeout(() => this._playTone(659.25, 'sine', 0.12, 0.6), 100);
        setTimeout(() => this._playTone(783.99, 'sine', 0.12, 0.6), 200);
        setTimeout(() => this._playTone(1046.50, 'sine', 0.3, 0.5), 300);
    }

    playGameOver() {
        this._playTone(392, 'sawtooth', 0.2, 0.3);
        setTimeout(() => this._playTone(349.23, 'sawtooth', 0.2, 0.3), 150);
        setTimeout(() => this._playTone(293.66, 'sawtooth', 0.4, 0.25), 300);
    }

    playClear() {
        const notes = [523.25, 659.25, 783.99, 1046.50, 783.99, 1046.50, 1318.51];
        notes.forEach((freq, i) => {
            setTimeout(() => this._playTone(freq, 'sine', 0.2, 0.5), i * 100);
        });
    }

    playComboReward() {
        this._playTone(880, 'sine', 0.1, 0.5);
        setTimeout(() => this._playTone(1108.73, 'sine', 0.1, 0.5), 80);
        setTimeout(() => this._playTone(1318.51, 'sine', 0.25, 0.4), 160);
    }

    playResume() {
        this._playTone(400, 'sine', 0.08, 0.4);
        setTimeout(() => this._playTone(600, 'sine', 0.12, 0.3), 60);
    }
}

const soundManager = new SoundManager();

document.addEventListener('DOMContentLoaded', () => {
    // 사용자 기획 의도: 총 135칸 (9 * 15) -> 전부 없앴을 때 정확히 135점 달성!
    const ROWS = 9;
    const COLS = 15;
    const TOTAL_TIME_MS = 120000; // 120초
    const COMBO_DURATION_MS = 4000; // 4초

    const PERSONALITIES = {
        madness: { name: '광기', img: 'assets/madness.png' },
        calm: { name: '냉정', img: 'assets/calm.png' },
        pure: { name: '순수', img: 'assets/pure.png' },
        gloom: { name: '우울', img: 'assets/gloom.png' },
        lively: { name: '활발', img: 'assets/lively.png' }
    };
    const PERSONALITY_TYPES = Object.keys(PERSONALITIES);
    const TYPE_RESONANCE = 'resonance';

    let board = [];
    let score = 0;
    let maxCombo = 0; // 게임 중 달성한 최대 콤보
    let combo = 0;
    let resonanceCount = 0;
    let lastAwardedComboTier = 0; // 아이템을 지급받은 마지막 콤보 10단위 (1, 2, 3...)
    let currentScale = 1; // 화면 스케일 비율 저장용 변수
    
    // 타이머 (requestAnimationFrame 기반)
    let timeRemainingMs = TOTAL_TIME_MS;
    let comboTimeRemainingMs = 0;
    let lastFrameTime = 0;
    let animationFrameId = null;
    let lastTimerUpdateMs = 0; // 메인 타이머 UI 갱신 간격 제어용 변수

    let gameActive = false;
    let isPaused = false;
    let isResonanceMode = false;
    let isResetting = false;

    // 면적 드래그 관련 변수
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let currentSelectedCells = [];
    let isSelectionValid = false;
    let isSelectionBoxVisible = false;

    const highScoreKey = 'trickcal_link_highscore_v2';
    let highScore = localStorage.getItem(highScoreKey) || 0;

    // DOM 요소
    const appContainer = document.getElementById('app-container');
    const gameBoard = document.getElementById('game-board');
    const boardContainer = document.getElementById('board-container');
    const selectionBox = document.getElementById('selection-box');
    
    const scoreVal = document.getElementById('score-val');
    const comboVal = document.getElementById('combo-val');
    const comboTimerBarBg = document.getElementById('combo-timer-bar-bg');
    const comboTimerBarFill = document.getElementById('combo-timer-bar-fill');
    
    const timerBarFill = document.getElementById('timer-bar-fill');
    const resonanceBtn = document.getElementById('resonance-btn');
    const resonanceCountTxt = document.getElementById('resonance-count');
    const boardLoadingOverlay = document.getElementById('board-loading-overlay');

    const startModal = document.getElementById('start-modal');
    const startModalTitle = document.getElementById('start-modal-title');
    const startModalDesc = document.getElementById('start-modal-desc');
    const startGameBtn = document.getElementById('start-game-btn');

    const pauseBtn = document.getElementById('pause-btn');
    const pauseModal = document.getElementById('pause-modal');
    const resumeBtn = document.getElementById('resume-btn');
    const restartBtn = document.getElementById('restart-btn');
    const exitBtn = document.getElementById('exit-btn');

    // 볼륨 조절 UI
    const bgmVolumeSlider = document.getElementById('bgm-volume');
    const sfxVolumeSlider = document.getElementById('sfx-volume');
    const bgmVolumeVal = document.getElementById('bgm-volume-val');
    const sfxVolumeVal = document.getElementById('sfx-volume-val');

    bgmVolumeSlider.addEventListener('input', () => {
        const val = bgmVolumeSlider.value;
        bgmVolumeVal.textContent = val;
        soundManager.setBgmVolume(val / 100);
    });
    sfxVolumeSlider.addEventListener('input', () => {
        const val = sfxVolumeSlider.value;
        sfxVolumeVal.textContent = val;
        soundManager.setSfxVolume(val / 100);
    });

    // ==========================================================================
    // 반응형 스케일핏(Scale Fit) 조절 로직 (모바일/PC 모두 완벽 피팅)
    // ==========================================================================
    function resizeGame() {
        if (!appContainer) return;
        
        const targetWidth = 1024;
        const targetHeight = 640;
        
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        // 화면 해상도 비율에 맞추어 스케일링 비율 결정
        const scaleX = windowWidth / targetWidth;
        const scaleY = windowHeight / targetHeight;
        const scale = Math.min(scaleX, scaleY);
        
        currentScale = scale; // 마우스 좌표 보정을 위한 스케일 저장
        
        // 화면에 맞게 조정 (중앙 정렬 상태 유지하며 크기 변경)
        appContainer.style.transform = `translate(-50%, -50%) scale(${scale})`;
        
        // 스케일 변화가 렌더링에 반영된 후 정확한 절대 픽셀 좌표를 재계산하여 캐싱
        requestAnimationFrame(cacheCellCoords);
    }
    
    // 리사이즈 이벤트 등록 및 즉시 실행
    window.addEventListener('resize', resizeGame);
    window.addEventListener('load', resizeGame);
    resizeGame();

    // ==========================================================================
    // 게임 라이프사이클 및 타이머 루프
    // ==========================================================================
    function initGame() {
        score = 0;
        maxCombo = 0;
        combo = 0;
        resonanceCount = 0;
        lastAwardedComboTier = 0;
        timeRemainingMs = TOTAL_TIME_MS;
        comboTimeRemainingMs = 0;
        
        isResonanceMode = false;
        isDragging = false;
        clearSelectionBox();
        
        updateScoreUI();
        updateComboUI();
        updateResonanceUI();
        
        timerBarFill.classList.remove('warning');
        timerBarFill.style.width = '100%';
        comboTimerBarBg.style.display = 'none';

        createBoard();
    }

    function startGame() {
        initGame();
        startModal.classList.remove('active');
        appContainer.classList.remove('modal-active');
        gameActive = true;
        isPaused = false;
        
        soundManager.playGameStart();
        soundManager.playBgm();
        
        lastFrameTime = performance.now();
        animationFrameId = requestAnimationFrame(gameLoop);
    }

    function stopGame(reason = 'timeout') {
        gameActive = false;
        cancelAnimationFrame(animationFrameId);
        soundManager.stopBgm();
        
        if (reason === 'clear') {
            soundManager.playClear();
        } else {
            soundManager.playGameOver();
        }
        
        if (score > highScore) {
            highScore = score;
            localStorage.setItem(highScoreKey, highScore);
        }

        // 소요 시간 계산
        const elapsedMs = TOTAL_TIME_MS - timeRemainingMs;
        const elapsedSec = Math.floor(elapsedMs / 1000);
        const elapsedMin = Math.floor(elapsedSec / 60);
        const elapsedSecRemainder = elapsedSec % 60;
        const timeStr = `${elapsedMin}분 ${elapsedSecRemainder < 10 ? '0' : ''}${elapsedSecRemainder}초`;

        // 점수 상세 내역 HTML
        const scoreDetailHtml = `
            점수: <span style="color: var(--color-primary-dark); font-size: 24px;">${score}점</span><br>
            최대 콤보: <span style="color: #2c3e50; font-size: 18px;">${maxCombo}콤보</span><br>
            소요 시간: <span style="color: #2c3e50; font-size: 18px;">${timeStr}</span><br>
            <br>
            최고 기록: <span style="font-size: 20px;">${highScore}점</span>
        `;

        if (reason === 'timeout') {
            startModalTitle.textContent = '시간 초과!';
            startModalDesc.innerHTML = scoreDetailHtml;
            startGameBtn.textContent = '다시 도전하기';
            startModal.classList.add('active');
            appContainer.classList.add('modal-active');
        } else if (reason === 'deadlock') {
            startModalTitle.textContent = '조합 불가능!';
            startModalDesc.innerHTML = scoreDetailHtml;
            startGameBtn.textContent = '다시 도전하기';
            startModal.classList.add('active');
            appContainer.classList.add('modal-active');
        } else if (reason === 'clear') {
            startModalTitle.textContent = '클리어!';
            startModalDesc.innerHTML = `전부 클리어 하셨습니다!<br><br>` + scoreDetailHtml;
            startGameBtn.textContent = '다시 도전하기';
            startModal.classList.add('active');
            appContainer.classList.add('modal-active');
        }
    }

    function gameLoop(currentTime) {
        if (!gameActive) return;
        
        const deltaTime = currentTime - lastFrameTime;
        lastFrameTime = currentTime;

        if (!isPaused && !isResetting) {
            // 메인 타이머 업데이트 (스무스하게)
            timeRemainingMs -= deltaTime;
            if (timeRemainingMs <= 0) {
                timeRemainingMs = 0;
                updateTimerUI();
                stopGame('timeout');
                return;
            }
            
            // 타이머 UI는 50ms (초당 20회) 주기로만 업데이트하여 레이아웃 연산 비용 절감
            if (currentTime - lastTimerUpdateMs >= 50) {
                updateTimerUI();
                lastTimerUpdateMs = currentTime;
            }

            // 콤보 타이머 업데이트
            if (comboTimeRemainingMs > 0) {
                comboTimeRemainingMs -= deltaTime;
                const percent = (comboTimeRemainingMs / COMBO_DURATION_MS) * 100;
                comboTimerBarFill.style.width = `${percent}%`;
                
                if (comboTimeRemainingMs <= 0) {
                    comboTimeRemainingMs = 0;
                    combo = 0;
                    lastAwardedComboTier = 0; // 콤보 초기화 시 지급 기준도 초기화
                    updateComboUI();
                    comboTimerBarBg.style.display = 'none';
                }
            }
        }
        animationFrameId = requestAnimationFrame(gameLoop);
    }

    function updateTimerUI() {
        const percent = (timeRemainingMs / TOTAL_TIME_MS) * 100;
        timerBarFill.style.width = `${percent}%`;
        if (timeRemainingMs <= 20000) {
            timerBarFill.classList.add('warning');
        } else {
            timerBarFill.classList.remove('warning');
        }
    }

    // ==========================================================================
    // 보드 생성 및 리셋
    // ==========================================================================
    function createBoard() {
        gameBoard.innerHTML = '';
        board = [];

        for (let r = 0; r < ROWS; r++) {
            const rowData = [];
            for (let c = 0; c < COLS; c++) {
                const randomType = PERSONALITY_TYPES[Math.floor(Math.random() * PERSONALITY_TYPES.length)];
                
                const cellElement = document.createElement('div');
                cellElement.classList.add('board-cell');
                cellElement.dataset.row = r;
                cellElement.dataset.col = c;

                const imgElement = document.createElement('img');
                imgElement.src = PERSONALITIES[randomType].img;
                imgElement.classList.add('personality-icon');
                cellElement.appendChild(imgElement);
                gameBoard.appendChild(cellElement);

                rowData.push({
                    row: r,
                    col: c,
                    type: randomType,
                    element: cellElement,
                    imgElement: imgElement
                });
            }
            board.push(rowData);
        }

        // 혹시 데드락이면 바로 재생성
        if (!hasAvailableMoves()) {
            createBoard();
        } else {
            // 보드가 완성되었을 때만 기하 픽셀 좌표 1회 캐싱
            cacheCellCoords();
        }
    }

    function reloadBoard() {
        if (isResetting) return;
        isResetting = true;
        clearSelectionBox();

        boardLoadingOverlay.style.display = 'flex';
        setTimeout(() => {
            createBoard();
            boardLoadingOverlay.style.display = 'none';
            isResetting = false;
        }, 1200);
    }

    // 셀 절대 좌표 캐싱 진행 (매 마우스 무브마다 getBoundingClientRect를 강제해 렉을 유발하는 Layout Thrashing 방지)
    function cacheCellCoords() {
        if (!board || board.length === 0) return;
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const cell = board[r][c];
                if (cell && cell.element && cell.type !== 'empty') {
                    cell.rect = cell.element.getBoundingClientRect();
                }
            }
        }
    }

    // ==========================================================================
    // 면적 드래그 조작 (Selection Box) 로직
    // ==========================================================================
    boardContainer.addEventListener('mousedown', handleDragStart);
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    
    // 모바일 터치 대응
    boardContainer.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        handleDragStart({ clientX: touch.clientX, clientY: touch.clientY, preventDefault: ()=>e.preventDefault() });
    }, { passive: false });
    document.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        const touch = e.touches[0];
        handleDragMove({ clientX: touch.clientX, clientY: touch.clientY, preventDefault: ()=>e.preventDefault() });
    }, { passive: false });
    document.addEventListener('touchend', handleDragEnd);

    function getRelativePos(clientX, clientY) {
        const rect = boardContainer.getBoundingClientRect();
        return {
            x: (clientX - rect.left) / currentScale,
            y: (clientY - rect.top) / currentScale
        };
    }

    function handleDragStart(e) {
        if (!gameActive || isPaused || isResetting) return;
        
        // 공명 아이템 단일 클릭 모드 (pointer-events: none 방어용 직접 좌표 연산)
        if (isResonanceMode) {
            for (let r = 0; r < ROWS; r++) {
                if (!board[r]) continue;
                for (let c = 0; c < COLS; c++) {
                    const cell = board[r][c];
                    if (cell.type === 'empty') continue;
                    
                    const rect = cell.element.getBoundingClientRect();
                    if (e.clientX >= rect.left && e.clientX <= rect.right &&
                        e.clientY >= rect.top && e.clientY <= rect.bottom) {
                        applyResonanceItem(cell);
                        return;
                    }
                }
            }
            return;
        }

        const pos = getRelativePos(e.clientX, e.clientY);
        startX = pos.x;
        startY = pos.y;
        isDragging = true;
        isSelectionBoxVisible = true;
        
        selectionBox.style.display = 'block';
        selectionBox.style.left = `${startX}px`;
        selectionBox.style.top = `${startY}px`;
        selectionBox.style.width = '0px';
        selectionBox.style.height = '0px';
        
        if (e.preventDefault) e.preventDefault();
        updateSelection(e.clientX, e.clientY);
    }

    function handleDragMove(e) {
        if (!isDragging || !isSelectionBoxVisible || isResonanceMode) return;
        if (e.preventDefault) e.preventDefault();
        updateSelection(e.clientX, e.clientY);
    }

    function handleDragEnd() {
        if (!isDragging) return;
        isDragging = false;
        
        if (isSelectionValid && currentSelectedCells.length >= 2) {
            executeMatch(currentSelectedCells);
        } else {
            // 드래그 실패 시에도 데드락인지 확인 (이미 데드락인데 놓친 경우 방지)
            checkBoardStatus();
        }
        clearSelectionBox();
    }

    function updateSelection(clientX, clientY) {
        const pos = getRelativePos(clientX, clientY);
        
        const left = Math.min(startX, pos.x);
        const top = Math.min(startY, pos.y);
        const width = Math.abs(pos.x - startX);
        const height = Math.abs(pos.y - startY);

        selectionBox.style.left = `${left}px`;
        selectionBox.style.top = `${top}px`;
        selectionBox.style.width = `${width}px`;
        selectionBox.style.height = `${height}px`;

        // 절대 좌표 기반 AABB 충돌 감지
        const boxRect = selectionBox.getBoundingClientRect();
        
        const newSelectedCells = [];
        
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const cell = board[r][c];
                // 기존 하이라이트 해제
                cell.element.classList.remove('highlight-valid', 'highlight-invalid');
                
                if (cell.type === 'empty') continue; // 빈칸은 박스에 들어가도 무시

                // 절대 뷰포트 픽셀 좌표는 캐시된 기하 정보 사용 (마우스 무브마다 매번 getBoundingClientRect()를 강제 호출해 생기는 리플로우 렉 원천 차단)
                const cellRect = cell.rect;
                if (!cellRect) continue;
                
                // 겹침 검사
                const isIntersecting = !(
                    boxRect.right < cellRect.left || 
                    boxRect.left > cellRect.right || 
                    boxRect.bottom < cellRect.top || 
                    boxRect.top > cellRect.bottom
                );

                if (isIntersecting) {
                    newSelectedCells.push(cell);
                }
            }
        }
        
        currentSelectedCells = newSelectedCells;
        validateSelection();
    }

    function validateSelection() {
        // 개수 판별 (2~4개)
        if (currentSelectedCells.length < 2 || currentSelectedCells.length > 4) {
            setSelectionStyle(false);
            return;
        }

        // 성격 통일성 검사 (공명 제외 한 가지 성격만 있어야 함)
        let foundType = null;
        let isValid = true;

        for (let cell of currentSelectedCells) {
            if (cell.type === TYPE_RESONANCE) continue;
            
            if (!foundType) {
                foundType = cell.type; // 첫 기준 성격
            } else if (foundType !== cell.type) {
                isValid = false; // 다른 성격이 끼어듦
                break;
            }
        }

        setSelectionStyle(isValid);
    }

    function setSelectionStyle(isValid) {
        isSelectionValid = isValid;
        if (isValid) {
            selectionBox.classList.remove('invalid');
            selectionBox.classList.add('valid');
            currentSelectedCells.forEach(c => c.element.classList.add('highlight-valid'));
        } else {
            selectionBox.classList.remove('valid');
            selectionBox.classList.add('invalid');
            currentSelectedCells.forEach(c => c.element.classList.add('highlight-invalid'));
        }
    }

    function clearSelectionBox() {
        isSelectionBoxVisible = false;
        selectionBox.style.display = 'none';
        selectionBox.style.width = '0px';
        selectionBox.style.height = '0px';
        selectionBox.classList.remove('valid', 'invalid');
        
        for (let r = 0; r < ROWS; r++) {
            if (!board[r]) continue;
            for (let c = 0; c < COLS; c++) {
                if (board[r][c] && board[r][c].element) {
                    board[r][c].element.classList.remove('highlight-valid', 'highlight-invalid');
                }
            }
        }
        currentSelectedCells = [];
        isSelectionValid = false;
    }

    // ==========================================================================
    // 매치 실행 및 피드백
    // ==========================================================================
    function executeMatch(matchedCells) {
        const count = matchedCells.length;
        score += count;
        combo += count;

        // 최대 콤보 기록 갱신
        if (combo > maxCombo) {
            maxCombo = combo;
        }

        soundManager.playMatch();

        updateScoreUI();
        updateComboUI();

        comboTimeRemainingMs = COMBO_DURATION_MS;
        comboTimerBarBg.style.display = 'block';

        // 10단위(10~19, 20~29...) 달성 시 공명 아이템 지급 로직
        const currentComboTier = Math.floor(combo / 10);
        if (currentComboTier > lastAwardedComboTier) {
            // 한 번에 단위를 뛰어넘은 만큼 지급 (보통은 1씩 오름)
            const earnedItems = currentComboTier - lastAwardedComboTier;
            resonanceCount += earnedItems;
            lastAwardedComboTier = currentComboTier;
            
            updateResonanceUI();
            triggerComboRainbowEffect();
            soundManager.playComboReward();
        }

        matchedCells.forEach(cell => {
            createExplosionParticles(cell);
            
            cell.type = 'empty';
            cell.element.classList.add('empty');
            cell.element.classList.remove('resonance-cell');
            cell.rect = null; // 매칭된 셀의 기하 좌표 캐시 제거
            
            if (cell.imgElement) {
                cell.imgElement.style.transform = 'scale(0) rotate(180deg)';
                cell.imgElement.style.opacity = '0';
                setTimeout(() => {
                    if (cell.element.contains(cell.imgElement)) {
                        cell.element.innerHTML = '';
                        cell.imgElement = null;
                    }
                }, 200);
            }
        });

        setTimeout(checkBoardStatus, 250);
    }

    // ==========================================================================
    // 보드 갱신 검사 (No More Moves 등)
    // ==========================================================================
    function checkBoardStatus() {

        let activeCellsCount = 0;
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (board[r][c].type !== 'empty') activeCellsCount++;
            }
        }

        if (activeCellsCount === 0) {
            score = 135; // 0개 달성 시 135점 만점 처리
            updateScoreUI();
            stopGame('clear');
            return;
        }

        // 우선순위 1: 아이콘이 딱 1개만 남은 경우: 공명 물약이 아무리 많아도 짝을 지을 수 없으므로 점수와 무관하게 절대적 데드락
        if (activeCellsCount === 1) {
            stopGame('deadlock');
            return;
        }

        // 우선순위 2: 유저 요청 타협안 (1개 남는 데드락에 빠지지 않고 2개 이상 남은 상태에서 135점을 달성했다면 클리어 판정!)
        if (score >= 135) {
            score = 135; // 사용자 지시: 임의 조작 없이 135점을 만점으로 고정
            updateScoreUI();
            stopGame('clear');
            return;
        }

        // 직사각형 면적 드래그 방식에서의 데드락 판정
        // 보드 내에 같은 성격(혹은 공명) 2개가 가로 혹은 세로 직선상에 
        // 중간에 빈 공간만 두고 배치된 경우가 단 1쌍이라도 있으면 통과
        if (!hasAvailableMoves()) {
            if (resonanceCount === 0) {
                showOverlayText('더 이상 조합이 불가능해요', () => stopGame('deadlock'));
            }
        }
    }

    function showOverlayText(text, callback, isPermanent = false) {
        if (isResetting) return;
        isResetting = true;
        clearSelectionBox();

        boardLoadingOverlay.style.display = 'flex';
        const p = boardLoadingOverlay.querySelector('p');
        const spinner = boardLoadingOverlay.querySelector('.spinner');
        
        if (spinner) spinner.style.display = 'none';
        if (p) p.textContent = text;
        
        if (!isPermanent) {
            setTimeout(() => {
                boardLoadingOverlay.style.display = 'none';
                if (spinner) spinner.style.display = 'block'; // 원상복구
                isResetting = false;
                if (callback) callback();
            }, 1500);
        } else {
            // 영구 표시 모드일 경우 사라지지 않고 애니메이션(스피너)만 감춘 채 멈춤
            if (callback) callback();
        }
    }

    // 네모(직사각형) 면적 드래그 방식에 맞춘 완벽한 데드락 판정 (전수 검사)
    function hasAvailableMoves() {
        // 보드판에서 만들 수 있는 모든 가능한 직사각형(Top-Left부터 Bottom-Right) 영역을 탐색합니다.
        for (let r1 = 0; r1 < ROWS; r1++) {
            for (let c1 = 0; c1 < COLS; c1++) {
                for (let r2 = r1; r2 < ROWS; r2++) {
                    for (let c2 = c1; c2 < COLS; c2++) {
                        
                        let count = 0;
                        let foundType = null;
                        let isPossible = true;

                        // 현재 만들어진 직사각형 영역(r1~r2, c1~c2) 안의 아이콘들을 스캔
                        for (let r = r1; r <= r2; r++) {
                            for (let c = c1; c <= c2; c++) {
                                const cellType = board[r][c].type;
                                if (cellType !== 'empty') {
                                    count++;
                                    // 최대 개수(4개)를 초과하면 불가능한 직사각형
                                    if (count > 4) {
                                        isPossible = false;
                                        break;
                                    }
                                    // 성격이 섞이는지 검사 (공명은 자유)
                                    if (cellType !== TYPE_RESONANCE) {
                                        if (!foundType) {
                                            foundType = cellType;
                                        } else if (foundType !== cellType) {
                                            isPossible = false; // 다른 성격이 섞임
                                            break;
                                        }
                                    }
                                }
                            }
                            if (!isPossible) break;
                        }

                        // 다른 성격이 하나도 안 섞이고, 개수가 2개~4개면 매칭 가능한 조합이 남아있다는 뜻!
                        if (isPossible && count >= 2 && count <= 4) {
                            return true;
                        }

                    }
                }
            }
        }
        
        // 가능한 모든 직사각형을 스캔했는데도 터뜨릴 수 있는 경우가 1개도 없다면 완전한 데드락!
        return false;
    }

    // ==========================================================================
    // 이펙트 및 공명 시스템
    // ==========================================================================
    function createExplosionParticles(cell) {
        const rect = cell.element.getBoundingClientRect();
        const containerRect = boardContainer.getBoundingClientRect();
        const centerX = (rect.left - containerRect.left + rect.width / 2) / currentScale;
        const centerY = (rect.top - containerRect.top + rect.height / 2) / currentScale;

        const particleCount = 8;
        const colors = ['#ffd2e5', '#ff8ebb', '#ff4d4d', '#f1c40f', '#4cd964', '#3fc5f0', '#9b59b6'];

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.classList.add('particle');
            particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            particle.style.borderRadius = '50%';
            particle.style.border = '2px solid #fff';

            const angle = (i * (360 / particleCount)) + (Math.random() * 20 - 10);
            const distance = 40 + Math.random() * 60;
            const tx = Math.cos(angle * Math.PI / 180) * distance;
            const ty = Math.sin(angle * Math.PI / 180) * distance;

            particle.style.setProperty('--tx', `${tx}px`);
            particle.style.setProperty('--ty', `${ty}px`);
            particle.style.setProperty('--rot', `${180 + Math.random() * 360}deg`);

            particle.style.left = `${centerX - 12}px`;
            particle.style.top = `${centerY - 12}px`;
            boardContainer.appendChild(particle);

            setTimeout(() => particle.remove(), 600);
        }
    }

    function updateScoreUI() {
        scoreVal.textContent = score;
        scoreVal.style.transform = 'scale(1.2)';
        setTimeout(() => scoreVal.style.transform = 'scale(1)', 100);
    }

    function updateComboUI() {
        comboVal.textContent = combo;
        comboVal.style.transform = 'scale(1.2)';
        setTimeout(() => comboVal.style.transform = 'scale(1)', 100);
    }

    function triggerComboRainbowEffect() {
        comboVal.classList.add('rainbow-active');
        
        for (let i = 0; i < 15; i++) {
            const confetti = document.createElement('div');
            confetti.classList.add('particle');
            const colors = ['#ff4d4d', '#f1c40f', '#4cd964', '#3fc5f0', '#9b59b6'];
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.width = '8px';
            confetti.style.height = '8px';
            confetti.style.borderRadius = '2px';

            const angle = Math.random() * 360;
            const distance = 30 + Math.random() * 40;
            confetti.style.setProperty('--tx', `${Math.cos(angle * Math.PI / 180) * distance}px`);
            confetti.style.setProperty('--ty', `${Math.sin(angle * Math.PI / 180) * distance}px`);
            confetti.style.setProperty('--rot', `${Math.random() * 720}deg`);
            confetti.style.left = `50%`;
            confetti.style.top = `70px`;

            document.getElementById('combo-box').appendChild(confetti);
            setTimeout(() => confetti.remove(), 600);
        }

        setTimeout(() => comboVal.classList.remove('rainbow-active'), 1500);
    }

    function updateResonanceUI() {
        resonanceCountTxt.textContent = `X${resonanceCount}`;
        if (resonanceCount > 0) {
            resonanceBtn.classList.remove('disabled');
            resonanceBtn.removeAttribute('disabled');
        } else {
            resonanceBtn.classList.add('disabled');
            resonanceBtn.setAttribute('disabled', 'true');
            isResonanceMode = false;
            resonanceBtn.classList.remove('active');
            gameBoard.style.boxShadow = 'none';
            appContainer.style.cursor = 'default';
        }
    }

    resonanceBtn.addEventListener('click', () => {
        if (resonanceCount <= 0 || !gameActive || isPaused || isResetting) return;
        isResonanceMode = !isResonanceMode;
        if (isResonanceMode) {
            soundManager.playResonanceClick();
            resonanceBtn.classList.add('active');
            gameBoard.style.boxShadow = '0 0 20px rgba(0, 255, 255, 0.6)';
            appContainer.style.cursor = 'crosshair';
        } else {
            resonanceBtn.classList.remove('active');
            gameBoard.style.boxShadow = 'none';
            appContainer.style.cursor = 'default';
        }
    });

    function applyResonanceItem(cell) {
        if (cell.type === 'empty' || cell.type === TYPE_RESONANCE) return;
        
        soundManager.playResonanceUse();
        
        cell.type = TYPE_RESONANCE;
        cell.imgElement.src = 'assets/resonance.png';
        cell.element.classList.add('resonance-cell');
        
        createExplosionParticles(cell);
        
        resonanceCount--;
        isResonanceMode = false;
        resonanceBtn.classList.remove('active');
        gameBoard.style.boxShadow = 'none';
        appContainer.style.cursor = 'default';
        
        updateResonanceUI();
        checkBoardStatus();
    }

    // ==========================================================================
    // UI 모달 버튼 이벤트
    // ==========================================================================
    startGameBtn.addEventListener('click', startGame);

    pauseBtn.addEventListener('click', () => {
        if (!gameActive || isPaused || isResetting) return;
        isPaused = true;
        soundManager.playPause();
        soundManager.pauseBgm();
        appContainer.classList.add('modal-active');
        pauseModal.classList.add('active');
    });

    resumeBtn.addEventListener('click', () => {
        isPaused = false;
        soundManager.playResume();
        soundManager.resumeBgm();
        appContainer.classList.remove('modal-active');
        pauseModal.classList.remove('active');
        lastFrameTime = performance.now();
    });

    restartBtn.addEventListener('click', () => {
        pauseModal.classList.remove('active');
        appContainer.classList.remove('modal-active');
        startGame();
    });

    exitBtn.addEventListener('click', () => {
        pauseModal.classList.remove('active');
        startModalTitle.textContent = '트릭컬 성격 공명 링크';
        startModalDesc.innerHTML = '아이콘을 마우스로 드래그하여 사각형으로 감싸 터뜨리세요!<br>사각형 안에 같은 성격이 2~4개 있어야 합니다.';
        startGameBtn.textContent = '게임 시작';
        startModal.classList.add('active');
        
        gameActive = false;
        isPaused = false;
        cancelAnimationFrame(animationFrameId);
        soundManager.stopBgm();
    });
});
