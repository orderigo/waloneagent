import * as THREE from 'three'
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js'

const AGENT_MODEL_URL = 'https://res.cloudinary.com/dnj7lkno6/image/upload/v1786171052/robot_playground_zodbwx.glb'
const AGENT_DISTANCE_METERS = 2.25
const AGENT_HEIGHT_METERS = 1.55

const fitObjectToHeight = (object, targetHeight) => {
  const box = new THREE.Box3().setFromObject(object)
  const size = box.getSize(new THREE.Vector3())
  const height = size.y || 1
  const scale = targetHeight / height
  object.scale.multiplyScalar(scale)
  box.setFromObject(object)
  const center = box.getCenter(new THREE.Vector3())
  object.position.sub(new THREE.Vector3(center.x, box.min.y, center.z))
  return scale
}

export const initScenePipelineModule = () => {
  const clock = new THREE.Clock()
  const loader = new GLTFLoader()
  const agentAnchor = new THREE.Group()
  let agentMixer
  let placementLocked = false

  const placeAgentInFrontOfCamera = (camera) => {
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion)
    forward.y = 0
    forward.normalize()

    agentAnchor.position.copy(camera.position).addScaledVector(forward, AGENT_DISTANCE_METERS)
    agentAnchor.position.y = 0
    agentAnchor.rotation.set(0, Math.atan2(forward.x, forward.z), 0)
    placementLocked = true
  }

  const createAgent = (scene) => {
    agentAnchor.name = 'walone-ai-agent-anchor'
    agentAnchor.visible = false
    scene.add(agentAnchor)

    const base = new THREE.Mesh(
      new THREE.CircleGeometry(0.72, 96),
      new THREE.MeshStandardMaterial({color: 0x1b2847, roughness: 0.72, metalness: 0.18, transparent: true, opacity: 0.62})
    )
    base.rotation.x = -Math.PI / 2
    base.receiveShadow = true
    agentAnchor.add(base)

    loader.load(AGENT_MODEL_URL, (gltf) => {
      const agent = gltf.scene
      agent.name = 'walone-ai-agent-robot'
      agent.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true
          child.receiveShadow = true
        }
      })
      fitObjectToHeight(agent, AGENT_HEIGHT_METERS)
      agentAnchor.add(agent)

      if (gltf.animations.length > 0) {
        agentMixer = new THREE.AnimationMixer(agent)
        gltf.animations.forEach((clip) => {
          const action = agentMixer.clipAction(clip)
          action.reset().play()
        })
      }
    })

    const spotlight = new THREE.PointLight(0x7ce0ff, 2.3, 4)
    spotlight.position.set(0, 1.4, 0.4)
    agentAnchor.add(spotlight)
  }

  return {
    name: 'waloneaiagentscene',

    onStart: () => {
      const {scene, renderer} = XR8.Threejs.xrScene()
      renderer.shadowMap.enabled = true
      renderer.outputColorSpace = THREE.SRGBColorSpace

      scene.add(new THREE.HemisphereLight(0xdcecff, 0x151827, 1.3))
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9)
      directionalLight.position.set(3, 6, 4)
      directionalLight.castShadow = true
      scene.add(directionalLight)

      const shadowPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(2000, 2000),
        new THREE.ShadowMaterial({opacity: 0.32})
      )
      shadowPlane.rotation.x = -Math.PI / 2
      shadowPlane.receiveShadow = true
      scene.add(shadowPlane)

      createAgent(scene)
    },

    onUpdate: () => {
      const delta = clock.getDelta()
      const elapsed = clock.elapsedTime
      const {camera} = XR8.Threejs.xrScene()

      if (!placementLocked) {
        placeAgentInFrontOfCamera(camera)
        agentAnchor.visible = true
      }

      agentAnchor.position.y = Math.sin(elapsed * 1.6) * 0.035
      agentAnchor.rotation.y += delta * 0.16
      if (agentMixer) agentMixer.update(delta)
    },
  }
}
