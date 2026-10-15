import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Vector3 } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { Cube } from "../entities/cube/Cube";
import { cubesSlice, type CubesState } from "../entities/cube/cubesSlice";
import { INITIAL_CUBES } from "../entities/cube/model";
import { worldPositionOfGroupCube } from "../entities/group/model";
import { groupCentroid } from "../entities/group/worldCubes";
import { uiSlice, type UiState } from "../entities/ui/uiSlice";
import { ModeMenuTracker } from "../features/mode/ModeMenuTracker";
import { SelectionMarquee } from "../features/selection/SelectionMarquee";
import { CAMERA_POLAR, TARGET_LERP } from "../shared/config/constants";
import { useSceneKeyboard } from "./useSceneKeyboard";

const { selectCubes, selectGroups, selectActiveId, selectSelectedIds } =
  cubesSlice.selectors;
const { selectCube, addCubeToSelection } = cubesSlice.actions;
const { selectMode, selectModeMenuOpen } = uiSlice.selectors;

export function Scene() {
  const { camera } = useThree();
  const dispatch = useDispatch();
  const cubes = useSelector((state: { cubes: CubesState }) =>
    selectCubes(state),
  );
  const groups = useSelector((state: { cubes: CubesState }) =>
    selectGroups(state),
  );
  const activeId = useSelector((state: { cubes: CubesState }) =>
    selectActiveId(state),
  );
  const selectedIds = useSelector((state: { cubes: CubesState }) =>
    selectSelectedIds(state),
  );
  const mode = useSelector((state: { ui: UiState }) => selectMode(state));
  const modeMenuOpen = useSelector((state: { ui: UiState }) =>
    selectModeMenuOpen(state),
  );

  const modeRef = useRef(mode);
  const modeMenuOpenRef = useRef(modeMenuOpen);
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const desiredTarget = useRef(new Vector3(...INITIAL_CUBES[0].position));

  const selecting = mode === "select";

  modeRef.current = mode;
  modeMenuOpenRef.current = modeMenuOpen;

  const activeCube =
    cubes.find((item) => item.id === activeId) ?? cubes[0] ?? INITIAL_CUBES[0];
  const activeGroup = groups.find((group) => group.id === activeId);
  const menuAnchor = activeGroup
    ? groupCentroid(activeGroup)
    : activeCube.position;

  useEffect(() => {
    const positions: [number, number, number][] = [];

    for (const id of selectedIds) {
      const cube = cubes.find((item) => item.id === id);
      if (cube) {
        positions.push(cube.position);
        continue;
      }
      const group = groups.find((item) => item.id === id);
      if (group) {
        for (const member of group.cubes) {
          positions.push(worldPositionOfGroupCube(group, member));
        }
      }
    }

    const targets =
      positions.length > 0
        ? positions
        : activeGroup
          ? activeGroup.cubes.map((member) =>
              worldPositionOfGroupCube(activeGroup, member),
            )
          : [activeCube.position];

    const count = targets.length;
    let x = 0,
      y = 0,
      z = 0;
    for (const [dx, dy, dz] of targets) {
      x += dx;
      y += dy;
      z += dz;
    }
    desiredTarget.current.set(x / count, y / count, z / count);
  }, [activeCube, activeGroup, cubes, groups, selectedIds]);

  useSceneKeyboard({
    camera,
    modeRef,
    modeMenuOpenRef,
  });

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (controls) {
      const t = 1 - Math.exp(-TARGET_LERP * delta);
      controls.target.lerp(desiredTarget.current, t);
      controls.update();
    }
  });

  return (
    <>
      {cubes.map((cube) => (
        <Cube
          key={cube.id}
          id={cube.id}
          position={cube.position}
          onSelect={(additive) =>
            dispatch(
              additive ? addCubeToSelection(cube.id) : selectCube(cube.id),
            )
          }
        />
      ))}
      {groups.map((group) =>
        group.cubes.map((cube) => (
          <Cube
            key={cube.id}
            id={cube.id}
            selectionId={group.id}
            position={worldPositionOfGroupCube(group, cube)}
            onSelect={(additive) =>
              dispatch(
                additive
                  ? addCubeToSelection(group.id)
                  : selectCube(group.id),
              )
            }
          />
        )),
      )}
      <ModeMenuTracker position={menuAnchor} />
      <SelectionMarquee />
      <OrbitControls
        ref={controlsRef}
        enableDamping
        enableRotate={!selecting}
        enablePan={!selecting}
        target={[...INITIAL_CUBES[0].position]}
        minPolarAngle={CAMERA_POLAR}
        maxPolarAngle={CAMERA_POLAR}
      />
    </>
  );
}
