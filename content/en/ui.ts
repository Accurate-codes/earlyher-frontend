/**
 * English interface text. Clinical wording lives in clinical.ts, education.ts and the
 * questionnaire files. Yoruba text lives in content/yo/ui.ts; any key missing there is
 * shown in English with a visible notice, never passed off as Yoruba.
 */
export const ui = {
  appName: "EarlyHer",
  logoAlt: "EarlyHer",

  common: {
    listen: "Listen",
    stop: "Stop",
    back: "Back",
    next: "Next",
    finish: "Finish",
    close: "Close",
    cancel: "Cancel",
    tryAgain: "Try again",
    home: "Home",
    startAgain: "Start again",
    findHealthcare: "Find healthcare",
    learnMore: "Learn more",
    checkConcern: "I have a breast concern",
    print: "Print",
    sendBySms: "Send by SMS",
    loading: "Loading…",
    draft: "Draft",
    draftLong: "Draft wording, awaiting clinical review",
    demo: "Demo",
    skipToContent: "Skip to main content",
    flowNavigation: "Page navigation",
    opensInNewTab: "(opens in a new tab)",
    important: "Important",
  },

  language: {
    label: "Language",
    names: { en: "English", yo: "Yorùbá" },
    /** Shown when Yoruba is chosen but reviewed translations are missing. */
    pending:
      "Yorùbá: reviewed translations are not ready yet. Text that has not been translated is shown in English.",
    missingCount: (missing: number, total: number) => `${missing} of ${total} interface texts are not yet translated.`,
  },

  audio: {
    deviceVoice: "Playing with this device's voice.",
    unavailable: "Audio is not available for this screen yet.",
  },

  home: {
    privacy: "Private, no accounts needed",
    title: "Where would you like to start?",
    text: "Choose the option that fits you best. You can come back and choose another at any time.",
    journeysLabel: "Choose where to start",
    listenText:
      "Where would you like to start? Choose the option that fits you best. You can come back and choose another at any time. " +
      "I have a breast concern. I don't have a concern. Find healthcare.",
    journeys: {
      concern: { title: "I have a breast concern", text: "Answer some questions about what you have noticed." },
      noConcern: { title: "I don't have a concern", text: "Information for when you have not noticed anything." },
      healthcare: { title: "Find healthcare", text: "Find health facilities in Lagos State." },
    },
  },

  questionnaire: {
    title: "Your breast concern",
  },

  results: {
    title: "Your next steps",
    telemedicine: {
      title: "Talk to a doctor online",
      text: (provider: string) => `Talk to a doctor through ${provider}, a separate telemedicine service.`,
      open: (provider: string) => `Go to ${provider}`,
      leaving: "You will leave EarlyHer. The other service has its own terms and privacy policy.",
      unavailable: "Online consultations are not available through EarlyHer yet.",
    },
    facility: {
      title: "Visit a health facility",
      text: "Find health facilities on a map and get directions.",
      open: "Find a facility",
    },
  },

  noConcern: {
    title: "I don't have a concern",
  },

  finder: {
    title: "Find healthcare",
    intro: "Search for health facilities in Lagos State by name or area.",
    searchLabel: "Search by facility name, ward or area",
    searchPlaceholder: "For example: Surulere or Ikeja",
    lgaLabel: "Local government area (LGA)",
    allLgas: "All LGAs in Lagos",
    useLocation: "Use my location",
    locating: "Finding your location…",
    locationOn: "Sorted by straight-line distance from your location",
    locationPrivacy: "Your location is used on this screen only. It is not saved or sent anywhere.",
    stopLocation: "Stop using my location",
    locationDenied: "Location permission was not given. You can still search by name or area.",
    locationUnavailable: "Your location could not be found. You can still search by name or area.",
    locationUnsupported: "This device cannot share its location. You can still search by name or area.",
    results: (shown: number, total: number) =>
      shown === total
        ? `${total.toLocaleString("en-NG")} facilities`
        : `Showing ${shown.toLocaleString("en-NG")} of ${total.toLocaleString("en-NG")} facilities`,
    showMore: "Show more facilities",
    clearFilters: "Clear search",
    listLabel: "Facilities",
    mapLabel: "Map of facilities",
    mapHelp: "Choose a facility in the list or on the map to see its details.",
    mapOffline: "The map needs an internet connection. The facility list still works.",
    mapError: "The map could not be loaded. The facility list still works.",
    loading: "Loading facilities…",
    empty: "No facilities match your search.",
    emptyHelp: "Try a different name or area, or choose another LGA.",
    noData: "There are no facility records to show right now.",
    unavailable: "Facility information is not available right now.",
    offline:
      "You are offline, and the facility list has not been saved on this device yet. Please connect to the internet and try again.",
    failure: "We couldn't load facility information. Please try again.",
    generalHelp:
      "You can still visit your nearest primary healthcare centre or hospital and ask to speak with a healthcare professional.",
    distance: (km: number) =>
      km < 1
        ? `About ${Math.max(50, Math.round((km * 1000) / 50) * 50)} m away in a straight line`
        : `About ${km.toFixed(1)} km away in a straight line`,
    distanceNote: "Straight-line distance, not travel distance.",
    showDetails: "Show details",
    hideDetails: "Hide details",
    directions: "Get directions",
    openMap: "Open in Google Maps",
    externalNote: "Directions open Google Maps and need an internet connection.",
    fields: {
      type: "Type",
      level: "Level of care",
      ownership: "Ownership",
      area: "Area",
      address: "Address",
      phone: "Phone",
      hours: "Opening hours",
      services: "Services",
      hfrCode: "Health Facility Registry code",
      source: "Source",
    },
    area: (ward: string | null, lga: string | null, state: string | null) =>
      [ward ? `${ward} ward` : null, lga ? `${lga} LGA` : null, state ? `${state} State` : null]
        .filter(Boolean)
        .join(", "),
    addressMissing: "Street address not available in this data",
    notVerified: "Not verified",
    unverifiedNote:
      "Phone numbers, opening hours and services are not shown because they have not been verified. Please check with the facility before you travel.",
    breastCareNote: "Being listed here does not mean a facility offers specialist breast care.",
    locationNote: "Map position comes from the dataset and may not be exact.",
    nameDisagreement: "Sources disagreed about this facility's ward or LGA name.",
    coverageTitle: "About this information",
    coverage: (count: number, state: string) =>
      `${count.toLocaleString("en-NG")} health facilities in ${state} State only. This list is not complete and has not been checked by EarlyHer.`,
    sourceLine: (name: string, released: string) => `Facility data: ${name}, released ${released}.`,
    savedOn: (date: string) => `Facility list last updated in this app: ${date}.`,
    offlineReady: "Once loaded, the facility list and search work without internet. The map and directions need internet.",
    licence: "Licence",
    simulated: "Demo state selected in the development panel.",
  },

  learn: {
    title: "What would you like to learn about?",
    moduleCount: (cards: number) => `${cards} short ${cards === 1 ? "card" : "cards"}`,
    cardOf: (position: number, total: number) => `Card ${position} of ${total}`,
    yes: "Yes",
    no: "No",
    allTopics: "All topics",
    nextTopic: "Next topic",
    notFound: { title: "We couldn't find that topic", text: "Choose a topic from the list." },
    complete: {
      title: "Well done",
      text: "You have finished this topic. What would you like to do next?",
    },
    illustrationNote: "Illustrations will be added once approved artwork is supplied.",
  },


  sms: {
    offerTitle: "Would you like us to send your next steps to your phone?",
    offerText: "This is optional. You do not need an account.",
    noThanks: "No thanks",
    enterTitle: "Enter your phone number",
    numberLabel: "Phone number",
    placeholder: "0803 123 4567",
    delete: "Delete last digit",
    clear: "Clear",
    preview: "Preview message",
    previewTitle: "Check before sending",
    to: "To",
    message: "Message",
    edit: "Change number",
    send: "Send",
    sending: "Sending…",
    privacy: "Your number is only used to send this message and is cleared when you finish.",
    errors: {
      empty: "Enter your phone number.",
      "must-start-with-0": "Start with 0, for example 0803 123 4567.",
      "too-short": "The number should have 11 digits.",
      "not-a-mobile-number": "This does not look like a mobile number. Please check it.",
    },
    templates: {
      "next-step":
        "EarlyHer: Thank you for using EarlyHer. Your next step is to speak with a healthcare professional. This is guidance, not a diagnosis.",
      facility: (name: string) =>
        `EarlyHer: The place you looked at is ${name}. Please speak with a healthcare professional there. This is guidance, not a diagnosis.`,
    },
    accepted: "Your message has been accepted for sending.",
    queued: "Your message is waiting to be sent by the SMS service.",
    notDelivery: "We can't confirm here that it has arrived on your phone.",
    simulated: "Demo mode: this was a simulation. No real SMS was sent.",
    failure: "We couldn't send the SMS right now.",
    offline: "You are offline, so we can't send an SMS right now. Your number is not saved to send later.",
    printInstead: "Print instead",
  },

  print: {
    title: "Print your next steps",
    previewLabel: "Print preview",
    open: "Print",
    opened: "The print window has been opened. Please check the printer for your page.",
    notConfirmed: "We can't tell from here whether the page was printed.",
    unavailable: "Printing is temporarily unavailable.",
    nextStepHeading: "Your next step",
    generalHeading: "Good to know",
    facilityHeading: "Where to go",
    qrCaption: "Scan for more information",
    qrMissing: "A QR code will appear here once a public information page is set up.",
    footer:
      "This tool does not diagnose. It helps you understand your symptoms and connects you to professional care as fast as possible.",
    smsInstead: "Send by SMS instead",
  },

  session: {
    exitTitle: "Finish and clear your answers?",
    exitText: "Your answers, including any progress saved on this device, will be removed.",
    exitConfirm: "Yes, finish",
    exitStay: "No, go back",
    idleTitle: "Are you still there?",
    idleText: (seconds: number) =>
      `To protect your privacy, this session will close in ${seconds} ${seconds === 1 ? "second" : "seconds"}.`,
    idleContinue: "Continue session",
    idleFinish: "Finish now",
  },

  notFound: {
    title: "We couldn't find that page",
    text: "Let's take you back to the start.",
  },

  dev: {
    title: "Demo states",
    note: "Development only. Switches what the mock services return.",
    ai: "AI explanation",
    sms: "SMS",
    facilities: "Facilities",
    printer: "Printer",
  },
};

export type UiText = typeof ui;
