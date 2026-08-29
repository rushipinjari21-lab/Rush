export const downloadBlob = (data, fileName, contentType) => {
  const blob = data instanceof Blob ? data : new Blob([data], { type: contentType })
  if (!blob.size) throw new Error('The server returned an empty file')

  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => window.URL.revokeObjectURL(url), 1000)
}