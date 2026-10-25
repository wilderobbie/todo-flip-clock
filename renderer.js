/* 应用主控：i18n、主题、路由、侧边栏、格言、图标内联 */
(function () {
  'use strict'

  const $ = id => document.getElementById(id)

  /* ===================== i18n ===================== */
  const I18N = {
    zh: {
      navFlip: '翻页时钟', navPomodoro: '番茄时钟', navSettings: '设置',
      pTitle: '设置',
      fFormat: '时钟格式', f24h: '24 小时', f12h: '12 小时',
      fRatio: '翻页比例', fBrightness: '亮度', fSound: '翻页声音', fDate: '显示日期',
      mTiming: '计时设置', mStandard: '标准番茄', mDeep: '深度工作', mSprint: '冲刺模式',
      mCustom: '自定义', mFocusLen: '专注(分)', mRestLen: '休息(分)', mRounds: '轮数',
      mApply: '应用设置',
      mStats: '今日统计', mDone: '已完成番茄', mFocus: '专注时长', mInterrupt: '中断时长',
      mBadge: '成就徽章',
      bPerseverance: '毅力之星', bPerseveranceCond: '今日完成 ≥ 8 个番茄',
      bFocus: '专注达人', bFocusCond: '今日专注 ≥ 120 分钟',
      bEfficiency: '效率专家', bEfficiencyCond: '完成 ≥ 4 番茄且中断 ≤ 1 次',
      sGeneral: '通用', sLanguage: '语言', sLanguageDesc: '切换应用界面显示语言。',
      sAppearance: '外观', sTheme: '主题', sThemeDesc: '选择应用的配色方案。',
      tDark: '全黑', tLight: '全白', tSystem: '跟随系统',
      pStart: '开始', pPause: '暂停', pResume: '继续', pReset: '重置', pInterrupt: '记录中断',
      pFocusing: '专注中', pResting: '休息中', pPaused: '已暂停', pIdle: '就绪',
      pDone: '今日轮次已完成 🎉', pRound: '第 {n}/{t} 轮',
      pInterruptTip: '仅在专注计时进行中可记录中断',
      pInterrupted: '已记录中断', pApplied: '设置已生效',
      minUnit: '分钟',
      mScale: '显示比例', mRingScale: '时钟比例',
      lZh: '简体中文', lEn: 'English',
      fsTitle: '全屏'
    },
    en: {
      navFlip: 'Flip Clock', navPomodoro: 'Pomodoro', navSettings: 'Settings',
      pTitle: 'Settings',
      fFormat: 'Clock Format', f24h: '24-hour', f12h: '12-hour',
      fRatio: 'Card Scale', fBrightness: 'Brightness', fSound: 'Flip Sound', fDate: 'Show Date',
      mTiming: 'Timer Settings', mStandard: 'Standard', mDeep: 'Deep Work', mSprint: 'Sprint',
      mCustom: 'Custom', mFocusLen: 'Focus(min)', mRestLen: 'Break(min)', mRounds: 'Rounds',
      mApply: 'Apply',
      mStats: 'Today', mDone: 'Pomodoros', mFocus: 'Focus Time', mInterrupt: 'Interrupted',
      mBadge: 'Achievements',
      bPerseverance: 'Perseverance Star', bPerseveranceCond: 'Finish ≥ 8 pomodoros today',
      bFocus: 'Focus Master', bFocusCond: 'Focus ≥ 120 min today',
      bEfficiency: 'Efficiency Expert', bEfficiencyCond: '≥ 4 pomodoros & ≤ 1 interruption',
      sGeneral: 'General', sLanguage: 'Language', sLanguageDesc: 'Switch interface language.',
      sAppearance: 'Appearance', sTheme: 'Theme', sThemeDesc: 'Choose the color scheme.',
      tDark: 'Dark', tLight: 'Light', tSystem: 'System',
      pStart: 'Start', pPause: 'Pause', pResume: 'Resume', pReset: 'Reset', pInterrupt: 'Log Break',
      pFocusing: 'Focusing', pResting: 'On Break', pPaused: 'Paused', pIdle: 'Ready',
      pDone: 'All rounds done! 🎉', pRound: 'Round {n}/{t}',
      pInterruptTip: 'Only available while focusing',
      pInterrupted: 'Break logged', pApplied: 'Settings applied',
      minUnit: 'min',
      mScale: 'Display Scale', mRingScale: 'Clock Size',
      lZh: 'Chinese (Simplified)', lEn: 'English',
      fsTitle: 'Fullscreen'
    }
  }

  const store = {
    get (k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d } catch { return d } },
    set (k, v) { localStorage.setItem(k, JSON.stringify(v)) }
  }

  let lang = store.get('todo.lang', 'zh')
  window.I18N = I18N[lang]

  function applyI18n () {
    window.I18N = I18N[lang]
    document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN'
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const v = I18N[lang][el.dataset.i18n]
      if (v !== undefined) el.textContent = v
    })
    $('collapseBtn').title = lang === 'en' ? 'Collapse sidebar' : '折叠侧边栏'
    $('flipSettingsBtn').title = lang === 'en' ? 'Settings' : '设置'
    $('pomoSettingsBtn').title = lang === 'en' ? 'Settings' : '设置'
    $('flipFsBtn').title = I18N[lang].fsTitle
    $('pomoFsBtn').title = I18N[lang].fsTitle
    $('resetBtn').title = lang === 'en' ? 'Reset' : '重置'
    // 折叠态下导航项仅显示图标，tooltip 兜底
    document.querySelectorAll('.nav-item').forEach(n => {
      const lbl = n.querySelector('.nav-label')
      if (lbl && lbl.dataset.i18n && I18N[lang][lbl.dataset.i18n]) n.title = I18N[lang][lbl.dataset.i18n]
    })
    if (window.Pomodoro && Pomodoro.rerender) Pomodoro.rerender()
    if (window.FlipClock) FlipClock.refreshDate()
  }

  /* ===================== 图标（同文档 SVG Sprite，file:// 下 fetch 会被安全策略拦截） ===================== */
  function iconSvg (name) {
    return `<svg class="ic" aria-hidden="true" focusable="false"><use href="#i-${name}"></use></svg>`
  }

  function inlineIcons (root) {
    ;(root || document).querySelectorAll('[data-icon]').forEach(h => {
      h.classList.add('icon-slot')
      h.innerHTML = iconSvg(h.dataset.icon)
    })
  }

  window.__setIcon = function (holder, name) {
    holder.dataset.icon = name
    holder.innerHTML = iconSvg(name)
  }

  /* ===================== 沉浸全屏（翻页/番茄共用） ===================== */
  let immersive = null

  window.__toggleImmersive = function (stage, btn) {
    if (document.fullscreenElement) {
      document.exitFullscreen()
      return
    }
    stage.classList.add('immersive')
    immersive = { stage, btn }
    window.__setIcon(btn.querySelector('[data-icon]'), 'minimize')
    if (stage.requestFullscreen) stage.requestFullscreen().catch(() => {})
  }

  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && immersive) {
      immersive.stage.classList.remove('immersive')
      window.__setIcon(immersive.btn.querySelector('[data-icon]'), 'maximize')
      immersive = null
    }
  })

  /* ===================== 主题 ===================== */
  let themeChoice = store.get('todo.theme', 'system')
  const media = window.matchMedia('(prefers-color-scheme: dark)')

  function applyTheme () {
    const resolved = themeChoice === 'system' ? (media.matches ? 'dark' : 'light') : themeChoice
    document.body.dataset.theme = resolved
    document.querySelectorAll('#themeSeg button').forEach(b =>
      b.classList.toggle('on', b.dataset.themeChoice === themeChoice))
  }
  media.addEventListener('change', applyTheme)

  /* ===================== 路由 ===================== */
  function switchView (name) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'))
    const view = $('view-' + name)
    if (view) view.classList.add('active')
    document.querySelectorAll('.nav-item').forEach(n =>
      n.classList.toggle('active', n.dataset.view === name))
    if (name === 'settings') {
      renderLangSeg()
      applyTheme()
    }
    if (name === 'flipclock' && FlipClock.refreshVisual) FlipClock.refreshVisual()
  }

  /* ===================== 格言警句 ===================== */
  const MOTTOS = {
    zh: [
      ['业精于勤，荒于嬉；行成于思，毁于随。', '—— 韩愈《进学解》'],
      ['一寸光阴一寸金，寸金难买寸光阴。', '—— 《增广贤文》'],
      ['宝剑锋从磨砺出，梅花香自苦寒来。', '—— 《警世贤文》'],
      ['千里之行，始于足下。', '—— 老子《道德经》'],
      ['不积跬步，无以至千里；不积小流，无以成江海。', '—— 荀子《劝学》'],
      ['逝者如斯夫，不舍昼夜。', '—— 孔子《论语》'],
      ['明日复明日，明日何其多。我生待明日，万事成蹉跎。', '—— 钱福《明日歌》'],
      ['路漫漫其修远兮，吾将上下而求索。', '—— 屈原《离骚》']
    ],
    en: [
      ['The secret of getting ahead is getting started.', '— Mark Twain'],
      ['Lost time is never found again.', '— Benjamin Franklin'],
      ['It always seems impossible until it is done.', '— Nelson Mandela'],
      ['Well begun is half done.', '— Aristotle'],
      ['Action is the foundational key to all success.', '— Pablo Picasso'],
      ['The best way out is always through.', '— Robert Frost']
    ]
  }

  function rotateMotto () {
    const list = MOTTOS[lang] || MOTTOS.zh
    const [text, from] = list[Math.floor(Math.random() * list.length)]
    const t = $('mottoText')
    const f = $('mottoFrom')
    t.textContent = text
    f.textContent = from
    // 重新触发淡入动画
    t.style.animation = 'none'
    f.style.animation = 'none'
    void t.offsetWidth
    t.style.animation = ''
    f.style.animation = ''
  }

  /* ===================== 侧边栏 ===================== */
  function initSidebar () {
    const sidebar = $('sidebar')
    const btn = $('collapseBtn')
    btn.addEventListener('click', () => {
      const collapsed = sidebar.classList.toggle('collapsed')
      window.__setIcon(btn.querySelector('[data-icon]'), collapsed ? 'panel-left-open' : 'panel-left-close')
    })
  }

  /* ===================== 设置界面控件 ===================== */
  function renderLangSeg () {
    document.querySelectorAll('#langSeg button').forEach(b =>
      b.classList.toggle('on', b.dataset.lang === lang))
  }

  function initSettings () {
    document.querySelectorAll('#langSeg button').forEach(b => {
      b.addEventListener('click', () => {
        if (b.dataset.lang === lang) return
        lang = b.dataset.lang
        store.set('todo.lang', lang)
        applyI18n()
        renderLangSeg()
        rotateMotto()
      })
    })

    document.querySelectorAll('#themeSeg button').forEach(b => {
      b.addEventListener('click', () => {
        themeChoice = b.dataset.themeChoice
        store.set('todo.theme', themeChoice)
        applyTheme()
      })
    })
  }

  /* ===================== 自绘标题栏窗口控制 ===================== */
  function initTitlebar () {
    if (!window.todoAPI) return
    $('tbMin').addEventListener('click', () => todoAPI.minimize())
    $('tbMax').addEventListener('click', () => todoAPI.toggleMaximize())
    $('tbClose').addEventListener('click', () => todoAPI.close())
    todoAPI.onMaximized(max => {
      window.__setIcon($('tbMax').querySelector('[data-icon]'), max ? 'copy' : 'square')
    })
  }

  /* ===================== 启动 ===================== */
  window.addEventListener('DOMContentLoaded', () => {
    inlineIcons(document)

    applyTheme()
    initSidebar()
    initSettings()
    initTitlebar()
    applyI18n()
    renderLangSeg()

    document.querySelectorAll('.nav-item').forEach(n =>
      n.addEventListener('click', () => switchView(n.dataset.view)))
    $('homeBtn').addEventListener('click', () => switchView('home'))

    FlipClock.init()
    Pomodoro.init()
    switchView('home')
    rotateMotto()
    setInterval(rotateMotto, 60000)
  })
})()
