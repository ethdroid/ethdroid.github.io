/* =========================================================================
   Prism Wealth — posts.js
   Loads posts from posts.json and renders the market recap feed
   or an individual post when ?post=slug is present in the URL.
   ========================================================================= */

(function () {
  'use strict';

  const FEED_CONTAINER  = document.getElementById('feed-container');
  const POST_CONTAINER  = document.getElementById('post-container');
  const VIEW_FEED       = document.getElementById('view-feed');
  const VIEW_POST       = document.getElementById('view-post');

  // Stop if we're not on a posts page
  if (!FEED_CONTAINER && !POST_CONTAINER) return;

  const params = new URLSearchParams(window.location.search);
  const slug   = params.get('post');

  /* ----- Helpers ----- */
  function escapeHTML(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  // If content has no HTML tags, treat it as plain text and wrap paragraphs.
  function renderBody(content) {
    if (!content) return '';
    const trimmed = content.trim();
    const looksLikeHTML = /<\/?(p|h\d|ul|ol|li|blockquote|img|a|strong|em|br|figure|video|iframe)[\s>]/i.test(trimmed);
    if (looksLikeHTML) return trimmed;
    // Plain text: split on blank lines, wrap in <p>
    return trimmed
      .split(/\n\s*\n/)
      .map(para => '<p>' + escapeHTML(para).replace(/\n/g, '<br />') + '</p>')
      .join('');
  }

  // Render a media block (image, video URL, or iframe embed)
  function renderMedia(post, className) {
    if (!post.media) return '';
    const { type, src, alt, embed } = post.media;
    className = className || 'feed-item__media';

    if (type === 'image' && src) {
      return '<div class="' + className + '"><img src="' + escapeHTML(src) + '" alt="' + escapeHTML(alt || post.title || '') + '" /></div>';
    }
    if (type === 'video' && src) {
      return '<div class="' + className + '"><video src="' + escapeHTML(src) + '" controls preload="metadata"></video></div>';
    }
    if (type === 'embed' && embed) {
      // embed is expected to be a full <iframe ...> string OR a YouTube/Vimeo URL.
      // We try to convert YouTube/Vimeo URLs into iframe embeds.
      const iframeMatch = embed.trim().startsWith('<iframe');
      if (iframeMatch) {
        return '<div class="' + className + '">' + embed + '</div>';
      }
      const yt = embed.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
      if (yt) {
        return '<div class="' + className + '"><iframe src="https://www.youtube.com/embed/' + yt[1] + '" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>';
      }
      const vimeo = embed.match(/vimeo\.com\/(\d+)/);
      if (vimeo) {
        return '<div class="' + className + '"><iframe src="https://player.vimeo.com/video/' + vimeo[1] + '" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div>';
      }
    }
    return '';
  }

  /* ----- Renderers ----- */
  function renderFeed(posts) {
    if (!FEED_CONTAINER) return;

    if (!posts.length) {
      FEED_CONTAINER.innerHTML =
        '<div class="feed-empty">' +
        '  <p>Market commentary will appear here as it is published.</p>' +
        '</div>';
      return;
    }

    // Newest first
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));

    FEED_CONTAINER.innerHTML = posts.map(post => {
      const url = 'market-recap.html?post=' + encodeURIComponent(post.slug);
      return (
        '<article class="feed-item reveal is-visible">' +
        '  <div class="feed-item__meta">' +
        '    <div class="feed-item__date">' + escapeHTML(formatDate(post.date)) + '</div>' +
        (post.category ? '    <span class="feed-item__cat">' + escapeHTML(post.category) + '</span>' : '') +
        '  </div>' +
        '  <div class="feed-item__body">' +
             renderMedia(post, 'feed-item__media') +
        '    <a href="' + url + '">' +
        '      <h2>' + escapeHTML(post.title) + '</h2>' +
        '    </a>' +
        (post.excerpt ? '    <p>' + escapeHTML(post.excerpt) + '</p>' : '') +
        '    <a href="' + url + '" class="feed-item__readmore">Read More →</a>' +
        '  </div>' +
        '</article>'
      );
    }).join('');
  }

  function renderSinglePost(posts, slug) {
    if (!POST_CONTAINER) return;
    const post = posts.find(p => p.slug === slug);

    if (!post) {
      POST_CONTAINER.innerHTML =
        '<p class="post__date">Not Found</p>' +
        '<h1>Post not available.</h1>' +
        '<p>This post could not be found. It may have been removed or the link may be incorrect.</p>';
      return;
    }

    // Update document title for shareability
    document.title = post.title + ' — Prism Wealth';

    POST_CONTAINER.innerHTML =
      '<div class="post__date">' + escapeHTML(formatDate(post.date)) +
        (post.category ? ' &nbsp;·&nbsp; ' + escapeHTML(post.category) : '') +
      '</div>' +
      '<h1>' + escapeHTML(post.title) + '</h1>' +
      (post.excerpt ? '<p class="lead" style="margin-top:1rem;">' + escapeHTML(post.excerpt) + '</p>' : '') +
      renderMedia(post, 'post__media') +
      '<div class="post__content">' + renderBody(post.content) + '</div>';

    // Show post view, hide feed view
    if (VIEW_FEED) VIEW_FEED.style.display = 'none';
    if (VIEW_POST) VIEW_POST.style.display = 'block';
  }

  /* ----- Load ----- */
  fetch('posts.json', { cache: 'no-store' })
    .then(res => {
      if (!res.ok) throw new Error('Failed to load posts.json');
      return res.json();
    })
    .then(posts => {
      if (!Array.isArray(posts)) posts = [];
      if (slug) {
        renderSinglePost(posts, slug);
      } else {
        renderFeed(posts);
      }
    })
    .catch(err => {
      console.error('[Prism Wealth] Posts could not be loaded:', err);
      if (FEED_CONTAINER) {
        FEED_CONTAINER.innerHTML =
          '<div class="feed-empty">' +
          '  <p>Market commentary will appear here as it is published.</p>' +
          '</div>';
      }
    });

})();
