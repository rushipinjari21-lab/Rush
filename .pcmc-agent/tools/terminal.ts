import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const run = promisify(execFile)

export const runCommand = (command: string, args: string[] = []) =>
  run(command, args, { cwd: process.cwd(), windowsHide: true })
