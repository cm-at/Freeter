const base = {
  primary: '#005FB8',

  inputBackground: '#FFFFFF',
  inputColor: '#3B3B3B',
  inputBorder: '#CECECE',

  componentBackground: '#F8F8F8',
  componentBorder: '#ECECEC',
  componentColor: '#000000',

  dropAreaBackground: '#005FB840',

  openBackground: '#FFFFFF',
  shadow: '#00000040',
}

export const lightTheme = {
  /**
   * Common
   */
  background: base.componentBackground,
  outline: base.primary,
  componentBackground: base.componentBackground,
  componentBorder: base.componentBorder,
  componentColor: base.componentColor,
  dropAreaBackground: base.dropAreaBackground,
  primary: `${base.primary}`,

  primary90: `${base.primary}90`,
  primary80: `${base.primary}80`,
  primary70: `${base.primary}70`,
  primary60: `${base.primary}60`,
  primary50: `${base.primary}50`,
  primary40: `${base.primary}40`,
  primary30: `${base.primary}30`,
  primary20: `${base.primary}20`,
  primary10: `${base.primary}10`,

  componentColor90: `${base.componentColor}90`,
  componentColor80: `${base.componentColor}80`,
  componentColor70: `${base.componentColor}70`,
  componentColor60: `${base.componentColor}60`,
  componentColor50: `${base.componentColor}50`,
  componentColor40: `${base.componentColor}40`,
  componentColor30: `${base.componentColor}30`,
  componentColor20: `${base.componentColor}20`,
  componentColor10: `${base.componentColor}10`,

  /**
   * Scroll Bar
   */
  scrollbarThumb: 'rgba(100, 100, 100, 0.4)',
  scrollbarThumbHover: 'rgba(100, 100, 100, 0.7)',
  scrollbarThumbActive: 'rgba(0, 0, 0, 0.6)',

  /**
   * Inputs
   */
  inputBackground: base.inputBackground,
  inputColor: base.inputColor,
  inputBorder: base.inputBorder,

  selectBackground: base.inputBackground,
  selectColor: base.inputColor,
  selectBorder: base.inputBorder,

  textareaBackground: base.inputBackground,
  textareaColor: base.inputColor,
  textareaBorder: base.inputBorder,

  /**
   * Buttons
   */
  buttonBackground: 'transparent',
  buttonColor: '#3B3B3B',
  buttonHoverBackground: '#A6A6A650',
  buttonActiveBackground: '#A6A6A650',
  buttonPressedBackground: `${base.primary}40`,
  buttonPressedBorder: base.primary,
  buttonPressedColor: '#3B3B3B',

  buttonPrimaryBackground: base.primary,
  buttonPrimaryColor: '#FFFFFF',
  buttonPrimaryHoverBackground: '#0258A8',
  buttonPrimaryActiveBackground: '#0258A8',

  /**
   * In-App Notes
   */
  inAppNoteColor: '#3B3B3B60',
  inAppNoteIconColor: '#3B3B3B',
  inAppNoteNoProjectsBackground: '#F8F8F8',
  inAppNoteNoWorkflowsBackground: '#F8F8F8',

  /**
   * Top Bar
   */
  topBarBackground: base.componentBackground,
  topBarBorder: base.componentBorder,

  /**
   * Top Bar - Widget Palette
   */
  paletteBackground: base.componentBackground,
  paletteBorder: `${base.primary}15`,
  paletteShadow: base.shadow,
  paletteNoteColor: base.componentColor,
  paletteTabBackground: `${base.primary}15`,
  paletteTabColor: base.componentColor,
  paletteTabHoverBackground: base.openBackground,
  paletteTabHoverColor: base.componentColor,
  paletteSectionBackground: base.openBackground,
  paletteItemBackground: 'transparent',
  paletteItemColor: base.componentColor,
  paletteItemHoverBackground: '#A6A6A680',
  paletteItemHoverColor: base.componentColor,

  /**
   * Top Bar - Shelf
   */
  shelfDropAreaBackground: base.dropAreaBackground,

  shelfTabColor: base.componentColor,
  shelfTabOpenBackground: base.openBackground,
  shelfTabOpenColor: base.componentColor,

  shelfWidgetBoxBackground: base.openBackground,
  shelfWidgetBoxBorder: base.componentBorder,
  shelfWidgetBoxShadow: base.shadow,
  shelfWidgetBoxWidgetBorder: base.componentBorder,

  /**
   * Workflow Switcher
   */
  workflowSwitcherBackground: base.componentBackground,
  workflowSwitcherBorder: base.componentBorder,
  workflowSwitcherDropAreaBackground: base.dropAreaBackground,

  workflowSwitcherTabBackground: base.componentBackground,
  workflowSwitcherTabColor: base.componentColor,
  workflowSwitcherTabHoverBackground: base.openBackground,
  workflowSwitcherTabHoverColor: base.componentColor,
  workflowSwitcherTabOpenBackground: base.openBackground,
  workflowSwitcherTabOpenColor: base.componentColor,

  /**
   * Worktable
   */
  worktableBackground: base.openBackground,

  widgetLayoutItemBorder: base.componentBorder,
  widgetLayoutItemEditHoverBorder: '#A6A6A6',
  widgetLayoutItemResizingBorder: '#000000',
  widgetLayoutItemResizingOpacity: '0.5',
  widgetLayoutGhostBackground: base.dropAreaBackground,
  widgetLayoutItemShadow: base.shadow,

  /**
   * Modal Screens
   */
  modalScreenBackground: base.componentBackground,
  modalScreenBorder: base.componentBorder,
  modalScreenColor: base.componentColor,

  settingsScreenPanelColor: '#3B3B3B',

  appManagerListBackground: base.componentBackground,
  appManagerListItemBackground: base.componentBackground,
  appManagerListItemColor: base.componentColor,
  appManagerListItemHoverBackground: '#F2F2F2',
  appManagerListItemHoverColor: base.componentColor,
  appManagerListItemSelectedBackground: '#E4E6F1',
  appManagerListItemSelectedColor: base.componentColor,
  appManagerListItemDropAreaBackground: base.dropAreaBackground,

  projectManagerListBackground: base.componentBackground,
  projectManagerListItemBackground: base.componentBackground,
  projectManagerListItemColor: base.componentColor,
  projectManagerListItemHoverBackground: '#F2F2F2',
  projectManagerListItemHoverColor: base.componentColor,
  projectManagerListItemSelectedBackground: '#E4E6F1',
  projectManagerListItemSelectedColor: base.componentColor,
  projectManagerListItemDropAreaBackground: base.dropAreaBackground,

  aboutScreenBorder: base.componentBorder,
  aboutScreenLeftBackground: base.componentBackground,
  aboutScreenLeftColor: base.componentColor,
  aboutScreenRightBackground: '#FFFFFF',
  aboutScreenRightColor: base.componentColor,
  aboutScreenRightLinkColor: base.primary,
  aboutScreenLogoColor1: '#3B3B3B',
  aboutScreenLogoColor2: '#FFFFFF',
  aboutScreenLogoBorderColor: '#F8F8F8',

  /**
   * Widget
   */
  widgetBackground: base.componentBackground,
  widgetColor: base.componentColor,
  widgetHeaderBackground: base.componentBackground,
  widgetHeaderBorder: base.componentBorder,
  widgetHeaderColor: base.componentColor,
}
