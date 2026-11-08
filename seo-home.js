(() => {
  const seo = {
    fr: {
      title: 'Lettre personnalisée du Père Noël et cadeaux de Noël | NoelWish',
      description: 'Créez une lettre personnalisée du Père Noël, trouvez un cadeau de Noël original et partagez un vœu magique avec NoelWish.',
      heading: 'Créez une magie de Noël vraiment personnelle',
      copy: 'NoelWish transforme les petits détails qui comptent en souvenirs de Noël uniques. Créez une lettre personnalisée du Père Noël avec le prénom et votre propre message, choisissez une surprise pensée pour la personne que vous aimez ou partagez un vœu sur notre mur de Noël. Chaque expérience peut être préparée à distance et envoyée au moment idéal.',
      links: [
        ['💌 Lettre personnalisée du Père Noël', '/fr/lettre-pere-noel-personnalisee'],
        ['🎁 Cadeau de Noël personnalisé', '/fr/cadeau-noel-personnalise'],
        ['✨ Idées cadeaux de Noël', '/fr/idees-cadeaux-noel-personnalises'],
        ['⭐ Mur des vœux de Noël', '/fr/mur-des-voeux']
      ]
    },
    en: {
      title: 'Personalised Santa Letters and Christmas Gifts | NoelWish',
      description: 'Create a personalised Santa letter, discover meaningful Christmas gifts and share a magical wish with NoelWish.',
      heading: 'Create Christmas magic that feels truly personal',
      copy: 'NoelWish turns the little details that matter into memorable Christmas moments. Create a personalised Santa letter using their name and your own message, choose a thoughtful surprise for someone you love, or share a wish on our Christmas Wish Wall. Every experience can be prepared from anywhere and delivered at the perfect moment.',
      links: [
        ['💌 Personalised Santa letter', '/en/personalized-santa-letter'],
        ['🎁 Personalised Christmas gift', '/en/personalized-christmas-gift'],
        ['✨ Christmas gift ideas', '/en/personalized-christmas-gift-ideas'],
        ['⭐ Christmas Wish Wall', '/en/christmas-wish-wall']
      ]
    },
    es: {
      title: 'Carta personalizada de Papá Noel y regalos de Navidad | NoelWish',
      description: 'Crea una carta personalizada de Papá Noel, encuentra regalos de Navidad originales y comparte un deseo mágico con NoelWish.',
      heading: 'Crea una magia navideña realmente personal',
      copy: 'NoelWish convierte los pequeños detalles importantes en recuerdos navideños únicos. Crea una carta personalizada de Papá Noel con su nombre y tu mensaje, elige una sorpresa para alguien especial o comparte un deseo en nuestro muro de Navidad. Puedes prepararlo todo a distancia y enviarlo en el momento perfecto.',
      links: [
        ['💌 Carta personalizada de Papá Noel', '/es/carta-personalizada-papa-noel'],
        ['🎁 Regalo de Navidad personalizado', '/es/regalo-navidad-personalizado'],
        ['✨ Ideas de regalos de Navidad', '/es/ideas-regalos-navidad-personalizados'],
        ['⭐ Muro de deseos de Navidad', '/es/muro-deseos-navidad']
      ]
    },
    pt: {
      title: 'Carta personalizada do Papai Noel e presentes de Natal | NoelWish',
      description: 'Crie uma carta personalizada do Papai Noel, encontre presentes de Natal especiais e compartilhe um desejo mágico.',
      heading: 'Crie uma magia de Natal realmente pessoal',
      copy: 'A NoelWish transforma os pequenos detalhes importantes em lembranças únicas de Natal. Crie uma carta personalizada do Papai Noel com o nome e a sua mensagem, escolha uma surpresa para alguém especial ou compartilhe um desejo em nosso mural de Natal. Tudo pode ser preparado à distância e enviado no momento perfeito.',
      links: [
        ['💌 Carta personalizada do Papai Noel', '/pt/carta-personalizada-papai-noel'],
        ['🎁 Presente de Natal personalizado', '/pt/presente-natal-personalizado'],
        ['✨ Ideias de presentes de Natal', '/pt/ideias-presentes-natal-personalizados'],
        ['⭐ Mural de desejos de Natal', '/pt/mural-desejos-natal']
      ]
    },
    de: {
      title: 'Personalisierter Weihnachtsmann-Brief und Weihnachtsgeschenke | NoelWish',
      description: 'Erstelle einen persönlichen Weihnachtsmann-Brief, entdecke besondere Weihnachtsgeschenke und teile einen magischen Wunsch.',
      heading: 'Gestalte Weihnachtsmagie, die wirklich persönlich ist',
      copy: 'NoelWish macht aus den kleinen wichtigen Details einzigartige Weihnachtserinnerungen. Erstelle einen personalisierten Weihnachtsmann-Brief mit Namen und eigener Nachricht, wähle eine Überraschung für einen lieben Menschen oder teile einen Wunsch auf unserer Weihnachtswunschwand. Alles lässt sich aus der Ferne vorbereiten und im perfekten Moment versenden.',
      links: [
        ['💌 Personalisierter Weihnachtsmann-Brief', '/de/personalisierter-weihnachtsmann-brief'],
        ['🎁 Personalisiertes Weihnachtsgeschenk', '/de/personalisiertes-weihnachtsgeschenk'],
        ['✨ Weihnachtsgeschenkideen', '/de/personalisierte-weihnachtsgeschenkideen'],
        ['⭐ Weihnachtswunschwand', '/de/weihnachtswuensche-wand']
      ]
    }
  };

  function replaceSecondaryH1s() {
    document.querySelectorAll('.page:not(#home) h1').forEach(oldHeading => {
      const heading = document.createElement('h2');
      [...oldHeading.attributes].forEach(attribute => heading.setAttribute(attribute.name, attribute.value));
      heading.innerHTML = oldHeading.innerHTML;
      oldHeading.replaceWith(heading);
    });
  }

  function renderSeoHome() {
    const lang = document.documentElement.lang || 'fr';
    const content = seo[lang] || seo.en;
    document.title = content.title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', content.description);
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', content.title);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', content.description);
    document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', content.title);
    document.querySelector('meta[name="twitter:description"]')?.setAttribute('content', content.description);

    let section = document.getElementById('home-seo-content');
    if (!section) {
      section = document.createElement('section');
      section.id = 'home-seo-content';
      section.className = 'section center';
      section.style.cssText = 'max-width:1000px;margin:56px auto 18px;padding:38px 24px;border:1px solid rgba(232,185,91,.25);border-radius:24px;background:rgba(255,255,255,.035)';
      document.querySelector('#home')?.appendChild(section);
    }
    section.innerHTML = `<h2>${content.heading}</h2><p class="lead" style="margin:0 auto 26px">${content.copy}</p><div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center">${content.links.map(([label, href]) => `<a class="btn secondary" href="${href}">${label}</a>`).join('')}</div>`;
  }

  function update() {
    replaceSecondaryH1s();
    renderSeoHome();
  }

  update();
  document.getElementById('language')?.addEventListener('change', () => setTimeout(update));
  document.getElementById('market')?.addEventListener('change', () => setTimeout(update));
})();
