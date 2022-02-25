package com.mixtoler.producerconsumer.restful;

import com.mixtoler.producerconsumer.Consumer;
import com.mixtoler.producerconsumer.Producer;
import com.mixtoler.producerconsumer.Product;
import com.mixtoler.producerconsumer.snapshot.CareTaker;
import com.mixtoler.producerconsumer.snapshot.Memento;
import com.mixtoler.producerconsumer.snapshot.Originator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.*;
import java.util.concurrent.LinkedBlockingQueue;

@RestController
@RequestMapping("/producerConsumer")
public class MainController {

    private HashMap<Integer, Consumer> machinesMap = new HashMap<>();
    private HashMap<Integer, Producer> queuesMap = new HashMap<>();
    private Thread simulationThread = null;
    private Thread replyThread = null;
    private Producer startingQueue = null;
    private Producer endingQueue = null;
    private boolean stopSimulation = false;
    private boolean stopReplying = false;

    private long startTime;
    public static Originator originator = new Originator();
    public static CareTaker careTaker = new CareTaker();

    @Autowired
    private WSService wsService;

    public void endCurrentSimulation(){
        stopSimulation = true;
        stopReplying = true;
        try{
            simulationThread.interrupt();
        }catch (Exception ignored){}
        try{
            replyThread.interrupt();
        }catch (Exception ignored){}
        for (Consumer machine : machinesMap.values())
            machine.stop();
        for (Producer producer : queuesMap.values())
            producer.stop();
    }

    @RequestMapping("/makeNewSimulation")
    public void makeNewSimulation() {
        try{
            endCurrentSimulation();
        }catch (Exception ignored){}
        originator = new Originator();
        careTaker = new CareTaker();
        machinesMap = new HashMap<>();
        queuesMap = new HashMap<>();
        simulationThread = null;
        replyThread = null;
        startingQueue = null;
        endingQueue = null;
        stopSimulation = false;
        stopReplying = false;
    }

    @RequestMapping("/replyLastSimulation")
    public String replyLastSimulation() {
        if (replyThread != null)
            return "The reply have been already started";

        stopReplying = false;
        replyThread = new Thread(new Runnable() {
            @Override
            public void run() {
                synchronized (replyThread) {
                    long oldTime = startTime;
                    for (Long time : careTaker.getTimesSortedArray()) {
                        if (stopReplying)
                            break;
                        long sleepingTime = time - oldTime;
                        oldTime = time;
                        try {
                            Thread.sleep(sleepingTime);
                        } catch (Exception ignored) {
                            return;
                        }
                        for (Memento memento : careTaker.getMementosList(time)) {
                            originator.loadFromMemento(memento);
                            wsService.notifyFrontend(originator.getState());
                        }
                    }
                }
                stopReplying = false;
                replyThread = null;
            }
        });
        replyThread.start();

        return "ok";
    }

    @RequestMapping("/addMachine")
    public void addMachine(@RequestParam int id){
        Consumer machine = new Consumer(id, (int)(Math.random() * 2000 + 2000), new LinkedBlockingQueue<>(), wsService);
        machinesMap.put(id, machine);
        new Thread(machine).start();
    }

    @RequestMapping("/addQueue")
    public void addQueue(@RequestParam int id){
        Producer queue = new Producer(id, wsService);
        queuesMap.put(id, queue);
        new Thread(queue).start();
    }

    @RequestMapping("/connectSupplier")
    public void connectSupplier(@RequestParam int machineId, @RequestParam int queueId){
        machinesMap.get(machineId).addSupplier(queuesMap.get(queueId));
    }

    @RequestMapping("/connectAcceptorQueue")
    public String connectAcceptorQueue(@RequestParam int machineId, @RequestParam int queueId){
        try {
            machinesMap.get(machineId).setAcceptorQueue(queuesMap.get(queueId));
            return "ok";
        }catch (Exception ignored){}
        return "Machine can only supply one queue";
    }

    @RequestMapping("/setStartingQueue")
    public void setStartingQueue(@RequestParam int id){
        startingQueue = queuesMap.get(id);
    }

    @RequestMapping("/setEndingQueue")
    public void setEndingQueue(@RequestParam int id) {
        endingQueue = queuesMap.get(id);
    }

    @RequestMapping("/startSimulating")
    public String startSimulating(@RequestParam int productsNum) {
        if (simulationThread != null)
            return "The simulation have been already started";

        simulationThread = new Thread(new Runnable() {
            @Override
            public void run() {
                synchronized (simulationThread) {
                    int suppliedProductsNum = 0;
                    int pulledProductsNum = 0;
                    int sleepingTime = (int) (Math.random() * 1000 + 1000);
                    startTime = System.currentTimeMillis();
                    while (pulledProductsNum < productsNum && !stopSimulation) {
                        try {
                            Thread.sleep(sleepingTime);
                        } catch (InterruptedException e) {
                            return;
                        }
                        if (suppliedProductsNum < productsNum) {
                            startingQueue.addProduct(new Product("#" + String.format("%06x", new Random().nextInt(0x1000000)).toUpperCase()));
                            suppliedProductsNum++;
                        }
                        if (endingQueue.pullProduct() != null)
                            pulledProductsNum++;
                    }
                    try {
                        endCurrentSimulation();
                    } catch (Exception ignored) {
                    }
                    wsService.notifyFrontend("simulationEnded");
                    long eventTime = System.currentTimeMillis();
                    originator.setState("simulationEnded");
                    careTaker.add(eventTime, originator.saveToMemento());
                }
            }
        });
        simulationThread.start();

        return "ok";
    }

}
