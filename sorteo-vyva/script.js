(() => {
  const form = document.querySelector('#raffle-form');
  if (!form) return;

  form.addEventListener('submit', () => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'generate_lead',
      lead_source: 'expo_vyva_2026',
      lead_campaign: 'sorteo_pesca_mosca'
    });
    if (typeof window.fbq === 'function') {
      window.fbq('track', 'Lead', { content_name: 'Sorteo Expo VYVA 2026' });
    }
  });
})();
