# Gi## Current Submodules

### 1. `agents/` - Polymarket Agents
- **Repository:** https://github.com/Polymarket/agents.git
- **Purpose:** AI agents and trading strategies for Polymarket
- **Documentation:** See `agents/README.md`

### 2. `polymarket-examples/` - Polymarket Examples
- **Repository:** https://github.com/Polymarket/examples.git
- **Purpose:** Example implementations and integration patterns
- **Documentation:** See `polymarket-examples/README.md`

### 3. `polymarket-realtime/` - Real-Time Data Client
- **Repository:** https://github.com/Polymarket/real-time-data-client.git
- **Purpose:** WebSocket client for real-time market data streaming
- **Documentation:** See `polymarket-realtime/README.md`

### 4. `polymarket-ctf-exchange/` - CTF Exchange Contracts
- **Repository:** https://github.com/Polymarket/ctf-exchange.git
- **Purpose:** Conditional Token Framework exchange smart contracts
- **Documentation:** See `polymarket-ctf-exchange/README.md`

### 5. `polymarket-neg-risk-adapter/` - Neg Risk CTF Adapter
- **Repository:** https://github.com/Polymarket/neg-risk-ctf-adapter.git
- **Purpose:** Adapter for negative risk conditional tokens
- **Documentation:** See `polymarket-neg-risk-adapter/README.md`

### 6. `polymarket-uma-adapter/` - UMA CTF Adapter
- **Repository:** https://github.com/Polymarket/uma-ctf-adapter.git
- **Purpose:** UMA oracle integration for conditional tokens
- **Documentation:** See `polymarket-uma-adapter/README.md`odules in This Project

This project uses Git submodules to include external repositories.

## Current Submodules

### 1. `agents/` - Polymarket Agents
- **Repository:** https://github.com/Polymarket/agents.git
- **Purpose:** Polymarket prediction market agents and strategies
- **Documentation:** See `agents/README.md`

### 2. `polymarket-examples/` - Polymarket Examples
- **Repository:** https://github.com/Polymarket/examples.git
- **Purpose:** Example implementations and use cases for Polymarket integration
- **Documentation:** See `polymarket-examples/README.md`

### 3. `polymarket-realtime/` - Polymarket Real-Time Data Client
- **Repository:** https://github.com/Polymarket/real-time-data-client.git
- **Purpose:** Real-time market data streaming and WebSocket client
- **Documentation:** See `polymarket-realtime/README.md`

## Working with Submodules

### Initial Clone
When cloning this repository for the first time, initialize submodules:

```bash
git clone <this-repo-url>
cd immortal-bnb-1
git submodule init
git submodule update
```

Or clone with submodules in one command:
```bash
git clone --recurse-submodules <this-repo-url>
```

### Updating Submodules
To update a submodule to the latest version:

```bash
# Update specific submodule
cd agents
git pull origin main
cd ..
git add agents
git commit -m "Update agents submodule"

# Or update all submodules at once
git submodule update --remote
```

### Adding New Submodules
To add a new submodule:

```bash
git submodule add <repository-url> <directory-name>
git commit -m "Add <name> submodule"
```

### Removing a Submodule
To remove a submodule:

```bash
# Remove from .gitmodules and .git/config
git submodule deinit -f <directory-name>

# Remove from working tree
git rm -f <directory-name>

# Commit the change
git commit -m "Remove <name> submodule"
```

## Common Issues

### Submodule shows as modified but no changes
This usually means the submodule is on a different commit:
```bash
cd <submodule-dir>
git checkout main
git pull
cd ..
git add <submodule-dir>
git commit -m "Update submodule to latest"
```

### Submodule directory is empty
Initialize and update:
```bash
git submodule init
git submodule update
```

## Best Practices

1. **Always commit submodule updates** - When you update a submodule, commit the change in the parent repo
2. **Document submodule purpose** - Keep this file updated with why each submodule is included
3. **Pin to specific commits** - Submodules reference specific commits, not branches
4. **Test after updates** - Always test your project after updating submodules

## Troubleshooting

### Error: "fatal: 'xxx' already exists in the index"
```bash
git rm -rf --cached <directory>
git submodule add <url> <directory>
```

### Submodule not showing latest changes
```bash
cd <submodule>
git fetch
git checkout <branch-or-commit>
cd ..
git add <submodule>
git commit -m "Update submodule"
```

## More Information

- [Git Submodules Documentation](https://git-scm.com/book/en/v2/Git-Tools-Submodules)
- [GitHub Submodules Guide](https://github.blog/2016-02-01-working-with-submodules/)
