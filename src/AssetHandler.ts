import { element } from "three/src/nodes/TSL.js";

export class AssetHandler {
    static pokemonSpeciesData : any = null;
    static habitats : any = null;

    static async loadPokemonSpeciesGen1() : Promise<any> {
            if (this.pokemonSpeciesData) {
                console.log("Using cached Pokémon species data for Generation 1");
                return this.pokemonSpeciesData;
            } else {
                console.log("Fetching Pokémon species data for Generation 1 from API");
                try {
                    const response = await fetch("https://pokeapi.co/api/v2/generation/1");
                    const data = await response.json();
                    if(!response.ok) {
                        throw new Error(`Failed to fetch Pokémon species data for Generation 1: ${response.statusText}`);
                    }
                    this.pokemonSpeciesData = data;
                    return data;
                } catch (error) {
                    console.error('Error fetching Pokémon species data for Generation 1:', error);
                    throw error;
                }
            }
    }

    static async getRandomPokemonData(minLevel: number, maxLevel: number, ) : Promise<any> {
        //console.log(`Getting random Pokémon data between levels ${minLevel} and ${maxLevel}`);
        const randomLevel = Math.floor(Math.random() * (maxLevel - minLevel + 1)) + minLevel;
        const speciesData = await this.loadPokemonSpeciesGen1();
        const randomSpecies = await this.loadPokemonSpeciesFromUrl(speciesData.pokemon_species[Math.floor(Math.random() * speciesData.pokemon_species.length)].url);
        //console.log(randomSpecies);
        const pokemon_data = await this.loadPokemonDataFromName(randomSpecies.name);
        pokemon_data.level = randomLevel;
        pokemon_data.species = randomSpecies;
        pokemon_data.name = randomSpecies?.names.find((n: any) => n.language.name === "de")?.name || pokemon_data?.name;
        // console.log(`Random Pokémon: ${pokemon_data.name} at level ${randomLevel}`);
        // console.log(`Random Pokémon data:`, pokemon_data);
        let moves_data;
        const move = pokemon_data.moves.filter((v: any) =>
            v.version_group_details?.some(
                (d: any) => d?.version_group.name === "red-blue" && d?.move_learn_method.name === "level-up" && d?.level_learned_at <= randomLevel
                )
            );

            //console.log(move.slice(-4));
            moves_data = await Promise.all(move.slice(-4).map((v: any) => fetch(v.move.url).then(res => res.json())));
            //console.log("Known moves: ", moves_data);
        return {pokemon_data, moves_data};
    }

    static async loadPokemonBattleDataFromSpecies(pokemon : {name: string, url: string}, level:number) {
        const pokemon_data = await this.loadPokemonDataFromName(pokemon.name);
        const species_data = await this.loadPokemonSpeciesFromUrl(pokemon.url);
        pokemon_data.level = level;
        pokemon_data.species = species_data;
        pokemon_data.name = pokemon.name;
        console.log(pokemon_data);
        pokemon_data.name = species_data?.names.find((n: any) => n.language.name === "de")?.name || pokemon?.name;
        let moves_data;
        const move = pokemon_data.moves.filter((v: any) =>
            v.version_group_details?.some(
                (d: any) => d?.version_group.name === "red-blue" && d?.move_learn_method.name === "level-up" && d?.level_learned_at <= level
                )
            );

        moves_data = await Promise.all(move.slice(-4).map((v: any) => fetch(v.move.url).then(res => res.json())));
        return {pokemon_data, moves_data};
    }

    static async loadPokemonData(pokemonId : number) : Promise<any> {
        try {
            const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch Pokémon data for ID ${pokemonId}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching Pokémon data:', error);
            throw error;
        }
    }

    static async loadPokemonDataFromName(name : string) : Promise<any> {
        try {
            const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch Pokémon data for name ${name}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching Pokémon data:', error);
            throw error;
        }
    }

    static async loadPokemonSpeciesFromUrl(url : string) : Promise<any> {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch Pokémon species data from URL ${url}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching Pokémon species data:', error);
            throw error;
        }
    }

    static async loadMoveData(moveId : number) : Promise<any> {
        try {
            const response = await fetch(`https://pokeapi.co/api/v2/move/${moveId}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch move data for ID ${moveId}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching move data:', error);
            throw error;
        }
    }

    static async loadPokemonEnemySprite(pokemon_id : number) : Promise<HTMLImageElement> {
        const src = `./assets/sprites/${pokemon_id}.png`;
        return AssetHandler.loadImage(src);
    }

    static async loadPokemonPlayerSprite(pokemon_id : number) : Promise<HTMLImageElement> {
        const src = `./assets/sprites/back/${pokemon_id}.png`;
        return AssetHandler.loadImage(src);
    }

    static async loadImage(src : string) : Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = src;
            });
    }

    static async loadHabitats() : Promise<any> {
        if(this.habitats) {
            console.log("Using cached Habitat Data");
            return this.habitats;
        } else {
            try {
                console.log("Fetching Habitat data");
                const response = await fetch(`https://pokeapi.co/api/v2/pokemon-habitat`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch Habitat data`);
                }
                const data = await response.json();
                var habitat_data;
                habitat_data = await Promise.all(data.results.map((v: any) => fetch(v.url).then(res => res.json())));
                var species_data = await this.loadPokemonSpeciesGen1();

                //filter habitats with gen1 data
                for (const index in habitat_data) {
                    const habitat = habitat_data[index];
                    habitat_data[index].pokemon_species = habitat_data[index].pokemon_species.filter((habitat_species: { name: string; }) => species_data.pokemon_species.some((gen_species: { name: string; }) => 
                        habitat_species.name === gen_species.name
                    ));
                }
                
                console.log("Filtered DATA");
                console.log(habitat_data);
                this.habitats = habitat_data;
                return habitat_data;
            } catch (error) {
                console.error('Error fetching Habitat ', error);
                throw error;
            }
        }
    }

    static getHabitatData(name : string) {
        if(!this.habitats) return null;
        return this.habitats.find((habitat: { name: string; }) => habitat.name === name);
    }
}