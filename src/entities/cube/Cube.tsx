import { Outlines } from '@react-three/drei'
import { CUBE_SIZE } from '../../shared/config/constants'

type CubeProps = {
  selected: boolean
  insertMode: boolean
  position: readonly [number, number, number]
  onSelect: (additive: boolean) => void
}

export function Cube({ selected, insertMode, position, onSelect }: CubeProps) {
  const outlineColor = insertMode ? '#a3be8c' : '#5e81ac'
  const emissive = selected ? outlineColor : '#000000'

  return (
    <mesh
      position={position as [number, number, number]}
      onClick={(event) => {
        event.stopPropagation()
        onSelect(event.shiftKey)
      }}
    >
      <boxGeometry args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]} />
      <meshStandardMaterial
        color="#d8dee9"
        metalness={0.3}
        roughness={0.4}
        transparent
        opacity={0.75}
        emissive={emissive}
        emissiveIntensity={selected ? 0.25 : 0}
      />
      {selected && <Outlines thickness={4} color={outlineColor} />}
    </mesh>
  )
}
