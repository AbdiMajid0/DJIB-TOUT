package com.djibtout.backend.service;
import org.springframework.stereotype.Service;import java.time.*;import java.util.concurrent.*;
@Service public class LoginAttemptService{
 private record State(int failures,Instant blockedUntil){} private final ConcurrentMap<String,State> states=new ConcurrentHashMap<>();
 public boolean blocked(String key){State s=states.get(normalize(key));if(s==null||s.blockedUntil()==null)return false;if(Instant.now().isAfter(s.blockedUntil())){states.remove(normalize(key));return false;}return true;}
 public void failed(String key){states.compute(normalize(key),(k,s)->{int count=s==null?1:s.failures()+1;long seconds=count<5?0:Math.min(900,30L*(1L<<Math.min(5,count-5)));return new State(count,seconds==0?null:Instant.now().plusSeconds(seconds));});}
 public void succeeded(String key){states.remove(normalize(key));}
 private String normalize(String key){return key==null?"unknown":key.trim().toLowerCase();}
}
