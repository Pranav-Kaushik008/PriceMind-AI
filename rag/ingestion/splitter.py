"""
rag/ingestion/splitter.py
-------------------------
Markdown-aware and recursive text splitter with metadata preservation.
"""

from typing import List
import re
from langchain_core.documents import Document


class KnowledgeSplitter:
    """
    Splits markdown documents into semantically coherent chunks,
    preserving section hierarchy, source references, and metadata.
    """

    def __init__(self, chunk_size: int = 500, chunk_overlap: int = 80):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def split_document(self, doc: Document) -> List[Document]:
        """Split a single Document into chunked Documents with enriched section metadata."""
        content = doc.page_content
        sections = self._split_by_headers(content)

        chunks: List[Document] = []
        for sec_title, sec_body in sections:
            if not sec_body.strip():
                continue

            sec_chunks = self._chunk_text(sec_body, self.chunk_size, self.chunk_overlap)
            for idx, chunk_text in enumerate(sec_chunks):
                chunk_meta = dict(doc.metadata)
                chunk_meta.update({
                    "section_title": sec_title,
                    "section_chunk_idx": idx,
                    "chunk_length": len(chunk_text),
                })
                chunks.append(Document(page_content=chunk_text.strip(), metadata=chunk_meta))

        # Assign global chunk index and ID
        for idx, c in enumerate(chunks):
            c.metadata["chunk_index"] = idx
            c.metadata["total_chunks"] = len(chunks)
            file_stem = Path_stem = re.sub(r"[^a-zA-Z0-9_-]", "_", c.metadata.get("file_name", "doc"))
            c.metadata["chunk_id"] = f"{file_stem}_{idx:03d}"

        return chunks

    def split_documents(self, documents: List[Document]) -> List[Document]:
        """Split a list of Documents."""
        all_chunks: List[Document] = []
        for doc in documents:
            chunks = self.split_document(doc)
            all_chunks.extend(chunks)
        return all_chunks

    def _split_by_headers(self, text: str) -> List[tuple[str, str]]:
        """Split markdown text into (header, content) tuples by #, ##, ### headers."""
        lines = text.splitlines()
        sections: List[tuple[str, str]] = []
        current_header = "Introduction"
        current_lines: List[str] = []

        header_pattern = re.compile(r"^(#{1,4})\s+(.+)$")

        for line in lines:
            match = header_pattern.match(line)
            if match:
                if current_lines:
                    sections.append((current_header, "\n".join(current_lines)))
                    current_lines = []
                current_header = match.group(2).strip()
            else:
                current_lines.append(line)

        if current_lines:
            sections.append((current_header, "\n".join(current_lines)))

        return sections

    def _chunk_text(self, text: str, max_size: int, overlap: int) -> List[str]:
        """Recursively chunk paragraphs and sentences when sections exceed max_size."""
        paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
        chunks: List[str] = []
        current_chunk: List[str] = []
        current_len = 0

        for p in paragraphs:
            p_len = len(p)
            if current_len + p_len + 2 <= max_size:
                current_chunk.append(p)
                current_len += p_len + 2
            else:
                if current_chunk:
                    chunks.append("\n\n".join(current_chunk))
                    # Retain last item for overlap if feasible
                    if overlap > 0 and len(current_chunk[-1]) <= overlap:
                        current_chunk = [current_chunk[-1], p]
                        current_len = sum(len(x) + 2 for x in current_chunk)
                    else:
                        current_chunk = [p]
                        current_len = p_len
                else:
                    # Paragraph itself is longer than max_size; split by lines or sentences
                    sub_parts = self._split_large_paragraph(p, max_size, overlap)
                    chunks.extend(sub_parts)
                    current_chunk = []
                    current_len = 0

        if current_chunk:
            chunks.append("\n\n".join(current_chunk))

        return chunks if chunks else [text]

    def _split_large_paragraph(self, text: str, max_size: int, overlap: int) -> List[str]:
        """Break down oversized paragraphs into windowed chunks."""
        parts: List[str] = []
        start = 0
        text_len = len(text)
        step = max_size - overlap

        while start < text_len:
            end = min(start + max_size, text_len)
            chunk = text[start:end].strip()
            if chunk:
                parts.append(chunk)
            if end >= text_len:
                break
            start += step

        return parts
