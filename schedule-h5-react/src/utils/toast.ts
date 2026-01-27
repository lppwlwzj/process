export function showToast(options: { title: string; icon?: 'success' | 'none' }) {
  const toast = document.createElement('div')
  toast.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: 0.25rem;
    font-size: 0.875rem;
    z-index: 9999;
    pointer-events: none;
  `
  toast.textContent = options.title
  document.body.appendChild(toast)

  setTimeout(() => {
    toast.remove()
  }, 2000)
}

if (typeof window !== 'undefined') {
  (window as any).showToast = showToast
}
