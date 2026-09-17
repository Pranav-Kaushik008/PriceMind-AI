# PriceMind AI Data Lake Organization

This directory stores transaction logs, catalog records, and competitor scraping feeds.

```text
data/
├── raw/         # Unmodified raw ERP transaction streams & POS feeds
├── processed/   # Feature-engineered Parquet files & training sets
└── external/    # Daily competitor web-scraping price telemetry & inflation indices
```
