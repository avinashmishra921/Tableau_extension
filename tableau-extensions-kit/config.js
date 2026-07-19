'use strict';

const SETTINGS = {
  worksheet: 'worksheet',
  labelCol: 'labelCol',
  valueCol: 'valueCol',
  compareCol: 'compareCol',
  deltaMode: 'deltaMode',
  deltaContext: 'deltaContext',
  positiveIsGood: 'positiveIsGood',
  showTotalCard: 'showTotalCard',
  totalLabel: 'totalLabel',
  totalLabelColor: 'totalLabelColor',
  totalLabelFontSize: 'totalLabelFontSize',
  totalValueColor: 'totalValueColor',
  totalValueFontSize: 'totalValueFontSize',
  totalDeltaFontSize: 'totalDeltaFontSize',
  totalPositiveDeltaColor: 'totalPositiveDeltaColor',
  totalNegativeDeltaColor: 'totalNegativeDeltaColor',
  totalCardBackground: 'totalCardBackground',
  totalCardBackgroundColor: 'totalCardBackgroundColor',
  totalCardBorderColor: 'totalCardBorderColor',
  totalCardBorder: 'totalCardBorder',
  labelColor: 'labelColor',
  labelFontSize: 'labelFontSize',
  valueColor: 'valueColor',
  valueFontSize: 'valueFontSize',
  deltaFontSize: 'deltaFontSize',
  positiveDeltaColor: 'positiveDeltaColor',
  negativeDeltaColor: 'negativeDeltaColor',
  cardBackground: 'cardBackground',
  cardBackgroundColor: 'cardBackgroundColor',
  cardBorderColor: 'cardBorderColor',
  cardBorder: 'cardBorder'
};

const STYLE_DEFAULTS = {
  labelColor: '#70757f',
  labelFontSize: '12',
  valueColor: '#333333',
  valueFontSize: '28',
  deltaFontSize: '13',
  positiveDeltaColor: '#2c7bb6',
  negativeDeltaColor: '#d7791f',
  cardBackground: '#ffffff',
  cardBackgroundColor: '#ffffff',
  cardBorderColor: '#dedede',
  cardBorder: 'true'
};

const elements = {};
let worksheets = [];

window.addEventListener('DOMContentLoaded', initializeDialog);

async function initializeDialog() {
  cacheElements();
  bindEvents();

  try {
    await tableau.extensions.initializeDialogAsync();
    worksheets = tableau.extensions.dashboardContent.dashboard.worksheets.slice();
    populateWorksheets();
    await loadCurrentSettings();
    updateSaveState();
  } catch (err) {
    showError(err);
  }
}

function cacheElements() {
  elements.form = document.getElementById('config-form');
  elements.error = document.getElementById('config-error');
  elements.worksheet = document.getElementById('worksheet-select');
  elements.label = document.getElementById('label-select');
  elements.value = document.getElementById('value-select');
  elements.compare = document.getElementById('compare-select');
  elements.deltaMode = document.getElementById('delta-mode-select');
  elements.deltaContext = document.getElementById('delta-context');
  elements.positiveIsGood = document.getElementById('positive-is-good');
  elements.showTotalCard = document.getElementById('show-total-card');
  elements.totalLabel = document.getElementById('total-label');
  elements.totalLabelColor = document.getElementById('total-label-color');
  elements.totalLabelFontSize = document.getElementById('total-label-font-size');
  elements.totalValueColor = document.getElementById('total-value-color');
  elements.totalValueFontSize = document.getElementById('total-value-font-size');
  elements.totalDeltaFontSize = document.getElementById('total-delta-font-size');
  elements.totalPositiveDeltaColor = document.getElementById('total-positive-delta-color');
  elements.totalNegativeDeltaColor = document.getElementById('total-negative-delta-color');
  elements.totalCardBackground = document.getElementById('total-card-background');
  elements.totalCardBackgroundColor = document.getElementById('total-card-background-color');
  elements.totalCardBorderColor = document.getElementById('total-card-border-color');
  elements.totalCardBorder = document.getElementById('total-card-border');
  elements.labelColor = document.getElementById('label-color');
  elements.labelFontSize = document.getElementById('label-font-size');
  elements.valueColor = document.getElementById('value-color');
  elements.valueFontSize = document.getElementById('value-font-size');
  elements.deltaFontSize = document.getElementById('delta-font-size');
  elements.positiveDeltaColor = document.getElementById('positive-delta-color');
  elements.negativeDeltaColor = document.getElementById('negative-delta-color');
  elements.cardBackground = document.getElementById('card-background');
  elements.cardBackgroundColor = document.getElementById('card-background-color');
  elements.cardBorderColor = document.getElementById('card-border-color');
  elements.cardBorder = document.getElementById('card-border');
  elements.save = document.getElementById('save-button');
  elements.cancel = document.getElementById('cancel-button');
}

function bindEvents() {
  elements.worksheet.addEventListener('change', async () => {
    await populateColumns(elements.worksheet.value, {});
    updateSaveState();
  });
  for (const control of [
    elements.label,
    elements.value,
    elements.compare,
    elements.deltaMode,
    elements.deltaContext,
    elements.totalLabel,
    elements.labelColor,
    elements.labelFontSize,
    elements.valueColor,
    elements.valueFontSize,
    elements.deltaFontSize,
    elements.positiveDeltaColor,
    elements.negativeDeltaColor,
    elements.cardBackground,
    elements.cardBackgroundColor,
    elements.cardBorderColor,
    elements.totalLabelColor,
    elements.totalLabelFontSize,
    elements.totalValueColor,
    elements.totalValueFontSize,
    elements.totalDeltaFontSize,
    elements.totalPositiveDeltaColor,
    elements.totalNegativeDeltaColor,
    elements.totalCardBackground,
    elements.totalCardBackgroundColor,
    elements.totalCardBorderColor
  ]) {
    control.addEventListener('change', updateSaveState);
  }
  elements.cardBackground.addEventListener('change', updateBackgroundColorState);
  elements.totalCardBackground.addEventListener('change', updateTotalBackgroundColorState);
  elements.positiveIsGood.addEventListener('change', updateSaveState);
  elements.showTotalCard.addEventListener('change', updateTotalLabelState);
  elements.cardBorder.addEventListener('change', updateBorderColorState);
  elements.totalCardBorder.addEventListener('change', updateTotalBorderColorState);
  elements.form.addEventListener('submit', saveConfig);
  elements.cancel.addEventListener('click', () => tableau.extensions.ui.closeDialog('cancelled'));
}

function populateWorksheets() {
  replaceOptions(elements.worksheet, [blankOption('Choose a worksheet')].concat(
    worksheets.map(worksheet => ({ value: worksheet.name, label: worksheet.name }))
  ));
}

async function loadCurrentSettings() {
  const settings = tableau.extensions.settings;
  const saved = {
    worksheet: settings.get(SETTINGS.worksheet) || '',
    labelCol: settings.get(SETTINGS.labelCol) || '',
    valueCol: settings.get(SETTINGS.valueCol) || '',
    compareCol: settings.get(SETTINGS.compareCol) || '',
    deltaMode: settings.get(SETTINGS.deltaMode) || 'percent',
    deltaContext: settingOrDefault(settings, SETTINGS.deltaContext, 'vs comparison'),
    positiveIsGood: settings.get(SETTINGS.positiveIsGood) !== 'false',
    showTotalCard: settings.get(SETTINGS.showTotalCard) === 'true',
    totalLabel: settings.get(SETTINGS.totalLabel) || 'Total',
    totalLabelColor: settings.get(SETTINGS.totalLabelColor) || settings.get(SETTINGS.labelColor) || STYLE_DEFAULTS.labelColor,
    totalLabelFontSize: settings.get(SETTINGS.totalLabelFontSize) || settings.get(SETTINGS.labelFontSize) || STYLE_DEFAULTS.labelFontSize,
    totalValueColor: settings.get(SETTINGS.totalValueColor) || settings.get(SETTINGS.valueColor) || STYLE_DEFAULTS.valueColor,
    totalValueFontSize: settings.get(SETTINGS.totalValueFontSize) || settings.get(SETTINGS.valueFontSize) || STYLE_DEFAULTS.valueFontSize,
    totalDeltaFontSize: settings.get(SETTINGS.totalDeltaFontSize) || settings.get(SETTINGS.deltaFontSize) || STYLE_DEFAULTS.deltaFontSize,
    totalPositiveDeltaColor: settings.get(SETTINGS.totalPositiveDeltaColor) || settings.get(SETTINGS.positiveDeltaColor) || STYLE_DEFAULTS.positiveDeltaColor,
    totalNegativeDeltaColor: settings.get(SETTINGS.totalNegativeDeltaColor) || settings.get(SETTINGS.negativeDeltaColor) || STYLE_DEFAULTS.negativeDeltaColor,
    totalCardBackground: settingOrDefault(settings, SETTINGS.totalCardBackground, settings.get(SETTINGS.cardBackground) || STYLE_DEFAULTS.cardBackground),
    totalCardBackgroundColor: settings.get(SETTINGS.totalCardBackgroundColor) || settings.get(SETTINGS.totalCardBackground) || settings.get(SETTINGS.cardBackgroundColor) || STYLE_DEFAULTS.cardBackgroundColor,
    totalCardBorderColor: settings.get(SETTINGS.totalCardBorderColor) || settings.get(SETTINGS.totalPositiveDeltaColor) || settings.get(SETTINGS.positiveDeltaColor) || STYLE_DEFAULTS.positiveDeltaColor,
    totalCardBorder: settingOrDefault(settings, SETTINGS.totalCardBorder, settings.get(SETTINGS.cardBorder) || STYLE_DEFAULTS.cardBorder) !== 'false',
    labelColor: settings.get(SETTINGS.labelColor) || STYLE_DEFAULTS.labelColor,
    labelFontSize: settings.get(SETTINGS.labelFontSize) || STYLE_DEFAULTS.labelFontSize,
    valueColor: settings.get(SETTINGS.valueColor) || STYLE_DEFAULTS.valueColor,
    valueFontSize: settings.get(SETTINGS.valueFontSize) || STYLE_DEFAULTS.valueFontSize,
    deltaFontSize: settings.get(SETTINGS.deltaFontSize) || STYLE_DEFAULTS.deltaFontSize,
    positiveDeltaColor: settings.get(SETTINGS.positiveDeltaColor) || STYLE_DEFAULTS.positiveDeltaColor,
    negativeDeltaColor: settings.get(SETTINGS.negativeDeltaColor) || STYLE_DEFAULTS.negativeDeltaColor,
    cardBackground: settings.get(SETTINGS.cardBackground) || STYLE_DEFAULTS.cardBackground,
    cardBackgroundColor: settings.get(SETTINGS.cardBackgroundColor) || settings.get(SETTINGS.cardBackground) || STYLE_DEFAULTS.cardBackgroundColor,
    cardBorderColor: settings.get(SETTINGS.cardBorderColor) || STYLE_DEFAULTS.cardBorderColor,
    cardBorder: settings.get(SETTINGS.cardBorder) !== 'false'
  };

  elements.worksheet.value = saved.worksheet;
  elements.deltaMode.value = saved.deltaMode;
  elements.deltaContext.value = saved.deltaContext;
  elements.positiveIsGood.checked = saved.positiveIsGood;
  elements.showTotalCard.checked = saved.showTotalCard;
  elements.totalLabel.value = saved.totalLabel;
  elements.totalLabelColor.value = safeHex(saved.totalLabelColor, safeHex(saved.labelColor, STYLE_DEFAULTS.labelColor));
  elements.totalLabelFontSize.value = safeNumber(saved.totalLabelFontSize, 10, 24, saved.labelFontSize);
  elements.totalValueColor.value = safeHex(saved.totalValueColor, safeHex(saved.valueColor, STYLE_DEFAULTS.valueColor));
  elements.totalValueFontSize.value = safeNumber(saved.totalValueFontSize, 18, 64, saved.valueFontSize);
  elements.totalDeltaFontSize.value = safeNumber(saved.totalDeltaFontSize, 10, 24, saved.deltaFontSize);
  elements.totalPositiveDeltaColor.value = safeHex(saved.totalPositiveDeltaColor, safeHex(saved.positiveDeltaColor, STYLE_DEFAULTS.positiveDeltaColor));
  elements.totalNegativeDeltaColor.value = safeHex(saved.totalNegativeDeltaColor, safeHex(saved.negativeDeltaColor, STYLE_DEFAULTS.negativeDeltaColor));
  elements.totalCardBackground.value = backgroundMode(saved.totalCardBackground);
  elements.totalCardBackgroundColor.value = safeHex(saved.totalCardBackgroundColor, STYLE_DEFAULTS.cardBackgroundColor);
  elements.totalCardBorderColor.value = safeHex(saved.totalCardBorderColor, safeHex(saved.totalPositiveDeltaColor, STYLE_DEFAULTS.positiveDeltaColor));
  elements.totalCardBorder.checked = saved.totalCardBorder;
  elements.labelColor.value = safeHex(saved.labelColor, STYLE_DEFAULTS.labelColor);
  elements.labelFontSize.value = safeNumber(saved.labelFontSize, 10, 24, STYLE_DEFAULTS.labelFontSize);
  elements.valueColor.value = safeHex(saved.valueColor, STYLE_DEFAULTS.valueColor);
  elements.valueFontSize.value = safeNumber(saved.valueFontSize, 18, 56, STYLE_DEFAULTS.valueFontSize);
  elements.deltaFontSize.value = safeNumber(saved.deltaFontSize, 10, 24, STYLE_DEFAULTS.deltaFontSize);
  elements.positiveDeltaColor.value = safeHex(saved.positiveDeltaColor, STYLE_DEFAULTS.positiveDeltaColor);
  elements.negativeDeltaColor.value = safeHex(saved.negativeDeltaColor, STYLE_DEFAULTS.negativeDeltaColor);
  elements.cardBackground.value = backgroundMode(saved.cardBackground);
  elements.cardBackgroundColor.value = safeHex(saved.cardBackgroundColor, STYLE_DEFAULTS.cardBackgroundColor);
  elements.cardBorderColor.value = safeHex(saved.cardBorderColor, STYLE_DEFAULTS.cardBorderColor);
  elements.cardBorder.checked = saved.cardBorder;
  updateTotalLabelState();
  updateBackgroundColorState();
  updateTotalBackgroundColorState();
  updateBorderColorState();
  updateTotalBorderColorState();

  if (saved.worksheet) {
    await populateColumns(saved.worksheet, saved);
  } else {
    resetColumnSelects();
  }
}

async function populateColumns(worksheetName, saved) {
  const worksheet = worksheets.find(item => item.name === worksheetName);
  if (!worksheet) {
    resetColumnSelects();
    return;
  }

  setColumnLoading(true);
  try {
    const table = await worksheet.getSummaryDataAsync({ maxRows: 1, ignoreSelection: true });
    const columnOptions = table.columns.map(column => ({
      value: column.fieldName,
      label: column.fieldName
    }));

    replaceOptions(elements.label, [blankOption('Choose label column')].concat(columnOptions));
    replaceOptions(elements.value, [blankOption('Choose value column')].concat(columnOptions));
    replaceOptions(elements.compare, [blankOption('No comparison')].concat(columnOptions));

    elements.label.value = saved.labelCol || '';
    elements.value.value = saved.valueCol || '';
    elements.compare.value = saved.compareCol || '';
    enableColumnSelects(true);
  } catch (err) {
    resetColumnSelects();
    showError(err);
  } finally {
    setColumnLoading(false);
  }
}

function setColumnLoading(isLoading) {
  if (isLoading) {
    replaceOptions(elements.label, [blankOption('Loading columns')]);
    replaceOptions(elements.value, [blankOption('Loading columns')]);
    replaceOptions(elements.compare, [blankOption('Loading columns')]);
    enableColumnSelects(false);
  }
}

function resetColumnSelects() {
  replaceOptions(elements.label, [blankOption('Choose a worksheet first')]);
  replaceOptions(elements.value, [blankOption('Choose a worksheet first')]);
  replaceOptions(elements.compare, [blankOption('No comparison')]);
  enableColumnSelects(false);
}

function enableColumnSelects(enabled) {
  elements.label.disabled = !enabled;
  elements.value.disabled = !enabled;
  elements.compare.disabled = !enabled;
}

function replaceOptions(select, options) {
  select.innerHTML = '';
  for (const optionConfig of options) {
    const option = document.createElement('option');
    option.value = optionConfig.value;
    option.textContent = optionConfig.label;
    select.appendChild(option);
  }
}

function blankOption(label) {
  return { value: '', label };
}

function updateSaveState() {
  elements.save.disabled = !elements.worksheet.value || !elements.label.value || !elements.value.value;
}

async function saveConfig(event) {
  event.preventDefault();
  updateSaveState();
  if (elements.save.disabled) return;

  try {
    const settings = tableau.extensions.settings;
    settings.set(SETTINGS.worksheet, elements.worksheet.value);
    settings.set(SETTINGS.labelCol, elements.label.value);
    settings.set(SETTINGS.valueCol, elements.value.value);
    settings.set(SETTINGS.compareCol, elements.compare.value || '');
    settings.set(SETTINGS.deltaMode, elements.deltaMode.value);
    settings.set(SETTINGS.deltaContext, elements.deltaContext.value.trim());
    settings.set(SETTINGS.positiveIsGood, elements.positiveIsGood.checked ? 'true' : 'false');
    settings.set(SETTINGS.showTotalCard, elements.showTotalCard.checked ? 'true' : 'false');
    settings.set(SETTINGS.totalLabel, elements.totalLabel.value.trim() || 'Total');
    settings.set(SETTINGS.totalLabelColor, safeHex(elements.totalLabelColor.value, STYLE_DEFAULTS.labelColor));
    settings.set(SETTINGS.totalLabelFontSize, safeNumber(elements.totalLabelFontSize.value, 10, 24, STYLE_DEFAULTS.labelFontSize));
    settings.set(SETTINGS.totalValueColor, safeHex(elements.totalValueColor.value, STYLE_DEFAULTS.valueColor));
    settings.set(SETTINGS.totalValueFontSize, safeNumber(elements.totalValueFontSize.value, 18, 64, STYLE_DEFAULTS.valueFontSize));
    settings.set(SETTINGS.totalDeltaFontSize, safeNumber(elements.totalDeltaFontSize.value, 10, 24, STYLE_DEFAULTS.deltaFontSize));
    settings.set(SETTINGS.totalPositiveDeltaColor, safeHex(elements.totalPositiveDeltaColor.value, STYLE_DEFAULTS.positiveDeltaColor));
    settings.set(SETTINGS.totalNegativeDeltaColor, safeHex(elements.totalNegativeDeltaColor.value, STYLE_DEFAULTS.negativeDeltaColor));
    settings.set(SETTINGS.totalCardBackground, totalCardBackgroundSetting());
    settings.set(SETTINGS.totalCardBackgroundColor, safeHex(elements.totalCardBackgroundColor.value, STYLE_DEFAULTS.cardBackgroundColor));
    settings.set(SETTINGS.totalCardBorderColor, safeHex(elements.totalCardBorderColor.value, STYLE_DEFAULTS.positiveDeltaColor));
    settings.set(SETTINGS.totalCardBorder, elements.totalCardBorder.checked ? 'true' : 'false');
    settings.set(SETTINGS.labelColor, safeHex(elements.labelColor.value, STYLE_DEFAULTS.labelColor));
    settings.set(SETTINGS.labelFontSize, safeNumber(elements.labelFontSize.value, 10, 24, STYLE_DEFAULTS.labelFontSize));
    settings.set(SETTINGS.valueColor, safeHex(elements.valueColor.value, STYLE_DEFAULTS.valueColor));
    settings.set(SETTINGS.valueFontSize, safeNumber(elements.valueFontSize.value, 18, 56, STYLE_DEFAULTS.valueFontSize));
    settings.set(SETTINGS.deltaFontSize, safeNumber(elements.deltaFontSize.value, 10, 24, STYLE_DEFAULTS.deltaFontSize));
    settings.set(SETTINGS.positiveDeltaColor, safeHex(elements.positiveDeltaColor.value, STYLE_DEFAULTS.positiveDeltaColor));
    settings.set(SETTINGS.negativeDeltaColor, safeHex(elements.negativeDeltaColor.value, STYLE_DEFAULTS.negativeDeltaColor));
    settings.set(SETTINGS.cardBackground, cardBackgroundSetting());
    settings.set(SETTINGS.cardBackgroundColor, safeHex(elements.cardBackgroundColor.value, STYLE_DEFAULTS.cardBackgroundColor));
    settings.set(SETTINGS.cardBorderColor, safeHex(elements.cardBorderColor.value, STYLE_DEFAULTS.cardBorderColor));
    settings.set(SETTINGS.cardBorder, elements.cardBorder.checked ? 'true' : 'false');
    await settings.saveAsync();
    tableau.extensions.ui.closeDialog('saved');
  } catch (err) {
    showError(err);
  }
}

function safeNumber(value, min, max, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return String(Math.min(max, Math.max(min, parsed)));
}

function safeHex(value, fallback) {
  const text = String(value || '').trim();
  return /^#[0-9a-fA-F]{6}$/.test(text) ? text : fallback;
}

function backgroundMode(value) {
  if (value === 'transparent') return 'transparent';
  if (safeHex(value, '') && value.toLowerCase() !== STYLE_DEFAULTS.cardBackground) return 'custom';
  return STYLE_DEFAULTS.cardBackground;
}

function cardBackgroundSetting() {
  if (elements.cardBackground.value === 'transparent') return 'transparent';
  if (elements.cardBackground.value === 'custom') {
    return safeHex(elements.cardBackgroundColor.value, STYLE_DEFAULTS.cardBackgroundColor);
  }
  return STYLE_DEFAULTS.cardBackground;
}

function updateBackgroundColorState() {
  elements.cardBackgroundColor.disabled = elements.cardBackground.value !== 'custom';
}

function updateBorderColorState() {
  elements.cardBorderColor.disabled = !elements.cardBorder.checked;
  updateSaveState();
}

function totalCardBackgroundSetting() {
  if (elements.totalCardBackground.value === 'transparent') return 'transparent';
  if (elements.totalCardBackground.value === 'custom') {
    return safeHex(elements.totalCardBackgroundColor.value, STYLE_DEFAULTS.cardBackgroundColor);
  }
  return STYLE_DEFAULTS.cardBackground;
}

function updateTotalBackgroundColorState() {
  elements.totalCardBackgroundColor.disabled = elements.totalCardBackground.value !== 'custom';
}

function updateTotalBorderColorState() {
  elements.totalCardBorderColor.disabled = !elements.totalCardBorder.checked;
  updateSaveState();
}

function updateTotalLabelState() {
  elements.totalLabel.disabled = !elements.showTotalCard.checked;
  updateSaveState();
}

function settingOrDefault(settings, key, fallback) {
  const value = settings.get(key);
  return value == null ? fallback : value;
}

function showError(err) {
  elements.error.textContent = `Configuration error: ${err && err.message ? err.message : String(err)}`;
  elements.error.classList.remove('hidden');
}
