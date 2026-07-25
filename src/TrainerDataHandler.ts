export class TrainerDataHandler {

    static saveLastPosition(x : number, y : number) {
        localStorage.setItem("last_position", JSON.stringify({x, y}));
    }

    static loadLastPosition() : {x: number, y: number} | null {
        const data = localStorage.getItem("last_position");
        return data ? JSON.parse(data) : null;
    }

    static lastPositionExists() : boolean {
        return localStorage.getItem("last_position") !== null;
    }

    static saveTrainerData(trainer_data : any) {
        localStorage.setItem("trainer_data", JSON.stringify(trainer_data));
    }

    static loadTrainerData() : any {
        const data = localStorage.getItem("trainer_data");
        return data ? JSON.parse(data) : null;
    }

    static getCurrentTeam() : any[] {
        const trainer_data = this.loadTrainerData();
        return trainer_data ? trainer_data.pokemon_team : [];
    }


    static clearTrainerData() {
        localStorage.removeItem("trainer_data");
    }

    static trainerDataExists() : boolean {
        return localStorage.getItem("trainer_data") !== null;
    }


    static initializeTrainerData(pokemon_data : any, moves_data : any) {
        const trainer_data =  {
                    trainer_name : "Max",
                    pokemon_team : [{
                        position : 1,
                        level : 1,
                        experience: 0,
                        current_hp : pokemon_data.stats.find((stat : any) => stat.stat.name === "hp")?.base_stat,
                        pokemon_data : pokemon_data,
                        moves_data : moves_data
                    }
                    ]
                };
        this.saveTrainerData(trainer_data);
    }
}