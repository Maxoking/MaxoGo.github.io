export class Pokemon {
    id!: number;
    name: string;
    level!: number;
    experience!: number;
    max_kp : number;
    kp: number;
    atk : number;
    def : number;
    speed : number;
    pkmn_type!: string;
    moves!: Move[];
    hp_bar?: HTMLDivElement;
    pokemon_data : any;

    constructor(pokemon_data : any, move_data : any, level : number = 1, experience : number = 0) {
        this.pokemon_data = pokemon_data;
        this.id = pokemon_data?.id;
        this.name = pokemon_data?.name;
        this.level = level;
        this.experience = experience;
        this.kp = pokemon_data?.stats.find((stat : any) => stat.stat.name === "hp")?.base_stat;
        this.max_kp = pokemon_data?.stats.find((stat : any) => stat.stat.name === "hp")?.base_stat;
        this.atk = pokemon_data?.stats.find((stat : any) => stat.stat.name === "attack")?.base_stat;
        this.def = pokemon_data?.stats.find((stat : any) => stat.stat.name === "defense")?.base_stat;
        this.speed = pokemon_data?.stats.find((stat : any) => stat.stat.name === "speed")?.base_stat;
        this.moves = [
            ...move_data.map((move: any) => new Move(move))
            ];
    }

    use_move(move : Move, targetPkmn : Pokemon) {
        let dmg = Math.max(move.power + this.atk - targetPkmn.def, 1);
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

    constructor(json : any) {
        this.name = json?.name;
        this.power = json?.power;
        this.pkmn_type = json?.type?.name;
    }

}