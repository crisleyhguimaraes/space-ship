export type HudFrame = {
  speed: number
  fps: number
  bodyName: string
  distance: number
  hint: string
  hull: number
  alert: string
}

export function createHud() {
  const el = (id: string) => document.getElementById(id) as HTMLElement
  const speed = el('speed')
  const fps = el('fps')
  const body = el('body')
  const hint = el('hint')
  const help = el('help')
  const start = el('start')
  const credits = el('credits')
  const hull = el('hull')
  const alert = el('alert')
  const damage = el('damage')
  const muteBadge = el('mute')
  const target = el('target')

  return {
    update(f: HudFrame) {
      speed.textContent = `${Math.round(f.speed)} u/s`
      fps.textContent = `${Math.round(f.fps)} fps`
      body.textContent = `${f.bodyName} · ${Math.round(f.distance)}`
      hint.textContent = f.hint
      hint.classList.toggle('on', f.hint !== '')
      hull.textContent = `casco ${Math.round(f.hull)}%`
      alert.textContent = f.alert
      alert.classList.toggle('on', f.alert !== '')
    },
    hideHelp: () => help.classList.add('off'),
    showStart: () => start.classList.remove('off'),
    hideStart: () => start.classList.add('off'),
    onStart: (fn: () => void) => start.addEventListener('click', fn),
    toggleCredits: () => credits.classList.toggle('off'),
    showFatal(message: string, detail: string) {
      const box = el('fatal')
      box.querySelector('strong')!.textContent = message
      box.querySelector('small')!.textContent = detail
      box.classList.remove('off')
    },
    setMuted: (muted: boolean) => muteBadge.classList.toggle('off', !muted),
    setTarget(marker: { x: number; y: number; text: string; offscreen: boolean } | null) {
      target.classList.toggle('off', marker === null)
      if (!marker) return
      target.style.transform = `translate(${marker.x}px, ${marker.y}px) translate(-50%, -50%)`
      target.textContent = marker.text
      target.classList.toggle('edge', marker.offscreen)
    },
    flashDamage() {
      damage.classList.add('on')
      setTimeout(() => damage.classList.remove('on'), 220)
    },
  }
}
