import { Pokemon, Move } from "./PokemonBattleEntity";
import { MapScene, Scene, SceneHandler } from "./SceneHandler";


export class BattleStateMachine {
    
    private state! : BattleState;
    private inputLock : boolean = false;
    private textSpeed : number = 40;
    private player_pokemon : Pokemon;
    private enemy_pokemon : Pokemon;
    private player_hp_bar: HTMLDivElement;
    private enemy_hp_bar: HTMLDivElement;

    constructor(player_pokemon : Pokemon, enemy_pokemon : Pokemon) {
        this.player_pokemon = player_pokemon;
        this.enemy_pokemon = enemy_pokemon;
        this.player_hp_bar = document.getElementById("player-hp") as HTMLDivElement;
        this.enemy_hp_bar = document.getElementById("enemy-hp") as HTMLDivElement;
        this.setState(new BattleStart);
    }

    setState(state: BattleState) {
        this.state = state;
        state.state_machine = this;
        state.enter()
    }

    update() {
        this.state.update();
    }

    handleInput(keys: Record<string, boolean>) {
        if(!this.inputLock) this.state.handleInput(keys)
            else console.log("Input locked, ignoring input: ", keys);
    }

    end() {
        SceneHandler.getInstance().showScene(new MapScene());
    }

    lockInput() {
        this.inputLock = true;
    }

    unlockInput() {
        this.inputLock = false;
    }

    getPlayerPokemon(): Pokemon {
        return this.player_pokemon;
    }

    getEnemyPokemon(): Pokemon {
        return this.enemy_pokemon;
    }

    getPlayerHPBar(): HTMLDivElement {
        return this.player_hp_bar;
    }

    getEnemyHPBar(): HTMLDivElement {
        return this.enemy_hp_bar;
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


abstract class BattleState {
    state_machine!: BattleStateMachine;

    enter() {}
    update() {}
    handleInput(keys: Record<string, boolean>) {}
}

enum Substate {
    IDLE,
    ANIMATING
}


export class BattleStart extends BattleState {

    async enter(): Promise<void> {
        console.log("BattleStart enter");
        const battleText = document.getElementById("battleText") as HTMLParagraphElement;
        this.state_machine.lockInput();
        await this.state_machine.typeText(battleText, `Ein wildes ${this.state_machine.getEnemyPokemon().name} erscheint!`);
        this.state_machine.unlockInput();
    }

    handleInput(keys: Record<string, boolean>): void {
        console.log("BattleStart handleInput: ", keys);
        if (keys[" "]) this.state_machine.setState(new ChooseActionState);
    }
}

export class ChooseActionState extends BattleState {
    async enter(): Promise<void> {
        console.log("ChooseActionState enter");
        const battleText = document.getElementById("battleText") as HTMLParagraphElement;
        this.state_machine.lockInput();
        await this.state_machine.typeText(battleText,`Was wird ${this.state_machine.getPlayerPokemon().name} tun?`);
        this.state_machine.unlockInput();
        this.setActionChoices();
    }

    private setActionChoices() : void {
        const choices = document.getElementById("choices");
        if (!choices) return;

        const fightBtn = document.createElement("button");
        fightBtn?.addEventListener("click", () => {
                choices.replaceChildren();
                this.state_machine.setState(new ChooseMovesState);
            });
        fightBtn.className = "choice";
        fightBtn.textContent = "FIGHT";

        choices.replaceChildren(fightBtn);
    }  
}

export class ChooseMovesState extends BattleState {
    enter(): void {
        console.log("ChooseMovesState enter");
        this.setChoices(this.state_machine.getPlayerPokemon().moves);
    }

    private setChoices(moves: Move[]) {
        const choices = document.getElementById("choices");
        if (!choices) return;

        choices.replaceChildren(
            ...moves.map(move => {
                const div = document.createElement("button");
                div?.addEventListener("click", () => {
                    choices.replaceChildren();
                    this.state_machine.setState(new ProcessMovesState(move));
                });
                div.className = "choice";
                div.textContent = move.name;
                return div;
            })
        );
    }
}

export class ProcessMovesState extends BattleState {
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
        console.log("ProcessMovesState enter");
       
        this.determineEnemyMove();
        this.determineMoveOrder();

        const battleText = document.getElementById("battleText") as HTMLParagraphElement;
        this.state_machine.lockInput();
        await this.state_machine.typeText(battleText, `${this.firstPokemon.name} setzt ${this.firstMove.name} ein!`);
        this.state_machine.unlockInput();
        this.substate = Substate.ANIMATING;
    }

    async handleInput(keys: Record<string, boolean>): Promise<void> {
        if (keys[" "]) {
            

            console.log(this.substate, this.movesFinished);
            const battleText = document.getElementById("battleText") as HTMLParagraphElement;

            if (this.firstPokemon.kp === 0 || this.lastPokemon.kp === 0 ) {
                 this.state_machine.setState(new BattleEnd);
                 return;
            }
            
            if( (!this.movesFinished) && (this.substate === Substate.ANIMATING)) {
                this.state_machine.lockInput();
                this.firstPokemon.use_move(this.firstMove, this.lastPokemon);
                await this.setPlayerHP((this.lastPokemon.kp / this.lastPokemon.max_kp) * 100);
                this.state_machine.unlockInput();
                this.substate = Substate.IDLE;
            } else if( (!this.movesFinished) && (this.substate === Substate.IDLE) ) {
                this.state_machine.lockInput();
                await this.state_machine.typeText(battleText, `${this.lastPokemon.name} setzt ${this.lastMove.name} ein!`);
                this.state_machine.unlockInput();
                this.substate = Substate.ANIMATING;
                this.movesFinished = true;
            } else if( (this.movesFinished) && (this.substate === Substate.ANIMATING) ) {
                this.state_machine.lockInput();
                this.lastPokemon.use_move(this.lastMove, this.firstPokemon);
                await this.setEnemyHP((this.firstPokemon.kp / this.firstPokemon.max_kp) * 100);
                this.state_machine.unlockInput();
                this.substate = Substate.IDLE;
            } else {
                this.state_machine.setState(new ChooseActionState);
            }

        }
    }

    private determineEnemyMove() {
        this.enemyMove = this.state_machine.getEnemyPokemon().moves[0];
    }

    private determineMoveOrder() {
        if (this.state_machine.getPlayerPokemon().speed >= this.state_machine.getEnemyPokemon().speed) {
            this.firstMove = this.playerMove;
            this.lastMove = this.enemyMove;
            this.firstPokemon = this.state_machine.getPlayerPokemon();
            this.lastPokemon = this.state_machine.getEnemyPokemon();
        } else {
            this.firstMove = this.enemyMove;
            this.lastMove = this.playerMove;
            this.firstPokemon = this.state_machine.getEnemyPokemon();
            this.lastPokemon = this.state_machine.getPlayerPokemon();
        }
    }

    updateBar(bar: HTMLDivElement, value: number) : Promise<void> {
    return new Promise(resolve => {

        const onEnd = (e: TransitionEvent) => {
        if (e.propertyName === "width") {
            bar.removeEventListener("transitionend", onEnd);
            resolve();
            console.log("Transition ended, new width: ", bar.style.width);
        }
        };
    if (bar.style.width === `${value}%`) {
        resolve();
        return;
    }
    bar.addEventListener("transitionend", onEnd);

    // trigger Animation
    bar.style.width = value + "%";
  });
}

    async setPlayerHP(value: number) {
        await this.updateBar(this.state_machine.getPlayerHPBar(), value);
    }

    async setEnemyHP(value: number) {
        await this.updateBar(this.state_machine.getEnemyHPBar(), value);
    }
}

export class BattleEnd extends BattleState {
    async enter(): Promise<void> {
        console.log("BattleEnd enter");
        const battleText = document.getElementById("battleText") as HTMLParagraphElement;
        this.state_machine.lockInput();
        await this.state_machine.typeText(battleText, `Der Kampf ist vorbei!`);
        this.state_machine.unlockInput();
    }

    handleInput(keys: Record<string, boolean>): void {
        if (keys[" "]) {
            this.state_machine.end();
        }  
   }
}


