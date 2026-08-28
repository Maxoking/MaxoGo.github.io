
import { SceneHandler, MapScene, BattleSceneVR } from "./SceneHandler";
import { TrainerDataHandler } from "./TrainerDataHandler";

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js");
}


const canvas = document.getElementById("myCanvas") as HTMLCanvasElement;
const ctx = canvas?.getContext("2d");
const BASE_WIDTH = 320;
const BASE_HEIGHT = 180;

canvas.width = BASE_WIDTH;
canvas.height = BASE_HEIGHT;
ctx!.imageSmoothingEnabled = false;


const keys: Record<string, boolean> = {};
window.addEventListener("keydown", (e: KeyboardEvent) => {
  keys[e.key] = true;
  SceneHandler.getInstance().handleInput(keys);
});

window.addEventListener("keyup", (e: KeyboardEvent) => {
  keys[e.key] = false;
  SceneHandler.getInstance().handleInput(keys);
});

window.addEventListener("touchstart", (e: TouchEvent) => {
  keys[" "] = true;
  SceneHandler.getInstance().handleInput(keys);
});

window.addEventListener("touchend", (e: TouchEvent) => {
  keys[" "] = false;
  SceneHandler.getInstance().handleInput(keys);
});



function loop(): void {
  SceneHandler.getInstance().update();
  SceneHandler.getInstance().draw();
  requestAnimationFrame(loop);
}

console.log(TrainerDataHandler.loadTrainerData());
SceneHandler.getInstance().showScene(new MapScene());
loop();


