import { runCommand } from './terminal.js'

export const gitStatus = () => runCommand('git', ['status', '--short'])
export const gitDiff = () => runCommand('git', ['diff', '--'])
