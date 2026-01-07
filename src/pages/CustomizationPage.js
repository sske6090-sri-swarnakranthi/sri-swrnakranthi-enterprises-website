import React, { useEffect, useMemo, useRef, useState } from "react";
import Navbar from "./Navbar";
import "./CustomizationPage.css";

const LS_KEYS = {
  product: "customization_selected_product",
  variant: "customization_selected_variant",
  overlay: "customization_overlay_image",
  settings: "customization_settings",
};

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const getPublicImg = (name) => `/images/banners/printing/${name}`;

const PRODUCTS = [
  { id: "tshirts", title: "T-Shirts", variants: [getPublicImg("printing1.jpg"), getPublicImg("printing2.jpg")] },
  { id: "mugs", title: "Mugs", variants: [getPublicImg("printing3.jpg"), getPublicImg("printing4.jpg")] },
  { id: "keychains", title: "Key-chains", variants: [getPublicImg("printing5.jpg")] },
  { id: "visiting_cards", title: "Visiting Cards", variants: [getPublicImg("printing6.jpg")] },
  { id: "pamphlets", title: "Pamphlets", variants: [getPublicImg("printing7.jpg")] },
  { id: "wedding_cards", title: "Wedding Cards", variants: [getPublicImg("printing8.jpg")] },
  { id: "id_cards", title: "ID Cards", variants: [getPublicImg("printing4.jpg")] },
];

const defaultSettings = {
  offsetX: 0,
  offsetY: 0,
  scale: 1,
  rotate: 0,
  opacity: 1,
  flipX: false,
  flipY: false,
  blendMode: "source-over",
  shadow: 0,
  border: 0,
  borderColor: "#1e6bff",
  radius: 0,
  blur: 0,
  hue: 0,
  saturate: 100,
  brightness: 100,
  contrast: 100,
  snapCenter: false,
  showGrid: false,
  showSafeArea: true,
  fineStep: 1,
};

function removeWhiteBgToTransparent(srcDataUrl, threshold = 245) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;

      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const ctx = c.getContext("2d");
      if (!ctx) {
        resolve(srcDataUrl);
        return;
      }

      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);

      const imageData = ctx.getImageData(0, 0, w, h);
      const d = imageData.data;

      for (let i = 0; i < d.length; i += 4) {
        const r = d[i];
        const g = d[i + 1];
        const b = d[i + 2];
        if (r >= threshold && g >= threshold && b >= threshold) {
          d[i + 3] = 0;
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(c.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = srcDataUrl;
  });
}

export default function CustomizationPage() {
  const savedProduct = typeof window !== "undefined" ? localStorage.getItem(LS_KEYS.product) : null;
  const savedVariant = typeof window !== "undefined" ? localStorage.getItem(LS_KEYS.variant) : null;
  const savedOverlay = typeof window !== "undefined" ? localStorage.getItem(LS_KEYS.overlay) : null;
  const savedSettingsRaw = typeof window !== "undefined" ? localStorage.getItem(LS_KEYS.settings) : null;

  const initialProductId = savedProduct && PRODUCTS.some((p) => p.id === savedProduct) ? savedProduct : PRODUCTS[0].id;
  const initialVariantIndex = Number.isFinite(Number(savedVariant)) ? Number(savedVariant) : 0;

  let initialSettings = defaultSettings;
  try {
    if (savedSettingsRaw) {
      const parsed = JSON.parse(savedSettingsRaw);
      initialSettings = { ...defaultSettings, ...parsed };
    }
  } catch {
    initialSettings = defaultSettings;
  }

  const [selectedProductId, setSelectedProductId] = useState(initialProductId);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(initialVariantIndex);
  const [overlayDataUrl, setOverlayDataUrl] = useState(savedOverlay || "");
  const [settings, setSettings] = useState(initialSettings);
  const [loadingBgRemoval, setLoadingBgRemoval] = useState(false);

  const selectedProduct = useMemo(
    () => PRODUCTS.find((p) => p.id === selectedProductId) || PRODUCTS[0],
    [selectedProductId]
  );

  const baseImageUrl = useMemo(() => {
    const idx = clamp(selectedVariantIndex, 0, selectedProduct.variants.length - 1);
    return selectedProduct.variants[idx];
  }, [selectedProduct, selectedVariantIndex]);

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const baseImgRef = useRef(null);
  const overlayImgRef = useRef(null);
  const drawStateRef = useRef({
    baseRect: { x: 0, y: 0, w: 0, h: 0 },
    overlayRect: { x: 0, y: 0, w: 0, h: 0 },
    overlayMeta: { w: 0, h: 0, cx: 0, cy: 0 },
  });
  const dragRef = useRef({ dragging: false, lastX: 0, lastY: 0 });

  useEffect(() => {
    const blockContext = (e) => {
      e.preventDefault();
      return false;
    };

    const onKeyDown = (e) => {
      const key = e.key?.toLowerCase?.() || "";
      const isPrintScreen = key === "printscreen";
      const isCtrlP = (e.ctrlKey || e.metaKey) && key === "p";
      const isCtrlS = (e.ctrlKey || e.metaKey) && key === "s";
      const isDevTools = (e.ctrlKey && e.shiftKey && ["i", "j", "c"].includes(key)) || key === "f12";
      if (isPrintScreen || isCtrlP || isCtrlS || isDevTools) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    document.addEventListener("contextmenu", blockContext);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("contextmenu", blockContext);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => localStorage.setItem(LS_KEYS.product, selectedProductId), [selectedProductId]);
  useEffect(() => localStorage.setItem(LS_KEYS.variant, String(selectedVariantIndex)), [selectedVariantIndex]);
  useEffect(() => localStorage.setItem(LS_KEYS.overlay, overlayDataUrl || ""), [overlayDataUrl]);
  useEffect(() => localStorage.setItem(LS_KEYS.settings, JSON.stringify(settings)), [settings]);

  useEffect(() => {
    const base = new Image();
    base.crossOrigin = "anonymous";
    base.src = baseImageUrl;
    base.onload = () => {
      baseImgRef.current = base;
      redraw();
    };
    base.onerror = () => {
      baseImgRef.current = null;
      redraw();
    };
  }, [baseImageUrl]);

  useEffect(() => {
    if (!overlayDataUrl) {
      overlayImgRef.current = null;
      redraw();
      return;
    }
    const ov = new Image();
    ov.crossOrigin = "anonymous";
    ov.src = overlayDataUrl;
    ov.onload = () => {
      overlayImgRef.current = ov;
      redraw();
    };
    ov.onerror = () => {
      overlayImgRef.current = null;
      redraw();
    };
  }, [overlayDataUrl]);

  useEffect(() => redraw(), [settings]);

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const w = Math.max(320, Math.floor(entry.contentRect.width));
      const h = Math.max(380, Math.floor(entry.contentRect.height));
      const canvas = canvasRef.current;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      redraw();
    });

    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const computeBaseRect = (cw, ch, img) => {
    if (!img) return { x: 0, y: 0, w: cw, h: ch };
    const imgW = img.naturalWidth || img.width;
    const imgH = img.naturalHeight || img.height;
    const scale = Math.min(cw / imgW, ch / imgH);
    const w = imgW * scale;
    const h = imgH * scale;
    const x = (cw - w) / 2;
    const y = (ch - h) / 2;
    return { x, y, w, h };
  };

  const drawGrid = (ctx, baseRect) => {
    const { x, y, w, h } = baseRect;
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.strokeStyle = "#1e6bff";
    ctx.lineWidth = 1;
    const cols = 6;
    const rows = 6;
    for (let i = 1; i < cols; i++) {
      const gx = x + (w * i) / cols;
      ctx.beginPath();
      ctx.moveTo(gx, y);
      ctx.lineTo(gx, y + h);
      ctx.stroke();
    }
    for (let i = 1; i < rows; i++) {
      const gy = y + (h * i) / rows;
      ctx.beginPath();
      ctx.moveTo(x, gy);
      ctx.lineTo(x + w, gy);
      ctx.stroke();
    }
    ctx.restore();
  };

  const drawSafeArea = (ctx, baseRect) => {
    const { x, y, w, h } = baseRect;
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = "#1e6bff";
    ctx.lineWidth = 2;
    const pad = Math.min(w, h) * 0.08;
    ctx.strokeRect(x + pad, y + pad, w - pad * 2, h - pad * 2);
    ctx.restore();
  };

  const redraw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const cw = canvas.width / dpr;
    const ch = canvas.height / dpr;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cw, ch);

    const baseImg = baseImgRef.current;
    const overlayImg = overlayImgRef.current;

    const baseRect = computeBaseRect(cw, ch, baseImg);
    drawStateRef.current.baseRect = baseRect;

    if (baseImg) {
      ctx.drawImage(baseImg, baseRect.x, baseRect.y, baseRect.w, baseRect.h);
    } else {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, cw, ch);
      ctx.fillStyle = "#1e6bff";
      ctx.font = "700 14px system-ui, -apple-system, Segoe UI, Roboto, Arial";
      ctx.fillText("Preview unavailable", 16, 28);
    }

    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = "#1e6bff";
    ctx.font = "800 26px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.rotate((-10 * Math.PI) / 180);
    ctx.fillText("PREVIEW", -10, ch * 0.7);
    ctx.restore();

    if (settings.showGrid) drawGrid(ctx, baseRect);
    if (settings.showSafeArea) drawSafeArea(ctx, baseRect);

    if (overlayImg) {
      const baseSize = Math.min(baseRect.w, baseRect.h);
      const target = baseSize * 0.36 * settings.scale;

      const ow = overlayImg.naturalWidth || overlayImg.width;
      const oh = overlayImg.naturalHeight || overlayImg.height;
      const ar = ow / oh;

      let w = target;
      let h = target;
      if (ar >= 1) h = target / ar;
      else w = target * ar;

      const centerX = settings.snapCenter
        ? baseRect.x + baseRect.w / 2
        : baseRect.x + baseRect.w * (0.5 + settings.offsetX / 100);

      const centerY = settings.snapCenter
        ? baseRect.y + baseRect.h / 2
        : baseRect.y + baseRect.h * (0.5 + settings.offsetY / 100);

      ctx.save();
      ctx.globalAlpha = clamp(settings.opacity, 0, 1);
      ctx.globalCompositeOperation = settings.blendMode;

      const filter = [
        `hue-rotate(${settings.hue}deg)`,
        `saturate(${settings.saturate}%)`,
        `brightness(${settings.brightness}%)`,
        `contrast(${settings.contrast}%)`,
        settings.blur > 0 ? `blur(${settings.blur}px)` : "",
      ]
        .filter(Boolean)
        .join(" ");

      ctx.filter = filter;

      if (settings.shadow > 0) {
        ctx.shadowColor = "rgba(30, 107, 255, 0.28)";
        ctx.shadowBlur = settings.shadow;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = settings.shadow > 10 ? 2 : 1;
      }

      ctx.translate(centerX, centerY);
      ctx.rotate((settings.rotate * Math.PI) / 180);

      const sx = settings.flipX ? -1 : 1;
      const sy = settings.flipY ? -1 : 1;
      ctx.scale(sx, sy);

      const rx = -w / 2;
      const ry = -h / 2;

      if (settings.radius > 0) {
        const r = clamp(settings.radius, 0, Math.min(w, h) / 2);
        ctx.beginPath();
        ctx.moveTo(rx + r, ry);
        ctx.arcTo(rx + w, ry, rx + w, ry + h, r);
        ctx.arcTo(rx + w, ry + h, rx, ry + h, r);
        ctx.arcTo(rx, ry + h, rx, ry, r);
        ctx.arcTo(rx, ry, rx + w, ry, r);
        ctx.closePath();
        ctx.clip();
      }

      ctx.drawImage(overlayImg, rx, ry, w, h);
      ctx.filter = "none";

      if (settings.border > 0) {
        ctx.shadowBlur = 0;
        ctx.strokeStyle = settings.borderColor;
        ctx.lineWidth = settings.border;
        if (settings.radius > 0) {
          const r = clamp(settings.radius, 0, Math.min(w, h) / 2);
          ctx.beginPath();
          ctx.moveTo(rx + r, ry);
          ctx.arcTo(rx + w, ry, rx + w, ry + h, r);
          ctx.arcTo(rx + w, ry + h, rx, ry + h, r);
          ctx.arcTo(rx, ry + h, rx, ry, r);
          ctx.arcTo(rx, ry, rx + w, ry, r);
          ctx.closePath();
          ctx.stroke();
        } else {
          ctx.strokeRect(rx, ry, w, h);
        }
      }

      ctx.restore();

      drawStateRef.current.overlayRect = { x: centerX - w / 2, y: centerY - h / 2, w, h };
      drawStateRef.current.overlayMeta = { w, h, cx: centerX, cy: centerY };
    } else {
      drawStateRef.current.overlayRect = { x: 0, y: 0, w: 0, h: 0 };
      drawStateRef.current.overlayMeta = { w: 0, h: 0, cx: 0, cy: 0 };
    }
  };

  const onPickProduct = (id) => {
    setSelectedProductId(id);
    setSelectedVariantIndex(0);
  };

  const readFileAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(String(e.target?.result || ""));
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });

  const applyOverlay = (dataUrl) => {
    setOverlayDataUrl(dataUrl);
    setSettings((s) => ({ ...defaultSettings, fineStep: s.fineStep }));
  };

  const onUploadWithBg = async (file) => {
    if (!file) return;
    const ok = /image\/(png|jpeg|jpg|webp)/i.test(file.type);
    if (!ok) return;
    const dataUrl = await readFileAsDataUrl(file);
    applyOverlay(dataUrl);
  };

  const onUploadWithoutBg = async (file) => {
    if (!file) return;
    const ok = /image\/(png|jpeg|jpg|webp)/i.test(file.type);
    if (!ok) return;

    setLoadingBgRemoval(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const processed = await removeWhiteBgToTransparent(dataUrl, 245);
      applyOverlay(processed);
    } catch {
      const dataUrl = await readFileAsDataUrl(file);
      applyOverlay(dataUrl);
    } finally {
      setLoadingBgRemoval(false);
    }
  };

  const clearAll = () => {
    setOverlayDataUrl("");
    setSettings((s) => ({ ...defaultSettings, fineStep: s.fineStep }));
    localStorage.removeItem(LS_KEYS.overlay);
    localStorage.removeItem(LS_KEYS.settings);
  };

  const resetSettings = () => setSettings((s) => ({ ...defaultSettings, fineStep: s.fineStep }));
  const setSetting = (key, value) => setSettings((s) => ({ ...s, [key]: value }));

  const isPointInOverlay = (x, y) => {
    const r = drawStateRef.current.overlayRect;
    if (!r || r.w <= 0 || r.h <= 0) return false;
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  };

  const toCanvasPoint = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, w: 1, h: 1 };
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0]?.clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0]?.clientY : e.clientY;
    const x = clamp(clientX - rect.left, 0, rect.width);
    const y = clamp(clientY - rect.top, 0, rect.height);
    return { x, y, w: rect.width, h: rect.height };
  };

  const onPointerDown = (e) => {
    if (!overlayImgRef.current) return;
    const p = toCanvasPoint(e);
    if (!isPointInOverlay(p.x, p.y)) return;
    dragRef.current.dragging = true;
    dragRef.current.lastX = p.x;
    dragRef.current.lastY = p.y;
  };

  const onPointerMove = (e) => {
    if (!dragRef.current.dragging) return;
    const p = toCanvasPoint(e);
    const dx = p.x - dragRef.current.lastX;
    const dy = p.y - dragRef.current.lastY;
    dragRef.current.lastX = p.x;
    dragRef.current.lastY = p.y;

    const baseRect = drawStateRef.current.baseRect;
    const bw = baseRect.w || p.w || 1;
    const bh = baseRect.h || p.h || 1;

    setSettings((s) => ({
      ...s,
      offsetX: clamp(s.offsetX + (dx / bw) * 100, -50, 50),
      offsetY: clamp(s.offsetY + (dy / bh) * 100, -50, 50),
    }));
  };

  const onPointerUp = () => {
    dragRef.current.dragging = false;
  };

  const quickAlign = (pos) => {
    if (!overlayImgRef.current) return;
    if (pos === "center") setSettings((s) => ({ ...s, offsetX: 0, offsetY: 0, snapCenter: true }));
    if (pos === "left") setSettings((s) => ({ ...s, snapCenter: false, offsetX: -35 }));
    if (pos === "right") setSettings((s) => ({ ...s, snapCenter: false, offsetX: 35 }));
    if (pos === "top") setSettings((s) => ({ ...s, snapCenter: false, offsetY: -35 }));
    if (pos === "bottom") setSettings((s) => ({ ...s, snapCenter: false, offsetY: 35 }));
  };

  const nudge = (dx, dy) => {
    setSettings((s) => ({
      ...s,
      snapCenter: false,
      offsetX: clamp(s.offsetX + dx * (s.fineStep / 2), -50, 50),
      offsetY: clamp(s.offsetY + dy * (s.fineStep / 2), -50, 50),
    }));
  };

  return (
    <>
      <Navbar />
      <div className="customization-page">
        <div className="customization-header">
          <div className="customization-title">Customize Your Product</div>
          <div className="customization-desc">
            Pick a product, upload your logo, and adjust it live in the preview.
          </div>
        </div>

        <div className="customization-shell">
          <div className="panel left-panel">
            <div className="panel-block">
              <div className="panel-title">Products</div>
              <div className="product-list">
                {PRODUCTS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`pill-btn ${p.id === selectedProductId ? "active" : ""}`}
                    onClick={() => onPickProduct(p.id)}
                  >
                    {p.title}
                  </button>
                ))}
              </div>
            </div>

            <div className="panel-block">
              <div className="panel-title">Variants</div>
              <div className="variant-grid">
                {selectedProduct.variants.map((src, idx) => (
                  <button
                    key={`${src}-${idx}`}
                    type="button"
                    className={`variant-tile ${
                      idx === clamp(selectedVariantIndex, 0, selectedProduct.variants.length - 1) ? "active" : ""
                    }`}
                    onClick={() => setSelectedVariantIndex(idx)}
                  >
                    <img src={src} alt={`${selectedProduct.title} ${idx + 1}`} />
                  </button>
                ))}
              </div>
            </div>

            <div className="panel-block">
              <div className="panel-title">Upload Logo</div>
              <div className="upload-stack">
                <label className={`upload-btn ${loadingBgRemoval ? "disabled" : ""}`}>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={(e) => onUploadWithBg(e.target.files?.[0])}
                    disabled={loadingBgRemoval}
                  />
                  Upload (With BG)
                </label>

                <label className={`upload-btn outline ${loadingBgRemoval ? "disabled" : ""}`}>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={(e) => onUploadWithoutBg(e.target.files?.[0])}
                    disabled={loadingBgRemoval}
                  />
                  Upload (Remove White BG)
                </label>

                <div className="mini-status">
                  {loadingBgRemoval
                    ? "Processing image..."
                    : overlayDataUrl
                    ? "Logo loaded, drag it in preview"
                    : "No logo selected"}
                </div>
              </div>
            </div>

            <div className="panel-block">
              <div className="panel-title">Quick Align</div>
              <div className="align-grid">
                <button className="btn small" type="button" onClick={() => quickAlign("top")} disabled={!overlayDataUrl}>
                  Top
                </button>
                <button className="btn small" type="button" onClick={() => quickAlign("center")} disabled={!overlayDataUrl}>
                  Center
                </button>
                <button className="btn small" type="button" onClick={() => quickAlign("bottom")} disabled={!overlayDataUrl}>
                  Bottom
                </button>
                <button className="btn small" type="button" onClick={() => quickAlign("left")} disabled={!overlayDataUrl}>
                  Left
                </button>
                <button className="btn small" type="button" onClick={() => quickAlign("right")} disabled={!overlayDataUrl}>
                  Right
                </button>
                <button className="btn small" type="button" onClick={() => setSetting("snapCenter", true)} disabled={!overlayDataUrl}>
                  Snap
                </button>
              </div>

              <div className="panel-sub">Precision Nudge</div>
              <div className="nudge-row">
                <button className="nudge" type="button" onClick={() => nudge(0, -1)} disabled={!overlayDataUrl}>
                  ▲
                </button>
                <div className="nudge-mid">
                  <button className="nudge" type="button" onClick={() => nudge(-1, 0)} disabled={!overlayDataUrl}>
                    ◀
                  </button>
                  <button className="nudge" type="button" onClick={() => nudge(1, 0)} disabled={!overlayDataUrl}>
                    ▶
                  </button>
                </div>
                <button className="nudge" type="button" onClick={() => nudge(0, 1)} disabled={!overlayDataUrl}>
                  ▼
                </button>
              </div>

              <div className="control">
                <div className="control-head">
                  <span>Fine Step</span>
                  <span className="control-val">{settings.fineStep}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={settings.fineStep}
                  onChange={(e) => setSetting("fineStep", Number(e.target.value))}
                  disabled={!overlayDataUrl}
                />
              </div>
            </div>
          </div>

          <div className="center-panel">
            <div className="preview-card">
              <div className="preview-header">
                <div className="preview-title">Live Preview</div>
                <div className="preview-sub">Drag the logo inside the preview</div>
              </div>

              <div className="preview-stage" ref={containerRef}>
                <canvas
                  ref={canvasRef}
                  className={`preview-canvas ${overlayDataUrl ? "draggable" : ""}`}
                  onMouseDown={onPointerDown}
                  onMouseMove={onPointerMove}
                  onMouseUp={onPointerUp}
                  onMouseLeave={onPointerUp}
                  onTouchStart={onPointerDown}
                  onTouchMove={onPointerMove}
                  onTouchEnd={onPointerUp}
                />
              </div>

              <div className="center-actions">
                <button className="btn outline" type="button" onClick={() => setSetting("showGrid", !settings.showGrid)}>
                  {settings.showGrid ? "Hide Grid" : "Show Grid"}
                </button>
                <button className="btn outline" type="button" onClick={() => setSetting("showSafeArea", !settings.showSafeArea)}>
                  {settings.showSafeArea ? "Hide Safe Area" : "Show Safe Area"}
                </button>
                <button className="btn soft" type="button" onClick={clearAll} disabled={loadingBgRemoval}>
                  Clear Logo
                </button>
              </div>
            </div>
          </div>

          <div className="panel right-panel">
            <div className="panel-block">
              <div className="panel-title">Controls</div>

              <div className="toggle-row">
                <button className={`chip ${settings.flipX ? "active" : ""}`} type="button" onClick={() => setSetting("flipX", !settings.flipX)} disabled={!overlayDataUrl}>
                  Flip X
                </button>
                <button className={`chip ${settings.flipY ? "active" : ""}`} type="button" onClick={() => setSetting("flipY", !settings.flipY)} disabled={!overlayDataUrl}>
                  Flip Y
                </button>
                <button className={`chip ${settings.snapCenter ? "active" : ""}`} type="button" onClick={() => setSetting("snapCenter", !settings.snapCenter)} disabled={!overlayDataUrl}>
                  Snap Center
                </button>
              </div>

              <div className="control">
                <div className="control-head">
                  <span>Size</span>
                  <span className="control-val">{settings.scale.toFixed(2)}x</span>
                </div>
                <input type="range" min="0.25" max="3.2" step="0.01" value={settings.scale} onChange={(e) => setSetting("scale", Number(e.target.value))} disabled={!overlayDataUrl} />
              </div>

              <div className="control">
                <div className="control-head">
                  <span>Rotate</span>
                  <span className="control-val">{Math.round(settings.rotate)}°</span>
                </div>
                <input type="range" min="-180" max="180" step="1" value={settings.rotate} onChange={(e) => setSetting("rotate", Number(e.target.value))} disabled={!overlayDataUrl} />
              </div>

              <div className="control">
                <div className="control-head">
                  <span>Opacity</span>
                  <span className="control-val">{Math.round(settings.opacity * 100)}%</span>
                </div>
                <input type="range" min="0.05" max="1" step="0.01" value={settings.opacity} onChange={(e) => setSetting("opacity", Number(e.target.value))} disabled={!overlayDataUrl} />
              </div>

              <div className="control">
                <div className="control-head">
                  <span>Move X</span>
                  <span className="control-val">{Math.round(settings.offsetX)}%</span>
                </div>
                <input type="range" min="-50" max="50" step="1" value={settings.offsetX} onChange={(e) => setSetting("offsetX", Number(e.target.value))} disabled={!overlayDataUrl} />
              </div>

              <div className="control">
                <div className="control-head">
                  <span>Move Y</span>
                  <span className="control-val">{Math.round(settings.offsetY)}%</span>
                </div>
                <input type="range" min="-50" max="50" step="1" value={settings.offsetY} onChange={(e) => setSetting("offsetY", Number(e.target.value))} disabled={!overlayDataUrl} />
              </div>
            </div>

            <div className="panel-block">
              <div className="panel-title">Effects</div>

              <div className="control">
                <div className="control-head">
                  <span>Blend Mode</span>
                  <span className="control-val">{settings.blendMode}</span>
                </div>
                <select className="select" value={settings.blendMode} onChange={(e) => setSetting("blendMode", e.target.value)} disabled={!overlayDataUrl}>
                  <option value="source-over">Normal</option>
                  <option value="multiply">Multiply</option>
                  <option value="screen">Screen</option>
                  <option value="overlay">Overlay</option>
                  <option value="darken">Darken</option>
                  <option value="lighten">Lighten</option>
                  <option value="color-dodge">Color Dodge</option>
                  <option value="color-burn">Color Burn</option>
                  <option value="hard-light">Hard Light</option>
                  <option value="soft-light">Soft Light</option>
                </select>
              </div>

              <div className="control">
                <div className="control-head">
                  <span>Shadow</span>
                  <span className="control-val">{settings.shadow}px</span>
                </div>
                <input type="range" min="0" max="30" step="1" value={settings.shadow} onChange={(e) => setSetting("shadow", Number(e.target.value))} disabled={!overlayDataUrl} />
              </div>

              <div className="control">
                <div className="control-head">
                  <span>Border</span>
                  <span className="control-val">{settings.border}px</span>
                </div>
                <input type="range" min="0" max="12" step="1" value={settings.border} onChange={(e) => setSetting("border", Number(e.target.value))} disabled={!overlayDataUrl} />
              </div>

              <div className="control">
                <div className="control-head">
                  <span>Border Color</span>
                  <span className="control-val">{settings.borderColor}</span>
                </div>
                <input type="color" className="color" value={settings.borderColor} onChange={(e) => setSetting("borderColor", e.target.value)} disabled={!overlayDataUrl} />
              </div>

              <div className="control">
                <div className="control-head">
                  <span>Roundness</span>
                  <span className="control-val">{settings.radius}px</span>
                </div>
                <input type="range" min="0" max="60" step="1" value={settings.radius} onChange={(e) => setSetting("radius", Number(e.target.value))} disabled={!overlayDataUrl} />
              </div>

              <div className="control">
                <div className="control-head">
                  <span>Blur</span>
                  <span className="control-val">{settings.blur}px</span>
                </div>
                <input type="range" min="0" max="12" step="1" value={settings.blur} onChange={(e) => setSetting("blur", Number(e.target.value))} disabled={!overlayDataUrl} />
              </div>

              <div className="control">
                <div className="control-head">
                  <span>Hue</span>
                  <span className="control-val">{settings.hue}°</span>
                </div>
                <input type="range" min="-180" max="180" step="1" value={settings.hue} onChange={(e) => setSetting("hue", Number(e.target.value))} disabled={!overlayDataUrl} />
              </div>

              <div className="control">
                <div className="control-head">
                  <span>Saturation</span>
                  <span className="control-val">{settings.saturate}%</span>
                </div>
                <input type="range" min="0" max="220" step="1" value={settings.saturate} onChange={(e) => setSetting("saturate", Number(e.target.value))} disabled={!overlayDataUrl} />
              </div>

              <div className="control">
                <div className="control-head">
                  <span>Brightness</span>
                  <span className="control-val">{settings.brightness}%</span>
                </div>
                <input type="range" min="40" max="180" step="1" value={settings.brightness} onChange={(e) => setSetting("brightness", Number(e.target.value))} disabled={!overlayDataUrl} />
              </div>

              <div className="control">
                <div className="control-head">
                  <span>Contrast</span>
                  <span className="control-val">{settings.contrast}%</span>
                </div>
                <input type="range" min="40" max="180" step="1" value={settings.contrast} onChange={(e) => setSetting("contrast", Number(e.target.value))} disabled={!overlayDataUrl} />
              </div>

              <div className="right-actions">
                <button className="btn outline" type="button" onClick={resetSettings} disabled={loadingBgRemoval}>
                  Reset Controls
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
