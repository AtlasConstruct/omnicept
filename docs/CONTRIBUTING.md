# Contributing to Omnicept

Thank you for your interest in contributing to Omnicept! This document provides guidelines and instructions for contributing.

## Code of Conduct

Be respectful, inclusive, and constructive. We're all here to make data visualization accessible to everyone.

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/AtlasConstruct/omnicept/issues)
2. If not, create a new issue with:
   - Clear, descriptive title
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Screenshots (if applicable)
   - Browser/OS information

### Suggesting Features

1. Check existing issues for similar suggestions
2. Create a new issue with:
   - Clear description of the feature
   - Use case (who benefits and how)
   - Possible implementation approach (optional)

### Submitting Changes

1. Fork the repository
2. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Make your changes
4. Test thoroughly
5. Commit with clear messages:
   ```bash
   git commit -m "Add: description of your change"
   ```
6. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
7. Open a Pull Request

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR-USERNAME/omnicept.git

# Install dependencies
npm install

# Start development server
npm start
```

## Code Style

- Use clear, descriptive variable names
- Add comments for complex logic
- Follow existing code patterns
- Keep functions focused and small

## Security

**NEVER commit:**
- API keys
- Passwords
- Tokens
- `.env` files
- Any credentials

If you accidentally commit sensitive information, contact maintainers immediately.

## Questions?

Open an issue with the "question" label or reach out via GitHub Discussions.

---

Thank you for helping make data visualization accessible to everyone!
