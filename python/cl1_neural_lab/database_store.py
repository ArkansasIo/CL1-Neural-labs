"""Small in-memory SQLite store used by the Python simulator and tests."""
from __future__ import annotations
import sqlite3

class CL1DatabaseStore:
    """In-memory research store; does not connect to an external database."""
    def __init__(self, connection: sqlite3.Connection | None = None):
        self.connection = connection or sqlite3.connect(":memory:")
        self.connection.row_factory = sqlite3.Row
        self._initialize()

    def _initialize(self) -> None:
        self.connection.executescript("""
            CREATE TABLE IF NOT EXISTS cultures (
                id INTEGER PRIMARY KEY, label TEXT NOT NULL, source_kind TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS electrodes (
                channel INTEGER PRIMARY KEY, row_index INTEGER NOT NULL,
                column_index INTEGER NOT NULL, role TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS recordings (
                id INTEGER PRIMARY KEY, culture_id INTEGER, label TEXT NOT NULL
            );
        """)
        for channel in range(64):
            role = "ground" if channel in (0, 7, 56, 63) else "reference" if channel == 4 else "recording"
            self.connection.execute(
                "INSERT OR IGNORE INTO electrodes(channel,row_index,column_index,role) VALUES(?,?,?,?)",
                (channel, channel // 8, channel % 8, role),
            )
        self.connection.commit()

    def get_table_names(self) -> list[str]:
        rows = self.connection.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
        ).fetchall()
        return [row["name"] for row in rows]

    def get_table_data(self, table_name: str) -> list[dict[str, object]]:
        if table_name not in self.get_table_names():
            raise ValueError(f"Unknown table: {table_name}")
        # Table names are checked against sqlite_master before interpolation.
        rows = self.connection.execute(f'SELECT * FROM "{table_name}"').fetchall()
        return [dict(row) for row in rows]

    def close(self) -> None:
        self.connection.close()
