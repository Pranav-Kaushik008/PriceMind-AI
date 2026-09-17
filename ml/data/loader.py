"""
PriceMind AI — Data Foundation
Data Loading Interface using pathlib with format auto-detection.
"""

from pathlib import Path
from typing import Optional, Union, Dict, Any, List
import pandas as pd
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


class DataLoader:
    """
    Robust, path-independent data loader supporting CSV, Parquet, and JSON.
    Auto-detects datetime columns and handles missing files gracefully.
    """

    SUPPORTED_EXTENSIONS = {".csv", ".parquet", ".json", ".jsonl"}

    def __init__(self, data_dir: Optional[Union[str, Path]] = None):
        if data_dir:
            self.data_dir = Path(data_dir)
        else:
            # Default to project root / data / raw
            self.data_dir = Path(__file__).resolve().parents[2] / "data" / "raw"

    def load_file(
        self,
        file_path: Union[str, Path],
        parse_dates: Optional[List[str]] = None,
        **kwargs
    ) -> pd.DataFrame:
        """
        Load a single dataset file with format detection.
        """
        path = Path(file_path)
        if not path.is_absolute():
            path = self.data_dir / path

        if not path.exists():
            raise FileNotFoundError(f"Dataset file not found at: {path}")

        ext = path.suffix.lower()
        if ext not in self.SUPPORTED_EXTENSIONS:
            raise ValueError(f"Unsupported file format '{ext}'. Supported: {self.SUPPORTED_EXTENSIONS}")

        logger.info(f"Loading raw dataset from {path}")

        try:
            if ext == ".csv":
                df = pd.read_csv(path, parse_dates=parse_dates, **kwargs)
            elif ext == ".parquet":
                df = pd.read_parquet(path, **kwargs)
            elif ext in {".json", ".jsonl"}:
                lines = ext == ".jsonl"
                df = pd.read_json(path, lines=lines, **kwargs)
            else:
                raise ValueError(f"Unhandled extension {ext}")

            logger.info(f"Successfully loaded {len(df):,} rows and {len(df.columns)} columns.")
            return df

        except Exception as e:
            logger.error(f"Failed to load dataset from {path}: {str(e)}")
            raise

    def load_raw_dataset(self, filename: Optional[str] = None) -> pd.DataFrame:
        """
        Finds and loads the primary raw dataset in data/raw.
        If filename is not specified, loads the first supported file found.
        """
        if filename:
            target_path = self.data_dir / filename
            return self.load_file(target_path)

        # Scan directory for supported files
        files = [p for p in self.data_dir.iterdir() if p.is_file() and p.suffix.lower() in self.SUPPORTED_EXTENSIONS]
        if not files:
            raise FileNotFoundError(
                f"No raw datasets found in '{self.data_dir}'. "
                f"Please place your transaction CSV/Parquet file into data/raw/."
            )

        # Load first available file
        primary_file = files[0]
        logger.info(f"Auto-selected raw dataset: {primary_file.name}")
        return self.load_file(primary_file)
