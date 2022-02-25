import { ElementRef, Injectable, ViewChild } from "@angular/core";

@Injectable({
    providedIn: 'root'
})

export class Machine {
    static radius:number = 30;
    static color:string = "#0d41d1";
    center:number[] = [0, 0];
    id:number = 0;
    private selectRadius = 10;
    proccessColor:string = "";
    pr:boolean = false;
    

    @ViewChild('myCanvas', { static: true }) myCanvas: ElementRef = {} as ElementRef;
    ctx: CanvasRenderingContext2D = {} as CanvasRenderingContext2D;

    constructor(ctx:CanvasRenderingContext2D, id:Number){
        this.id = id.valueOf();
        this.center[0] = Math.floor(Math.random() * (1000 - 100) + 100);
        this.center[1] = Math.floor(Math.random() * (550 - 100) + 100);
        this.ctx = ctx;
        this.draw();
    }

    setProccessColor(color:string){
        this.proccessColor = color;
        
        
    }

    getId():number{
        return this.id;
    }
    procces(){
        this.pr = true;
        this.ctx.beginPath();
        this.ctx.strokeStyle = this.proccessColor;
        this.ctx.fillStyle = this.proccessColor
        this.ctx.arc(this.center[0], this.center[1], this.selectRadius+10, 0, 2*Math.PI, false);
        this.ctx.stroke();
        this.ctx.fill();
        this.ctx.closePath();
    }
    finish(){
        this.pr = false;
        this.ctx.beginPath();
        this.ctx.strokeStyle = "white";
        this.ctx.arc(this.center[0], this.center[1], this.selectRadius+10, 0, 2*Math.PI, false);
        this.ctx.fill();
        this.ctx.closePath();
    }
    select() :void {
        this.ctx.beginPath();
        this.ctx.strokeStyle = "DE6AEC";
        this.ctx.arc(this.center[0], this.center[1], this.selectRadius, 0, 2 * Math.PI, false)
        
        this.ctx.fill();
        this.ctx.closePath();
    }

    unselect() :void {
        this.ctx.beginPath();
        this.ctx.strokeStyle = "white";
        this.ctx.arc(this.center[0], this.center[1], this.selectRadius, 0, 2 * Math.PI, false)
        this.ctx.fill();
        this.ctx.closePath();
    }

    draw () :void {
        this.ctx.beginPath();
        this.ctx.strokeStyle = Machine.color;
        this.ctx.arc(this.center[0], this.center[1], Machine.radius, 0, 2 * Math.PI, false)
        this.ctx.fillText("M"+this.id.toString(), this.center[0], this.center[1]);
        this.ctx.stroke();
        this.ctx.closePath();
    }
}