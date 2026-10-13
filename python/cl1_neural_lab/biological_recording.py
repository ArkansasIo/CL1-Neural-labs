"""Read-only importer for CL API HDF5 recordings; never dispatches stimulation."""
from __future__ import annotations
from pathlib import Path
from typing import Any

class RecordingImportError(RuntimeError): pass

def inspect_cl_recording(path: str | Path) -> dict[str, Any]:
    """Inspect a CL API HDF5 file using the official SDK when installed.

    A file's existence does not prove it came from a living culture. The caller must
    preserve source metadata and verify provenance before labelling it biological.
    """
    p=Path(path).expanduser().resolve()
    if not p.is_file(): raise FileNotFoundError(p)
    try:
        from cl import RecordingView  # type: ignore
    except ImportError as exc:
        raise RecordingImportError("Install the official CL SDK/Simulator in the research environment to read CL recordings.") from exc
    with RecordingView(str(p)) as rec:
        attrs={str(k):_json_safe(v) for k,v in dict(rec.attributes).items()}
        spikes=[]
        if rec.spikes is not None:
            for row in rec.spikes:
                spikes.append({"timestamp":int(row["timestamp"]),"channel":int(row["channel"])})
        stims=[]
        if rec.stims is not None:
            for row in rec.stims:
                stims.append({"timestamp":int(row["timestamp"]),"channel":int(row["channel"])})
        sample_shape=list(rec.samples.shape) if rec.samples is not None else None
        return {
          "file_name":p.name,"file_path":str(p),"format":"CL_API_HDF5",
          "source_kind":"unverified_recording_file",
          "provenance_note":"Verify source device, cell batch, and simulator/physical origin from recording metadata and lab records.",
          "attributes":attrs,"sample_shape":sample_shape,
          "spike_count":len(spikes),"stim_count":len(stims),
          "spikes":spikes,"stims":stims
        }

def _json_safe(value: Any)->Any:
    if hasattr(value,"item"):
        try:return value.item()
        except Exception:pass
    if isinstance(value,bytes):return value.decode("utf-8",errors="replace")
    if isinstance(value,(str,int,float,bool)) or value is None:return value
    if isinstance(value,dict):return {str(k):_json_safe(v) for k,v in value.items()}
    if isinstance(value,(list,tuple)):return [_json_safe(v) for v in value]
    return str(value)
