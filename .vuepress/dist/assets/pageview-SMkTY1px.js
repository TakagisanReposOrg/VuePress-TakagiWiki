import{_ as i}from"./app-kGInWqS_.js";var r={provider:"Waline",dark:"auto",serverURL:"https://waline-1-j6551192.deta.app/",emoji:["//npm.onmicrosoft.cn/@waline/emojis@1.1.0/bilibili"],commentSorting:"hottest",meta:["nick","mail"],requiredMeta:["nick"],login:"enable",wordLimit:0,pageSize:5,copyright:!0};const o=async()=>{try{const{pageviewCount:e}=await i(()=>import("./app-kGInWqS_.js").then(t=>t.L),__vite__mapDeps([]));return e({serverURL:r.serverURL})}catch{console.error("@waline/client is not installed!");return}};export{o as updatePageview};
function __vite__mapDeps(indexes) {
  if (!__vite__mapDeps.viteFileDeps) {
    __vite__mapDeps.viteFileDeps = []
  }
  return indexes.map((i) => __vite__mapDeps.viteFileDeps[i])
}