import { ElementRef, Injectable, ViewChild } from "@angular/core";

@Injectable({
    providedIn: 'root'
})

export class Queue{
    static width:number = 80;
    static height:number = 50;
    center:number[] = [0, 0]
    static color:string = "#d10d4e";
    id:number = 0;
    productsNumber:number = 0;

    @ViewChild('myCanvas', { static: true }) myCanvas: ElementRef = {} as ElementRef;
    ctx: CanvasRenderingContext2D = {} as CanvasRenderingContext2D;

    constructor(ctx:CanvasRenderingContext2D, id:Number){
        this.id = id.valueOf();
        this.center[0] = Math.floor(Math.random() * (1500 - 100) + 100);
        this.center[1] = Math.floor(Math.random() * (550 - 100) + 100);
        this.ctx = ctx;
        this.draw();
        
    }

    setProductsNumber(productsNumber:number){
        this.productsNumber = productsNumber;

    }
    
    select() :void {
        this.ctx.beginPath();
        this.ctx.strokeStyle = "black";
        this.ctx.rect(this.center[0]-Queue.width/12, this.center[1]-Queue.height/12, Queue.width/6, Queue.height/6);
        
        this.ctx.fill();
        this.ctx.closePath();
    }

    unselect() :void {
        this.ctx.beginPath();
        this.ctx.strokeStyle = "white";
        this.ctx.rect(this.center[0]-Queue.width/2, this.center[1]-Queue.height/2, Queue.width/6, Queue.height/6);
        this.ctx.fill();
        this.ctx.closePath();
    }
    public getProductsNumber():number{
        return this.productsNumber;
    }
    inc(){
        this.productsNumber++;
    }
    dec(){
        this.productsNumber--;
    }
    draw () :void {
        this.ctx.beginPath();
        this.ctx.strokeStyle = Queue.color;
        this.ctx.rect(this.center[0]-Queue.width/2, this.center[1]-Queue.height/2, Queue.width, Queue.height);
        this.ctx.fillText("Q"+this.id.toString(), this.center[0]-30, this.center[1]-10)
        this.ctx.fillText("Products: "+this.productsNumber.toString(), this.center[0]-30, this.center[1]+10)
        this.ctx.stroke();
        this.ctx.closePath();
    }


}