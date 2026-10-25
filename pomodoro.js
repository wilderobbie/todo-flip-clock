/* 番茄时钟模块：圆形进度 + 计时设置/今日统计/成就徽章 */
(function () {
  'use strict'

  const RING_C = 2 * Math.PI * 140 // 圆周长

  const PRESETS = {
    standard: { focus: 25, rest: 5, rounds: 4 },
    deep: { focus: 50, rest: 10, rounds: 4 },
    sprint: { focus: 15, rest: 3, rounds: 8 }
  }

  const LS_CFG = 'todo.pomodoro.cfg'
  const LS_STATS = 'todo.pomodoro.stats'

  let cfg = { preset: 'standard', focus: 25, rest: 5, rounds: 4, ringRatio: 50, ...loadCfg() }
  function loadCfg () {
    try { return JSON.parse(localStorage.getItem(LS_CFG)) || {} } catch { return {} }
  }
  function saveCfg () { localStorage.setItem(LS_CFG, JSON.stringify(cfg)) }

  function todayStats () {
    const today = new Date().toISOString().slice(0, 10)
    let s
    try { s = JSON.parse(localStorage.getItem(LS_STATS)) } catch { s = null }
    if (!s || s.date !== today) {
      s = { date: today, pomodoros: 0, focusSeconds: 0, interruptedSeconds: 0, interrupts: 0 }
    }
    return s
  }
  function saveStats (s) { localStorage.setItem(LS_STATS, JSON.stringify(s)) }

  /* ---------- 计时状态机 ---------- */
  const state = {
    phase: 'focus',      // focus | rest
    running: false,
    remaining: 0,        // 秒
    total: 0,            // 本阶段总秒数
    round: 1,
    timerId: null,
    finishedSession: false,
    segInterrupted: 0    // 本段专注中已被记录为中断的秒数（完成时从专注时长中扣减）
  }

  function focusSec () { return cfg.focus * 60 }
  function restSec () { return cfg.rest * 60 }

  function fmt (sec) {
    sec = Math.max(0, Math.ceil(sec))
    return String(Math.floor(sec / 60)).padStart(2, '0') + ':' + String(sec % 60).padStart(2, '0')
  }

  /* ---------- DOM ---------- */
  const $ = id => document.getElementById(id)
  const ringBar = $('ringBar')
  const pomoTime = $('pomoTime')
  const pomoStatus = $('pomoStatus')
  const pomoRound = $('pomoRound')
  const startBtn = $('startPauseBtn')
  const startLabel = $('startPauseLabel')
  const resetBtn = $('resetBtn')
  const interruptBtn = $('interruptBtn')

  let audio = null
  function beep () {
    try {
      if (!audio) audio = new Audio('assets/sounds/flip.wav')
      audio.currentTime = 0
      audio.play().catch(() => {})
    } catch { /* 静默 */ }
  }

  let toastTimer = null
  function toast (msg) {
    const t = $('toast')
    t.textContent = msg
    t.classList.add('show')
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => t.classList.remove('show'), 2200)
  }

  /* ---------- 渲染 ---------- */
  function render () {
    const remain = state.running || state.total ? state.remaining : focusSec()
    pomoTime.textContent = fmt(remain)

    const i18n = window.I18N || {}
    const statusMap = {
      focusRun: i18n.pFocusing || '专注中',
      restRun: i18n.pResting || '休息中',
      paused: i18n.pPaused || '已暂停',
      idle: i18n.pIdle || '就绪',
      done: i18n.pDone || '今日轮次已完成 🎉'
    }
    let key = 'idle'
    if (state.finishedSession) key = 'done'
    else if (state.total) key = state.running ? (state.phase === 'focus' ? 'focusRun' : 'restRun') : 'paused'
    pomoStatus.textContent = statusMap[key]

    const rounds = state.finishedSession ? cfg.rounds : cfg.rounds
    pomoRound.textContent = (window.I18N && window.I18N.pRound
      ? window.I18N.pRound.replace('{n}', state.phase === 'rest' ? state.round : state.round).replace('{t}', rounds)
      : `第 ${state.round}/${rounds} 轮`)

    // 进度环
    const total = state.total || (state.phase === 'rest' ? restSec() : focusSec())
    const progress = state.total ? 1 - state.remaining / total : 0
    ringBar.style.strokeDashoffset = (RING_C * (1 - progress)).toFixed(1)
    ringBar.classList.toggle('rest', state.phase === 'rest')

    // 按钮
    startLabel.textContent = state.running ? (window.I18N.pPause || '暂停')
      : (state.total ? (window.I18N.pResume || '继续') : (window.I18N.pStart || '开始'))
    startBtn.querySelector('span[data-icon]') && refreshIcon(startBtn, state.running ? 'pause' : 'play')

    renderStats()
  }

  function refreshIcon (btn, name) {
    const holder = btn.querySelector('[data-icon]')
    if (holder && window.__setIcon) window.__setIcon(holder, name)
  }

  function renderStats () {
    const s = todayStats()
    $('statDone').textContent = s.pomodoros
    $('statFocus').textContent = Math.round(s.focusSeconds / 60) + ' ' + (window.I18N.minUnit || '分钟')
    $('statInterrupt').textContent = Math.round(s.interruptedSeconds / 60) + ' ' + (window.I18N.minUnit || '分钟')

    // 成就徽章：未达成置灰，达成立即点亮
    $('badge-perseverance').classList.toggle('earned', s.pomodoros >= 8)
    $('badge-focus').classList.toggle('earned', s.focusSeconds >= 120 * 60)
    $('badge-efficiency').classList.toggle('earned', s.pomodoros >= 4 && s.interrupts <= 1)
  }

  /* ---------- 控制逻辑 ---------- */
  function startPause () {
    if (state.finishedSession) return
    if (state.running) {
      // 暂停
      clearInterval(state.timerId)
      state.timerId = null
      state.running = false
    } else {
      if (!state.total) { state.total = focusSec(); state.remaining = focusSec() }
      state.running = true
      state.timerId = setInterval(step, 1000)
    }
    render()
  }

  function step () {
    state.remaining--
    if (state.remaining <= 0) {
      onPhaseEnd()
    }
    render()
  }

  function onPhaseEnd () {
    const s = todayStats()
    clearInterval(state.timerId)
    state.timerId = null
    state.running = false
    beep()

    if (state.phase === 'focus') {
      s.pomodoros++
      // 专注时长只计入有效专注：扣除本段落中被记录为中断的时间，避免与中断时长重复累计
      s.focusSeconds += Math.max(0, state.total - (state.segInterrupted || 0))
      state.segInterrupted = 0
      saveStats(s)
      // 进入休息
      state.phase = 'rest'
      state.total = restSec()
      state.remaining = restSec()
      state.running = true
      state.timerId = setInterval(step, 1000)
    } else {
      // 休息结束
      if (state.round >= cfg.rounds) {
        state.finishedSession = true
        state.total = 0
        state.remaining = 0
      } else {
        state.round++
        state.phase = 'focus'
        state.total = focusSec()
        state.remaining = focusSec()
        state.running = true
        state.timerId = setInterval(step, 1000)
      }
    }
    render()
  }

  function reset () {
    clearInterval(state.timerId)
    state.timerId = null
    state.phase = 'focus'
    state.running = false
    state.round = 1
    state.total = 0
    state.remaining = 0
    state.finishedSession = false
    state.segInterrupted = 0
    render()
  }

  function recordInterrupt () {
    if (!state.running || state.phase !== 'focus') {
      toast(window.I18N.pInterruptTip || '仅在专注计时进行中可记录中断')
      return
    }
    const elapsed = state.total - state.remaining
    const s = todayStats()
    s.interruptedSeconds += elapsed
    s.interrupts++
    saveStats(s)
    // 记录本段落已被中断的时长，供专注完成时扣减
    state.segInterrupted = (state.segInterrupted || 0) + elapsed
    // 记录后暂停
    clearInterval(state.timerId)
    state.timerId = null
    state.running = false
    toast((window.I18N.pInterrupted || '已记录中断') + ` +${fmt(elapsed)}`)
    render()
  }

  /* ---------- 设置面板 ---------- */
  function applyCfg (preset, focus, rest, rounds, silent) {
    cfg.preset = preset
    if (preset === 'custom') {
      cfg.focus = focus
      cfg.rest = rest
      cfg.rounds = rounds
    } else {
      Object.assign(cfg, PRESETS[preset])
    }
    saveCfg()
    reset()
    renderPreset()
    if (!silent) toast(window.I18N.pApplied || '设置已生效')
  }

  function renderPreset () {
    document.querySelectorAll('#presetList .preset').forEach(b =>
      b.classList.toggle('on', b.dataset.preset === cfg.preset))
    if (cfg.preset === 'custom') {
      $('customFocus').value = cfg.focus
      $('customRest').value = cfg.rest
      $('customRounds').value = cfg.rounds
    }
  }

  /* ---------- 显示比例（圆环缩放） ---------- */
  function applyRingScale () {
    const scale = 0.6 + (cfg.ringRatio / 100) * 0.8
    document.getElementById('view-pomodoro').style.setProperty('--ring-scale', scale.toFixed(3))
  }

  function initPanel () {
    const panel = $('pomoPanel')
    const btn = $('pomoSettingsBtn')
    const closeBtn = $('pomoPanelClose')

    function toggle (open) {
      const willOpen = open !== undefined ? open : !panel.classList.contains('open')
      panel.classList.toggle('open', willOpen)
      btn.classList.toggle('open', willOpen)
    }
    btn.addEventListener('click', () => toggle())
    closeBtn.addEventListener('click', () => toggle(false))
    Pomodoro.togglePanel = toggle

    // 沉浸全屏
    $('pomoFsBtn').addEventListener('click', () => {
      window.__toggleImmersive($('pomoStage'), $('pomoFsBtn'))
    })

    $('presetList').addEventListener('click', e => {
      const b = e.target.closest('.preset')
      if (!b || b.id === 'customPreset') return
      applyCfg(b.dataset.preset)
    })

    $('applyCustomBtn').addEventListener('click', () => {
      const focus = Math.min(180, Math.max(1, parseInt($('customFocus').value, 10) || 25))
      const rest = Math.min(60, Math.max(1, parseInt($('customRest').value, 10) || 5))
      const rounds = Math.min(16, Math.max(1, parseInt($('customRounds').value, 10) || 4))
      applyCfg('custom', focus, rest, rounds)
    })

    // 时钟比例滑块 0~100
    const ringSlider = $('ringSlider')
    ringSlider.value = cfg.ringRatio
    ringSlider.addEventListener('input', () => {
      cfg.ringRatio = +ringSlider.value
      saveCfg()
      applyRingScale()
    })

    startBtn.addEventListener('click', startPause)
    resetBtn.addEventListener('click', reset)
    interruptBtn.addEventListener('click', recordInterrupt)
  }

  window.Pomodoro = {
    init () {
      ringBar.style.strokeDasharray = RING_C
      applyRingScale()
      initPanel()
      renderPreset()
      render()
    },
    rerender: render,
    togglePanel: null
  }
})()
