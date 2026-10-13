"""Reviewed-protocol template for the official CL API.

This is intentionally not an executable default workflow. Do not uncomment
stimulation calls until the protocol, channel selection, limits, and operator
authorization have been reviewed for the actual device and culture.
"""
# import cl
# from cl import ChannelSet, StimDesign
#
# 1. Confirm device identity and approved protocol in your lab procedure.
# 2. Verify the channel set against the active official device profile.
# 3. Review pulse width/current/charge against current vendor limits and the
#    approved biological protocol. Do not copy example values blindly.
# 4. Use the official API context manager and log protocol metadata.
#
# with cl.open() as neurons:
#     channels = ChannelSet(...)  # Fill only from verified approved profile.
#     design = StimDesign(...)    # Fill only from approved protocol.
#     neurons.stim(channels, design)
#
# This template does not run stimulation. The production adapter additionally
# requires CL1_ALLOW_STIM=1, explicit operator confirmation, and a protocol ID.
raise SystemExit(
    "Template only: review protocol and device configuration before implementing stimulation."
)
