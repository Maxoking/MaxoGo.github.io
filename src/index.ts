import * as L from "leaflet";
import "leaflet/dist/leaflet.css";

import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

import { SceneHandler, MapScene } from "./SceneHandler";
import { Pokemon, Move } from "./PokemonBattleEntity";
import { BattleStateMachine, BattleStart } from "./battlestatemachine";
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


function scaleBattle() {
  const baseWidth = 1280;
  const baseHeight = (360 + 64) * 2;
  const battle = document.getElementById("battle")!;
  const textbox = document.getElementById("battle-textbox")!;
  const textbox_height = battle.clientHeight / 3;

  const scale = Math.min(
    window.innerWidth / battle.clientWidth,
    window.innerHeight / battle.clientHeight
  );

  textbox.style.height = `${textbox_height}px`;

}


function loop(): void {
  SceneHandler.getInstance().update();
  SceneHandler.getInstance().draw();
  requestAnimationFrame(loop);
}

console.log(TrainerDataHandler.loadTrainerData());
//SceneHandler.getInstance().showScene(new MapScene());
loop();


