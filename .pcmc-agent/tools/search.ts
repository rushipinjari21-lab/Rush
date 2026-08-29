export type SearchResult = { file: string; line: number; text: string }

export function filterResults(results: SearchResult[], query: string) {
  return results.filter(result => result.text.toLowerCase().includes(query.toLowerCase()))
}
