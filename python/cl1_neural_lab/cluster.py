"""Scalable parallel virtual CL1-style device cluster."""
from __future__ import annotations
from dataclasses import dataclass
from .virtual_hardware import VirtualCL1Hardware, VirtualHardwareProfile

SUPPORTED_SIZES=(1,2,4,8,16,32,64,128)

@dataclass
class DeviceBox:
    slot:int
    device_id:str
    hardware:VirtualCL1Hardware
    online:bool=True

class VirtualCL1Cluster:
    def __init__(self,count:int=8):
        if count not in SUPPORTED_SIZES:
            raise ValueError(f"Cluster size must be one of {SUPPORTED_SIZES}")
        self.devices=[DeviceBox(i,f"CL1-VIRTUAL-{i+1:03d}",VirtualCL1Hardware(
            VirtualHardwareProfile(profile_id=f"CL1-VIRTUAL-{i+1:03d}")),True) for i in range(count)]

    def connect_all(self):
        for d in self.devices:
            if d.online: d.hardware.connect()

    def disconnect_all(self):
        for d in self.devices: d.hardware.disconnect()

    def pause_device(self,slot:int):
        self.devices[slot].online=False
        self.devices[slot].hardware.disconnect()

    def resume_device(self,slot:int):
        self.devices[slot].online=True
        self.devices[slot].hardware.connect()

    def broadcast_recording(self,label:str):
        return [d.hardware.start_recording(f"{label}-{d.slot+1:03d}") for d in self.devices if d.online]

    def status(self):
        return [{"slot":d.slot+1,"device_id":d.device_id,"online":d.online,
                 "connected":d.hardware.state.connected,
                 "recording":d.hardware.state.recording,
                 "mode":d.hardware.state.mode.value,
                 "estop":d.hardware.state.emergency_stop_latched}
                for d in self.devices]

    def topology(self):
        return {"cluster_size":len(self.devices),"supported_sizes":SUPPORTED_SIZES,
                "devices":[{"slot":d.slot+1,"device_id":d.device_id,"channels":d.hardware.profile.channel_count}
                           for d in self.devices]}