import { runCommand } from './terminal.js'

export const runFrontendBuild = () => runCommand('npm', ['--prefix', 'frontend', 'run', 'build'])
export const runBackendTests = () => runCommand('npm', ['--prefix', 'backend', 'test'])
