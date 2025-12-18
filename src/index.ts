
class Pokemon {
    name: string;
    max_kp : number;
    kp: number;
    atk : number;
    def : number;
    speed : number;
    pkmn_type!: string;
    moves!: Move[];
    
    constructor(name : string, kp : number, atk : number, def : number, speed : number) {
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

    use_move(move : Move, targetPkmn : Pokemon) {
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
    name!: string;
    power!: number;
    pkmn_type!: string;

    constructor(name : string, power : number, pkm_type : string) {
        this.name = name;
        this.power = power;
        this.pkmn_type = pkm_type;
    }
}

abstract class BattleState {
    enter() {}
    update() {}
    handleInput() {}

}

enum Substate {
    IDLE,
    ANIMATING
}

class BattleStart extends BattleState {

    async enter(): Promise<void> {
        const battleText = document.getElementById("battleText") as HTMLParagraphElement;
        stateMachine.lockInput();
        await stateMachine.typeText(battleText, `Ein wildes ${pkmn2.name} erscheint!`);
        stateMachine.unlockInput();
    }

    handleInput(): void {
        if (keys[" "]) stateMachine.setState(new ChooseActionState);
    }
}

class ChooseActionState extends BattleState {
    async enter(): Promise<void> {
        const battleText = document.getElementById("battleText") as HTMLParagraphElement;
        stateMachine.lockInput();
        await stateMachine.typeText(battleText,`Was wird ${pkmn1.name} tun?`);
        stateMachine.unlockInput();
        this.setActionChoices();
    }

    private setActionChoices() : void {
        const choices = document.getElementById("choices");
        if (!choices) return;

        const fightBtn = document.createElement("button");
        fightBtn?.addEventListener("click", () => {
                choices.replaceChildren();
                stateMachine.setState(new ChooseMovesState);
            });
        fightBtn.className = "choice";
        fightBtn.textContent = "FIGHT";

        choices.replaceChildren(fightBtn);
    }
}

class ChooseMovesState extends BattleState {
    enter() : void {
        this.setChoices(pkmn1.moves);
    }

    private setChoices(moves: Move[]) {
        const choices = document.getElementById("choices");
        if (!choices) return;

        choices.replaceChildren(
            ...moves.map(move => {
            const div = document.createElement("button");
            div?.addEventListener("click", () => {
                    choices.replaceChildren();
                    stateMachine.setState(new ProcessMovesState(move));
                });
            div.className = "choice";
            div.textContent = move.name;
                return div;
            })
        );
    } 
}

class ProcessMovesState extends BattleState {
        private enemyMove! : Move;
        private playerMove! : Move;
        private firstMove! : Move;
        private lastMove! : Move;
        private firstPokemon! : Pokemon;
        private lastPokemon! : Pokemon;

        private movesFinished : boolean = false;
        private substate : Substate = Substate.IDLE;

    constructor(playerMove : Move) {
        super();
        this.playerMove = playerMove;
    };

    async enter(): Promise<void> {
       
        this.determineEnemyMove();
        this.determineMoveOrder();

        const battleText = document.getElementById("battleText") as HTMLParagraphElement;
        stateMachine.lockInput();
        await stateMachine.typeText(battleText, `${this.firstPokemon.name} setzt ${this.firstMove.name} ein!`);
        stateMachine.unlockInput();
        this.substate = Substate.ANIMATING;
    }

    async handleInput(): Promise<void> {
        if (keys[" "]) {
            const battleText = document.getElementById("battleText") as HTMLParagraphElement;
            if( (!this.movesFinished) && (this.substate === Substate.ANIMATING)) {
                stateMachine.lockInput();
                this.firstPokemon.use_move(this.firstMove, this.lastPokemon);
                await setPlayerHP((this.lastPokemon.kp / this.lastPokemon.max_kp) * 100);
                stateMachine.unlockInput();
                this.substate = Substate.IDLE;
            } else if( (!this.movesFinished) && (this.substate === Substate.IDLE) ) {
                stateMachine.lockInput();
                await stateMachine.typeText(battleText, `${this.lastPokemon.name} setzt ${this.lastMove.name} ein!`);
                stateMachine.unlockInput();
                this.substate = Substate.ANIMATING;
                this.movesFinished = true;
            } else if( (this.movesFinished) && (this.substate === Substate.ANIMATING) ) {
                stateMachine.lockInput();
                this.lastPokemon.use_move(this.lastMove, this.firstPokemon);
                await setEnemyHP((this.firstPokemon.kp / this.firstPokemon.max_kp) * 100);
                stateMachine.unlockInput();
                this.substate = Substate.IDLE;
            } else {
                stateMachine.setState(new ChooseActionState);
            }

        }
    }

    private determineEnemyMove() {
        this.enemyMove = pkmn2.moves[0];
    }

    private determineMoveOrder() {
        if (pkmn1.speed >= pkmn2.speed) {
            this.firstMove = this.playerMove;
            this.lastMove = this.enemyMove;
            this.firstPokemon = pkmn1;
            this.lastPokemon = pkmn2;
        } else {
            this.firstMove = this.enemyMove;
            this.lastMove = this.playerMove;
            this.firstPokemon = pkmn2;
            this.lastPokemon = pkmn1;
        }
    }
}

class BattleStateMachine {
    private state! : BattleState;
    private inputLock : boolean = false;
    private textSpeed : number = 40;

    setState(state: BattleState) {
        this.state = state;
        state.enter()
    }

    update() {
        this.state.update();
    }

    handleInput() {
        if(!this.inputLock) this.state.handleInput();
    }

    lockInput() {
        this.inputLock = true;
    }

    unlockInput() {
        this.inputLock = false;
    }

    typeText(
        element: HTMLElement,
        text: string
    ): Promise<void> {
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

const enemySpriteData =
    {
        x:      1138, 
        y:      7, 
        xScale: 256, 
        yScale: 256
    }
;

const playerSpriteData =
    {
        x:      233, 
        y:      88, 
        xScale: 512, 
        yScale: 512
    }
;

const pkmn1 = new Pokemon("Bisaflor", 100, 7, 6, 70);
pkmn1.moves = [
    new Move("Tackle", 40, "Normal"),
    new Move("Aquaknarre", 60, "Wasser")
];

const pkmn2 = new Pokemon("Glurak", 150, 9, 5, 100);
pkmn2.moves = [
    new Move("Kratzer", 40, "Normal"),
    new Move("Glut", 60, "Feuer")
];
  

const canvas = document.getElementById("myCanvas") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const ctx = canvas?.getContext("2d");
const battleBackgroundImage = new Image();
battleBackgroundImage.src = './assets/battleBackground.png';

const dialogBox = document.getElementById("dialogueBox") as HTMLBaseElement;
dialogBox.style.height = `${canvas.height / 4}px`;


const enemyImage = new Image();
enemyImage.src = './assets/sprites/6.png';

const playerImage = new Image();
playerImage.src = './assets/sprites/back/3.png';

const keys: Record<string, boolean> = {};
window.addEventListener("keydown", (e: KeyboardEvent) => {
  keys[e.key] = true;
});

window.addEventListener("keyup", (e: KeyboardEvent) => {
  keys[e.key] = false;
});


const stateMachine = new BattleStateMachine();
stateMachine.setState(new BattleStart);

const playerHpBar = document.getElementById("player-hp") as HTMLDivElement;
const enemyHpBar = document.getElementById("enemy-hp") as HTMLDivElement;


function updateBar(bar: HTMLDivElement, value: number) : Promise<void> {
  return new Promise(resolve => {
    const onEnd = (e: TransitionEvent) => {
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

async function setPlayerHP(value: number) {
  await updateBar(playerHpBar, value);
}

async function setEnemyHP(value: number) {
  await updateBar(enemyHpBar, value);
}



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
  stateMachine.handleInput();  
  stateMachine.update();
  draw();
  requestAnimationFrame(loop);
}

loop();


