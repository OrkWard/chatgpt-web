export function getCurrentDate() {
  const date = new Date()
  const day = date.getDate()
  const month = date.getMonth() + 1
  const year = date.getFullYear()
  return `${year}-${month}-${day}`
}

export async function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== 'string')
        reject(new Error('Read File Error!'))
      else
        resolve(reader.result)
    }
    reader.onerror = () => {
      reject(new Error('Read File Error!'))
    }
    reader.readAsDataURL(file)
  })
}
