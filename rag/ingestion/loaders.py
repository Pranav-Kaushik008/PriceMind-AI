"""
rag/ingestion/loaders.py
------------------------
Markdown document loader with frontmatter & hierarchy parsing for PriceMind AI.
"""

from pathlib import Path
from typing import List, Dict, Any
import re
from langchain_core.documents import Document


class MarkdownKnowledgeLoader:
    """Loads Markdown files with YAML frontmatter from a directory tree."""

    def __init__(self, directory_path: str | Path):
        self.directory_path = Path(directory_path)

    @staticmethod
    def parse_frontmatter(content: str) -> tuple[Dict[str, Any], str]:
        """Extract YAML-like frontmatter between triple dashes --- and body text."""
        metadata = {}
        body = content

        fm_pattern = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.DOTALL)
        match = fm_pattern.match(content)

        if match:
            fm_text = match.group(1)
            body = content[match.end():]
            for line in fm_text.splitlines():
                line = line.strip()
                if not line or line.startswith("#") or ":" not in line:
                    continue
                key, val = line.split(":", 1)
                metadata[key.strip()] = val.strip()

        return metadata, body

    def load(self) -> List[Document]:
        """Load all markdown documents in the knowledge directory."""
        if not self.directory_path.exists():
            return []

        documents: List[Document] = []
        md_files = sorted(self.directory_path.glob("**/*.md"))

        for file_path in md_files:
            try:
                raw_text = file_path.read_text(encoding="utf-8")
                frontmatter, body = self.parse_frontmatter(raw_text)

                # Determine document category from path or frontmatter
                rel_path = file_path.relative_to(self.directory_path)
                category = frontmatter.get(
                    "category",
                    rel_path.parent.name if rel_path.parent.name else "general"
                )

                # Determine title from frontmatter or first # header
                title = frontmatter.get("title")
                if not title:
                    header_match = re.search(r"^#\s+(.+)$", body, re.MULTILINE)
                    title = header_match.group(1).strip() if header_match else file_path.stem.replace("_", " ").title()

                doc_metadata = {
                    "source": str(file_path),
                    "relative_path": str(rel_path).replace("\\", "/"),
                    "file_name": file_path.name,
                    "title": title,
                    "category": category.lower(),
                    "document_type": frontmatter.get("document_type", "documentation"),
                    "version": frontmatter.get("version", "1.0.0"),
                    "last_updated": frontmatter.get("last_updated", "2026-03-15"),
                }

                doc = Document(
                    page_content=body.strip(),
                    metadata=doc_metadata,
                )
                documents.append(doc)

            except Exception as e:
                print(f"[RAG Loader] Warning: Failed to read {file_path}: {e}")

        return documents
