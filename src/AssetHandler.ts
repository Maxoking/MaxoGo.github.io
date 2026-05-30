export class AssetHandler {
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
}