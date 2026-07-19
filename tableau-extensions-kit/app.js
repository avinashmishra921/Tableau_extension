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
  cardBorderColor: '#dedede',
  cardBorder: 'true'
};

const MAX_CARDS = 8;
let activeWorksheetName = '';
let unregisterFilterListener = null;
let unregisterSummaryListener = null;

window.addEventListener('DOMContentLoaded', initializeExtension);

async function initializeExtension() {
  try {
    await tableau.extensions.initializeAsync({ configure: openConfigureDialog });
    tableau.extensions.settings.addEventListener(
      tableau.TableauEventType.SettingsChanged,
      () => refresh()
    );
    await refresh();
  } catch (err) {
    showError(err);
  }
}

function getConfig() {
  const settings = tableau.extensions.settings;
  return {
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
    cardBorderColor: settings.get(SETTINGS.cardBorderColor) || STYLE_DEFAULTS.cardBorderColor,
    cardBorder: settings.get(SETTINGS.cardBorder) !== 'false'
  };
}

async function refresh() {
  try {
    const config = getConfig();
    applyStyleConfig(config);
    clearError();

    if (!config.worksheet || !config.labelCol || !config.valueCol) {
      clearCards();
      return showState('empty-state');
    }

    const worksheet = getWorksheet(config.worksheet);
    if (!worksheet) {
      clearCards();
      return showState('empty-state');
    }

    registerDataListeners(worksheet);

    const table = await worksheet.getSummaryDataAsync({ maxRows: 1000, ignoreSelection: true });
    if (!table.data || table.data.length === 0) {
      clearCards();
      return showState('no-data');
    }

    renderCards(table, config);
    showState('card-state');
  } catch (err) {
    showError(err);
  }
}

function getWorksheet(name) {
  return tableau.extensions.dashboardContent.dashboard.worksheets.find(
    worksheet => worksheet.name === name
  );
}

function registerDataListeners(worksheet) {
  if (activeWorksheetName === worksheet.name && (unregisterFilterListener || unregisterSummaryListener)) {
    return;
  }

  unregisterDataListeners();
  activeWorksheetName = worksheet.name;

  unregisterFilterListener = worksheet.addEventListener(
    tableau.TableauEventType.FilterChanged,
    () => refresh()
  );

  if (tableau.TableauEventType.SummaryDataChanged) {
    unregisterSummaryListener = worksheet.addEventListener(
      tableau.TableauEventType.SummaryDataChanged,
      () => refresh()
    );
  }
}

function unregisterDataListeners() {
  if (unregisterFilterListener) unregisterFilterListener();
  if (unregisterSummaryListener) unregisterSummaryListener();
  unregisterFilterListener = null;
  unregisterSummaryListener = null;
}

function renderCards(table, config) {
  const labelIndex = getColumnIndex(table, config.labelCol);
  const valueIndex = getColumnIndex(table, config.valueCol);
  const compareIndex = getColumnIndex(table, config.compareCol);

  if (labelIndex < 0 || valueIndex < 0) {
    clearCards();
    showState('empty-state');
    return;
  }

  const cards = document.getElementById('cards');
  const notice = document.getElementById('row-notice');
  cards.innerHTML = '';

  const visibleRows = table.data.slice(0, MAX_CARDS);
  if (config.showTotalCard) {
    const totalCard = buildTotalCard(table.data, { labelIndex, valueIndex, compareIndex }, config);
    if (totalCard) cards.appendChild(totalCard);
  }

  for (const row of visibleRows) {
    cards.appendChild(buildCard(row, { labelIndex, valueIndex, compareIndex }, config));
  }

  if (table.data.length > MAX_CARDS) {
    notice.textContent = `Showing first ${MAX_CARDS} of ${table.data.length} rows.`;
    notice.classList.remove('hidden');
  } else {
    notice.textContent = '';
    notice.classList.add('hidden');
  }
}

function buildTotalCard(rows, indexes, config) {
  const valueTotal = sumColumn(rows, indexes.valueIndex);
  if (!valueTotal.valid) return null;

  const card = document.createElement('article');
  card.className = 'card total-card';

  const label = document.createElement('div');
  label.className = 'label';
  label.textContent = config.totalLabel.trim() || 'Total';

  const value = document.createElement('div');
  value.className = 'value';
  value.textContent = formatComputedValue(valueTotal.sum, firstCell(rows, indexes.valueIndex));

  card.append(label, value);

  const delta = buildTotalDelta(rows, indexes, config, valueTotal.sum);
  if (delta) card.appendChild(delta);

  return card;
}

function buildCard(row, indexes, config) {
  const card = document.createElement('article');
  card.className = 'card';

  const label = document.createElement('div');
  label.className = 'label';
  label.textContent = cellDisplay(row[indexes.labelIndex]);

  const value = document.createElement('div');
  value.className = 'value';
  value.textContent = cellDisplay(row[indexes.valueIndex]);

  card.append(label, value);

  const delta = buildDelta(row, indexes, config);
  if (delta) card.appendChild(delta);

  return card;
}

function buildTotalDelta(rows, indexes, config, valueTotal) {
  if (config.deltaMode === 'hidden' || indexes.compareIndex < 0) return null;

  const comparisonTotal = sumColumn(rows, indexes.compareIndex);
  if (!comparisonTotal.valid) return null;
  if (config.deltaMode === 'percent' && comparisonTotal.sum === 0) return null;

  const difference = valueTotal - comparisonTotal.sum;
  const good = config.positiveIsGood ? difference >= 0 : difference <= 0;
  const direction = difference >= 0 ? 'up' : 'down';
  const text = config.deltaMode === 'percent'
    ? deltaText(formatPercent(difference, comparisonTotal.sum), config)
    : deltaText(formatComputedValue(difference, firstCell(rows, indexes.valueIndex)), config);

  const delta = document.createElement('div');
  delta.className = `delta ${good ? 'good' : 'bad'}`;
  delta.innerHTML = `<span aria-hidden="true">${direction === 'up' ? '&#9650;' : '&#9660;'}</span> ${escapeHtml(text)}`;
  return delta;
}

function buildDelta(row, indexes, config) {
  if (config.deltaMode === 'hidden' || indexes.compareIndex < 0) return null;

  const current = Number(row[indexes.valueIndex].value);
  const comparison = Number(row[indexes.compareIndex].value);
  if (!Number.isFinite(current) || !Number.isFinite(comparison)) return null;
  if (config.deltaMode === 'percent' && comparison === 0) return null;

  const difference = current - comparison;
  const good = config.positiveIsGood ? difference >= 0 : difference <= 0;
  const direction = difference >= 0 ? 'up' : 'down';
  const text = config.deltaMode === 'percent'
    ? deltaText(formatPercent(difference, comparison), config)
    : deltaText(formatNumber(difference), config);

  const delta = document.createElement('div');
  delta.className = `delta ${good ? 'good' : 'bad'}`;
  delta.innerHTML = `<span aria-hidden="true">${direction === 'up' ? '&#9650;' : '&#9660;'}</span> ${escapeHtml(text)}`;
  return delta;
}

function getColumnIndex(table, fieldName) {
  if (!fieldName) return -1;
  return table.columns.findIndex(column => column.fieldName === fieldName);
}

function cellDisplay(cell) {
  if (!cell) return '';
  return cell.formattedValue == null ? '' : String(cell.formattedValue);
}

function firstCell(rows, index) {
  if (index < 0) return null;
  const row = rows.find(item => item[index]);
  return row ? row[index] : null;
}

function sumColumn(rows, index) {
  if (index < 0) return { sum: 0, valid: false };
  let sum = 0;
  let valid = false;
  for (const row of rows) {
    const value = Number(row[index] && row[index].value);
    if (Number.isFinite(value)) {
      sum += value;
      valid = true;
    }
  }
  return { sum, valid };
}

function formatPercent(difference, comparison) {
  return `${((difference / Math.abs(comparison)) * 100).toFixed(1)}%`;
}

function formatNumber(value) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value);
}

function deltaText(valueText, config) {
  const context = String(config.deltaContext || '').trim();
  return context ? `${valueText} ${context}` : valueText;
}

function formatComputedValue(value, sampleCell) {
  const sample = sampleCell && sampleCell.formattedValue ? String(sampleCell.formattedValue) : '';
  const absoluteValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (sample.includes('$')) {
    return `${sign}$${new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(absoluteValue)}`;
  }

  if (sample.includes('%')) {
    return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value)}%`;
  }

  const hasDecimal = /\d+\.\d+/.test(sample);
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: hasDecimal ? 2 : 0
  }).format(value);
}

function applyStyleConfig(config) {
  const root = document.documentElement;
  root.style.setProperty('--kpi-label-color', safeHex(config.labelColor, STYLE_DEFAULTS.labelColor));
  root.style.setProperty('--kpi-label-size', `${safeNumber(config.labelFontSize, 10, 24, STYLE_DEFAULTS.labelFontSize)}px`);
  root.style.setProperty('--kpi-value-color', safeHex(config.valueColor, STYLE_DEFAULTS.valueColor));
  root.style.setProperty('--kpi-value-size', `${safeNumber(config.valueFontSize, 18, 56, STYLE_DEFAULTS.valueFontSize)}px`);
  root.style.setProperty('--kpi-delta-size', `${safeNumber(config.deltaFontSize, 10, 24, STYLE_DEFAULTS.deltaFontSize)}px`);
  root.style.setProperty('--good', safeHex(config.positiveDeltaColor, STYLE_DEFAULTS.positiveDeltaColor));
  root.style.setProperty('--bad', safeHex(config.negativeDeltaColor, STYLE_DEFAULTS.negativeDeltaColor));
  root.style.setProperty('--panel', safeBackground(config.cardBackground));
  root.style.setProperty('--card-border-color', config.cardBorder ? safeHex(config.cardBorderColor, STYLE_DEFAULTS.cardBorderColor) : 'transparent');
  root.style.setProperty('--total-kpi-label-color', safeHex(config.totalLabelColor, safeHex(config.labelColor, STYLE_DEFAULTS.labelColor)));
  root.style.setProperty('--total-kpi-label-size', `${safeNumber(config.totalLabelFontSize, 10, 24, config.labelFontSize)}px`);
  root.style.setProperty('--total-kpi-value-color', safeHex(config.totalValueColor, safeHex(config.valueColor, STYLE_DEFAULTS.valueColor)));
  root.style.setProperty('--total-kpi-value-size', `${safeNumber(config.totalValueFontSize, 18, 64, config.valueFontSize)}px`);
  root.style.setProperty('--total-kpi-delta-size', `${safeNumber(config.totalDeltaFontSize, 10, 24, config.deltaFontSize)}px`);
  root.style.setProperty('--total-good', safeHex(config.totalPositiveDeltaColor, safeHex(config.positiveDeltaColor, STYLE_DEFAULTS.positiveDeltaColor)));
  root.style.setProperty('--total-bad', safeHex(config.totalNegativeDeltaColor, safeHex(config.negativeDeltaColor, STYLE_DEFAULTS.negativeDeltaColor)));
  root.style.setProperty('--total-panel', safeBackground(config.totalCardBackground));
  root.style.setProperty('--total-card-border-color', config.totalCardBorder ? safeHex(config.totalCardBorderColor, safeHex(config.totalPositiveDeltaColor, STYLE_DEFAULTS.positiveDeltaColor)) : 'transparent');
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

function safeBackground(value) {
  return value === 'transparent' ? 'transparent' : safeHex(value, STYLE_DEFAULTS.cardBackground);
}

function settingOrDefault(settings, key, fallback) {
  const value = settings.get(key);
  return value == null ? fallback : value;
}

async function openConfigureDialog() {
  const url = new URL('config.html', window.location.href).href;
  try {
    await tableau.extensions.ui.displayDialogAsync(url, '', { width: 540, height: 920 });
    await refresh();
  } catch (err) {
    if (err.errorCode !== tableau.ErrorCodes.DialogClosedByUser) showError(err);
  }
}

function showState(id) {
  for (const elementId of ['empty-state', 'no-data', 'error-state', 'card-state']) {
    document.getElementById(elementId).classList.toggle('hidden', elementId !== id);
  }
}

function clearCards() {
  document.getElementById('cards').innerHTML = '';
  const notice = document.getElementById('row-notice');
  notice.textContent = '';
  notice.classList.add('hidden');
}

function clearError() {
  const error = document.getElementById('error-state');
  error.textContent = '';
}

function showError(err) {
  const error = document.getElementById('error-state');
  error.textContent = `Extension error: ${err && err.message ? err.message : String(err)}`;
  showState('error-state');
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}
