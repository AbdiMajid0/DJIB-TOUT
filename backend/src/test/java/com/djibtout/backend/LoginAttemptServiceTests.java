package com.djibtout.backend;
import com.djibtout.backend.service.LoginAttemptService;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import java.time.Duration;import java.time.Instant;
import java.lang.reflect.Constructor;import java.lang.reflect.Method;
import java.util.concurrent.ConcurrentMap;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Le blocage minimal dure trente secondes : les scenarios qui dependent de son
 * ecoulement reecrivent l'etat interne plutot que d'attendre reellement.
 */
class LoginAttemptServiceTests{
 LoginAttemptService attempts=new LoginAttemptService();

 void fail(String key,int times){for(int i=0;i<times;i++)attempts.failed(key);}

 @Test void unknownKeyIsNeverBlocked(){
  assertFalse(attempts.blocked("buyer@test.local"));
 }

 @Test void fourFailuresDoNotBlockYet(){
  fail("buyer@test.local",4);
  assertFalse(attempts.blocked("buyer@test.local"));
 }

 @Test void fifthFailureBlocksTheKey(){
  fail("buyer@test.local",5);
  assertTrue(attempts.blocked("buyer@test.local"));
 }

 @Test void keyIsNormalisedBeforeBeingCounted(){
  fail("  Buyer@Test.Local ",5);
  assertTrue(attempts.blocked("buyer@test.local"));
 }

 @Test void nullKeysShareTheUnknownBucket(){
  fail(null,5);
  assertTrue(attempts.blocked(null));
 }

 @Test void successResetsTheCounter(){
  fail("buyer@test.local",5);
  attempts.succeeded("buyer@test.local");
  assertFalse(attempts.blocked("buyer@test.local"));
  fail("buyer@test.local",4);
  assertFalse(attempts.blocked("buyer@test.local"));
 }

 @Test void blockingIsLiftedAndForgottenOnceTheDelayHasElapsed(){
  fail("buyer@test.local",5);
  moveBlockToThePast("buyer@test.local");
  assertFalse(attempts.blocked("buyer@test.local"));
  assertNull(state("buyer@test.local"));
 }

 @Test void delayGrowsWithConsecutiveFailuresAndIsCappedAtFifteenMinutes(){
  fail("buyer@test.local",5);
  assertEquals(30L,remainingSeconds("buyer@test.local"));
  attempts.failed("buyer@test.local");
  assertEquals(60L,remainingSeconds("buyer@test.local"));
  fail("buyer@test.local",20);
  assertEquals(900L,remainingSeconds("buyer@test.local"));
 }

 @SuppressWarnings("unchecked")
 private ConcurrentMap<String,Object> states(){
  return (ConcurrentMap<String,Object>)ReflectionTestUtils.getField(attempts,"states");
 }

 private String normalise(String key){return key==null?"unknown":key.trim().toLowerCase();}

 private Object state(String key){return states().get(normalise(key));}

 private Object component(Object state,String name){
  try{Method accessor=state.getClass().getDeclaredMethod(name);accessor.setAccessible(true);return accessor.invoke(state);}
  catch(Exception e){throw new IllegalStateException(e);}
 }

 private long remainingSeconds(String key){
  Instant until=(Instant)component(state(key),"blockedUntil");
  return Math.round(Duration.between(Instant.now(),until).toMillis()/1000.0);
 }

 private void moveBlockToThePast(String key){
  Object state=state(key);
  try{
   Constructor<?> constructor=state.getClass().getDeclaredConstructors()[0];
   constructor.setAccessible(true);
   states().put(normalise(key),constructor.newInstance(component(state,"failures"),Instant.now().minusSeconds(1)));
  }catch(Exception e){throw new IllegalStateException(e);}
 }
}
