
import { WebGLRenderer, Camera, PerspectiveCamera, Scene, Mesh, PlaneGeometry, TextureLoader, SRGBColorSpace, MeshBasicMaterial  } from 'three';
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";


export class ArRenderer {
  canvas: HTMLCanvasElement;  
  webgl_renderer: WebGLRenderer;
  gl: WebGLRenderingContext;

  // Accept a canvas and optional WebGL context to avoid relying on globals
  constructor() {
    console.log("ArRenderer constructor called");
    this.canvas = document.createElement("canvas");
    document.body.appendChild(this.canvas);
    const gl = this.canvas.getContext("webgl2", {xrCompatible: true});
    if (!gl) {
      throw new Error("Unable to create WebGL context.");
    }
    this.gl = gl;
    this.webgl_renderer = new WebGLRenderer({
      alpha: true,
      preserveDrawingBuffer: true,
      canvas: this.canvas,
      context: this.gl
    });

    console.log("WebGLRenderer created with canvas:", this.canvas, "and context:", this.gl);
    console.log("WebGLRenderer properties:", this.webgl_renderer);

    this.webgl_renderer.autoClear = false;
  }
}


export class ArScene {
    renderer: ArRenderer;
    session: XRSession | null = null;
    referenceSpace: XRReferenceSpace | null = null;
    viewerSpace: XRReferenceSpace | null = null;
    hitTestSource: XRHitTestSource | null = null;
    camera: Camera | null = null;
    scene: Scene = new Scene();
    plane: Mesh | null = null;
    playerPokenmonMesh: Mesh | null = null;
    enemyPokemonMesh: Mesh | null = null;
    reticle: Mesh | null = null;
    hitFloor: boolean = true;

    constructor() {
      console.log("ArScene constructor called");
      this.renderer = new ArRenderer();
              // The API directly updates the camera matrices.
      // Disable matrix auto updates so three.js doesn't attempt
      // to handle the matrices independently.
      const camera = new PerspectiveCamera();
      camera.matrixAutoUpdate = false;
      this.camera = camera;
    }

    async init() {
        if (!navigator.xr) {
            throw new Error("WebXR is not available in this browser.");
        }

        const xrSession = await navigator.xr.requestSession("immersive-ar", {
          requiredFeatures: ["hit-test", "dom-overlay"],
          domOverlay: { root: document.body }
        });

        this.session = xrSession;

        xrSession.updateRenderState({
          baseLayer: new XRWebGLLayer(xrSession, this.renderer.gl)
        });

      // A 'local' reference space has a native origin that is located
      // near the viewer's position at the time the session was created.
      this.referenceSpace = await xrSession.requestReferenceSpace('local');

      // Create another XRReferenceSpace that has the viewer as the origin.
      this.viewerSpace  = await xrSession.requestReferenceSpace('viewer');

      // Request a hit-test source using the viewer space we just obtained.
      this.hitTestSource = await xrSession.requestHitTestSource!({ space: this.viewerSpace })!;


      this.session.addEventListener("end", () => {
        console.log("XRSession ended. Clean Up resources.");
        this.hitTestSource?.cancel();

        this.hitTestSource = null;
        this.referenceSpace = null;
        this.viewerSpace = null;
        this.session = null;

        this.scene.clear();
        this.plane = null;
        this.playerPokenmonMesh = null;
        this.enemyPokemonMesh = null;
        this.reticle = null;
      });

  }

  public start(playerPokemonSprite: HTMLImageElement, enemyPokemonSprite: HTMLImageElement) {
    if (!this.session) {
      throw new Error("XRSession is not initialized. Call init() first.");
    }
      const loader = new TextureLoader();
      const texture = loader.load(enemyPokemonSprite.src);
      texture.colorSpace = SRGBColorSpace;
      const material = new MeshBasicMaterial({
                map: texture,
                transparent: true
      });
      const geometry = new PlaneGeometry( 0.5, 0.5 );
      const plane = new Mesh( geometry, material );
      plane.position.set(0, 0, 0);
      plane.visible = false; // Initially invisible until placed
      this.scene.add(plane);
      this.plane = plane;

      const playerTexture = loader.load(playerPokemonSprite.src);
      playerTexture.colorSpace = SRGBColorSpace;
      const playerMaterial = new MeshBasicMaterial({
        map: playerTexture,
        transparent: true
      });
      const playerGeometry = new PlaneGeometry( 0.5, 0.5 );
      const playerMesh = new Mesh( playerGeometry, playerMaterial );
      playerMesh.position.set(0, 0, 0);
      playerMesh.visible = false;
      this.scene.add(playerMesh);
      this.playerPokenmonMesh = playerMesh;

      const gltfloader = new GLTFLoader();
      
      gltfloader.load(
      "https://immersive-web.github.io/webxr-samples/media/gltf/reticle/reticle.gltf",
      (gltf) => {
        this.reticle = gltf.scene as any; // Object3D
        this.reticle!.visible = false;
        this.scene.add(this.reticle!);
      },
      undefined,
      (err) => console.error("GLTF load error:", err)
    );
    console.log("Starting AR session");
    this.session.requestAnimationFrame(this.onXRFrame);
  }

  public async endSession() {
    if (this.session) {
      await this.session.end();
    }
  }

  public addEnemyPokemonSprite(enemyImage: HTMLImageElement) {
    if (!this.plane) {
      console.error("Plane is not initialized. Cannot add enemy sprite.");
      return;
    }

    const material = new MeshBasicMaterial({
      map: new TextureLoader().load(enemyImage.src),
      transparent: true
    });
    this.plane.material = material;
  }


  // Create a render loop that allows us to draw on the AR view.
    /**
     * name
     */
    public onXRFrame = (time: DOMHighResTimeStamp, frame: XRFrame) => {
        const session = this.session;
        
        const referenceSpace = this.referenceSpace;
        const hitTestSource = this.hitTestSource;

        if (!session || !referenceSpace || !hitTestSource || !this.camera || !session.renderState || !session.renderState.baseLayer || !this.renderer) {
          console.log("One or more required XR frame properties are missing.");
          console.log("session:", session);
          console.log("referenceSpace:", referenceSpace);
          console.log("hitTestSource:", hitTestSource);
          console.log("camera:", this.camera);
          console.log("this.renderer:", this.renderer);
          return;
        }
        
        const renderer = this.renderer.webgl_renderer;
        const gl = this.renderer.gl;

        // Queue up the next draw request.
        session.requestAnimationFrame(this.onXRFrame);

        // Bind the graphics framebuffer to the baseLayer's framebuffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, session.renderState.baseLayer.framebuffer)

        // Retrieve the pose of the device.
        // XRFrame.getViewerPose can return null while the session attempts to establish tracking.
        const pose = frame.getViewerPose(referenceSpace);
        if (pose) {
          // In mobile AR, we only have one view.
          const view = pose.views[0];

          const viewport = session.renderState.baseLayer?.getViewport(view);
          if(viewport) {
            renderer.setSize(viewport.width, viewport.height)
          }

          // Use the view's transform matrix and projection matrix to configure the THREE.camera.
          this.camera.matrix.fromArray(view.transform.matrix)
          this.camera.projectionMatrix.fromArray(view.projectionMatrix);
          this.camera.updateMatrixWorld(true);

          if(this.hitFloor) {
            const hitTestResults = frame.getHitTestResults(hitTestSource);
            if (hitTestResults.length > 0 && this.reticle) {
              const hitPose = hitTestResults[0].getPose(referenceSpace);
              this.reticle.visible = true;
              this.reticle.position.set(hitPose!.transform.position.x, hitPose!.transform.position.y, hitPose!.transform.position.z);
              this.reticle.updateMatrixWorld(true);
            }
          }

          if (this.plane && view) {
            this.plane.lookAt(view.transform.position.x, view.transform.position.y, view.transform.position.z);
            this.plane.updateMatrixWorld(true);
          } else {
            console.log("Plane or view is not available for updating.");
          }

          if (this.playerPokenmonMesh && view) {
            this.playerPokenmonMesh.lookAt(view.transform.position.x, view.transform.position.y, view.transform.position.z);
            this.playerPokenmonMesh.updateMatrixWorld(true);
          }

          // Render the scene with THREE.WebGLRenderer.
          renderer.render(this.scene, this.camera!)
        }
      }


      getEnemyPokemonMesh(): Mesh | null {
        return this.plane;
      }

      getPlayerPokemonMesh(): Mesh | null {
        return this.playerPokenmonMesh;
      }


      public placeObjectAtReticle(mesh: Mesh) : boolean {
        if (this.reticle && mesh) {
          console.log("Placing object at reticle position:", this.reticle.position);
          mesh.position.copy(this.reticle.position);
          mesh.visible = this.reticle.visible; // Make the mesh visible when placed
          mesh.updateMatrixWorld(true);
          return this.reticle.visible; // Return true if the reticle is visible and the object was placed
        } else {
          console.log("Reticle or mesh is not available for placing object.");
          return false;
        }
      }

      public hideReticle() {
        if (this.reticle) {
          this.reticle.visible = false;
          this.hitFloor = false;
          console.log("Reticle hidden and hitFloor set to false.");
        }
      }
      // session.requestAnimationFrame(this.onXRFrame);
    
}