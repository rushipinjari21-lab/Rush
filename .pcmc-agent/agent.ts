import { readTextFile } from './tools/files.js'
import { pcmcAgentConfig } from './config.js'

export async function loadProjectRules() {
  return readTextFile(pcmcAgentConfig.rulesFile)
}
