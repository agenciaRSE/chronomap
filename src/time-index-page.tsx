import './lib/analytics';
import './page.css';

// Client-side search filter for the /time hub. All city links are static HTML
// (crawlable); this just shows/hides them as you type. No framework needed.

const input = document.getElementById('city-search') as HTMLInputElement | null;
const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('a.city-link'));
const groups = Array.from(document.querySelectorAll<HTMLElement>('[data-region]'));
const noResults = document.getElementById('no-results');

if (input) {
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    let anyVisible = false;

    for (const a of links) {
      const match = !q || (a.dataset.city ?? '').toLowerCase().includes(q);
      a.style.display = match ? '' : 'none';
      if (match) anyVisible = true;
    }
    for (const g of groups) {
      const hasVisible = Array.from(g.querySelectorAll<HTMLElement>('a.city-link')).some((a) => a.style.display !== 'none');
      g.style.display = hasVisible ? '' : 'none';
    }
    if (noResults) noResults.style.display = anyVisible ? 'none' : 'block';
  });
}
