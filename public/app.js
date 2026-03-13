/**
 * Omnicept — Data Visualization for Everyone
 * Frontend application: upload, parse, visualize
 */

(function () {
  'use strict';

  // ── State ──
  let currentData = null;
  let currentChart = null;
  let fileName = '';
  let tableVisible = false;

  // ── DOM ──
  const $ = (sel) => document.querySelector(sel);
  const uploadSection = $('#upload-section');
  const loadingSection = $('#loading-section');
  const vizSection = $('#viz-section');
  const dropZone = $('#drop-zone');
  const fileInput = $('#file-input');
  const browseBtn = $('#browse-btn');
  const chartTypeSelect = $('#chart-type');
  const xCol = $('#x-column');
  const yCol = $('#y-column');
  const newUploadBtn = $('#new-upload-btn');
  const exportBtn = $('#export-btn');
  const toggleTableBtn = $('#toggle-table-btn');
  const datasetTitle = $('#dataset-title');
  const datasetStats = $('#dataset-stats');
  const tableWrapper = $('#data-table-wrapper');
  const tableHead = $('#table-head');
  const tableBody = $('#table-body');
  const tableNote = $('#table-note');

  // ══════════════════════════════════
  // INIT
  // ══════════════════════════════════
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    // Browse button — stop event from bubbling to dropZone
    browseBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      fileInput.click();
    });

    fileInput.addEventListener('change', handleFileSelect);

    // Drag & drop
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('drop', handleDrop);
    dropZone.addEventListener('click', function () { fileInput.click(); });

    // Controls
    chartTypeSelect.addEventListener('change', rebuildChart);
    xCol.addEventListener('change', rebuildChart);
    yCol.addEventListener('change', rebuildChart);

    // Actions
    newUploadBtn.addEventListener('click', resetToUpload);
    exportBtn.addEventListener('click', exportChart);
    toggleTableBtn.addEventListener('click', toggleTable);
  }

  // ══════════════════════════════════
  // FILE HANDLING
  // ══════════════════════════════════
  function handleDragOver(e) {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  }

  function handleDragLeave(e) {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
  }

  function handleDrop(e) {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    if (e.dataTransfer.files.length) processFile(e.dataTransfer.files[0]);
  }

  function handleFileSelect(e) {
    if (e.target.files[0]) processFile(e.target.files[0]);
  }

  async function processFile(file) {
    showSection('loading');
    fileName = file.name;
    var ext = file.name.split('.').pop().toLowerCase();

    try {
      if (ext === 'csv') {
        await parseCSV(file);
      } else if (ext === 'json') {
        await parseJSON(file);
      } else if (ext === 'xlsx') {
        toast('Excel support coming soon. Use CSV or JSON.', 'error');
        showSection('upload');
        return;
      } else {
        toast('Unsupported format. Use CSV, JSON, or XLSX.', 'error');
        showSection('upload');
        return;
      }
      initVisualization();
      showSection('viz');
      toast('Data loaded: ' + fileName, 'success');
    } catch (err) {
      toast('Parse error: ' + err.message, 'error');
      showSection('upload');
    }
  }

  // ══════════════════════════════════
  // PARSERS
  // ══════════════════════════════════
  function parseCSV(file) {
    return new Promise(function (resolve, reject) {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: function (results) {
          if (!results.data || !results.data.length) {
            return reject(new Error('CSV contains no data rows'));
          }
          currentData = results.data;
          resolve();
        },
        error: function (err) { reject(err); }
      });
    });
  }

  function parseJSON(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function (e) {
        try {
          var json = JSON.parse(e.target.result);

          // Handle array of objects
          if (Array.isArray(json)) {
            if (!json.length || typeof json[0] !== 'object') {
              return reject(new Error('JSON must be an array of objects'));
            }
            currentData = json;
          }
          // Handle object with arrays (column-oriented)
          else if (typeof json === 'object' && json !== null) {
            var keys = Object.keys(json);
            if (!keys.length) return reject(new Error('Empty JSON object'));

            // If values are arrays, pivot to row-oriented
            if (Array.isArray(json[keys[0]])) {
              var len = json[keys[0]].length;
              currentData = [];
              for (var i = 0; i < len; i++) {
                var row = {};
                keys.forEach(function (k) { row[k] = json[k][i]; });
                currentData.push(row);
              }
            } else {
              currentData = [json];
            }
          } else {
            return reject(new Error('JSON format not recognized'));
          }

          resolve();
        } catch (err) { reject(err); }
      };
      reader.onerror = function () { reject(new Error('Failed to read file')); };
      reader.readAsText(file);
    });
  }

  // ══════════════════════════════════
  // VISUALIZATION INIT
  // ══════════════════════════════════
  function initVisualization() {
    if (!currentData || !currentData.length) {
      toast('No data found in file', 'error');
      showSection('upload');
      return;
    }

    var columns = Object.keys(currentData[0]);

    datasetTitle.textContent = fileName;
    datasetStats.textContent = currentData.length + ' rows \u00B7 ' + columns.length + ' columns';

    // Populate selectors
    xCol.innerHTML = '';
    yCol.innerHTML = '';
    columns.forEach(function (col) {
      xCol.appendChild(new Option(col, col));
      yCol.appendChild(new Option(col, col));
    });

    // Smart defaults: first string-ish column for X, first numeric for Y
    var numericCol = columns.find(function (c) {
      return typeof currentData[0][c] === 'number';
    });
    var stringCol = columns.find(function (c) {
      return typeof currentData[0][c] === 'string';
    });

    if (stringCol) xCol.value = stringCol;
    if (numericCol && numericCol !== xCol.value) yCol.value = numericCol;
    else if (columns.length > 1) yCol.value = columns[1];

    // Reset table
    tableVisible = false;
    tableWrapper.style.display = 'none';
    toggleTableBtn.querySelector('span').textContent = 'View Table';

    autoDetectChartType();
    createChart();
    buildTable(columns);
  }

  // ══════════════════════════════════
  // AUTO-DETECT
  // ══════════════════════════════════
  function autoDetectChartType() {
    var xKey = xCol.value;
    var yKey = yCol.value;
    var sample = currentData.slice(0, 50);

    var yNumeric = sample.every(function (r) {
      return typeof r[yKey] === 'number' && !isNaN(r[yKey]);
    });

    // Date detection: stricter than Date.parse
    var datePattern = /^\d{4}[-/]\d{1,2}[-/]\d{1,2}/;
    var xDates = sample.every(function (r) {
      return typeof r[xKey] === 'string' && datePattern.test(r[xKey]);
    });

    var uniqueX = new Set(currentData.map(function (r) { return r[xKey]; }));

    if (xDates && yNumeric) {
      chartTypeSelect.value = 'line';
    } else if (uniqueX.size <= 8 && yNumeric) {
      chartTypeSelect.value = 'pie';
    } else if (uniqueX.size <= 25 && yNumeric) {
      chartTypeSelect.value = 'bar';
    } else if (yNumeric) {
      chartTypeSelect.value = 'line';
    } else {
      chartTypeSelect.value = 'bar';
    }
  }

  // ══════════════════════════════════
  // CHART
  // ══════════════════════════════════
  var PALETTE = [
    '#bf5050', '#50bf7a', '#f0b040', '#5080bf', '#a050bf',
    '#50b0bf', '#bf7050', '#7abf50', '#bf50a0', '#50bf50'
  ];

  function generateColors(count) {
    var out = [];
    for (var i = 0; i < count; i++) {
      out.push(PALETTE[i % PALETTE.length]);
    }
    return out;
  }

  function createChart() {
    var type = chartTypeSelect.value;
    if (type === 'auto') type = 'bar';

    var xKey = xCol.value;
    var yKey = yCol.value;
    var labels = currentData.map(function (r) { return r[xKey]; });
    var data = currentData.map(function (r) { return r[yKey]; });
    var colors = generateColors(data.length);

    if (currentChart) currentChart.destroy();

    var isPolar = (type === 'pie' || type === 'doughnut' || type === 'polarArea');

    var ctx = document.getElementById('main-chart').getContext('2d');

    currentChart = new Chart(ctx, {
      type: type,
      data: {
        labels: labels,
        datasets: [{
          label: yKey,
          data: data,
          backgroundColor: isPolar ? colors.map(function (c) { return c + 'CC'; }) : colors[0] + '80',
          borderColor: isPolar ? colors : colors[0],
          borderWidth: isPolar ? 1 : 2,
          pointBackgroundColor: colors[0],
          pointBorderColor: colors[0],
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        animation: { duration: 600 },
        plugins: {
          legend: {
            display: isPolar,
            labels: {
              color: '#a0a0a0',
              font: { family: "'Oswald', sans-serif", size: 11, weight: '400' },
              boxWidth: 12,
              padding: 16
            }
          },
          title: {
            display: true,
            text: yKey + ' by ' + xKey,
            color: '#FFFFFF',
            font: {
              family: "'Oswald', sans-serif",
              size: 16,
              weight: '600'
            },
            padding: { bottom: 16 }
          },
          tooltip: {
            backgroundColor: '#262525',
            titleColor: '#FFFFFF',
            bodyColor: '#a0a0a0',
            borderColor: '#3a3838',
            borderWidth: 1,
            titleFont: { family: "'Oswald', sans-serif", weight: '500' },
            bodyFont: { family: "'Space Mono', monospace", size: 11 },
            padding: 10,
            cornerRadius: 2
          }
        },
        scales: isPolar ? {} : {
          x: {
            ticks: { color: '#a0a0a0', font: { family: "'Space Mono', monospace", size: 10 } },
            grid: { color: 'rgba(255,255,255,0.04)' },
            border: { color: '#3a3838' }
          },
          y: {
            beginAtZero: true,
            ticks: { color: '#a0a0a0', font: { family: "'Space Mono', monospace", size: 10 } },
            grid: { color: 'rgba(255,255,255,0.04)' },
            border: { color: '#3a3838' }
          }
        }
      }
    });
  }

  function rebuildChart() {
    if (!currentData) return;
    if (chartTypeSelect.value === 'auto') autoDetectChartType();
    createChart();
  }

  // ══════════════════════════════════
  // TABLE
  // ══════════════════════════════════
  function buildTable(columns) {
    var MAX_ROWS = 100;

    tableHead.innerHTML = '<tr>' + columns.map(function (c) {
      return '<th>' + escapeHtml(c) + '</th>';
    }).join('') + '</tr>';

    var rows = currentData.slice(0, MAX_ROWS);
    tableBody.innerHTML = rows.map(function (row) {
      return '<tr>' + columns.map(function (c) {
        var val = row[c];
        return '<td>' + (val != null ? escapeHtml(String(val)) : '') + '</td>';
      }).join('') + '</tr>';
    }).join('');

    if (currentData.length > MAX_ROWS) {
      tableNote.textContent = 'Showing first ' + MAX_ROWS + ' of ' + currentData.length + ' rows';
    } else {
      tableNote.textContent = currentData.length + ' rows total';
    }
  }

  function toggleTable() {
    tableVisible = !tableVisible;
    tableWrapper.style.display = tableVisible ? 'block' : 'none';
    toggleTableBtn.querySelector('span').textContent = tableVisible ? 'Hide Table' : 'View Table';
  }

  // ══════════════════════════════════
  // EXPORT
  // ══════════════════════════════════
  function exportChart() {
    if (!currentChart) return;
    var canvas = document.getElementById('main-chart');
    var link = document.createElement('a');
    link.download = 'omnicept-' + fileName.replace(/\.[^.]+$/, '') + '-' + Date.now() + '.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    toast('Chart exported', 'success');
  }

  // ══════════════════════════════════
  // UI HELPERS
  // ══════════════════════════════════
  function showSection(name) {
    uploadSection.classList.remove('active');
    loadingSection.classList.remove('active');
    vizSection.classList.remove('active');

    switch (name) {
      case 'upload': uploadSection.classList.add('active'); break;
      case 'loading': loadingSection.classList.add('active'); break;
      case 'viz': vizSection.classList.add('active'); break;
    }
  }

  function resetToUpload() {
    if (currentChart) { currentChart.destroy(); currentChart = null; }
    currentData = null;
    fileName = '';
    fileInput.value = '';
    tableVisible = false;
    tableWrapper.style.display = 'none';
    showSection('upload');
  }

  function toast(msg, type) {
    var el = $('#toast');
    el.textContent = msg;
    el.className = 'toast' + (type ? ' ' + type : '');
    // Force reflow
    void el.offsetWidth;
    el.classList.add('visible');
    setTimeout(function () { el.classList.remove('visible'); }, 3000);
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

})();
