# 📚 Documentation Structure

This folder contains all project documentation organized for easy navigation.

## 📂 Main Documents

### [SETUP.md](./SETUP.md) - Complete Setup Guide ⭐
**Start here!** Complete guide covering:
- Installation & environment setup
- Database schema (tables, indexes, foreign keys)
- RLS policies (security rules)
- Migration scripts
- Troubleshooting & best practices
- Full changelog

### [API.md](./API.md) - Supabase API Reference
- REST API endpoints
- Authentication flows
- Query examples
- Real-time subscriptions

### [TECHNICAL.md](./TECHNICAL.md) - Technical Architecture
- System architecture overview
- Local-first sync strategy
- Conflict resolution
- PWA implementation details
- Dexie.js schema

### [CHANGELOG.md](./CHANGELOG.md) - Version History
Detailed version-by-version changes with:
- New features
- Breaking changes
- Bug fixes
- Migration notes

### [MIGRATION_v1.7_HIERARCHICAL_CATEGORIES.sql](./MIGRATION_v1.7_HIERARCHICAL_CATEGORIES.sql)
SQL migration script for upgrading from v1.6.0 to v1.7.0 (hierarchical categories support)

## 📦 Archive

The `/archive/` folder contains historical documentation from previous versions:
- Version-specific release notes (v1.1, v1.2, v1.3, v1.4)
- Implementation guides (features, signup, language system)
- Deprecated quick start guides

**Note**: Archive files are kept for historical reference but are superseded by the main SETUP.md guide.

## 🚀 Quick Start

1. **New users**: Read [SETUP.md](./SETUP.md) from start to finish
2. **Upgrading**: Check [CHANGELOG.md](./CHANGELOG.md) for migration notes
3. **API integration**: See [API.md](./API.md)
4. **Architecture deep-dive**: Read [TECHNICAL.md](./TECHNICAL.md)

## 📝 Documentation Philosophy

- **Single source of truth**: SETUP.md is the authoritative guide (no patches!)
- **Version-complete**: Each version update consolidates all changes into main docs
- **Clear migration paths**: Upgrade scripts with examples
- **No duplication**: Old version docs archived, not deleted

---

**Last updated**: v1.7.0 (October 21, 2025)
