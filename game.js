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



    // 콤보별 주파수 피치 상승 플레이어 (10단위 순환형 텐션 기획 적용)

    playPitchMatch(comboCount) {

        const cycle = comboCount % 10;

        let mult = 1.00;

        

        if (cycle >= 3 && cycle <= 5) mult = 1.10;

        else if (cycle >= 6 && cycle <= 7) mult = 1.20;

        else if (cycle >= 8 && cycle <= 9) mult = 1.30;

        else if (cycle === 0) mult = 1.00; // 배수 콤보 터진 직후에는 묵직한 기본음에서 리셋 시작

        

        this._playTone(523.25 * mult, 'sine', 0.12, 0.8);

        setTimeout(() => this._playTone(659.25 * mult, 'sine', 0.12, 0.8), 50);

        setTimeout(() => this._playTone(783.99 * mult, 'sine', 0.2, 0.6), 100);

    }



    // 10콤보 최초 달성 등 아이템 획득 팡파레 고음 사운드

    playItemAcquisition() {

        const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];

        notes.forEach((freq, i) => {

            setTimeout(() => this._playTone(freq * 1.2, 'triangle', 0.15, 0.6), i * 60);

        });

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

    // 모바일 웹 핀치 줌 및 강제 뷰포트 밀림 방어

    document.addEventListener('touchmove', (e) => {

        if (e.touches.length > 1) {

            e.preventDefault(); // 다중 터치 핀치 줌 강제 차단

        }

    }, { passive: false });



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

    let fishingCount = 0; // 신설: 낚시 아이템 보유 수량

    let lastAwardedComboTier = 0; // 아이템을 지급받은 마지막 콤보 10단위 (1, 2, 3...)

    let isFishingMode = false; // 신설: 낚시 아이템 조준 상태 변수

    let currentScale = 1; // 화면 스케일 비율 저장용 변수

    

    // 타이머 (setInterval 50ms 기반 고성능 최적화 루프)

    let timeRemainingMs = TOTAL_TIME_MS;

    let comboTimeRemainingMs = 0;

    let lastTickTime = 0;

    let gameIntervalId = null;



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



    // DOM 요소 (로비 및 게임 신설 요소 포함)

    const appContainer = document.getElementById('app-container');

    const lobbyScreen = document.getElementById('lobby-screen');

    const gameScreen = document.getElementById('game-screen');

    

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



    // 모달 팝업 요소들

    const startModal = document.getElementById('start-modal');

    const startModalTitle = document.getElementById('start-modal-title');

    const startModalDesc = document.getElementById('start-modal-desc');

    const startGameBtn = document.getElementById('start-game-btn');

    const lobbyBackBtn = document.getElementById('lobby-back-btn'); // 신설 로비행 버튼



    const pauseBtn = document.getElementById('pause-btn');

    const pauseModal = document.getElementById('pause-modal');

    const resumeBtn = document.getElementById('resume-btn');

    const restartBtn = document.getElementById('restart-btn');

    const exitBtn = document.getElementById('exit-btn');



    // 신설 모달 5종

    const achieveModal = document.getElementById('achieve-modal');

    const rankModal = document.getElementById('rank-modal');

    const tutorialModal = document.getElementById('tutorial-modal');

    const rewardModal = document.getElementById('reward-modal');

    const volumeModal = document.getElementById('volume-modal');



    // 로비 제어 버튼들

    const volumeBtn = document.getElementById('volume-btn');

    const achieveBtn = document.getElementById('achieve-btn');

    const rankBtn = document.getElementById('rank-btn');

    const lobbyTutorialBtn = document.getElementById('lobby-tutorial-btn');

    const playBtn = document.getElementById('play-btn');



    // 신설 모달 닫기 확인 버튼들

    const achieveCloseBtn = document.getElementById('achieve-close-btn');

    const rankCloseBtn = document.getElementById('rank-close-btn');

    const tutorialCloseBtn = document.getElementById('tutorial-close-btn');

    const rewardCloseBtn = document.getElementById('reward-close-btn');

    const volumeCloseBtn = document.getElementById('volume-close-btn');

    const dataResetBtn = document.getElementById('data-reset-btn');



    // 신설 볼륨 설정 UI 슬라이더 및 텍스트 (로비)

    const lobbyBgmVolume = document.getElementById('lobby-bgm-volume');

    const lobbySfxVolume = document.getElementById('lobby-sfx-volume');

    const lobbyBgmVolumeVal = document.getElementById('lobby-bgm-volume-val');

    const lobbySfxVolumeVal = document.getElementById('lobby-sfx-volume-val');



    // 인게임 일시정지 볼륨 설정 UI 슬라이더 및 텍스트

    const gameBgmVolume = document.getElementById('bgm-volume');

    const gameSfxVolume = document.getElementById('sfx-volume');

    const gameBgmVolumeVal = document.getElementById('bgm-volume-val');

    const gameSfxVolumeVal = document.getElementById('sfx-volume-val');



    // ==========================================================================

    // 볼륨 세팅 로드 및 동기화

    // ==========================================================================

    function initVolumeSettings() {

        let savedBgm = localStorage.getItem('trickcal_bgm_vol');

        let savedSfx = localStorage.getItem('trickcal_sfx_vol');



        // 기본값 세팅: BGM 30, SFX 70

        if (savedBgm === null) savedBgm = 30;

        if (savedSfx === null) savedSfx = 70;



        savedBgm = parseInt(savedBgm);

        savedSfx = parseInt(savedSfx);



        // 슬라이더 및 텍스트 값 반영 (로비)

        if (lobbyBgmVolume) {

            lobbyBgmVolume.value = savedBgm;

            lobbyBgmVolumeVal.textContent = savedBgm;

        }

        if (lobbySfxVolume) {

            lobbySfxVolume.value = savedSfx;

            lobbySfxVolumeVal.textContent = savedSfx;

        }



        // 슬라이더 및 텍스트 값 반영 (인게임 일시정지)

        if (gameBgmVolume) {

            gameBgmVolume.value = savedBgm;

            gameBgmVolumeVal.textContent = savedBgm;

        }

        if (gameSfxVolume) {

            gameSfxVolume.value = savedSfx;

            gameSfxVolumeVal.textContent = savedSfx;

        }



        // 사운드 매니저 볼륨 실시간 세팅

        soundManager.setBgmVolume(savedBgm / 100);

        soundManager.setSfxVolume(savedSfx / 100);

    }



    if (lobbyBgmVolume) {

        lobbyBgmVolume.addEventListener('input', () => {

            const val = parseInt(lobbyBgmVolume.value);

            lobbyBgmVolumeVal.textContent = val;

            soundManager.setBgmVolume(val / 100);

            localStorage.setItem('trickcal_bgm_vol', val);

            

            // 인게임 쪽 슬라이더도 실시간 싱크

            if (gameBgmVolume) {

                gameBgmVolume.value = val;

                gameBgmVolumeVal.textContent = val;

            }

        });

    }

    if (lobbySfxVolume) {

        lobbySfxVolume.addEventListener('input', () => {

            const val = parseInt(lobbySfxVolume.value);

            lobbySfxVolumeVal.textContent = val;

            soundManager.setSfxVolume(val / 100);

            localStorage.setItem('trickcal_sfx_vol', val);

            

            // 인게임 쪽 슬라이더도 실시간 싱크

            if (gameSfxVolume) {

                gameSfxVolume.value = val;

                gameSfxVolumeVal.textContent = val;

            }

        });

    }



    if (gameBgmVolume) {

        gameBgmVolume.addEventListener('input', () => {

            const val = parseInt(gameBgmVolume.value);

            gameBgmVolumeVal.textContent = val;

            soundManager.setBgmVolume(val / 100);

            localStorage.setItem('trickcal_bgm_vol', val);

            

            // 로비 쪽 슬라이더도 실시간 싱크

            if (lobbyBgmVolume) {

                lobbyBgmVolume.value = val;

                lobbyBgmVolumeVal.textContent = val;

            }

        });

    }

    if (gameSfxVolume) {

        gameSfxVolume.addEventListener('input', () => {

            const val = parseInt(gameSfxVolume.value);

            gameSfxVolumeVal.textContent = val;

            soundManager.setSfxVolume(val / 100);

            localStorage.setItem('trickcal_sfx_vol', val);

            

            // 로비 쪽 슬라이더도 실시간 싱크

            if (lobbySfxVolume) {

                lobbySfxVolume.value = val;

                lobbySfxVolumeVal.textContent = val;

            }

        });

    }



    // 초기 볼륨 활성화

    initVolumeSettings();



    // ==========================================================================

    // 일일 플레이 트래킹 및 보상 로컬스토리지 로직

    // ==========================================================================

    function getTodayString() {

        const d = new Date();

        const yyyy = d.getFullYear();

        const mm = String(d.getMonth() + 1).padStart(2, '0');

        const dd = String(d.getDate()).padStart(2, '0');

        return `${yyyy}-${mm}-${dd}`;

    }



    function checkDailyReset() {

        const today = getTodayString();

        const lastDate = localStorage.getItem('trickcal_daily_plays_date');



        if (lastDate !== today) {

            localStorage.setItem('trickcal_daily_plays_date', today);

            localStorage.setItem('trickcal_daily_plays_count', '0');

            localStorage.setItem('trickcal_daily_rewards_claimed', JSON.stringify([false, false, false]));

        }

    }



    function getDailyPlaysCount() {

        checkDailyReset();

        return parseInt(localStorage.getItem('trickcal_daily_plays_count') || '0');

    }



    function incrementDailyPlays() {

        checkDailyReset();

        const count = getDailyPlaysCount();

        localStorage.setItem('trickcal_daily_plays_count', String(count + 1));

        updateRewardIcons();

    }



    function getDailyRewardsClaimed() {

        checkDailyReset();

        try {

            return JSON.parse(localStorage.getItem('trickcal_daily_rewards_claimed') || '[false, false, false]');

        } catch (e) {

            return [false, false, false];

        }

    }



    function setDailyRewardClaimed(index) {

        const claimed = getDailyRewardsClaimed();

        claimed[index] = true;

        localStorage.setItem('trickcal_daily_rewards_claimed', JSON.stringify(claimed));

        updateRewardIcons();

    }



    // 모카롱 일일 보상 아이콘 상태 갱신

    function updateRewardIcons() {

        const count = getDailyPlaysCount();

        const claimed = getDailyRewardsClaimed();



        for (let i = 1; i <= 3; i++) {

            const rewardItem = document.getElementById(`reward-${i}`);

            if (!rewardItem) continue;



            rewardItem.classList.remove('claimable', 'claimed');

            rewardItem.removeAttribute('disabled');



            if (claimed[i - 1]) {

                // 이미 보상 수령한 슬롯

                rewardItem.classList.add('claimed');

                rewardItem.setAttribute('disabled', 'true');

            } else if (count >= i) {

                // 보상 수령 가능한 슬롯 (플레이 횟수 충족)

                rewardItem.classList.add('claimable');

            } else {

                // 아직 플레이 횟수 부족

                rewardItem.setAttribute('disabled', 'true');

            }

        }

    }



    // 일일 보상 클릭 이벤트 바인딩

    for (let i = 1; i <= 3; i++) {

        const rewardItem = document.getElementById(`reward-${i}`);

        if (rewardItem) {

            rewardItem.addEventListener('click', () => {

                const count = getDailyPlaysCount();

                const claimed = getDailyRewardsClaimed();

                const step = i;



                if (!claimed[step - 1] && count >= step) {

                    // 수령 처리

                    setDailyRewardClaimed(step - 1);

                    soundManager.playClear();



                    // 보상 획득 모달 활성화

                    const rewardDescTxt = document.getElementById('reward-desc-txt');

                    if (rewardDescTxt) {

                        rewardDescTxt.innerHTML = `달콤한 일일 플레이 모카롱 보상(${step}회차)을 수령했습니다!<br>우로스의 응원을 받아 기운이 가득 솟아납니다!`;

                    }

                    openModal(rewardModal);

                    

                    // 기근상 업적 검사 연동

                    if (step === 3) {

                        unlockAchievement('daily_attendance');

                    }

                }

            });

        }

    }



    // ==========================================================================

    // 업적(Achievements) 및 랭킹(Rankings) 코어 시스템

    // ==========================================================================

    const ACHIEVEMENTS = [

        { id: 'first_play', title: '첫 조율의 발걸음', desc: '성격 공명 링크 미니게임을 1회 완료하기' },

        { id: 'score_80', title: '능숙한 조율사', desc: '단일 게임에서 최고 80점 이상 획득하기' },

        { id: 'combo_20', title: '완벽한 시너지', desc: '단일 게임에서 최대 20콤보 이상 달성하기' },

        { id: 'resonance_master', title: '공명 에너지 과부하', desc: '누적 공명 물약 5회 사용하기 (모든 판 합산)' },

        { id: 'daily_attendance', title: '오늘의 참모', desc: '일일 플레이 3회차 모카롱 보상을 수령하기' },

        { id: 'perfect_clear', title: '성격 공명의 신', desc: '보드판을 완벽히 비우고 135점 최고 만점 달성하기' }

    ];



    function getUnlockedAchievements() {

        try {

            return JSON.parse(localStorage.getItem('trickcal_unlocked_achievements') || '[]');

        } catch (e) {

            return [];

        }

    }



    function unlockAchievement(id) {

        const unlocked = getUnlockedAchievements();

        if (!unlocked.includes(id)) {

            unlocked.push(id);

            localStorage.setItem('trickcal_unlocked_achievements', JSON.stringify(unlocked));



            // 달성 알림 우로스 멘트 제거 (대사 고정 요건 준수)

        }

    }



    function checkGameEndAchievements(finalScore, maxComboCount) {

        // 첫 플레이

        unlockAchievement('first_play');



        // 80점 돌파

        if (finalScore >= 80) {

            unlockAchievement('score_80');

        }



        // 20콤보 돌파

        if (maxComboCount >= 20) {

            unlockAchievement('combo_20');

        }



        // 135점 완벽 만점 클리어

        if (finalScore >= 135) {

            unlockAchievement('perfect_clear');

        }

    }



    function incrementResonanceUsage() {

        let usages = parseInt(localStorage.getItem('trickcal_resonance_usages') || '0');

        usages++;

        localStorage.setItem('trickcal_resonance_usages', String(usages));

        if (usages >= 5) {

            unlockAchievement('resonance_master');

        }

    }



    function renderAchievements() {

        const listContainer = document.getElementById('achieve-list');

        if (!listContainer) return;



        const unlocked = getUnlockedAchievements();

        listContainer.innerHTML = '';



        ACHIEVEMENTS.forEach(ach => {

            const isUnlocked = unlocked.includes(ach.id);

            const item = document.createElement('div');

            item.classList.add('achieve-item');



            item.innerHTML = `

                <div class="achieve-info">

                    <span class="achieve-title">${ach.title}</span>

                    <span class="achieve-desc">${ach.desc}</span>

                </div>

                <div class="achieve-status ${isUnlocked ? 'completed' : 'locked'}">

                    ${isUnlocked ? '달성 완료 ✓' : '미달성'}

                </div>

            `;

            listContainer.appendChild(item);

        });

    }



    // 점수 랭킹 시스템

    function getRankings() {

        try {

            return JSON.parse(localStorage.getItem('trickcal_rankings_v2') || '[]');

        } catch (e) {

            return [];

        }

    }



    function addRanking(newScore, timeStr) {

        const list = getRankings();

        const d = new Date();

        const dateStr = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;

        const timestamp = d.getTime();



        list.push({ score: newScore, date: dateStr, time: timeStr || '', timestamp: timestamp });



        // 소요 시간 문자열을 초 단위 정수로 파싱하는 내부 헬퍼 함수

        function parseTimeToSeconds(tStr) {

            if (!tStr) return 999999; // 소요 시간 기록이 없는 구버전 데이터는 뒤로 정렬

            const match = tStr.match(/(?:(\d+)분\s*)?(\d+)초/);

            if (!match) return 999999;

            const min = parseInt(match[1] || '0', 10);

            const sec = parseInt(match[2], 10);

            return min * 60 + sec;

        }



        // 우선순위 정렬 규칙 적용:

        // 1순위: 점수 내림차순 (높은 점수 우선)

        // 2순위: 소요 시간 오름차순 (짧은 시간 우선)

        // 3순위: 먼저 깬 기록 오름차순 (과거 타임스탬프 우선)

        list.sort((a, b) => {

            if (b.score !== a.score) {

                return b.score - a.score;

            }

            

            const aSec = parseTimeToSeconds(a.time);

            const bSec = parseTimeToSeconds(b.time);

            if (aSec !== bSec) {

                return aSec - bSec;

            }

            

            const aTime = a.timestamp || 0;

            const bTime = b.timestamp || 0;

            return aTime - bTime;

        });



        // 상위 5개 보존

        const sliced = list.slice(0, 5);

        localStorage.setItem('trickcal_rankings_v2', JSON.stringify(sliced));

    }



    function renderRankings() {

        const listContainer = document.getElementById('rank-list');

        if (!listContainer) return;



        const rankings = getRankings();

        listContainer.innerHTML = '';



        if (rankings.length === 0) {

            listContainer.innerHTML = '<p class="modal-desc" style="margin: 20px 0;">아직 달성한 랭킹 기록이 없습니다. 도전해 보세요!</p>';

            return;

        }



        rankings.forEach((r, idx) => {

            const item = document.createElement('div');

            item.classList.add('rank-item');



            let rankClass = '';

            if (idx === 0) rankClass = 'gold';

            else if (idx === 1) rankClass = 'silver';

            else if (idx === 2) rankClass = 'bronze';



            item.innerHTML = `

                <div class="rank-num ${rankClass}">${idx + 1}위</div>

                <div class="rank-date">${r.date}</div>

                <div class="rank-score-container">

                    <div class="rank-score">${r.score}점</div>

                    ${r.time ? `<div class="rank-time">⏰ ${r.time}</div>` : ''}

                </div>

            `;

            listContainer.appendChild(item);

        });

    }



    // ==========================================================================

    // 우로스 대사 및 모달 제어 편의 기능

    // ==========================================================================

    const UROS_SPEECHES = [

        "능력을 발휘해 보겠어요.",

        "성격 조율은 교단 최고의 연구 과제랍니다.",

        "모카롱은 달콤하고 아주 소중하답니다!",

        "도움이 필요하다면 언제든 공명 물약을 쓰세요.",

        "우로스는 교단의 믿음직한 참모예요!",

        "오늘 하루도 신나는 조율을 시작해 봐요!",

        "차분하게 하나씩 이어가면 완벽히 깰 수 있어요."

    ];



    function changeUrosSpeech(text) {

        // 대사 정적 고정 요건(능력을 발휘해 보겠어요.)에 따라 동적 변경을 처리하지 않음

    }



    function randomUrosSpeech() {

        // 대사 정적 고정 요건(능력을 발휘해 보겠어요.)에 따라 동적 변경을 처리하지 않음

    }



    // 캐릭터 터치 반응 제거 (대사는 언제나 영구 고정)

    const urosChar = document.getElementById('uros-character');

    if (urosChar) {

        urosChar.addEventListener('click', () => {

            // 정적 유지

        });

    }



    function openModal(modal) {

        if (!modal) return;

        appContainer.classList.add('modal-active');

        modal.classList.add('active');

        // 부드럽게 오프닝 효과음을 사운드 매니저 볼륨에 맞춤형 재생

        soundManager.playResume();

    }



    function closeModal(modal) {

        if (!modal) return;

        modal.classList.remove('active');

        // 켜져 있는 다른 액티브 모달이 없는지 확인 후 컨테이너 모달 비활성화

        const activeModals = document.querySelectorAll('.modal-overlay.active');

        if (activeModals.length === 0) {

            appContainer.classList.remove('modal-active');

        }

    }



    // 화면 페이드 트랜지션 연출

    function showScreen(targetScreen) {

        const screens = document.querySelectorAll('.screen');

        screens.forEach(s => {

            s.classList.remove('active');

            s.style.display = 'none';

        });



        targetScreen.style.display = 'flex';

        void targetScreen.offsetWidth; // 브라우저 강제 레이아웃 동기화 (Reflow 유도)

        targetScreen.classList.add('active');

    }



    // ==========================================================================

    // 로비 화면 제어 버튼 바인딩

    // ==========================================================================

    

    // 볼륨 조절 버튼

    if (volumeBtn) {

        volumeBtn.addEventListener('click', () => {

            initVolumeSettings(); // 최신 세팅값 슬라이더 싱크

            openModal(volumeModal);

        });

    }

    if (volumeCloseBtn) {

        volumeCloseBtn.addEventListener('click', () => {

            closeModal(volumeModal);

        });

    }

    if (dataResetBtn) {

        dataResetBtn.addEventListener('click', () => {

            const confirmed = confirm("모든 플레이 기록(점수 랭킹, 최고 기록, 업적 해금 현황, 일일 모카롱 플레이 횟수)을 초기화할까요?");

            if (confirmed) {

                const keys = [

                    'trickcal_rankings_v2',

                    'trickcal_link_highscore_v2',

                    'trickcal_unlocked_achievements',

                    'trickcal_resonance_usages',

                    'trickcal_daily_plays_date',

                    'trickcal_daily_plays_count',

                    'trickcal_daily_rewards_claimed'

                ];

                keys.forEach(k => localStorage.removeItem(k));

                alert("플레이 기록이 완전히 초기화되었습니다!");

                location.reload();

            }

        });

    }



    // 업적 버튼

    if (achieveBtn) {

        achieveBtn.addEventListener('click', () => {

            renderAchievements();

            openModal(achieveModal);

        });

    }

    if (achieveCloseBtn) {

        achieveCloseBtn.addEventListener('click', () => {

            closeModal(achieveModal);

        });

    }



    // 점수 랭킹 버튼

    if (rankBtn) {

        rankBtn.addEventListener('click', () => {

            renderRankings();

            openModal(rankModal);

        });

    }

    if (rankCloseBtn) {

        rankCloseBtn.addEventListener('click', () => {

            closeModal(rankModal);

        });

    }



    // 튜토리얼 버튼

    if (lobbyTutorialBtn) {

        lobbyTutorialBtn.addEventListener('click', () => {

            openModal(tutorialModal);

        });

    }

    if (tutorialCloseBtn) {

        tutorialCloseBtn.addEventListener('click', () => {

            closeModal(tutorialModal);

        });

    }



    // 보상 모달 닫기

    if (rewardCloseBtn) {

        rewardCloseBtn.addEventListener('click', () => {

            closeModal(rewardModal);

        });

    }



    // Play! 버튼 누를 때 로비 -> 인게임 페이드

    if (playBtn) {

        playBtn.addEventListener('click', () => {

            showScreen(gameScreen);

            startGame();

        });

    }



    // 결과창 "로비로 가기" 연동

    if (lobbyBackBtn) {

        lobbyBackBtn.addEventListener('click', () => {

            closeModal(startModal);

            showScreen(lobbyScreen);

            updateRewardIcons(); // 플레이 횟수가 1 추가되었으므로 모카롱 갱신

        });

    }



    // 최초 로드 시 모카롱 아이콘 보상 상태 최신 갱신

    updateRewardIcons();



    // ==========================================================================

    // 반응형 스케일핏(Scale Fit) 조절 로직 (모바일/PC 모두 완벽 피팅)

    // ==========================================================================

    function updateVh() {

        const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;

        const vh = viewportHeight * 0.01;

        document.documentElement.style.setProperty('--vh', `${vh}px`);

    }



    function resizeGame() {

        if (!appContainer) return;

        

        updateVh();

        

        const targetWidth = 1024;

        const targetHeight = 640;

        

        const windowWidth = window.visualViewport ? window.visualViewport.width : window.innerWidth;

        const windowHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;

        

        const scaleX = windowWidth / targetWidth;

        const scaleY = windowHeight / targetHeight;

        const scale = Math.min(scaleX, scaleY);

        

        currentScale = scale; // 마우스 좌표 보정을 위한 스케일 저장

        

        appContainer.style.transform = `translate(-50%, -50%) scale(${scale})`;

        

        requestAnimationFrame(cacheCellCoords);

    }

    

    function handleResizeEvent() {

        resizeGame();

        setTimeout(resizeGame, 100);

        setTimeout(resizeGame, 300);

    }

    

    window.addEventListener('resize', handleResizeEvent);

    window.addEventListener('orientationchange', handleResizeEvent);

    window.addEventListener('load', handleResizeEvent);

    

    if (window.visualViewport) {

        window.visualViewport.addEventListener('resize', handleResizeEvent);

        window.visualViewport.addEventListener('scroll', handleResizeEvent);

    }

    

    handleResizeEvent();



    // ==========================================================================

    // 게임 라이프사이클 및 타이머 루프

    // ==========================================================================

    function initGame() {

        score = 0;

        maxCombo = 0;

        combo = 0;

        resonanceCount = 0;

        fishingCount = 0;

        lastAwardedComboTier = 0;

        timeRemainingMs = TOTAL_TIME_MS;

        comboTimeRemainingMs = 0;

        

        isResonanceMode = false;

        isFishingMode = false; // 낚시 조준 모드 리셋

        isDragging = false;

        clearSelectionBox();

        

        updateScoreUI();

        updateComboUI();

        updateResonanceUI();

        updateFishingUI(); // 낚시 UI 갱신

        

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

        

        if (gameIntervalId) {

            clearInterval(gameIntervalId);

            gameIntervalId = null;

        }

        

        lastTickTime = performance.now();

        gameIntervalId = setInterval(updateGameTicks, 50);

    }



    function stopGame(reason = 'timeout') {

        gameActive = false;

        

        if (gameIntervalId) {

            clearInterval(gameIntervalId);

            gameIntervalId = null;

        }

        

        soundManager.stopBgm();

        

        // 보드판의 모든 흔들림 및 렌더링 애니메이션 차단 (CPU 부하 0% 돌입)

        for (let r = 0; r < ROWS; r++) {

            if (!board[r]) continue;

            for (let c = 0; c < COLS; c++) {

                const cell = board[r][c];

                if (cell && cell.element) {

                    cell.element.classList.remove('highlight-valid', 'highlight-invalid', 'resonance-cell');

                }

            }

        }

        

        if (reason === 'clear') {

            soundManager.playClear();

        } else {

            soundManager.playGameOver();

        }



        // 소요 시간 계산을 랭킹 저장 시점보다 상위로 이전하여 시간 정보 전달 준비

        const elapsedMs = TOTAL_TIME_MS - timeRemainingMs;

        const elapsedSec = Math.floor(elapsedMs / 1000);

        const elapsedMin = Math.floor(elapsedSec / 60);

        const elapsedSecRemainder = elapsedSec % 60;

        const timeStr = `${elapsedMin}분 ${elapsedSecRemainder < 10 ? '0' : ''}${elapsedSecRemainder}초`;



        // 일일 플레이 횟수 즉각 증가 및 랭킹 추가

        incrementDailyPlays();

        addRanking(score, timeStr);

        

        // 게임 오버시 업적 검사 실행

        checkGameEndAchievements(score, maxCombo);

        

        if (score > highScore) {

            highScore = score;

            localStorage.setItem(highScoreKey, highScore);

        }



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



    function updateGameTicks() {

        if (!gameActive || isPaused || isResetting) return;

        

        const currentTime = performance.now();

        const deltaTime = currentTime - lastTickTime;

        lastTickTime = currentTime;



        timeRemainingMs -= deltaTime;

        if (timeRemainingMs <= 0) {

            timeRemainingMs = 0;

            updateTimerUI();

            stopGame('timeout');

            return;

        }

        

        updateTimerUI();



        // 공명/낚시 아이템 조준 상태 중에는 콤보 감소 타이머 일시정지 (Q2 반영)

        if (isResonanceMode || isFishingMode) {

            return;

        }



        if (comboTimeRemainingMs > 0) {

            comboTimeRemainingMs -= deltaTime;

            const percent = Math.max(0, (comboTimeRemainingMs / COMBO_DURATION_MS) * 100);

            comboTimerBarFill.style.width = `${percent}%`;

            

            if (comboTimeRemainingMs <= 0) {

                comboTimeRemainingMs = 0;

                combo = 0;

                lastAwardedComboTier = 0;

                updateComboUI();

                comboTimerBarBg.style.display = 'none';

            }

        }

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



        if (!hasAvailableMoves()) {

            createBoard();

        } else {

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

        

        cacheCellCoords();

        

        if (isResonanceMode) {

            for (let r = 0; r < ROWS; r++) {

                if (!board[r]) continue;

                for (let c = 0; c < COLS; c++) {

                    const cell = board[r][c];

                    if (cell.type === 'empty') continue;

                    

                    const rect = cell.rect;

                    if (!rect) continue;

                    if (e.clientX >= rect.left && e.clientX <= rect.right &&

                        e.clientY >= rect.top && e.clientY <= rect.bottom) {

                        applyResonanceItem(cell);

                        return;

                    }

                }

            }

            return;

        }



        // 신규: 낚시 아이템 사용 조준 상태 처리

        if (isFishingMode) {

            for (let r = 0; r < ROWS; r++) {

                if (!board[r]) continue;

                for (let c = 0; c < COLS; c++) {

                    const cell = board[r][c];

                    if (cell.type === 'empty') continue;

                    

                    const rect = cell.rect;

                    if (!rect) continue;

                    if (e.clientX >= rect.left && e.clientX <= rect.right &&

                        e.clientY >= rect.top && e.clientY <= rect.bottom) {

                        applyFishingItem(cell);

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



        const boxRect = selectionBox.getBoundingClientRect();

        const newSelectedCells = [];

        

        for (let r = 0; r < ROWS; r++) {

            for (let c = 0; c < COLS; c++) {

                const cell = board[r][c];

                cell.element.classList.remove('highlight-valid', 'highlight-invalid');

                

                if (cell.type === 'empty') continue;



                const cellRect = cell.rect;

                if (!cellRect) continue;

                

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

        if (currentSelectedCells.length < 2 || currentSelectedCells.length > 4) {

            setSelectionStyle(false);

            return;

        }



        let foundType = null;

        let isValid = true;



        for (let cell of currentSelectedCells) {

            if (cell.type === TYPE_RESONANCE) continue;

            

            if (!foundType) {

                foundType = cell.type;

            } else if (foundType !== cell.type) {

                isValid = false;

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



    // 선택박스 및 하이라이트 해제

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

        

        const prevCombo = combo;

        combo += count;



        if (combo > maxCombo) {

            maxCombo = combo;

        }



        updateScoreUI();

        updateComboUI();



        comboTimeRemainingMs = COMBO_DURATION_MS;

        comboTimerBarBg.style.display = 'block';



        // 10의 배수 공명 물약 획득 검사

        const prevResonanceTier = Math.floor(prevCombo / 10);

        const currentResonanceTier = Math.floor(combo / 10);

        let itemEarned = false;



        if (currentResonanceTier > prevResonanceTier) {

            const earnedResonance = currentResonanceTier - prevResonanceTier;

            resonanceCount += earnedResonance;

            updateResonanceUI();

            itemEarned = true;

        }



        // 30의 배수 최초 돌파 낚시 아이템 획득 검사 (기획 의도대로 30 경계선을 건너뛰며 넘어가도 지급)

        const prevFishingTier = Math.floor(prevCombo / 30);

        const currentFishingTier = Math.floor(combo / 30);



        if (currentFishingTier > prevFishingTier) {

            const earnedFishing = currentFishingTier - prevFishingTier;

            fishingCount += earnedFishing;

            updateFishingUI();

            itemEarned = true;

        }



        // 사운드 피치 및 전용 획득음 조건 분기 (Q3 및 피치 순환 반영)

        if (itemEarned && combo >= 10) {

            soundManager.playItemAcquisition();

            triggerComboRainbowEffect();

        } else {

            soundManager.playPitchMatch(combo);

        }



        // 기존 콤보 티어 동기화 보존

        const currentComboTier = Math.floor(combo / 10);

        if (currentComboTier > lastAwardedComboTier) {

            lastAwardedComboTier = currentComboTier;

        }



        matchedCells.forEach(cell => {

            createExplosionParticles(cell);

            

            cell.type = 'empty';

            cell.element.classList.add('empty');

            cell.element.classList.remove('resonance-cell');

            cell.rect = null;

            

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

            score = 135;

            updateScoreUI();

            stopGame('clear');

            return;

        }



        if (activeCellsCount === 1) {

            if (fishingCount > 0) {

                return;

            }

            stopGame('deadlock');

            return;

        }



        if (score >= 135) {

            score = 135;

            updateScoreUI();

            stopGame('clear');

            return;

        }



        if (!hasAvailableMoves()) {

            if (resonanceCount === 0 && fishingCount === 0) {

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

                if (spinner) spinner.style.display = 'block';

                isResetting = false;

                if (callback) callback();

            }, 1500);

        } else {

            if (callback) callback();

        }

    }



    function hasAvailableMoves() {

        for (let r1 = 0; r1 < ROWS; r1++) {

            for (let c1 = 0; c1 < COLS; c1++) {

                for (let r2 = r1; r2 < ROWS; r2++) {

                    for (let c2 = c1; c2 < COLS; c2++) {

                        

                        let count = 0;

                        let foundType = null;

                        let isPossible = true;



                        for (let r = r1; r <= r2; r++) {

                            for (let c = c1; c <= c2; c++) {

                                const cellType = board[r][c].type;

                                if (cellType !== 'empty') {

                                    count++;

                                    if (count > 4) {

                                        isPossible = false;

                                        break;

                                    }

                                    if (cellType !== TYPE_RESONANCE) {

                                        if (!foundType) {

                                            foundType = cellType;

                                        } else if (foundType !== cellType) {

                                            isPossible = false;

                                            break;

                                        }

                                    }

                                }

                            }

                            if (!isPossible) break;

                        }



                        if (isPossible && count >= 2 && count <= 4) {

                            return true;

                        }



                    }

                }

            }

        }

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



    // 콤보 팝업 효과

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



    // 낚시 UI 갱신

    function updateFishingUI() {

        const fishingBtn = document.getElementById('fishing-btn');

        const fishingCountTxt = document.getElementById('fishing-count');

        if (!fishingBtn || !fishingCountTxt) return;



        fishingCountTxt.textContent = `X${fishingCount}`;

        if (fishingCount > 0) {

            fishingBtn.classList.remove('disabled');

            fishingBtn.removeAttribute('disabled');

        } else {

            fishingBtn.classList.add('disabled');

            fishingBtn.setAttribute('disabled', 'true');

            isFishingMode = false;

            fishingBtn.classList.remove('active');

            gameBoard.style.boxShadow = 'none';

            appContainer.style.cursor = 'default';

        }

    }



    // 낚시 버튼 클릭 조준 토글 핸들러 (배타적 모드 작동)

    const fishingBtn = document.getElementById('fishing-btn');

    if (fishingBtn) {

        fishingBtn.addEventListener('click', () => {

            if (fishingCount <= 0 || !gameActive || isPaused || isResetting) return;

            

            // 공명 모드가 켜져 있었다면 배타적으로 비활성화

            if (isResonanceMode) {

                isResonanceMode = false;

                const resonanceBtn = document.getElementById('resonance-btn');

                if (resonanceBtn) resonanceBtn.classList.remove('active');

            }



            isFishingMode = !isFishingMode;

            if (isFishingMode) {

                soundManager.playResonanceClick();

                fishingBtn.classList.add('active');

                gameBoard.style.boxShadow = '0 0 20px rgba(255, 142, 187, 0.6)'; // 낚시 핑크 글로우 효과

                appContainer.style.cursor = 'pointer';

            } else {

                fishingBtn.classList.remove('active');

                gameBoard.style.boxShadow = 'none';

                appContainer.style.cursor = 'default';

            }

        });

    }



    // 낚시 아이템 조커 기능 작동 (Q2 반영)

    function applyFishingItem(cell) {

        if (cell.type === 'empty') return;

        

        soundManager.playResonanceUse();

        

        // 푸른 물방울 전용 파티클 연출 방출 (Q2 반영)

        createBlueWaterParticles(cell);

        

        cell.type = 'empty';

        cell.element.classList.add('empty');

        cell.element.classList.remove('resonance-cell');

        cell.rect = null;

        

        if (cell.imgElement) {

            cell.imgElement.style.transform = 'scale(0) rotate(-180deg)';

            cell.imgElement.style.opacity = '0';

            setTimeout(() => {

                if (cell.element.contains(cell.imgElement)) {

                    cell.element.innerHTML = '';

                    cell.imgElement = null;

                }

            }, 200);

        }

        

        // 낚시 아이템 소모에 의한 점수 +1 및 콤보 +1 상승 처리

        score += 1;

        combo += 1;

        if (combo > maxCombo) {

            maxCombo = combo;

        }

        

        updateScoreUI();

        updateComboUI();

        

        comboTimeRemainingMs = COMBO_DURATION_MS;

        comboTimerBarBg.style.display = 'block';

        

        fishingCount--;

        isFishingMode = false;

        if (fishingBtn) fishingBtn.classList.remove('active');

        gameBoard.style.boxShadow = 'none';

        appContainer.style.cursor = 'default';

        

        updateFishingUI();

        

        // 낚시로 인한 콤보 상승 후 보상 획득 재검증

        const currentResonanceTier = Math.floor(combo / 10);

        if (currentResonanceTier > Math.floor((combo - 1) / 10)) {

            resonanceCount += 1;

            updateResonanceUI();

            soundManager.playItemAcquisition();

            triggerComboRainbowEffect();

        }

        const currentFishingTier = Math.floor(combo / 30);

        if (currentFishingTier > Math.floor((combo - 1) / 30)) {

            fishingCount += 1;

            updateFishingUI();

            soundManager.playItemAcquisition();

            triggerComboRainbowEffect();

        }

        

        setTimeout(checkBoardStatus, 250);

    }



    // 낚시 조커 전용 푸른 물방울 파티클 이펙트 (Q2 반영)

    function createBlueWaterParticles(cell) {

        const rect = cell.element.getBoundingClientRect();

        const containerRect = boardContainer.getBoundingClientRect();

        const centerX = (rect.left - containerRect.left + rect.width / 2) / currentScale;

        const centerY = (rect.top - containerRect.top + rect.height / 2) / currentScale;



        const particleCount = 12;

        const colors = ['#3fc5f0', '#00d2fc', '#82e6ff', '#ffffff', '#a3f3fc'];



        for (let i = 0; i < particleCount; i++) {

            const particle = document.createElement('div');

            particle.classList.add('particle');

            particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

            particle.style.borderRadius = '50%';

            particle.style.border = '1.5px solid #fff';



            // 힘차게 낚아 올리는 상향(200도~340도) 운동 궤적 설계

            const angle = 200 + Math.random() * 140;

            const distance = 50 + Math.random() * 70;

            const tx = Math.cos(angle * Math.PI / 180) * distance;

            const ty = Math.sin(angle * Math.PI / 180) * distance - 30;



            particle.style.setProperty('--tx', `${tx}px`);

            particle.style.setProperty('--ty', `${ty}px`);

            particle.style.setProperty('--rot', `${Math.random() * 180}deg`);



            const size = 8 + Math.random() * 10;

            particle.style.width = `${size}px`;

            particle.style.height = `${size}px`;



            particle.style.left = `${centerX - size/2}px`;

            particle.style.top = `${centerY - size/2}px`;

            boardContainer.appendChild(particle);



            setTimeout(() => particle.remove(), 600);

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

        

        // 공명 아이템 사용 업적 체크 연동

        incrementResonanceUsage();

        

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

        

        initVolumeSettings(); // 최신 세팅값 인게임 일시정지 슬라이더 싱크

        soundManager.playPause();

        soundManager.pauseBgm();

        

        if (gameIntervalId) {

            clearInterval(gameIntervalId);

            gameIntervalId = null;

        }

        

        for (let r = 0; r < ROWS; r++) {

            if (!board[r]) continue;

            for (let c = 0; c < COLS; c++) {

                const cell = board[r][c];

                if (cell && cell.element) {

                    cell.element.classList.remove('highlight-valid', 'highlight-invalid');

                }

            }

        }



        appContainer.classList.add('modal-active');

        appContainer.classList.add('paused-active');

        pauseModal.classList.add('active');

    });



    resumeBtn.addEventListener('click', () => {

        isPaused = false;

        soundManager.playResume();

        soundManager.resumeBgm();

        appContainer.classList.remove('modal-active');

        appContainer.classList.remove('paused-active');

        pauseModal.classList.remove('active');

        

        lastTickTime = performance.now();

        if (gameIntervalId) clearInterval(gameIntervalId);

        gameIntervalId = setInterval(updateGameTicks, 50);

    });



    restartBtn.addEventListener('click', () => {

        pauseModal.classList.remove('active');

        appContainer.classList.remove('modal-active');

        appContainer.classList.remove('paused-active');

        startGame();

    });



    exitBtn.addEventListener('click', () => {

        pauseModal.classList.remove('active');

        appContainer.classList.remove('paused-active');

        appContainer.classList.remove('modal-active');

        

        gameActive = false;

        isPaused = false;

        

        if (gameIntervalId) {

            clearInterval(gameIntervalId);

            gameIntervalId = null;

        }

        

        soundManager.stopBgm();

        

        for (let r = 0; r < ROWS; r++) {

            if (!board[r]) continue;

            for (let c = 0; c < COLS; c++) {

                const cell = board[r][c];

                if (cell && cell.element) {

                    cell.element.classList.remove('highlight-valid', 'highlight-invalid', 'resonance-cell');

                }

            }

        }



        // 로비로 퇴장

        showScreen(lobbyScreen);

        updateRewardIcons();

    });

});



