import { Canvas } from '@react-three/fiber'
import { Scene } from './scenes/Scene'
import {
  CAMERA_POSITION,
  SCENE_BACKGROUND,
} from './shared/config/constants'
import './App.css'

function App() {
  return (
    <div className="app">
      <Canvas camera={{ position: CAMERA_POSITION, fov: 45 }}>
        <color attach="background" args={[SCENE_BACKGROUND]} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 5, 5]} intensity={1.1} />
        <Scene />
      </Canvas>
    </div>
  )
}

export default App
