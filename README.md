# Omnicept

> **Data visualization for everyone.**

Transform any dataset into clear, actionable insights — no coding required.

![Omnicept Logo](assets/logo.svg)

---

## What is Omnicept?

Omnicept is a data visualization tool designed for real people, not just data scientists. Upload a CSV, Excel file, or JSON dataset, and instantly see your data transformed into beautiful, understandable charts and graphs.

**Perfect for:**
- Supply chain analysts tracking shipments and inventory
- Business owners reviewing sales performance
- Researchers visualizing study results
- Anyone who has data and needs answers

---

## Features

### Instant Visualization
Upload your data. Get charts. That's it.

### Smart Detection
Omnicept automatically detects:
- Time series data → Line charts
- Categories → Bar charts, pie charts
- Geographical data → Maps
- Relationships → Network graphs

### Export Ready
Download charts as PNG, SVG, or PDF for reports and presentations.

### No Technical Knowledge Needed
Clean interface. No coding. No complicated settings.

---

## Getting Started

### Prerequisites
- Node.js 18 or higher

### Installation

```bash
# Clone the repository
git clone https://github.com/AtlasConstruct/omnicept.git

# Navigate to the project
cd omnicept

# Install dependencies
npm install

# Start the server
npm start
```

Open your browser to `http://localhost:3000` and start visualizing.

---

## Supported Data Formats

| Format | Extension | Notes |
|--------|-----------|-------|
| CSV | `.csv` | Comma-separated values |
| JSON | `.json` | JavaScript Object Notation |
| Excel | `.xlsx` | Microsoft Excel spreadsheets |

---

## Roadmap

- [ ] Multiple dataset comparison
- [ ] Custom chart styling
- [ ] Dashboard templates
- [ ] Real-time data streaming
- [ ] Collaborative sharing

---

## Tech Stack

- **Backend:** Node.js, Express
- **Frontend:** Vanilla JavaScript, Chart.js
- **Parsing:** PapaParse (CSV), SheetJS (Excel)

---

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for guidelines.

---

## License

MIT License — use it however you'd like.

---

*Built with clarity in mind.*
