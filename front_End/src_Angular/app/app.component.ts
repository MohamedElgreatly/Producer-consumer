import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { Stomp } from '@stomp/stompjs';
import { update } from 'lodash';
import * as SockJS from 'sockjs-client';
import { Connector } from './Connector';
import { Machine } from './Machine';
import { Queue } from './Queue';




@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'ProducerConsumer';
  queues: Map<number, Queue> = new Map<number, Queue>();
  machines: Map<number, Machine> = new Map<number, Machine>();
  connectors: any = [];
  message: string = "";
  error:boolean = false;
  selectedMachine: number = -1;
  selectedQueue: number = -1;
  selectDrag: number = -1;
  dragObject: any;
  id_q: number = 0;
  id_m: number = 0;
  startQId: number = -1;
  endQId: number = -1;
  productsNumber: number = 0;
  finished: boolean = false;
  stompClient: any;
  started: boolean = false;
  webSocket = new SockJS("http://localhost:8080/gs-guide-websocket");


  @ViewChild('myCanvas', { static: true }) myCanvas: ElementRef = {} as ElementRef;
  ctx: CanvasRenderingContext2D = {} as CanvasRenderingContext2D;
  constructor(private http: HttpClient) {
    this.stompClient = Stomp.over(this.webSocket);
    const that = this;
    this.stompClient.connect({}, function (frame: any) {
      // console.log('Connected aaaaaa: ' + frame);
      that.stompClient.subscribe("/topic/message", function (message: any) {
        //console.log("sub" + message);
      })
    });
    this.webSocket.addEventListener('message', function (event) {
      let u = JSON.stringify(event.data);
      let s = u.lastIndexOf("}");
      let v = u.lastIndexOf("{");
      that.update(u.substring(v + 15, s - 2));
    });


  }
  ngOnInit(): void {
    this.ctx = this.myCanvas.nativeElement.getContext('2d');
    this.clear();
    setInterval(() => {
      if (this.finished) {
        this.queues.get(this.endQId)?.setProductsNumber(this.productsNumber);
      }
      this.ctx.clearRect(0, 0, 2000, 2000);
      this.machines.forEach((value: Machine, key: number) => {
        value.draw();
        if (value.pr) {
          value.procces();
        }
      });
      this.queues.forEach((value: Queue, key: number) => {
        value.draw();
      });
      for (let i = 0; i < this.connectors.length; i++) {
        this.connectors[i].draw();
      }
      this.machines.get(this.selectedMachine)?.select();
      this.queues.get(this.selectedQueue)?.select();


    }, 5);
  }


  public drawMachine(): void {
    let data = new HttpParams();
    data = data.append("id", this.id_m);
    this.http.post("http://localhost:8080/producerConsumer/addMachine", data).subscribe();
    this.machines.set(this.id_m, new Machine(this.ctx, this.id_m));
    this.id_m++;
  }
  public drawQueue(): void {
    let data = new HttpParams();
    data = data.append("id", this.id_q);
    this.http.post("http://localhost:8080/producerConsumer/addQueue", data).subscribe();
    this.queues.set(this.id_q, new Queue(this.ctx, this.id_q));
    this.id_q++;
  }
  public start(): void {
    if (this.startQId == -1 || this.endQId == -1) {
      this.message = "please select start and end queue";
      this.error = true;
    }
    else {
      let data = new HttpParams();
      data = data.append("productsNum", this.productsNumber);
      this.http.post("http://localhost:8080/producerConsumer/startSimulating", data, { responseType: 'text' }).subscribe();
      this.started = true;
      //this.queues.get(this.startQId)!.productsNumber = this.productsNumber;
    }
  }

  public replay(): void {

  }

  public connect(machine: Machine | any, queue: Queue | any, fromQtoM: boolean): void {
    if (machine == undefined || queue == undefined) {
      this.message = "Please select a machine and a queue to connect them";
      this.error = true;
    }
    else {
      let found = false;
      let data = new HttpParams();
      data = data.append("machineId", machine.id);
      data = data.append("queueId", queue.id);
      for (let i = 0; i < this.connectors.length; i++) {
        if (this.connectors[i].machine.id == machine.id && this.connectors[i].queue.id == queue.id) {
          found = true;
        }
      }
      if (!found) {

        if (fromQtoM) {
          this.http.post("http://localhost:8080/producerConsumer/connectSupplier", data).subscribe();
        }
        else {
          this.http.post("http://localhost:8080/producerConsumer/connectAcceptorQueue", data, { responseType: 'text' }).subscribe();
        }
        this.connectors.push(new Connector(machine, queue, fromQtoM, this.ctx));
        this.unSelectAll();
      }
    }
  }
  public clear(): void {
    let data = new HttpParams();
    this.http.post("http://localhost:8080/producerConsumer/makeNewSimulation", data).subscribe();
    this.machines.clear();
    this.queues.clear();
    this.connectors = [];
    this.ctx.clearRect(0, 0, 2000, 2000);
    this.selectedQueue = -1;
    this.selectedMachine = -1;
    this.started = false;
    this.finished = false;
    this.id_m = 0;
    this.id_q = 0;
  }

  public select(event: MouseEvent): void {
    this.machines.forEach((value: Machine, key: number) => {
      if (this.inMachine(event, value)) {
        this.selectedMachine = key;
        this.selectDrag = key;
        this.dragObject = this.machines.get(this.selectDrag);
        this.machines.get(this.selectedMachine)?.select();

      }
    });
    this.queues.forEach((value: Queue, key: number) => {
      if (this.inQueue(event, value)) {
        this.selectedQueue = key;
        this.selectDrag = key;
        this.dragObject = this.queues.get(this.selectDrag);
        this.queues.get(this.selectedQueue)?.select();
      }
    });
  }
  public stopDragging() {
    this.selectDrag = -1;
    this.dragObject = null;
  }
  public drag(event: MouseEvent) {
    const container = document.getElementById('1');
    let x = 0;
    let y = 0;
    if (container != null) {
      x = event.clientX - container.getBoundingClientRect().x;
      y = event.clientY - container.getBoundingClientRect().y;
    }
    if (this.selectDrag != -1) {
      this.dragObject.center[0] = x;
      this.dragObject.center[1] = y;
    }
  }

  public inMachine(event: MouseEvent, machine: Machine): boolean {
    const container = document.getElementById('1');
    let x = 0;
    let y = 0;
    if (container != null) {
      x = event.clientX - container.getBoundingClientRect().x;
      y = event.clientY - container.getBoundingClientRect().y;
    }
    let length = Math.sqrt((x - machine.center[0]) * (x - machine.center[0]) +
      (y - machine.center[1]) * (y - machine.center[1]));
    return (length <= Machine.radius)
  }

  public inQueue(event: MouseEvent, queue: Queue): boolean {
    const container = document.getElementById('1');
    let x = 0;
    let y = 0;
    if (container != null) {
      x = event.clientX - container.getBoundingClientRect().x;
      y = event.clientY - container.getBoundingClientRect().y;
    }
    let checkX: boolean = (x > (queue.center[0] - Queue.width / 2)) && (x < (queue.center[0] + Queue.width / 2));
    let checkY: boolean = (y > (queue.center[1] - Queue.height / 2)) && (y < (queue.center[1] + Queue.height / 2));
    return checkX && checkY;

  }


  unSelectAll(): void {
    this.machines.get(this.selectedMachine)?.unselect();
    this.queues.get(this.selectedQueue)?.unselect();
    this.selectedMachine = -1;
    this.selectedQueue = -1;
  }
  update(message: string) {
    console.log(message);
    if (message == "simulationEnded") {
      this.finished = true;
    }
    else {
      let messages: string[] = message.split(",");
      if (messages[0] == "queue") {


        if (messages[2] == "suppliedProduct") {
          this.queues.get(Number.parseInt(messages[1]))?.dec();
        }
        else if (messages[2] == "gotProduct") {
          this.queues.get(Number.parseInt(messages[1]))?.inc();

        }
      }
      else if (messages[0] == "machine") {
        if (messages[2] == "finished") {
          this.machines.get(Number.parseInt(messages[1]))?.finish();

        }
        else {
          let color: string = messages[2];
          this.machines.get(Number.parseInt(messages[1]))?.setProccessColor(color);
          this.machines.get(Number.parseInt(messages[1]))?.procces();
        }
      }
    }
  }

  MakeFirstQueue() {
    let data = new HttpParams();
    data = data.append("id", this.selectedQueue);
    this.http.post("http://localhost:8080/producerConsumer/setStartingQueue", data).subscribe();
    this.startQId = this.selectedQueue;
    //console.log(data);
  }
  MakeEndQueue() {
    let data = new HttpParams();
    data = data.append("id", this.selectedQueue);
    this.http.post("http://localhost:8080/producerConsumer/setEndingQueue", data).subscribe();
    this.endQId = this.selectedQueue;
    //console.log(data);
  }

  gotIt(){
    this.message = "";
    this.error = false;
  }
}
