import * as L from "leaflet";
import "leaflet/dist/leaflet.css";

import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

import { Pokemon, Move } from "./PokemonBattleEntity";
import { BattleStateMachine } from "./BattleStateMachine";
import { TrainerDataHandler } from "./TrainerDataHandler";
import { AssetHandler } from "./AssetHandler";



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
    map!: L.Map;
    current_position_lat_lng!: [number, number];
    spawn_markers: boolean = true;
    pokemon_data: any = {};
    moves_data: any = {};
    added_position_marker: boolean = false;
    position_marker = L.marker([0, 0]);
    pokemon_marker!: L.Marker;
    random_pokemon: any;
    find_distance: number = 50;

    init() {

        console.log("MapScene initialized");


        this.current_position_lat_lng = [51.505, -0.09];
        if(!this.map) {
            this.map = L.map("map").setView([51.505, -0.09], 13);
        }

        (async () => {
            const res = await fetch("https://pokeapi.co/api/v2/generation/1");
            const data = await res.json();
            this.random_pokemon = data.pokemon_species[Math.floor(Math.random() * data.pokemon_species.length)];
            console.log(this.random_pokemon);
            const pokemon_species_res = await fetch(this.random_pokemon.url);
            const pokemon_species_data = await pokemon_species_res.json();
            console.log(pokemon_species_data);
            
            const randomLevel = Math.floor(Math.random() * 100) + 1;
            console.log("Random level: ", randomLevel);
            const res2 = await fetch(`https://pokeapi.co/api/v2/pokemon/${this.random_pokemon.name}`);
            this.pokemon_data = await res2.json();
            this.pokemon_data.level = randomLevel;
            this.pokemon_data.name = pokemon_species_data?.names.find((n: any) => n.language.name === "de")?.name || this.pokemon_data?.name;
            
            
            
            console.log(this.pokemon_data.moves);
            //console.log(this.pokemon_data.moves.find((move: any) => move.move.version_group_details.version_group.name === "red-blue")?.move.name);
            
            const move = this.pokemon_data.moves.filter((v: any) =>
            v.version_group_details?.some(
                (d: any) => d?.version_group.name === "red-blue" && d?.move_learn_method.name === "level-up" && d?.level_learned_at <= randomLevel
                )
            );

            console.log(move.slice(-4));

            this.moves_data = await Promise.all(move.slice(-4).map((v: any) => fetch(v.move.url).then(res => res.json())));
            console.log("Known moves: ", this.moves_data);

            if(!TrainerDataHandler.trainerDataExists()) {
                TrainerDataHandler.initializeTrainerData(this.pokemon_data, this.moves_data);
            };
        
        })();

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap contributors",
        }).addTo(this.map);
        
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        
        L.Icon.Default.mergeOptions({
          iconUrl: markerIcon,
          iconRetinaUrl: markerIcon2x,
          shadowUrl: markerShadow,
        });

        this.map.locate({setView: false, maxZoom: 16, watch: true});

        const onLocationFound = (e: { accuracy: any; latlng: L.LatLng; }) => {
            console.log("Location found: ", e.latlng);
            var radius = e.accuracy;
            this.current_position_lat_lng = [e.latlng.lat, e.latlng.lng];
            if (!this.added_position_marker) {
                this.map.setView(e.latlng, 16);
                L.circle(e.latlng, radius).addTo(this.map);
                this.position_marker.addTo(this.map).setLatLng(e.latlng).bindPopup("You are within " + radius + " meters from this point");
                this.added_position_marker = true;
            } else {
                this.position_marker.setLatLng(e.latlng).setPopupContent("You are within " + radius + " meters from this point");
            }
           
            console.log("Marker Sprite Name: ", this.random_pokemon.name);
            if (this.spawn_markers) {
                this.pokemon_marker = L.marker(getRandomLatLng(e.latlng, 500)).addTo(this.map).on("click", () => {
                    this.map.remove();
            
                    SceneHandler.getInstance().showScene(new BattleScene(
                        TrainerDataHandler.loadTrainerData(),
                        new Pokemon(this.pokemon_data, this.moves_data, this.pokemon_data.level)
                    ));
                });

                this.spawn_markers = false;
            } else {
                if(this.pokemon_marker) {
                    console.log("Distance to pokemon marker: ", this.pokemon_marker.getLatLng().distanceTo(e.latlng));
                    if (this.pokemon_marker.getLatLng().distanceTo(e.latlng) < this.find_distance) {
                        var pokemonIcon = L.icon({
                            iconUrl: './assets/sprites/box/' + this.random_pokemon.name + '.png',
                            iconSize:     [68 * 1.5, 56 * 1.5], // size of the icon
                            iconAnchor:   [34 * 1.5, 56 * 1.5], // point of the icon which will correspond to marker's location
                            popupAnchor:  [34 * 1.5, 28 * 1.5] // point from which the popup should open relative to the iconAnchor
                        });
                        this.pokemon_marker.setIcon(pokemonIcon);
                    }
                }
            }
        }

        this.map.on('locationfound', onLocationFound);

        const onLocationError = (e: { message: any; }) => {
            alert(e.message);
        }

        this.map.on('locationerror', onLocationError);

        function getRandomLatLng(center: { lat: any; lng: any; }, radiusInMeters: number) {
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


    }

    handleInput(keys: Record<string, boolean>): void {
        if (keys['b']) {
            this.map.remove();
            const trainer_data = JSON.parse(localStorage.getItem("trainer_data") || "{}");
            console.log("Trainer data: ", trainer_data);
            SceneHandler.getInstance().showScene(new BattleScene(
                trainer_data,
            new Pokemon(this.pokemon_data, this.moves_data, this.pokemon_data.level)
            ));
        }
    }
}