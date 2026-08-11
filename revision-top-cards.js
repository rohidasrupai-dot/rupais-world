(function(){
  const list=(title,tasks)=>window.openReferenceTaskList(title,tasks);
  document.addEventListener('click',event=>{
    const action=event.target.closest('[data-ref-action]')?.dataset.refAction;
    if(!['pending-topics','revised-today','todays-goal','overall-progress','today-date','revision-streak'].includes(action))return;
    const revisionState=window.RupaiRevision.read(),today=new Date();
    if(action==='pending-topics')list('Pending Topics',revisionState.tasks.filter(task=>!task.isCompleted));
    if(action==='revised-today')list('Revised Today',revisionState.tasks.filter(task=>task.lastRevisedAt&&sameDay(task.lastRevisedAt,today)));
    if(action==='todays-goal')list("Today's Goal",revisionState.tasks.filter(task=>task.addedToGoal));
    if(action==='overall-progress')list('Overall Revision Progress',revisionState.tasks);
    if(action==='today-date')openCalendarDay(today.toISOString());
    if(action==='revision-streak')list('Revision Streak',revisionState.tasks.filter(task=>task.lastRevisedAt).sort((a,b)=>new Date(b.lastRevisedAt)-new Date(a.lastRevisedAt)));
  });
})();
