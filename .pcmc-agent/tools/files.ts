import { readdir, readFile } from 'node:fs/promises'

export const listFiles = (path: string) => readdir(path, { recursive: true })
export const readTextFile = (path: string) => readFile(path, 'utf8')
