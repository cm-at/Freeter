/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { PopupDomainPattern, defaultPopupDomainPatterns } from '@/base/appConfig';
import { SettingBlock } from '@/widgets/appModules';
import { useCallback, useState } from 'react';
import styles from './popupDomainSettings.module.scss';
import { delete14Svg } from '@/ui/assets/images/appIcons';
import { Button } from '@/ui/components/basic/button';

interface PopupDomainSettingsProps {
  popupDomains: PopupDomainPattern[];
  updatePopupDomains: (domains: PopupDomainPattern[]) => void;
}

export function PopupDomainSettings({ popupDomains, updatePopupDomains }: PopupDomainSettingsProps) {
  const [newPattern, setNewPattern] = useState('');
  const [newIsRegex, setNewIsRegex] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validatePattern = useCallback((pattern: string, isRegex: boolean): string | null => {
    if (!pattern.trim()) {
      return 'Pattern cannot be empty';
    }

    if (isRegex) {
      try {
        new RegExp(pattern);
      } catch (e) {
        return 'Invalid regular expression';
      }
    }

    return null;
  }, []);

  const addPattern = useCallback(() => {
    const error = validatePattern(newPattern, newIsRegex);
    if (error) {
      setValidationError(error);
      return;
    }

    const newDomain: PopupDomainPattern = {
      pattern: newPattern.trim(),
      isRegex: newIsRegex,
      enabled: true
    };

    updatePopupDomains([...popupDomains, newDomain]);
    setNewPattern('');
    setNewIsRegex(false);
    setValidationError(null);
  }, [newPattern, newIsRegex, popupDomains, updatePopupDomains, validatePattern]);

  const removePattern = useCallback((index: number) => {
    updatePopupDomains(popupDomains.filter((_, i) => i !== index));
  }, [popupDomains, updatePopupDomains]);

  const togglePattern = useCallback((index: number) => {
    updatePopupDomains(popupDomains.map((domain, i) => 
      i === index ? { ...domain, enabled: !domain.enabled } : domain
    ));
  }, [popupDomains, updatePopupDomains]);

  const updatePattern = useCallback((index: number, pattern: string) => {
    const domain = popupDomains[index];
    const error = validatePattern(pattern, domain.isRegex);
    if (!error) {
      updatePopupDomains(popupDomains.map((d, i) => 
        i === index ? { ...d, pattern } : d
      ));
    }
  }, [popupDomains, updatePopupDomains, validatePattern]);

  const toggleRegex = useCallback((index: number) => {
    const domain = popupDomains[index];
    const newIsRegex = !domain.isRegex;
    const error = validatePattern(domain.pattern, newIsRegex);
    if (!error) {
      updatePopupDomains(popupDomains.map((d, i) => 
        i === index ? { ...d, isRegex: newIsRegex } : d
      ));
    }
  }, [popupDomains, updatePopupDomains, validatePattern]);

  const resetToDefaults = useCallback(() => {
    updatePopupDomains([...defaultPopupDomainPatterns]);
  }, [updatePopupDomains]);

  return (
    <SettingBlock
      title='Popup Domain Patterns'
      moreInfo='Configure which URLs should open in popup windows instead of your default browser. 
                You can use plain text patterns (matched anywhere in the URL) or regular expressions for more complex matching.
                These patterns are typically used for OAuth flows, authentication callbacks, and specific app dialogs.'
    >
      <div className={styles.container}>
        <div className={styles.patternList}>
          {popupDomains.map((domain, index) => (
            <div key={index} className={styles.patternItem}>
              <input
                type="checkbox"
                checked={domain.enabled}
                onChange={() => togglePattern(index)}
                className={styles.enabledCheckbox}
                aria-label={`Enable pattern ${index + 1}`}
              />
              <input
                type="text"
                value={domain.pattern}
                onChange={(e) => updatePattern(index, e.target.value)}
                className={styles.patternInput}
                disabled={!domain.enabled}
                aria-label={`Pattern ${index + 1}`}
              />
              <label className={styles.regexLabel}>
                <input
                  type="checkbox"
                  checked={domain.isRegex}
                  onChange={() => toggleRegex(index)}
                  disabled={!domain.enabled}
                />
                Regex
              </label>
              <button
                onClick={() => removePattern(index)}
                className={styles.deleteButton}
                title="Remove pattern"
              >
                <img src={delete14Svg} alt="Delete" />
              </button>
            </div>
          ))}
        </div>

        <div className={styles.addSection}>
          <input
            type="text"
            value={newPattern}
            onChange={(e) => {
              setNewPattern(e.target.value);
              setValidationError(null);
            }}
            placeholder="Enter a new pattern"
            className={styles.newPatternInput}
            onKeyPress={(e) => e.key === 'Enter' && addPattern()}
          />
          <label className={styles.regexLabel}>
            <input
              type="checkbox"
              checked={newIsRegex}
              onChange={(e) => setNewIsRegex(e.target.checked)}
            />
            Regex
          </label>
          <Button onClick={addPattern}>Add Pattern</Button>
        </div>

        {validationError && (
          <div className={styles.error}>{validationError}</div>
        )}

        <div className={styles.resetSection}>
          <Button onClick={resetToDefaults}>Reset to Defaults</Button>
        </div>

        <div className={styles.helpText}>
          <strong>Examples:</strong>
          <ul>
            <li><code>accounts.google.com</code> - Matches any URL containing this text</li>
            <li><code>^https?://.*\.auth0\.com/authorize</code> - Regex for Auth0 authorization URLs</li>
            <li><code>popup=true</code> - Matches URLs with this parameter</li>
          </ul>
        </div>
      </div>
    </SettingBlock>
  );
} 