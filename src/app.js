import {initScenePipelineModule} from './threejs-scene-init'
import * as THREE from 'three'

window.THREE = THREE

const buildHomePage = ({onViewAgent}) => {
  const home = document.createElement('main')
  home.className = 'home-page home-page--redesigned'
  home.innerHTML = `
    <div class="home-shell">
      <nav class="home-nav" aria-label="Main navigation">
        <a class="home-nav__brand" href="#top" aria-label="Walone AI Agent home">Walone AI Agent</a>
      </nav>
      <section class="hero-card" id="top" aria-labelledby="hero-title">
        <div class="hero-card__content">
          <p class="hero-card__eyebrow">AI Agent AR Experience</p>
          <h1 id="hero-title">Walone AI Agent</h1>
          <p class="hero-card__copy">Open AR View to meet the animated Walone AI Agent in your space.</p>
          <div class="hero-card__actions">
            <button class="hero-card__button" type="button" data-action="view-agent">View Agent</button>
          </div>
        </div>
        <div class="agent-preview" aria-hidden="true">
          <div class="agent-preview__halo"></div>
          <div class="agent-preview__bot">
            <span class="agent-preview__head"></span>
            <span class="agent-preview__body"></span>
          </div>
          <div class="agent-preview__shadow"></div>
        </div>
      </section>
    </div>
  `

  const launchAgent = () => {
    home.classList.add('home-page--exiting')
    window.setTimeout(() => {
      home.remove()
      onViewAgent()
    }, 420)
  }

  home.querySelector('[data-action="view-agent"]').addEventListener('click', launchAgent)
  document.body.prepend(home)
}

const buildAgentOverlay = () => {
  const panel = document.createElement('section')
  panel.className = 'agent-panel'
  panel.innerHTML = `
    <div class="agent-panel__header">
      <span class="agent-panel__status"></span>
      <div>
        <p class="agent-panel__eyebrow">AR View</p>
        <h1>Walone AI Agent</h1>
      </div>
    </div>
    <p class="agent-panel__copy">Move your phone slowly and view the animated agent in front of you.</p>
  `
  document.body.appendChild(panel)
}

const startAgentARView = () => {
  if (!window.XR8) {
    window.alert('AR View is still loading. Please try again in a moment.')
    return
  }

  buildAgentOverlay()
  document.body.classList.add('agent-ar-active')

  XR8.addCameraPipelineModules([
    XR8.GlTextureRenderer.pipelineModule(),
    XR8.Threejs.pipelineModule(),
    XR8.XrController.pipelineModule(),
    LandingPage.pipelineModule(),
    XRExtras.FullWindowCanvas.pipelineModule(),
    XRExtras.Loading.pipelineModule(),
    XRExtras.RuntimeError.pipelineModule(),
    initScenePipelineModule(),
  ])

  const canvas = document.getElementById('camerafeed')
  XR8.run({canvas})
}

const initializeApp = () => {
  buildHomePage({onViewAgent: startAgentARView})
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp, {once: true})
} else {
  initializeApp()
}
