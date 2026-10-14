"""Regression tests for safe-by-default virtual hardware operations."""
import unittest

from cl1_neural_lab.virtual_hardware import DeviceMode, VirtualCL1Hardware


class VirtualHardwareTests(unittest.TestCase):
    def test_recording_requires_connection(self):
        hardware = VirtualCL1Hardware()
        with self.assertRaises(RuntimeError):
            hardware.start_recording("test")
        hardware.connect()
        event = hardware.start_recording("test")
        self.assertEqual(event["event_type"], "recording_started")
        self.assertTrue(hardware.state.recording)
        hardware.disconnect()
        self.assertFalse(hardware.state.recording)
        self.assertFalse(hardware.state.connected)

    def test_stimulation_requires_confirmation_and_valid_channels(self):
        hardware = VirtualCL1Hardware()
        hardware.connect()
        with self.assertRaises(PermissionError):
            hardware.request_stimulation([10])
        with self.assertRaises(ValueError):
            hardware.request_stimulation([0], operator_confirmed=True)
        with self.assertRaises(ValueError):
            hardware.request_stimulation([64], operator_confirmed=True)
        event = hardware.request_stimulation([10], operator_confirmed=True)
        self.assertEqual(event["event_type"], "virtual_stimulation_requested")
        self.assertFalse(event["details"]["dispatched_to_physical_hardware"])

    def test_emergency_stop_blocks_virtual_stimulation_until_reset(self):
        hardware = VirtualCL1Hardware()
        hardware.connect()
        hardware.emergency_stop()
        with self.assertRaisesRegex(RuntimeError, "Emergency stop"):
            hardware.request_stimulation([10], operator_confirmed=True)
        hardware.reset_emergency_stop()
        self.assertEqual(
            hardware.request_stimulation([10], operator_confirmed=True)["event_type"],
            "virtual_stimulation_requested",
        )

    def test_physical_modes_fail_closed(self):
        hardware = VirtualCL1Hardware()
        for mode in (DeviceMode.PHYSICAL_READ_ONLY, DeviceMode.PHYSICAL_CONTROL):
            with self.assertRaises(NotImplementedError):
                hardware.set_mode(mode)
        self.assertFalse(hardware.describe()["hardware_control_supported"])


if __name__ == "__main__":
    unittest.main()
