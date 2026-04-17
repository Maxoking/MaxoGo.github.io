import * as L from "leaflet";
import "leaflet/dist/leaflet.css";

import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

import { SceneHandler, MapScene } from "./SceneHandler";
import { Pokemon, Move } from "./PokemonBattleEntity";
import { BattleStateMachine, BattleStart } from "./battlestatemachine";




if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js");
}

const enemySpriteData =
    {
        x:      202, 
        y:      48, 
        xScale: 64, 
        yScale: 64
    }
;

const playerSpriteData =
    {
        x:      55.2, 
        y:      126, 
        xScale: 64, 
        yScale: 64
    }
;

const pkmn1 = new Pokemon("Bisaflor", 100, 7, 6, 70);
pkmn1.moves = [
    new Move("Tackle", 40, "Normal"),
    new Move("Aquaknarre", 60, "Wasser")
    // new Move("Rasierblatt", 55, "Pflanze"),
    // new Move("Solarstrahl", 120, "Pflanze")
];

const pkmn2 = new Pokemon("Glurak", 150, 9, 5, 100);
pkmn2.moves = [
    new Move("Kratzer", 40, "Normal"),
    new Move("Glut", 60, "Feuer")
];
  

const canvas = document.getElementById("myCanvas") as HTMLCanvasElement;
const ctx = canvas?.getContext("2d");
const battleBackgroundImage = new Image();
battleBackgroundImage.src = './assets/battleBackgroundGrass.png';
const BASE_WIDTH = 320;
const BASE_HEIGHT = 180;

canvas.width = BASE_WIDTH;
canvas.height = BASE_HEIGHT;
ctx!.imageSmoothingEnabled = false;

const dialogBox = document.getElementById("dialogueBox") as HTMLBaseElement;
//dialogBox.style.height = `${canvas.height / 4}px`;


const enemyImage = new Image();
enemyImage.src = './assets/sprites/1.png';

const playerImage = new Image();
playerImage.src = './assets/sprites/back/18.png';

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

// canvas.addEventListener("click", (e) => {
//   const rect = canvas.getBoundingClientRect();

//   const x = (e.clientX - rect.left) * (canvas.width / rect.width);
//   const y = (e.clientY - rect.top) * (canvas.height / rect.height);

//   playerSpriteData.x = x -  playerSpriteData.xScale / 2;
//   playerSpriteData.y = y - playerSpriteData.yScale / 2;

//   console.log("Canvas Position:", playerSpriteData.x, playerSpriteData.y);
// });



// const stateMachine = new BattleStateMachine(pkmn1, pkmn2);
// stateMachine.setState(new BattleStart());

const playerHpBar = document.getElementById("player-hp") as HTMLDivElement;
const enemyHpBar = document.getElementById("enemy-hp") as HTMLDivElement;



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



// window.addEventListener("resize", scaleBattle);
// scaleBattle();


(async () => {
    const res = await fetch("https://pokeapi.co/api/v2/pokemon-habitat/forest");
    const data = await res.json();
    // data.habitates.forEach((habitat: { name: string }) => {
    //     console.log(habitat.name);
        
    // });
    console.log(data);
    console.log(data.pokemon_species.length);
})();

(async () => {
    const res = await fetch("https://pokeapi.co/api/v2/pokemon/charizard");
    const data = await res.json();
    // data.habitates.forEach((habitat: { name: string }) => {
    //     console.log(habitat.name);
        
    // });
    console.log(data);
    console.log(data.moves.length);
})();

// Start once images load
Promise.all([
  new Promise<void>(res => battleBackgroundImage.onload = () => res()),
  new Promise<void>(res => enemyImage.onload = () => res()),
  new Promise<void>(res => playerImage.onload = () => res())
]).then(() =>{
    draw();
});


function draw(): void {
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    ctx?.drawImage(battleBackgroundImage, 0, 0, canvas.width, canvas.height);
    ctx?.drawImage(enemyImage, enemySpriteData.x, enemySpriteData.y, enemySpriteData.xScale, enemySpriteData.yScale);
    ctx?.drawImage(playerImage, playerSpriteData.x, playerSpriteData.y, playerSpriteData.xScale, playerSpriteData.yScale);
}

function loop(): void {
  //scene_handler.handleInput(keys);  
  SceneHandler.getInstance().update();
  draw();
  requestAnimationFrame(loop);
}



SceneHandler.getInstance().showScene(new MapScene());
loop();


