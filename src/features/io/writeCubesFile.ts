import type { CubeData } from '../../entities/cube/model'
import { serializeCubesYaml } from './cubesYaml'

function downloadYaml(filename: string, yaml: string): void {
  const blob = new Blob([yaml], { type: 'text/yaml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

/** Сохраняет набор кубов через системный диалог Save As. */
export async function writeCubesFile(
  cubes: CubeData[],
  activeId: string,
): Promise<boolean> {
  const yaml = serializeCubesYaml(cubes, activeId)

  if (typeof window.showSaveFilePicker === 'function') {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: 'boxes.yaml',
        types: [
          {
            description: 'YAML cube set',
            accept: {
              'text/yaml': ['.yaml', '.yml'],
            },
          },
        ],
      })
      const writable = await handle.createWritable()
      await writable.write(yaml)
      await writable.close()
      return true
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return false
      }
      throw error
    }
  }

  // Fallback без prompt: обычное скачивание с именем по умолчанию
  downloadYaml('boxes.yaml', yaml)
  return true
}
