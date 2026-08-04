import { randomInt, randomBytes, createHash } from 'node:crypto';
export type Suit = 'c'|'d'|'h'|'s'; export type Rank = 2|3|4|5|6|7|8|9|10|11|12|13|14;
export type Card = { rank: Rank; suit: Suit };
export type HandScore = { category: number; ranks: number[]; label: string };
const suits: Suit[] = ['c','d','h','s'];
export function newDeck(): Card[] { return suits.flatMap(suit => Array.from({length:13},(_,i)=>({rank:(i+2) as Rank,suit}))); }
export function shuffleDeck(deck = newDeck()): { deck: Card[]; seedCommitment: string } {
  const seed = randomBytes(32); const out = [...deck];
  for (let i = out.length - 1; i > 0; i--) { const j = randomInt(i + 1); [out[i], out[j]] = [out[j], out[i]]; }
  return { deck: out, seedCommitment: createHash('sha256').update(seed).digest('hex') };
}
export function evaluate(cards: Card[]): HandScore {
  if (cards.length < 5) throw new Error('At least five cards are required.');
  const combos = combinations(cards, 5).map(score5).sort(compareScore).reverse(); return combos[0];
}
export function compareScore(a: HandScore,b: HandScore): number { if (a.category!==b.category) return a.category-b.category; for(let i=0;i<Math.max(a.ranks.length,b.ranks.length);i++){ if((a.ranks[i]??0)!==(b.ranks[i]??0)) return (a.ranks[i]??0)-(b.ranks[i]??0);} return 0; }
function score5(cards: Card[]): HandScore { const ranks=cards.map(c=>c.rank).sort((a,b)=>b-a); const counts=new Map<number,number>(); ranks.forEach(r=>counts.set(r,(counts.get(r)??0)+1)); const groups=[...counts.entries()].sort((a,b)=>b[1]-a[1]||b[0]-a[0]); const flush=cards.every(c=>c.suit===cards[0].suit); const uniq=[...new Set(ranks)]; const wheel=uniq.join(',')==='14,5,4,3,2'; const straightHigh=wheel?5:uniq.find((r,i)=>i<=uniq.length-5&&uniq.slice(i,i+5).every((v,k)=>v===r-k)); if(flush&&straightHigh) return {category:8,ranks:[straightHigh],label:'straight_flush'}; if(groups[0][1]===4) return {category:7,ranks:[groups[0][0],groups[1][0]],label:'four_kind'}; if(groups[0][1]===3&&groups[1][1]===2) return {category:6,ranks:[groups[0][0],groups[1][0]],label:'full_house'}; if(flush) return {category:5,ranks,label:'flush'}; if(straightHigh) return {category:4,ranks:[straightHigh],label:'straight'}; if(groups[0][1]===3) return {category:3,ranks:[groups[0][0],...groups.slice(1).map(g=>g[0])],label:'three_kind'}; if(groups[0][1]===2&&groups[1][1]===2) return {category:2,ranks:[groups[0][0],groups[1][0],groups[2][0]],label:'two_pair'}; if(groups[0][1]===2) return {category:1,ranks:[groups[0][0],...groups.slice(1).map(g=>g[0])],label:'pair'}; return {category:0,ranks,label:'high_card'}; }
function combinations<T>(arr:T[], k:number): T[][] { if(k===0) return [[]]; if(arr.length<k) return []; const [h,...t]=arr; return combinations(t,k-1).map(c=>[h,...c]).concat(combinations(t,k)); }
