/** The texts Listen controls read (other interface labels are not read aloud). Shared by the audio scripts. */
const READ_ALOUD = [
  /^triage\.(questions|welcome|selfCheck\.deferred|painInjuryHelper|results\.(outcomes|reasons|advice|reasonsHeading))/,
  // Next steps, summary, privacy and finder (lib/audio/page-speech.ts).
  /^triage\.results\.(howSoon|nextHeading|bringHeading|bring|incompleteTitle|incompleteText|ready|title|noResult)/,
  /^triage\.summary\.(title|intro|urgency|reasons|incomplete)$/,
  /^triage\.privacy\.(title|intro|points|pending)/,
  /^triage\.finderContext\.(heading|redNote|windowNote)$/,
  /^ui\.finder\.(title|intro|searchLabel|mapHelp|breastCareNote|unverifiedNote)$/,
  /^safety\.text$/,
  /^ui\.home\.(title|text|journeys\.\w+\.title)$/,
  /^ui\.learn\.complete\./,
  /^learn\./,
];

export function readAloudIds(allIds) {
  return allIds.filter((id) => READ_ALOUD.some((pattern) => pattern.test(id)) && !/\.(summary|id)$/.test(id));
}
