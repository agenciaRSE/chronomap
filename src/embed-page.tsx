import React from 'react';
import ReactDOM from 'react-dom/client';
import { Clock, SnippetBuilder, cityForTz, tzLabel } from './lib/embed-widget';

// Raw embeddable clock endpoint (/embed?tz=…&city=…&theme=…). Framed → just the
// clock, transparent, to blend into the host site. Opened directly → the snippet
// builder on the app's dark background. noindex (the /clock-widget landing is the
// indexable page).

const params = new URLSearchParams(location.search);
const framed = window.self !== window.top;
const myTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

const tz0 = params.get('tz') || myTz;
const city0 = params.get('city') || cityForTz(tz0)?.name || tzLabel(tz0);
const theme0: 'dark' | 'light' = params.get('theme') === 'light' ? 'light' : 'dark';

const el = document.getElementById('embed-app');
if (el) {
  if (!framed) {
    document.documentElement.style.backgroundColor = '#09090b';
    document.body.style.backgroundColor = '#09090b';
    document.body.style.minHeight = '100vh';
    el.style.paddingTop = '48px';
  }
  el.innerHTML = '';
  ReactDOM.createRoot(el).render(
    <React.StrictMode>
      {framed
        ? <div style={{ display: 'flex', justifyContent: 'center' }}><Clock tz={tz0} city={city0} theme={theme0} /></div>
        : <SnippetBuilder tz={tz0} city={city0} theme={theme0} />}
    </React.StrictMode>
  );
}
