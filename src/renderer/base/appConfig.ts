/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { MemSaverConfigApp } from '@/base/memSaver';

export interface PopupDomainPattern {
  pattern: string;
  isRegex: boolean;
  enabled: boolean;
}

export interface AppConfig {
  mainHotkey: string;
  memSaver: MemSaverConfigApp;
  uiTheme: string;
  popupDomains: PopupDomainPattern[];
}

export const defaultPopupDomainPatterns: PopupDomainPattern[] = [
  // OAuth callback patterns - these should stay in Electron window
  { pattern: '^https?:\\/\\/.*\\/auth\\/.*\\/callback', isRegex: true, enabled: true },
  { pattern: '^https?:\\/\\/localhost.*\\/callback', isRegex: true, enabled: true },
  { pattern: '^https?:\\/\\/127\\.0\\.0\\.1.*\\/callback', isRegex: true, enabled: true },
  { pattern: 'freeter:\\/\\/oauth', isRegex: false, enabled: true },
  
  // Specific OAuth completion pages that should stay in window
  { pattern: '^https?:\\/\\/accounts\\.google\\.com\\/signin\\/oauth\\/consent', isRegex: true, enabled: true },
  { pattern: '^https?:\\/\\/.*\\.auth0\\.com\\/authorize', isRegex: true, enabled: true },
  { pattern: '^https?:\\/\\/github\\.com\\/login\\/device\\/success', isRegex: true, enabled: true },
  
  // Dialog/popup indicators
  { pattern: 'popup=true', isRegex: false, enabled: true },
  { pattern: 'dialog=true', isRegex: false, enabled: true },
  { pattern: '_popup=true', isRegex: false, enabled: true },
  
  // App-specific OAuth patterns
  { pattern: '^https?:\\/\\/.*\\.slack\\.com\\/.*\\/oauth', isRegex: true, enabled: true },
  { pattern: '^https?:\\/\\/.*\\.zoom\\.us\\/.*\\/oauth', isRegex: true, enabled: true },
  { pattern: '^https?:\\/\\/.*\\.dropbox\\.com\\/oauth', isRegex: true, enabled: true },
  { pattern: '^https?:\\/\\/.*\\.notion\\.so\\/.*\\/oauth', isRegex: true, enabled: true },
  { pattern: '^https?:\\/\\/.*\\.trello\\.com\\/.*\\/authorize', isRegex: true, enabled: true },
];
