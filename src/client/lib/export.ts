import type { GanttItem } from './gantt'

type SerializedItem = {
  id: string
  title: string
  code: string
  start: string
  end: string
  status: string
  assignees: Array<{ login: string; avatarUrl: string }>
  progress: number
  issueNumber: number
  url: string
  labels: Array<{ name: string; color: string }>
  iteration: string | null
  milestone: { title: string; description: string; dueOn: string | null } | null
  description?: string
  dependencies?: string[]
}

function serialize(items: GanttItem[]): SerializedItem[] {
  return items.map((item) => ({
    ...item,
    start: item.start.toISOString(),
    end: item.end.toISOString(),
  }))
}

export function generateStandaloneHtml(items: GanttItem[], title: string): string {
  const data = JSON.stringify(serialize(items))
  const escapedTitle = title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapedTitle} — Gantt</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300..700;1,9..40,300..700&family=DM+Mono:ital,wght@0,400;0,500;1,400;1,500&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;overflow:hidden}
body{background:#07172e;color:#e8f4fd;font-family:"DM Sans",sans-serif;-webkit-font-smoothing:antialiased}
::-webkit-scrollbar{width:6px;height:6px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#1e3a5f;border-radius:3px}
#gantt{height:100vh;display:flex;flex-direction:column;overflow:hidden}
.gantt-header{flex-shrink:0;border-bottom:1px solid #1e3a5f;padding:10px 16px;display:flex;align-items:center;gap:12px}
.gantt-header h1{font-size:14px;font-weight:600;color:#e8f4fd}
.gantt-header span.count{font-size:12px;color:#7aa3c8}
.gantt-scroll{flex:1;overflow:auto}
.timeline{position:sticky;top:0;z-index:20;display:flex;border-bottom:1px solid #1e3a5f;background:#0d2040}
.timeline-sidebar{flex-shrink:0;display:flex;align-items:flex-end;padding:0 12px 4px;border-right:1px solid #1e3a5f;background:#0d2040;position:sticky;left:0;z-index:30}
.timeline-sidebar span{font-size:12px;font-weight:500;color:#7aa3c8}
.timeline-body{position:relative}
.timeline-months{display:flex}
.timeline-month{overflow:hidden;border-right:1px solid #1e3a5f;padding:0 8px;display:flex;align-items:center;font-size:12px;font-weight:500;color:#7aa3c8;white-space:nowrap}
.timeline-weeks{position:relative}
.week-label{position:absolute;top:0;display:flex;align-items:center;padding:0 4px;font-size:10px;color:#4988C4;white-space:nowrap}
.week-line{position:absolute;top:0;bottom:0;width:1px;background:#1e3a5f}
.today-line-header{position:absolute;top:0;z-index:10;width:2px;background:#BDE8F5;opacity:.6}
.milestone-diamond{position:absolute;top:50%;transform:translateY(-50%);z-index:20;cursor:pointer}
.milestone-diamond .diamond{height:12px;width:12px;transform:rotate(45deg);border:1px solid #64CCC5;background:#64CCC5;opacity:.4}
.milestone-diamond .tooltip-hint{display:none;position:absolute;left:50%;transform:translateX(-50%);top:16px;white-space:nowrap;z-index:30;background:#0d2040;border:1px solid #1e3a5f;border-radius:4px;padding:2px 8px;font-size:10px;color:#64CCC5;font-weight:500;pointer-events:none}
.milestone-diamond:hover .tooltip-hint{display:block}
.gantt-rows{position:relative}
.today-line-rows{position:absolute;top:0;bottom:0;z-index:10;width:2px;background:#BDE8F5;opacity:.25;pointer-events:none}
.ms-line{position:absolute;top:0;bottom:0;z-index:10;pointer-events:none;border-left:1px dashed #64CCC5;opacity:.3}
.gantt-row{display:flex;border-bottom:1px solid rgba(30,58,95,.125)}
.gantt-sidebar{flex-shrink:0;display:flex;align-items:center;gap:8px;padding:0 12px;border-right:1px solid #1e3a5f;position:sticky;left:0;z-index:10}
.gantt-sidebar .dot{height:6px;width:6px;flex-shrink:0;border-radius:2px}
.gantt-sidebar .info{min-width:0;flex:1}
.gantt-sidebar .info .task-title{font-size:12px;color:#e8f4fd;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block;text-decoration:none}
.gantt-sidebar .info .task-title:hover{color:#fff}
.gantt-sidebar .meta{display:flex;align-items:center;gap:4px;margin-top:2px}
.gantt-sidebar .meta .issue-num{font-family:"DM Mono",monospace;font-size:10px;color:#7aa3c8}
.gantt-sidebar .meta .code-badge{padding:0 4px;font-size:10px;line-height:1.4;border-radius:3px;font-weight:500}
.gantt-sidebar .meta .ms-name{font-family:"DM Mono",monospace;font-size:10px;color:#64CCC5;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100px}
.gantt-sidebar .assignees{display:flex;gap:2px;flex-shrink:0}
.gantt-sidebar .assignee-avatar{height:20px;width:20px;border-radius:50%;object-fit:cover;font-size:9px;display:flex;align-items:center;justify-content:center;color:#e8f4fd;font-weight:500;line-height:1}
.gantt-bar-area{flex-shrink:0;position:relative}
.gantt-bar{position:absolute;border-radius:4px;overflow:hidden;cursor:pointer}
.gantt-bar-fill{position:absolute;left:0;top:0;height:100%;border-radius:4px;opacity:.8}
.gantt-bar-label{position:absolute;left:6px;top:0;height:100%;display:flex;align-items:center;font-size:11px;font-family:"DM Mono",monospace;color:#e8f4fd;white-space:nowrap;z-index:1;pointer-events:none}
.gantt-tooltip{display:none;position:fixed;z-index:9999;min-width:200px;background:#0d2040;border:1px solid #1e3a5f;border-radius:8px;padding:10px 12px;font-size:12px;pointer-events:none;box-shadow:0 4px 20px rgba(0,0,0,.4)}
.gantt-tooltip.visible{display:block}
.gantt-tooltip .tt-title{font-weight:500;color:#e8f4fd;margin-bottom:4px}
.gantt-tooltip .tt-desc{font-size:11px;color:#7aa3c8;margin-bottom:4px;line-height:1.4}
.gantt-tooltip .tt-row{display:flex;align-items:center;gap:6px;color:#7aa3c8;font-size:11px;margin-bottom:2px}
.gantt-tooltip .tt-dot{height:8px;width:8px;flex-shrink:0;border-radius:2px}
.gantt-tooltip .tt-sep{color:#1e3a5f}
.gantt-tooltip .tt-milestone{color:#64CCC5;font-size:11px}
.gantt-tooltip .tt-assignees{display:flex;gap:4px;margin-top:4px}
.gantt-tooltip .tt-assignee{display:flex;align-items:center;gap:4px;font-size:11px;color:#7aa3c8}
.gantt-tooltip .tta-avatar{height:16px;width:16px;border-radius:50%;object-fit:cover;font-size:8px;display:flex;align-items:center;justify-content:center;color:#e8f4fd;font-weight:500;line-height:1}
</style>
</head>
<body>
<div id="gantt">
  <div class="gantt-header">
    <h1>${escapedTitle}</h1>
    <span class="count" id="item-count"></span>
  </div>
  <div class="gantt-scroll" id="gantt-scroll"></div>
</div>
<div class="gantt-tooltip" id="tooltip"></div>
<script>
(function(){
const ITEMS = ${data};

const SIDEBAR_WIDTH = 260;
const ROW_HEIGHT = 48;
const HEADER_HEIGHT = 56;
const DAY_WIDTH = 28;
const BAR_PAD = 10;

const CODE_COLORS = { IS:'#4988C4', UTU:'#64CCC5', FS:'#7B68EE', ASO:'#F4A261', OTHER:'#7aa3c8' };
function getColor(code){ return CODE_COLORS[code] || CODE_COLORS.OTHER; }

function startOfDay(d){ var r=new Date(d); r.setHours(0,0,0,0); return r; }
function addDays(d,n){ var r=new Date(d); r.setDate(r.getDate()+n); return r; }
function daysBetween(a,b){ return Math.ceil((b.getTime()-a.getTime())/(86400000)); }

function fmt(d){ return new Intl.DateTimeFormat('en-US',{day:'2-digit',month:'short'}).format(d); }
function fmtFull(d){ return new Intl.DateTimeFormat('en-US',{year:'numeric',month:'short',day:'2-digit'}).format(d); }

function eachWeekStart(start,end){
  var w=[], d=new Date(start); d.setHours(0,0,0,0);
  var day=d.getDay(); d.setDate(d.getDate()-((day+6)%7));
  while(d<=end){ w.push(new Date(d)); d.setDate(d.getDate()+7); }
  return w;
}

function getMonthSpans(start,end){
  var spans=[], cur=new Date(start); cur.setHours(0,0,0,0); var off=0, totalDays=0;
  while(cur<=end){
    var m=cur.getMonth(), y=cur.getFullYear(), days=0, spanStart=off;
    while(cur.getMonth()===m && cur.getFullYear()===y && cur<=end){ days++; cur.setDate(cur.getDate()+1); }
    spans.push({ label:new Intl.DateTimeFormat('en-US',{month:'short',year:'numeric'}).format(new Date(y,m,1)), days:days, startOffset:spanStart*DAY_WIDTH });
    off+=days; totalDays+=days;
  }
  return spans;
}

var scrollEl = document.getElementById('gantt-scroll');
var tooltip = document.getElementById('tooltip');
document.getElementById('item-count').textContent = ITEMS.length + ' items';

if(!ITEMS.length){
  scrollEl.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:256px;color:#7aa3c8;font-size:14px">No items to display.</div>';
} else {
  var today = startOfDay(new Date());
  var endOfYear = new Date(today.getFullYear(),11,31);

  var allStart = ITEMS.map(function(i){ return new Date(i.start).getTime(); });
  var allEnd = ITEMS.map(function(i){ return new Date(i.end).getTime(); });
  var minStart = new Date(Math.min.apply(null, allStart));
  var maxEnd = new Date(Math.max.apply(null, allEnd));
  var chartStart = addDays(startOfDay(minStart), -7);
  var chartEnd = new Date(Math.max(addDays(startOfDay(maxEnd),7).getTime(), endOfYear.getTime()));
  var totalWidth = daysBetween(chartStart, chartEnd) * DAY_WIDTH;
  var todayOffset = daysBetween(chartStart, today) * DAY_WIDTH;

  var milestones = [];
  var msMap = {};
  ITEMS.forEach(function(item){
    if(item.milestone && item.milestone.dueOn){
      var key = item.milestone.title;
      if(!msMap[key]){ msMap[key]=startOfDay(new Date(item.milestone.dueOn)); }
    }
  });
  var msKeys = Object.keys(msMap).sort(function(a,b){ return msMap[a].getTime()-msMap[b].getTime(); });
  msKeys.forEach(function(k){ milestones.push({title:k,date:msMap[k]}); });

  var monthSpans = getMonthSpans(chartStart, chartEnd);
  var weeks = eachWeekStart(chartStart, chartEnd);

  var fullWidth = SIDEBAR_WIDTH + totalWidth;

  // Build timeline header
  var timelineHtml = '<div class="timeline" style="width:'+fullWidth+'px;height:'+HEADER_HEIGHT+'px">';
  timelineHtml += '<div class="timeline-sidebar" style="width:'+SIDEBAR_WIDTH+'px;height:'+HEADER_HEIGHT+'px"><span>Task</span></div>';
  timelineHtml += '<div class="timeline-body" style="width:'+totalWidth+'px;height:'+HEADER_HEIGHT+'px">';

  // Month labels
  timelineHtml += '<div class="timeline-months" style="height:26px">';
  monthSpans.forEach(function(s){
    timelineHtml += '<div class="timeline-month" style="width:'+(s.days*DAY_WIDTH)+'px;height:26px">'+s.label+'</div>';
  });
  timelineHtml += '</div>';

  // Week labels + lines
  timelineHtml += '<div class="timeline-weeks" style="height:30px;position:relative">';
  weeks.forEach(function(w){
    var off = Math.max(0, daysBetween(chartStart, w)) * DAY_WIDTH;
    if(off>totalWidth) return;
    timelineHtml += '<div class="week-label" style="left:'+off+'px;width:'+(7*DAY_WIDTH)+'px;height:30px">'+fmt(w)+'</div>';
    timelineHtml += '<div class="week-line" style="left:'+off+'px"></div>';
  });
  timelineHtml += '</div>';

  // Today line in header
  if(todayOffset>=0 && todayOffset<=totalWidth){
    timelineHtml += '<div class="today-line-header" style="left:'+todayOffset+'px;height:'+HEADER_HEIGHT+'px"></div>';
  }

  // Milestone diamonds in header
  milestones.forEach(function(m){
    var off = daysBetween(chartStart, m.date)*DAY_WIDTH;
    if(off<0||off>totalWidth) return;
    timelineHtml += '<div class="milestone-diamond" style="left:'+(off-6)+'px">';
    timelineHtml += '<div class="diamond"></div><div class="tooltip-hint">'+m.title+'</div>';
    timelineHtml += '</div>';
  });

  timelineHtml += '</div></div>';

  // Build rows
  var rowsHtml = '<div class="gantt-rows">';

  // Today line through rows
  if(todayOffset>=0 && todayOffset<=totalWidth){
    rowsHtml += '<div class="today-line-rows" style="left:'+(SIDEBAR_WIDTH+todayOffset)+'px"></div>';
  }

  // Milestone lines through rows
  milestones.forEach(function(m){
    var off = daysBetween(chartStart, m.date)*DAY_WIDTH;
    if(off<0||off>totalWidth) return;
    rowsHtml += '<div class="ms-line" style="left:'+(SIDEBAR_WIDTH+off)+'px"></div>';
  });

  ITEMS.forEach(function(item,idx){
    var isEven = idx%2===0;
    var bg = isEven ? '#07172e' : '#080e1c';
    var color = getColor(item.code);
    var itemStart = startOfDay(new Date(item.start));
    var itemEnd = startOfDay(new Date(item.end));
    var left = Math.max(0, daysBetween(chartStart, itemStart))*DAY_WIDTH;
    var width = Math.max(1, daysBetween(itemStart, itemEnd))*DAY_WIDTH;
    var barH = ROW_HEIGHT - BAR_PAD*2;
    var hasLabel = width > 40;

    rowsHtml += '<div class="gantt-row" style="height:'+ROW_HEIGHT+'px">';

    // Sidebar
    rowsHtml += '<div class="gantt-sidebar" style="width:'+SIDEBAR_WIDTH+'px;height:'+ROW_HEIGHT+'px;background:'+bg+'">';
    rowsHtml += '<div class="dot" style="background:'+color+'"></div>';
    rowsHtml += '<div class="info">';
    rowsHtml += item.url
      ? '<a class="task-title" href="'+item.url+'" target="_blank" rel="noopener">'+escHtml(item.title)+'</a>'
      : '<span class="task-title">'+escHtml(item.title)+'</span>';
    rowsHtml += '<div class="meta">';
    rowsHtml += '<span class="issue-num">#'+item.issueNumber+'</span>';
    rowsHtml += '<span class="code-badge" style="background:'+color+'22;color:'+color+'">'+escHtml(item.code)+'</span>';
    if(item.milestone){
      rowsHtml += '<span class="ms-name">'+escHtml(item.milestone.title)+'</span>';
    }
    rowsHtml += '</div></div>';

    // Assignee avatars
    if(item.assignees.length){
      rowsHtml += '<div class="assignees">';
      item.assignees.slice(0,2).forEach(function(a){
        rowsHtml += '<img class="assignee-avatar" src="'+escAttr(a.avatarUrl)+'" alt="'+escAttr(a.login)+'" title="'+escAttr(a.login)+'" onerror="this.outerHTML=\\'<span class=assignee-avatar style=background:#1e3a5f>'+escAttr(a.login[0].toUpperCase())+'</span>\\'">';
      });
      rowsHtml += '</div>';
    }

    rowsHtml += '</div>';

    // Bar area
    rowsHtml += '<div class="gantt-bar-area" style="width:'+totalWidth+'px;height:'+ROW_HEIGHT+'px;background:'+bg+'">';
    rowsHtml += '<div class="gantt-bar" data-idx="'+idx+'" style="left:'+left+'px;top:'+BAR_PAD+'px;width:'+Math.max(width,6)+'px;height:'+barH+'px;background:'+color+'33;border:1px solid '+color+'66">';
    rowsHtml += '<div class="gantt-bar-fill" style="width:'+(item.progress*100)+'%;background:'+color+'"></div>';
    if(hasLabel){
      rowsHtml += '<span class="gantt-bar-label" style="max-width:'+Math.max(width-12,0)+'px">#'+item.issueNumber+'</span>';
    }
    rowsHtml += '</div></div>';

    rowsHtml += '</div>';
  });

  rowsHtml += '</div>';

  scrollEl.innerHTML = '<div style="width:'+fullWidth+'px;min-width:100%">'+timelineHtml+rowsHtml+'</div>';

  // Tooltip logic
  var bars = scrollEl.querySelectorAll('.gantt-bar');
  bars.forEach(function(bar){
    bar.addEventListener('mouseenter', function(e){
      var idx = parseInt(bar.getAttribute('data-idx'));
      var item = ITEMS[idx];
      var color = getColor(item.code);
      var html = '<div class="tt-title">'+escHtml(item.title)+'</div>';
      if(item.description) html += '<div class="tt-desc">'+escHtml(item.description)+'</div>';
      html += '<div class="tt-row"><div class="tt-dot" style="background:'+color+'"></div>'+escHtml(item.code)+'<span class="tt-sep">·</span>'+escHtml(item.status)+'<span class="tt-sep">·</span>'+Math.round(item.progress*100)+'%</div>';
      html += '<div class="tt-row">'+fmtFull(itemStart)+' → '+fmtFull(itemEnd)+'</div>';
      if(item.milestone){
        html += '<div class="tt-milestone">Milestone: '+escHtml(item.milestone.title);
        if(item.milestone.dueOn) html += ' (due '+fmtFull(new Date(item.milestone.dueOn))+')';
        html += '</div>';
      }
      if(item.assignees.length){
        html += '<div class="tt-assignees">';
        item.assignees.forEach(function(a){
          html += '<div class="tt-assignee"><img class="tta-avatar" src="'+escAttr(a.avatarUrl)+'" alt="'+escAttr(a.login)+'" onerror="this.style.display=\\'none\\'">'+escHtml(a.login)+'</div>';
        });
        html += '</div>';
      }
      tooltip.innerHTML = html;
      tooltip.classList.add('visible');
    });
    bar.addEventListener('mousemove', function(e){
      var x = e.clientX + 12, y = e.clientY - 12;
      if(x+220>window.innerWidth) x = e.clientX - 220 - 12;
      if(y<0) y=4;
      tooltip.style.left = x+'px';
      tooltip.style.top = y+'px';
    });
    bar.addEventListener('mouseleave', function(){
      tooltip.classList.remove('visible');
    });
  });
}

function escHtml(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function escAttr(s){ return s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
})();
</script>
</body>
</html>`
}
