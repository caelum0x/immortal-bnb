# Contributing to Immortal AI Trading Bot

Thank you for your interest in contributing to the Immortal AI Trading Bot! This document provides guidelines and instructions for contributing to the project.

## 🌟 Ways to Contribute

- **Bug Reports**: Report bugs through GitHub Issues
- **Feature Requests**: Suggest new features or enhancements
- **Code Contributions**: Submit pull requests with bug fixes or new features
- **Documentation**: Improve documentation, guides, and examples
- **Testing**: Write tests and improve test coverage
- **Security**: Report security vulnerabilities responsibly

## 📋 Getting Started

### 1. Fork and Clone

```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/YOUR_USERNAME/immortal-bnb.git
cd immortal-bnb

# Add upstream remote
git remote add upstream https://github.com/caelum0x/immortal-bnb.git
```

### 2. Set Up Development Environment

```bash
# Run setup script
bash scripts/setup.sh

# Or manually install dependencies
bun install
cd apps/frontend && bun install && cd ../..

# Copy environment file
cp .env.example .env
# Edit .env with your credentials
```

### 3. Create a Branch

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Or a bugfix branch
git checkout -b fix/bug-description
```

## 🔧 Development Workflow

### Running the Project

```bash
# Terminal 1: Backend
bun run dev

# Terminal 2: Frontend
cd apps/frontend
bun run dev
```

### Code Style

We follow these conventions:

**TypeScript:**
- Use TypeScript for all new code
- Enable strict mode
- Provide type annotations for function parameters and return values
- Use interfaces over types when possible

**Naming Conventions:**
- **Files**: `camelCase.ts` for modules, `PascalCase.tsx` for React components
- **Variables**: `camelCase` for variables and functions
- **Constants**: `UPPER_SNAKE_CASE` for constants
- **Interfaces**: `PascalCase` with descriptive names
- **Components**: `PascalCase` for React components

**Code Organization:**
```typescript
// ✅ Good
interface UserConfig {
  tokens: string[];
  riskLevel: number;
}

export async function startBot(config: UserConfig): Promise<void> {
  // Implementation
}

// ❌ Avoid
async function start(c: any) {
  // Implementation
}
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
# Good commit messages
feat(api): add rate limiting to bot control endpoints
fix(trading): resolve slippage calculation error
docs(readme): update Docker deployment instructions
test(integration): add tests for bot lifecycle

# Bad commit messages
update stuff
fix bug
changes
```

### Testing

```bash
# Run all tests
bun test

# Run specific test file
bun test src/agent/aiDecision.test.ts

# Run integration tests
bun test src/__tests__/integration/

# Check test coverage
bun test --coverage
```

**Writing Tests:**
```typescript
import { describe, test, expect } from 'bun:test';

describe('Feature Name', () => {
  test('should do something specific', () => {
    // Arrange
    const input = { /* test data */ };

    // Act
    const result = functionToTest(input);

    // Assert
    expect(result).toBe(expected);
  });
});
```

### Linting

```bash
# Run ESLint
bun run lint

# Fix auto-fixable issues
npx eslint src/**/*.ts --fix
```

## 🐛 Reporting Bugs

### Before Submitting

1. **Search existing issues** to avoid duplicates
2. **Update to latest version** and check if bug still exists
3. **Test on testnet** to verify it's not a network issue
4. **Collect logs** from `logs/error.log`

### Bug Report Template

Use the bug report template when creating an issue:

**Title**: Clear, descriptive title

**Description:**
```markdown
## Bug Description
Clear description of the bug

## Steps to Reproduce
1. Step one
2. Step two
3. Step three

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: [e.g., Ubuntu 22.04]
- Node/Bun version: [e.g., Bun 1.0.0]
- Network: [testnet/mainnet]
- Bot version: [e.g., 1.0.0]

## Logs
```
Relevant error logs here
```

## Screenshots
If applicable
```

## 💡 Feature Requests

### Before Requesting

1. **Check existing issues** and discussions
2. **Consider the scope** - does it fit the project goals?
3. **Think about implementation** - is it technically feasible?

### Feature Request Template

```markdown
## Feature Description
Clear description of the feature

## Problem it Solves
What problem does this solve for users?

## Proposed Solution
How should this be implemented?

## Alternatives Considered
What other approaches did you consider?

## Additional Context
Any other relevant information
```

## 🔀 Pull Request Process

### Before Submitting PR

- [ ] Code follows project style guidelines
- [ ] All tests pass (`bun test`)
- [ ] New tests added for new features
- [ ] Documentation updated (if applicable)
- [ ] Commit messages follow conventions
- [ ] Branch is up to date with main
- [ ] PR description is complete

### PR Title Format

```
<type>(<scope>): <description>

Examples:
feat(api): add webhook support for trade notifications
fix(trading): correct stop-loss calculation
docs(deployment): add Azure deployment guide
```

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change fixing an issue)
- [ ] New feature (non-breaking change adding functionality)
- [ ] Breaking change (fix or feature causing existing functionality to break)
- [ ] Documentation update

## Related Issues
Fixes #(issue number)

## Testing
Describe testing done:
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed
- [ ] Tested on testnet
- [ ] Tested on mainnet (if applicable)

## Screenshots
If applicable, add screenshots

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests pass locally
- [ ] Dependent changes merged
```

### Review Process

1. **Automated checks** run via GitHub Actions
2. **Code review** by maintainers
3. **Revisions** if requested
4. **Approval** by at least one maintainer
5. **Merge** to main branch

### After PR Merge

1. Delete your feature branch
2. Pull latest changes from upstream
3. Update your fork

```bash
git checkout main
git pull upstream main
git push origin main
```

## 🔐 Security

### Reporting Security Vulnerabilities

**DO NOT** create public issues for security vulnerabilities.

Instead:
1. Email security details to: security@immortalbot.io
2. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will:
- Acknowledge within 48 hours
- Provide timeline for fix
- Credit you in release notes (if desired)

### Security Best Practices

When contributing:
- Never commit API keys, private keys, or secrets
- Use environment variables for sensitive data
- Validate all user inputs
- Follow principle of least privilege
- Keep dependencies updated

## 📝 Documentation

### Types of Documentation

- **Code Comments**: Explain complex logic
- **README**: Project overview and quick start
- **API Documentation**: OpenAPI/Swagger specs
- **Guides**: Deployment, testing, contribution guides
- **Examples**: Sample configurations and use cases

### Writing Documentation

**Good documentation:**
- Clear and concise
- Includes examples
- Updated with code changes
- Accessible to beginners
- Technically accurate

**Example:**
```typescript
/**
 * Calculates the optimal trade amount based on risk level and account balance
 *
 * @param balance - Current BNB balance in the wallet
 * @param riskLevel - Risk level from 1 (conservative) to 10 (aggressive)
 * @returns Trade amount in BNB
 *
 * @example
 * const amount = calculateTradeAmount(5.0, 7);
 * // Returns: 0.35 (7% of 5 BNB)
 */
export function calculateTradeAmount(balance: number, riskLevel: number): number {
  // Implementation
}
```

## 🏗️ Project Structure

Understanding the codebase:

```
immortal-bnb/
├── src/
│   ├── agent/           # AI decision engine
│   ├── blockchain/      # Blockchain interactions
│   ├── data/            # Market data fetching
│   ├── middleware/      # API middleware (auth, validation, rate limiting)
│   ├── utils/           # Utility functions
│   ├── alerts/          # Telegram notifications
│   ├── api-server.ts    # Express API server
│   ├── bot-state.ts     # Bot state management
│   ├── config.ts        # Configuration
│   └── index.ts         # Main entry point
├── apps/frontend/       # Next.js dashboard
├── contracts/           # Solidity smart contracts
├── scripts/             # Deployment and utility scripts
└── __tests__/           # Test files
```

## 🎯 Areas for Contribution

We especially welcome contributions in:

### High Priority
- **Testing**: Increase test coverage
- **Documentation**: Improve guides and examples
- **Bug Fixes**: Fix reported issues
- **Performance**: Optimize trading algorithms
- **Security**: Enhance security measures

### Medium Priority
- **Features**: New trading strategies
- **UI/UX**: Frontend improvements
- **Integrations**: Additional DEX support
- **Monitoring**: Enhanced metrics and dashboards

### Nice to Have
- **Translations**: Multi-language support
- **Examples**: Sample configurations
- **Tutorials**: Video guides and tutorials
- **Community**: Discord bot, forum moderation

## 💬 Communication

### Where to Get Help

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: Questions and general discussion
- **Discord**: Real-time chat (if available)
- **Twitter**: Updates and announcements

### Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Provide constructive feedback
- Focus on technical merit
- No harassment or discrimination

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Recognition

Contributors are recognized in:
- Release notes
- README contributors section
- Project documentation

Thank you for contributing to make Immortal AI Trading Bot better! 🚀
