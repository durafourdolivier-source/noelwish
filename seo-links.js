(() => {
  const links = {
    fr: {
      letter: ['Lettre du Père Noël', '/fr/lettre-pere-noel-personnalisee'],
      gift: ['Cadeau personnalisé', '/fr/cadeau-noel-personnalise'],
      wall: ['Mur des vœux', '/fr/mur-des-voeux'],
      ideas: ['Idées cadeaux de Noël', '/fr/idees-cadeaux-noel-personnalises']
    },
    en: {
      letter: ['Santa letter', '/en/personalized-santa-letter'],
      gift: ['Personalized gift', '/en/personalized-christmas-gift'],
      wall: ['Wish wall', '/en/christmas-wish-wall'],
      ideas: ['Christmas gift ideas', '/en/personalized-christmas-gift-ideas']
    },
    es: {
      letter: ['Carta de Papá Noel', '/es/carta-personalizada-papa-noel'],
      gift: ['Regalo personalizado', '/es/regalo-navidad-personalizado'],
      wall: ['Muro de deseos', '/es/muro-deseos-navidad'],
      ideas: ['Ideas de regalos', '/es/ideas-regalos-navidad-personalizados']
    },
    pt: {
      letter: ['Carta do Papai Noel', '/pt/carta-personalizada-papai-noel'],
      gift: ['Presente personalizado', '/pt/presente-natal-personalizado'],
      wall: ['Mural de desejos', '/pt/mural-desejos-natal'],
      ideas: ['Ideias de presentes', '/pt/ideias-presentes-natal-personalizados']
    },
    de: {
      letter: ['Weihnachtsmann-Brief', '/de/personalisierter-weihnachtsmann-brief'],
      gift: ['Personalisiertes Geschenk', '/de/personalisiertes-weihnachtsgeschenk'],
      wall: ['Wunschwand', '/de/weihnachtswuensche-wand'],
      ideas: ['Geschenkideen', '/de/personalisierte-weihnachtsgeschenkideen']
    }
  };

  function updateSeoLinks() {
    const lang = document.getElementById('language')?.value || localStorage.getItem('noelwish_lang') || 'fr';
    const copy = links[lang] || links.en;
    const footer = document.querySelector('footer .footerlinks');
    if (footer && !footer.querySelector('[data-seo="ideas"]')) {
      const ideas = document.createElement('a');
      ideas.dataset.seo = 'ideas';
      const legal = footer.querySelector('[data-f="legal"]');
      footer.insertBefore(ideas, legal || null);
    }
    document.querySelectorAll('[data-seo]').forEach(element => {
      const value = copy[element.dataset.seo];
      if (!value) return;
      element.textContent = value[0];
      element.href = value[1];
    });
  }

  updateSeoLinks();
  document.getElementById('language')?.addEventListener('change', updateSeoLinks);
  document.getElementById('market')?.addEventListener('change', () => setTimeout(updateSeoLinks));
})();
