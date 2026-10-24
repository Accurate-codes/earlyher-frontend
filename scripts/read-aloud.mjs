/** The texts Listen controls read (other interface labels are not read aloud). Shared by the audio scripts. */
const READ_ALOUD = [
  /^triage\.(questions|welcome|selfCheck\.deferred|painInjuryHelper|results\.(outcomes|reasons|advice|reasonsHeading))/,
  /^ui\.home\.(title|text|journeys\.\w+\.title)$/,
  /^ui\.learn\.complete\./,
  /^learn\./,
];

export function readAloudIds(allIds) {
  return allIds.filter((id) => READ_ALOUD.some((pattern) => pattern.test(id)) && !/\.(summary|id)$/.test(id));
}
