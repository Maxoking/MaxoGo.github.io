import * as L from "leaflet";
import "leaflet/dist/leaflet.css";

import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

import { Pokemon, Move } from "./PokemonBattleEntity";
import { BattleStateMachine } from "./BattleStateMachine";


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
}

export class BattleScene extends Scene {
    scene_id = "battle-scene";
    battle_state_machine!: BattleStateMachine;
    
    constructor(player_pokemon : Pokemon, enemy_pokemon : Pokemon) {
        super();
        console.log("BattleScene created with " + player_pokemon.name + " and " + enemy_pokemon.name);
        this.battle_state_machine = new BattleStateMachine(player_pokemon, enemy_pokemon);
    } 

    handleInput(keys: Record<string, boolean>): void {
        this.battle_state_machine.handleInput(keys);
    }
};

export class MapScene extends Scene {
    scene_id = "map";
    map!: L.Map;
    current_position_lat_lng!: [number, number];
    spawn_markers: boolean = true;

    init() {

        console.log("MapScene initialized");
        this.current_position_lat_lng = [51.505, -0.09];
        this.map = L.map("map").setView([51.505, -0.09], 13);
        

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap contributors",
        }).addTo(this.map);
        
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        
        L.Icon.Default.mergeOptions({
          iconUrl: markerIcon,
          iconRetinaUrl: markerIcon2x,
          shadowUrl: markerShadow,
        });

        this.map.locate({setView: true, maxZoom: 16});

        const onLocationFound = (e: { accuracy: any; latlng: L.LatLng; }) => {
            var radius = e.accuracy;
            this.current_position_lat_lng = [e.latlng.lat, e.latlng.lng];
            L.marker(e.latlng).addTo(this.map);
            L.circle(e.latlng, radius).addTo(this.map);

            L.marker(getRandomLatLng(e.latlng, 500)).addTo(this.map).on("click", () => {
                SceneHandler.getInstance().showScene(new BattleScene(
                    new Pokemon("Pikachu", 100, 50, 30, 60),
                    new Pokemon("Charmander", 80, 40, 20, 50)
                ));
            });

            console.log("Location found: ", e.latlng);

            this.spawn_markers = false;
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
}