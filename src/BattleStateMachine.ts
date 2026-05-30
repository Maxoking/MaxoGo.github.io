import { AssetHandler } from "./AssetHandler";
import { Pokemon, Move } from "./PokemonBattleEntity";
import { BattleScene, MapScene, Scene, SceneHandler } from "./SceneHandler";
import { TrainerDataHandler } from "./TrainerDataHandler";


export class BattleStateMachine {
    
    private battle_scene!: BattleScene;
    private state! : BattleState;
    private inputLock : boolean = false;
    private textSpeed : number = 40;
    private current_pokemon_position : number = 1;
    private player_pokemon : Pokemon;
    private enemy_pokemon : Pokemon;
    private player_hp_bar: HTMLDivElement;
    private enemy_hp_bar: HTMLDivElement;
    private xp_bar: HTMLDivElement;
    private player_pokemon_name_element: HTMLElement | null;
    private player_pokemon_level_element: HTMLElement | null
    private enemy_pokemon_name_element: HTMLElement | null;
    private enemy_pokemon_level_element: HTMLElement | null;

    constructor(battle_scene : BattleScene, trainer_data : any, enemy_pokemon : Pokemon) {
        this.battle_scene = battle_scene;
        const start_pokemon_entry = trainer_data.pokemon_team.find((p: any) => p.position === 1);
        this.player_pokemon = new Pokemon(start_pokemon_entry.pokemon_data, start_pokemon_entry.moves_data, start_pokemon_entry.level, start_pokemon_entry.experience);
        this.enemy_pokemon = enemy_pokemon;
        this.player_hp_bar = document.getElementById("player-hp") as HTMLDivElement;
        this.enemy_hp_bar = document.getElementById("enemy-hp") as HTMLDivElement;
        this.xp_bar = document.getElementById("player-xp") as HTMLDivElement;
        this.player_pokemon_name_element = document.getElementById("player-name");
        this.player_pokemon_level_element = document.getElementById("player-level");
        this.enemy_pokemon_name_element = document.getElementById("enemy-name");
        this.enemy_pokemon_level_element = document.getElementById("enemy-level");

    
        this.player_pokemon.hp_bar = this.player_hp_bar;
        this.enemy_pokemon.hp_bar = this.enemy_hp_bar;
        this.setupDivs();
        this.setupBars();
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

    setPlayerPokemon(team_entry: any) {
        this.player_pokemon = new Pokemon(team_entry.pokemon_data, team_entry.moves_data, team_entry.level, team_entry.experience);
        this.player_pokemon.hp_bar = this.player_hp_bar;
        this.current_pokemon_position = team_entry.position;
    }

    setPlayerSprite(sprite: HTMLImageElement) {
        this.battle_scene.playerImage = sprite;
    }

    setEnemySprite(sprite: HTMLImageElement) {
        this.battle_scene.enemyImage = sprite;
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

    getXPBar(): HTMLDivElement {
        return this.xp_bar;
    }

    setupDivs() {
         if (this.player_pokemon_name_element) {
            this.player_pokemon_name_element.innerText = this.player_pokemon.name;
        }

        if (this.player_pokemon_level_element) {
            this.player_pokemon_level_element.innerText = "Lv" + this.player_pokemon.level;
        }

        if (this.enemy_pokemon_name_element) {
            this.enemy_pokemon_name_element.innerText = this.enemy_pokemon.name;
        }

        if (this.enemy_pokemon_level_element) {
            this.enemy_pokemon_level_element.innerText = "Lv" + this.enemy_pokemon.level;
        }
    }

    setupBars() {
        this.player_hp_bar.style.width = "${this.player_pokemon.hp / this.player_pokemon.max_hp * 100}%";
        this.enemy_hp_bar.style.width = "${this.enemy_pokemon.hp / this.enemy_pokemon.max_hp * 100}%";
        this.xp_bar.style.width = "${this.player_pokemon.exp}%";
    };

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

        const pkmnBtn = document.createElement("button");
        pkmnBtn.className = "choice";
        pkmnBtn.textContent = "PKMN";
        pkmnBtn?.addEventListener("click", () => {
            choices.replaceChildren();
            this.state_machine.setState(new SwitchPokemonState);
        });

        const pokeballBtn = document.createElement("button");
        pokeballBtn.className = "choice";
        pokeballBtn.textContent = "BALL";
        pokeballBtn?.addEventListener("click", () => {
            choices.replaceChildren();
            this.state_machine.setState(new CatchPokemon);
        });
        

        choices.replaceChildren(fightBtn, pkmnBtn, pokeballBtn);
    }  
}

export class SwitchPokemonState extends BattleState {
    private switch_finished : boolean = false;

    async enter(): Promise<void> {
        console.log("SwitchPokemonState enter");
    }

    async handleInput(keys: Record<string, boolean>): Promise<void> {
        if (keys[" "]) {
            const trainer_data = TrainerDataHandler.loadTrainerData();
            if (trainer_data && trainer_data.pokemon_team.length > 1) {
                if(!this.switch_finished) {
                const battleText = document.getElementById("battleText") as HTMLParagraphElement;
                    this.state_machine.lockInput();
                    await this.state_machine.typeText(battleText, `Du schickst ${trainer_data.pokemon_team[1].pokemon_data.name} in den Kampf!`);
                    await AssetHandler.loadPokemonPlayerSprite(trainer_data.pokemon_team[1].pokemon_data.id).then(sprite => {
                        this.state_machine.setPlayerSprite(sprite);
                        this.state_machine.setPlayerPokemon(trainer_data.pokemon_team[1]);
                        this.state_machine.setupDivs();
                        this.state_machine.setupBars();
                        this.state_machine.unlockInput();
                    });
                    this.switch_finished = true;
                } else {
                    this.state_machine.setState(new ChooseActionState);
                }
            } else {
                    const battleText = document.getElementById("battleText") as HTMLParagraphElement;
                    this.state_machine.lockInput();
                    await this.state_machine.typeText(battleText, `Du hast kein anderes Pokemon!`);
                    this.state_machine.unlockInput();
            }
        }
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
                await this.state_machine.updateBar(this.lastPokemon.hp_bar!, (this.lastPokemon.kp / this.lastPokemon.max_kp) * 100);
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
                await this.state_machine.updateBar(this.firstPokemon.hp_bar!, (this.firstPokemon.kp / this.firstPokemon.max_kp) * 100);
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

        if(this.firstPokemon === this.state_machine.getPlayerPokemon()) {
            console.log("Player goes first");
        } else {
            console.log("Enemy goes first");
        }
    }

 

    async setPlayerHP(value: number) {
        await this.state_machine.updateBar(this.state_machine.getPlayerHPBar(), value);
    }

    async setEnemyHP(value: number) {
        await this.state_machine.updateBar(this.state_machine.getEnemyHPBar(), value);
    }
}

export class CatchPokemon extends BattleState {
    private catch_rate = 0.5; // 50% chance to catch
    private caught : boolean = false;
    private end_catch_sequence : boolean = false;

    async enter(): Promise<void> {
        console.log("CatchPokemon enter");
        
        const battleText = document.getElementById("battleText") as HTMLParagraphElement;
        this.state_machine.lockInput();
        await this.state_machine.typeText(battleText, `Du wirfst einen Pokeball!`);
        this.state_machine.unlockInput();
        this.caught = Math.random() < this.catch_rate;
    }

    async handleInput(keys: Record<string, boolean>): Promise<void> {
        if (keys[" "]) {
            if(this.end_catch_sequence) {
                if(this.caught) {
                    const trainer_data = TrainerDataHandler.loadTrainerData();
                    trainer_data.pokemon_team.push({
                        position : trainer_data.pokemon_team.length + 1,
                        level : this.state_machine.getEnemyPokemon().level,
                        experience : 0,
                        current_hp : this.state_machine.getEnemyPokemon().kp,
                        pokemon_data : this.state_machine.getEnemyPokemon().pokemon_data,
                        moves_data : this.state_machine.getEnemyPokemon().moves
                    });
                    TrainerDataHandler.saveTrainerData(trainer_data);
                    this.state_machine.end();
                } else {
                    this.state_machine.setState(new ChooseActionState);
                }
            } else if (this.caught) {
                const battleText = document.getElementById("battleText") as HTMLParagraphElement;
                this.state_machine.lockInput();
                await this.state_machine.typeText(battleText, `Glückwunsch! Du hast ${this.state_machine.getEnemyPokemon().name} gefangen!`);
                this.state_machine.unlockInput();
                this.end_catch_sequence = true;
            } else {
                const battleText = document.getElementById("battleText") as HTMLParagraphElement;
                this.state_machine.lockInput();
                await this.state_machine.typeText(battleText, `${this.state_machine.getEnemyPokemon().name} konnte sich befreien!`);
                this.state_machine.unlockInput();
                this.end_catch_sequence = true;    
            }
        }
    }
}

export class BattleEnd extends BattleState {
    private player_won! : boolean;

    async enter(): Promise<void> {
        console.log("BattleEnd enter");
        const battleText = document.getElementById("battleText") as HTMLParagraphElement;
        this.state_machine.lockInput();
            if(this.state_machine.getPlayerPokemon().kp === 0) {
                await this.state_machine.typeText(battleText, `${this.state_machine.getPlayerPokemon().name} wurde besiegt!`);
                this.player_won = false;
            } else {
                await this.state_machine.typeText(battleText, `${this.state_machine.getEnemyPokemon().name} wurde besiegt!`);
                this.player_won = true;
            }
        this.state_machine.unlockInput();
    }

    handleInput(keys: Record<string, boolean>): void {
        if (keys[" "]) {
            if(this.player_won) {  
                this.state_machine.setState(new BattleExperienceGain);
            } else {
                this.state_machine.end();
            }
        }  
   }
}


export class BattleExperienceGain extends BattleState {
    animation_finished : boolean = false;
    experience_gained : number = 50;
    async enter(): Promise<void> {
        console.log("BattleExperienceGain enter");
        this.state_machine.getPlayerPokemon().experience += this.experience_gained;
        const battleText = document.getElementById("battleText") as HTMLParagraphElement;
        this.state_machine.lockInput();
        await this.state_machine.typeText(battleText, `${this.state_machine.getPlayerPokemon().name} erhält ${this.experience_gained} Erfahrungspunkte!`);
        this.state_machine.unlockInput();
        
    }

    async handleInput(keys: Record<string, boolean>): Promise<void> {
        if (keys[" "]) {
            if(!this.animation_finished) {
                this.state_machine.lockInput();
                await this.state_machine.updateBar(this.state_machine.getXPBar(), Math.min(this.state_machine.getPlayerPokemon().experience, 100));
                 if (this.state_machine.getPlayerPokemon().experience >= 100) {
                    this.state_machine.getPlayerPokemon().level += 1;
                    this.state_machine.getPlayerPokemon().experience = this.state_machine.getPlayerPokemon().experience - 100;
                    console.log(`${this.state_machine.getPlayerPokemon().name} leveled up to level ${this.state_machine.getPlayerPokemon().level}!`);
                }
                this.animation_finished = true;
                this.state_machine.unlockInput();
            } else {
                const trainer_data = TrainerDataHandler.loadTrainerData();
                const player_pokemon_data = trainer_data.pokemon_team[0];
                if (player_pokemon_data) {
                    console.log("Adding experience to player pokemon");
                    player_pokemon_data.experience = this.state_machine.getPlayerPokemon().experience;
                    player_pokemon_data.level = this.state_machine.getPlayerPokemon().level;
                    player_pokemon_data.current_hp = this.state_machine.getPlayerPokemon().kp;
                    TrainerDataHandler.saveTrainerData(trainer_data);
                } else {
                    console.error("No player pokemon data found in localStorage");
                }
                this.state_machine.end();
            }
        }

    }
}

