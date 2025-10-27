import fetch from "node-fetch";
const UPSTASH_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const LIST_KEY = process.env.LIST_KEY || "walink:list";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "cambialo-ya";

export default async function handler(req, res){
  const token = req.headers['x-admin-token'] || req.query.token;
  if(!token || token !== ADMIN_TOKEN) return res.status(401).json({ok:false, msg:"no autorizado"});
  if(req.method !== "POST") return res.status(400).json({ok:false, msg:"usar POST con body JSON"});

  try {
    const body = await new Promise((resolve) => {
      let data=''; req.on('data',c=>data+=c); req.on('end',()=>resolve(data));
    });
    const arr = JSON.parse(body);
    if(!Array.isArray(arr)) return res.status(400).json({ok:false, msg:"body debe ser array"});

    const url = `${UPSTASH_REST_URL}/command`;
    const cmd = { cmd: ["SET", LIST_KEY, JSON.stringify(arr)] };
    const r = await fetch(url, {
      method:"POST",
      headers:{ "Authorization": `Bearer ${UPSTASH_REST_TOKEN}`, "Content-Type":"application/json" },
      body: JSON.stringify(cmd)
    });
    const json = await r.json();
    return res.status(200).json({ok:true, saved: arr.length, raw: json});
  } catch(e){
    return res.status(500).json({ok:false, msg:"error servidor"});
  }
}