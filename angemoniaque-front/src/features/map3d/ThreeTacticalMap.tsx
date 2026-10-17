import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { getTileData, computePathEnergy } from '../../shared/utils/gridMath';

interface ThreeTacticalMapProps {
  currentActor: any;
  activeChar: any;
  entities: any[];
  summonedMonsters: any[];
  selectedTile: any;
  activeMount: any;
  controlledSummon: any;
  onHoverTile: (tile: any) => void;
  onSelectTile: (tile: any) => void;
}

function createNoiseTexture(baseHex: string, variance = 18): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 64, 64);

  const imgData = ctx.getImageData(0, 0, 64, 64);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const delta = (Math.random() - 0.5) * variance;
    data[i] = Math.min(255, Math.max(0, data[i] + delta));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + delta));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + delta));
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function buildCharacterModel(race: string, isMainActor: boolean, isSummon: boolean): THREE.Group {
  const group = new THREE.Group();
  const armorColor = isSummon
    ? 0x06b6d4
    : race === 'Ange'
    ? 0xfef08a
    : race === 'Demon'
    ? 0x991b1b
    : isMainActor
    ? 0xd97706
    : 0x3b82f6;

  const torso = new THREE.Mesh(
    new THREE.CylinderGeometry(0.13, 0.16, 0.32, 12),
    new THREE.MeshStandardMaterial({ color: armorColor, metalness: 0.65, roughness: 0.28 })
  );
  torso.position.y = 0.22;
  torso.castShadow = true;
  group.add(torso);

  const cape = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.3, 0.04),
    new THREE.MeshStandardMaterial({
      color: race === 'Demon' ? 0x450a0a : race === 'Ange' ? 0xffffff : 0x1e3a8a,
      roughness: 0.8,
    })
  );
  cape.position.set(0, 0.21, -0.12);
  cape.rotation.x = 0.18;
  group.add(cape);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.11, 16, 16),
    new THREE.MeshStandardMaterial({ color: isSummon ? 0x67e8f9 : 0xfde68a, roughness: 0.45 })
  );
  head.position.y = 0.46;
  head.castShadow = true;
  group.add(head);

  const helm = new THREE.Mesh(
    new THREE.ConeGeometry(0.12, 0.12, 8),
    new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.8, roughness: 0.2 })
  );
  helm.position.y = 0.55;
  group.add(helm);

  const blade = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.36, 0.08),
    new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      emissive: isMainActor ? 0x38bdf8 : 0x000000,
      emissiveIntensity: 0.35,
      metalness: 0.9,
      roughness: 0.15,
    })
  );
  blade.position.set(0.2, 0.3, 0.1);
  blade.rotation.x = Math.PI / 6;
  group.add(blade);

  const shield = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.12, 0.04, 6),
    new THREE.MeshStandardMaterial({ color: armorColor, metalness: 0.7, roughness: 0.25 })
  );
  shield.rotation.z = Math.PI / 2;
  shield.position.set(-0.19, 0.24, 0.08);
  group.add(shield);

  return group;
}

function buildMountModel(mountId: string): { group: THREE.Group; wings: THREE.Object3D[] } {
  const group = new THREE.Group();
  const isDragon = mountId?.includes('dragon');
  const bodyColor = isDragon ? 0xb91c1c : 0xf8fafc;

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.24, 0.58),
    new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.4, metalness: 0.35 })
  );
  body.position.y = 0.18;
  body.castShadow = true;
  group.add(body);

  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.12, 0.28, 8),
    new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.4 })
  );
  neck.position.set(0, 0.34, 0.26);
  neck.rotation.x = Math.PI / 5;
  group.add(neck);

  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.16, 0.24),
    new THREE.MeshStandardMaterial({ color: isDragon ? 0xef4444 : 0xe2e8f0, metalness: 0.3 })
  );
  head.position.set(0, 0.46, 0.38);
  group.add(head);

  const wings: THREE.Object3D[] = [];
  if (isDragon) {
    const wingGeo = new THREE.BoxGeometry(0.52, 0.03, 0.32);
    const wingMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      emissive: 0x7f1d1d,
      emissiveIntensity: 0.3,
      roughness: 0.5,
    });
    const wingL = new THREE.Mesh(wingGeo, wingMat);
    wingL.position.set(-0.38, 0.32, 0);
    const wingR = new THREE.Mesh(wingGeo, wingMat);
    wingR.position.set(0.38, 0.32, 0);
    group.add(wingL, wingR);
    wings.push(wingL, wingR);
  }

  return { group, wings };
}

function buildBossModel(name: string): THREE.Group {
  const group = new THREE.Group();
  const isBalrog = name.toLowerCase().includes('balrog');
  const isLeviathan = name.toLowerCase().includes('léviathan') || name.toLowerCase().includes('leviathan');
  const mainColor = isBalrog ? 0x7f1d1d : isLeviathan ? 0x0369a1 : 0x78350f;
  const glowColor = isBalrog ? 0xf97316 : isLeviathan ? 0x22d3ee : 0xef4444;

  const auraRing = new THREE.Mesh(
    new THREE.RingGeometry(0.34, 0.44, 28),
    new THREE.MeshBasicMaterial({ color: glowColor, side: THREE.DoubleSide })
  );
  auraRing.rotation.x = -Math.PI / 2;
  auraRing.position.y = 0.02;
  group.add(auraRing);

  const torso = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.28, 1),
    new THREE.MeshStandardMaterial({ color: mainColor, emissive: glowColor, emissiveIntensity: 0.22, roughness: 0.4, metalness: 0.45 })
  );
  torso.position.y = 0.34;
  torso.castShadow = true;
  group.add(torso);

  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.24, 0.24),
    new THREE.MeshStandardMaterial({ color: mainColor, roughness: 0.3 })
  );
  head.position.y = 0.64;
  group.add(head);

  return group;
}

function buildBuildingModel(entity: any): { group: THREE.Group; animatedRings: THREE.Object3D[] } {
  const group = new THREE.Group();
  const animatedRings: THREE.Object3D[] = [];

  if (entity.subType === 'portal') {
    const pillarGeo = new THREE.BoxGeometry(0.12, 0.7, 0.12);
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.5, roughness: 0.4 });
    const pillarL = new THREE.Mesh(pillarGeo, pillarMat);
    pillarL.position.set(-0.3, 0.35, 0);
    const pillarR = new THREE.Mesh(pillarGeo, pillarMat);
    pillarR.position.set(0.3, 0.35, 0);
    group.add(pillarL, pillarR);

    const outerRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.28, 0.045, 12, 32),
      new THREE.MeshStandardMaterial({ color: 0xa855f7, emissive: 0x7e22ce, emissiveIntensity: 0.9, metalness: 0.7 })
    );
    outerRing.position.set(0, 0.44, 0);

    const innerRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.19, 0.03, 10, 24),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.9 })
    );
    innerRing.position.set(0, 0.44, 0);

    group.add(outerRing, innerRing);
    animatedRings.push(outerRing, innerRing);
    return { group, animatedRings };
  }

  const isCapital = entity.subType === 'capital' || entity.invulnerable;
  const wallColor = entity.faction === 'Demon' ? 0x450a0a : entity.faction === 'Ange' ? 0xf8fafc : 0xe2e8f0;
  const roofColor = entity.faction === 'Demon' ? 0xdc2626 : entity.faction === 'Ange' ? 0xfbbf24 : 0x2563eb;

  const keep = new THREE.Mesh(
    new THREE.BoxGeometry(isCapital ? 0.52 : 0.36, isCapital ? 0.46 : 0.55, isCapital ? 0.52 : 0.36),
    new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.55, metalness: 0.2 })
  );
  keep.position.y = isCapital ? 0.23 : 0.28;
  keep.castShadow = true;
  group.add(keep);

  const mainRoof = new THREE.Mesh(
    new THREE.ConeGeometry(isCapital ? 0.42 : 0.3, 0.34, 4),
    new THREE.MeshStandardMaterial({ color: roofColor, metalness: 0.45, roughness: 0.3 })
  );
  mainRoof.position.y = isCapital ? 0.63 : 0.72;
  mainRoof.rotation.y = Math.PI / 4;
  group.add(mainRoof);

  if (isCapital) {
    [
      [-0.26, -0.26],
      [0.26, -0.26],
      [-0.26, 0.26],
      [0.26, 0.26],
    ].forEach(([cx, cz]) => {
      const tower = new THREE.Mesh(
        new THREE.CylinderGeometry(0.09, 0.1, 0.56, 10),
        new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.5 })
      );
      tower.position.set(cx, 0.28, cz);
      const spire = new THREE.Mesh(
        new THREE.ConeGeometry(0.12, 0.22, 10),
        new THREE.MeshStandardMaterial({ color: roofColor, metalness: 0.5 })
      );
      spire.position.set(cx, 0.67, cz);
      group.add(tower, spire);
    });
  }

  return { group, animatedRings };
}

export const ThreeTacticalMap: React.FC<ThreeTacticalMapProps> = ({
  currentActor,
  activeChar,
  entities,
  summonedMonsters,
  selectedTile,
  activeMount,
  controlledSummon,
  onHoverTile,
  onSelectTile,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const tileMeshesRef = useRef<THREE.Mesh[]>([]);
  const hoveredCoordRef = useRef<{ x: number; y: number } | null>(null);
  const cameraAngleRef = useRef({ theta: 0, phi: 0.78, zoom: 1.0 });

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1120);
    scene.fog = new THREE.FogExp2(0x0b1120, 0.028);

    const seeRadius = currentActor.see || 5;
    const baseDist = Math.max(11.5, seeRadius * 2.1);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 250);
    const updateCameraPosition = () => {
      const { theta, phi, zoom } = cameraAngleRef.current;
      const r = baseDist * zoom;
      camera.position.set(
        r * Math.sin(theta) * Math.cos(phi),
        r * Math.sin(phi),
        r * Math.cos(theta) * Math.cos(phi)
      );
      camera.lookAt(0, 0.2, 0);
    };
    updateCameraPosition();

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xe0f2fe, 0x1e293b, 0.85));
    const sunLight = new THREE.DirectionalLight(0xfff7ed, 1.65);
    sunLight.position.set(14, 24, 16);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    scene.add(sunLight);

    const worldGroup = new THREE.Group();
    scene.add(worldGroup);
    tileMeshesRef.current = [];

    const animatedObjects: Array<{ obj: THREE.Object3D; type: 'ring' | 'crystal' | 'water' | 'wing'; speed: number; phase: number }> = [];
    const centerX = currentActor.x;
    const centerY = currentActor.y;
    const mapKey = currentActor.map;

    const textureCache = new Map<string, THREE.CanvasTexture>();
    const getTexture = (hex: string) => {
      if (!textureCache.has(hex)) textureCache.set(hex, createNoiseTexture(hex, 20));
      return textureCache.get(hex)!;
    };

    for (let dx = -seeRadius; dx <= seeRadius; dx++) {
      for (let dy = -seeRadius; dy <= seeRadius; dy++) {
        const tx = centerX + dx;
        const ty = centerY + dy;
        if (tx < 0 || ty < 0 || tx >= 25 || ty >= 25) continue;

        const tileInfo = getTileData(mapKey, tx, ty);
        const isCenter = dx === 0 && dy === 0;
        const isSelected = selectedTile && selectedTile.x === tx && selectedTile.y === ty;

        const pedestal = new THREE.Mesh(
          new THREE.BoxGeometry(0.96, 0.22, 0.96),
          new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 })
        );
        pedestal.position.set(dx, -0.11, dy);
        worldGroup.add(pedestal);

        const topColor = isSelected ? '#f59e0b' : isCenter ? '#0284c7' : tileInfo.color;
        const tileMesh = new THREE.Mesh(
          new THREE.BoxGeometry(0.92, tileInfo.elevation, 0.92),
          new THREE.MeshStandardMaterial({
            map: getTexture(topColor),
            roughness: tileInfo.biome === 'lake' || tileInfo.biome === 'water' ? 0.15 : 0.75,
            metalness: tileInfo.biome === 'lake' || tileInfo.biome === 'water' ? 0.65 : 0.1,
          })
        );
        tileMesh.position.set(dx, tileInfo.elevation / 2, dy);
        tileMesh.receiveShadow = true;
        tileMesh.castShadow = true;

        const entityOnTile = entities.find((e) => e.map === mapKey && e.x === tx && e.y === ty);
        const summonOnTile = summonedMonsters.find((s) => s.map === mapKey && s.x === tx && s.y === ty);

        // Point 10 : Si une invocation se trouve sur la case, on l'attache comme entité de type 'summon'
        const effectiveEntity =
          entityOnTile ||
          (summonOnTile
            ? {
                ...summonOnTile,
                kind: 'summon',
                hp: summonOnTile.hp_current,
                hpMax: summonOnTile.hp_max,
                summonerName: summonOnTile.summonerName || activeChar.pseudo,
                visibleGear: summonOnTile.visibleGear || [],
              }
            : null);

        tileMesh.userData = {
          x: tx,
          y: ty,
          dx,
          dy,
          tileInfo,
          entity: effectiveEntity,
          summon: summonOnTile || null,
        };
        worldGroup.add(tileMesh);
        tileMeshesRef.current.push(tileMesh);

        if (!effectiveEntity && !isCenter) {
          if (tileInfo.biome === 'forest') {
            [
              [-0.2, -0.18, 1.0],
              [0.2, 0.15, 0.82],
            ].forEach(([ox, oz, scale]) => {
              const cone = new THREE.Mesh(
                new THREE.ConeGeometry(0.2 * scale, 0.45 * scale, 8),
                new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.75 })
              );
              cone.position.set(dx + ox, tileInfo.elevation + 0.25 * scale, dy + oz);
              cone.castShadow = true;
              worldGroup.add(cone);
            });
          } else if (tileInfo.biome === 'mountain') {
            const peak = new THREE.Mesh(
              new THREE.ConeGeometry(0.36, 0.65, 6),
              new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.85, flatShading: true })
            );
            peak.position.set(dx, tileInfo.elevation + 0.32, dy);
            peak.castShadow = true;
            worldGroup.add(peak);
          }
        }

        if (entityOnTile) {
          if (entityOnTile.kind === 'building') {
            const { group: bldGroup, animatedRings } = buildBuildingModel(entityOnTile);
            bldGroup.position.set(dx, tileInfo.elevation, dy);
            worldGroup.add(bldGroup);
            animatedRings.forEach((r, idx) =>
              animatedObjects.push({ obj: r, type: 'ring', speed: idx === 0 ? 1.4 : -2.1, phase: 0 })
            );
          } else if (entityOnTile.kind === 'monster') {
            const bossModel = buildBossModel(entityOnTile.name);
            bossModel.position.set(dx, tileInfo.elevation, dy);
            worldGroup.add(bossModel);
          } else if (entityOnTile.kind === 'player' || entityOnTile.kind === 'summon') {
            const allyModel = buildCharacterModel(
              entityOnTile.race || 'Humain',
              false,
              entityOnTile.kind === 'summon'
            );
            allyModel.position.set(dx, tileInfo.elevation, dy);
            worldGroup.add(allyModel);
          }
        }

        if (summonOnTile && (!controlledSummon || controlledSummon.id !== summonOnTile.id)) {
          const summonModel = buildCharacterModel('Humain', false, true);
          summonModel.position.set(dx, tileInfo.elevation, dy);
          worldGroup.add(summonModel);
        }
      }
    }

    if (controlledSummon && activeChar.map === currentActor.map) {
      const relX = activeChar.x - centerX;
      const relY = activeChar.y - centerY;
      if (Math.abs(relX) <= seeRadius && Math.abs(relY) <= seeRadius) {
        const tHero = getTileData(mapKey, activeChar.x, activeChar.y);
        const heroModel = buildCharacterModel(activeChar.race, true, false);
        heroModel.position.set(relX, tHero.elevation, relY);
        worldGroup.add(heroModel);
      }
    }

    const centerTile = getTileData(mapKey, centerX, centerY);
    const centerActorGroup = new THREE.Group();
    centerActorGroup.position.set(0, centerTile.elevation, 0);

    let riderYOffset = 0;
    if (!controlledSummon && activeMount && activeMount.summoned) {
      const { group: mountGroup, wings } = buildMountModel(activeMount.id);
      centerActorGroup.add(mountGroup);
      wings.forEach((w, idx) =>
        animatedObjects.push({ obj: w, type: 'wing', speed: 5.0, phase: idx === 0 ? 0 : Math.PI })
      );
      riderYOffset = 0.26;
    }

    const mainCharacterMesh = buildCharacterModel(activeChar.race, true, Boolean(controlledSummon));
    mainCharacterMesh.position.y = riderYOffset;
    centerActorGroup.add(mainCharacterMesh);
    worldGroup.add(centerActorGroup);

    const pathGroup = new THREE.Group();
    scene.add(pathGroup);

    const draw3DPathTo = (targetX: number, targetY: number) => {
      pathGroup.clear();
      const pathCalc = computePathEnergy(mapKey, centerX, centerY, targetX, targetY);
      if (pathCalc.path.length === 0) return;

      const points: THREE.Vector3[] = [new THREE.Vector3(0, centerTile.elevation + 0.22, 0)];
      pathCalc.path.forEach((step, idx) => {
        const sdx = step.x - centerX;
        const sdy = step.y - centerY;
        const st = getTileData(mapKey, step.x, step.y);
        const py = st.elevation + 0.18;
        points.push(new THREE.Vector3(sdx, py, sdy));

        const node = new THREE.Mesh(
          new THREE.SphereGeometry(idx === pathCalc.path.length - 1 ? 0.11 : 0.065, 12, 12),
          new THREE.MeshBasicMaterial({ color: idx === pathCalc.path.length - 1 ? 0xfbbf24 : 0x38bdf8 })
        );
        node.position.set(sdx, py, sdy);
        pathGroup.add(node);
      });

      if (points.length >= 2) {
        const curve = new THREE.CatmullRomCurve3(points);
        const tubeGeo = new THREE.TubeGeometry(curve, points.length * 6, 0.03, 8, false);
        const tubeMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85 });
        pathGroup.add(new THREE.Mesh(tubeGeo, tubeMat));
      }
    };

    if (selectedTile) draw3DPathTo(selectedTile.x, selectedTile.y);

    // Point 7 : Projection 3D -> Coordonnées écran 2D pour placer la fenêtre juste à côté de la case pointée
    const projectTileToScreen = (mesh: THREE.Object3D) => {
      const worldPos = new THREE.Vector3();
      mesh.getWorldPosition(worldPos);
      worldPos.y += 0.35;
      worldPos.project(camera);
      const rect = renderer.domElement.getBoundingClientRect();
      const screenX = ((worldPos.x + 1) * rect.width) / 2 + rect.left;
      const screenY = ((-worldPos.y + 1) * rect.height) / 2 + rect.top;
      return { screenX, screenY };
    };

    let isRightDragging = false;
    let prevMouse = { x: 0, y: 0 };

    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 2 || e.button === 1) {
        isRightDragging = true;
        prevMouse = { x: e.clientX, y: e.clientY };
      }
    };
    const handleMouseUp = () => {
      isRightDragging = false;
    };
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      cameraAngleRef.current.zoom = Math.min(1.65, Math.max(0.55, cameraAngleRef.current.zoom + e.deltaY * 0.0008));
      updateCameraPosition();
    };

    const handlePointerMove = (e: MouseEvent) => {
      if (isRightDragging) {
        const deltaX = e.clientX - prevMouse.x;
        const deltaY = e.clientY - prevMouse.y;
        prevMouse = { x: e.clientX, y: e.clientY };
        cameraAngleRef.current.theta -= deltaX * 0.007;
        cameraAngleRef.current.phi = Math.min(1.35, Math.max(0.35, cameraAngleRef.current.phi + deltaY * 0.006));
        updateCameraPosition();
        return;
      }

      const rect = renderer.domElement.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(tileMeshesRef.current);

      if (intersects.length > 0) {
        const hitMesh = intersects[0].object;
        const { screenX, screenY } = projectTileToScreen(hitMesh);
        const data = { ...hitMesh.userData, screenX, screenY };
        onHoverTile(data);
        if (!selectedTile && (!hoveredCoordRef.current || hoveredCoordRef.current.x !== data.x || hoveredCoordRef.current.y !== data.y)) {
          hoveredCoordRef.current = { x: data.x, y: data.y };
          draw3DPathTo(data.x, data.y);
        }
      } else {
        onHoverTile(null);
        if (!selectedTile && hoveredCoordRef.current) {
          hoveredCoordRef.current = null;
          pathGroup.clear();
        }
      }
    };

    const handleClick = (e: MouseEvent) => {
      if (e.button !== 0) return;
      const rect = renderer.domElement.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(tileMeshesRef.current);
      if (intersects.length > 0) {
        const hitMesh = intersects[0].object;
        const { screenX, screenY } = projectTileToScreen(hitMesh);
        const data = { ...hitMesh.userData, screenX, screenY };
        onSelectTile(data);
        draw3DPathTo(data.x, data.y);
      } else {
        onSelectTile(null);
      }
    };

    const domElem = renderer.domElement;
    domElem.addEventListener('contextmenu', handleContextMenu);
    domElem.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    domElem.addEventListener('wheel', handleWheel, { passive: false });
    domElem.addEventListener('pointermove', handlePointerMove);
    domElem.addEventListener('click', handleClick);

    const clock = new THREE.Clock();
    let reqId: number;
    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      animatedObjects.forEach((item) => {
        if (item.type === 'ring') item.obj.rotation.z = elapsed * item.speed;
        else if (item.type === 'wing') item.obj.rotation.z = Math.sin(elapsed * item.speed + item.phase) * 0.28;
      });
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(reqId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mouseup', handleMouseUp);
      domElem.removeEventListener('contextmenu', handleContextMenu);
      domElem.removeEventListener('mousedown', handleMouseDown);
      domElem.removeEventListener('wheel', handleWheel);
      domElem.removeEventListener('pointermove', handlePointerMove);
      domElem.removeEventListener('click', handleClick);
      textureCache.forEach((tex) => tex.dispose());
      renderer.dispose();
    };
  }, [
    currentActor.x,
    currentActor.y,
    currentActor.map,
    currentActor.see,
    activeChar.race,
    entities,
    summonedMonsters,
    selectedTile,
    activeMount,
    controlledSummon,
  ]);

  return <div ref={mountRef} className="absolute inset-0 w-full h-full z-0 cursor-grab active:cursor-grabbing" />;
};