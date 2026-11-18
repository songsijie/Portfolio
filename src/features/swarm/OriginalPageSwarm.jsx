import React, { useEffect, useState } from 'react';
import { SwarmEngine } from './animation/SwarmEngine.js';
import { SceneBuilder } from './scene/scene-builder.js';
import { CursorLayer } from './components/Cursor.jsx';
import { ConstructionOverlay } from './components/ConstructionOverlay.jsx';
import './styles/cursors.css';
import './styles/overlays.css';
import './styles/original-page.css';

// Animate the actual page nodes. Their content, layout and event handlers stay intact.
const TARGETS = [
  '#home p', '#home h1', '#home a', '#home [data-logo-arrival]', '#home canvas',
  '#blogs h2', '#blogs h3', '#blogs a', '#blogs .text-center',
  '#contact h2', '#contact h3', '#contact p', '#contact .flex.items-center',
  '#contact form', 'footer > div',
].join(',');

export default function OriginalPageSwarm() {
  const [run, setRun] = useState(0);
  const [enabled, setEnabled] = useState(true);
  const [engine, setEngine] = useState(null);
  const [, render] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let disposed = false, frame, timer;
    let records = [];
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const restore = () => records.forEach(({node,clip,inert}) => {
      node.style.clipPath = clip;
      node.inert = inert;
    });
    const stop = () => { disposed = true; cancelAnimationFrame(frame); restore(); setEngine(null); };
    const resize = () => { stop(); setEnabled(false); window.dispatchEvent(new Event('portfolio-motion-skip')); };
    const preference = () => { if(motion.matches) resize(); };
    if (motion.matches) {setEnabled(false); return;}
    const fonts = document.fonts?.ready ?? Promise.resolve();
    Promise.race([fonts,new Promise(resolve=>{timer=setTimeout(resolve,1800);})]).then(() => {
      if(disposed) return;
      clearTimeout(timer);
      const candidates = [...document.querySelectorAll(TARGETS)];
      const nodes = candidates.filter(node=>!candidates.some(parent=>parent!==node && parent.contains(node)));
      const builder = new SceneBuilder();
      records = nodes.map((node,i)=>{
        const bounds = node.getBoundingClientRect();
        if(bounds.width<1 || bounds.height<1) return null;
        const id='original-'+i;
        const css=getComputedStyle(node);
        builder.rect(id,bounds.left+window.scrollX,bounds.top+window.scrollY,bounds.width,bounds.height,{r:parseFloat(css.borderRadius)||0,fill:css.backgroundColor,stroke:'#a476ff'});
        if(node.matches('[data-logo-arrival], canvas')) builder.byId.get(id).arrivalDuration = 2.5;
        return {node,id,arrival:node.matches('[data-logo-arrival], canvas'),entered:false,section:node.closest('section, footer'),clip:node.style.clipPath,inert:node.inert};
      }).filter(Boolean);
      // Independent regions draw together; only items within a lane wait.
      const previousByLane = new Map();
      let homeParagraph = 0, blogCard = 0;
      records.forEach(({id,section,node}) => {
        let lane = section;
        if (section?.id === 'home') {
          if (node.matches('p')) lane = homeParagraph++ === 0 ? 'home-title' : 'home-description';
          else if (node.matches('h1, a')) lane = 'home-title';
          else lane = node; // Each logo strip and the character canvas can start independently.
        } else if (section?.id === 'blogs') {
          if (node.matches('a.group')) lane = 'blog-column-' + (blogCard++ % 3);
          else lane = node.matches('h2, h3') ? 'blog-heading' : 'blog-links';
        } else if (section?.id === 'contact') {
          lane = node.matches('form') ? 'contact-form'
            : node.matches('h2, h3') ? 'contact-heading' : 'contact-details';
        }
        const task = builder.tasks.find(task => task.id === 'r:'+id);
        const previous = previousByLane.get(lane);
        if (previous) {
          task.deps = [previous];
          task.delayAfterDeps = 0.13; // About 0.1s at 1.3x playback.
        }
        previousByLane.set(lane, task.id);
      });
      const instance = new SwarmEngine({sceneFactory:()=>({els:builder.elements,tasks:builder.tasks,groups:[],width:document.documentElement.clientWidth,height:document.documentElement.scrollHeight})});
      instance.vp={scrollY:window.scrollY,vh:innerHeight,vw:document.documentElement.clientWidth,s:1,left:0};
      records.forEach(({node,arrival})=>{if(!arrival){node.style.clipPath='inset(0 100% 100% 0)';node.inert=true;}});
      instance.start(); instance.setScroll(window.scrollY);
      setEngine(instance);
      let previous=performance.now();
      function tick(now){
        if(disposed)return;
        instance.vp.vh=innerHeight;
        instance.setScroll(window.scrollY);
        // Split 1.3x playback into bounded steps to respect the engine delta cap.
        const delta = Math.min((now-previous)/1000, 0.05);
        instance.step(delta);
        instance.step(delta * 0.3);
        previous=now;
        records.forEach(record=>{
          const {node,id,clip,inert,arrival}=record;
          const task=instance.byTask.get('r:'+id),el=instance.els.get(id);
          if(arrival){
            if(task.state==='active' && el.vis && !record.entered){
              record.entered=true;
              node.dispatchEvent(new Event('portfolio-region-enter'));
            }
            return;
          }
          if(task.state==='done'){node.style.clipPath=clip;node.inert=inert;}
          else if(el.draw){
            const w=Math.min(1,Math.abs(el.draw.w)/el.w),h=Math.min(1,Math.abs(el.draw.h)/el.h);
            node.style.clipPath=`inset(0 ${100-w*100}% ${100-h*100}% 0)`;
          }
        });
        render(v=>v+1);
        frame=requestAnimationFrame(tick);
      }
      frame=requestAnimationFrame(tick);
    });
    window.addEventListener('resize',resize);
    motion.addEventListener('change',preference);
    return ()=>{stop();clearTimeout(timer);window.removeEventListener('resize',resize);motion.removeEventListener('change',preference);};
  },[run,enabled]);
  return <>
    {engine && <div className="swarm-experience original-page-swarm" aria-hidden="true" style={{height:engine.height}}><ConstructionOverlay engine={engine}/><CursorLayer engine={engine} activeOnly/></div>}
    <div className="original-swarm-controls" aria-label="鼠标绘制动画">
      <button onClick={()=>{window.scrollTo({top:0,behavior:'instant'});window.dispatchEvent(new Event('portfolio-motion-replay'));setRun(v=>v+1);setEnabled(true);}}>↻ 重播绘制</button>
      {enabled && <button onClick={()=>{setEnabled(false);window.dispatchEvent(new Event('portfolio-motion-skip'));}}>跳过动画</button>}
    </div>
  </>;
}
