import { useState, useEffect } from "react";
import { db } from "./supabase";

// ─── THEME & CONFIG ──────────────────────────────────────────────────────────
const T={bg:"#000",bg1:"#070707",bg2:"#0D0D0D",border:"#1C1C1C",borderH:"#2A2A2A",w:"#FFF",w2:"#E0E0E0",w3:"#AAA",w4:"#777",w5:"#555",a:"#60A5FA",aD:"#60A5FA18",g:"#34D399",gD:"#34D39914",r:"#F87171",rD:"#F8717114",y:"#FBBF24",p:"#A78BFA"};
const font="'DM Sans',system-ui,sans-serif";const mono="'JetBrains Mono','SF Mono',monospace";
const INVITE_CODE="CCALIMITED2026";
const ADMINS=[{email:"pewlax@gmail.com",password:"SteveCCAcceleratorPlatformAdmin12345",name:"Steve"},{email:"dannyfresko92@gmail.com",password:"DannyCCAcceleratorPlatformAdmin12345",name:"Danny"}];
const LEAD_SOURCES=["Instagram","Facebook","TikTok","YouTube","Paid Ads","Referrals","Website/SEO","Email","Setter/DM","Other"];
const LEAD_COLORS=[T.a,T.g,T.y,T.p,T.r,"#F472B6","#818CF8","#FB923C","#2DD4BF","#94A3B8"];
const fmt=n=>{if(n==null)return"0";if(n>=1e6)return(n/1e6).toFixed(1)+"M";if(n>=1e3)return(n/1e3).toFixed(1)+"K";return n.toString();};
const fmtMoney=n=>{if(n==null)return"$0";if(n>=1e6)return"$"+(n/1e6).toFixed(1)+"M";if(n>=1e3)return"$"+(n/1e3).toFixed(1)+"K";return"$"+n.toLocaleString();};

const makeClient=f=>({
  id:f.id||"c_"+Date.now()+"_"+Math.random().toString(36).slice(2,6),
  name:f.name||"",handle:f.handle||"",igLink:f.igLink||"",niche:f.niche||"General",
  avatar:f.avatar||f.name?.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()||"??",
  email:f.email||"",
  // Instagram
  followers:0,videosPosted30d:0,
  // Revenue
  revenueDaily:0,revenueWeekly:0,revenueMonthly:0,revenueData:[0,0,0,0,0,0,0],
  // Leads
  leadsTotal:0,leadSources:[],
  // Calls
  callsBooked:0,callsAttended:0,closeRate:0,
  // Website
  websiteClicks:0,websiteSources:[],
  // Conversions
  conversions:0,conversionRate:0,
  // Connections
  calendlyUrl:"",stripeConnected:false,websiteUrl:"",igConnected:false,
  // Competitors & AI
  competitors:[],aiInsights:null,contentIdeas:null,
  // Meta
  notes:"",plan:"Standard",monthlyBudget:0,contractEnd:"",
  createdAt:new Date().toISOString(),...f,
});

const saveSession=u=>{try{localStorage.setItem("cc_session",JSON.stringify(u));}catch{}};
const loadSession=()=>{try{const s=localStorage.getItem("cc_session");return s?JSON.parse(s):null;}catch{return null;}};
const clearSession=()=>{try{localStorage.removeItem("cc_session");}catch{}};

// AI helper
const aiCall=async(prompt,type)=>{
  try{
    const res=await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt,type})});
    return await res.json();
  }catch(e){return{error:e.message};}
};

// ─── UI PRIMITIVES ───────────────────────────────────────────────────────────
const Inp=({label,value,onChange,type="text",placeholder,onKeyDown,isMono,autoFocus,disabled,prefix})=>(
  <div style={{marginBottom:12}}>
    {label&&<label style={{fontSize:10,color:T.w4,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:4,display:"block",fontFamily:mono,fontWeight:500}}>{label}</label>}
    <div style={{position:"relative"}}>
      {prefix&&<span style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",color:T.w5,fontSize:13}}>{prefix}</span>}
      <input value={value} onChange={onChange} type={type} placeholder={placeholder} onKeyDown={onKeyDown} autoFocus={autoFocus} disabled={disabled}
        style={{width:"100%",padding:"11px 13px",paddingLeft:prefix?"28px":"13px",borderRadius:6,border:`1px solid ${T.border}`,background:disabled?"#0A0A0A":T.bg,color:T.w,fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:isMono?mono:font,transition:"border-color .15s",opacity:disabled?.5:1}}
        onFocus={e=>e.target.style.borderColor=T.a} onBlur={e=>e.target.style.borderColor=T.border}/>
    </div>
  </div>
);
const Btn=({children,onClick,primary,disabled,accent})=>(
  <button onClick={onClick} disabled={disabled} style={{width:"100%",padding:"12px",borderRadius:6,cursor:disabled?"default":"pointer",border:primary||accent?"none":`1px solid ${T.border}`,background:primary?T.w:accent?T.a+"22":"transparent",color:primary?T.bg:accent?T.a:T.w3,fontSize:13,fontWeight:primary||accent?600:400,fontFamily:font,opacity:disabled?.4:1,transition:"all .15s"}}>{children}</button>
);
const Metric=({label,value,sub,icon,trend,color})=>(
  <div style={{background:T.bg1,border:`1px solid ${T.border}`,borderRadius:8,padding:"16px 18px",display:"flex",flexDirection:"column",gap:4,transition:"border-color .2s,transform .2s",cursor:"default"}}
    onMouseEnter={e=>{e.currentTarget.style.borderColor=T.borderH;e.currentTarget.style.transform="translateY(-1px)";}}
    onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.transform="none";}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:9,color:T.w5,letterSpacing:".1em",textTransform:"uppercase",fontFamily:mono}}>{label}</span>{icon&&<span style={{fontSize:14,opacity:.5}}>{icon}</span>}</div>
    <span style={{fontSize:24,fontWeight:700,color:color||T.w,fontFamily:font,letterSpacing:"-0.02em"}}>{value}</span>
    <div style={{display:"flex",alignItems:"center",gap:6}}>
      {trend!=null&&<span style={{fontSize:10,fontWeight:600,fontFamily:mono,color:trend>=0?T.g:T.r,background:trend>=0?T.gD:T.rD,padding:"1px 5px",borderRadius:3}}>{trend>=0?"↑":"↓"}{Math.abs(trend).toFixed(1)}%</span>}
      {sub&&<span style={{fontSize:9,color:T.w5}}>{sub}</span>}
    </div>
  </div>
);
const Bar=({data,labels,h=140,color=T.a})=>{const mx=Math.max(...data)||1;return(<div style={{height:h,display:"flex",alignItems:"flex-end",gap:4,padding:"0 2px"}}>{data.map((v,i)=>(<div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}><span style={{fontSize:7,color:T.w5,fontFamily:mono}}>{typeof v==="number"&&v>0?fmt(v):""}</span><div style={{width:"100%",maxWidth:26,height:`${(v/mx)*(h-32)}px`,background:`linear-gradient(180deg,${color},${color}30)`,borderRadius:"3px 3px 0 0",transition:"height .5s ease",minHeight:v>0?2:0}}/><span style={{fontSize:7,color:T.w5,fontFamily:mono}}>{labels?.[i]}</span></div>))}</div>);};
const Modal=({children,onClose,wide})=>(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.82)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1e3,backdropFilter:"blur(6px)"}} onClick={onClose}><div style={{width:wide?580:440,maxHeight:"90vh",overflowY:"auto",padding:28,borderRadius:10,background:T.bg2,border:`1px solid ${T.border}`,boxShadow:"0 40px 80px rgba(0,0,0,.7)"}} onClick={e=>e.stopPropagation()}>{children}</div></div>);
const Tab=({tabs,active,onChange})=>(<div style={{display:"flex",borderBottom:`1px solid ${T.border}`,flexWrap:"wrap"}}>{tabs.map(t=>(<button key={t} onClick={()=>onChange(t)} style={{padding:"10px 14px",border:"none",background:"transparent",cursor:"pointer",color:active===t?T.w:T.w5,fontSize:11,fontWeight:600,borderBottom:active===t?`2px solid ${T.a}`:"2px solid transparent",fontFamily:font,textTransform:"capitalize",transition:"color .15s",whiteSpace:"nowrap"}}>{t}</button>))}</div>);
const Logo=({size=30})=>(<img src="/logo-icon.jpeg" alt="CC" style={{width:size,height:size,borderRadius:size>35?10:6,objectFit:"cover"}}/>);
const ProgressBar=({value,max,color=T.a,label})=>(<div style={{marginBottom:10}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:11,color:T.w3}}>{label}</span><span style={{fontSize:11,color:T.w,fontFamily:mono,fontWeight:600}}>{value}{max?` / ${max}`:""}</span></div><div style={{height:4,background:T.border,borderRadius:2}}><div style={{width:max?`${(value/max)*100}%`:"0%",height:"100%",background:color,borderRadius:2,transition:"width .6s"}}/></div></div>);
const SourceBar=({source,count,pct,color})=>(<div style={{marginBottom:8}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:11,color:T.w3}}>{source}</span><span style={{fontSize:11,color:T.w,fontFamily:mono,fontWeight:600}}>{count} <span style={{color:T.w5,fontWeight:400}}>({pct}%)</span></span></div><div style={{height:4,background:T.border,borderRadius:2}}><div style={{width:pct+"%",height:"100%",background:color,borderRadius:2,transition:"width .6s"}}/></div></div>);
const Section=({title,children,action})=>(<div style={{background:T.bg1,border:`1px solid ${T.border}`,borderRadius:8,padding:18,marginBottom:12}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><h3 style={{color:T.w,margin:0,fontSize:12,fontWeight:600}}>{title}</h3>{action}</div>{children}</div>);
const SmallBtn=({children,onClick,color=T.a})=>(<button onClick={onClick} style={{padding:"4px 10px",borderRadius:4,border:`1px solid ${color}33`,background:color+"12",color:color,fontSize:10,cursor:"pointer",fontFamily:font,fontWeight:600,whiteSpace:"nowrap"}}>{children}</button>);
const CompRow=({c})=>(<div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",padding:"9px 14px",borderBottom:`1px solid ${T.border}`,alignItems:"center"}}><div><div style={{fontWeight:600,color:T.w,fontSize:11}}>{c.name}</div><div style={{color:T.w5,fontSize:9,fontFamily:mono}}>{c.handle}</div></div><span style={{color:T.w3,fontFamily:mono,fontSize:11}}>{fmt(c.followers)}</span><span style={{color:c.engagement>=5?T.g:T.a,fontFamily:mono,fontSize:11}}>{c.engagement}%</span><span style={{color:T.w3,fontFamily:mono,fontSize:11}}>{fmt(c.views30d||0)}</span></div>);

// ─── AUTH ─────────────────────────────────────────────────────────────────────
const AuthScreen=({onLogin,refreshClients})=>{
  const [mode,setMode]=useState("choose");const [email,setEmail]=useState("");const [pass,setPass]=useState("");
  const [confirmPass,setConfirmPass]=useState("");const [name,setName]=useState("");const [handle,setHandle]=useState("");
  const [niche,setNiche]=useState("");const [inviteCode,setInviteCode]=useState("");
  const [error,setError]=useState("");const [loading,setLoading]=useState(false);
  const reset=()=>{setError("");setEmail("");setPass("");setConfirmPass("");setName("");setHandle("");setNiche("");setInviteCode("");};

  const loginAdmin=()=>{setError("");setLoading(true);setTimeout(()=>{const a=ADMINS.find(a=>a.email.toLowerCase()===email.toLowerCase()&&a.password===pass);if(!a){setError("Invalid admin credentials.");setLoading(false);return;}saveSession({role:"agency",name:a.name,email:a.email});onLogin({role:"agency",name:a.name,email:a.email});},400);};
  const loginClient=async()=>{setError("");setLoading(true);try{const users=(await db.get("users"))||[];const u=users.find(u=>u.email.toLowerCase()===email.toLowerCase()&&u.password===pass);if(!u){setError("Invalid email or password.");setLoading(false);return;}const s={role:"client",name:u.name,email:u.email,clientId:u.clientId};saveSession(s);onLogin(s);}catch{setError("Login error.");setLoading(false);}};
  const signUp=async()=>{setError("");if(!name.trim()||!email.trim()||!handle.trim()){setError("Fill in all required fields.");return;}if(pass.length<6){setError("Password: 6+ characters.");return;}if(pass!==confirmPass){setError("Passwords don't match.");return;}if(inviteCode!==INVITE_CODE){setError("Invalid invitation code.");return;}const users=(await db.get("users"))||[];if(users.find(u=>u.email.toLowerCase()===email.toLowerCase())||ADMINS.find(a=>a.email.toLowerCase()===email.toLowerCase())){setError("Email already in use.");return;}setLoading(true);try{const h2=handle.startsWith("@")?handle:"@"+handle;const clientId="c_"+Date.now()+"_"+Math.random().toString(36).slice(2,6);const client=makeClient({id:clientId,name,handle:h2,igLink:`https://instagram.com/${h2.replace("@","")}`,niche:niche||"General",email});const clients=(await db.get("clients"))||[];clients.push(client);await db.set("clients",clients);users.push({id:"u_"+Date.now(),email,password:pass,name,role:"client",clientId,createdAt:new Date().toISOString()});await db.set("users",users);const s={role:"client",name,email,clientId};saveSession(s);refreshClients();onLogin(s);}catch{setError("Signup error.");setLoading(false);}};

  return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:T.bg,fontFamily:font}}>
      <div style={{position:"fixed",inset:0,opacity:.02,backgroundImage:`linear-gradient(${T.w} 1px,transparent 1px),linear-gradient(90deg,${T.w} 1px,transparent 1px)`,backgroundSize:"100px 100px",pointerEvents:"none"}}/>
      <div style={{width:mode==="signup"?440:380,padding:"36px 32px",borderRadius:12,background:T.bg1,border:`1px solid ${T.border}`,boxShadow:"0 40px 100px rgba(0,0,0,.5)",position:"relative",zIndex:1}}>
        <div style={{textAlign:"center",marginBottom:28}}><div style={{marginBottom:12}}><Logo size={52}/></div><img src="/logo-text.png" alt="CC Accelerator" style={{height:18,objectFit:"contain",filter:"brightness(1.1)",marginBottom:6}}/><p style={{color:T.w5,fontSize:11,marginTop:4}}>{mode==="choose"?"Content Agency Command Center":mode==="admin"?"Admin Sign In":mode==="client-login"?"Client Sign In":"Create Client Account"}</p></div>

        {mode==="choose"&&(<div style={{display:"flex",flexDirection:"column",gap:8}}>
          {[{m:"admin",icon:"⚡",t:"Admin Login",sub:"For agency founders"},{m:"client-login",icon:"👤",t:"Client Login",sub:"View your dashboard"}].map(o=>(
            <button key={o.m} onClick={()=>{setMode(o.m);reset();}} style={{padding:16,borderRadius:8,border:`1px solid ${T.border}`,background:T.bg,color:T.w,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:font,display:"flex",alignItems:"center",gap:12,textAlign:"left",transition:"border-color .15s"}} onMouseEnter={e=>e.currentTarget.style.borderColor=T.a} onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
              <div style={{width:36,height:36,borderRadius:8,background:T.aD,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:16}}>{o.icon}</span></div>
              <div><div style={{fontSize:14,fontWeight:600}}>{o.t}</div><div style={{fontSize:11,color:T.w5,marginTop:2}}>{o.sub}</div></div>
            </button>))}
          <div style={{textAlign:"center",marginTop:12}}><span style={{color:T.w5,fontSize:12}}>New client? </span><button onClick={()=>{setMode("signup");reset();}} style={{background:"none",border:"none",color:T.a,fontSize:12,cursor:"pointer",fontWeight:600,fontFamily:font,textDecoration:"underline",textUnderlineOffset:3}}>Create account</button></div>
        </div>)}

        {mode==="admin"&&(<><Inp label="Admin Email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Enter admin email" onKeyDown={e=>e.key==="Enter"&&loginAdmin()} autoFocus/><Inp label="Password" value={pass} onChange={e=>setPass(e.target.value)} type="password" placeholder="Enter password" onKeyDown={e=>e.key==="Enter"&&loginAdmin()}/>{error&&<div style={{color:T.r,fontSize:12,padding:"8px 10px",background:T.rD,borderRadius:6,marginBottom:12}}>{error}</div>}<Btn onClick={loginAdmin} primary disabled={loading}>{loading?"Signing in...":"Sign In"}</Btn><div style={{height:8}}/><Btn onClick={()=>{setMode("choose");reset();}}>← Back</Btn></>)}
        {mode==="client-login"&&(<><Inp label="Email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@email.com" onKeyDown={e=>e.key==="Enter"&&loginClient()} autoFocus/><Inp label="Password" value={pass} onChange={e=>setPass(e.target.value)} type="password" placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&loginClient()}/>{error&&<div style={{color:T.r,fontSize:12,padding:"8px 10px",background:T.rD,borderRadius:6,marginBottom:12}}>{error}</div>}<Btn onClick={loginClient} primary disabled={loading}>{loading?"Signing in...":"Sign In"}</Btn><div style={{textAlign:"center",marginTop:12}}><span style={{color:T.w5,fontSize:12}}>No account? </span><button onClick={()=>{setMode("signup");reset();}} style={{background:"none",border:"none",color:T.a,fontSize:12,cursor:"pointer",fontWeight:600,fontFamily:font,textDecoration:"underline",textUnderlineOffset:3}}>Sign up</button></div><div style={{height:6}}/><Btn onClick={()=>{setMode("choose");reset();}}>← Back</Btn></>)}
        {mode==="signup"&&(<><Inp label="Brand / Full Name *" value={name} onChange={e=>setName(e.target.value)} placeholder="Your Brand" autoFocus/><Inp label="Email *" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@brand.com"/><Inp label="Instagram Handle *" value={handle} onChange={e=>setHandle(e.target.value)} placeholder="@yourbrand"/><Inp label="Niche" value={niche} onChange={e=>setNiche(e.target.value)} placeholder="Fashion, Fitness..."/><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}><Inp label="Password *" value={pass} onChange={e=>setPass(e.target.value)} type="password" placeholder="6+ chars"/><Inp label="Confirm *" value={confirmPass} onChange={e=>setConfirmPass(e.target.value)} type="password" placeholder="Re-enter"/></div><Inp label="Invitation Code *" value={inviteCode} onChange={e=>setInviteCode(e.target.value)} placeholder="Enter code" isMono/>{inviteCode===INVITE_CODE&&<span style={{fontSize:10,color:T.g,display:"block",marginTop:-6,marginBottom:8}}>✓ Valid</span>}{error&&<div style={{color:T.r,fontSize:12,padding:"8px 10px",background:T.rD,borderRadius:6,marginBottom:12}}>{error}</div>}<Btn onClick={signUp} primary disabled={loading}>{loading?"Creating...":"Create Account"}</Btn><div style={{height:6}}/><Btn onClick={()=>{setMode("choose");reset();}}>← Back</Btn></>)}
      </div>
    </div>
  );
};

// ─── CLIENT DASHBOARD (what clients see) ─────────────────────────────────────
const ClientDash=({client:c,onLogout,refreshClients,clients})=>{
  const [tab,setTab]=useState("overview");
  const [connectModal,setConnectModal]=useState(null); // calendly|website|ig
  const [url,setUrl]=useState("");

  if(!c) return <div style={{minHeight:"100vh",background:T.bg,color:T.w,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:font}}>Loading...</div>;

  const saveField=async(field,val)=>{const cls=(await db.get("clients"))||[];const idx=cls.findIndex(x=>x.id===c.id);if(idx>=0){cls[idx][field]=val;await db.set("clients",cls);await refreshClients();}};

  return(
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:font}}>
      <header style={{padding:"10px 28px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",background:T.bg1+"DD",backdropFilter:"blur(10px)",position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}><Logo size={28}/><div><h2 style={{color:T.w,margin:0,fontSize:14,fontWeight:700}}>{c.name}</h2><span style={{color:T.a,fontSize:11,fontFamily:mono}}>{c.handle}</span></div></div>
        <button onClick={()=>{clearSession();onLogout();}} style={{padding:"6px 14px",borderRadius:6,border:`1px solid ${T.border}`,background:"transparent",color:T.w4,fontSize:11,cursor:"pointer",fontFamily:font}}>Logout</button>
      </header>
      <div style={{padding:"0 28px"}}><Tab tabs={["overview","revenue","leads & calls","website","competitors"]} active={tab} onChange={setTab}/></div>
      <div style={{padding:24,maxWidth:1400,margin:"0 auto"}}>
        {tab==="overview"&&(<>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:10,marginBottom:16}}>
            <Metric label="Monthly Revenue" value={fmtMoney(c.revenueMonthly)} trend={12.4} icon="💰" color={T.g}/>
            <Metric label="Total Leads" value={fmt(c.leadsTotal)} trend={8.2} icon="🎯"/>
            <Metric label="Calls Booked" value={c.callsBooked||0} trend={15.1} icon="📞"/>
            <Metric label="Close Rate" value={(c.closeRate||0)+"%"} trend={2.4} icon="🎯" color={T.a}/>
            <Metric label="Followers" value={fmt(c.followers)} trend={3.2} icon="👥"/>
            <Metric label="Videos (30d)" value={c.videosPosted30d||0} icon="🎬"/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Section title="Revenue (Last 7 Days)"><Bar data={c.revenueData||[0,0,0,0,0,0,0]} labels={["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]} color={T.g}/></Section>
            <Section title="Connections" action={null}>
              {[{label:"Calendly",connected:!!c.calendlyUrl,key:"calendly",icon:"📅"},{label:"Website",connected:!!c.websiteUrl,key:"website",icon:"🌐"},{label:"Instagram",connected:!!c.igConnected,key:"ig",icon:"📸"}].map(x=>(
                <div key={x.key} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${T.border}`}}>
                  <span style={{color:T.w3,fontSize:12}}>{x.icon} {x.label}</span>
                  {x.connected?<span style={{fontSize:10,color:T.g,fontFamily:mono}}>✓ Connected</span>:<SmallBtn onClick={()=>{setConnectModal(x.key);setUrl("");}}>Connect</SmallBtn>}
                </div>
              ))}
            </Section>
          </div>
        </>)}
        {tab==="revenue"&&(<>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:16}}>
            <Metric label="Daily Revenue" value={fmtMoney(c.revenueDaily)} trend={5.2} icon="📊" color={T.g}/>
            <Metric label="Weekly Revenue" value={fmtMoney(c.revenueWeekly)} trend={8.4} icon="📈" color={T.g}/>
            <Metric label="Monthly Revenue" value={fmtMoney(c.revenueMonthly)} trend={12.4} icon="💰" color={T.g}/>
          </div>
          <Section title="Revenue Trend (7 Days)"><Bar data={c.revenueData||[0,0,0,0,0,0,0]} labels={["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]} color={T.g} h={180}/></Section>
          <Section title="Revenue Attribution">
            {(!c.leadSources?.length)?<p style={{color:T.w5,fontSize:11}}>No attribution data yet.</p>:
            (c.leadSources||[]).map((ls,i)=><SourceBar key={ls.source} source={ls.source} count={fmtMoney(ls.revenue||0)} pct={ls.pct} color={LEAD_COLORS[i%LEAD_COLORS.length]}/>)}
          </Section>
        </>)}
        {tab==="leads & calls"&&(<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Section title="Lead Sources">
            {(!c.leadSources?.length)?<p style={{color:T.w5,fontSize:11}}>No lead data yet.</p>:
            (c.leadSources||[]).map((ls,i)=><SourceBar key={ls.source} source={ls.source} count={ls.count} pct={ls.pct} color={LEAD_COLORS[i%LEAD_COLORS.length]}/>)}
          </Section>
          <Section title="Calls & Conversions">
            {[{l:"Calls Booked",v:c.callsBooked||0},{l:"Calls Attended",v:c.callsAttended||0},{l:"Close Rate",v:(c.closeRate||0)+"%"},{l:"Conversions",v:c.conversions||0},{l:"Conversion Rate",v:(c.conversionRate||0)+"%"}].map(r=>(
              <div key={r.l} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:`1px solid ${T.border}`}}><span style={{color:T.w3,fontSize:12}}>{r.l}</span><span style={{color:T.w,fontSize:12,fontWeight:600,fontFamily:mono}}>{r.v}</span></div>
            ))}
            {c.calendlyUrl&&<div style={{marginTop:12,padding:"10px 14px",background:T.aD,borderRadius:6}}><span style={{fontSize:11,color:T.a}}>📅 Calendly: </span><a href={c.calendlyUrl} target="_blank" rel="noopener" style={{color:T.a,fontSize:11,fontFamily:mono,textDecoration:"underline"}}>{c.calendlyUrl}</a></div>}
          </Section>
        </div>)}
        {tab==="website"&&(<>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:16}}>
            <Metric label="Total Clicks" value={fmt(c.websiteClicks)} trend={6.8} icon="🖱️"/>
            <Metric label="Website" value={c.websiteUrl?"Connected":"Not Connected"} icon="🌐" color={c.websiteUrl?T.g:T.w5}/>
            <Metric label="Top Source" value={(c.websiteSources||[])[0]?.source||"—"} icon="📊"/>
          </div>
          <Section title="Traffic Sources">
            {(!c.websiteSources?.length)?<p style={{color:T.w5,fontSize:11}}>No traffic data. Connect your website to start tracking.</p>:
            (c.websiteSources||[]).map((ws,i)=><SourceBar key={ws.source} source={ws.source} count={ws.clicks} pct={ws.pct} color={LEAD_COLORS[i%LEAD_COLORS.length]}/>)}
          </Section>
        </>)}
        {tab==="competitors"&&(<Section title={`Competitors — ${c.niche}`}>
          <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",padding:"7px 14px",borderBottom:`1px solid ${T.border}`,marginBottom:4}}>
            {["Account","Followers","Eng.","Views 30d"].map(h=><span key={h} style={{fontSize:8,color:T.w5,textTransform:"uppercase",letterSpacing:".1em",fontFamily:mono}}>{h}</span>)}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",padding:"9px 14px",borderBottom:`1px solid ${T.border}`,background:T.aD}}>
            <div><div style={{fontWeight:600,color:T.a,fontSize:11}}>{c.name} (You)</div></div>
            <span style={{color:T.w,fontFamily:mono,fontSize:11}}>{fmt(c.followers)}</span><span style={{color:T.g,fontFamily:mono,fontSize:11}}>—</span><span style={{color:T.w,fontFamily:mono,fontSize:11}}>—</span>
          </div>
          {(!c.competitors?.length)?<p style={{color:T.w5,fontSize:11,padding:"12px 0"}}>No competitors tracked yet.</p>:
          (c.competitors||[]).map((comp,i)=><CompRow key={i} c={comp}/>)}
        </Section>)}
      </div>

      {connectModal&&<Modal onClose={()=>setConnectModal(null)}>
        <h3 style={{color:T.w,margin:"0 0 4px",fontSize:15,fontWeight:700}}>{connectModal==="calendly"?"Connect Calendly":connectModal==="website"?"Connect Website":"Connect Instagram"}</h3>
        <p style={{color:T.w5,fontSize:11,marginBottom:16}}>{connectModal==="calendly"?"Enter your Calendly scheduling link.":connectModal==="website"?"Enter your website URL to track clicks and sources.":"Enter your Instagram profile URL."}</p>
        <Inp label={connectModal==="calendly"?"Calendly URL":connectModal==="website"?"Website URL":"Instagram Profile URL"} value={url} onChange={e=>setUrl(e.target.value)} placeholder={connectModal==="calendly"?"https://calendly.com/yourname":connectModal==="website"?"https://yourbrand.com":"https://instagram.com/yourbrand"}/>
        <Btn onClick={async()=>{if(!url.trim())return;const field=connectModal==="calendly"?"calendlyUrl":connectModal==="website"?"websiteUrl":"igLink";await saveField(field,url);if(connectModal==="ig")await saveField("igConnected",true);setConnectModal(null);}} primary>Connect</Btn>
      </Modal>}
    </div>
  );
};

// ─── AGENCY DASHBOARD ────────────────────────────────────────────────────────
const AgencyDash=({onLogout,userName,clients,refreshClients})=>{
  const [sel,setSel]=useState(null);const [view,setView]=useState("overview");const [cTab,setCTab]=useState("overview");
  const [q,setQ]=useState("");const [saving,setSaving]=useState(false);
  // Modals
  const [addModal,setAddModal]=useState(false);const [newC,setNewC]=useState({name:"",handle:"",niche:"",email:"",password:"",igLink:""});
  const [editModal,setEditModal]=useState(false);const [editData,setEditData]=useState({});
  const [compModal,setCompModal]=useState(false);const [newComp,setNewComp]=useState({name:"",handle:"",followers:"",engagement:"",views30d:""});
  const [aiModal,setAiModal]=useState(false);const [aiLink,setAiLink]=useState("");const [aiLoading,setAiLoading]=useState(false);const [aiResult,setAiResult]=useState(null);
  const [aiInsightLoading,setAiInsightLoading]=useState(false);
  const [leadModal,setLeadModal]=useState(false);const [newLead,setNewLead]=useState({source:LEAD_SOURCES[0],count:"",revenue:""});
  const [websiteModal,setWebsiteModal]=useState(false);const [newWS,setNewWS]=useState({source:"Instagram",clicks:""});
  const [ideasLoading,setIdeasLoading]=useState(false);
  const [notes,setNotes]=useState({});const [editing,setEditing]=useState(false);

  const all=clients;const c=sel;
  const totRev=all.reduce((a,c)=>a+(c.revenueMonthly||0),0);const totLeads=all.reduce((a,c)=>a+(c.leadsTotal||0),0);
  const totCalls=all.reduce((a,c)=>a+(c.callsBooked||0),0);const avgClose=all.length?(all.reduce((a,c)=>a+(c.closeRate||0),0)/all.length).toFixed(1):"0";
  const filtered=all.filter(c=>c.name.toLowerCase().includes(q.toLowerCase())||c.handle.toLowerCase().includes(q.toLowerCase()));

  const open=c=>{setSel(c);setView("client");setCTab("overview");};
  const saveClients=async(updated)=>{await db.set("clients",updated);await refreshClients();};
  const updateClient=async(field,val)=>{const cls=(await db.get("clients"))||[];const idx=cls.findIndex(x=>x.id===c.id);if(idx<0)return;cls[idx][field]=val;await saveClients(cls);setSel(cls[idx]);};

  const addClient=async()=>{if(!newC.name||!newC.handle)return;setSaving(true);
    const h2=newC.handle.startsWith("@")?newC.handle:"@"+newC.handle;const clientId="c_"+Date.now()+"_"+Math.random().toString(36).slice(2,6);
    const client=makeClient({id:clientId,name:newC.name,handle:h2,igLink:newC.igLink||`https://instagram.com/${h2.replace("@","")}`,niche:newC.niche||"General",email:newC.email});
    const cls=(await db.get("clients"))||[];cls.push(client);await db.set("clients",cls);
    if(newC.email&&newC.password){const users=(await db.get("users"))||[];users.push({id:"u_"+Date.now(),email:newC.email,password:newC.password,name:newC.name,role:"client",clientId,createdAt:new Date().toISOString()});await db.set("users",users);}
    await refreshClients();setNewC({name:"",handle:"",niche:"",email:"",password:"",igLink:""});setAddModal(false);setSaving(false);};

  const saveStats=async()=>{const cls=(await db.get("clients"))||[];const idx=cls.findIndex(x=>x.id===c.id);if(idx<0)return;
    Object.keys(editData).forEach(k=>{const v=editData[k];cls[idx][k]=typeof v==="string"&&!isNaN(v)?parseFloat(v):v;});
    await saveClients(cls);setSel(cls[idx]);setEditModal(false);};

  const addCompetitor=async()=>{if(!c||!newComp.name)return;const cls=(await db.get("clients"))||[];const idx=cls.findIndex(x=>x.id===c.id);if(idx<0)return;
    cls[idx].competitors=[...(cls[idx].competitors||[]),{name:newComp.name,handle:newComp.handle,followers:parseInt(newComp.followers)||0,engagement:parseFloat(newComp.engagement)||0,views30d:parseInt(newComp.views30d)||0}];
    await saveClients(cls);setSel(cls[idx]);setNewComp({name:"",handle:"",followers:"",engagement:"",views30d:""});setCompModal(false);};

  const addLeadSource=async()=>{if(!c||!newLead.count)return;const cls=(await db.get("clients"))||[];const idx=cls.findIndex(x=>x.id===c.id);if(idx<0)return;
    const existing=[...(cls[idx].leadSources||[])];const cnt=parseInt(newLead.count)||0;const rev=parseFloat(newLead.revenue)||0;
    const found=existing.find(l=>l.source===newLead.source);if(found){found.count+=cnt;found.revenue=(found.revenue||0)+rev;}else existing.push({source:newLead.source,count:cnt,revenue:rev,pct:0});
    const total=existing.reduce((a,l)=>a+l.count,0);existing.forEach(l=>l.pct=parseFloat((l.count/total*100).toFixed(1)));existing.sort((a,b)=>b.count-a.count);
    cls[idx].leadSources=existing;cls[idx].leadsTotal=total;await saveClients(cls);setSel(cls[idx]);setNewLead({source:LEAD_SOURCES[0],count:"",revenue:""});setLeadModal(false);};

  const addWebSource=async()=>{if(!c||!newWS.clicks)return;const cls=(await db.get("clients"))||[];const idx=cls.findIndex(x=>x.id===c.id);if(idx<0)return;
    const existing=[...(cls[idx].websiteSources||[])];const clicks=parseInt(newWS.clicks)||0;
    const found=existing.find(w=>w.source===newWS.source);if(found)found.clicks+=clicks;else existing.push({source:newWS.source,clicks,pct:0});
    const total=existing.reduce((a,w)=>a+w.clicks,0);existing.forEach(w=>w.pct=parseFloat((w.clicks/total*100).toFixed(1)));existing.sort((a,b)=>b.clicks-a.clicks);
    cls[idx].websiteSources=existing;cls[idx].websiteClicks=total;await saveClients(cls);setSel(cls[idx]);setNewWS({source:"Instagram",clicks:""});setWebsiteModal(false);};

  const analyzeComp=async()=>{if(!aiLink.trim())return;setAiLoading(true);setAiResult(null);
    const handle=aiLink.replace(/\/$/,"").split("/").pop().replace("@","");
    const r=await aiCall(`Analyze Instagram competitor @${handle}. Estimate their stats.`,"competitor");
    setAiResult(r.error?{error:r.error}:r);setAiLoading(false);};

  const addAiComp=async()=>{if(!c||!aiResult||aiResult.error)return;const cls=(await db.get("clients"))||[];const idx=cls.findIndex(x=>x.id===c.id);if(idx<0)return;
    cls[idx].competitors=[...(cls[idx].competitors||[]),{name:aiResult.name,handle:aiResult.handle,followers:aiResult.followers,engagement:aiResult.engagement,views30d:aiResult.views30d}];
    await saveClients(cls);setSel(cls[idx]);setAiResult(null);setAiLink("");setAiModal(false);};

  const runInsights=async()=>{if(!c)return;setAiInsightLoading(true);
    const r=await aiCall(`Analyze this client:\nName: ${c.name}\nNiche: ${c.niche}\nFollowers: ${c.followers}\nMonthly Revenue: $${c.revenueMonthly}\nLeads: ${c.leadsTotal}\nCalls Booked: ${c.callsBooked}\nClose Rate: ${c.closeRate}%\nVideos Posted (30d): ${c.videosPosted30d}`,"client-analysis");
    if(!r.error){await updateClient("aiInsights",r);}setAiInsightLoading(false);};

  const runIdeas=async()=>{if(!c)return;setIdeasLoading(true);
    const r=await aiCall(`Generate content ideas for:\nBrand: ${c.name}\nNiche: ${c.niche}\nFollowers: ${c.followers}\nTop performing content themes: ${(c.competitors||[]).map(x=>x.name).join(", ")||"unknown"}`,"content-ideas");
    if(!r.error){await updateClient("contentIdeas",r);}setIdeasLoading(false);};

  const saveNotes2=async()=>{if(!c)return;await updateClient("notes",notes[c.id]??c.notes??"");setEditing(false);};

  return(
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:font,display:"flex"}}>
      {/* SIDEBAR */}
      <aside style={{width:230,background:T.bg1,borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",position:"fixed",top:0,bottom:0,zIndex:200}}>
        <div style={{padding:"18px 14px",borderBottom:`1px solid ${T.border}`}}><div style={{display:"flex",alignItems:"center",gap:9}}><Logo size={30}/><div><div style={{color:T.w,fontWeight:700,fontSize:13}}>CC Accelerator</div><div style={{color:T.w5,fontSize:9,fontFamily:mono}}>{userName}</div></div></div></div>
        <div style={{padding:"10px 8px"}}><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search..." style={{width:"100%",padding:"7px 9px",borderRadius:5,border:`1px solid ${T.border}`,background:T.bg,color:T.w,fontSize:11,outline:"none",boxSizing:"border-box",fontFamily:font}} onFocus={e=>e.target.style.borderColor=T.a} onBlur={e=>e.target.style.borderColor=T.border}/></div>
        <nav style={{flex:1,overflow:"auto",padding:"0 5px"}}>
          <button onClick={()=>{setView("overview");setSel(null);}} style={{width:"100%",padding:"9px",borderRadius:5,border:"none",cursor:"pointer",background:view==="overview"?T.aD:"transparent",color:view==="overview"?T.a:T.w4,fontSize:11,fontWeight:600,textAlign:"left",marginBottom:2,fontFamily:font}}>◻ Overview</button>
          <div style={{padding:"7px 9px 3px",fontSize:8,color:T.w5,textTransform:"uppercase",letterSpacing:".14em",fontFamily:mono}}>Clients · {all.length}</div>
          {filtered.map(cl=>(<button key={cl.id} onClick={()=>open(cl)} style={{width:"100%",padding:"7px 9px",borderRadius:5,border:"none",cursor:"pointer",background:sel?.id===cl.id?T.aD:"transparent",color:sel?.id===cl.id?T.w:T.w4,fontSize:11,fontWeight:500,textAlign:"left",marginBottom:1,fontFamily:font,display:"flex",alignItems:"center",gap:7}}>
            <div style={{width:22,height:22,borderRadius:4,flexShrink:0,background:sel?.id===cl.id?T.w:T.borderH,color:sel?.id===cl.id?T.bg:T.w4,display:"flex",alignItems:"center",justifyContent:"center",fontSize:7,fontWeight:700}}>{cl.avatar}</div>
            <div style={{overflow:"hidden"}}><div style={{fontSize:11,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{cl.name}</div><div style={{fontSize:8,color:T.w5,fontFamily:mono}}>{cl.niche}</div></div>
          </button>))}
          <button onClick={()=>setAddModal(true)} style={{width:"100%",padding:"7px 9px",borderRadius:5,border:`1px dashed ${T.border}`,cursor:"pointer",background:"transparent",color:T.w5,fontSize:11,textAlign:"left",marginTop:4,fontFamily:font,transition:"all .15s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=T.a;e.currentTarget.style.color=T.a;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color=T.w5;}}>+ Add Client</button>
        </nav>
        <div style={{padding:10,borderTop:`1px solid ${T.border}`}}><button onClick={()=>{clearSession();onLogout();}} style={{width:"100%",padding:7,borderRadius:5,border:`1px solid ${T.border}`,background:"transparent",color:T.w5,fontSize:10,cursor:"pointer",fontFamily:font}}>Logout</button></div>
      </aside>

      <main style={{flex:1,marginLeft:230,minHeight:"100vh"}}>
        {/* OVERVIEW */}
        {view==="overview"&&(<div style={{padding:24}}>
          <div style={{marginBottom:20}}><img src="/logo-text.png" alt="" style={{height:16,objectFit:"contain",filter:"brightness(1.1)"}}/></div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:20}}>
            <Metric label="Total Revenue" value={fmtMoney(totRev)} trend={12.4} icon="💰" color={T.g}/>
            <Metric label="Total Leads" value={fmt(totLeads)} trend={8.2} icon="🎯"/>
            <Metric label="Calls Booked" value={totCalls} trend={15.1} icon="📞"/>
            <Metric label="Avg Close Rate" value={avgClose+"%"} trend={2.4} icon="📈"/>
            <Metric label="Active Clients" value={all.length} icon="👥"/>
          </div>
          {!all.length?(<div style={{background:T.bg1,border:`1px solid ${T.border}`,borderRadius:8,padding:40,textAlign:"center"}}><p style={{color:T.w3,fontSize:14,marginBottom:12}}>No clients yet</p><button onClick={()=>setAddModal(true)} style={{padding:"10px 24px",borderRadius:6,border:"none",background:T.w,color:T.bg,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:font}}>+ Add First Client</button></div>
          ):(<div style={{background:T.bg1,border:`1px solid ${T.border}`,borderRadius:8,overflow:"hidden"}}>
            <div style={{padding:"14px 18px",borderBottom:`1px solid ${T.border}`}}><h3 style={{color:T.w,margin:0,fontSize:12,fontWeight:600}}>Client Performance</h3></div>
            <div style={{display:"grid",gridTemplateColumns:"2fr repeat(5,1fr)",padding:"7px 16px",borderBottom:`1px solid ${T.border}`}}>
              {["Client","Revenue","Leads","Calls","Close Rate","Plan"].map(h=><span key={h} style={{fontSize:8,color:T.w5,textTransform:"uppercase",letterSpacing:".08em",fontFamily:mono}}>{h}</span>)}
            </div>
            {all.map(cl=>(<div key={cl.id} onClick={()=>open(cl)} style={{display:"grid",gridTemplateColumns:"2fr repeat(5,1fr)",padding:"10px 16px",borderBottom:`1px solid ${T.border}`,alignItems:"center",cursor:"pointer",transition:"background .1s"}} onMouseEnter={e=>e.currentTarget.style.background=T.bg1} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:26,height:26,borderRadius:5,background:T.borderH,color:T.w,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:700}}>{cl.avatar}</div><div><div style={{color:T.w,fontWeight:600,fontSize:11}}>{cl.name}</div><div style={{color:T.w5,fontSize:8,fontFamily:mono}}>{cl.handle}</div></div></div>
              <span style={{color:T.g,fontWeight:600,fontFamily:mono,fontSize:11}}>{fmtMoney(cl.revenueMonthly)}</span>
              <span style={{color:T.w3,fontFamily:mono,fontSize:11}}>{cl.leadsTotal||0}</span>
              <span style={{color:T.w3,fontFamily:mono,fontSize:11}}>{cl.callsBooked||0}</span>
              <span style={{color:T.a,fontFamily:mono,fontSize:11}}>{cl.closeRate||0}%</span>
              <span style={{fontSize:8,padding:"2px 6px",borderRadius:3,fontWeight:600,fontFamily:mono,background:T.aD,color:T.a}}>{cl.plan}</span>
            </div>))}
          </div>)}
        </div>)}

        {/* CLIENT DETAIL */}
        {view==="client"&&c&&(<div>
          <div style={{padding:"18px 24px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{display:"flex",alignItems:"center",gap:14}}>
              <div style={{width:40,height:40,borderRadius:8,background:T.w,color:T.bg,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:14}}>{c.avatar}</div>
              <div><h1 style={{color:T.w,margin:0,fontSize:18,fontWeight:700}}>{c.name}</h1><div style={{display:"flex",gap:10,marginTop:2,alignItems:"center"}}><a href={c.igLink} target="_blank" rel="noopener" style={{color:T.a,fontSize:11,fontFamily:mono,textDecoration:"none"}}>{c.handle} ↗</a><span style={{color:T.border}}>·</span><span style={{color:T.w4,fontSize:10}}>{c.niche}</span></div></div>
            </div>
            <div style={{display:"flex",gap:6}}><SmallBtn onClick={()=>{setEditData({followers:c.followers||0,videosPosted30d:c.videosPosted30d||0,revenueDaily:c.revenueDaily||0,revenueWeekly:c.revenueWeekly||0,revenueMonthly:c.revenueMonthly||0,callsBooked:c.callsBooked||0,callsAttended:c.callsAttended||0,closeRate:c.closeRate||0,conversions:c.conversions||0,conversionRate:c.conversionRate||0,plan:c.plan||"Standard",monthlyBudget:c.monthlyBudget||0});setEditModal(true);}}>✏️ Edit Stats</SmallBtn><button onClick={()=>{setView("overview");setSel(null);}} style={{padding:"4px 14px",borderRadius:5,border:`1px solid ${T.border}`,background:"transparent",color:T.w4,fontSize:11,cursor:"pointer",fontFamily:font}}>← Back</button></div>
          </div>
          <div style={{padding:"0 24px"}}><Tab tabs={["overview","revenue","leads & calls","website","competitors","ai insights","details"]} active={cTab} onChange={setCTab}/></div>
          <div style={{padding:24}}>
            {cTab==="overview"&&(<>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(165px,1fr))",gap:8,marginBottom:16}}>
                <Metric label="Monthly Revenue" value={fmtMoney(c.revenueMonthly)} trend={12.4} icon="💰" color={T.g}/>
                <Metric label="Total Leads" value={fmt(c.leadsTotal)} trend={8.2} icon="🎯"/>
                <Metric label="Calls Booked" value={c.callsBooked||0} trend={15.1} icon="📞"/>
                <Metric label="Close Rate" value={(c.closeRate||0)+"%"} trend={2.4} icon="🎯"/>
                <Metric label="Followers" value={fmt(c.followers)} trend={3.2} icon="👥"/>
                <Metric label="Videos (30d)" value={c.videosPosted30d||0} icon="🎬"/>
                <Metric label="Website Clicks" value={fmt(c.websiteClicks)} trend={6.8} icon="🖱️"/>
                <Metric label="Conversions" value={c.conversions||0} trend={14.6} icon="💰"/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <Section title="Revenue (7 Days)"><Bar data={c.revenueData||[0,0,0,0,0,0,0]} labels={["M","T","W","T","F","S","S"]} color={T.g}/></Section>
                <Section title="Lead Sources" action={<SmallBtn onClick={()=>setLeadModal(true)}>+ Add</SmallBtn>}>
                  {(!c.leadSources?.length)?<p style={{color:T.w5,fontSize:11}}>No data yet.</p>:(c.leadSources||[]).slice(0,5).map((ls,i)=><SourceBar key={ls.source} source={ls.source} count={ls.count} pct={ls.pct} color={LEAD_COLORS[i%LEAD_COLORS.length]}/>)}
                </Section>
              </div>
            </>)}

            {cTab==="revenue"&&(<>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:16}}>
                <Metric label="Daily" value={fmtMoney(c.revenueDaily)} trend={5.2} icon="📊" color={T.g}/>
                <Metric label="Weekly" value={fmtMoney(c.revenueWeekly)} trend={8.4} icon="📈" color={T.g}/>
                <Metric label="Monthly" value={fmtMoney(c.revenueMonthly)} trend={12.4} icon="💰" color={T.g}/>
              </div>
              <Section title="Revenue Trend"><Bar data={c.revenueData||[0,0,0,0,0,0,0]} labels={["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]} color={T.g} h={180}/></Section>
              <Section title="Revenue Attribution">{(!c.leadSources?.length)?<p style={{color:T.w5,fontSize:11}}>Add lead sources with revenue to see attribution.</p>:(c.leadSources||[]).filter(l=>l.revenue>0).map((ls,i)=><SourceBar key={ls.source} source={ls.source} count={fmtMoney(ls.revenue)} pct={ls.pct} color={LEAD_COLORS[i%LEAD_COLORS.length]}/>)}</Section>
            </>)}

            {cTab==="leads & calls"&&(<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <Section title="Lead Sources" action={<SmallBtn onClick={()=>setLeadModal(true)}>+ Add</SmallBtn>}>{(!c.leadSources?.length)?<p style={{color:T.w5,fontSize:11}}>No data.</p>:(c.leadSources||[]).map((ls,i)=><SourceBar key={ls.source} source={ls.source} count={ls.count} pct={ls.pct} color={LEAD_COLORS[i%LEAD_COLORS.length]}/>)}</Section>
              <Section title="Calls & Conversions">{[{l:"Calls Booked",v:c.callsBooked||0},{l:"Calls Attended",v:c.callsAttended||0},{l:"Close Rate",v:(c.closeRate||0)+"%"},{l:"Conversions",v:c.conversions||0},{l:"Conv. Rate",v:(c.conversionRate||0)+"%"}].map(r=>(<div key={r.l} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${T.border}`}}><span style={{color:T.w3,fontSize:11}}>{r.l}</span><span style={{color:T.w,fontSize:11,fontWeight:600,fontFamily:mono}}>{r.v}</span></div>))}{c.calendlyUrl&&<div style={{marginTop:10,padding:"8px 12px",background:T.aD,borderRadius:6}}><span style={{fontSize:10,color:T.a}}>📅 </span><a href={c.calendlyUrl} target="_blank" rel="noopener" style={{color:T.a,fontSize:10,fontFamily:mono}}>{c.calendlyUrl}</a></div>}</Section>
            </div>)}

            {cTab==="website"&&(<>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:16}}>
                <Metric label="Total Clicks" value={fmt(c.websiteClicks)} trend={6.8} icon="🖱️"/>
                <Metric label="Website" value={c.websiteUrl||"Not Set"} icon="🌐"/>
                <Metric label="Top Source" value={(c.websiteSources||[])[0]?.source||"—"} icon="📊"/>
              </div>
              <Section title="Traffic by Source" action={<SmallBtn onClick={()=>setWebsiteModal(true)}>+ Add</SmallBtn>}>{(!c.websiteSources?.length)?<p style={{color:T.w5,fontSize:11}}>No traffic data.</p>:(c.websiteSources||[]).map((ws,i)=><SourceBar key={ws.source} source={ws.source} count={ws.clicks} pct={ws.pct} color={LEAD_COLORS[i%LEAD_COLORS.length]}/>)}</Section>
            </>)}

            {cTab==="competitors"&&(<Section title={`Competitors — ${c.niche}`} action={<div style={{display:"flex",gap:6}}><SmallBtn onClick={()=>setAiModal(true)} color={T.p}>✨ AI Analyze</SmallBtn><SmallBtn onClick={()=>setCompModal(true)}>+ Manual</SmallBtn></div>}>
              <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",padding:"7px 14px",borderBottom:`1px solid ${T.border}`}}>{["Account","Followers","Eng.","Views 30d"].map(h=><span key={h} style={{fontSize:8,color:T.w5,textTransform:"uppercase",letterSpacing:".1em",fontFamily:mono}}>{h}</span>)}</div>
              {(!c.competitors?.length)?<p style={{color:T.w5,fontSize:11,padding:"12px 0"}}>None tracked.</p>:(c.competitors||[]).map((comp,i)=><CompRow key={i} c={comp}/>)}
            </Section>)}

            {cTab==="ai insights"&&(<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <Section title="🧠 AI Client Analysis" action={<SmallBtn onClick={runInsights} color={T.p}>{aiInsightLoading?"Analyzing...":"Run Analysis"}</SmallBtn>}>
                {c.aiInsights?(<div>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}><span style={{fontSize:28,fontWeight:700,color:T.a}}>{c.aiInsights.score}</span><span style={{fontSize:10,color:T.w5}}>/100 Performance Score</span></div>
                  <p style={{color:T.w3,fontSize:11,lineHeight:1.6,marginBottom:12}}>{c.aiInsights.summary}</p>
                  {c.aiInsights.strengths&&<div style={{marginBottom:8}}><p style={{color:T.g,fontSize:10,fontFamily:mono,marginBottom:4}}>STRENGTHS</p>{c.aiInsights.strengths.map((s,i)=><p key={i} style={{color:T.w3,fontSize:11,margin:"2px 0"}}>✓ {s}</p>)}</div>}
                  {c.aiInsights.weaknesses&&<div style={{marginBottom:8}}><p style={{color:T.r,fontSize:10,fontFamily:mono,marginBottom:4}}>WEAKNESSES</p>{c.aiInsights.weaknesses.map((s,i)=><p key={i} style={{color:T.w3,fontSize:11,margin:"2px 0"}}>✗ {s}</p>)}</div>}
                  {c.aiInsights.recommendations&&<div><p style={{color:T.a,fontSize:10,fontFamily:mono,marginBottom:4}}>RECOMMENDATIONS</p>{c.aiInsights.recommendations.map((s,i)=><p key={i} style={{color:T.w3,fontSize:11,margin:"2px 0"}}>→ {s}</p>)}</div>}
                  {c.aiInsights.predicted_growth&&<div style={{marginTop:12,padding:"8px 12px",background:T.aD,borderRadius:6}}><span style={{color:T.a,fontSize:11}}>📈 30-Day Prediction: </span><span style={{color:T.w,fontSize:11}}>{c.aiInsights.predicted_growth}</span></div>}
                </div>):(<p style={{color:T.w5,fontSize:11}}>Click "Run Analysis" to get AI-powered insights on this client's performance, strengths, weaknesses, and growth predictions.</p>)}
              </Section>
              <Section title="💡 AI Content Ideas" action={<SmallBtn onClick={runIdeas} color={T.y}>{ideasLoading?"Generating...":"Generate Ideas"}</SmallBtn>}>
                {c.contentIdeas?.ideas?(<div>{c.contentIdeas.ideas.map((idea,i)=>(
                  <div key={i} style={{padding:"10px 0",borderBottom:i<c.contentIdeas.ideas.length-1?`1px solid ${T.border}`:"none"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{color:T.w,fontSize:12,fontWeight:600}}>{idea.title}</span><span style={{fontSize:9,padding:"2px 6px",borderRadius:3,background:T.aD,color:T.a,fontFamily:mono}}>{idea.format}</span></div>
                    <p style={{color:T.y,fontSize:10,margin:"4px 0",fontFamily:mono}}>Hook: "{idea.hook}"</p>
                    <p style={{color:T.w4,fontSize:10,margin:"2px 0"}}>{idea.why}</p>
                    <span style={{fontSize:9,color:T.w5}}>Est. views: {idea.estimated_views}</span>
                  </div>
                ))}</div>):(<p style={{color:T.w5,fontSize:11}}>Click "Generate Ideas" to get AI-powered content ideas tailored to this client's niche and audience.</p>)}
              </Section>
            </div>)}

            {cTab==="details"&&(<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <Section title="Client Info">{[{l:"Name",v:c.name},{l:"Instagram",v:c.handle},{l:"Niche",v:c.niche},{l:"Email",v:c.email||"—"},{l:"Plan",v:c.plan},{l:"Budget",v:fmtMoney(c.monthlyBudget)},{l:"Contract",v:c.contractEnd||"—"},{l:"Calendly",v:c.calendlyUrl||"—"},{l:"Website",v:c.websiteUrl||"—"}].map(r=>(<div key={r.l} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${T.border}`}}><span style={{color:T.w3,fontSize:11}}>{r.l}</span><span style={{color:T.w,fontSize:11,fontWeight:500,fontFamily:mono,maxWidth:180,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.v}</span></div>))}</Section>
              <Section title="Notes" action={<SmallBtn onClick={()=>editing?saveNotes2():setEditing(true)} color={editing?T.g:T.w4}>{editing?"Save":"Edit"}</SmallBtn>}>
                {editing?<textarea value={notes[c.id]??c.notes??""} onChange={e=>setNotes(p=>({...p,[c.id]:e.target.value}))} style={{width:"100%",minHeight:180,padding:10,borderRadius:5,border:`1px solid ${T.border}`,background:T.bg,color:T.w,fontSize:11,lineHeight:1.7,outline:"none",resize:"vertical",fontFamily:font,boxSizing:"border-box"}}/>
                :<p style={{color:T.w3,fontSize:11,lineHeight:1.8,margin:0}}>{notes[c.id]??c.notes??"No notes."}</p>}
              </Section>
            </div>)}
          </div>
        </div>)}
      </main>

      {/* ── MODALS ── */}
      {addModal&&<Modal onClose={()=>setAddModal(false)}><h3 style={{color:T.w,margin:"0 0 18px",fontSize:15,fontWeight:700}}>Add Client</h3><Inp label="Client Name *" value={newC.name} onChange={e=>setNewC(p=>({...p,name:e.target.value}))} placeholder="Brand name"/><Inp label="Instagram Handle *" value={newC.handle} onChange={e=>setNewC(p=>({...p,handle:e.target.value}))} placeholder="@brand"/><Inp label="Instagram URL" value={newC.igLink} onChange={e=>setNewC(p=>({...p,igLink:e.target.value}))} placeholder="https://instagram.com/brand"/><Inp label="Niche" value={newC.niche} onChange={e=>setNewC(p=>({...p,niche:e.target.value}))} placeholder="Fashion, Fitness..."/><div style={{borderTop:`1px solid ${T.border}`,margin:"8px 0 4px",paddingTop:12}}><p style={{fontSize:10,color:T.a,marginBottom:8,fontFamily:mono}}>CLIENT LOGIN</p></div><Inp label="Email" value={newC.email} onChange={e=>setNewC(p=>({...p,email:e.target.value}))} placeholder="client@brand.com"/><Inp label="Password" value={newC.password} onChange={e=>setNewC(p=>({...p,password:e.target.value}))} type="password" placeholder="Client password"/><div style={{display:"flex",gap:8,marginTop:4}}><Btn onClick={()=>setAddModal(false)}>Cancel</Btn><Btn onClick={addClient} primary disabled={saving}>{saving?"Adding...":"Add Client"}</Btn></div></Modal>}

      {editModal&&<Modal onClose={()=>setEditModal(false)} wide><h3 style={{color:T.w,margin:"0 0 18px",fontSize:15,fontWeight:700}}>Edit Stats — {c?.name}</h3><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>{[{k:"followers",l:"Followers"},{k:"videosPosted30d",l:"Videos (30d)"},{k:"revenueDaily",l:"Daily Revenue",pre:"$"},{k:"revenueWeekly",l:"Weekly Revenue",pre:"$"},{k:"revenueMonthly",l:"Monthly Revenue",pre:"$"},{k:"callsBooked",l:"Calls Booked"},{k:"callsAttended",l:"Calls Attended"},{k:"closeRate",l:"Close Rate %"},{k:"conversions",l:"Conversions"},{k:"conversionRate",l:"Conv. Rate %"},{k:"plan",l:"Plan"},{k:"monthlyBudget",l:"Budget",pre:"$"}].map(f=><Inp key={f.k} label={f.l} value={editData[f.k]||""} onChange={e=>setEditData(p=>({...p,[f.k]:e.target.value}))} prefix={f.pre}/>)}</div><div style={{display:"flex",gap:8,marginTop:4}}><Btn onClick={()=>setEditModal(false)}>Cancel</Btn><Btn onClick={saveStats} primary>Save</Btn></div></Modal>}

      {leadModal&&<Modal onClose={()=>setLeadModal(false)}><h3 style={{color:T.w,margin:"0 0 18px",fontSize:15,fontWeight:700}}>Add Leads</h3><div style={{marginBottom:12}}><label style={{fontSize:10,color:T.w4,textTransform:"uppercase",letterSpacing:".12em",marginBottom:4,display:"block",fontFamily:mono}}>Source</label><select value={newLead.source} onChange={e=>setNewLead(p=>({...p,source:e.target.value}))} style={{width:"100%",padding:"11px 13px",borderRadius:6,border:`1px solid ${T.border}`,background:T.bg,color:T.w,fontSize:13,outline:"none",fontFamily:font,boxSizing:"border-box"}}>{LEAD_SOURCES.map(s=><option key={s} value={s}>{s}</option>)}</select></div><Inp label="Number of Leads" value={newLead.count} onChange={e=>setNewLead(p=>({...p,count:e.target.value}))} placeholder="25"/><Inp label="Revenue from this source" value={newLead.revenue} onChange={e=>setNewLead(p=>({...p,revenue:e.target.value}))} placeholder="5000" prefix="$"/><div style={{display:"flex",gap:8,marginTop:4}}><Btn onClick={()=>setLeadModal(false)}>Cancel</Btn><Btn onClick={addLeadSource} primary>Add</Btn></div></Modal>}

      {websiteModal&&<Modal onClose={()=>setWebsiteModal(false)}><h3 style={{color:T.w,margin:"0 0 18px",fontSize:15,fontWeight:700}}>Add Website Traffic</h3><div style={{marginBottom:12}}><label style={{fontSize:10,color:T.w4,textTransform:"uppercase",letterSpacing:".12em",marginBottom:4,display:"block",fontFamily:mono}}>Source</label><select value={newWS.source} onChange={e=>setNewWS(p=>({...p,source:e.target.value}))} style={{width:"100%",padding:"11px 13px",borderRadius:6,border:`1px solid ${T.border}`,background:T.bg,color:T.w,fontSize:13,outline:"none",fontFamily:font,boxSizing:"border-box"}}>{["Instagram","Facebook","TikTok","YouTube","Google/SEO","Paid Ads","Direct","Email","Twitter/X","Other"].map(s=><option key={s} value={s}>{s}</option>)}</select></div><Inp label="Number of Clicks" value={newWS.clicks} onChange={e=>setNewWS(p=>({...p,clicks:e.target.value}))} placeholder="150"/><div style={{display:"flex",gap:8,marginTop:4}}><Btn onClick={()=>setWebsiteModal(false)}>Cancel</Btn><Btn onClick={addWebSource} primary>Add</Btn></div></Modal>}

      {compModal&&<Modal onClose={()=>setCompModal(false)}><h3 style={{color:T.w,margin:"0 0 18px",fontSize:15,fontWeight:700}}>Add Competitor</h3>{[{k:"name",l:"Name",p:"Brand"},{k:"handle",l:"Handle",p:"@brand"},{k:"followers",l:"Followers",p:"150000"},{k:"engagement",l:"Engagement %",p:"4.5"},{k:"views30d",l:"Views (30d)",p:"3000000"}].map(f=><Inp key={f.k} label={f.l} value={newComp[f.k]} onChange={e=>setNewComp(p=>({...p,[f.k]:e.target.value}))} placeholder={f.p}/>)}<div style={{display:"flex",gap:8,marginTop:4}}><Btn onClick={()=>setCompModal(false)}>Cancel</Btn><Btn onClick={addCompetitor} primary>Add</Btn></div></Modal>}

      {aiModal&&<Modal onClose={()=>{setAiModal(false);setAiResult(null);setAiLink("");}}><h3 style={{color:T.w,margin:"0 0 4px",fontSize:15,fontWeight:700}}>✨ AI Competitor Analysis</h3><p style={{color:T.w5,fontSize:11,marginBottom:16}}>Paste an Instagram link or handle.</p><Inp label="Instagram" value={aiLink} onChange={e=>setAiLink(e.target.value)} placeholder="@competitor" onKeyDown={e=>e.key==="Enter"&&analyzeComp()}/><Btn onClick={analyzeComp} primary disabled={aiLoading}>{aiLoading?"🔍 Analyzing...":"Analyze"}</Btn>
        {aiResult&&!aiResult.error&&(<div style={{marginTop:16,padding:16,background:T.bg,borderRadius:8,border:`1px solid ${T.border}`}}><div style={{marginBottom:12}}><div style={{color:T.w,fontSize:14,fontWeight:700}}>{aiResult.name}</div><div style={{color:T.a,fontSize:11,fontFamily:mono}}>{aiResult.handle}</div></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>{[{l:"Followers",v:fmt(aiResult.followers)},{l:"Engagement",v:aiResult.engagement+"%"},{l:"Views/mo",v:fmt(aiResult.views30d)}].map(s=>(<div key={s.l} style={{background:T.bg1,padding:"8px",borderRadius:6,textAlign:"center"}}><div style={{color:T.w,fontSize:13,fontWeight:700,fontFamily:mono}}>{s.v}</div><div style={{color:T.w5,fontSize:8}}>{s.l}</div></div>))}</div><p style={{color:T.w3,fontSize:11,lineHeight:1.6,marginBottom:12}}>{aiResult.analysis}</p>{aiResult.top_videos?.map((v,i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`1px solid ${T.border}`}}><span style={{color:T.w3,fontSize:10,maxWidth:"60%",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v.caption}</span><span style={{color:T.w,fontSize:10,fontFamily:mono}}>{fmt(v.views)}</span></div>))}<div style={{marginTop:12}}><Btn onClick={addAiComp} primary>Add as Competitor</Btn></div></div>)}
        {aiResult?.error&&<div style={{marginTop:12,color:T.r,fontSize:12,padding:"10px",background:T.rD,borderRadius:6}}>{aiResult.error}</div>}
      </Modal>}
    </div>
  );
};

// ─── APP ─────────────────────────────────────────────────────────────────────
export default function CCAccelerator(){
  const [user,setUser]=useState(null);const [clients,setClients]=useState([]);const [loaded,setLoaded]=useState(false);
  const loadClients=async()=>{const all=(await db.get("clients"))||[];setClients(all);return all;};
  useEffect(()=>{(async()=>{const s=loadSession();if(s)setUser(s);await loadClients();setLoaded(true);})();},[]);
  if(!loaded) return <div style={{minHeight:"100vh",background:"#000",display:"flex",alignItems:"center",justifyContent:"center"}}><Logo size={48}/></div>;
  if(!user) return <AuthScreen onLogin={u=>{setUser(u);loadClients();}} refreshClients={loadClients}/>;
  if(user.role==="client"){const cl=clients.find(c=>c.id===user.clientId);return <ClientDash client={cl} onLogout={()=>setUser(null)} refreshClients={loadClients} clients={clients}/>;}
  return <AgencyDash onLogout={()=>setUser(null)} userName={user.name} clients={clients} refreshClients={loadClients}/>;
}
