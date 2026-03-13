/**
 * Omnicept - Frontend Application
 * Handles file upload, parsing, and chart generation
 */

// State
let currentData = null;
let currentChart = null;
let fileName = '';

// DOM Elements
const uploadSection = document.getElementById('upload-section');
const loadingSection = document.getElementById('loading-section');
const vizSection = document.getElementById('viz-section');
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const browseBtn = document.getElementById('browse-btn');
const chartTypeSelect = document.getElementById('chart-type');
const xColumnSelect = document.getElementById('x-column');
const yColumnSelect = document.getElementById('y-column');
const newUploadBtn = document.getElementById('new-upload-btn');
const exportBtn = document.getElementById('export-btn');
const datasetTitle = document.getElementById('dataset-title');
const datasetStats = document.getElementById('dataset-stats');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
});

function setupEventListeners() {
  // File input
  browseBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', handleFileSelect);

  // Drag and drop
  dropZone.addEventListener('dragover', handleDragOver);
  dropZone.addEventListener('dragleave', handleDragLeave);
  dropZone.addEventListener('drop', handleDrop);
  dropZone.addEventListener('click', () => fileInput.click());

  // Chart controls
  chartTypeSelect.addEventListener('change', updateChart);
  xColumnSelect.addEventListener('change', updateChart);
  yColumnSelect.addEventListener('change', updateChart);

  // Actions
  newUploadBtn.addEventListener('click', resetToUpload);
  exportBtn.addEventListener('click', exportChart);
}

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
  
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    processFile(files[0]);
  }
}

function handleFileSelect(e) {
  const file = e.target.files[0];
  if (file) {
    processFile(file);
  }
}

async function processFile(file) {
  showSection('loading');
  fileName = file.name;

  const ext = file.name.split('.').pop().toLowerCase();

  try {
    if (ext === 'csv') {
      await parseCSV(file);
    } else if (ext === 'json') {
      await parseJSON(file);
    } else if (ext === 'xlsx') {
      await parseExcel(file);
    } else {
      throw new Error('Unsupported file format');
    }

    initializeVisualization();
    showSection('viz');
  } catch (error) {
    alert('Error parsing file: ' + error.message);
    showSection('upload');
  }
}

function parseCSV(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        currentData = results.data;
        resolve();
      },
      error: (error) => reject(error)
    });
  });
}

function parseJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        currentData = Array.isArray(json) ? json : [json];
        resolve();
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

async function parseExcel(file) {
  // For Excel, we'll need to load SheetJS dynamically
  // For now, show a message that Excel support requires additional setup
  throw new Error('Excel support coming soon! Please use CSV or JSON for now.');
}

function initializeVisualization() {
  if (!currentData || currentData.length === 0) {
    alert('No data found in file');
    showSection('upload');
    return;
  }

  // Update dataset info
  datasetTitle.textContent = fileName;
  datasetStats.textContent = `${currentData.length} rows • ${Object.keys(currentData[0]).length} columns`;

  // Populate column selectors
  const columns = Object.keys(currentData[0]);
  xColumnSelect.innerHTML = '';
  yColumnSelect.innerHTML = '';

  columns.forEach((col, index) => {
    const optionX = document.createElement('option');
    optionX.value = col;
    optionX.textContent = col;
    xColumnSelect.appendChild(optionX);

    const optionY = document.createElement('option');
    optionY.value = col;
    optionY.textContent = col;
    yColumnSelect.appendChild(optionY);
  });

  // Auto-select second column for Y axis if available
  if (columns.length > 1) {
    yColumnSelect.value = columns[1];
  }

  // Detect best chart type and create chart
  autoDetectChartType();
  createChart();
}

function autoDetectChartType() {
  const xCol = xColumnSelect.value;
  const yCol = yColumnSelect.value;
  const xValues = currentData.map(row => row[xCol]);
  const yValues = currentData.map(row => row[yCol]);

  // Check if X is dates
  const isTimeSeries = xValues.every(v => !isNaN(Date.parse(v)));

  // Check if Y is numeric
  const isNumeric = yValues.every(v => typeof v === 'number' && !isNaN(v));

  // Check if X has few unique values (categorical)
  const uniqueX = [...new Set(xValues)];
  const isCategorical = uniqueX.length <= 10;

  if (isTimeSeries && isNumeric) {
    chartTypeSelect.value = 'line';
  } else if (isCategorical && isNumeric) {
    chartTypeSelect.value = 'bar';
  } else {
    chartTypeSelect.value = 'bar';
  }
}

function createChart() {
  const chartType = chartTypeSelect.value === 'auto' ? 'bar' : chartTypeSelect.value;
  const xCol = xColumnSelect.value;
  const yCol = yColumnSelect.value;

  const labels = currentData.map(row => row[xCol]);
  const data = currentData.map(row => row[yCol]);

  // Generate colors
  const colors = generateColors(data.length);

  // Destroy existing chart
  if (currentChart) {
    currentChart.destroy();
  }

  // Create new chart
  const ctx = document.getElementById('main-chart').getContext('2d');
  
  currentChart = new Chart(ctx, {
    type: chartType,
    data: {
      labels: labels,
      datasets: [{
        label: yCol,
        data: data,
        backgroundColor: colors.map(c => c + '80'),
        borderColor: colors,
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: chartType === 'pie' || chartType === 'doughnut'
        },
        title: {
          display: true,
          text: `${yCol} by ${xCol}`,
          font: { size: 16 }
        }
      },
      scales: chartType === 'pie' || chartType === 'doughnut' ? {} : {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

function updateChart() {
  if (chartTypeSelect.value !== 'auto') {
    createChart();
  } else {
    autoDetectChartType();
    createChart();
  }
}

function generateColors(count) {
  const baseColors = [
    '#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#06B6D4', '#EC4899', '#84CC16', '#F97316', '#6366F1'
  ];
  
  const colors = [];
  for (let i = 0; i < count; i++) {
    colors.push(baseColors[i % baseColors.length]);
  }
  return colors;
}

function exportChart() {
  const canvas = document.getElementById('main-chart');
  const link = document.createElement('a');
  link.download = `omnicept-chart-${Date.now()}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

function resetToUpload() {
  currentData = null;
  currentChart = null;
  fileName = '';
  fileInput.value = '';
  showSection('upload');
}

function showSection(section) {
  uploadSection.classList.remove('active');
  loadingSection.classList.remove('active');
  vizSection.classList.remove('active');

  switch(section) {
    case 'upload':
      uploadSection.classList.add('active');
      break;
    case 'loading':
      loadingSection.classList.add('active');
      break;
    case 'viz':
      vizSection.classList.add('active');
      break;
  }
}
