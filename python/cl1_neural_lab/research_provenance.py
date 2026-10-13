"""Explicit provenance labels for CL1 Neural Labs research data.

This module records where data came from; it does not validate biological
truth, device identity, or hardware permissions.
"""
from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from enum import StrEnum
from typing import Any


class DataSourceStage(StrEnum):
    SYNTHETIC_MODEL = "synthetic_model"
    DATASET_REPLAY = "dataset_replay"
    SDK_SIMULATOR = "sdk_simulator"
    PHYSICAL_CL1 = "physical_cl1"


@dataclass(frozen=True, slots=True)
class ProvenanceRecord:
    stage: DataSourceStage
    dataset_id: str
    created_at_utc: str
    software_version: str
    notes: str = ""

    @classmethod
    def create(
        cls,
        stage: DataSourceStage,
        dataset_id: str,
        software_version: str,
        notes: str = "",
    ) -> "ProvenanceRecord":
        if not dataset_id.strip():
            raise ValueError("dataset_id must not be empty")
        if not software_version.strip():
            raise ValueError("software_version must not be empty")
        return cls(
            stage=stage,
            dataset_id=dataset_id.strip(),
            created_at_utc=datetime.now(timezone.utc).isoformat(),
            software_version=software_version.strip(),
            notes=notes.strip(),
        )

    def to_dict(self) -> dict[str, Any]:
        value = asdict(self)
        value["stage"] = self.stage.value
        return value


def require_physical_read_only(record: ProvenanceRecord) -> None:
    """Guard downstream workflows that must not mislabel simulated data.

    This is a provenance assertion only. It is not a hardware-access gate.
    """
    if record.stage is not DataSourceStage.PHYSICAL_CL1:
        raise ValueError(
            "This workflow requires provenance explicitly labelled physical_cl1; "
            f"received {record.stage.value!r}."
        )
