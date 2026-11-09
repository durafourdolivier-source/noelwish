import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const additions = {
  'fr/exemples-lettre-pere-noel-enfant.html': ['Conseil pour une lettre vraiment crédible', 'Avant d’écrire, notez trois détails simples : une passion actuelle, un progrès récent et un souvenir partagé. Utilisez-en seulement deux dans la lettre pour garder un texte naturel. Le Père Noël peut aussi évoquer un lutin, un renne ou un événement familial, mais sans révéler une information qui pourrait inquiéter l’enfant.', 'Pour rendre la lecture encore plus magique, choisissez un moment calme, éteignez les écrans et lisez la lettre à voix haute. Une enveloppe, une signature et une date venue du Pôle Nord renforcent l’émotion sans avoir besoin d’un long texte.', 'Père Noël préparant une lettre personnalisée pour un enfant'],
  'en/santa-letter-examples-for-children.html': ['How to make the letter feel believable', 'Before writing, note three simple details: a current interest, a recent achievement and a shared family memory. Use only two of them so the message still sounds natural. Santa can mention an elf, a reindeer or a family event, but avoid details that could make the child uncomfortable.', 'For a more magical reading moment, choose a quiet time, put screens away and read the letter aloud. An envelope, a North Pole date and Santa’s signature create plenty of wonder without making the message unnecessarily long.', 'Santa preparing a personalized letter for a child'],
  'fr/lettre-pere-noel-gratuite-a-imprimer.html': ['Comment transformer l’impression en véritable activité de Noël', 'Laissez l’enfant choisir ses couleurs, dessiner un cadeau ou coller une étoile avant d’écrire. Pour les plus jeunes, un adulte peut noter les réponses mot pour mot afin de conserver leurs expressions. Pensez également à dater la lettre : elle deviendra un souvenir amusant à relire quelques années plus tard.', 'Une fois terminée, placez-la dans une enveloppe et prévoyez un petit rituel : boîte aux lettres, dépôt près du sapin ou photo avant son départ pour le Pôle Nord. L’objectif est moins d’obtenir une liste parfaite que de créer un moment partagé.', 'Modèle de lettre au Père Noël à imprimer'],
  'en/free-printable-letter-to-santa.html': ['Turn the printable into a Christmas tradition', 'Let the child choose colours, draw a present or add a star before writing. For younger children, an adult can write down their exact words so their personality stays in the letter. Add the date as well: the page can become a lovely memory to revisit in a few years.', 'When it is finished, place it in an envelope and create a simple ritual: use the family letterbox, leave it beside the tree or take a photo before it travels to the North Pole. The goal is not a perfect wish list, but a warm moment together.', 'Free printable Letter to Santa template'],
  'fr/lettre-pere-noel-enfant-pas-sage.html': ['Remplacer le jugement par un encouragement précis', 'Évitez les étiquettes comme « méchant » ou « pas sage ». Décrivez plutôt un comportement concret et surtout le progrès attendu : écouter davantage, réparer une erreur ou demander de l’aide avant de se mettre en colère. Une phrase précise aide beaucoup plus qu’une menace liée aux cadeaux.', 'La lettre peut rappeler une qualité réelle de l’enfant puis proposer un petit défi accessible. Elle doit rester rassurante et ne jamais faire croire que l’amour ou la visite du Père Noël dépend d’une perfection impossible.', 'Lettre bienveillante du Père Noël pour encourager un enfant'],
  'en/santa-letter-for-child-not-always-good.html': ['Replace judgement with one specific encouragement', 'Avoid labels such as “naughty” or “bad”. Describe one concrete behaviour and, more importantly, the next positive step: listening more carefully, repairing a mistake or asking for help before anger takes over. A specific suggestion is far more helpful than a threat about presents.', 'The letter can name a genuine strength and offer one achievable challenge. It should remain reassuring and never suggest that love, belonging or Santa’s visit depends on impossible perfection.', 'A kind Santa letter encouraging a child'],
  'fr/cadeau-noel-personnalise-maman.html': ['La méthode des trois souvenirs', 'Listez trois moments qui racontent votre relation : une habitude familiale, un voyage et une phrase qu’elle répète souvent. Choisissez ensuite le souvenir qui provoque l’émotion la plus immédiate. Il peut devenir le message central d’une lettre, d’une carte ou d’un coffret personnalisé.', 'Le cadeau gagne en valeur lorsqu’il explique pourquoi vous l’avez choisi. Ajoutez quelques lignes manuscrites ou un message programmé pour le matin de Noël. Même une attention simple devient mémorable lorsqu’elle reflète précisément votre histoire commune.', 'Cadeau de Noël personnalisé préparé pour une maman'],
  'en/personalized-christmas-gift-for-mom.html': ['The three-memory method', 'List three moments that tell the story of your relationship: a family habit, a trip and a phrase she often says. Choose the memory that creates the strongest immediate emotion. It can become the central message of a letter, card or personalized Christmas box.', 'A gift feels more valuable when it explains why you chose it. Add a few handwritten lines or schedule a message for Christmas morning. Even a simple surprise becomes memorable when it reflects your shared story with genuine detail.', 'A personalized Christmas gift prepared for Mom'],
  'fr/cadeau-noel-personnalise-couple.html': ['Choisir un cadeau qui parle aux deux personnes', 'Cherchez un point commun plutôt que deux goûts séparés : leur première maison, un voyage, une passion ou une tradition. Le cadeau doit célébrer leur histoire sans obliger l’un des deux à s’adapter à l’autre. Une expérience ou un message partagé fonctionne souvent mieux qu’un objet décoratif générique.', 'Si vous connaissez moins bien le couple, privilégiez une attention simple accompagnée d’un mot personnel. Évitez les dates, tailles ou préférences trop précises si vous n’êtes pas certain, et concentrez-vous sur ce que vous souhaitez leur faire vivre ensemble.', 'Cadeau de Noël personnalisé pour un couple'],
  'en/personalized-christmas-gift-for-couples.html': ['Choose a gift that speaks to both people', 'Look for one shared connection rather than two separate tastes: their first home, a trip, a hobby or a tradition. The gift should celebrate their story without asking one person to adapt to the other. A shared experience or message often works better than generic home décor.', 'If you do not know the couple closely, choose a simple surprise with a personal note. Avoid dates, sizes or detailed preferences unless you are certain, and focus on the feeling or moment you want them to enjoy together.', 'A personalized Christmas gift for a couple']
};

for (const [relative, [heading, first, second, alt]] of Object.entries(additions)) {
  const file = path.join(root, relative);
  let html = fs.readFileSync(file, 'utf8');
  if (!html.includes('class="article-visual"')) {
    html = html.replace('</style>', '.article-visual{display:block;width:min(420px,100%);max-height:300px;object-fit:contain;margin:34px auto 0;filter:drop-shadow(0 18px 24px #26000688)}</style>');
    html = html.replace('</div><div class="content">', `<img class="article-visual" src="/assets/santa-noelwish-v2.webp" alt="${alt}" width="420" height="300" loading="eager"></div><div class="content">`);
  }
  if (!html.includes(`>${heading}</h2>`)) {
    html = html.replace('<section class="faq">', `<section><div class="block"><h2>${heading}</h2><p>${first}</p><p>${second}</p></div></section><section class="faq">`);
  }
  fs.writeFileSync(file, html);
}

const pillarLinks = {
  'fr/lettre-pere-noel-personnalisee.html': [['/fr/exemples-lettre-pere-noel-enfant','Exemples de lettres pour enfant'],['/fr/lettre-pere-noel-gratuite-a-imprimer','Lettre gratuite à imprimer'],['/fr/lettre-pere-noel-enfant-pas-sage','Encourager avec bienveillance']],
  'en/personalized-santa-letter.html': [['/en/santa-letter-examples-for-children','Santa letter examples'],['/en/free-printable-letter-to-santa','Free printable letter'],['/en/santa-letter-for-child-not-always-good','A kind letter after a difficult year']],
  'fr/cadeau-noel-personnalise.html': [['/fr/cadeau-noel-personnalise-maman','Cadeau personnalisé pour maman'],['/fr/cadeau-noel-personnalise-couple','Cadeau personnalisé pour un couple']],
  'fr/idees-cadeaux-noel-personnalises.html': [['/fr/cadeau-noel-personnalise-maman','Idées pour maman'],['/fr/cadeau-noel-personnalise-couple','Idées pour un couple']],
  'en/personalized-christmas-gift.html': [['/en/personalized-christmas-gift-for-mom','Personalized gift for Mom'],['/en/personalized-christmas-gift-for-couples','Personalized gift for couples']],
  'en/personalized-christmas-gift-ideas.html': [['/en/personalized-christmas-gift-for-mom','Ideas for Mom'],['/en/personalized-christmas-gift-for-couples','Ideas for couples']]
};

for (const [relative, links] of Object.entries(pillarLinks)) {
  const file = path.join(root, relative);
  let html = fs.readFileSync(file, 'utf8');
  const missing = links.filter(([href]) => !html.includes(`href="${href}"`));
  if (missing.length) {
    const markup = missing.map(([href,label]) => `<a class="related" href="${href}"><span>✨</span>${label}</a>`).join('');
    html = html.replace('</div></section><section class="final">', `${markup}</div></section><section class="final">`);
    fs.writeFileSync(file, html);
  }
}

console.log('Enhanced 10 articles and 6 pillar pages.');
