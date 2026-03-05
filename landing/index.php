<?php header('Content-Type: text/html; charset=utf-8'); ?>
<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vidder — Din personliga platsdagbok</title>
  <meta name="description" content="Spara intressanta platser på under 2 sekunder. Din personliga platsdagbok för resor och upptäckter.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #0a0a0a;
      color: #f0f0f0;
      min-height: 100vh;
      overflow-x: hidden;
    }

    .hero {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 48px 24px;
      text-align: center;
    }

    /* Background logo — full bleed behind everything */
    .bg-logo {
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: min(900px, 110vw);
      height: min(900px, 110vw);
      opacity: 0.12;
      pointer-events: none;
      user-select: none;
    }

    /* Vignette — darkens edges, keeps center visible */
    .hero::before {
      content: '';
      position: absolute;
      inset: 0;
      background:
        radial-gradient(ellipse 80% 60% at 50% 45%, transparent 30%, #0a0a0a 85%);
      pointer-events: none;
      z-index: 1;
    }

    .hero > *:not(.bg-logo) {
      position: relative;
      z-index: 2;
    }

    h1 {
      font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: clamp(72px, 18vw, 120px);
      font-weight: 700;
      letter-spacing: -4px;
      margin-bottom: 16px;
      line-height: 1;
    }

    .tagline {
      font-size: clamp(18px, 4vw, 22px);
      color: #777;
      margin-bottom: 48px;
      max-width: 440px;
      line-height: 1.4;
    }

    .features {
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 400px;
      width: 100%;
      margin-bottom: 52px;
      text-align: left;
    }

    .feature {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      background: rgba(255, 255, 255, 0.04);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 14px 16px;
    }

    .feature-icon { font-size: 20px; flex-shrink: 0; margin-top: 1px; }

    .feature-text strong {
      display: block;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 2px;
    }

    .feature-text span {
      font-size: 13px;
      color: #555;
      line-height: 1.4;
    }

    .cta {
      display: inline-block;
      background: #f0f0f0;
      color: #0a0a0a;
      font-size: 16px;
      font-weight: 600;
      padding: 16px 44px;
      border-radius: 50px;
      text-decoration: none;
      transition: opacity 0.15s;
      letter-spacing: -0.2px;
    }

    .cta:hover { opacity: 0.82; }

    .cta-note {
      margin-top: 12px;
      font-size: 12px;
      color: #444;
    }

    footer {
      text-align: center;
      padding: 24px;
      font-size: 12px;
      color: #333;
    }

    footer a { color: #444; text-decoration: none; }
    footer a:hover { color: #666; }
  </style>
</head>
<body>

<div class="hero">
  <img class="bg-logo" src="logo.png" alt="" aria-hidden="true">

  <h1>Vidder</h1>
  <p class="tagline">Din personliga platsdagbok för spontana upptäckter under resan.</p>

  <div class="features">
    <div class="feature">
      <span class="feature-icon">⚡</span>
      <div class="feature-text">
        <strong>Spara på under 2 sekunder</strong>
        <span>Tryck en gång — platsen sparas med GPS. Fyll i detaljer när du har tid.</span>
      </div>
    </div>
    <div class="feature">
      <span class="feature-icon">🗺️</span>
      <div class="feature-text">
        <strong>Kartan är gränssnittet</strong>
        <span>Se alla dina platser på kartan. Filtrera, sök och navigera tillbaka.</span>
      </div>
    </div>
    <div class="feature">
      <span class="feature-icon">📷</span>
      <div class="feature-text">
        <strong>Foton och anteckningar</strong>
        <span>Berika dina platser med bilder, noter och kategorier.</span>
      </div>
    </div>
    <div class="feature">
      <span class="feature-icon">✈️</span>
      <div class="feature-text">
        <strong>Logga dina resor</strong>
        <span>Spåra din resrutt automatiskt och spela upp den i efterhand.</span>
      </div>
    </div>
  </div>

  <a href="https://testflight.apple.com/join/XXXX" class="cta">Testa betaversionen</a>
  <p class="cta-note">Kräver iOS 16+ &nbsp;·&nbsp; Gratis under beta</p>
</div>

<footer>
  &copy; <?= date('Y') ?> Galento &nbsp;·&nbsp; <a href="mailto:ulf@norstrom.nu">Kontakt</a>
</footer>

</body>
</html>
