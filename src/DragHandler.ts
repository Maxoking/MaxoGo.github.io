import { TrainerDataHandler } from "./TrainerDataHandler";

export class DragHandler {
    private draggedElement: HTMLElement | null = null;
    private isDragging: boolean = false;
    private dragStartX: number = 0;
    private dragStartY: number = 0
    private readonly DRAG_THRESHOLD: number = 5; // Minimum distance in pixels to start dragging
    private oldIndex: number | null = null;
    private newIndex: number | null = null;

    constructor(private container: HTMLElement) {
        const handles = this.container.querySelectorAll(".drag-handle") as NodeListOf<HTMLElement>;

        handles.forEach(handle => {
            handle.addEventListener(
                "pointerdown",
                this.onPointerDown
            );

            handle.addEventListener(
                "pointermove",
                (event: PointerEvent) => {
                    this.onPointerMove(event, handle);
                }
            );

            handle.addEventListener(
                "pointerup",
                this.onPointerUp
            );

            this.container.addEventListener(
                "pointerup",
                this.onPointerUp
            );

            this.container.addEventListener(
                "pointermove",
               (event: PointerEvent) => {
                    this.onPointerMove(event, handle);
                }
            );
        });
    }

    private onPointerDown = (event: PointerEvent) => {
        const pointerEvent = event as PointerEvent;

        const handle = pointerEvent.currentTarget as HTMLElement;
        const container = handle.closest(
            ".pokemon-container"
        ) as HTMLElement | null;

        if (!container) return;

        this.draggedElement = container;
        this.isDragging = true;
        this.dragStartX = event.clientX;
        this.dragStartY = event.clientY;

        this.oldIndex = Array.from(this.container.children).indexOf(this.draggedElement);
        console.log("Old Index:", this.oldIndex);
        handle.setPointerCapture(pointerEvent.pointerId);

        container.classList.add("dragging");

        // console.log("Drag Start");
    };
    

    private onPointerMove = (event: PointerEvent, handle: HTMLElement) => {
        
        if (!this.draggedElement) return;
        const dx = event.clientX - this.dragStartX;
        const dy = event.clientY - this.dragStartY;

        const distance = Math.sqrt(dx * dx + dy * dy);

        if (!this.isDragging && distance > this.DRAG_THRESHOLD) {
            this.isDragging = true;
        }

        if (!this.isDragging) return;
        // console.log("Pointer Move");

        const target = document.elementFromPoint(
            event.clientX,
            event.clientY
        );

        const targetPokemon =
            target?.closest(".pokemon-container") as HTMLDivElement | null;

        if (
            targetPokemon &&
            targetPokemon !== this.draggedElement &&
            this.draggedElement
        ) {
            const rect = targetPokemon.getBoundingClientRect();

            if (event.clientY < rect.top + rect.height / 2) {
                targetPokemon.before(this.draggedElement);
            } else {
                targetPokemon.after(this.draggedElement);
            }
        }
    }

    private onPointerUp = (event: PointerEvent) => {
        if (this.draggedElement) {
            this.draggedElement.classList.remove("dragging");
            
            const container = this.draggedElement.closest(
                ".pokemon-container"
            ) as HTMLElement | null;

            this.newIndex = Array.from(this.container.children).indexOf(this.draggedElement!);
            console.log("New Index:", this.newIndex);
            
            this.draggedElement = null;
            this.isDragging = false;

            TrainerDataHandler.reorderTeam(this.oldIndex!, this.newIndex!);
        }

       
    }
}