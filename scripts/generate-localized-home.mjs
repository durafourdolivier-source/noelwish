// Regenerate static localized homes from the shared translation dictionaries.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
function generateHomes(source, seoSource) {
 const paths={fr:"/",en:"/en/home",es:"/es/inicio",pt:"/pt/inicio",de:"/de/startseite"};
 const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
 const dict={};
 for(const n of ["D","FOOTERS","HOME_UI"]){const c=source.slice(source.indexOf("const "+n+"=")+n.length+7);dict[n]=Function("return ("+c.slice(0,c.indexOf(";"))+")")();}
 for(const v of Object.values(dict.D))delete v.coming;
 const start=source.indexOf("const D=")+8,c=source.slice(start),end=c.indexOf(";");
 source=source.slice(0,start)+JSON.stringify(dict.D)+source.slice(start+end);
 const seo=Function("return ("+seoSource.slice(seoSource.indexOf("const seo = ")+12,seoSource.indexOf("\n\n  function replaceSecondaryH1s")).trim().replace(/;$/,"")+")")();
 const homes={};
 for(const [lang,path] of Object.entries(paths)){
  const edits=[],stack=[];
  for(const match of source.matchAll(/<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>|<!--[\s\S]*?-->|<\/?[a-zA-Z][^>]*>/g)){
   const token=match[0],offset=match.index;
   if(/^<(script|style)\b|^<!--/.test(token))continue;
   const tag=token.match(/^<\/?([\w-]+)/)[1].toLowerCase();
   if(token.startsWith("</")){
    if(stack.at(-1)?.tag!==tag)continue;
    const item=stack.pop();
    if(item.remove)edits.push([item.start,offset+token.length,""]);
    else if(item.replacement!==undefined)edits.push([item.inner,offset,item.replacement]);
   }else{
    const attrs=Object.fromEntries([...token.matchAll(/([\w-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
    const family=[["data-i","D"],["data-f","FOOTERS"],["data-h","HOME_UI"]].find(([a])=>a in attrs);
    if(!/^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/.test(tag))
     stack.push({tag,start:offset,inner:offset+token.length,replacement:family?dict[family[1]][lang][attrs[family[0]]]:undefined,remove:attrs["data-i"]==="coming"||attrs.id==="home-seo-content"});
   }
  }
  let text=source;for(const [a,b,v] of edits.sort((x,y)=>y[0]-x[0]))text=text.slice(0,a)+v+text.slice(b);
  const content=seo[lang],base="https://www.noelwish.com",url=base+path;
  text=text.replace(/<html lang="[^"]+"/,`<html lang="${lang}"`).replace(/<title>[\s\S]*?<\/title>/,`<title>${esc(content.title)}</title>`);
  text=text.replace(/(<meta name="description" content=")[^"]*/,"$1"+esc(content.description));
  text=text.replace(/<link rel="canonical"[^>]*>/,`<link rel="canonical" href="${url}">`).replace(/<link rel="alternate" hreflang="[^"]*"[^>]*>/g,"");
  const alternates=Object.entries(paths).map(([l,p])=>`<link rel="alternate" hreflang="${l}" href="${base+p}">`).join("")+`<link rel="alternate" hreflang="x-default" href="${base}/">`;
  text=text.replace("</head>",alternates+"</head>").replace(/(<meta property="og:url" content=")[^"]*/,"$1"+url);
  for(const [name,value] of [["og:title",content.title],["og:description",content.description],["twitter:title",content.title],["twitter:description",content.description]])text=text.replace(new RegExp('(<meta (?:property|name)="'+name+'" content=")[^"]*'),"$1"+esc(value));
  let first=true;text=text.replace(/<h1\b[^>]*>[\s\S]*?<\/h1>/g,m=>{if(first){first=false;return m;}return m.replace("<h1","<h2").replace("</h1>","</h2>");});
  const links=content.links.map(([label,href])=>`<a class="btn secondary" href="${href}">${esc(label)}</a>`).join("");
  const resources=(content.resources||[]).map(([label,href])=>`<li><a href="${href}">${esc(label)}</a></li>`).join("");
  let section=`<section id="home-seo-content" class="section center"><h2>${esc(content.heading)}</h2><p class="lead">${esc(content.copy)}</p><div>${links}</div>`;
  if(resources)section+=`<h3>${esc(content.resourcesHeading)}</h3><ul>${resources}</ul>`;
  section+="</section>";
  const marker='</section>\n<section class="page" id="wish">';
  if(!text.includes(marker))throw Error("missing home boundary");
  text=text.replace(marker,section+marker);
  homes[path==="/"?"index.html":path.slice(1)+".html"]=text;
 }
 return homes;
}
function rewriteLinks(text){
 const paths={fr:"/",en:"/en/home",es:"/es/inicio",pt:"/pt/inicio",de:"/de/startseite"};
 for(const [lang,path] of Object.entries(paths))text=text.split("/?lang="+lang).join(path);
 return text.replace(/(\/en\/home|\/es\/inicio|\/pt\/inicio|\/de\/startseite|\/)&(?:amp;)?/g,"$1?");
}
const homes=generateHomes(fs.readFileSync(path.join(root,'index.html'),'utf8'),fs.readFileSync(path.join(root,'seo-home.js'),'utf8'));
for(const [name,content] of Object.entries(homes))fs.writeFileSync(path.join(root,name),rewriteLinks(content));
console.log('Generated five localized home pages.');
