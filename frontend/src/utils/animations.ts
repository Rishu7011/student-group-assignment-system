import gsap from 'gsap'

/**
 * Animate elements on entrance with a smooth staggered reveal
 */
export function animateStaggerIn(
  targets: string | Element | Element[] | NodeListOf<Element>,
  options?: {
    stagger?: number
    y?: number
    duration?: number
    delay?: number
    ease?: string
  }
) {
  return gsap.from(targets, {
    opacity: 0,
    y: options?.y ?? 16,
    duration: options?.duration ?? 0.5,
    delay: options?.delay ?? 0.05,
    stagger: options?.stagger ?? 0.07,
    ease: options?.ease ?? 'power3.out',
    clearProps: 'transform,opacity',
  })
}

/**
 * Animate a single element with a crisp scale-in
 */
export function animateScaleIn(
  target: string | Element,
  options?: { duration?: number; delay?: number }
) {
  return gsap.from(target, {
    scale: 0.94,
    opacity: 0,
    duration: options?.duration ?? 0.4,
    delay: options?.delay ?? 0,
    ease: 'back.out(1.4)',
    clearProps: 'transform,opacity',
  })
}

/**
 * Animate progress bar width smoothly with GSAP
 */
export function animateProgressBar(
  target: string | Element,
  percentage: number,
  duration: number = 0.8
) {
  return gsap.to(target, {
    width: `${percentage}%`,
    duration,
    ease: 'power2.out',
  })
}
