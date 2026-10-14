import type { CubesDocument } from './cubesYaml'
import { parseCubesYaml } from './cubesYaml'

/**
 * Запрашивает файл (диалог выбора) и читает набор кубов из YAML.
 * Имя файла выбирается пользователем в системном диалоге.
 */
export function readCubesFile(): Promise<CubesDocument | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.yaml,.yml,text/yaml,text/x-yaml'
    input.style.display = 'none'

    const cleanup = () => {
      input.remove()
    }

    input.addEventListener('change', async () => {
      const file = input.files?.[0]
      cleanup()
      if (!file) {
        resolve(null)
        return
      }

      try {
        const text = await file.text()
        const document = parseCubesYaml(text)
        if (!document) {
          window.alert('File does not contain a valid cube set.')
          resolve(null)
          return
        }
        resolve(document)
      } catch {
        window.alert('Failed to read file.')
        resolve(null)
      }
    })

    input.addEventListener('cancel', () => {
      cleanup()
      resolve(null)
    })

    document.body.appendChild(input)
    input.click()
  })
}
