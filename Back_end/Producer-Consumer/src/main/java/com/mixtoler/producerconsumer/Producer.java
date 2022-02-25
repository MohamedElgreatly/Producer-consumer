package com.mixtoler.producerconsumer;

import com.mixtoler.producerconsumer.restful.MainController;
import com.mixtoler.producerconsumer.restful.WSService;

import java.util.*;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;

public class Producer implements Runnable {

    private final int id;
    public final BlockingQueue<Product> waitingProductsList = new LinkedBlockingQueue<>();
    private final HashMap<Consumer, BlockingQueue<Product>> registeredConsumersMap = new HashMap<>();
    private boolean stop = false;
    private final WSService wsService;

    public Producer(int id, WSService wsService) {
        this.id = id;
        this.wsService = wsService;
    }

    public int getId() {
        return id;
    }

    public void stop(){
        stop = true;
        synchronized (waitingProductsList) {
            waitingProductsList.notify();
        }
    }

    public void addProduct(Product product){
        synchronized (waitingProductsList) {
            wsService.notifyFrontend("queue," + id + "," + "gotProduct");
            long eventTime = System.currentTimeMillis();
            waitingProductsList.add(product);
            MainController.originator.setState("queue," + id + "," + "gotProduct");
            MainController.careTaker.add(eventTime, MainController.originator.saveToMemento());
            synchronized (waitingProductsList) {
                waitingProductsList.notify();
            }
        }
    }

    public Product pullProduct(){
        if(waitingProductsList.size() > 0) {
            wsService.notifyFrontend("queue," + id + "," + "suppliedProduct");
            long eventTime = System.currentTimeMillis();
            MainController.originator.setState("queue," + id + "," + "suppliedProduct");
            MainController.careTaker.add(eventTime, MainController.originator.saveToMemento());
        }
        return waitingProductsList.poll();
    }

    public void handleConsumerRequest(Consumer consumer, BlockingQueue<Product> workingArea){
        synchronized (waitingProductsList) {
            registeredConsumersMap.remove(consumer);
            if (waitingProductsList.size() > 0) {
                workingArea.add(pullProduct());
                consumer.notify();
            } else {
                registerConsumer(consumer, workingArea);
            }
        }
    }

    public synchronized void registerConsumer(Consumer consumer, BlockingQueue<Product> workingArea){
        registeredConsumersMap.put(consumer, workingArea);
        synchronized (waitingProductsList) {
            waitingProductsList.notify();
        }
    }

    @Override
    public void run() {
        while (!stop) {
            synchronized (waitingProductsList) {
                while (waitingProductsList.size() == 0 || registeredConsumersMap.size() == 0) {
                    try {
                        waitingProductsList.wait();
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                    if (stop)
                        return;
                }
                Set<Consumer> consumers = Set.copyOf(registeredConsumersMap.keySet());
                for (Iterator<Consumer> consumersIterator = consumers.iterator(); consumersIterator.hasNext();) {
                    Consumer consumer = consumersIterator.next();
                    registeredConsumersMap.remove(consumer);
                    consumer.update(this);
                }
            }
        }
    }

}
