/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import backSvg from './back.svg';
import forwardSvg from './forward.svg';
import homeSvg from './home.svg';
import openInBrowserSvg from './open-in-browser.svg';
import reloadSvg from './reload.svg';
import reloadStartSvg from './reload-start.svg';
import reloadStopSvg from './reload-stop.svg';
import widgetSvg from './widget.svg';

export {
  backSvg,
  forwardSvg,
  homeSvg,
  openInBrowserSvg,
  reloadSvg,
  reloadStartSvg,
  reloadStopSvg,
  widgetSvg
};

// For history icon, we'll use a simple clock icon SVG
export const historySvg = 'data:image/svg+xml;base64,' + btoa(`
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" fill="currentColor"/>
</svg>
`);
