import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  template: `
    <div class="landing-page" (pointermove)="onPointerMove($event)" (pointerleave)="resetPointer()">
      <nav class="landing-nav" [class.scrolled]="navScrolled">
        <a class="brand" href="#" aria-label="Pusula Vault home">
          <span class="brand-mark" aria-hidden="true"><span></span></span>
          <span>Pusula <strong>Vault</strong></span>
        </a>
        <div class="nav-links" aria-label="Landing page sections">
          <a href="#capabilities">Capabilities</a>
          <a href="#security">Security</a>
          <a href="#workflow">How it works</a>
        </div>
        <div class="nav-actions">
          <button class="text-button" type="button" (click)="goToLogin()">Sign in</button>
          <button class="nav-cta magnetic" type="button" (pointermove)="onMagneticMove($event)" (pointerleave)="resetMagnetic($event)" (click)="goToLogin()">
            Open your vault <span aria-hidden="true">↗</span>
          </button>
        </div>
      </nav>

      <main>
        <section class="hero" aria-labelledby="hero-title">
          <div class="hero-grid" aria-hidden="true"></div>
          <div class="hero-glow hero-glow-one" aria-hidden="true"></div>
          <div class="hero-glow hero-glow-two" aria-hidden="true"></div>
          <div class="pointer-glow" aria-hidden="true"></div>

          <div class="hero-content">
            <div class="eyebrow reveal reveal-delay-1"><span class="eyebrow-dot"></span> Secure knowledge, built for what is next</div>
            <h1 id="hero-title" class="reveal reveal-delay-2">Your company’s<br><em>trusted memory.</em></h1>
            <p class="hero-copy reveal reveal-delay-3">
              Pusula Vault brings documents, files, people, and intelligent answers together in one secure knowledge workspace.
            </p>
            <div class="hero-actions reveal reveal-delay-4">
              <button class="primary-button magnetic" type="button" (pointermove)="onMagneticMove($event)" (pointerleave)="resetMagnetic($event)" (click)="goToLogin()">
                Enter Pusula Vault <span class="button-arrow" aria-hidden="true">→</span>
              </button>
              <a class="play-link" href="#workflow"><span class="play-icon" aria-hidden="true">▶</span> See how it works</a>
            </div>
            <div class="hero-proof reveal reveal-delay-5">
              <div class="avatar-stack" aria-hidden="true"><span>AK</span><span>RM</span><span>JL</span><span>+8</span></div>
              <div><strong>Built for teams that move with intent.</strong><small>Secure by default · Ready to scale</small></div>
            </div>
          </div>

          <div class="hero-visual reveal reveal-delay-3" aria-label="Pusula Vault workspace preview">
            <div class="visual-orbit orbit-one" aria-hidden="true"></div>
            <div class="visual-orbit orbit-two" aria-hidden="true"></div>
            <div class="vault-preview">
              <div class="preview-topbar"><span class="mini-logo">✦</span><span>pusula / vault</span><span class="preview-status"><i></i> Protected</span></div>
              <div class="preview-body">
                <aside class="preview-sidebar" aria-hidden="true"><span class="sidebar-line active"></span><span class="sidebar-line"></span><span class="sidebar-line short"></span><span class="sidebar-separator"></span><span class="sidebar-line"></span><span class="sidebar-line short"></span></aside>
                <div class="preview-main">
                  <div class="preview-heading"><div><small>OVERVIEW</small><h3>Good morning, Aisha</h3></div><span class="preview-avatar">AK</span></div>
                  <div class="preview-metrics"><span><small>WORKSPACES</small><b>12</b><i>+18%</i></span><span><small>DOCUMENTS</small><b>2,481</b><i>+24%</i></span><span><small>ACTIVE USERS</small><b>186</b><i>+9%</i></span></div>
                  <div class="preview-panels"><div class="preview-panel chart-panel"><small>KNOWLEDGE ACTIVITY</small><div class="chart"><span style="height:32%"></span><span style="height:46%"></span><span style="height:40%"></span><span style="height:62%"></span><span style="height:55%"></span><span style="height:78%"></span><span style="height:68%"></span><span style="height:91%"></span></div></div><div class="preview-panel"><small>RECENT FILES</small><p>Q4 Strategy brief <b>PDF</b></p><p>Onboarding handbook <b>DOC</b></p><p>Research archive <b>XLS</b></p></div></div>
                </div>
              </div>
            </div>
            <div class="floating-card ai-card"><span class="floating-icon">✦</span><div><small>VAULT AI</small><strong>Answer grounded in 14 sources</strong></div><span class="confidence">98%</span></div>
            <div class="floating-card lock-card"><span>⌁</span><div><small>ACCESS CONTROL</small><strong>Zero-trust permissions active</strong></div></div>
          </div>
        </section>

        <section class="trust-strip reveal" aria-label="Pusula Vault capabilities">
          <span>One secure place for your most important work</span>
          <div><span>DOCUMENTS</span><span>FILES</span><span>INSIGHTS</span><span>GOVERNANCE</span></div>
        </section>

        <section id="capabilities" class="section capabilities reveal">
          <div class="section-heading"><div><span class="section-kicker">THE VAULT ADVANTAGE</span><h2>Clarity for complex work.</h2></div><p>Every piece of knowledge has a place, a context, and the right level of protection.</p></div>
          <div class="capability-grid">
            <article class="capability-card featured"><span class="card-number">01</span><div class="capability-icon purple">✦</div><h3>Find the signal.</h3><p>Search across documents, files, and workspaces with semantic AI that understands what your team means.</p><a href="#workflow">Explore intelligent search <span>↗</span></a></article>
            <article class="capability-card"><span class="card-number">02</span><div class="capability-icon blue">⌁</div><h3>Protect what matters.</h3><p>Granular permissions, encryption, and an immutable audit trail keep sensitive knowledge in the right hands.</p><a href="#security">Explore governance <span>↗</span></a></article>
            <article class="capability-card"><span class="card-number">03</span><div class="capability-icon cyan">◎</div><h3>Move with context.</h3><p>Give every project a living source of truth, from the first draft to the final decision.</p><a href="#workflow">Explore workspaces <span>↗</span></a></article>
          </div>
        </section>

        <section id="security" class="section security-section reveal">
          <div class="security-copy"><span class="section-kicker">SECURITY WITHOUT FRICTION</span><h2>Trust is not a feature.<br><em>It is the foundation.</em></h2><p>Pusula Vault is designed for organizations where knowledge is a competitive advantage and control cannot be an afterthought.</p><button class="outline-button" type="button" (click)="goToLogin()">Explore the secure workspace <span>→</span></button></div>
          <div class="security-list"><div><span>01</span><strong>Defense in depth</strong><p>Encryption, device approval, and role-based access at every layer.</p></div><div><span>02</span><strong>Audit-ready by design</strong><p>Know who accessed what, when, and why with a complete activity history.</p></div><div><span>03</span><strong>AI you can trust</strong><p>Grounded answers with citations from the knowledge your teams already own.</p></div></div>
        </section>

        <section id="workflow" class="section workflow-section reveal">
          <div class="section-heading centered"><span class="section-kicker">A BETTER WAY TO WORK</span><h2>From scattered files to shared momentum.</h2><p>One connected flow for the work behind every great decision.</p></div>
          <div class="workflow-steps"><div><span>01</span><h3>Capture</h3><p>Bring your documents and files into structured, searchable workspaces.</p></div><div><span>02</span><h3>Connect</h3><p>Give teams the context and permissions they need to collaborate.</p></div><div><span>03</span><h3>Decide</h3><p>Use intelligent answers and clear insights to move forward with confidence.</p></div></div>
        </section>

        <section class="final-cta reveal"><div><span class="section-kicker">READY WHEN YOU ARE</span><h2>Make your knowledge<br><em>work harder.</em></h2></div><button class="primary-button magnetic" type="button" (pointermove)="onMagneticMove($event)" (pointerleave)="resetMagnetic($event)" (click)="goToLogin()">Enter Pusula Vault <span class="button-arrow" aria-hidden="true">→</span></button></section>
      </main>

      <footer><a class="brand" href="#"><span class="brand-mark" aria-hidden="true"><span></span></span><span>Pusula <strong>Vault</strong></span></a><span>Secure knowledge management for what is next.</span><span>© 2024 Pusula Vault</span></footer>
    </div>
  `,
  styles: [`
    :host { display:block; --navy:#070d1a; --navy-2:#0b1426; --card:#101d33; --blue:#4169ff; --blue-bright:#6685ff; --cyan:#4dd9ff; --text:#f5f8ff; --muted:#91a4c2; background:var(--navy); color:var(--text); }
    .landing-page { min-height:100vh; overflow:hidden; background:radial-gradient(circle at 76% 10%,rgba(65,105,255,.16),transparent 30%),var(--navy); }
    .landing-nav { height:76px; max-width:1320px; margin:auto; padding:0 34px; display:flex; align-items:center; justify-content:space-between; position:sticky; top:0; z-index:10; transition:background .3s,box-shadow .3s,border-color .3s; border-bottom:1px solid transparent; }
    .landing-nav.scrolled { background:rgba(7,13,26,.78); backdrop-filter:blur(18px); border-color:rgba(100,133,255,.14); box-shadow:0 12px 35px rgba(0,0,0,.18); }
    .brand { display:flex; align-items:center; gap:10px; color:var(--text); text-decoration:none; font-size:17px; font-weight:600; letter-spacing:-.03em; white-space:nowrap; }
    .brand strong { font-weight:400;color:var(--muted); }.brand-mark { width:29px;height:29px;border:1px solid var(--blue-bright);border-radius:9px;display:grid;place-items:center;transform:rotate(45deg);background:linear-gradient(135deg,rgba(102,133,255,.38),rgba(77,217,255,.05));box-shadow:0 0 22px rgba(65,105,255,.24); }.brand-mark span { width:10px;height:10px;border:2px solid #dce2ff;border-radius:50%;display:block; }
    .nav-links { display:flex;gap:34px;margin-left:90px; }.nav-links a,.text-button { color:var(--muted);text-decoration:none;font:500 13px inherit;transition:color .2s; }.nav-links a:hover,.text-button:hover { color:var(--text); }.nav-actions { display:flex;align-items:center;gap:22px; }.text-button { border:0;background:none;cursor:pointer; }.nav-cta,.primary-button { border:1px solid rgba(157,185,255,.55);border-radius:9px;background:linear-gradient(135deg,var(--blue-bright),var(--blue));color:#fff;padding:11px 17px;font:600 13px inherit;cursor:pointer;box-shadow:0 8px 28px rgba(65,105,255,.24);transition:transform .18s,box-shadow .18s; }.nav-cta:hover,.primary-button:hover { box-shadow:0 14px 36px rgba(65,105,255,.4); }.nav-cta:focus-visible,.primary-button:focus-visible,.text-button:focus-visible,.outline-button:focus-visible,.play-link:focus-visible,.nav-links a:focus-visible,.brand:focus-visible { outline:2px solid var(--cyan);outline-offset:4px; }.button-arrow { display:inline-block;margin-left:12px;transition:transform .2s; }.primary-button:hover .button-arrow,.nav-cta:hover span { transform:translateX(4px); }
    .hero { max-width:1320px;min-height:700px;margin:auto;padding:72px 34px 110px;display:grid;grid-template-columns:48% 52%;align-items:center;position:relative;isolation:isolate; }.hero-grid { position:absolute;inset:0;background-image:linear-gradient(rgba(113,136,175,.065) 1px,transparent 1px),linear-gradient(90deg,rgba(113,136,175,.065) 1px,transparent 1px);background-size:55px 55px;mask-image:linear-gradient(90deg,#000,transparent 92%);pointer-events:none;z-index:-2; }.hero-glow,.pointer-glow { position:absolute;border-radius:50%;filter:blur(54px);pointer-events:none;z-index:-1; }.hero-glow-one { width:410px;height:410px;right:12%;top:15px;background:rgba(65,105,255,.17); }.hero-glow-two { width:260px;height:260px;left:2%;bottom:10px;background:rgba(77,217,255,.08); }.pointer-glow { width:340px;height:340px;left:calc(var(--pointer-x,50%) - 170px);top:calc(var(--pointer-y,50%) - 170px);background:radial-gradient(circle,rgba(77,217,255,.13),transparent 68%);filter:blur(14px);opacity:.9; }.hero-content { position:relative;z-index:1; }.eyebrow,.section-kicker { font-size:11px;font-weight:700;letter-spacing:.17em;color:var(--blue-bright); }.eyebrow { display:flex;align-items:center;gap:9px;margin-bottom:23px; }.eyebrow-dot { width:7px;height:7px;border-radius:50%;background:var(--cyan);box-shadow:0 0 14px var(--cyan); }.hero h1 { font:600 clamp(48px,5.3vw,76px)/.98 inherit;letter-spacing:-.065em;margin:0 0 25px;max-width:650px; }.hero h1 em,.security-copy h2 em,.final-cta h2 em { font-family:Georgia,serif;font-weight:400;color:#9aaeff; }.hero-copy { max-width:460px;color:var(--muted);font-size:17px;line-height:1.7;margin:0 0 31px; }.hero-actions { display:flex;align-items:center;gap:25px; }.primary-button { padding:15px 21px; }.play-link { color:#d2d8e4;text-decoration:none;font-size:13px; }.play-icon { display:inline-grid;place-items:center;width:26px;height:26px;border:1px solid #6472bc;border-radius:50%;font-size:8px;margin-right:8px;color:#aab5ff; }.hero-proof { display:flex;align-items:center;gap:13px;margin-top:55px;color:#b8c2d2;font-size:11px; }.hero-proof strong,.hero-proof small { display:block; }.hero-proof small { color:#718198;margin-top:4px; }.avatar-stack { display:flex; }.avatar-stack span { width:28px;height:28px;display:grid;place-items:center;border:2px solid var(--navy);border-radius:50%;margin-left:-7px;background:#3d4d86;color:#dfe4ff;font-size:8px;font-weight:700; }.avatar-stack span:first-child { margin-left:0;background:#e1a875; }.avatar-stack span:nth-child(2) { background:#6788aa; }.avatar-stack span:nth-child(3) { background:#8f6e9a; }.avatar-stack span:last-child { background:#17263a;color:#91a0ff; }
    .hero-visual { height:480px;position:relative;display:grid;place-items:center;transform:translate3d(calc(var(--parallax-x,0) * 1px),calc(var(--parallax-y,0) * 1px),0);transition:transform .16s ease-out; }.vault-preview { width:540px;height:340px;border:1px solid rgba(147,177,255,.38);border-radius:15px;background:linear-gradient(145deg,rgba(22,36,62,.96),rgba(10,20,35,.94));box-shadow:0 30px 80px rgba(0,0,0,.4),0 0 70px rgba(79,126,255,.2);transform:perspective(1000px) rotateY(-12deg) rotateX(4deg);overflow:hidden;position:relative;z-index:2; }.preview-topbar { height:38px;border-bottom:1px solid #293851;display:flex;align-items:center;gap:8px;padding:0 15px;color:#72839e;font-size:9px; }.mini-logo { color:var(--cyan);font-size:15px; }.preview-status { margin-left:auto;color:#64cfae; }.preview-status i { display:inline-block;width:5px;height:5px;border-radius:50%;background:#54cda5;margin-right:4px; }.preview-body { display:flex;height:calc(100% - 38px); }.preview-sidebar { width:64px;border-right:1px solid #25354d;padding:28px 14px; }.sidebar-line { display:block;height:6px;border-radius:4px;background:#31445f;margin-bottom:19px; }.sidebar-line.short { width:68%; }.sidebar-line.active { background:var(--blue-bright);box-shadow:0 0 11px #5365e8; }.sidebar-separator { display:block;border-top:1px solid #2a3a52;margin:29px 0; }.preview-main { flex:1;padding:25px 24px; }.preview-heading { display:flex;justify-content:space-between;align-items:center; }.preview-heading small,.preview-panel small,.preview-metrics small { font-size:7px;letter-spacing:.12em;color:#687b98; }.preview-heading h3 { font-size:17px;margin:8px 0 20px;font-weight:500; }.preview-avatar { width:25px;height:25px;border-radius:50%;display:grid;place-items:center;background:#6676e9;font-size:8px; }.preview-metrics { display:grid;grid-template-columns:repeat(3,1fr);gap:8px; }.preview-metrics span { border:1px solid #293a55;border-radius:7px;padding:10px; }.preview-metrics b { font-size:18px;display:block;margin:5px 0; }.preview-metrics i { color:#55c6a1;font-size:7px;font-style:normal; }.preview-panels { display:grid;grid-template-columns:1.2fr 1fr;gap:8px;margin-top:10px; }.preview-panel { border:1px solid #293a55;border-radius:7px;padding:11px;min-height:100px; }.chart { display:flex;align-items:end;gap:6px;height:70px;padding-top:16px; }.chart span { width:12%;border-radius:3px 3px 0 0;background:linear-gradient(var(--blue-bright),#3b477d); }.preview-panel p { font-size:8px;color:#aeb9ca;border-bottom:1px solid #26354d;padding:8px 0; }.preview-panel p b { float:right;color:var(--blue-bright);font-size:7px;font-weight:500; }.visual-orbit { position:absolute;border:1px solid rgba(112,158,255,.25);border-radius:50%;transform:rotate(-17deg); }.orbit-one { width:590px;height:270px; }.orbit-two { width:480px;height:390px;transform:rotate(30deg); }.floating-card { position:absolute;z-index:3;display:flex;align-items:center;gap:10px;background:rgba(16,29,51,.93);border:1px solid rgba(102,133,255,.42);border-radius:9px;padding:12px;box-shadow:0 15px 35px rgba(0,0,0,.35),0 0 24px rgba(65,105,255,.1);font-size:11px; }.floating-card small,.floating-card strong { display:block; }.floating-card small { color:#7586a1;font-size:7px;letter-spacing:.12em;margin-bottom:4px; }.floating-card strong { font-weight:500;color:#e0e6f2;white-space:nowrap; }.floating-icon,.lock-card>span { width:26px;height:26px;display:grid;place-items:center;border-radius:7px;color:#9eabff;background:rgba(107,121,255,.16); }.ai-card { right:-2px;top:77px; }.confidence { color:#5cd0ae;font-size:10px;margin-left:13px; }.lock-card { left:3px;bottom:73px; }.lock-card>span { color:#5bd0ba; }
    .trust-strip { border-top:1px solid rgba(77,125,190,.22);border-bottom:1px solid rgba(77,125,190,.22);display:flex;justify-content:space-between;align-items:center;padding:20px max(34px,calc((100% - 1252px)/2));color:#7890b0;font-size:11px;letter-spacing:.04em; }.trust-strip div { display:flex;gap:40px;color:#587091;font-size:10px;letter-spacing:.18em; }
    .section { max-width:1252px;margin:auto;padding:125px 0; }.section-heading { display:flex;justify-content:space-between;align-items:end;margin-bottom:48px; }.section-heading h2,.security-copy h2,.final-cta h2 { font:600 48px/.98 inherit;letter-spacing:-.055em;margin:12px 0 0; }.section-heading p { max-width:300px;color:var(--muted);font-size:14px;line-height:1.7;margin:0; }.capability-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:15px; }.capability-card { min-height:330px;padding:27px;border:1px solid rgba(92,131,195,.28);border-radius:13px;background:linear-gradient(145deg,rgba(16,29,51,.78),rgba(10,20,34,.58));transition:transform .25s,border-color .25s,box-shadow .25s; }.capability-card:hover { transform:translateY(-7px);border-color:rgba(102,133,255,.8);box-shadow:0 18px 40px rgba(0,0,0,.25),0 0 30px rgba(65,105,255,.12); }.capability-card.featured { background:linear-gradient(145deg,rgba(52,76,160,.33),rgba(16,27,49,.8));border-color:rgba(102,133,255,.68); }.card-number { float:right;color:#6c83a8;font-size:11px; }.capability-icon { width:43px;height:43px;border-radius:11px;display:grid;place-items:center;margin:42px 0 27px;font-size:20px; }.capability-icon.purple { color:#b0a2ff;background:rgba(133,110,255,.14); }.capability-icon.blue { color:#79b7ff;background:rgba(74,143,255,.14); }.capability-icon.cyan { color:var(--cyan);background:rgba(77,217,255,.12); }.capability-card h3 { font-size:22px;letter-spacing:-.04em;margin-bottom:10px; }.capability-card p { color:#8ba0bf;font-size:13px;line-height:1.7;min-height:67px; }.capability-card a { color:#a4b8ff;text-decoration:none;font-size:11px;font-weight:600; }.capability-card a span { margin-left:12px; }
    .security-section { max-width:none;padding-left:max(34px,calc((100% - 1252px)/2));padding-right:max(34px,calc((100% - 1252px)/2));display:grid;grid-template-columns:1fr 1fr;gap:150px;background:linear-gradient(90deg,rgba(23,55,100,.34),transparent); }.security-copy h2 { margin-bottom:25px; }.security-copy p { max-width:400px;color:#8da2bf;font-size:14px;line-height:1.8; }.outline-button { margin-top:28px;padding:13px 17px;border:1px solid #5d78d0;border-radius:8px;background:rgba(65,105,255,.06);color:#c1ccff;font:600 12px inherit;cursor:pointer;transition:background .2s,box-shadow .2s; }.outline-button:hover { background:rgba(65,105,255,.16);box-shadow:0 0 25px rgba(65,105,255,.18); }.security-list { border-top:1px solid #2a4264; }.security-list div { display:grid;grid-template-columns:38px 1fr;padding:24px 0;border-bottom:1px solid #2a4264; }.security-list span { color:var(--cyan);font-size:11px; }.security-list strong { font-size:15px;font-weight:600; }.security-list p { grid-column:2;color:#8ca0bc;font-size:12px;margin-top:7px; }
    .workflow-section { padding-bottom:125px; }.centered { display:block;text-align:center; }.centered p { margin:15px auto 0; }.workflow-steps { display:grid;grid-template-columns:repeat(3,1fr);position:relative; }.workflow-steps:before { content:'';position:absolute;top:20px;left:14%;right:14%;border-top:1px dashed #3b5880; }.workflow-steps div { position:relative;text-align:center; }.workflow-steps span { display:grid;place-items:center;width:40px;height:40px;border:1px solid #6685ff;border-radius:50%;background:#0b1728;color:#b2c0ff;margin:0 auto 22px;font-size:11px;box-shadow:0 0 20px rgba(65,105,255,.14); }.workflow-steps h3 { font-size:18px; }.workflow-steps p { max-width:210px;color:#8ca0bc;font-size:12px;line-height:1.6;margin:10px auto; }
    .final-cta { max-width:1252px;margin:0 auto 80px;padding:50px 57px;border:1px solid rgba(102,133,255,.45);border-radius:15px;display:flex;align-items:center;justify-content:space-between;background:radial-gradient(circle at 80% 50%,rgba(77,217,255,.14),transparent 40%),linear-gradient(100deg,#132b50,#0d1a2d);box-shadow:0 20px 55px rgba(0,0,0,.2); }.final-cta h2 { font-size:40px; }.final-cta .primary-button { margin-top:12px; } footer { border-top:1px solid rgba(77,125,190,.22);max-width:1320px;margin:auto;padding:28px 34px;display:flex;align-items:center;gap:30px;color:#7187a6;font-size:11px; } footer span:nth-child(2) { flex:1; }
    .reveal { opacity:0;transform:translateY(22px);transition:opacity .7s ease,transform .7s ease; }.reveal.is-visible { opacity:1;transform:translateY(0); }.reveal-delay-1 { transition-delay:.08s; }.reveal-delay-2 { transition-delay:.16s; }.reveal-delay-3 { transition-delay:.24s; }.reveal-delay-4 { transition-delay:.32s; }.reveal-delay-5 { transition-delay:.4s; }
    @media (max-width:900px) { .nav-links { display:none; }.hero { grid-template-columns:1fr;padding-top:50px; }.hero-visual { margin-top:50px;transform:scale(.86) translate3d(calc(var(--parallax-x,0) * 1px),calc(var(--parallax-y,0) * 1px),0);transform-origin:left center; }.section { padding:90px 34px; }.security-section { grid-template-columns:1fr;gap:50px; }.section-heading { display:block; }.section-heading p { margin-top:18px; }.final-cta { margin:0 34px 70px; }.trust-strip div { gap:14px; }.trust-strip { padding-left:34px;padding-right:34px; } }
    @media (max-width:620px) { .landing-nav { padding:0 20px; }.nav-cta { padding:9px 10px;font-size:11px; }.hero { padding:45px 20px 70px; }.hero h1 { font-size:49px; }.hero-copy { font-size:15px; }.hero-visual { height:365px;transform:scale(.58);transform-origin:top left;margin-bottom:-110px; }.vault-preview { width:540px; }.trust-strip { display:block;padding:18px 20px;line-height:1.8; }.trust-strip div { flex-wrap:wrap;margin-top:8px; }.section { padding:75px 20px; }.section-heading h2,.security-copy h2 { font-size:38px; }.capability-grid,.workflow-steps { grid-template-columns:1fr;gap:15px; }.workflow-steps:before { display:none; }.workflow-steps div { padding:13px; }.final-cta { margin:0 20px 50px;padding:28px;display:block; }.final-cta h2 { font-size:34px;margin-bottom:25px; } footer { padding:25px 20px;display:block; } footer span { display:block;margin-top:13px; }.nav-actions { gap:10px; }.text-button { display:none; } }
    @media (prefers-reduced-motion: reduce) { *,*::before,*::after { scroll-behavior:auto !important;animation-duration:.01ms !important;transition-duration:.01ms !important; }.reveal { opacity:1;transform:none; }.pointer-glow { display:none; } }
  `]
})
export class LandingComponent implements AfterViewInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly host = inject(ElementRef<HTMLElement>);
  private observer?: IntersectionObserver;
  navScrolled = false;
  private motionDisabled = false;

  ngAfterViewInit(): void {
    this.motionDisabled = window.matchMedia('(prefers-reduced-motion: reduce)').matches || window.matchMedia('(pointer: coarse)').matches;
    const revealItems = Array.from(this.host.nativeElement.querySelectorAll('.reveal')) as HTMLElement[];
    if (this.motionDisabled || !('IntersectionObserver' in window)) {
      revealItems.forEach(item => item.classList.add('is-visible'));
      return;
    }
    this.observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          this.observer?.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealItems.forEach(item => this.observer?.observe(item));
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.navScrolled = window.scrollY > 16;
  }

  onPointerMove(event: PointerEvent): void {
    if (this.motionDisabled || event.pointerType === 'touch') return;
    const page = this.host.nativeElement.querySelector('.landing-page') as HTMLElement;
    const hero = this.host.nativeElement.querySelector('.hero') as HTMLElement;
    const rect = hero.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    page.style.setProperty('--pointer-x', `${x}px`);
    page.style.setProperty('--pointer-y', `${y}px`);
    page.style.setProperty('--parallax-x', `${((x / rect.width) - .5) * 10}`);
    page.style.setProperty('--parallax-y', `${((y / rect.height) - .5) * 8}`);
  }

  resetPointer(): void {
    const page = this.host.nativeElement.querySelector('.landing-page') as HTMLElement;
    page.style.setProperty('--parallax-x', '0');
    page.style.setProperty('--parallax-y', '0');
  }

  onMagneticMove(event: PointerEvent): void {
    if (this.motionDisabled || event.pointerType === 'touch') return;
    const button = event.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();
    button.style.transform = `translate(${(event.clientX - (rect.left + rect.width / 2)) * .12}px,${(event.clientY - (rect.top + rect.height / 2)) * .18}px)`;
  }

  resetMagnetic(event: PointerEvent): void {
    (event.currentTarget as HTMLElement).style.transform = '';
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
