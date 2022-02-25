package com.mixtoler.producerconsumer.snapshot;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Set;

public class CareTaker {

    private final HashMap<Long, ArrayList<Memento>> timeMementosMap = new HashMap<>();

    public void add(long time, Memento memento){
        synchronized (this) {
            if (timeMementosMap.containsKey(time)) {
                timeMementosMap.get(time).add(memento);
            } else {
                ArrayList<Memento> mementosList = new ArrayList<>();
                mementosList.add(memento);
                timeMementosMap.put(time, mementosList);
            }
        }
    }
	
    public Long[] getTimesSortedArray(){
        Set<Long> timesSet = timeMementosMap.keySet();
        Long[] timesSortedArray = new Long[timesSet.size()];
        timesSet.toArray(timesSortedArray);
        Arrays.sort(timesSortedArray);
        return timesSortedArray;
    }

    public ArrayList<Memento> getMementosList(long time){
        return timeMementosMap.get(time);
    }

}
