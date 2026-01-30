<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<title>Bizim Chat</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<script src="/socket.io/socket.io.js"></script>

<style>
*{box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI"}
body{margin:0;background:#0f172a;color:#fff;height:100vh}
.hidden{display:none}

/* NAME */
#nameBox{
  height:100vh;display:flex;flex-direction:column;
  justify-content:center;align-items:center;gap:12px
}
#nameBox input{
  padding:16px;width:260px;border-radius:14px;border:none;font-size:18px
}

/* APP */
.app{display:flex;height:100vh}
.sidebar{
  width:220px;background:#020617;padding:10px;overflow-y:auto
}
.user{
  padding:10px;border-radius:10px;cursor:pointer
}
.user:hover{background:#1e293b}

.chat{flex:1;display:flex;flex-direction:column}
.header{
  padding:14px;background:#020617;font-weight:600;text-align:center
}
.messages{
  flex:1;padding:12px;overflow-y:auto
}
.msg{
  max-width:80%;padding:10px 14px;border-radius:16px;
  margin-bottom:10px;font-size:15px;word-wrap:break-word
}
.me{background:#2563eb;margin-left:auto}
.other{background:#1e293b}
.dm{border:2px solid #f59e0b}

.msg img,.msg video{max-width:100%;border-radius:12px}

/* INPUT */
.inputBar{
  display:flex;gap:8px;padding:10px;background:#020617
}
.inputBar input[type=text]{
  flex:1;padding:14px;border-radius:14px;border:none;font-size:16px
}
.inputBar button,label{
  padding:14px;border:none;border-radius:14px;
  background:#2563eb;color:#fff;font-size:18px
}

/* MOBILE */
@media(max-width:700px){
  .sidebar{display:none}
  .msg{max-width:90%}
}
</style>
</head>

<body>

<div id="nameBox">
  <h2>Adın?</h2>
  <input id="nameInput" placeholder="İsmini yaz ve Enter">
</div>

<div class="app hidden" id="app">
  <div class="sidebar">
    <h3>Online</h3>
    <div id="users"></div>
  </div>

  <div class="chat">
    <div class="header" id="title">Genel Chat</div>
    <div class="messages" id="messages"></div>

    <div class="inputBar">
      <label for="file">📷</label>
      <input type="file" id="file" accept="image/*,video/*" capture="environment" hidden>
      <input type="text" id="msg" placeholder="Mesaj yaz"
        onkeydown="if(event.key==='Enter')send()">
      <button onclick="send()">➤</button>
    </div>
  </div>
</div>

<audio id="sound">
  <source src="https://assets.mixkit.co/sfx/preview/mixkit-message-pop-alert-2354.mp3">
</audio>

<script>
const socket = io();
let name = localStorage.getItem("name");

/* START */
if(name) start();
nameInput?.addEventListener("keydown",e=>{
  if(e.key==="Enter"){
    const n=nameInput.value.trim();
    if(!n) return;
    localStorage.setItem("name",n);
    name=n;
    start();
  }
});

function start(){
  nameBox.remove();
  app.classList.remove("hidden");
  socket.emit("join", name);
}

/* SEND */
function send(){
  if(msg.value){
    socket.emit("chat",{user:name,text:msg.value});
    msg.value="";
  }
  if(file.files[0]){
    const r=new FileReader();
    r.onload=()=>socket.emit("chat",{user:name,file:r.result});
    r.readAsDataURL(file.files[0]);
    file.value="";
  }
}

/* ADD MESSAGE */
function addMsg(d,isDM=false){
  const div=document.createElement("div");
  div.className="msg "+(d.user===name?"me":"other")+(isDM?" dm":"");

  if(d.text) div.innerText=d.user+": "+d.text;
  if(d.file){
    if(d.file.startsWith("data:image"))
      div.innerHTML=`<img src="${d.file}">`;
    else
      div.innerHTML=`<video src="${d.file}" controls></video>`;
  }

  div.oncontextmenu=e=>{
    e.preventDefault();
    if(confirm("Mesaj silinsin mi?")) div.remove();
  };

  messages.appendChild(div);
  messages.scrollTop=messages.scrollHeight;

  if(d.user!==name){
    sound.play().catch(()=>{});
    navigator.vibrate && navigator.vibrate(80);
  }
}

/* SOCKET EVENTS */
socket.on("chat",d=>addMsg(d));
socket.on("dm",d=>addMsg({user:d.from,text:d.msg},true));

socket.on("online",list=>{
  users.innerHTML="";
  list.forEach(u=>{
    const d=document.createElement("div");
    d.className="user";
    d.innerText=u;
    d.onclick=()=>{
      const m=prompt(u+" için DM:");
      if(m) socket.emit("dm",{from:name,to:u,msg:m});
    };
    users.appendChild(d);
  });
});
</script>

</body>
</html>
