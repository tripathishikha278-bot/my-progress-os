(() => {
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const STORAGE = "myProgressOS.v1";
  const days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
  const dayShort = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const defaultTasks = [
    {id:1,title:"Revise today's college notes",category:"College",day:"Today",done:false,created:Date.now()},
    {id:2,title:"Continue the next Python lesson",category:"Python",day:"Today",done:false,created:Date.now()},
    {id:3,title:"Practise one small coding exercise",category:"Python",day:"Today",done:false,created:Date.now()}
  ];
  const defaultSchedule = [
    {day:"Monday",focus:"Python",blocks:[["College revision","45 min","college"],["Python lesson + exercises","60 min","python"],["Short practice","30 min","python"]]},
    {day:"Tuesday",focus:"DSA",blocks:[["College work","45 min","college"],["DSA concept","45 min","dsa"],["Easy practice problems","45 min","dsa"]]},
    {day:"Wednesday",focus:"Python",blocks:[["College work","45 min","college"],["Python practice","60 min","python"],["Review code / GitHub","20 min","project"]]},
    {day:"Thursday",focus:"DSA",blocks:[["College work","45 min","college"],["DSA learning","45 min","dsa"],["Problem + mistake review","45 min","dsa"]]},
    {day:"Friday",focus:"Project",blocks:[["College priorities","45 min","college"],["Python revision","45 min","python"],["Website development","45–60 min","project"]]},
    {day:"Saturday",focus:"College",blocks:[["Test / test preparation","As needed","college"],["Light coding review","Optional 30 min","python"],["Rest","Protect it","project"]]},
    {day:"Sunday",focus:"Review",blocks:[["Catch up on college","If needed","college"],["Project session","60–90 min","project"],["Weekly review","20 min","project"]]}
  ];
  const roadmap = [
    {title:"Python foundations",icon:"🐍",desc:"Learn to write programs independently.",topics:[
      ["Variables, types & input/output","Store values, convert types, use input() and print()."],
      ["Conditions","if, elif, else and boolean logic."],
      ["Loops","for, while, range and loop control."],
      ["Strings & collections","String operations, lists, tuples, sets and dictionaries."],
      ["Functions","Parameters, return values, scope and reusable code."],
      ["Files, exceptions & modules","Basic file handling, try/except and imports."]
    ]},
    {title:"DSA foundations",icon:"🧩",desc:"Start slowly and focus on understanding.",topics:[
      ["What are data structures & algorithms?","Know what each is used for."],
      ["Time complexity / Big-O","Understand constant, linear and logarithmic growth."],
      ["Arrays & strings","Traversal, searching, counting and simple patterns."],
      ["Linear & binary search","Know when binary search is valid."],
      ["Basic sorting","Understand bubble sort and selection/insertion sort."],
      ["Review mistakes","Re-solve problems without looking at the answer."]
    ]},
    {title:"Developer workflow",icon:"🛠️",desc:"Build confidence with everyday tools.",topics:[
      ["VS Code workflow","Organise folders, run code and use the terminal."],
      ["Git basics","status, add, commit, pull and push."],
      ["GitHub repositories","Keep C and Python practice separate."],
      ["README files","Explain the goal, setup and what you learned."],
      ["LinkedIn profile","Keep education and skills accurate."],
      ["Project milestones","Build, test, document and improve one small project."]
    ]},
    {title:"College & career foundations",icon:"🎓",desc:"Protect semester results and long-term learning.",topics:[
      ["Attend and review lectures","Keep up with notes and practical work."],
      ["Assignments & tests","Use deadlines to plan the week."],
      ["Mathematics revision","Practise calculus and other current syllabus topics."],
      ["LeetCode beginner practice","Start with problems related to current DSA topics."],
      ["Project reflection","Write what you built and what you learned."],
      ["ML readiness (later)","Strengthen Python and relevant mathematics first."]
    ]}
  ];
  const defaultProjects = [
    {id:1,name:"My Progress OS",description:"Your own dashboard to track tasks, learning and weekly progress.",status:"In progress",progress:25},
    {id:2,name:"Python mini project",description:"After fundamentals, build a calculator, quiz or expense tracker.",status:"Not started",progress:0},
    {id:3,name:"First AI/ML project",description:"A future project after Python and data-handling basics.",status:"Later",progress:0}
  ];
  const state = loadState();
  let currentFilter = "all", timerInterval=null, timerRemaining=25*60, timerRunning=false;
  function loadState(){
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE) || "null");
      if(saved) return {...saved,tasks:Array.isArray(saved.tasks)?saved.tasks:defaultTasks.map(x=>({...x})),schedule:Array.isArray(saved.schedule)?saved.schedule:defaultSchedule,roadmap:Array.isArray(saved.roadmap)?saved.roadmap:[],projects:Array.isArray(saved.projects)?saved.projects:defaultProjects.map(x=>({...x})),sessions:Array.isArray(saved.sessions)?saved.sessions:[],journal:Array.isArray(saved.journal)?saved.journal:[]};
    } catch(e) {}
    return {tasks:defaultTasks.map(x=>({...x})),schedule:defaultSchedule.map(x=>({...x,blocks:x.blocks.map(b=>[...b])})),roadmap:[],projects:defaultProjects.map(x=>({...x})),sessions:[],journal:[],review:{}};
  }
  function save(){try{localStorage.setItem(STORAGE,JSON.stringify(state));}catch(e){toast("Could not save in this browser. Check storage settings.");}}
  function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
  function toast(message){const el=$("#toast");el.textContent=message;el.classList.add("show");clearTimeout(toast._t);toast._t=setTimeout(()=>el.classList.remove("show"),2300);}
  function todayName(){return days[(new Date().getDay()+6)%7];}
  function dateKey(date=new Date()){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;}
  function todayTasks(){return state.tasks.filter(t=>t.day==="Today"||t.day===todayName()||t.day===dayShort[(new Date().getDay()+6)%7]);}
  function renderTasks(){
    const today = todayTasks(), list=$("#todayTaskList");
    list.innerHTML = today.map(taskRow).join(""); $("#emptyToday").classList.toggle("hidden",today.length>0);
    const all=$("#allTaskList");
    const filtered=state.tasks.filter(t=>currentFilter==="all"||(currentFilter==="done"?t.done:!t.done));
    all.innerHTML=filtered.map(taskRow).join("");$("#emptyAll").classList.toggle("hidden",filtered.length>0);
    $$(".filter").forEach(b=>b.classList.toggle("active",b.dataset.filter===currentFilter));
    $$(".task-check").forEach(el=>el.addEventListener("change",()=>{const task=state.tasks.find(t=>t.id===Number(el.dataset.id));if(task){task.done=el.checked;save();renderAll();toast(task.done?"Task completed. Nice work.":"Task moved back to to-do.");}}));
    $$(".delete-task").forEach(el=>el.addEventListener("click",()=>{state.tasks=state.tasks.filter(t=>t.id!==Number(el.dataset.id));save();renderAll();toast("Task deleted.");}));
    const todaysDone=today.filter(t=>t.done).length,pct=today.length?Math.round(todaysDone/today.length*100):0;
    $("#overallPercent").textContent=pct+"%";$("#overallBar").style.width=pct+"%";
  }
  function taskRow(t){return `<div class="task-row ${t.done?"is-done":""}"><input class="task-check" type="checkbox" data-id="${t.id}" ${t.done?"checked":""} aria-label="Mark ${escapeHtml(t.title)} complete"><div class="task-copy"><strong>${escapeHtml(t.title)}</strong><small>${escapeHtml(t.day)} · ${escapeHtml(t.category)}</small></div><span class="tag ${escapeHtml(t.category)}">${escapeHtml(t.category)}</span><button class="delete-task" data-id="${t.id}" title="Delete task" aria-label="Delete task">×</button></div>`;}
  function addTask(title,category,day){if(!title.trim())return;state.tasks.unshift({id:Date.now()+Math.floor(Math.random()*1000),title:title.trim(),category,day,done:false,created:Date.now()});save();renderAll();toast("Task added.");}
  function renderSchedule(){
    $("#weekPreview").innerHTML=state.schedule.map((d,i)=>`<div class="day-preview"><strong>${dayShort[i]}</strong><small>${i+1}</small>${d.blocks.slice(0,3).map(b=>`<div class="day-focus ${b[2]}">${escapeHtml(b[0])}</div>`).join("")}</div>`).join("");
    $("#fullSchedule").innerHTML=state.schedule.map(d=>`<div class="schedule-day"><div class="schedule-day-label"><b>${escapeHtml(d.day)}</b><small>Focus: ${escapeHtml(d.focus)}</small></div><div class="schedule-blocks">${d.blocks.map(b=>`<div class="schedule-block ${b[2]}"><b>${escapeHtml(b[0])}</b><small>${escapeHtml(b[1])}</small></div>`).join("")}</div></div>`).join("");
  }
  function renderRoadmap(){
    $("#roadmapGrid").innerHTML=roadmap.map((group,gi)=>`<article class="roadmap-card"><div class="roadmap-card-head"><div class="roadmap-emoji">${group.icon}</div><div><h3>${group.title}</h3><p>${group.desc}</p></div></div><div class="topic-list">${group.topics.map((topic,ti)=>{const id=`${gi}-${ti}`,checked=state.roadmap.includes(id);return `<label class="topic-item"><input type="checkbox" data-topic="${id}" ${checked?"checked":""}><span>${topic[0]}<small>${topic[1]}</small></span></label>`;}).join("")}</div></article>`).join("");
    $$("[data-topic]").forEach(el=>el.addEventListener("change",()=>{const id=el.dataset.topic;state.roadmap=el.checked?[...new Set([...state.roadmap,id])]:state.roadmap.filter(x=>x!==id);save();renderProgress();toast(el.checked?"Topic marked as practised.":"Topic unchecked.");}));
  }
  function renderProjects(){
    $("#projectGrid").innerHTML=state.projects.map(p=>`<article class="project-card"><div class="project-top"><div class="project-symbol">✧</div><span class="status-pill ${p.status==="Not started"||p.status==="Later"?"not-started":""}">${escapeHtml(p.status)}</span></div><h3>${escapeHtml(p.name)}</h3><p>${escapeHtml(p.description)}</p><div class="project-progress-label"><span>Progress</span><b>${p.progress}%</b></div><input type="range" min="0" max="100" step="5" value="${p.progress}" data-project-progress="${p.id}" aria-label="Project progress for ${escapeHtml(p.name)}"><div class="project-actions"><select data-project-status="${p.id}" aria-label="Project status"><option ${p.status==="Not started"?"selected":""}>Not started</option><option ${p.status==="In progress"?"selected":""}>In progress</option><option ${p.status==="Completed"?"selected":""}>Completed</option><option ${p.status==="Later"?"selected":""}>Later</option></select><button data-project-delete="${p.id}" title="Delete project" aria-label="Delete project">Delete ×</button></div></article>`).join("");
    $$("[data-project-progress]").forEach(el=>el.addEventListener("input",()=>{const p=state.projects.find(p=>p.id===Number(el.dataset.projectProgress));if(p){p.progress=Number(el.value);if(p.progress===100)p.status="Completed";save();renderProjects();renderProgress();}}));
    $$("[data-project-status]").forEach(el=>el.addEventListener("change",()=>{const p=state.projects.find(p=>p.id===Number(el.dataset.projectStatus));if(p){p.status=el.value;if(el.value==="Completed")p.progress=100;save();renderProjects();renderProgress();}}));
    $$("[data-project-delete]").forEach(el=>el.addEventListener("click",()=>{state.projects=state.projects.filter(p=>p.id!==Number(el.dataset.projectDelete));save();renderProjects();renderProgress();toast("Project removed.");}));
  }
  function renderProgress(){
    const totalDone=state.tasks.filter(t=>t.done).length,totalMinutes=state.sessions.reduce((s,x)=>s+x.minutes,0);
    $("#totalDone").textContent=totalDone;$("#totalMinutes").textContent=totalMinutes;$("#topicsDone").textContent=state.roadmap.length;$("#projectsActive").textContent=state.projects.filter(p=>p.status==="In progress").length;
    const todayMins=state.sessions.filter(s=>s.date===dateKey()).reduce((s,x)=>s+x.minutes,0);$("#todayMinutes").textContent=todayMins;
    const categories=["Python","DSA","College","Project","LeetCode","Other"],vals=categories.map(c=>state.sessions.filter(s=>s.category===c&&isThisWeek(s.date)).reduce((sum,s)=>sum+s.minutes,0)),max=Math.max(30,...vals);
    $("#focusChart").innerHTML=categories.map((c,i)=>`<div class="chart-column"><div class="chart-bar-wrap"><div class="chart-bar" style="height:${Math.max(3,vals[i]/max*100)}%"></div></div><b>${vals[i]}m</b><small>${c}</small></div>`).join("");
  }
  function isThisWeek(dateStr){const d=new Date(dateStr+"T12:00:00"),now=new Date();const start=new Date(now);start.setDate(now.getDate()-((now.getDay()+6)%7));start.setHours(0,0,0,0);const end=new Date(start);end.setDate(start.getDate()+7);return d>=start&&d<end;}
  function renderJournal(){
    $("#journalHistory").innerHTML=state.journal.slice(0,7).map(j=>`<article class="history-item"><strong>${escapeHtml(j.date)}</strong>${j.worked?`<p><b>How I spent my day:</b> ${escapeHtml(j.worked)}</p>`:""}${j.learned?`<p><b>Productive things:</b> ${escapeHtml(j.learned)}</p>`:""}${j.mood?`<p><b>Focus:</b> ${escapeHtml(j.mood)}</p>`:""}${j.scrolling?`<p><b>Scrolling / distractions:</b> ${escapeHtml(j.scrolling)}</p>`:""}${j.reflection?`<p><b>Reflection:</b> ${escapeHtml(j.reflection)}</p>`:""}${j.tomorrow?`<p><b>Tomorrow's first step:</b> ${escapeHtml(j.tomorrow)}</p>`:""}</article>`).join("")||'<p class="muted small">Your saved notes will appear here.</p>';
  }
  function renderAll(){renderTasks();renderSchedule();renderRoadmap();renderProjects();renderProgress();renderJournal();}
  function navigate(view){
    $$(".view").forEach(v=>v.classList.toggle("active",v.id===`view-${view}`));
    $$(".nav-link").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
    $("#sidebar").classList.remove("open");window.scrollTo({top:0,behavior:"smooth"});
  }
  $$(".nav-link").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.view)));
  $$("[data-goto]").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.goto)));
  $("#menuButton").addEventListener("click",()=>$("#sidebar").classList.toggle("open"));
  $("#quickTaskForm").addEventListener("submit",e=>{e.preventDefault();addTask($("#quickTaskInput").value,$("#quickTaskCategory").value,"Today");$("#quickTaskInput").value="";});
  $("#taskForm").addEventListener("submit",e=>{e.preventDefault();addTask($("#taskInput").value,$("#taskCategory").value,$("#taskDay").value);$("#taskInput").value="";});
  $$(".filter").forEach(b=>b.addEventListener("click",()=>{currentFilter=b.dataset.filter;renderTasks();}));
  $("#resetSchedule").addEventListener("click",()=>{if(confirm("Restore the original weekly schedule template?")){state.schedule=defaultSchedule.map(x=>({...x,blocks:x.blocks.map(b=>[...b])}));save();renderSchedule();toast("Schedule template restored.");}});
  $("#addProjectButton").addEventListener("click",()=>{const name=prompt("Project name?");if(!name||!name.trim())return;const description=prompt("What will this project do?")||"A personal learning project.";state.projects.push({id:Date.now(),name:name.trim(),description:description.trim(),status:"Not started",progress:0});save();renderProjects();renderProgress();toast("Project added.");});
  function updateTimerDisplay(){const m=Math.floor(timerRemaining/60),s=timerRemaining%60;$("#timerDisplay").textContent=`${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;}
  function stopTimer(){if(timerInterval)clearInterval(timerInterval);timerInterval=null;timerRunning=false;$("#timerStart").textContent="Start focus";}
  $("#timerStart").addEventListener("click",()=>{
    if(timerRunning){stopTimer();$("#timerStatus").textContent="Timer paused. Resume when ready.";return;}
    if(timerRemaining<=0)timerRemaining=Math.max(5,Math.min(120,Number($("#timerLength").value)||25))*60;
    timerRunning=true;$("#timerStart").textContent="Pause";
    $("#timerStatus").textContent="Focus on one thing. You can pause whenever you need.";
    timerInterval=setInterval(()=>{timerRemaining--;updateTimerDisplay();if(timerRemaining<=0){stopTimer();const mins=Math.max(1,Math.round((Number($("#timerLength").value)||25)));state.sessions.push({date:dateKey(),minutes:mins,category:$("#timerCategory").value});save();renderProgress();$("#timerStatus").textContent="Session complete. Take a short break.";toast("Focus session complete. Well done.");timerRemaining=0;updateTimerDisplay();}},1000);
  });
  $("#timerReset").addEventListener("click",()=>{stopTimer();timerRemaining=Math.max(5,Math.min(120,Number($("#timerLength").value)||25))*60;updateTimerDisplay();$("#timerStatus").textContent="Timer reset. Ready when you are.";});
  $("#timerLength").addEventListener("change",()=>{if(!timerRunning){timerRemaining=Math.max(5,Math.min(120,Number($("#timerLength").value)||25))*60;updateTimerDisplay();}});
  $("#saveJournal").addEventListener("click",()=>{const entry={date:dateKey(),learned:$("#journalLearned").value.trim(),worked:$("#journalWorked").value.trim(),tomorrow:$("#journalTomorrow").value.trim(),mood:$("#journalMood").value,scrolling:$("#journalScrolling").value.trim(),reflection:$("#journalReflection").value.trim()};if(!entry.learned&&!entry.worked&&!entry.tomorrow&&!entry.mood&&!entry.scrolling&&!entry.reflection){toast("Write a short note before saving.");return;}state.journal=state.journal.filter(j=>j.date!==entry.date);state.journal.unshift(entry);save();renderJournal();$("#journalSaved").textContent="Saved on this browser.";setTimeout(()=>$("#journalSaved").textContent="",2500);});
  $("#saveReview").addEventListener("click",()=>{state.review={date:dateKey(),wentWell:$("#reviewWentWell").value,difficult:$("#reviewDifficult").value,next:$("#reviewNext").value};save();$("#reviewSaved").textContent="Weekly review saved.";setTimeout(()=>$("#reviewSaved").textContent="",2500);});
  const now=new Date();$("#dateLabel").textContent=now.toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric"}).toUpperCase();
  const hour=now.getHours();$("#greeting").textContent=hour<12?"Good morning. Let's make today count.":hour<17?"Good afternoon. Keep your momentum.":"Good evening. One step at a time.";
  const focusMap={Monday:"Python + College",Tuesday:"DSA + College",Wednesday:"Python + GitHub",Thursday:"DSA + College",Friday:"Project + Python",Saturday:"College + Rest",Sunday:"Review + Project"};$("#focusSubject").textContent=focusMap[todayName()]||"College + Learning";
  if(state.review){$("#reviewWentWell").value=state.review.wentWell||"";$("#reviewDifficult").value=state.review.difficult||"";$("#reviewNext").value=state.review.next||"";}
  const todayEntry=state.journal.find(j=>j.date===dateKey());if(todayEntry){$("#journalLearned").value=todayEntry.learned||"";$("#journalWorked").value=todayEntry.worked||"";$("#journalTomorrow").value=todayEntry.tomorrow||"";$("#journalMood").value=todayEntry.mood||"";$("#journalScrolling").value=todayEntry.scrolling||"";$("#journalReflection").value=todayEntry.reflection||"";}
  const thoughts = [
    ["You don't need to have it all figured out. Just keep showing up.","Your future is built by the small things you repeat."],
    ["You are allowed to be a beginner and still be ambitious.","Every expert once had a first day."],
    ["Progress is not doing everything. It is doing the next right thing.","Choose focus over pressure today."],
    ["A focused 30 minutes is better than a perfect plan you never start.","Start small. Keep going."],
    ["Your pace is valid. Your effort still counts.","Build skills, not comparisons."],
    ["You can restart your day at any moment.","One small win can change the direction of a day."],
    ["Don't wait to feel motivated. Make the first step tiny.","Action often brings motivation along."]
  ];
  let thoughtIndex = Math.floor((new Date().getDate()+new Date().getMonth()) % thoughts.length);
  function showThought(){const thought=thoughts[thoughtIndex];$("#motivationQuote").textContent=thought[0];$("#motivationAuthor").textContent=thought[1];}
  $("#newMotivation").addEventListener("click",()=>{thoughtIndex=(thoughtIndex+1)%thoughts.length;showThought();});
  showThought();
  updateTimerDisplay();renderAll();
})();