"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class Pokemon {
    constructor(name, kp, atk, def, speed) {
        this.name = name;
        this.kp = kp;
        this.max_kp = kp;
        this.atk = atk;
        this.def = def;
        this.speed = speed;
        this.moves = [
            new Move("Tackle", 40, "Normal"),
            new Move("Aquaknarre", 60, "Wasser")
        ];
    }
    use_move(move, targetPkmn) {
        let dmg = move.power + this.atk - targetPkmn.def;
        targetPkmn.kp = Math.max(targetPkmn.kp - dmg, 0);
        console.log(targetPkmn.kp + "/" + targetPkmn.max_kp);
    }
    print() {
        console.log("Log: " + this.name);
        this.moves.forEach(element => {
            console.log(element.name);
        });
    }
}
class Move {
    constructor(name, power, pkm_type) {
        this.name = name;
        this.power = power;
        this.pkmn_type = pkm_type;
    }
}
class BattleState {
    enter() { }
    update() { }
    handleInput() { }
}
var Substate;
(function (Substate) {
    Substate[Substate["IDLE"] = 0] = "IDLE";
    Substate[Substate["ANIMATING"] = 1] = "ANIMATING";
})(Substate || (Substate = {}));
class PreloadState extends BattleState {
    enter() {
        showScene("preload");
    }
    handleInput() {
        if (keys[" "])
            stateMachine.setState(new BattleStart);
    }
}
class BattleStart extends BattleState {
    enter() {
        return __awaiter(this, void 0, void 0, function* () {
            showScene("battle-scene");
            const battleText = document.getElementById("battleText");
            stateMachine.lockInput();
            yield stateMachine.typeText(battleText, `Ein wildes ${pkmn2.name} erscheint!`);
            stateMachine.unlockInput();
        });
    }
    handleInput() {
        if (keys[" "])
            stateMachine.setState(new ChooseActionState);
    }
}
class ChooseActionState extends BattleState {
    enter() {
        return __awaiter(this, void 0, void 0, function* () {
            const battleText = document.getElementById("battleText");
            stateMachine.lockInput();
            yield stateMachine.typeText(battleText, `Was wird ${pkmn1.name} tun?`);
            stateMachine.unlockInput();
            this.setActionChoices();
        });
    }
    setActionChoices() {
        const choices = document.getElementById("choices");
        if (!choices)
            return;
        const fightBtn = document.createElement("button");
        fightBtn === null || fightBtn === void 0 ? void 0 : fightBtn.addEventListener("click", () => {
            choices.replaceChildren();
            stateMachine.setState(new ChooseMovesState);
        });
        fightBtn.className = "choice";
        fightBtn.textContent = "FIGHT";
        choices.replaceChildren(fightBtn);
    }
}
class ChooseMovesState extends BattleState {
    enter() {
        this.setChoices(pkmn1.moves);
    }
    setChoices(moves) {
        const choices = document.getElementById("choices");
        if (!choices)
            return;
        choices.replaceChildren(...moves.map(move => {
            const div = document.createElement("button");
            div === null || div === void 0 ? void 0 : div.addEventListener("click", () => {
                choices.replaceChildren();
                stateMachine.setState(new ProcessMovesState(move));
            });
            div.className = "choice";
            div.textContent = move.name;
            return div;
        }));
    }
}
class ProcessMovesState extends BattleState {
    constructor(playerMove) {
        super();
        this.movesFinished = false;
        this.substate = Substate.IDLE;
        this.playerMove = playerMove;
    }
    ;
    enter() {
        return __awaiter(this, void 0, void 0, function* () {
            this.determineEnemyMove();
            this.determineMoveOrder();
            const battleText = document.getElementById("battleText");
            stateMachine.lockInput();
            yield stateMachine.typeText(battleText, `${this.firstPokemon.name} setzt ${this.firstMove.name} ein!`);
            stateMachine.unlockInput();
            this.substate = Substate.ANIMATING;
        });
    }
    handleInput() {
        return __awaiter(this, void 0, void 0, function* () {
            if (keys[" "]) {
                const battleText = document.getElementById("battleText");
                if ((!this.movesFinished) && (this.substate === Substate.ANIMATING)) {
                    stateMachine.lockInput();
                    this.firstPokemon.use_move(this.firstMove, this.lastPokemon);
                    yield setPlayerHP((this.lastPokemon.kp / this.lastPokemon.max_kp) * 100);
                    stateMachine.unlockInput();
                    this.substate = Substate.IDLE;
                }
                else if ((!this.movesFinished) && (this.substate === Substate.IDLE)) {
                    stateMachine.lockInput();
                    yield stateMachine.typeText(battleText, `${this.lastPokemon.name} setzt ${this.lastMove.name} ein!`);
                    stateMachine.unlockInput();
                    this.substate = Substate.ANIMATING;
                    this.movesFinished = true;
                }
                else if ((this.movesFinished) && (this.substate === Substate.ANIMATING)) {
                    stateMachine.lockInput();
                    this.lastPokemon.use_move(this.lastMove, this.firstPokemon);
                    yield setEnemyHP((this.firstPokemon.kp / this.firstPokemon.max_kp) * 100);
                    stateMachine.unlockInput();
                    this.substate = Substate.IDLE;
                }
                else {
                    stateMachine.setState(new ChooseActionState);
                }
            }
        });
    }
    determineEnemyMove() {
        this.enemyMove = pkmn2.moves[0];
    }
    determineMoveOrder() {
        if (pkmn1.speed >= pkmn2.speed) {
            this.firstMove = this.playerMove;
            this.lastMove = this.enemyMove;
            this.firstPokemon = pkmn1;
            this.lastPokemon = pkmn2;
        }
        else {
            this.firstMove = this.enemyMove;
            this.lastMove = this.playerMove;
            this.firstPokemon = pkmn2;
            this.lastPokemon = pkmn1;
        }
    }
}
class BattleStateMachine {
    constructor() {
        this.inputLock = false;
        this.textSpeed = 40;
    }
    setState(state) {
        this.state = state;
        state.enter();
    }
    update() {
        this.state.update();
    }
    handleInput() {
        if (!this.inputLock)
            this.state.handleInput();
    }
    lockInput() {
        this.inputLock = true;
    }
    unlockInput() {
        this.inputLock = false;
    }
    typeText(element, text) {
        return new Promise(resolve => {
            element.textContent = "";
            let i = 0;
            const interval = setInterval(() => {
                element.textContent += text[i++];
                if (i >= text.length) {
                    clearInterval(interval);
                    resolve();
                }
            }, this.textSpeed);
        });
    }
}
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js");
}
const enemySpriteData = {
    x: 202,
    y: 48,
    xScale: 64,
    yScale: 64
};
const playerSpriteData = {
    x: 55.2,
    y: 126,
    xScale: 64,
    yScale: 64
};
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
const canvas = document.getElementById("myCanvas");
const ctx = canvas === null || canvas === void 0 ? void 0 : canvas.getContext("2d");
const battleBackgroundImage = new Image();
battleBackgroundImage.src = './assets/battleBackgroundGrass.png';
const BASE_WIDTH = 320;
const BASE_HEIGHT = 180;
canvas.width = BASE_WIDTH;
canvas.height = BASE_HEIGHT;
ctx.imageSmoothingEnabled = false;
const dialogBox = document.getElementById("dialogueBox");
//dialogBox.style.height = `${canvas.height / 4}px`;
const enemyImage = new Image();
enemyImage.src = './assets/sprites/1.png';
const playerImage = new Image();
playerImage.src = './assets/sprites/back/18.png';
const keys = {};
window.addEventListener("keydown", (e) => {
    keys[e.key] = true;
});
window.addEventListener("keyup", (e) => {
    keys[e.key] = false;
});
window.addEventListener("touchstart", (e) => {
    keys[" "] = true;
});
window.addEventListener("touchend", (e) => {
    keys[" "] = false;
});
// canvas.addEventListener("click", (e) => {
//   const rect = canvas.getBoundingClientRect();
//   const x = (e.clientX - rect.left) * (canvas.width / rect.width);
//   const y = (e.clientY - rect.top) * (canvas.height / rect.height);
//   playerSpriteData.x = x -  playerSpriteData.xScale / 2;
//   playerSpriteData.y = y - playerSpriteData.yScale / 2;
//   console.log("Canvas Position:", playerSpriteData.x, playerSpriteData.y);
// });
const stateMachine = new BattleStateMachine();
stateMachine.setState(new PreloadState());
const playerHpBar = document.getElementById("player-hp");
const enemyHpBar = document.getElementById("enemy-hp");
function updateBar(bar, value) {
    return new Promise(resolve => {
        const onEnd = (e) => {
            if (e.propertyName === "width") {
                bar.removeEventListener("transitionend", onEnd);
                resolve();
            }
        };
        bar.addEventListener("transitionend", onEnd);
        // trigger Animation
        bar.style.width = value + "%";
    });
}
function setPlayerHP(value) {
    return __awaiter(this, void 0, void 0, function* () {
        yield updateBar(playerHpBar, value);
    });
}
function setEnemyHP(value) {
    return __awaiter(this, void 0, void 0, function* () {
        yield updateBar(enemyHpBar, value);
    });
}
function scaleBattle() {
    const baseWidth = 1280;
    const baseHeight = (360 + 64) * 2;
    const battle = document.getElementById("battle");
    const textbox = document.getElementById("battle-textbox");
    const textbox_height = battle.clientHeight / 3;
    const scale = Math.min(window.innerWidth / battle.clientWidth, window.innerHeight / battle.clientHeight);
    textbox.style.height = `${textbox_height}px`;
}
// window.addEventListener("resize", scaleBattle);
// scaleBattle();
(() => __awaiter(void 0, void 0, void 0, function* () {
    const res = yield fetch("https://pokeapi.co/api/v2/pokemon-habitat/forest");
    const data = yield res.json();
    // data.habitates.forEach((habitat: { name: string }) => {
    //     console.log(habitat.name);
    // });
    console.log(data);
    console.log(data.pokemon_species.length);
}))();
// Start once images load
Promise.all([
    new Promise(res => battleBackgroundImage.onload = () => res()),
    new Promise(res => enemyImage.onload = () => res()),
    new Promise(res => playerImage.onload = () => res())
]).then(() => {
    draw();
});
function showScene(sceneId) {
    const scenes = document.getElementsByClassName("scene");
    Array.from(scenes).forEach(scene => {
        const htmlElement = scene;
        if (scene.id === sceneId) {
            htmlElement.style.display = "flex";
        }
        else {
            htmlElement.style.display = "none";
        }
    });
}
function draw() {
    ctx === null || ctx === void 0 ? void 0 : ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx === null || ctx === void 0 ? void 0 : ctx.drawImage(battleBackgroundImage, 0, 0, canvas.width, canvas.height);
    ctx === null || ctx === void 0 ? void 0 : ctx.drawImage(enemyImage, enemySpriteData.x, enemySpriteData.y, enemySpriteData.xScale, enemySpriteData.yScale);
    ctx === null || ctx === void 0 ? void 0 : ctx.drawImage(playerImage, playerSpriteData.x, playerSpriteData.y, playerSpriteData.xScale, playerSpriteData.yScale);
}
function loop() {
    stateMachine.handleInput();
    stateMachine.update();
    draw();
    requestAnimationFrame(loop);
}
showScene("preload");
loop();
