/* 翻页时钟模块：计分器式翻页动画 + 右侧设置面板 */
(function () {
  'use strict'

  const LS_KEY = 'todo.flipclock'
  const defaults = {
    format: '24',       // '12' | '24'
    ratio: 50,          // 翻页比例 0~100
    brightness: 100,    // 数字亮度 0~100
    sound: true,        // 翻页声音
    showDate: true      // 显示日期
  }
  let cfg = { ...defaults, ...load() }

  function load () {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || {} } catch { return {} }
  }
  function save () { localStorage.setItem(LS_KEY, JSON.stringify(cfg)) }

  let audio = null
  let unlocked = false

  function ensureAudio () {
    if (!audio) {
      audio = new Audio('assets/sounds/flip.wav')
      audio.preload = 'auto'
      audio.volume = 1
      audio.load()
    }
  }

  // 部分环境下首次播放需要用户手势解锁（静音执行避免杂音）
  function unlockAudio () {
    if (unlocked || !audio) return
    audio.volume = 0
    audio.play().then(() => {
      unlocked = true
      audio.pause()
      audio.currentTime = 0
      audio.volume = 1
    }).catch(() => { audio.volume = 1 })
  }
  window.addEventListener('pointerdown', () => { ensureAudio(); unlockAudio() }, { once: false })

  function playFlip () {
    if (!cfg.sound) return
    ensureAudio()
    audio.currentTime = 0
    audio.play().catch(() => {})
  }

  /* ---------- 构建翻页卡片 ---------- */
  function buildUnit (el) {
    el.innerHTML =
      '<div class="fcard">' +
        '<div class="half top"><span>00</span></div>' +
        '<div class="half bottom"><span>00</span></div>' +
        '<div class="flap ftop"><span>00</span></div>' +
        '<div class="flap fbottom"><span>00</span></div>' +
      '</div>'
    return {
      el,
      card: el.querySelector('.fcard'),
      topStatic: el.querySelector('.half.top span'),
      bottomStatic: el.querySelector('.half.bottom span'),
      flapTop: el.querySelector('.flap.ftop span'),
      flapBottom: el.querySelector('.flap.fbottom span'),
      cur: null,
      animating: false,
      pending: null
    }
  }

  const units = {
    h: buildUnit(document.getElementById('fu-h')),
    m: buildUnit(document.getElementById('fu-m')),
    s: buildUnit(document.getElementById('fu-s'))
  }

  function setText (unit, val) {
    unit.topStatic.textContent = val
    unit.bottomStatic.textContent = val
    unit.flapTop.textContent = val
    unit.flapBottom.textContent = val
    unit.cur = val
  }

  /* 计分器式翻页：上翻板盖下露出新值，下翻板再落下 */
  function setValue (unit, val) {
    if (unit.cur === val) return
    if (unit.cur === null) { setText(unit, val); return }

    if (unit.animating) { unit.pending = val; return }
    unit.animating = true
    playFlip()

    // 上半静态立即变为新值（被上翻板遮住），上翻板显示旧值翻下
    unit.topStatic.textContent = val
    unit.flapTop.textContent = unit.cur
    unit.flapBottom.textContent = val

    unit.card.classList.remove('flipping')
    void unit.card.offsetWidth // 强制重排以重启动画
    unit.card.classList.add('flipping')

    setTimeout(() => {
      unit.bottomStatic.textContent = val
      unit.card.classList.remove('flipping')
      unit.cur = val
      unit.animating = false
      if (unit.pending !== null && unit.pending !== val) {
        const p = unit.pending
        unit.pending = null
        setValue(unit, p)
      } else {
        unit.pending = null
      }
    }, 600)
  }

  /* ---------- 时间计算 ---------- */
  function currentValues () {
    const now = new Date()
    let h = now.getHours()
    if (cfg.format === '12') {
      h = h % 12
      if (h === 0) h = 12
    }
    const pad = n => String(n).padStart(2, '0')
    return { h: pad(h), m: pad(now.getMinutes()), s: pad(now.getSeconds()) }
  }

  function tick () {
    const v = currentValues()
    setValue(units.h, v.h)
    setValue(units.m, v.m)
    setValue(units.s, v.s)
  }

  function renderDate () {
    const el = document.getElementById('clockDate')
    const lang = document.documentElement.lang === 'en' ? 'en' : 'zh'
    if (!cfg.showDate) { el.classList.add('hidden'); return }
    el.classList.remove('hidden')
    const now = new Date()
    if (lang === 'en') {
      el.textContent = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
    } else {
      const week = ['日', '一', '二', '三', '四', '五', '六'][now.getDay()]
      el.textContent = `公历 ${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 · 星期${week}`
    }
  }

  /* ---------- 外观参数 ---------- */
  function applyVisual () {
    const stage = document.getElementById('view-flipclock')
    // 翻页比例：0 → 0.6 倍，100 → 2.1 倍，直接缩放卡片尺寸；同时按视口宽度收敛上限防止溢出
    const scale = 0.6 + (cfg.ratio / 100) * 1.5
    const stageW = stage.clientWidth || 1280
    const maxCard = Math.min(92 * 2.1, (stageW - 80) / (3 + 0.44))
    stage.style.setProperty('--card-w', Math.min(92 * scale, maxCard).toFixed(1) + 'px')
    // 亮度：0 → 30% 显色，100 → 全色（颜色基准由主题决定：黑底白字 / 白底黑字）
    const alpha = 0.3 + (cfg.brightness / 100) * 0.7
    stage.style.setProperty('--digit-alpha', alpha.toFixed(2))
  }

  /* ---------- 面板与控件 ---------- */
  function initPanel () {
    const panel = document.getElementById('flipPanel')
    const btn = document.getElementById('flipSettingsBtn')
    const closeBtn = document.getElementById('flipPanelClose')

    function toggle (open) {
      const willOpen = open !== undefined ? open : !panel.classList.contains('open')
      panel.classList.toggle('open', willOpen)
      btn.classList.toggle('open', willOpen)
    }
    btn.addEventListener('click', () => toggle())
    closeBtn.addEventListener('click', () => toggle(false))
    FlipClock.togglePanel = toggle

    // 沉浸全屏
    document.getElementById('flipFsBtn').addEventListener('click', () => {
      window.__toggleImmersive(document.getElementById('view-flipclock').querySelector('.clock-stage'),
        document.getElementById('flipFsBtn'))
    })

    // 时钟格式
    const formatSeg = document.getElementById('formatSeg')
    function renderFormat () {
      formatSeg.querySelectorAll('button').forEach(b =>
        b.classList.toggle('on', b.dataset.format === cfg.format))
    }
    formatSeg.addEventListener('click', e => {
      const b = e.target.closest('button')
      if (!b) return
      cfg.format = b.dataset.format
      save(); renderFormat()
      // 立即重算，避免 12/24 切换瞬间值错乱
      const v = currentValues()
      ;[units.h, units.m, units.s].forEach(u => { u.cur = null })
      setValue(units.h, v.h); setValue(units.m, v.m); setValue(units.s, v.s)
    })

    // 滑块
    const ratio = document.getElementById('ratioSlider')
    const brightness = document.getElementById('brightnessSlider')
    ratio.value = cfg.ratio
    brightness.value = cfg.brightness
    ratio.addEventListener('input', () => { cfg.ratio = +ratio.value; save(); applyVisual() })
    brightness.addEventListener('input', () => { cfg.brightness = +brightness.value; save(); applyVisual() })

    // 开关
    const soundT = document.getElementById('soundToggle')
    const dateT = document.getElementById('dateToggle')
    soundT.checked = cfg.sound
    dateT.checked = cfg.showDate
    soundT.addEventListener('change', () => { cfg.sound = soundT.checked; save() })
    dateT.addEventListener('change', () => { cfg.showDate = dateT.checked; save(); renderDate() })

    renderFormat()
  }

  window.FlipClock = {
    init () {
      applyVisual()
      initPanel()
      tick()
      setInterval(tick, 250)
      renderDate()
      // 每分钟刷新一次日期（跨天/星期变化）
      setInterval(renderDate, 15000)
      // 视口变化时收敛卡片上限（含进入/退出全屏）
      window.addEventListener('resize', applyVisual)
    },
    refreshDate: renderDate,
    refreshVisual: applyVisual,
    togglePanel: null
  }
})()
