/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

export interface WebpageExposedApi {
  openUrl: (url: string) => void;
  getUrl: () => string;
}

export interface BrowserExposedApi {
  openUrl: (url: string) => void;
  getUrl: () => string;
}
