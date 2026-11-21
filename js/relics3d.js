/* 3D city artifact viewer: loads converted GLB data, turntable + drag + zoom */
(function () {
  'use strict';

  const DATA = [
    { id:'hohhot', city:'呼和浩特', en:'HOHHOT', relic:'嵌贝鹿形青铜镇', link:'cities/hohhot.html', color:'#b58a5a',
      desc:'以鹿为形的青铜席镇，器身嵌贝。鹿伏卧回首，既是压席的实用器，也是北方草原与中原工艺交流的实物。', meta:'青铜 · 嵌贝 · 3D 扫描简化' },
    { id:'baotou', city:'包头', en:'BAOTOU', relic:'马头鹿角金步摇', link:'cities/baotou.html', color:'#d4af6a',
      desc:'北魏鲜卑贵族的金步摇。枝杈状鹿角上悬挂摇叶，行走时轻响，是草原贵族头饰中最有动感的一类。', meta:'金 · 北魏鲜卑 · 3D 扫描简化' },
    { id:'wuhai', city:'乌海', en:'WUHAI', relic:'盘羊铜杖首', link:'cities/wuhai.html', color:'#9a7a4e',
      desc:'战国时期的盘羊铜杖首。盘羊角卷曲，铸在杖首，是北方草原青铜器常见的动物纹样。', meta:'青铜 · 战国 · 3D 扫描简化' },
    { id:'chifeng', city:'赤峰', en:'CHIFENG', relic:'红山文化 C 形玉龙', link:'cities/chifeng.html', color:'#6fae93',
      desc:'红山文化 C 形玉龙，被称为“中华第一龙”。龙身弯成 C 字，头部有鬣，玉质温润，是红山文化最具代表性的器物。', meta:'玉 · 红山文化 · 3D 扫描简化' },
    { id:'tongliao', city:'通辽', en:'TONGLIAO', relic:'陈国公主黄金面具', link:'cities/tongliao.html', color:'#d9b45e',
      desc:'辽代陈国公主墓出土的黄金面具，覆盖墓主面部。面具按人脸打造，眉眼、鼻口清晰，是契丹贵族丧葬制度的代表。', meta:'金 · 辽代 · 3D 扫描简化' },
    { id:'hulunbuir', city:'呼伦贝尔', en:'HULUNBUIR', relic:'鲜卑神兽纹金饰牌', link:'cities/hulunbuir.html', color:'#c9a15e',
      desc:'鲜卑神兽纹金饰牌。神兽盘踞在方形牌面上，纹样受到草原动物风格影响，是拓跋鲜卑金银工艺的代表。', meta:'金 · 鲜卑 · 3D 扫描简化' },
    { id:'bayannur', city:'巴彦淖尔', en:'BAYANNUR', relic:'西夏莲花形金盏托', link:'cities/bayannur.html', color:'#d4b06a',
      desc:'西夏莲花形金盏托。托盘做成莲瓣，盏置于中，金银器在佛教供养与贵族生活中都很常见。', meta:'金 · 西夏 · 3D 扫描简化' },
    { id:'ulanqab', city:'乌兰察布', en:'ULANQAB', relic:'虎衔鹰金饰牌', link:'cities/ulanqab.html', color:'#c9a15e',
      desc:'虎衔鹰金饰牌。猛虎咬住鹰颈，动物搏斗的瞬间被压进金片，是草原动物纹最具张力的一类构图。', meta:'金 · 草原动物纹 · 3D 扫描简化' },
    { id:'hinggan', city:'兴安盟', en:'HINGGAN', relic:'辽代绿釉双孔鸡冠壶', link:'cities/hinggan.html', color:'#7fa88a',
      desc:'辽代绿釉双孔鸡冠壶。壶身仿契丹人的皮囊，顶部双孔、提梁如鸡冠，是游牧生活进入陶瓷的样本。', meta:'绿釉陶 · 辽代 · 3D 扫描简化' },
    { id:'xilingol', city:'锡林郭勒', en:'XILINGOL', relic:'元上都元青花高足杯', link:'cities/xilingol.html', color:'#c9d8e2',
      desc:'元上都遗址所出元青花高足杯。青花发色浓艳，器形适合马上持握，是草原都城与景德镇窑火相遇的见证。', meta:'青花瓷 · 元代 · 3D 扫描简化' },
    { id:'alxa', city:'阿拉善', en:'ALXA', relic:'居延汉简', link:'cities/alxa.html', color:'#b58b5a',
      desc:'居延汉简出土于额济纳河流域，是汉代边塞屯戍的文书档案。一枚枚木简用绳编连，记录粮草、烽燧与官吏往来。', meta:'木质 · 汉代边塞 · 3D 扫描简化' },
    { id:'ordos', city:'鄂尔多斯', en:'ORDOS', relic:'鹰顶金冠饰', link:'cities/ordos.html', color:'#d4af6a',
      desc:'鄂尔多斯杭锦旗阿鲁柴登出土的鹰顶金冠，是战国时期匈奴贵族的金冠。冠顶立鹰，冠带饰虎马，是草原金属工艺的代表。', meta:'金 · 战国匈奴 · 3D 扫描简化' }
  ];

  const canvas = document.getElementById('relicCanvas');
  if (!canvas) return;
  const gl = canvas.getContext('webgl', { antialias:true, alpha:true });
  gl.getExtension('OES_element_index_uint');
  if (!gl) { canvas.parentNode.innerHTML = '<p style="color:#f5f0e6;padding:40px">当前浏览器不支持 WebGL。</p>'; return; }

  /* matrix helpers */
  function mul(a,b){ const o=new Float32Array(16); for(let c=0;c<4;c++)for(let r=0;r<4;r++)o[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3]; return o; }
  function perspective(fov,aspect,near,far){ const f=1/Math.tan(fov/2); return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,(2*far*near)/(near-far),0]); }
  function translate(z){ return new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,z,1]); }
  function rotX(a){ const c=Math.cos(a),s=Math.sin(a); return new Float32Array([1,0,0,0,0,c,s,0,0,-s,c,0,0,0,0,1]); }
  function rotY(a){ const c=Math.cos(a),s=Math.sin(a); return new Float32Array([c,0,-s,0,0,1,0,0,s,0,c,0,0,0,0,1]); }

  /* shaders */
  const vs = `attribute vec3 aPos; attribute vec3 aNormal;
    uniform mat4 uMVP; uniform mat4 uModel;
    varying vec3 vN;
    void main(){ vN=mat3(uModel)*aNormal; gl_Position=uMVP*vec4(aPos,1.0); }`;
  const fs = `precision mediump float;
    uniform vec3 uColor; varying vec3 vN;
    void main(){
      vec3 n=normalize(vN);
      vec3 l=normalize(vec3(.45,.8,1.0));
      float d=max(dot(n,l),0.0);
      float rim=pow(1.0-max(dot(n,vec3(0.,0.,1.)),0.0),2.0);
      vec3 c=uColor*(.38+.72*d)+vec3(.12,.10,.05)*rim;
      gl_FragColor=vec4(c,1.0);
    }`;
  function sh(type,src){ const s=gl.createShader(type); gl.shaderSource(s,src); gl.compileShader(s); return s; }
  const prog=gl.createProgram();
  gl.attachShader(prog,sh(gl.VERTEX_SHADER,vs));
  gl.attachShader(prog,sh(gl.FRAGMENT_SHADER,fs));
  gl.linkProgram(prog); gl.useProgram(prog);
  const aPos=gl.getAttribLocation(prog,'aPos'), aNor=gl.getAttribLocation(prog,'aNormal');
  const uMVP=gl.getUniformLocation(prog,'uMVP'), uModel=gl.getUniformLocation(prog,'uModel'), uColor=gl.getUniformLocation(prog,'uColor');
  gl.enable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE);

  let current=null, yaw=.55, pitch=.12, camZ=6.5, auto=true, dragging=false, lx=0, ly=0, loadToken=0;
  const QP=new URLSearchParams(location.search); if(QP.has('pitch')) pitch=Number(QP.get('pitch')); if(QP.has('yaw')) yaw=Number(QP.get('yaw'));

  function resize(){
    const dpr=Math.min(2,window.devicePixelRatio||1);
    const w=canvas.clientWidth, h=canvas.clientHeight;
    if(!w||!h)return;
    canvas.width=Math.round(w*dpr); canvas.height=Math.round(h*dpr);
    gl.viewport(0,0,canvas.width,canvas.height);
  }
  function render(){
    resize();
    gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    if(current){
      const aspect=canvas.width/canvas.height||1;
      const proj=perspective(36*Math.PI/180,aspect,.1,40);
      const view=translate(-camZ);
      const model=mul(rotY(yaw),rotX(pitch));
      const mvp=mul(proj,mul(view,model));
      gl.useProgram(prog);
      gl.uniformMatrix4fv(uMVP,false,mvp);
      gl.uniformMatrix4fv(uModel,false,model);
      gl.uniform3fv(uColor,current.color);
      gl.bindBuffer(gl.ARRAY_BUFFER,current.posBuf); gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos,3,gl.FLOAT,false,0,0);
      gl.bindBuffer(gl.ARRAY_BUFFER,current.norBuf); gl.enableVertexAttribArray(aNor); gl.vertexAttribPointer(aNor,3,gl.FLOAT,false,0,0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,current.idxBuf);
      gl.drawElements(gl.TRIANGLES,current.count,current.idxType,0);
    }
    if(auto&&!dragging)yaw+=.004;
    requestAnimationFrame(render);
  }
  function upload(g,colorHex){
    if(current){ gl.deleteBuffer(current.posBuf); gl.deleteBuffer(current.norBuf); gl.deleteBuffer(current.idxBuf); }
    const mk=(data,type)=>{ const b=gl.createBuffer(); gl.bindBuffer(type,b); gl.bufferData(type,data,gl.STATIC_DRAW); return b; };
    const c=hex(colorHex);
    current={
      posBuf:mk(g.positions,gl.ARRAY_BUFFER),
      norBuf:mk(g.normals,gl.ARRAY_BUFFER),
      idxBuf:mk(g.indices,gl.ELEMENT_ARRAY_BUFFER),
      count:g.indices.length,
      idxType:g.indices instanceof Uint16Array ? gl.UNSIGNED_SHORT : gl.UNSIGNED_INT,
      color:c
    };
    yaw=QP.has('yaw')?Number(QP.get('yaw')):.55;
    pitch=QP.has('pitch')?Number(QP.get('pitch')):.12;
    camZ=6.5;
  }
  function hex(c){ const n=parseInt(c.slice(1),16); return [((n>>16)&255)/255,((n>>8)&255)/255,(n&255)/255]; }

  /* GLB parser: positions, normals, indices */
  function parseGLB(buf){
    const dv=new DataView(buf);
    if(dv.getUint32(0,true)!==0x46546C67) throw new Error('not glb');
    const total=dv.getUint32(8,true);
    let off=12, json=null, bin=null, binOffset=0;
    while(off<total){
      const len=dv.getUint32(off,true), type=dv.getUint32(off+4,true);
      off+=8;
      if(type===0x4E4F534A){
        json=JSON.parse(new TextDecoder('utf-8').decode(new Uint8Array(buf,off,len)));
      }else if(type===0x004E4942){
        bin=new Uint8Array(buf,off,len); binOffset=off;
      }
      off+=len;
    }
    if(!json||!bin) throw new Error('glb chunks missing');
    const comps={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16};
    function accessor(i){
      const a=json.accessors[i], bv=json.bufferViews[a.bufferView];
      const n=comps[a.type]||1, count=a.count;
      const comp=a.componentType, Type=comp===5126?Float32Array:comp===5125?Uint32Array:comp===5123?Uint16Array:Uint8Array;
      const bytes=Type.BYTES_PER_ELEMENT;
      const start=binOffset+(bv.byteOffset||0)+(a.byteOffset||0);
      const stride=bv.byteStride||n*bytes;
      const out=new Type(count*n);
      for(let v=0;v<count;v++){
        for(let c=0;c<n;c++){
          const p=start+v*stride+c*bytes;
          out[v*n+c]=comp===5126?dv.getFloat32(p,true):comp===5125?dv.getUint32(p,true):comp===5123?dv.getUint16(p,true):dv.getUint8(p);
        }
      }
      return out;
    }
    const positions=[], normals=[], indices=[];
    let base=0;
    (json.meshes||[]).forEach(function(m){
      (m.primitives||[]).forEach(function(p){
        if(p.attributes.POSITION===undefined)return;
        const pos=accessor(p.attributes.POSITION);
        const nor=p.attributes.NORMAL!==undefined?accessor(p.attributes.NORMAL):null;
        const idx=p.indices!==undefined?accessor(p.indices):null;
        for(let i=0;i<pos.length;i++)positions.push(pos[i]);
        if(nor)for(let i=0;i<nor.length;i++)normals.push(nor[i]);
        else for(let i=0;i<pos.length/3;i++)normals.push(0,1,0);
        if(idx){ for(let i=0;i<idx.length;i++)indices.push(base+idx[i]); }
        else { for(let i=0;i<pos.length/3;i++)indices.push(base+i); }
        base+=pos.length/3;
      });
    });
    if(!positions.length) throw new Error('no geometry');
    const P=new Float32Array(positions);
    const N=new Float32Array(P.length);
    let maxI=0;
    for(let i=0;i<indices.length;i++) if(indices[i]>maxI) maxI=indices[i];
    const I=maxI<65535?new Uint16Array(indices):new Uint32Array(indices);
    for(let t=0;t<I.length;t+=3){
      const ia=I[t]*3, ib=I[t+1]*3, ic=I[t+2]*3;
      const ax=P[ib]-P[ia], ay=P[ib+1]-P[ia+1], az=P[ib+2]-P[ia+2];
      const bx=P[ic]-P[ia], by=P[ic+1]-P[ia+1], bz=P[ic+2]-P[ia+2];
      const nx=ay*bz-az*by, ny=az*bx-ax*bz, nz=ax*by-ay*bx;
      N[ia]+=nx; N[ia+1]+=ny; N[ia+2]+=nz;
      N[ib]+=nx; N[ib+1]+=ny; N[ib+2]+=nz;
      N[ic]+=nx; N[ic+1]+=ny; N[ic+2]+=nz;
    }
    for(let i=0;i<N.length;i+=3){
      const l=Math.hypot(N[i],N[i+1],N[i+2])||1;
      N[i]/=l; N[i+1]/=l; N[i+2]/=l;
    }
    let minX=1e9,minY=1e9,minZ=1e9,maxX=-1e9,maxY=-1e9,maxZ=-1e9;
    for(let i=0;i<P.length;i+=3){
      minX=Math.min(minX,P[i]); maxX=Math.max(maxX,P[i]);
      minY=Math.min(minY,P[i+1]); maxY=Math.max(maxY,P[i+1]);
      minZ=Math.min(minZ,P[i+2]); maxZ=Math.max(maxZ,P[i+2]);
    }
    const cx=(minX+maxX)/2, cy=(minY+maxY)/2, cz=(minZ+maxZ)/2;
    const scale=2.1/Math.max(maxX-minX,maxY-minY,maxZ-minZ);
    for(let i=0;i<P.length;i+=3){
      P[i]=(P[i]-cx)*scale;
      P[i+1]=(P[i+1]-cy)*scale;
      P[i+2]=(P[i+2]-cz)*scale;
    }
    return { positions:P, normals:N, indices:I };
  }

  function b64ToBuf(b64){
    const raw=atob(b64);
    const u=new Uint8Array(raw.length);
    for(let i=0;i<raw.length;i++)u[i]=raw.charCodeAt(i);
    return u.buffer;
  }
  function loadScript(src){
    return new Promise(function(resolve,reject){
      const s=document.createElement('script');
      s.src=src; s.onload=resolve; s.onerror=reject;
      document.head.appendChild(s);
    });
  }
  async function loadModel(item){
    const token=++loadToken;
    const stage=canvas.parentNode;
    stage.classList.add('is-loading');
    const status=document.getElementById('relicStatus');
    if(status){ status.textContent='模型加载中…'; status.hidden=false; }
    try{
      if(!window.RELIC_MODELS||!window.RELIC_MODELS[item.id]){
        await loadScript('js/model-'+item.id+'.js');
      }
      if(token!==loadToken)return;
      const buf=b64ToBuf(window.RELIC_MODELS[item.id].split(',')[1]);
      const g=parseGLB(buf);
      if(token!==loadToken)return;
      upload(g,item.color);
      if(status)status.hidden=true;
    }catch(err){
      console.error(err);
      if(status){ status.textContent='模型加载失败，请检查 js/model-'+item.id+'.js'; status.hidden=false; }
    }finally{
      stage.classList.remove('is-loading');
    }
  }

  const list=document.getElementById('relicList');
  const title=document.getElementById('relicTitle');
  const type=document.getElementById('relicType');
  const desc=document.getElementById('relicDesc');
  const meta=document.getElementById('relicMeta');
  const link=document.getElementById('relicLink');
  const counter=document.getElementById('relicCounter');
  let index=0;

  function select(i){
    index=((i%DATA.length)+DATA.length)%DATA.length;
    const d=DATA[index];
    title.textContent=d.relic;
    type.textContent='城市 · '+d.city;
    desc.textContent=d.desc;
    meta.textContent=d.meta;
    link.href=d.link;
    link.textContent='进入'+d.city+'页 →';
    counter.textContent=String(index+1).padStart(2,'0')+' / '+DATA.length;
    list.querySelectorAll('button').forEach((b,n)=>b.classList.toggle('is-active',n===index));
    const active=list.querySelector('.is-active');
    if(active&&active.scrollIntoView)active.scrollIntoView({block:'nearest',behavior:'smooth'});
    loadModel(d);
  }

  DATA.forEach(function(d,i){
    const b=document.createElement('button');
    b.type='button'; b.className='relic-item';
    b.innerHTML='<span>'+String(i+1).padStart(2,'0')+'</span><b>'+d.relic+'</b><small>'+d.city+' · '+d.en+'</small>';
    b.addEventListener('click',()=>select(i));
    list.appendChild(b);
  });
  document.getElementById('relicPrev').addEventListener('click',()=>select(index-1));
  document.getElementById('relicNext').addEventListener('click',()=>select(index+1));
  document.getElementById('relicReset').addEventListener('click',()=>{yaw=.55;pitch=.12;camZ=6.5;});
  const autoBtn=document.getElementById('relicAuto');
  autoBtn.addEventListener('click',()=>{auto=!auto;autoBtn.classList.toggle('is-on',auto);autoBtn.textContent=auto?'自动旋转 · 开':'自动旋转 · 关';});
  canvas.addEventListener('pointerdown',e=>{dragging=true;lx=e.clientX;ly=e.clientY;try{canvas.setPointerCapture(e.pointerId);}catch(err){}});
  canvas.addEventListener('pointermove',e=>{
    if(!dragging)return;
    yaw+=(e.clientX-lx)*.008; pitch+=(e.clientY-ly)*.005;
    pitch=Math.max(-.6,Math.min(.6,pitch)); lx=e.clientX; ly=e.clientY;
  });
  canvas.addEventListener('pointerup',()=>{dragging=false;});
  canvas.addEventListener('pointercancel',()=>{dragging=false;});
  canvas.addEventListener('wheel',e=>{e.preventDefault();camZ=Math.max(3.2,Math.min(9.0,camZ+e.deltaY*.002));},{passive:false});
  window.addEventListener('keydown',e=>{
    if(e.key==='ArrowLeft')select(index-1);
    if(e.key==='ArrowRight')select(index+1);
  });

  const startItem=Number(new URLSearchParams(location.search).get('item'))||1;
  select(Math.max(0,Math.min(DATA.length-1,startItem-1)));
  render();
})();




