import fetch from "node-fetch";

const UPSTASH_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const LIST_KEY = process.env.LIST_KEY || "walink:list";
const COUNTER_KEY = process.env.COUNTER_KEY || "walink:counter";
const BLOCK_SIZE = Number(process.env.BLOCK_SIZE || 2);

async function upstashIncr(key){
  const url = `${UPSTASH_REST_URL}/command`;
  const body = { cmd: ["INCR", key] };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Authorization": `Bearer ${UPSTASH_REST_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const json = await res.json();
  return Number(json.result);
}

async function upstashGet(key){
  const url = `${UPSTASH_REST_URL}/get/${encodeURIComponent(key)}`;
  const res = await fetch(url, { headers: { "Authorization": `Bearer ${UPSTASH_REST_TOKEN}` }});
  const json = await res.json();
  return json?.result || null;
}

export default async function handler(req, res){
  try {
    const listStr = await upstashGet(LIST_KEY);
    const links = listStr ? JSON.parse(listStr) : [];

    if(!Array.isArray(links) || links.length === 0){
      return res.writeHead(302, { Location: "https://walink.co" }).end();
    }

    const counter = await upstashIncr(COUNTER_KEY);
    const idx = Math.floor((counter - 1) / BLOCK_SIZE) % links.length;

    const base = String(links[idx]).trim();
    const reqUrl = new URL(req.url, `https://${req.headers.host}`);
    const utm = reqUrl.search;
    const destino = base + (utm || "");

    res.writeHead(302, { Location: destino });
    res.end();
  } catch (e) {
    res.writeHead(302, { Location: "https://walink.co" });
    res.end();
  }
}