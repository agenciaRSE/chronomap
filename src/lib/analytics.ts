// Privacy-friendly, cookieless Vercel Analytics + Speed Insights. The scripts
// load from va.vercel-scripts.com and beacon to vitals.vercel-insights.com, both
// already allowed by the CSP. Importing this module for its side effect wires
// both once per page. Not loaded on the /embed widget (runs on 3rd-party sites).
import { inject } from '@vercel/analytics';
import { injectSpeedInsights } from '@vercel/speed-insights';

inject();
injectSpeedInsights();
