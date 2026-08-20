(function(){
  const subjects=[
    {id:'history',name:'History',kind:'subject'},{id:'ancient-history',name:'Ancient History',kind:'category',parent:'History'},
    {id:'medieval-history',name:'Medieval History',kind:'category',parent:'History'},{id:'modern-history',name:'Modern History',kind:'category',parent:'History'},
    {id:'geography',name:'Geography',kind:'subject'},{id:'polity',name:'Polity',kind:'subject'},{id:'economy',name:'Economy',kind:'subject'},
    {id:'science',name:'Science',kind:'subject'},{id:'environment',name:'Environment',kind:'subject'},{id:'reasoning',name:'Reasoning',kind:'subject'},
    {id:'maths',name:'Maths',kind:'subject'},{id:'english',name:'English',kind:'subject'},{id:'current-affairs',name:'Current Affairs',kind:'subject'}
  ];
  window.RupaiSubjectCatalog=Object.freeze(subjects.map(item=>Object.freeze({...item})));
})();
