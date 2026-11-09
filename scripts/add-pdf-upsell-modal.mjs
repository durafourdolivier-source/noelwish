import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'fr/lettre-pere-noel-gratuite-a-imprimer.html');
let html = fs.readFileSync(file, 'utf8');

const css = `.upsell-modal{position:fixed;inset:0;z-index:1000;display:none;align-items:center;justify-content:center;padding:20px;background:#2b0009cc;backdrop-filter:blur(8px)}.upsell-modal.open{display:flex}.upsell-card{position:relative;width:min(560px,100%);border:1px solid #f3cf79;border-radius:26px;padding:34px;background:linear-gradient(145deg,#fffdf8,#fff3dc);color:#4e1820;box-shadow:0 28px 80px #21000580;text-align:center}.upsell-card:before{content:'✦';display:block;color:#c89c45;font-size:32px;margin-bottom:4px}.upsell-card h2{font-size:clamp(29px,5vw,42px);margin:8px 0 15px;color:#7d1320}.upsell-card>p{font-size:17px;line-height:1.65;margin:0 auto 20px;max-width:460px}.upsell-points{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:22px 0}.upsell-point{padding:13px 8px;border:1px solid #e4c98f;border-radius:14px;background:#fff;font-size:13px;font-weight:800}.upsell-card .btn{display:flex;width:100%;margin-top:12px}.upsell-later{border:0;background:transparent;color:#76535a;text-decoration:underline;padding:13px;cursor:pointer}.upsell-close{position:absolute;right:15px;top:12px;border:0;background:transparent;color:#7d1320;font-size:27px;cursor:pointer}.upsell-price{color:#7d1320;font-weight:900}.upsell-safe{display:block;margin-top:10px;color:#76535a;font-size:12px}@media(max-width:560px){.upsell-card{padding:28px 20px}.upsell-points{grid-template-columns:1fr}.upsell-point{padding:9px}.upsell-card>p{font-size:15px}}`;

const modal = `<div class="upsell-modal" id="pdf-upsell" role="dialog" aria-modal="true" aria-labelledby="upsell-title" aria-hidden="true"><div class="upsell-card"><button class="upsell-close" type="button" aria-label="Fermer">×</button><p class="eyebrow">Votre lettre est prête ✨</p><h2 id="upsell-title">Et si le Père Noël lui répondait vraiment ?</h2><p>Imaginez sa réaction en recevant une réponse illustrée qui reprend son prénom, ses passions et votre propre message.</p><div class="upsell-points"><div class="upsell-point">🎅 100 % personnalisée</div><div class="upsell-point">📅 Envoi immédiat ou programmé</div><div class="upsell-point">💌 Un souvenir magique</div></div><p class="upsell-price">La réponse personnalisée dès 1,99 €</p><a class="btn" href="/?lang=fr#gifts">Créer sa réponse magique →</a><small class="upsell-safe">Paiement sécurisé · Quelques minutes suffisent</small><button class="upsell-later" type="button">Non merci, continuer gratuitement</button></div></div>`;

const script = `<script>(()=>{const modal=document.getElementById('pdf-upsell'),download=document.getElementById('download-letter'),closeButtons=modal.querySelectorAll('.upsell-close,.upsell-later');function openUpsell(){modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';modal.querySelector('.upsell-close').focus()}function closeUpsell(){modal.classList.remove('open');modal.setAttribute('aria-hidden','true');document.body.style.overflow='';download.focus()}download.addEventListener('click',()=>setTimeout(()=>{if(document.getElementById('pdf-status').textContent.includes('bien été téléchargé'))openUpsell()},700));closeButtons.forEach(button=>button.addEventListener('click',closeUpsell));modal.addEventListener('click',event=>{if(event.target===modal)closeUpsell()});document.addEventListener('keydown',event=>{if(event.key==='Escape'&&modal.classList.contains('open'))closeUpsell()})})();</script>`;

if (!html.includes('id="pdf-upsell"')) {
  html = html.replace('</style>', `${css}</style>`);
  html = html.replace('<footer>', `${modal}<footer>`);
  html = html.replace('</body>', `${script}</body>`);
  fs.writeFileSync(file, html);
}

console.log('Added the post-download paid-letter upsell modal.');
