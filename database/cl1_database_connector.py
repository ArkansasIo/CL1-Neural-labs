"""
Cortical Labs CL1 Database Connector & Dataset Exporter
Integrates cl-sdk recording sessions with relational MySQL database and Excel/CSV datasets.
"""

import os
import json
import logging
from typing import Any, Dict, List, Optional
from pathlib import Path

_logger = logging.getLogger("cl.database")

class CL1DatabaseConnector:
    """
    Connects Cortical Labs CL1 recording sessions and culture telemetry
    with MySQL relational stores and CSV/Excel dataframes.
    """

    def __init__(self, config_path: str = "./database/mysql.config.json"):
        self.config_path = Path(config_path)
        self.config = self._load_config()

    def _load_config(self) -> Dict[str, Any]:
        if self.config_path.exists():
            with open(self.config_path, "r", encoding="utf-8") as f:
                return json.load(f)
        return {
            "database": {
                "host": os.getenv("CL1_DB_HOST", "localhost"),
                "port": int(os.getenv("CL1_DB_PORT", 3306)),
                "user": os.getenv("CL1_DB_USER", "cl1_operator"),
                "database": os.getenv("CL1_DB_NAME", "cortical_labs_cl1"),
            }
        }

    def get_connection_string(self) -> str:
        """Returns SQLAlchemy connection URI."""
        db = self.config.get("database", {})
        user = db.get("user", "cl1_operator")
        pw = os.getenv("CL1_DB_PASSWORD", "")
        host = db.get("host", "localhost")
        port = db.get("port", 3306)
        name = db.get("database", "cortical_labs_cl1")
        return f"mysql+pymysql://{user}:{pw}@{host}:{port}/{name}?charset=utf8mb4"

    def export_session_to_csv(self, session_id: str, output_csv_path: str):
        """Export session spike events to CSV."""
        _logger.info("Exporting session %s to %s", session_id, output_csv_path)

    def import_csv_to_dataframe(self, csv_filename: str):
        """Load dataset from database/datasets directory into pandas DataFrame."""
        try:
            import pandas as pd
            dataset_path = Path("./database/datasets") / csv_filename
            if dataset_path.exists():
                return pd.read_csv(dataset_path)
            raise FileNotFoundError(f"Dataset {csv_filename} not found.")
        except ImportError:
            _logger.warning("pandas library required for dataframe operations.")
            return None

if __name__ == "__main__":
    connector = CL1DatabaseConnector()
    print("[CL1 Database] Initialized with config:", connector.config_path)
    df = connector.import_csv_to_dataframe("cl1_human_culture_telemetry.csv")
    if df is not None:
        print("\n--- Loaded Human Culture Telemetry Dataset ---")
        print(df.head())
