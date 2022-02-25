package com.mixtoler.producerconsumer;

import com.mixtoler.producerconsumer.restful.MainController;
import com.mixtoler.producerconsumer.restful.WSService;

import java.util.ArrayList;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;

public class Consumer implements Runnable {

    private final int id;
    private final int processingTime;
    private Product processingProduct = null;
    private final BlockingQueue<Product> workingArea;
    private final ArrayList<Producer> suppliersList = new ArrayList<>();
    private Producer acceptorQueue = null;
    private final Lock supplyingLock = new ReentrantLock();
    private boolean stop = false;
    private final WSService wsService;

    public Consumer(int id, int processingTime, BlockingQueue<Product> workingArea, WSService wsService) {
        this.id = id;
        this.processingTime = processingTime;
        this.workingArea = workingArea;
        this.wsService = wsService;
    }

    public int getId() {
        return id;
    }

    public void stop(){
        stop = true;
        synchronized (this) {
            this.notify();
        }
    }

    public void addSupplier(Producer supplier){
        suppliersList.add(supplier);
        supplier.registerConsumer(this, workingArea);
    }

    public void setAcceptorQueue(Producer acceptorQueue) throws Exception {
        if (this.acceptorQueue == null)
            this.acceptorQueue = acceptorQueue;
        else
            throw new Exception();
    }

    public synchronized void requestProduct(Producer producer){
        if (workingArea.size() == 0 && processingProduct == null) {
            producer.handleConsumerRequest(this, workingArea);
        }
    }

    public void update(Producer producer){
        if(supplyingLock.tryLock()) {
            if (workingArea.size() == 0 && processingProduct == null)
                requestProduct(producer);
        }
    }

    @Override
    public void run() {
        while (!stop) {
            synchronized (this) {
                while (workingArea.size() == 0) {
                    try {
                        this.wait();
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                    if (stop)
                        return;
                }
                processingProduct = workingArea.peek();
                wsService.notifyFrontend("machine," + id + "," + processingProduct.getColor());
                long eventTime = System.currentTimeMillis();
                MainController.originator.setState("machine," + id + "," + processingProduct.getColor());
                MainController.careTaker.add(eventTime, MainController.originator.saveToMemento());
                try {
                    Thread.sleep(processingTime);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
                if (processingProduct != null && acceptorQueue != null)
                    acceptorQueue.addProduct(workingArea.poll());
                wsService.notifyFrontend("machine," + id + ",finished");
                eventTime = System.currentTimeMillis();
                processingProduct = null;
                MainController.originator.setState("machine," + id + ",finished");
                MainController.careTaker.add(eventTime, MainController.originator.saveToMemento());
                for (Producer supplier : suppliersList) {
                    requestProduct(supplier);
                    if (workingArea.size() != 0)
                        break;
                }
            }
        }
    }

}
