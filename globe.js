(function () {
  const canvas = document.querySelector('.globe-canvas');
  const globe = document.querySelector('.hero-globe');
  if (!canvas || !globe || !window.d3 || !window.WEDDING_LAND) return;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return;

  const usa = [-74, 40]; // East coast marker, representing the USA
  const india = [80.27, 13.08]; // Chennai
  const interpolate = d3.geoInterpolate(usa, india);
  const route = { type: 'LineString', coordinates: Array.from({ length: 100 }, (_, i) => interpolate(i / 99)) };
  const land = { type: 'MultiPolygon', coordinates: window.WEDDING_LAND.map((ring) => [ring]) };
  const graticule = d3.geoGraticule().step([30, 30])();
  const projection = d3.geoOrthographic().clipAngle(90).precision(0.35);
  const path = d3.geoPath(projection, ctx);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let width = 0;
  let height = 0;
  let dpr = 1;
  let frame = 0;
  let start = performance.now();

  function resize() {
    const box = canvas.getBoundingClientRect();
    if (!box.width || !box.height) return;
    width = box.width;
    height = box.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function isVisible(coord, longitudeRotation) {
    const lon = (coord[0] + longitudeRotation) * Math.PI / 180;
    const lat = coord[1] * Math.PI / 180;
    return Math.cos(lat) * Math.cos(lon) > 0.015;
  }

  function label(coord, text, rotation) {
    if (!isVisible(coord, rotation)) return;
    const p = projection(coord);
    if (!p) return;
    const [x, y] = p;
    ctx.save();
    ctx.font = '600 7px DM Sans, sans-serif';
    ctx.textAlign = x < width / 2 ? 'left' : 'right';
    ctx.textBaseline = 'middle';
    const pad = 5;
    const tw = ctx.measureText(text).width;
    const lx = x < width / 2 ? x + 7 : x - tw - pad * 2 - 7;
    ctx.beginPath();
    ctx.arc(x, y, 2.6, 0, Math.PI * 2);
    ctx.fillStyle = '#f0d992';
    ctx.shadowColor = '#edcf7a';
    ctx.shadowBlur = 7;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#10231cdd';
    ctx.strokeStyle = '#ddc67b9c';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.roundRect(lx, y - 6.5, tw + pad * 2, 13, 6.5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#f0dfa8';
    ctx.fillText(text, lx + pad, y + 0.2);
    ctx.restore();
  }

  function drawPlane(coord) {
    const p = projection(coord);
    if (!p) return;
    ctx.save();
    ctx.translate(p[0], p[1]);
    ctx.rotate(-0.38);
    ctx.fillStyle = '#fff0b4';
    ctx.shadowColor = '#efd786';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(1.7, -1.6);
    ctx.lineTo(6, 0);
    ctx.lineTo(1.7, 1.4);
    ctx.lineTo(0, 6);
    ctx.lineTo(-1.2, 1.4);
    ctx.lineTo(-6, 0);
    ctx.lineTo(-1.2, -1.6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function render(now) {
    if (!width || !height) resize();
    if (!width || !height) return;
    const radius = Math.min(width, height) / 2 - 1;
    const cx = width / 2;
    const cy = height / 2;
    const rotation = reduced ? 0 : ((now - start) / 42000 * 360) % 360;
    projection.scale(radius).translate([cx, cy]).rotate([rotation, -4, 0]);

    ctx.clearRect(0, 0, width, height);
    const ocean = ctx.createRadialGradient(cx - radius * 0.34, cy - radius * 0.38, radius * 0.08, cx, cy, radius * 1.08);
    ocean.addColorStop(0, '#476a50');
    ocean.addColorStop(0.56, '#203e31');
    ocean.addColorStop(1, '#091512');
    ctx.beginPath();
    path({ type: 'Sphere' });
    ctx.fillStyle = ocean;
    ctx.shadowColor = '#c3a65b33';
    ctx.shadowBlur = 16;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#d5bd7559';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    ctx.beginPath();
    path(graticule);
    ctx.strokeStyle = '#d3d6a02a';
    ctx.lineWidth = 0.55;
    ctx.stroke();

    ctx.beginPath();
    path(land);
    ctx.fillStyle = '#c0d09a82';
    ctx.fill();
    ctx.strokeStyle = '#e1d09a52';
    ctx.lineWidth = 0.38;
    ctx.stroke();

    ctx.beginPath();
    path(route);
    ctx.setLineDash([2, 3]);
    ctx.strokeStyle = '#ecd88bce';
    ctx.lineWidth = 1.1;
    ctx.stroke();
    ctx.setLineDash([]);

    label(usa, 'USA', rotation);
    label(india, 'INDIA', rotation);
    const progress = ((now - start) % 7200) / 7200;
    const traveler = interpolate(progress);
    if (isVisible(traveler, rotation)) drawPlane(traveler);

    const shine = ctx.createRadialGradient(cx - radius * 0.28, cy - radius * 0.32, 0, cx - radius * 0.28, cy - radius * 0.32, radius * 0.95);
    shine.addColorStop(0, '#ffffff0a');
    shine.addColorStop(1, '#00000028');
    ctx.beginPath();
    path({ type: 'Sphere' });
    ctx.fillStyle = shine;
    ctx.fill();

    if (!reduced && !document.hidden) frame = requestAnimationFrame(render);
  }

  const observer = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting) && !frame && !reduced) {
      start = performance.now();
      frame = requestAnimationFrame(render);
    } else if (!entries.some((entry) => entry.isIntersecting) && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  }, { threshold: 0.02 });
  observer.observe(globe);
  resize();
  render(start);
  window.addEventListener('resize', resize, { passive: true });
})();
