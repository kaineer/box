import { Outlines } from '@react-three/drei'
import { CUBE_SIZE } from '../../shared/config/constants'

type CubeProps = {
  active: boolean
  insertMode: boolean
  position: readonly [number, number, number]
  onSelect: () => void
}

export function Cube({ active, insertMode, position, onSelect }: CubeProps) {
  const outlineColor = insertMode ? '#a3be8c' : '#5e81ac'
  const emissive = active ? outlineColor : '#000000'

  return (
    <mesh
      position={position as [number, number, number]}
      onClick={(event) => {
        event.stopPropagation()
        onSelect()
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
        emissiveIntensity={active ? 0.25 : 0}
      />
      {active && <Outlines thickness={4} color={outlineColor} />}
    </mesh>
  )
}
