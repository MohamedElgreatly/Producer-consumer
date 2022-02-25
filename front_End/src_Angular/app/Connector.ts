import { ElementRef, Injectable, ViewChild } from "@angular/core";
import { Machine } from "./Machine";
import { Queue } from "./Queue";

@Injectable({
    providedIn: 'root'
})

export class Connector {
    @ViewChild('myCanvas', { static: true }) myCanvas: ElementRef = {} as ElementRef;
    ctx: CanvasRenderingContext2D = {} as CanvasRenderingContext2D;
    static color = "#0c0d0c";
    machine:Machine;
    queue:Queue;
    fromQtoM: boolean;
    



    constructor(machine:Machine, queue:Queue, fromQtoM:Boolean, ctx:CanvasRenderingContext2D){
        this.ctx = ctx;
        this.machine = machine;
        this.queue = queue;
        this.fromQtoM = fromQtoM.valueOf();
        this.draw();
    }

    

    draw(){
        let startPoint:number[] = [0, 0];
        let endPoint:number[] = [0, 0];
        if (this.fromQtoM){    
            if (this.machine.center[0] < this.queue.center[0]){
                startPoint[0] = this.queue.center[0] - Queue.width/2;
                startPoint[1] = this.queue.center[1];
                endPoint[0] = this.machine.center[0] + Machine.radius;
                endPoint[1] = this.machine.center[1];
            }
            else{
                startPoint[0] = this.queue.center[0] + Queue.width/2;
                startPoint[1] = this.queue.center[1];
                endPoint[0] = this.machine.center[0] - Machine.radius;
                endPoint[1] = this.machine.center[1];
            }
        }
        else{
            if (this.machine.center[0] > this.queue.center[0]){
                startPoint[0] = this.machine.center[0] - Machine.radius;
                startPoint[1] = this.machine.center[1];
                endPoint[0] = this.queue.center[0] + Queue.width/2;
                endPoint[1] = this.queue.center[1];
            }
            else{
                startPoint[0] = this.machine.center[0] + Machine.radius;
                startPoint[1] = this.machine.center[1];
                endPoint[0] = this.queue.center[0] - Queue.width/2;
                endPoint[1] = this.queue.center[1];
            }
        }
       
        let dx = -startPoint[0] + endPoint[0];
        let dy = -startPoint[1] + endPoint[1];
        let angle = Math.atan2(dy, dx);
        let length = Math.sqrt(dx*dx + dy*dy);
        this.ctx.translate(startPoint[0],startPoint[1]);
        this.ctx.rotate(angle);
        this.ctx.strokeStyle = Connector.color;
        this.ctx.beginPath();
        this.ctx.moveTo(0,0);
        this.ctx.lineTo(length,0);
        this.ctx.moveTo(length-5,-5);
        this.ctx.lineTo(length,0);
        this.ctx.lineTo(length-5,5);
        this.ctx.stroke();
        this.ctx.setTransform(1,0,0,1,0,0);
    }
}