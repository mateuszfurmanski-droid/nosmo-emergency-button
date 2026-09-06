export const RUNTIME_RECOVERY_EVENTS=Object.freeze(['pageshow','focus','visibilitychange']);

let recoveryWakeLock=null;
let fullscreenGestureArmed=false;
let fullscreenNoticeShown=false;

function getSnapshot(){return globalThis.NOSMOEmergency?.getSnapshot?.()||null;}

export function hasActiveEmergency(){
  if(typeof document==='undefined')return false;
  const screen=document.querySelector('#emergencyScreen');
  return Boolean(getSnapshot()&&screen&&!screen.hidden);
}

export function locationCanRetry(snapshot=getSnapshot()){
  const status=snapshot?.location?.status||'IDLE';
  return ['IDLE','DENIED','UNAVAILABLE','AVAILABLE'].includes(status);
}

async function acquireRecoveryWakeLock(){
  if(typeof navigator==='undefined'||typeof document==='undefined')return false;
  if(!hasActiveEmergency()||document.visibilityState!=='visible'||!('wakeLock' in navigator))return false;
  if(recoveryWakeLock&&!recoveryWakeLock.released)return true;
  try{
    const sentinel=await navigator.wakeLock.request('screen');
    recoveryWakeLock=sentinel;
    sentinel.addEventListener?.('release',()=>{if(recoveryWakeLock===sentinel)recoveryWakeLock=null;});
    return true;
  }catch{
    recoveryWakeLock=null;
    return false;
  }
}

async function restoreFullscreen(fromGesture=false){
  if(typeof document==='undefined'||!hasActiveEmergency())return false;
  if(document.fullscreenElement)return true;
  const target=document.documentElement;
  if(!target?.requestFullscreen)return false;
  try{
    await target.requestFullscreen({navigationUI:'hide'});
    fullscreenGestureArmed=false;
    fullscreenNoticeShown=false;
    return true;
  }catch{
    if(!fullscreenGestureArmed){
      fullscreenGestureArmed=true;
      document.addEventListener('pointerdown',handleFullscreenGesture,{once:true,capture:true});
    }
    if(!fromGesture&&!fullscreenNoticeShown){
      fullscreenNoticeShown=true;
      globalThis.NOSMOField?.notice?.('EMERGENCY ACTIVE • TAP SCREEN TO RESTORE FULLSCREEN',3600);
    }
    return false;
  }
}

async function handleFullscreenGesture(){
  fullscreenGestureArmed=false;
  await restoreFullscreen(true);
}

function keepLocationRetryAvailable(){
  if(typeof document==='undefined')return;
  const snapshot=getSnapshot();
  const button=document.querySelector('#locationStatus');
  if(!button||!snapshot)return;
  const retry=locationCanRetry(snapshot);
  button.disabled=false;
  if(retry&&['DENIED','UNAVAILABLE'].includes(snapshot.location?.status))button.setAttribute('aria-label','Retry device location');
  else button.removeAttribute('aria-label');
}

export async function resumeEmergencyRuntime(){
  if(typeof document==='undefined'||document.visibilityState!=='visible'||!hasActiveEmergency())return false;
  keepLocationRetryAvailable();
  globalThis.NOSMOLanguage?.apply?.();
  await acquireRecoveryWakeLock();
  await restoreFullscreen(false);
  return true;
}

function handleVisibilityChange(){
  if(typeof document!=='undefined'&&document.visibilityState==='visible')resumeEmergencyRuntime();
}

function initRuntimeRecovery(){
  if(typeof window==='undefined'||typeof document==='undefined')return;
  window.addEventListener('pageshow',resumeEmergencyRuntime);
  window.addEventListener('focus',resumeEmergencyRuntime);
  document.addEventListener('visibilitychange',handleVisibilityChange);
}

initRuntimeRecovery();

globalThis.NOSMORuntimeRecovery=Object.freeze({resume:resumeEmergencyRuntime,hasActiveEmergency,locationCanRetry});
