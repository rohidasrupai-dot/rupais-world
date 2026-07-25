(function(){
  class RupaiSyncStatus extends HTMLElement{
    connectedCallback(){this.setAttribute('role','status');this.setAttribute('aria-live','polite');this.render();window.addEventListener('rupai:sync-changed',()=>this.render());window.addEventListener('online',()=>this.render());window.addEventListener('offline',()=>this.render())}
    render(){const session=window.RupaiAuth?.readSession(),userId=this.getAttribute('user-id')||session?.userId;if(!userId||!window.RupaiSync){this.innerHTML='<span>Sync unavailable</span>';return}let device=RupaiSync.listDevices(userId).find(x=>x.current);if(!device)device=RupaiSync.registerDevice(userId,{label:'This browser'});const state=RupaiSync.status(userId,device.id);this.dataset.state=state.state;this.innerHTML=`<span class="sync-dot" aria-hidden="true"></span><strong>${state.message}</strong><small>${state.pending} pending · ${state.conflicts} conflicts</small>`}
  }
  customElements.define('rupai-sync-status',RupaiSyncStatus);
})();
