import { useState, useEffect } from "react";
import { db } from "./supabase";

const T = {
  bg:"#000",bg1:"#070707",bg2:"#0D0D0D",bg3:"#141414",
  border:"#1C1C1C",borderH:"#2A2A2A",
  w:"#FFF",w2:"#E0E0E0",w3:"#AAA",w4:"#777",w5:"#555",
  a:"#60A5FA",aD:"#60A5FA18",g:"#34D399",gD:"#34D39914",
  r:"#F87171",rD:"#F8717114",y:"#FBBF24",p:"#A78BFA",
};
const font="'DM Sans',system-ui,sans-serif";
const mono="'JetBrains Mono','SF Mono',monospace";
const INVITE_CODE="CCALIMITED2026";
const ADMINS=[
  {email:"pewlax@gmail.com",password:"SteveCCAcceleratorPlatformAdmin12345",name:"Steve"},
  {email:"dannyfresko92@gmail.com",password:"DannyCCAcceleratorPlatformAdmin12345",name:"Danny"},
];
const LEAD_SOURCES=["Instagram Reels","Instagram Stories","Instagram Posts","Setter/DM","Paid Ads","Referrals","Website/SEO","Email Marketing","TikTok","YouTube","Other"];
const LEAD_COLORS=[T.a,T.g,T.y,T.p,T.r,"#F472B6","#818CF8","#FB923C","#2DD4BF","#E879F9","#94A3B8"];
const DAYS=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const fmt=n=>{if(n>=1e6)return(n/1e6).toFixed(1)+"M";if(n>=1e3)return(n/1e3).toFixed(1)+"K";return n?.toString()??"0";};

const makeClient=(f)=>({
  id:f.id||"c_"+Date.now()+"_"+Math.random().toString(36).slice(2,6),
  name:f.name||"",handle:f.handle||"",igLink:f.igLink||"",
  niche:f.niche||"General",avatar:f.avatar||f.name?.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()||"??",
  email:f.email||"",followers:0,followersChange:0,following:0,posts:0,engagement:0,
  views7d:0,views30d:0,views90d:0,likes7d:0,likes30d:0,comments7d:0,comments30d:0,
  shares7d:0,shares30d:0,saves7d:0,saves30d:0,leads7d:0,leads30d:0,conversions:0,
  reachRate:0,storyViews:0,dailyViews:[0,0,0,0,0,0,0],dailyFollowers:[0,0,0,0,0,0,0],
  leadSources:[],topPosts:[],competitors:[],notes:"",contractEnd:"",plan:"Standard",monthlyBudget:0,
  createdAt:new Date().toISOString(),...f,
});

const saveSession=u=>{try{localStorage.setItem("cc_session",JSON.stringify(u));}catch{}};
const loadSession=()=>{try{const s=localStorage.getItem("cc_session");return s?JSON.parse(s):null;}catch{return null;}};
const clearSession=()=>{try{localStorage.removeItem("cc_session");}catch{}};

// ─── UI PRIMITIVES ───────────────────────────────────────────────────────────
const Inp=({label,value,onChange,type="text",placeholder,onKeyDown,isMono,autoFocus,disabled})=>(
  <div style={{marginBottom:12}}>
    {label&&<label style={{fontSize:10,color:T.w4,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:4,display:"block",fontFamily:mono,fontWeight:500}}>{label}</label>}
    <input value={value} onChange={onChange} type={type} placeholder={placeholder} onKeyDown={onKeyDown} autoFocus={autoFocus} disabled={disabled}
      style={{width:"100%",padding:"11px 13px",borderRadius:6,border:`1px solid ${T.border}`,background:disabled?"#0A0A0A":T.bg,color:T.w,fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:isMono?mono:font,transition:"border-color 0.15s",opacity:disabled?.5:1}}
      onFocus={e=>e.target.style.borderColor=T.a} onBlur={e=>e.target.style.borderColor=T.border}/>
  </div>
);
const Btn=({children,onClick,primary,disabled})=>(
  <button onClick={onClick} disabled={disabled} style={{width:"100%",padding:"12px",borderRadius:6,cursor:disabled?"default":"pointer",border:primary?"none":`1px solid ${T.border}`,background:primary?T.w:"transparent",color:primary?T.bg:T.w3,fontSize:13,fontWeight:primary?600:400,fontFamily:font,opacity:disabled?.4:1,transition:"all 0.15s"}}>{children}</button>
);
const Stat=({label,value,change,icon,sub})=>(
  <div style={{background:T.bg1,border:`1px solid ${T.border}`,borderRadius:8,padding:"14px 16px",display:"flex",flexDirection:"column",gap:4,transition:"border-color 0.2s,transform 0.2s",cursor:"default"}}
    onMouseEnter={e=>{e.currentTarget.style.borderColor=T.borderH;e.currentTarget.style.transform="translateY(-1px)";}}
    onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.transform="none";}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:9,color:T.w5,letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:mono}}>{label}</span><span style={{fontSize:14,opacity:.5}}>{icon}</span></div>
    <span style={{fontSize:22,fontWeight:700,color:T.w,fontFamily:font,letterSpacing:"-0.02em"}}>{value}</span>
    <div style={{display:"flex",alignItems:"center",gap:6}}>
      {change!==undefined&&<span style={{fontSize:10,fontWeight:600,fontFamily:mono,color:change>=0?T.g:T.r,background:change>=0?T.gD:T.rD,padding:"1px 5px",borderRadius:3}}>{change>=0?"↑":"↓"}{Math.abs(change).toFixed(1)}%</span>}
      {sub&&<span style={{fontSize:9,color:T.w5}}>{sub}</span>}
    </div>
  </div>
);
const Bar=({data,labels,h=160,color=T.a})=>{const mx=Math.max(...data)||1;return(<div style={{height:h,display:"flex",alignItems:"flex-end",gap:5,padding:"0 2px"}}>{data.map((v,i)=>(<div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}><span style={{fontSize:8,color:T.w5,fontFamily:mono}}>{fmt(v)}</span><div style={{width:"100%",maxWidth:28,height:`${(v/mx)*(h-36)}px`,background:`linear-gradient(180deg,${color},${color}30)`,borderRadius:"3px 3px 0 0",transition:"height 0.5s ease"}}/><span style={{fontSize:8,color:T.w5,fontFamily:mono}}>{labels?.[i]}</span></div>))}</div>);};
const MiniChart=({data,h=32,w=80})=>{const mx=Math.max(...data),mn=Math.min(...data),rng=mx-mn||1;const pts=data.map((v,i)=>`${(i/(data.length-1))*w},${h-((v-mn)/rng)*(h-6)-3}`).join(" ");const uid="g"+Math.random().toString(36).slice(2,7);return(<svg width={w} height={h} style={{display:"block"}}><defs><linearGradient id={uid} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.a} stopOpacity=".15"/><stop offset="100%" stopColor={T.a} stopOpacity="0"/></linearGradient></defs><polygon points={`${pts} ${w},${h} 0,${h}`} fill={`url(#${uid})`}/><polyline points={pts} fill="none" stroke={T.a} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>);};
const CompRow=({c})=>(<div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",padding:"10px 16px",borderBottom:`1px solid ${T.border}`,alignItems:"center",transition:"background .1s"}} onMouseEnter={e=>e.currentTarget.style.background=T.bg1} onMouseLeave={e=>e.currentTarget.style.background="transparent"}><div><div style={{fontWeight:600,color:T.w,fontSize:12}}>{c.name}</div><div style={{color:T.w5,fontSize:10,fontFamily:mono}}>{c.handle}</div></div><span style={{color:T.w3,fontFamily:mono,fontSize:12}}>{fmt(c.followers)}</span><span style={{color:c.engagement>=5?T.g:T.a,fontFamily:mono,fontSize:12}}>{c.engagement}%</span><span style={{color:T.w3,fontFamily:mono,fontSize:12}}>{fmt(c.views30d||0)}</span></div>);
const LeadBar=({source,count,pct,color})=>(<div style={{marginBottom:10}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:11,color:T.w3}}>{source}</span><span style={{fontSize:11,color:T.w,fontFamily:mono,fontWeight:600}}>{count} <span style={{color:T.w5,fontWeight:400}}>({pct}%)</span></span></div><div style={{height:4,background:T.border,borderRadius:2}}><div style={{width:pct+"%",height:"100%",background:color,borderRadius:2,transition:"width .6s ease"}}/></div></div>);
const Modal=({children,onClose})=>(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.82)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1e3,backdropFilter:"blur(6px)"}} onClick={onClose}><div style={{width:460,maxHeight:"90vh",overflowY:"auto",padding:28,borderRadius:10,background:T.bg2,border:`1px solid ${T.border}`,boxShadow:"0 40px 80px rgba(0,0,0,.7)"}} onClick={e=>e.stopPropagation()}>{children}</div></div>);
const Tab=({tabs,active,onChange})=>(<div style={{display:"flex",borderBottom:`1px solid ${T.border}`}}>{tabs.map(t=>(<button key={t} onClick={()=>onChange(t)} style={{padding:"11px 18px",border:"none",background:"transparent",cursor:"pointer",color:active===t?T.w:T.w5,fontSize:12,fontWeight:600,borderBottom:active===t?`2px solid ${T.a}`:"2px solid transparent",fontFamily:font,textTransform:"capitalize",transition:"color .15s"}}>{t}</button>))}</div>);
const Logo=({size=30})=>(<img src="/logo-icon.jpeg" alt="CC" style={{width:size,height:size,borderRadius:size>35?10:6,objectFit:"cover"}}/>);

// ─── AUTH ─────────────────────────────────────────────────────────────────────
const AuthScreen=({onLogin,refreshClients})=>{
  const [mode,setMode]=useState("choose");
  const [email,setEmail]=useState("");const [pass,setPass]=useState("");
  const [confirmPass,setConfirmPass]=useState("");const [name,setName]=useState("");
  const [handle,setHandle]=useState("");const [niche,setNiche]=useState("");
  const [inviteCode,setInviteCode]=useState("");
  const [error,setError]=useState("");const [loading,setLoading]=useState(false);
  const reset=()=>{setError("");setEmail("");setPass("");setConfirmPass("");setName("");setHandle("");setNiche("");setInviteCode("");};

  const loginAdmin=()=>{setError("");setLoading(true);setTimeout(()=>{
    const a=ADMINS.find(a=>a.email.toLowerCase()===email.toLowerCase()&&a.password===pass);
    if(!a){setError("Invalid admin credentials.");setLoading(false);return;}
    const u={role:"agency",name:a.name,email:a.email};saveSession(u);onLogin(u);
  },400);};

  const loginClient=async()=>{setError("");setLoading(true);try{
    const users=(await db.get("users"))||[];
    const u=users.find(u=>u.email.toLowerCase()===email.toLowerCase()&&u.password===pass);
    if(!u){setError("Invalid email or password.");setLoading(false);return;}
    const session={role:"client",name:u.name,email:u.email,clientId:u.clientId};
    saveSession(session);onLogin(session);
  }catch{setError("Login error.");setLoading(false);}};

  const signUp=async()=>{setError("");
    if(!name.trim()||!email.trim()||!handle.trim()){setError("Fill in all required fields.");return;}
    if(pass.length<6){setError("Password: 6+ characters.");return;}
    if(pass!==confirmPass){setError("Passwords don't match.");return;}
    if(inviteCode!==INVITE_CODE){setError("Invalid invitation code.");return;}
    const users=(await db.get("users"))||[];
    if(users.find(u=>u.email.toLowerCase()===email.toLowerCase())||ADMINS.find(a=>a.email.toLowerCase()===email.toLowerCase())){setError("Email already in use.");return;}
    setLoading(true);try{
      const h2=handle.startsWith("@")?handle:"@"+handle;
      const clientId="c_"+Date.now()+"_"+Math.random().toString(36).slice(2,6);
      const client=makeClient({id:clientId,name,handle:h2,igLink:`https://instagram.com/${h2.replace("@","")}`,niche:niche||"General",email});
      const clients=(await db.get("clients"))||[];
      clients.push(client);await db.set("clients",clients);
      users.push({id:"u_"+Date.now(),email,password:pass,name,role:"client",clientId,createdAt:new Date().toISOString()});
      await db.set("users",users);
      const session={role:"client",name,email,clientId};saveSession(session);refreshClients();onLogin(session);
    }catch{setError("Signup error.");setLoading(false);}
  };

  return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:T.bg,fontFamily:font}}>
      <div style={{position:"fixed",inset:0,opacity:.02,backgroundImage:`linear-gradient(${T.w} 1px,transparent 1px),linear-gradient(90deg,${T.w} 1px,transparent 1px)`,backgroundSize:"100px 100px",pointerEvents:"none"}}/>
      <div style={{width:mode==="signup"?440:380,padding:"36px 32px",borderRadius:12,background:T.bg1,border:`1px solid ${T.border}`,boxShadow:"0 40px 100px rgba(0,0,0,.5)",position:"relative",zIndex:1}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{marginBottom:12}}><Logo size={52}/></div>
          <img src="/logo-text.png" alt="CC Accelerator" style={{height:18,objectFit:"contain",filter:"brightness(1.1)",marginBottom:6}}/>
          <p style={{color:T.w5,fontSize:11,marginTop:4}}>{mode==="choose"?"Content Agency Command Center":mode==="admin"?"Admin Sign In":mode==="client-login"?"Client Sign In":"Create Client Account"}</p>
        </div>

        {mode==="choose"&&(<div style={{display:"flex",flexDirection:"column",gap:8}}>
          {[{m:"admin",icon:"⚡",t:"Admin Login",sub:"For agency founders",col:T.aD},{m:"client-login",icon:"👤",t:"Client Login",sub:"View your stats",col:T.gD}].map(o=>(
            <button key={o.m} onClick={()=>{setMode(o.m);reset();}} style={{padding:16,borderRadius:8,border:`1px solid ${T.border}`,background:T.bg,color:T.w,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:font,display:"flex",alignItems:"center",gap:12,textAlign:"left",transition:"border-color .15s"}}
              onMouseEnter={e=>e.currentTarget.style.borderColor=T.a} onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
              <div style={{width:36,height:36,borderRadius:8,background:o.col,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:16}}>{o.icon}</span></div>
              <div><div style={{fontSize:14,fontWeight:600}}>{o.t}</div><div style={{fontSize:11,color:T.w5,marginTop:2}}>{o.sub}</div></div>
            </button>))}
          <div style={{textAlign:"center",marginTop:12}}><span style={{color:T.w5,fontSize:12}}>New client? </span><button onClick={()=>{setMode("signup");reset();}} style={{background:"none",border:"none",color:T.a,fontSize:12,cursor:"pointer",fontWeight:600,fontFamily:font,textDecoration:"underline",textUnderlineOffset:3}}>Create account</button></div>
        </div>)}

        {mode==="admin"&&(<><Inp label="Admin Email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Enter admin email" onKeyDown={e=>e.key==="Enter"&&loginAdmin()} autoFocus/><Inp label="Password" value={pass} onChange={e=>setPass(e.target.value)} type="password" placeholder="Enter admin password" onKeyDown={e=>e.key==="Enter"&&loginAdmin()}/>{error&&<div style={{color:T.r,fontSize:12,padding:"8px 10px",background:T.rD,borderRadius:6,marginBottom:12}}>{error}</div>}<Btn onClick={loginAdmin} primary disabled={loading}>{loading?"Signing in...":"Sign In as Admin"}</Btn><div style={{height:8}}/><Btn onClick={()=>{setMode("choose");reset();}}>← Back</Btn></>)}

        {mode==="client-login"&&(<><Inp label="Email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@email.com" onKeyDown={e=>e.key==="Enter"&&loginClient()} autoFocus/><Inp label="Password" value={pass} onChange={e=>setPass(e.target.value)} type="password" placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&loginClient()}/>{error&&<div style={{color:T.r,fontSize:12,padding:"8px 10px",background:T.rD,borderRadius:6,marginBottom:12}}>{error}</div>}<Btn onClick={loginClient} primary disabled={loading}>{loading?"Signing in...":"Sign In"}</Btn><div style={{textAlign:"center",marginTop:12}}><span style={{color:T.w5,fontSize:12}}>No account? </span><button onClick={()=>{setMode("signup");reset();}} style={{background:"none",border:"none",color:T.a,fontSize:12,cursor:"pointer",fontWeight:600,fontFamily:font,textDecoration:"underline",textUnderlineOffset:3}}>Sign up</button></div><div style={{height:6}}/><Btn onClick={()=>{setMode("choose");reset();}}>← Back</Btn></>)}

        {mode==="signup"&&(<><Inp label="Brand / Full Name *" value={name} onChange={e=>setName(e.target.value)} placeholder="Acme Studios" autoFocus/><Inp label="Email *" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@brand.com"/><Inp label="Instagram Handle *" value={handle} onChange={e=>setHandle(e.target.value)} placeholder="@yourbrand"/><Inp label="Niche" value={niche} onChange={e=>setNiche(e.target.value)} placeholder="Fashion, Fitness, Tech..."/><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}><Inp label="Password *" value={pass} onChange={e=>setPass(e.target.value)} type="password" placeholder="6+ chars"/><Inp label="Confirm *" value={confirmPass} onChange={e=>setConfirmPass(e.target.value)} type="password" placeholder="Re-enter"/></div><Inp label="Invitation Code *" value={inviteCode} onChange={e=>setInviteCode(e.target.value)} placeholder="Enter code" isMono/>{inviteCode===INVITE_CODE&&<span style={{fontSize:10,color:T.g,display:"block",marginTop:-6,marginBottom:8}}>✓ Valid invitation code</span>}{error&&<div style={{color:T.r,fontSize:12,padding:"8px 10px",background:T.rD,borderRadius:6,marginBottom:12}}>{error}</div>}<Btn onClick={signUp} primary disabled={loading}>{loading?"Creating...":"Create Account"}</Btn><div style={{height:6}}/><Btn onClick={()=>{setMode("choose");reset();}}>← Back</Btn></>)}
      </div>
    </div>
  );
};

// ─── CLIENT VIEW ─────────────────────────────────────────────────────────────
const ClientView=({client:c,onLogout})=>{
  const [tab,setTab]=useState("overview");
  if(!c) return <div style={{minHeight:"100vh",background:T.bg,color:T.w,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:font}}>Loading...</div>;
  return(
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:font}}>
      <header style={{padding:"10px 28px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",background:T.bg1+"DD",backdropFilter:"blur(10px)",position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}><Logo size={28}/><div><h2 style={{color:T.w,margin:0,fontSize:14,fontWeight:700}}>{c.name}</h2><a href={c.igLink} target="_blank" rel="noopener" style={{color:T.a,fontSize:11,fontFamily:mono,textDecoration:"none"}}>{c.handle}</a></div></div>
        <button onClick={()=>{clearSession();onLogout();}} style={{padding:"6px 14px",borderRadius:6,border:`1px solid ${T.border}`,background:"transparent",color:T.w4,fontSize:11,cursor:"pointer",fontFamily:font}}>Logout</button>
      </header>
      <div style={{padding:"0 28px"}}><Tab tabs={["overview","content","leads","competitors"]} active={tab} onChange={setTab}/></div>
      <div style={{padding:24,maxWidth:1400,margin:"0 auto"}}>
        {tab==="overview"&&(<><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:10,marginBottom:20}}>
          <Stat label="Followers" value={fmt(c.followers)} change={c.followers?(c.followersChange/c.followers)*100:0} icon="👥" sub={`+${fmt(c.followersChange)}`}/><Stat label="Views (7d)" value={fmt(c.views7d)} change={12.4} icon="👁"/><Stat label="Views (30d)" value={fmt(c.views30d)} change={8.2} icon="📊"/><Stat label="Engagement" value={c.engagement+"%"} change={.8} icon="⚡"/><Stat label="Likes (7d)" value={fmt(c.likes7d)} change={6.2} icon="❤️"/><Stat label="Comments (7d)" value={fmt(c.comments7d)} change={4.8} icon="💬"/><Stat label="Saves (7d)" value={fmt(c.saves7d)} change={15.2} icon="🔖"/><Stat label="Leads (30d)" value={c.leads30d} change={22.1} icon="🎯"/>
        </div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><div style={{background:T.bg1,border:`1px solid ${T.border}`,borderRadius:8,padding:18}}><h3 style={{color:T.w,margin:"0 0 14px",fontSize:12,fontWeight:600}}>Views This Week</h3><Bar data={c.dailyViews} labels={DAYS}/></div><div style={{background:T.bg1,border:`1px solid ${T.border}`,borderRadius:8,padding:18}}><h3 style={{color:T.w,margin:"0 0 14px",fontSize:12,fontWeight:600}}>Follower Growth</h3><Bar data={c.dailyFollowers.map((v,i,a)=>i===0?0:v-a[i-1])} labels={DAYS} color={T.g}/></div></div></>)}
        {tab==="content"&&(<div style={{background:T.bg1,border:`1px solid ${T.border}`,borderRadius:8,padding:18}}><h3 style={{color:T.w,margin:"0 0 16px",fontSize:12,fontWeight:600}}>Top Posts</h3>{(!c.topPosts?.length)&&<p style={{color:T.w5,fontSize:12}}>No posts tracked yet.</p>}{(c.topPosts||[]).map((p,i)=>(<div key={i} style={{display:"grid",gridTemplateColumns:"auto 2fr 1fr 1fr 1fr",padding:"11px 0",borderBottom:i<c.topPosts.length-1?`1px solid ${T.border}`:"none",alignItems:"center",gap:12}}><span style={{color:T.a,fontSize:11,fontFamily:mono,width:18}}>#{i+1}</span><div><div style={{color:T.w,fontSize:12,fontWeight:500}}>{p.caption}</div><div style={{color:T.w5,fontSize:9,marginTop:1}}>{p.date}</div></div>{[{v:p.views,l:"views"},{v:p.likes,l:"likes"},{v:p.comments,l:"cmts"}].map(x=>(<div key={x.l} style={{textAlign:"center"}}><div style={{color:T.w,fontSize:13,fontWeight:600,fontFamily:mono}}>{fmt(x.v)}</div><div style={{color:T.w5,fontSize:8}}>{x.l}</div></div>))}</div>))}</div>)}
        {tab==="leads"&&(<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><div style={{background:T.bg1,border:`1px solid ${T.border}`,borderRadius:8,padding:18}}><h3 style={{color:T.w,margin:"0 0 16px",fontSize:12,fontWeight:600}}>Lead Sources (30d)</h3>{(!c.leadSources?.length)&&<p style={{color:T.w5,fontSize:12}}>No lead data yet.</p>}{(c.leadSources||[]).map((ls,i)=><LeadBar key={ls.source} source={ls.source} count={ls.count} pct={ls.pct} color={LEAD_COLORS[i%LEAD_COLORS.length]}/>)}</div><div style={{background:T.bg1,border:`1px solid ${T.border}`,borderRadius:8,padding:18}}><h3 style={{color:T.w,margin:"0 0 16px",fontSize:12,fontWeight:600}}>Lead Summary</h3>{[{l:"Leads (7d)",v:c.leads7d},{l:"Leads (30d)",v:c.leads30d},{l:"Conversions",v:c.conversions},{l:"Conv. Rate",v:c.leads30d?(c.conversions/c.leads30d*100).toFixed(1)+"%":"0%"}].map(r=>(<div key={r.l} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:`1px solid ${T.border}`}}><span style={{color:T.w3,fontSize:12}}>{r.l}</span><span style={{color:T.w,fontSize:12,fontWeight:600,fontFamily:mono}}>{r.v}</span></div>))}</div></div>)}
        {tab==="competitors"&&(<div style={{background:T.bg1,border:`1px solid ${T.border}`,borderRadius:8,overflow:"hidden"}}><div style={{padding:"14px 18px",borderBottom:`1px solid ${T.border}`}}><h3 style={{color:T.w,margin:0,fontSize:12,fontWeight:600}}>Competitors — {c.niche}</h3></div><div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",padding:"8px 16px",borderBottom:`1px solid ${T.border}`}}>{["Account","Followers","Eng.","Views 30d"].map(h=><span key={h} style={{fontSize:8,color:T.w5,textTransform:"uppercase",letterSpacing:".1em",fontFamily:mono}}>{h}</span>)}</div><div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",padding:"10px 16px",borderBottom:`1px solid ${T.border}`,background:T.aD}}><div><div style={{fontWeight:600,color:T.a,fontSize:12}}>{c.name} (You)</div><div style={{color:T.w5,fontSize:10,fontFamily:mono}}>{c.handle}</div></div><span style={{color:T.w,fontFamily:mono,fontSize:12}}>{fmt(c.followers)}</span><span style={{color:T.g,fontFamily:mono,fontSize:12}}>{c.engagement}%</span><span style={{color:T.w,fontFamily:mono,fontSize:12}}>{fmt(c.views30d)}</span></div>{(!c.competitors?.length)&&<div style={{padding:16,textAlign:"center",color:T.w5,fontSize:11}}>No competitors tracked.</div>}{(c.competitors||[]).map((comp,i)=><CompRow key={i} c={comp}/>)}</div>)}
      </div>
    </div>
  );
};

// ─── AGENCY DASHBOARD ────────────────────────────────────────────────────────
const AgencyDash=({onLogout,userName,clients,refreshClients})=>{
  const [sel,setSel]=useState(null);const [view,setView]=useState("overview");const [cTab,setCTab]=useState("analytics");
  const [editing,setEditing]=useState(false);const [notes,setNotes]=useState({});const [q,setQ]=useState("");
  const [compModal,setCompModal]=useState(false);const [newComp,setNewComp]=useState({name:"",handle:"",followers:"",engagement:"",views30d:""});
  const [addModal,setAddModal]=useState(false);const [newC,setNewC]=useState({name:"",handle:"",niche:"",email:"",password:"",igLink:""});
  const [leadModal,setLeadModal]=useState(false);const [newLead,setNewLead]=useState({source:LEAD_SOURCES[0],count:""});
  const [aiModal,setAiModal]=useState(false);const [aiLink,setAiLink]=useState("");const [aiLoading,setAiLoading]=useState(false);const [aiResult,setAiResult]=useState(null);
  const [saving,setSaving]=useState(false);

  const all=clients;
  const totF=all.reduce((a,c)=>a+c.followers,0);const totV=all.reduce((a,c)=>a+(c.views30d||0),0);
  const totL=all.reduce((a,c)=>a+(c.leads30d||0),0);const avgE=all.length?(all.reduce((a,c)=>a+c.engagement,0)/all.length).toFixed(1):"0";
  const totR=all.reduce((a,c)=>a+(c.monthlyBudget||0),0);
  const filtered=all.filter(c=>c.name.toLowerCase().includes(q.toLowerCase())||c.handle.toLowerCase().includes(q.toLowerCase())||(c.niche||"").toLowerCase().includes(q.toLowerCase()));

  const open=c=>{setSel(c);setView("client");setCTab("analytics");};
  const c=sel;

  const addClient=async()=>{if(!newC.name||!newC.handle)return;setSaving(true);
    const h2=newC.handle.startsWith("@")?newC.handle:"@"+newC.handle;
    const clientId="c_"+Date.now()+"_"+Math.random().toString(36).slice(2,6);
    const client=makeClient({id:clientId,name:newC.name,handle:h2,igLink:newC.igLink||`https://instagram.com/${h2.replace("@","")}`,niche:newC.niche||"General",email:newC.email});
    const cls=(await db.get("clients"))||[];cls.push(client);await db.set("clients",cls);
    if(newC.email&&newC.password){const users=(await db.get("users"))||[];users.push({id:"u_"+Date.now(),email:newC.email,password:newC.password,name:newC.name,role:"client",clientId,createdAt:new Date().toISOString()});await db.set("users",users);}
    await refreshClients();setNewC({name:"",handle:"",niche:"",email:"",password:"",igLink:""});setAddModal(false);setSaving(false);
  };

  const saveClients=async(updated)=>{await db.set("clients",updated);await refreshClients();};

  const addCompetitor=async()=>{if(!c||!newComp.name)return;
    const cls=(await db.get("clients"))||[];const idx=cls.findIndex(x=>x.id===c.id);if(idx<0)return;
    const comps=[...(cls[idx].competitors||[]),{name:newComp.name,handle:newComp.handle,followers:parseInt(newComp.followers)||0,engagement:parseFloat(newComp.engagement)||0,views30d:parseInt(newComp.views30d)||0}];
    cls[idx].competitors=comps;await saveClients(cls);setSel(cls[idx]);setNewComp({name:"",handle:"",followers:"",engagement:"",views30d:""});setCompModal(false);
  };

  const addLeadSource=async()=>{if(!c||!newLead.count)return;
    const cls=(await db.get("clients"))||[];const idx=cls.findIndex(x=>x.id===c.id);if(idx<0)return;
    const existing=[...(cls[idx].leadSources||[])];const cnt=parseInt(newLead.count)||0;
    const found=existing.find(l=>l.source===newLead.source);
    if(found)found.count+=cnt;else existing.push({source:newLead.source,count:cnt,pct:0});
    const total=existing.reduce((a,l)=>a+l.count,0);existing.forEach(l=>l.pct=parseFloat((l.count/total*100).toFixed(1)));existing.sort((a,b)=>b.count-a.count);
    cls[idx].leadSources=existing;await saveClients(cls);setSel(cls[idx]);setNewLead({source:LEAD_SOURCES[0],count:""});setLeadModal(false);
  };

  const analyzeCompetitor=async()=>{if(!aiLink.trim())return;setAiLoading(true);setAiResult(null);
    try{const handle=aiLink.replace(/\/$/,"").split("/").pop().replace("@","");
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",content:`Analyze Instagram competitor @${handle}. Return ONLY valid JSON:\n{"name":"display name","handle":"@${handle}","followers":number,"engagement":number,"views30d":number,"top_videos":[{"caption":"desc","views":number,"likes":number,"date":"date"}],"niche":"niche","analysis":"2 sentence analysis"}\nEstimate if unknown. ONLY JSON.`}]})});
      const data=await res.json();const text=data.content?.map(b=>b.text||"").join("")||"";
      setAiResult(JSON.parse(text.replace(/```json|```/g,"").trim()));
    }catch{setAiResult({error:"Could not analyze. Add competitor manually instead."});}setAiLoading(false);
  };

  const addAiCompetitor=async()=>{if(!c||!aiResult||aiResult.error)return;
    const cls=(await db.get("clients"))||[];const idx=cls.findIndex(x=>x.id===c.id);if(idx<0)return;
    const comps=[...(cls[idx].competitors||[]),{name:aiResult.name,handle:aiResult.handle,followers:aiResult.followers,engagement:aiResult.engagement,views30d:aiResult.views30d,topVideos:aiResult.top_videos}];
    cls[idx].competitors=comps;await saveClients(cls);setSel(cls[idx]);setAiResult(null);setAiLink("");setAiModal(false);
  };

  const saveNotes=async()=>{if(!c)return;const cls=(await db.get("clients"))||[];const idx=cls.findIndex(x=>x.id===c.id);if(idx<0)return;
    cls[idx].notes=notes[c.id]??c.notes??"";await saveClients(cls);setSel(cls[idx]);setEditing(false);
  };

  return(
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:font,display:"flex"}}>
      <aside style={{width:230,background:T.bg1,borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",position:"fixed",top:0,bottom:0,zIndex:200}}>
        <div style={{padding:"18px 14px",borderBottom:`1px solid ${T.border}`}}><div style={{display:"flex",alignItems:"center",gap:9}}><Logo size={30}/><div><div style={{color:T.w,fontWeight:700,fontSize:13}}>CC Accelerator</div><div style={{color:T.w5,fontSize:9,fontFamily:mono}}>{userName}</div></div></div></div>
        <div style={{padding:"10px 8px"}}><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search..." style={{width:"100%",padding:"7px 9px",borderRadius:5,border:`1px solid ${T.border}`,background:T.bg,color:T.w,fontSize:11,outline:"none",boxSizing:"border-box",fontFamily:font}} onFocus={e=>e.target.style.borderColor=T.a} onBlur={e=>e.target.style.borderColor=T.border}/></div>
        <nav style={{flex:1,overflow:"auto",padding:"0 5px"}}>
          <button onClick={()=>{setView("overview");setSel(null);}} style={{width:"100%",padding:"9px",borderRadius:5,border:"none",cursor:"pointer",background:view==="overview"?T.aD:"transparent",color:view==="overview"?T.a:T.w4,fontSize:11,fontWeight:600,textAlign:"left",marginBottom:2,fontFamily:font,display:"flex",alignItems:"center",gap:7}}>◻ Overview</button>
          <div style={{padding:"7px 9px 3px",fontSize:8,color:T.w5,textTransform:"uppercase",letterSpacing:".14em",fontFamily:mono}}>Clients · {all.length}</div>
          {filtered.map(cl=>(<button key={cl.id} onClick={()=>open(cl)} style={{width:"100%",padding:"7px 9px",borderRadius:5,border:"none",cursor:"pointer",background:sel?.id===cl.id?T.aD:"transparent",color:sel?.id===cl.id?T.w:T.w4,fontSize:11,fontWeight:500,textAlign:"left",marginBottom:1,fontFamily:font,display:"flex",alignItems:"center",gap:7}}><div style={{width:22,height:22,borderRadius:4,flexShrink:0,background:sel?.id===cl.id?T.w:T.borderH,color:sel?.id===cl.id?T.bg:T.w4,display:"flex",alignItems:"center",justifyContent:"center",fontSize:7,fontWeight:700}}>{cl.avatar}</div><div style={{overflow:"hidden"}}><div style={{fontSize:11,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{cl.name}</div><div style={{fontSize:8,color:T.w5,fontFamily:mono}}>{cl.niche}</div></div></button>))}
          <button onClick={()=>setAddModal(true)} style={{width:"100%",padding:"7px 9px",borderRadius:5,border:`1px dashed ${T.border}`,cursor:"pointer",background:"transparent",color:T.w5,fontSize:11,textAlign:"left",marginTop:4,fontFamily:font,display:"flex",alignItems:"center",gap:7,transition:"all .15s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=T.a;e.currentTarget.style.color=T.a;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color=T.w5;}}>+ Add Client</button>
        </nav>
        <div style={{padding:10,borderTop:`1px solid ${T.border}`}}><button onClick={()=>{clearSession();onLogout();}} style={{width:"100%",padding:7,borderRadius:5,border:`1px solid ${T.border}`,background:"transparent",color:T.w5,fontSize:10,cursor:"pointer",fontFamily:font}}>Logout</button></div>
      </aside>

      <main style={{flex:1,marginLeft:230,minHeight:"100vh"}}>
        {view==="overview"&&(<div style={{padding:24}}>
          <div style={{marginBottom:20,display:"flex",alignItems:"center",gap:12}}><img src="/logo-text.png" alt="" style={{height:16,objectFit:"contain",filter:"brightness(1.1)"}}/></div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:20}}><Stat label="Total Reach" value={fmt(totF)} change={2.8} icon="👥"/><Stat label="Views (30d)" value={fmt(totV)} change={9.4} icon="👁"/><Stat label="Leads" value={totL} change={18.2} icon="🎯"/><Stat label="Avg Eng." value={avgE+"%"} change={1.2} icon="📈"/><Stat label="MRR" value={"$"+totR.toLocaleString()} change={5.4} icon="💰"/></div>
          {!all.length?(<div style={{background:T.bg1,border:`1px solid ${T.border}`,borderRadius:8,padding:40,textAlign:"center"}}><p style={{color:T.w3,fontSize:14,marginBottom:12}}>No clients yet</p><p style={{color:T.w5,fontSize:12,marginBottom:16}}>Add your first client or share the invitation code with clients.</p><button onClick={()=>setAddModal(true)} style={{padding:"10px 24px",borderRadius:6,border:"none",background:T.w,color:T.bg,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:font}}>+ Add First Client</button></div>
          ):(<div style={{background:T.bg1,border:`1px solid ${T.border}`,borderRadius:8,overflow:"hidden"}}>
            <div style={{padding:"14px 18px",borderBottom:`1px solid ${T.border}`}}><h3 style={{color:T.w,margin:0,fontSize:12,fontWeight:600}}>Client Performance</h3></div>
            <div style={{display:"grid",gridTemplateColumns:"2fr repeat(6,1fr)",padding:"7px 16px",borderBottom:`1px solid ${T.border}`}}>{["Client","Followers","Views 7d","Eng.","Leads","Plan","Revenue"].map(h=><span key={h} style={{fontSize:8,color:T.w5,textTransform:"uppercase",letterSpacing:".08em",fontFamily:mono}}>{h}</span>)}</div>
            {all.map(cl=>(<div key={cl.id} onClick={()=>open(cl)} style={{display:"grid",gridTemplateColumns:"2fr repeat(6,1fr)",padding:"10px 16px",borderBottom:`1px solid ${T.border}`,alignItems:"center",cursor:"pointer",transition:"background .1s"}} onMouseEnter={e=>e.currentTarget.style.background=T.bg1} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:26,height:26,borderRadius:5,background:T.borderH,color:T.w,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:700}}>{cl.avatar}</div><div><div style={{color:T.w,fontWeight:600,fontSize:11}}>{cl.name}</div><div style={{color:T.w5,fontSize:8,fontFamily:mono}}>{cl.handle}</div></div></div>
              <span style={{color:T.w3,fontFamily:mono,fontSize:11}}>{fmt(cl.followers)}</span>
              <div style={{display:"flex",alignItems:"center",gap:4}}><span style={{color:T.w3,fontFamily:mono,fontSize:11}}>{fmt(cl.views7d||0)}</span><MiniChart data={cl.dailyViews||[0,0,0,0,0,0,0]} h={16} w={40}/></div>
              <span style={{color:cl.engagement>=5?T.g:T.a,fontWeight:600,fontFamily:mono,fontSize:11}}>{cl.engagement}%</span>
              <span style={{color:T.w3,fontFamily:mono,fontSize:11}}>{cl.leads30d||0}</span>
              <span style={{fontSize:8,padding:"2px 6px",borderRadius:3,fontWeight:600,fontFamily:mono,background:T.aD,color:T.a}}>{cl.plan}</span>
              <span style={{color:T.g,fontWeight:600,fontFamily:mono,fontSize:11}}>${(cl.monthlyBudget||0).toLocaleString()}</span>
            </div>))}
          </div>)}
        </div>)}

        {view==="client"&&c&&(<div>
          <div style={{padding:"18px 24px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{display:"flex",alignItems:"center",gap:14}}><div style={{width:40,height:40,borderRadius:8,background:T.w,color:T.bg,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:14}}>{c.avatar}</div><div><h1 style={{color:T.w,margin:0,fontSize:18,fontWeight:700}}>{c.name}</h1><div style={{display:"flex",gap:10,marginTop:2,alignItems:"center"}}><a href={c.igLink} target="_blank" rel="noopener" style={{color:T.a,fontSize:11,fontFamily:mono,textDecoration:"none"}}>{c.handle} ↗</a><span style={{color:T.border}}>·</span><span style={{color:T.w4,fontSize:10}}>{c.niche}</span><span style={{fontSize:8,padding:"2px 6px",borderRadius:3,fontWeight:600,background:T.aD,color:T.a,fontFamily:mono}}>{c.plan}</span></div></div></div>
            <button onClick={()=>{setView("overview");setSel(null);}} style={{padding:"7px 14px",borderRadius:5,border:`1px solid ${T.border}`,background:"transparent",color:T.w4,fontSize:11,cursor:"pointer",fontFamily:font}}>← Back</button>
          </div>
          <div style={{padding:"0 24px"}}><Tab tabs={["analytics","content","leads","competitors","details"]} active={cTab} onChange={setCTab}/></div>
          <div style={{padding:24}}>
            {cTab==="analytics"&&(<><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(165px,1fr))",gap:8,marginBottom:16}}>
              <Stat label="Followers" value={fmt(c.followers)} change={c.followers?(c.followersChange/c.followers)*100:0} icon="👥" sub={`+${fmt(c.followersChange)}`}/><Stat label="Views 7d" value={fmt(c.views7d||0)} change={12.4} icon="👁"/><Stat label="Views 30d" value={fmt(c.views30d||0)} change={8.2} icon="📊"/><Stat label="Views 90d" value={fmt(c.views90d||0)} change={15.6} icon="📈"/><Stat label="Likes 7d" value={fmt(c.likes7d||0)} change={6.2} icon="❤️"/><Stat label="Comments 7d" value={fmt(c.comments7d||0)} change={4.8} icon="💬"/><Stat label="Shares 7d" value={fmt(c.shares7d||0)} change={9.1} icon="🔄"/><Stat label="Saves 7d" value={fmt(c.saves7d||0)} change={15.2} icon="🔖"/><Stat label="Engagement" value={c.engagement+"%"} change={.8} icon="⚡"/><Stat label="Reach Rate" value={(c.reachRate||0)+"%"} change={3.2} icon="🌍"/><Stat label="Leads 30d" value={c.leads30d||0} change={22.1} icon="🎯"/><Stat label="Conversions" value={c.conversions||0} change={14.6} icon="💰"/>
            </div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><div style={{background:T.bg1,border:`1px solid ${T.border}`,borderRadius:8,padding:16}}><h3 style={{color:T.w,margin:"0 0 12px",fontSize:11,fontWeight:600}}>Daily Views</h3><Bar data={c.dailyViews||[0,0,0,0,0,0,0]} labels={DAYS}/></div><div style={{background:T.bg1,border:`1px solid ${T.border}`,borderRadius:8,padding:16}}><h3 style={{color:T.w,margin:"0 0 12px",fontSize:11,fontWeight:600}}>Follower Growth</h3><Bar data={(c.dailyFollowers||[0,0,0,0,0,0,0]).map((v,i,a)=>i===0?0:v-a[i-1])} labels={DAYS} color={T.g}/></div></div></>)}
            {cTab==="content"&&(<div style={{background:T.bg1,border:`1px solid ${T.border}`,borderRadius:8,padding:16}}><h3 style={{color:T.w,margin:"0 0 14px",fontSize:11,fontWeight:600}}>Top Posts</h3>{(!c.topPosts?.length)&&<p style={{color:T.w5,fontSize:11}}>No posts tracked.</p>}{(c.topPosts||[]).map((p,i)=>(<div key={i} style={{display:"grid",gridTemplateColumns:"auto 2fr 1fr 1fr 1fr",padding:"10px 0",borderBottom:i<c.topPosts.length-1?`1px solid ${T.border}`:"none",alignItems:"center",gap:12}}><span style={{color:T.a,fontSize:10,fontFamily:mono,width:18}}>#{i+1}</span><div><div style={{color:T.w,fontSize:11,fontWeight:500}}>{p.caption}</div><div style={{color:T.w5,fontSize:8,marginTop:1}}>{p.date}</div></div>{[{v:p.views,l:"views"},{v:p.likes,l:"likes"},{v:p.comments,l:"cmts"}].map(x=>(<div key={x.l} style={{textAlign:"center"}}><div style={{color:T.w,fontSize:12,fontWeight:600,fontFamily:mono}}>{fmt(x.v)}</div><div style={{color:T.w5,fontSize:7}}>{x.l}</div></div>))}</div>))}</div>)}
            {cTab==="leads"&&(<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><div style={{background:T.bg1,border:`1px solid ${T.border}`,borderRadius:8,padding:16}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><h3 style={{color:T.w,margin:0,fontSize:11,fontWeight:600}}>Lead Sources (30d)</h3><button onClick={()=>setLeadModal(true)} style={{padding:"4px 10px",borderRadius:4,border:`1px solid ${T.border}`,background:"transparent",color:T.a,fontSize:10,cursor:"pointer",fontFamily:font}}>+ Add</button></div>{(!c.leadSources?.length)&&<p style={{color:T.w5,fontSize:11}}>No lead data. Click + Add.</p>}{(c.leadSources||[]).map((ls,i)=><LeadBar key={ls.source} source={ls.source} count={ls.count} pct={ls.pct} color={LEAD_COLORS[i%LEAD_COLORS.length]}/>)}</div><div style={{background:T.bg1,border:`1px solid ${T.border}`,borderRadius:8,padding:16}}><h3 style={{color:T.w,margin:"0 0 14px",fontSize:11,fontWeight:600}}>Lead Summary</h3>{[{l:"Leads (7d)",v:c.leads7d||0},{l:"Leads (30d)",v:c.leads30d||0},{l:"Conversions",v:c.conversions||0},{l:"Conv. Rate",v:c.leads30d?(c.conversions/c.leads30d*100).toFixed(1)+"%":"0%"}].map(r=>(<div key={r.l} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${T.border}`}}><span style={{color:T.w3,fontSize:11}}>{r.l}</span><span style={{color:T.w,fontSize:11,fontWeight:600,fontFamily:mono}}>{r.v}</span></div>))}</div></div>)}
            {cTab==="competitors"&&(<div style={{background:T.bg1,border:`1px solid ${T.border}`,borderRadius:8,overflow:"hidden"}}><div style={{padding:"14px 18px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}><h3 style={{color:T.w,margin:0,fontSize:11,fontWeight:600}}>Competitors — {c.niche}</h3><div style={{display:"flex",gap:6}}><button onClick={()=>setAiModal(true)} style={{padding:"4px 10px",borderRadius:4,border:`1px solid ${T.p}33`,background:T.p+"12",color:T.p,fontSize:10,cursor:"pointer",fontFamily:font}}>✨ AI Analyze</button><button onClick={()=>setCompModal(true)} style={{padding:"4px 10px",borderRadius:4,border:`1px solid ${T.border}`,background:"transparent",color:T.a,fontSize:10,cursor:"pointer",fontFamily:font}}>+ Manual</button></div></div><div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",padding:"7px 16px",borderBottom:`1px solid ${T.border}`}}>{["Account","Followers","Eng.","Views 30d"].map(h=><span key={h} style={{fontSize:8,color:T.w5,textTransform:"uppercase",letterSpacing:".08em",fontFamily:mono}}>{h}</span>)}</div><div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",padding:"10px 16px",borderBottom:`1px solid ${T.border}`,background:T.aD}}><div><div style={{fontWeight:600,color:T.a,fontSize:11}}>{c.name}</div><div style={{color:T.w5,fontSize:9,fontFamily:mono}}>{c.handle}</div></div><span style={{color:T.w,fontFamily:mono,fontSize:11}}>{fmt(c.followers)}</span><span style={{color:T.g,fontFamily:mono,fontSize:11}}>{c.engagement}%</span><span style={{color:T.w,fontFamily:mono,fontSize:11}}>{fmt(c.views30d||0)}</span></div>{(!c.competitors?.length)&&<div style={{padding:14,textAlign:"center",color:T.w5,fontSize:10}}>None tracked. Use AI Analyze or Manual.</div>}{(c.competitors||[]).map((comp,i)=><CompRow key={i} c={comp}/>)}</div>)}
            {cTab==="details"&&(<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><div style={{background:T.bg1,border:`1px solid ${T.border}`,borderRadius:8,padding:16}}><h3 style={{color:T.w,margin:"0 0 14px",fontSize:11,fontWeight:600}}>Client Info</h3>{[{l:"Name",v:c.name},{l:"Instagram",v:c.handle},{l:"IG Link",v:c.igLink||"—"},{l:"Niche",v:c.niche},{l:"Email",v:c.email||"—"},{l:"Plan",v:c.plan},{l:"Budget",v:"$"+(c.monthlyBudget||0).toLocaleString()},{l:"Contract",v:c.contractEnd||"—"}].map(r=>(<div key={r.l} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${T.border}`}}><span style={{color:T.w3,fontSize:11}}>{r.l}</span><span style={{color:T.w,fontSize:11,fontWeight:500,fontFamily:mono,maxWidth:180,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.v}</span></div>))}</div><div style={{background:T.bg1,border:`1px solid ${T.border}`,borderRadius:8,padding:16}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><h3 style={{color:T.w,margin:0,fontSize:11,fontWeight:600}}>Notes</h3><button onClick={()=>editing?saveNotes():setEditing(true)} style={{padding:"3px 8px",borderRadius:4,border:`1px solid ${T.border}`,background:"transparent",color:editing?T.g:T.w4,fontSize:9,cursor:"pointer",fontFamily:mono}}>{editing?"Save":"Edit"}</button></div>{editing?<textarea value={notes[c.id]??c.notes??""} onChange={e=>setNotes(p=>({...p,[c.id]:e.target.value}))} style={{width:"100%",minHeight:180,padding:10,borderRadius:5,border:`1px solid ${T.border}`,background:T.bg,color:T.w,fontSize:11,lineHeight:1.7,outline:"none",resize:"vertical",fontFamily:font,boxSizing:"border-box"}}/>:<p style={{color:T.w3,fontSize:11,lineHeight:1.8,margin:0}}>{notes[c.id]??c.notes??"No notes. Click Edit."}</p>}</div></div>)}
          </div>
        </div>)}
      </main>

      {addModal&&<Modal onClose={()=>setAddModal(false)}><h3 style={{color:T.w,margin:"0 0 18px",fontSize:15,fontWeight:700}}>Add Client</h3><Inp label="Client Name *" value={newC.name} onChange={e=>setNewC(p=>({...p,name:e.target.value}))} placeholder="Brand name"/><Inp label="Instagram Handle *" value={newC.handle} onChange={e=>setNewC(p=>({...p,handle:e.target.value}))} placeholder="@brand"/><Inp label="Instagram Profile URL" value={newC.igLink} onChange={e=>setNewC(p=>({...p,igLink:e.target.value}))} placeholder="https://instagram.com/brand"/><Inp label="Niche" value={newC.niche} onChange={e=>setNewC(p=>({...p,niche:e.target.value}))} placeholder="Fashion, Fitness..."/><div style={{borderTop:`1px solid ${T.border}`,margin:"8px 0 4px",paddingTop:12}}><p style={{fontSize:10,color:T.a,marginBottom:8,fontFamily:mono}}>CLIENT LOGIN CREDENTIALS</p></div><Inp label="Client Email" value={newC.email} onChange={e=>setNewC(p=>({...p,email:e.target.value}))} placeholder="client@brand.com"/><Inp label="Client Password" value={newC.password} onChange={e=>setNewC(p=>({...p,password:e.target.value}))} type="password" placeholder="Password for client"/><div style={{display:"flex",gap:8,marginTop:4}}><Btn onClick={()=>setAddModal(false)}>Cancel</Btn><Btn onClick={addClient} primary disabled={saving}>{saving?"Adding...":"Add Client"}</Btn></div></Modal>}

      {compModal&&<Modal onClose={()=>setCompModal(false)}><h3 style={{color:T.w,margin:"0 0 18px",fontSize:15,fontWeight:700}}>Add Competitor</h3>{[{k:"name",l:"Name",p:"Brand"},{k:"handle",l:"Handle",p:"@brand"},{k:"followers",l:"Followers",p:"150000"},{k:"engagement",l:"Engagement %",p:"4.5"},{k:"views30d",l:"Views (30d)",p:"3000000"}].map(f=><Inp key={f.k} label={f.l} value={newComp[f.k]} onChange={e=>setNewComp(p=>({...p,[f.k]:e.target.value}))} placeholder={f.p}/>)}<div style={{display:"flex",gap:8,marginTop:4}}><Btn onClick={()=>setCompModal(false)}>Cancel</Btn><Btn onClick={addCompetitor} primary>Add</Btn></div></Modal>}

      {aiModal&&<Modal onClose={()=>{setAiModal(false);setAiResult(null);setAiLink("");}}><h3 style={{color:T.w,margin:"0 0 4px",fontSize:15,fontWeight:700}}>✨ AI Competitor Analysis</h3><p style={{color:T.w5,fontSize:11,marginBottom:16}}>Paste an Instagram link or handle — AI will estimate their stats.</p><Inp label="Instagram Link or Handle" value={aiLink} onChange={e=>setAiLink(e.target.value)} placeholder="https://instagram.com/competitor or @competitor" onKeyDown={e=>e.key==="Enter"&&analyzeCompetitor()}/><Btn onClick={analyzeCompetitor} primary disabled={aiLoading}>{aiLoading?"🔍 Analyzing...":"Analyze"}</Btn>{aiResult&&!aiResult.error&&(<div style={{marginTop:16,padding:16,background:T.bg,borderRadius:8,border:`1px solid ${T.border}`}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><div><div style={{color:T.w,fontSize:14,fontWeight:700}}>{aiResult.name}</div><div style={{color:T.a,fontSize:11,fontFamily:mono}}>{aiResult.handle}</div></div><span style={{fontSize:9,padding:"2px 8px",borderRadius:4,background:T.p+"18",color:T.p,fontFamily:mono}}>{aiResult.niche}</span></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>{[{l:"Followers",v:fmt(aiResult.followers)},{l:"Engagement",v:aiResult.engagement+"%"},{l:"Views/mo",v:fmt(aiResult.views30d)}].map(s=>(<div key={s.l} style={{background:T.bg1,padding:"8px 10px",borderRadius:6,textAlign:"center"}}><div style={{color:T.w,fontSize:14,fontWeight:700,fontFamily:mono}}>{s.v}</div><div style={{color:T.w5,fontSize:8,marginTop:2}}>{s.l}</div></div>))}</div><p style={{color:T.w3,fontSize:11,lineHeight:1.6,marginBottom:12}}>{aiResult.analysis}</p>{aiResult.top_videos?.length>0&&(<div><p style={{color:T.w5,fontSize:9,fontFamily:mono,textTransform:"uppercase",letterSpacing:".1em",marginBottom:6}}>Top Content</p>{aiResult.top_videos.map((v,i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${T.border}`}}><span style={{color:T.w3,fontSize:11,maxWidth:"60%",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v.caption}</span><span style={{color:T.w,fontSize:11,fontFamily:mono}}>{fmt(v.views)} views</span></div>))}</div>)}<div style={{marginTop:12}}><Btn onClick={addAiCompetitor} primary>Add as Competitor</Btn></div></div>)}{aiResult?.error&&<div style={{marginTop:12,color:T.r,fontSize:12,padding:"10px 12px",background:T.rD,borderRadius:6}}>{aiResult.error}</div>}</Modal>}

      {leadModal&&<Modal onClose={()=>setLeadModal(false)}><h3 style={{color:T.w,margin:"0 0 18px",fontSize:15,fontWeight:700}}>Add Lead Source</h3><div style={{marginBottom:12}}><label style={{fontSize:10,color:T.w4,textTransform:"uppercase",letterSpacing:".12em",marginBottom:4,display:"block",fontFamily:mono}}>Source</label><select value={newLead.source} onChange={e=>setNewLead(p=>({...p,source:e.target.value}))} style={{width:"100%",padding:"11px 13px",borderRadius:6,border:`1px solid ${T.border}`,background:T.bg,color:T.w,fontSize:13,outline:"none",fontFamily:font,boxSizing:"border-box"}}>{LEAD_SOURCES.map(s=><option key={s} value={s}>{s}</option>)}</select></div><Inp label="Number of Leads" value={newLead.count} onChange={e=>setNewLead(p=>({...p,count:e.target.value}))} placeholder="e.g. 25"/><div style={{display:"flex",gap:8,marginTop:4}}><Btn onClick={()=>setLeadModal(false)}>Cancel</Btn><Btn onClick={addLeadSource} primary>Add</Btn></div></Modal>}
    </div>
  );
};

// ─── APP ─────────────────────────────────────────────────────────────────────
export default function CCAccelerator(){
  const [user,setUser]=useState(null);const [clients,setClients]=useState([]);const [loaded,setLoaded]=useState(false);
  const loadClients=async()=>{const all=(await db.get("clients"))||[];setClients(all);return all;};
  useEffect(()=>{(async()=>{const session=loadSession();if(session)setUser(session);await loadClients();setLoaded(true);})();},[]);
  if(!loaded) return <div style={{minHeight:"100vh",background:"#000",display:"flex",alignItems:"center",justifyContent:"center"}}><Logo size={48}/></div>;
  if(!user) return <AuthScreen onLogin={u=>{setUser(u);loadClients();}} refreshClients={loadClients}/>;
  if(user.role==="client"){const client=clients.find(c=>c.id===user.clientId);return <ClientView client={client} onLogout={()=>setUser(null)}/>;}
  return <AgencyDash onLogout={()=>setUser(null)} userName={user.name} clients={clients} refreshClients={loadClients}/>;
}
