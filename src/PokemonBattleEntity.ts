export class Pokemon {
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

export class Move {
    name!: string;
    power!: number;
    pkmn_type!: string;

    constructor(name : string, power : number, pkm_type : string) {
        this.name = name;
        this.power = power;
        this.pkmn_type = pkm_type;
    }
}