// YouTube videos load only when the visitor presses play. Until then the page shows a local
// poster image, so no YouTube request or cookie happens on page load. Each poster is a link to
// the video on YouTube, so it still works without JavaScript.
(() => {
  // YouTube refuses to play an embed whose request has no referrer (player error 153).
  // A page opened from disk never sends one, so there the poster simply opens YouTube.
  const canEmbed = window.location.protocol === 'https:' || window.location.protocol === 'http:';
  if (!canEmbed) {
    return;
  }

  document.querySelectorAll('[data-youtube-id]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();

      const parameters = new URLSearchParams({
        autoplay: '1',
        rel: '0',
        origin: window.location.origin,
      });
      const player = document.createElement('iframe');
      player.className = 'video-embed__player';
      player.src = `https://www.youtube-nocookie.com/embed/${link.dataset.youtubeId}?${parameters}`;
      player.title = link.dataset.videoTitle || 'Video';
      player.allow = 'autoplay; encrypted-media; fullscreen; picture-in-picture';
      player.allowFullscreen = true;
      // Sends only the site's address, which YouTube needs to allow the embed.
      player.referrerPolicy = 'strict-origin-when-cross-origin';

      link.replaceWith(player);
      player.focus();
      if (link.dataset.youtubeId === 'cjH05QrgeD8') {
        Achievements.unlock('talk');
      }
    });
  });
})();
