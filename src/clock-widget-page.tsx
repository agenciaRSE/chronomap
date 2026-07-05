import React from 'react';
import ReactDOM from 'react-dom/client';
import { SnippetBuilder, cityForTz, tzLabel } from './lib/embed-widget';
import './lib/analytics';
import './page.css';

// Interactive preview + snippet builder for the /clock-widget landing page.
// Defaults to the visitor's own time zone.

const myTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
const city = cityForTz(myTz)?.name || tzLabel(myTz);

const el = document.getElementById('widget-app');
if (el) {
  el.innerHTML = '';
  ReactDOM.createRoot(el).render(
    <React.StrictMode>
      <SnippetBuilder tz={myTz} city={city} theme="dark" />
    </React.StrictMode>
  );
}
