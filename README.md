# Meysam's CapRover One-Click Apps

A maintained CapRover One-Click catalog for the infrastructure and self-hosted apps used across my servers. App defaults are pinned to current stable/LTS releases where that is the safer production choice; SearXNG intentionally follows its rolling stable image.

## Add this repository to CapRover

In **Apps → One-Click Apps/Databases → 3rd party repositories**, add:

`https://themeysam.github.io/llm-one-click-apps-for-caprover`

## Catalog

| App | Default |
| --- | --- |
| AnythingLLM | v1.17.0 |
| Dozzle | v11.3.0 |
| MariaDB | 12.3.3 |
| Milvus (External S3) | v2.6.25 + etcd v3.5.25 |
| MinIO | RELEASE.2025-10-15T17-29-55Z |
| MongoDB | 8.3.13 |
| MySQL | 8.4.12 LTS |
| n8n | 2.42.3 + PostgreSQL 18.6 |
| ntfy | v2.28.0 |
| Ollama | 0.35.1 |
| Open WebUI + Ollama | v0.11.4 + Ollama 0.35.1 |
| Parse | Server 9.10.3 + Dashboard 9.2.0 + MongoDB 8.0 |
| Portainer | 2.45.1 |
| PostgreSQL | 18.6 |
| SearXNG | rolling stable |
| SiYuan | v3.8.5 |
| SnappyMail | v2.38.2 |
| Stalwart Mail Server | v0.16.25 |
| Vikunja | 2.7.0 + PostgreSQL 18.6 |
| Weaviate | 1.39.10 |
| WordPress | 7.1.3 + MySQL 8.4.12 |

All catalog logos are PNG assets synced from the upstream project or the official CapRover catalog. The generated homepage renders them with preserved aspect ratios.

## Development

```bash
npm install -g pnpm@8
pnpm install
pnpm run validate
pnpm run format
pnpm run build
```

GitHub Actions validates YAML metadata, required PNG logos, formatting, and the generated catalog before publishing to GitHub Pages.
