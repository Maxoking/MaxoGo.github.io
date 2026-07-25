

import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import "@maplibre/maplibre-gl-leaflet";


import { Pokemon, Move } from "./PokemonBattleEntity";
import { BattleStateMachine } from "./BattleStateMachine";
import { TrainerDataHandler } from "./TrainerDataHandler";
import { AssetHandler } from "./AssetHandler";
import { ArScene } from "./ArRenderer";
import { WorldGrid } from "./WorldGrid";

declare const AFRAME: any;

export class SceneHandler {
    static instance: SceneHandler;
    static getInstance(): SceneHandler {
        if (!SceneHandler.instance) {
            SceneHandler.instance = new SceneHandler();
        }     
        return SceneHandler.instance;
    }

    current_scene!: Scene;      

    showScene(scene: Scene) {
        this.current_scene = scene;
        scene.show();
    }

    handleInput(keys: Record<string, boolean>) {
        // Handle global input if needed
        console.log("SceneHandler received input: ", keys);
        this.current_scene.handleInput(keys);
    }

    update() {
        // Handle global updates if needed
        this.current_scene.update();
    }

    draw() {
        this.current_scene.draw();
    }
}

export abstract class Scene {


    scene_id!: string;


    constructor() {
        
        console.log("Scene created");
    }

    init() {
        console.log("Scene initialized");

    }

    handleInput(keys: Record<string, boolean>) {
        // Handle scene-specific input if needed
    }

    show() {
        const scenes = document.getElementsByClassName("scene");

        Array.from(scenes).forEach(scene => {
            const htmlElement = scene as HTMLElement;
            if (scene.id === this.scene_id) {
                htmlElement.style.display = "flex";
            } else {
                htmlElement.style.display = "none";
            }
        });

        this.init();
    }

    update() {
        // Handle scene-specific updates if needed
    }

    draw() {
        // Handle scene-specific drawing if needed

    }
}


export class BattleSceneVR extends Scene {
    scene_id = "battle-scene-vr";
    battle_state_machine!: BattleStateMachine;
    enemy_pokemon!: Pokemon;
    player_pokemon!: Pokemon;
    player_team!: any;
    ar_scene!: ArScene;

    constructor(trainer_data : any, enemy_pokemon : Pokemon) {
        super();
        console.log("BattleSceneVR constructor called");
        this.ar_scene = new ArScene();
        this.player_team = trainer_data.pokemon_team;
        this.player_pokemon = new Pokemon(trainer_data.pokemon_team[0].pokemon_data, trainer_data.pokemon_team[0].moves_data);
        this.enemy_pokemon = enemy_pokemon;
        this.battle_state_machine = new BattleStateMachine(this, trainer_data, enemy_pokemon);

    }

    async init() {
        console.log("BattleSceneVR initialized");
        const ui = document.getElementById("battle-vr-ui") as HTMLDivElement;
        ui.style.display = "block";


         try {
                await this.ar_scene.init();
                this.ar_scene.start(await AssetHandler.loadPokemonPlayerSprite(this.player_pokemon.id), await AssetHandler.loadPokemonEnemySprite(this.enemy_pokemon.id));
                
            } catch (error) {
                console.error("Error starting AR session:", error);
            }
    }

    async endSession() {
        await this.ar_scene.endSession();
    }

    handleInput(keys: Record<string, boolean>): void {
        console.log("BattleSceneVR received input: ", keys);
        this.battle_state_machine.handleInput(keys);
    }


    tryToPlacePokemonInAR() : boolean {
        return this.ar_scene.placeObjectAtReticle(this.ar_scene.getEnemyPokemonMesh()!);
    }

    tryToPlacePlayerPokemonInAR() : boolean {
        return this.ar_scene.placeObjectAtReticle(this.ar_scene.getPlayerPokemonMesh()!);
    }

    hideReticle() {
        this.ar_scene.hideReticle();
    }
}


export class BattleScene extends Scene {
    scene_id = "battle-scene";
    battle_state_machine!: BattleStateMachine;

    enemy_pokemon!: Pokemon;
    player_pokemon!: Pokemon;
    player_team!: any;
    canvas!: HTMLCanvasElement;
    ctx!: CanvasRenderingContext2D;
    battleBackgroundImage!: HTMLImageElement;
    enemyImage!: HTMLImageElement;
    playerImage!: HTMLImageElement;

    enemySpriteData =
    {
        x:      202, 
        y:      48, 
        xScale: 64, 
        yScale: 64
    };

    playerSpriteData =
    {
        x:      55.2, 
        y:      126, 
        xScale: 64, 
        yScale: 64
    };

    
    async init() {
        console.log("BattleScene initialized");
        this.canvas = document.getElementById("myCanvas") as HTMLCanvasElement;
        this.ctx = this.canvas?.getContext("2d")!;
        this.battleBackgroundImage = new Image();
        this.enemyImage = new Image();
        this.playerImage = new Image();
    

        this.canvas = document.getElementById("myCanvas") as HTMLCanvasElement;
        this.ctx = this.canvas.getContext("2d")!;

    [
        this.battleBackgroundImage,
        this.enemyImage,
        this.playerImage
    ] = await Promise.all([
        AssetHandler.loadImage('./assets/battleBackgroundGrass.png'),
        AssetHandler.loadPokemonEnemySprite(this.enemy_pokemon.id),
        AssetHandler.loadPokemonPlayerSprite(this.player_pokemon.id)
    ]);

    console.log("All battle images loaded");

    // this.draw();

    }
    
    constructor(trainer_data : any, enemy_pokemon : Pokemon) {
        super();
        console.log("BattleScene constructor called");
        console.log(trainer_data);
        //console.log("BattleScene created with " + trainer_data.pokemon_team[0].pokemon_data.name + " and " + enemy_pokemon.name);
        this.player_team = trainer_data.pokemon_team;
        this.player_pokemon = new Pokemon(trainer_data.pokemon_team[0].pokemon_data, trainer_data.pokemon_team[0].moves_data);
        this.enemy_pokemon = enemy_pokemon;
        this.battle_state_machine = new BattleStateMachine(this, trainer_data, enemy_pokemon);
    } 

    handleInput(keys: Record<string, boolean>): void {
        this.battle_state_machine.handleInput(keys);
    }

    draw() {
        // Clear the canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        // Draw the battle background and sprites
        this.ctx?.drawImage(this.battleBackgroundImage, 0, 0, this.canvas.width, this.canvas.height);
        this.ctx?.drawImage(this.enemyImage, this.enemySpriteData.x, this.enemySpriteData.y, this.enemySpriteData.xScale, this.enemySpriteData.yScale);
        this.ctx?.drawImage(this.playerImage, this.playerSpriteData.x, this.playerSpriteData.y, this.playerSpriteData.xScale, this.playerSpriteData.yScale);

    }
};

export class MapScene extends Scene {
    scene_id = "map";
    map!: maplibregl.Map;
    geolocationControl!: maplibregl.GeolocateControl;
    world_grid!: WorldGrid;
    
    current_position_lat_lng!: [number, number];
    spawn_markers: boolean = true;
    pokemon_data: any = {};
    moves_data: any = {};
    find_distance: number = 50;
    ar_active: boolean = true;
    pokemon_markers: {marker: maplibregl.Marker, pokemon_data : any, biome : string, near : boolean}[] = [];

    init() {

        console.log("MapScene initialized");

        const ar_toggle = document.getElementById("ar-toggle") as HTMLButtonElement;
        ar_toggle.textContent = this.ar_active ? "AR ON" : "AR OFF";
        ar_toggle.addEventListener("click", () => {
            this.ar_active = !this.ar_active;
            ar_toggle.textContent = this.ar_active ? "AR ON" : "AR OFF";
        });


        this.current_position_lat_lng = TrainerDataHandler.lastPositionExists() ? [TrainerDataHandler.loadLastPosition()!.x, TrainerDataHandler.loadLastPosition()!.y] : [51.505, -0.09];
        if(!this.map) {
                this.map = new maplibregl.Map({
                container: "map",
                style: "./assets/styles/retro_rpg_world_openfreemap.json",
                center: [this.current_position_lat_lng[1], this.current_position_lat_lng[0]], // [lng, lat]
                zoom: 15
            });
        }

        this.geolocationControl = new maplibregl.GeolocateControl({
            positionOptions: {
                enableHighAccuracy: true
            },
            trackUserLocation: true,
            showUserLocation: true,
            showAccuracyCircle: false 
        });
       

        this.map.addControl(this.geolocationControl);

        this.geolocationControl.on('error', (e: any) => {
            console.error("Geolocation error: ", e);
        });
        
        this.map.on('load', () => {
            console.log("Map loaded");
            this.geolocationControl.trigger();
        });

        (async () => {
            const habitats = await AssetHandler.loadHabitats();
            console.log(habitats)
            const generation_data = await AssetHandler.loadPokemonSpeciesGen1();
            console.log(generation_data);

            if(!TrainerDataHandler.trainerDataExists()) {
                var random_pokemon = await AssetHandler.getRandomPokemonData(5, 5);
                TrainerDataHandler.initializeTrainerData(random_pokemon.pokemon_data, random_pokemon.moves_data);
            };
        
        })();

        const onLocationFound = (e: GeolocationPosition) => {
            console.log("Location found: ", e.coords);
            var radius = e.coords.accuracy / 2;
            this.current_position_lat_lng = [e.coords.latitude, e.coords.longitude];
            TrainerDataHandler.saveLastPosition(e.coords.latitude, e.coords.longitude);
            
            if (this.spawn_markers) {
                console.log("Spawning Pokémon markers");
                

                this.world_grid = new WorldGrid(
                                this.current_position_lat_lng[0], 
                                this.current_position_lat_lng[1],
                                10,
                                100);
        

                this.world_grid.cells.forEach(cell => {
                    const point = this.map.project([
                        cell.lng,
                        cell.lat
                    ]);
                    const random_level = Math.floor(Math.random() * 10) + 3;
                    const biome = this.map.queryRenderedFeatures(point);
                    const random_spawn = Math.floor(Math.random() * 100);
                

                    const isForest = biome.some(feature =>
                        feature.properties?.class === "forest" ||
                        feature.properties?.class === "wood"
                    );

                    const isGrass = biome.some(feature =>
                        feature.properties?.class === "grass"
                    );

                    if (isForest) {
                        if (random_spawn >= 85) {
                            const habitat = AssetHandler.getHabitatData('forest');
                            var random_pokemon = Math.floor(Math.random() * habitat.pokemon_species.length);
                            var marker = this.createPokemonMarker(habitat.pokemon_species[random_pokemon], random_level, cell, 'Forest');
                            cell.occupied = true;
                        }
                    } else if (isGrass) {
                        if (random_spawn >= 90) {
                            const habitat = AssetHandler.getHabitatData('grassland');
                            var random_pokemon = Math.floor(Math.random() * habitat.pokemon_species.length);
                            var marker = this.createPokemonMarker(habitat.pokemon_species[random_pokemon], random_level, cell, 'Grassland');
                        }
                    }
                });
                this.spawn_markers = false;
            }
        }

         const onLocationError = (e: { message: any; }) => {
            alert(e.message);
        }

        this.geolocationControl.on('geolocate', onLocationFound);
        //this.geolocationControl.on(, onLocationError);
   
       

    }

        private getRandomLatLng(center: { lat: any; lng: any; }, radiusInMeters: number) {
            const y0 = center.lat;
            const x0 = center.lng;
            
            // Convert radius from meters to degrees (approximate)
            // 111,300 meters = 1 degree
            const rd = radiusInMeters / 111300;

            const u = Math.random();
            const v = Math.random();
            
            const w = rd * Math.sqrt(u); // Weighted radius for uniform distribution
            const t = 2 * Math.PI * v;   // Random angle
            
            const x = w * Math.cos(t);
            const y = w * Math.sin(t);

            // Adjust longitude for the shrinking of east-west distances at higher latitudes
            const new_x = x / Math.cos(y0 * (Math.PI / 180));

            return {
                lat: y + y0,
                lng: new_x + x0
            };

        
        }

    private createPokemonMarker(
        pokemon_data: {name: string, url: string},
        level : number,
        position: { lat: number; lng: number },
        biome : string
    ): maplibregl.Marker {

        const el = document.createElement("img");

        if(biome === 'Forest') {
            el.src = `./assets/icons/Grass_Forest.png`
        } else if (biome === 'Grassland') {
            el.src = `./assets/icons/Grass_grassland.png`
        } else {
            el.src = `./assets/icons/Grass_grassland.png`
        }
        el.style.width = "25px";
        el.style.height = "25px";
        el.style.pointerEvents = "auto";
        el.style.cursor = "pointer";

        const marker = new maplibregl.Marker({
            element: el,
            anchor: "bottom"
        }).setLngLat(position)
        .addTo(this.map);


        this.pokemon_markers.push({marker : marker, pokemon_data : pokemon_data, biome : biome, near : false});
        return marker;
    }

    private async startBattle(pokemon: any): Promise<void> {
        this.map.remove();

        const enemy = new Pokemon(
            pokemon.pokemon_data,
            pokemon.moves_data,
            pokemon.pokemon_data.level
        );

        if (!this.ar_active) {
            
            SceneHandler.getInstance().showScene(
                new BattleScene(
                    TrainerDataHandler.loadTrainerData(),
                    enemy
                )
            );

        } else {

            SceneHandler.getInstance().showScene(
                new BattleSceneVR(
                    TrainerDataHandler.loadTrainerData(),
                    enemy
                )
            );

        }
    }

    update() {
        const player_position : maplibregl.LngLat = new maplibregl.LngLat(this.current_position_lat_lng[1], this.current_position_lat_lng[0]);
       // Handle scene-specific updates if needed
        for (const marker of this.pokemon_markers) {
            const markerLngLat : maplibregl.LngLat = marker.marker.getLngLat();
            const distance = markerLngLat.distanceTo(player_position);
            if(distance <= this.find_distance && marker.near === false) {
                const element : HTMLImageElement = marker.marker.getElement() as HTMLImageElement;
                element.src = `./assets/sprites/box/${marker.pokemon_data.name}.png`;
                element.style.height = "84px";
                element.style.width = "102px";
                element.addEventListener("click", async () => {
                    const pokemon_battle_data = await AssetHandler.loadPokemonBattleDataFromSpecies(marker.pokemon_data, 5);
                    await this.startBattle(pokemon_battle_data);
                });
                marker.near = true;
            } else if (distance > this.find_distance && marker.near === true) {
                const element : HTMLImageElement = marker.marker.getElement() as HTMLImageElement;
                element.src = `./assets/sprites/box/${marker.pokemon_data.name}.png`;
                element.style.height = "25px";
                element.style.width = "25px";
                marker.near = false;
            }
        }

    }
}