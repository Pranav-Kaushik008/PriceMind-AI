"""RAG Knowledge Engine for enterprise pricing guidelines, MAP policies, and contracts."""
from typing import List, Dict, Any

class PricingKnowledgeRAG:
    def __init__(self):
        self.knowledge_documents = [
            {
                "title": "Hardware Category Minimum Advertised Price (MAP) Policy",
                "content": "Hardware products may not be discounted more than 15% below MSRP without prior VP Commercial approval.",
                "category": "Policy",
            },
            {
                "title": "Enterprise B2B Volume Rebate Tiers",
                "content": "Tier 1: 0-50 units (List Price), Tier 2: 51-200 units (-4.5% rebate), Tier 3: 200+ units (-8.0% contract rate).",
                "category": "Contracts",
            },
            {
                "title": "Inventory Obsolescence & Clearance Guardrail",
                "content": "SKUs with >60 days inventory on hand are pre-authorized for algorithmic markdown clearance up to -12% price adjustment.",
                "category": "Inventory",
            },
        ]

    def query_policy(self, query: str) -> List[Dict[str, Any]]:
        """Retrieve relevant pricing policies based on natural language query keywords."""
        q = query.lower()
        results = []
        for doc in self.knowledge_documents:
            if any(term in doc["content"].lower() or term in doc["title"].lower() for term in q.split()):
                results.append(doc)
        return results if results else [self.knowledge_documents[0]]

rag_engine = PricingKnowledgeRAG()
