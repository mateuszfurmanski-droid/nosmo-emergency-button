export const FIELD_RELOAD_GUARD='nosmo-field-reload-v1';

let deferredInstallPrompt=null;
let hadServiceWorkerController=typeof navigator!=='undefined'&&'serviceWorker' in navigator&&Boolean(navigator.serviceWorker.controller);

export function isStandaloneMode(){
  if(typeof window==='undefined')return false;
  return Boolean(window.matchMedia?.('(display-mode: standalone)').matches||window.navigator?.standalone===true);
}

function getHeaderTools(){return typeof document!=='undefined'?document.querySelector('.header-tools'):null;}
function getEmergencySnapshot(){return globalThis.NOSMOEmergency?.getSnapshot?.()||null;}

function getFieldToast(){
  if(typeof document==='undefined')return null;
  let toast=document.querySelector('#fieldToast');
  if(!toast){toast=document.createElement('div');toast.id='fieldToast';toast.className='field-toast';toast.hidden=true;toast.setAttribute('role','status');toast.setAttribute('aria-live','polite');document.body.appendChild(toast);}
  return toast;
}

let toastTimer=null;
export function fieldNotice(message,duration=2800){
  const toast=getFieldToast();if(!toast)return;
  toast.textContent=message;toast.hidden=false;
  if(toastTimer)clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>{toast.hidden=true;},duration);
}

function updateEnvironmentClasses(){
  if(typeof document==='undefined')return;
  document.body.classList.toggle('field-standalone',isStandaloneMode());
  document.body.classList.toggle('field-offline',typeof navigator!=='undefined'&&!navigator.onLine);
  document.body.classList.toggle('field-landscape',typeof window!=='undefined'&&window.innerWidth>window.innerHeight);
}

function removeInstallButton(){document.querySelector('#fieldInstallButton')?.remove();}

function ensureInstallButton(){
  if(typeof document==='undefined')return;
  if(isStandaloneMode()||!deferredInstallPrompt){removeInstallButton();return;}
  const tools=getHeaderTools();if(!tools||tools.querySelector('#fieldInstallButton'))return;
  const button=document.createElement('button');
  button.id='fieldInstallButton';button.type='button';button.className='field-install-chip';button.textContent='INSTALL';
  button.setAttribute('aria-label','Install NOSMO Emergency Core');
  button.addEventListener('click',async()=>{
    if(!deferredInstallPrompt)return;
    const prompt=deferredInstallPrompt;deferredInstallPrompt=null;removeInstallButton();
    try{await prompt.prompt();const choice=await prompt.userChoice;if(choice?.outcome==='accepted')fieldNotice('INSTALLING NOSMO EMERGENCY CORE');}
    catch{fieldNotice('USE BROWSER MENU • INSTALL APP');}
  });
  tools.insertBefore(button,tools.firstChild);
}

function handleConnectivityChange(){
  updateEnvironmentClasses();
  if(typeof navigator==='undefined')return;
  fieldNotice(navigator.onLine?'ONLINE':'OFFLINE • EMERGENCY CORE READY');
}

function handleControllerChange(){
  if(typeof navigator==='undefined'||!('serviceWorker' in navigator))return;
  const activeIncident=Boolean(getEmergencySnapshot());
  if(activeIncident){fieldNotice('UPDATE READY • APPLIES AFTER EMERGENCY',4200);hadServiceWorkerController=true;return;}
  if(hadServiceWorkerController){
    try{
      if(sessionStorage.getItem(FIELD_RELOAD_GUARD)!=='1'){
        sessionStorage.setItem(FIELD_RELOAD_GUARD,'1');
        window.location.reload();return;
      }
    }catch{}
  }
  hadServiceWorkerController=true;
}

function initFieldRuntime(){
  if(typeof window==='undefined'||typeof document==='undefined')return;
  updateEnvironmentClasses();
  ensureInstallButton();
  window.addEventListener('resize',updateEnvironmentClasses,{passive:true});
  window.addEventListener('orientationchange',updateEnvironmentClasses,{passive:true});
  window.addEventListener('online',handleConnectivityChange);
  window.addEventListener('offline',handleConnectivityChange);
  window.addEventListener('beforeinstallprompt',(event)=>{event.preventDefault();deferredInstallPrompt=event;ensureInstallButton();});
  window.addEventListener('appinstalled',()=>{deferredInstallPrompt=null;removeInstallButton();updateEnvironmentClasses();fieldNotice('NOSMO EMERGENCY CORE INSTALLED');});
  window.addEventListener('pageshow',()=>{updateEnvironmentClasses();ensureInstallButton();});
  if('serviceWorker' in navigator)navigator.serviceWorker.addEventListener('controllerchange',handleControllerChange);
}

initFieldRuntime();

globalThis.NOSMOField=Object.freeze({isStandalone:isStandaloneMode,notice:fieldNotice});
