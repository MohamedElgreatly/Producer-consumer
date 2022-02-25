package com.mixtoler.producerconsumer.snapshot;

public class Originator {
	
    private static String state;

    public String getState() {
        return state;
    }

    public void setState(String state) {
        synchronized (this) {
            Originator.state = state;
        }
    }

    public Memento saveToMemento(){
        synchronized (this) {
            return new Memento(state);
        }
    }
	
    public void loadFromMemento(Memento memento){
        synchronized (this) {
            state = memento.getState();
        }
    }

}
