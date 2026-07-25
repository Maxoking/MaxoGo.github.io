export class WorldGrid {
    cells : any[] = [];
    cell_size = 50;


    lat_step : number = 0;
    lng_step : number = 0;

    constructor(
        centerLat: number,
        centerLng: number,
        radius: number, // 2 => 5x5 Grid
        cellSize: number
    ) {
        this.lat_step = metersToLat(cellSize);
        this.lng_step = metersToLng(cellSize, this.lat_step);
        for (let y = -radius; y <= radius; y++) {
                for (let x = -radius; x <= radius; x++) {

                    this.cells.push({
                        lat: centerLat + y * this.lat_step,
                        lng: centerLng + x * this.lng_step,
                        gridX: x,
                        gridY: y
                    });

                }
            }
    }


}

function metersToLat(meters: number): number {
    return meters / 111320;
}

function metersToLng(meters: number, latitude: number): number {
    return meters / (111320 * Math.cos(latitude * Math.PI / 180));
}
