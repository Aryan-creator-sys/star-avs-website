// ============================================================================
//  STAR AV ASSIST — guided troubleshooting. Short, branching diagnostics rather
//  than a giant generic checklist. Escalates to the human team when it's an
//  on-site issue.
// ============================================================================

export const TROUBLESHOOTERS = [
  {
    id: "no-display",
    match: /(no (image|display|signal|picture)|nothing (on screen|showing|displaying)|black screen|not displaying)/i,
    intro: "Let's diagnose the blank screen — quick checks first:",
    steps: [
      "Is the projector powered on and past its warm-up (lamp/laser indicator steady)?",
      "Is the correct HDMI input selected on the projector?",
      "Does the source device (player/console/laptop) work on another display or TV?",
      "Is an AV receiver in between? Try the source straight into the projector to isolate it.",
      "What HDMI cable length are you using? Long runs (>7–10 m) often need an active/optical HDMI cable.",
    ],
    escalateHint: "If it's still blank after these, it's usually cabling or a handshake issue we can fix on site.",
  },
  {
    id: "blurry",
    match: /(blurry|blur|out of focus|soft image|not sharp|fuzzy)/i,
    intro: "Blurriness is usually focus or geometry. Let's narrow it down:",
    steps: [
      "Is the whole image soft, or only parts (e.g. one side/corner)?",
      "Adjust the focus ring/motor with a sharp test pattern or on-screen text.",
      "Are keystone or digital corrections turned up? Heavy keystone softens the image — square the projector to the screen instead.",
      "Is the lens clean, and is the throw distance within the projector's range for your screen size?",
    ],
    escalateHint: "If only part of the image is soft, it can be lens/panel alignment — best assessed on site.",
  },
  {
    id: "atmos",
    match: /(atmos|height speaker|dolby atmos).*(not|isn'?t|won'?t|no)|no atmos|atmos not working/i,
    intro: "Let's check why Atmos isn't engaging:",
    steps: [
      "Is the source sending a Dolby Atmos bitstream (e.g. set the app/player audio to 'bitstream/passthrough', not PCM)?",
      "Does the content itself carry Atmos (the title must be an Atmos mix)?",
      "Is the AVR set to a Dolby/Atmos surround mode and reporting 'Dolby Atmos' on its display?",
      "Are height/ceiling speakers assigned and configured in the AVR's speaker setup?",
      "If routing through a TV, is eARC enabled (ARC can't carry lossless Atmos)?",
    ],
    escalateHint: "Speaker assignment and eARC quirks are quick for our team to sort out.",
  },
  {
    id: "hdmi-drop",
    match: /(hdmi (drop|dropping|cutting|flicker|blink)|signal drop|screen flicker|handshake)/i,
    intro: "HDMI dropouts are usually bandwidth or handshake. Let's check:",
    steps: [
      "What resolution/refresh are you running (e.g. 4K/60, 4K/120)? Higher rates need more bandwidth.",
      "Cable length and rating — for 4K/120 or long runs, use a certified Ultra High Speed or active optical HDMI cable.",
      "Try a direct source→display connection to rule out the AVR/switch.",
      "Match HDCP/EDID: some devices need the display on before the source powers up.",
    ],
    escalateHint: "Long in-wall runs sometimes need optical HDMI or an extender — we can spec the right one.",
  },
  {
    id: "sub-placement",
    match: /(where.*(sub|subwoofer)|subwoofer (place|position|placement|go))/i,
    intro: "Subwoofer placement makes a big difference:",
    steps: [
      "Start with the sub near the front soundstage, then try corners for more output.",
      "Try the 'subwoofer crawl': put the sub at your seat, play bass, then walk the room — place the sub where bass sounded best.",
      "Avoid burying it behind furniture; keep the port clear.",
      "Run your AVR's room calibration after placing it.",
    ],
    escalateHint: "For even bass across multiple seats, dual subs + calibration works best — we can plan that.",
  },
];

export function matchTroubleshooter(text) {
  return TROUBLESHOOTERS.find((t) => t.match.test(text)) || null;
}
