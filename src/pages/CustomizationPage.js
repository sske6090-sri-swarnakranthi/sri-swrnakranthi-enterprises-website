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

const defaultSettings = { offsetX: 0, offsetY: 0, scale: 1, rotate: 0, opacity: 1 };

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
      initialSettings = {
        offsetX: Number.isFinite(Number(parsed.offsetX)) ? Number(parsed.offsetX) : defaultSettings.offsetX,
        offsetY: Number.isFinite(Number(parsed.offsetY)) ? Number(parsed.offsetY) : defaultSettings.offsetY,
        scale: Number.isFinite(Number(parsed.scale)) ? Number(parsed.scale) : defaultSettings.scale,
        rotate: Number.isFinite(Number(parsed.rotate)) ? Number(parsed.rotate) : defaultSettings.rotate,
        opacity: Number.isFinite(Number(parsed.opacity)) ? Number(parsed.opacity) : defaultSettings.opacity,
      };
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
  const drawStateRef = useRef({ baseRect: { x: 0, y: 0, w: 0, h: 0 }, overlayRect: { x: 0, y: 0, w: 0, h: 0 } });
  const dragRef = useRef({ dragging: false, lastX: 0, lastY: 0 });

  useEffect(() => {
    localStorage.setItem(LS_KEYS.product, selectedProductId);
  }, [selectedProductId]);

  useEffect(() => {
    localStorage.setItem(LS_KEYS.variant, String(selectedVariantIndex));
  }, [selectedVariantIndex]);

  useEffect(() => {
    localStorage.setItem(LS_KEYS.overlay, overlayDataUrl || "");
  }, [overlayDataUrl]);

  useEffect(() => {
    localStorage.setItem(LS_KEYS.settings, JSON.stringify(settings));
  }, [settings]);

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

  useEffect(() => {
    redraw();
  }, [settings]);

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const w = Math.max(280, Math.floor(entry.contentRect.width));
      const h = Math.max(280, Math.floor(entry.contentRect.height));
      const canvas = canvasRef.current;
      canvas.width = w * (window.devicePixelRatio || 1);
      canvas.height = h * (window.devicePixelRatio || 1);
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
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, cw, ch);
      ctx.fillStyle = "#ffffff";
      ctx.font = "600 16px system-ui, -apple-system, Segoe UI, Roboto, Arial";
      ctx.fillText("Preview unavailable", 16, 28);
    }

    if (overlayImg) {
      const baseSize = Math.min(baseRect.w, baseRect.h);
      const target = baseSize * 0.35 * settings.scale;

      const ow = overlayImg.naturalWidth || overlayImg.width;
      const oh = overlayImg.naturalHeight || overlayImg.height;
      const ar = ow / oh;

      let w = target;
      let h = target;
      if (ar >= 1) h = target / ar;
      else w = target * ar;

      const centerX = baseRect.x + baseRect.w * (0.5 + settings.offsetX / 100);
      const centerY = baseRect.y + baseRect.h * (0.5 + settings.offsetY / 100);

      ctx.save();
      ctx.globalAlpha = clamp(settings.opacity, 0, 1);
      ctx.translate(centerX, centerY);
      ctx.rotate((settings.rotate * Math.PI) / 180);
      ctx.drawImage(overlayImg, -w / 2, -h / 2, w, h);
      ctx.restore();

      drawStateRef.current.overlayRect = { x: centerX - w / 2, y: centerY - h / 2, w, h };
    } else {
      drawStateRef.current.overlayRect = { x: 0, y: 0, w: 0, h: 0 };
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
    setSettings({ ...defaultSettings });
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
    setSettings({ ...defaultSettings });
    localStorage.removeItem(LS_KEYS.overlay);
    localStorage.removeItem(LS_KEYS.settings);
  };

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

  const exportPreview = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `custom-preview-${selectedProductId}.png`;
    link.click();
  };

  return (
    <>
      <Navbar />
      <div className="customization-page">
        <div className="customization-layout">
          <aside className="customization-sidebar">
            <div className="sidebar-block">
              <div className="sidebar-heading">Products</div>
              <div className="product-list">
                {PRODUCTS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`product-pill ${p.id === selectedProductId ? "active" : ""}`}
                    onClick={() => onPickProduct(p.id)}
                  >
                    {p.title}
                  </button>
                ))}
              </div>
            </div>

            <div className="sidebar-block">
              <div className="sidebar-heading">Variants</div>
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

            <div className="sidebar-block">
              <div className="sidebar-heading">Controls</div>

              <div className="control">
                <div className="control-row">
                  <span>Size</span>
                  <span className="control-value">{settings.scale.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.3"
                  max="3"
                  step="0.01"
                  value={settings.scale}
                  onChange={(e) => setSetting("scale", Number(e.target.value))}
                  disabled={!overlayDataUrl}
                />
              </div>

              <div className="control">
                <div className="control-row">
                  <span>Rotate</span>
                  <span className="control-value">{Math.round(settings.rotate)}°</span>
                </div>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="1"
                  value={settings.rotate}
                  onChange={(e) => setSetting("rotate", Number(e.target.value))}
                  disabled={!overlayDataUrl}
                />
              </div>

              <div className="control">
                <div className="control-row">
                  <span>Opacity</span>
                  <span className="control-value">{Math.round(settings.opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.01"
                  value={settings.opacity}
                  onChange={(e) => setSetting("opacity", Number(e.target.value))}
                  disabled={!overlayDataUrl}
                />
              </div>

              <div className="control">
                <div className="control-row">
                  <span>Move X</span>
                  <span className="control-value">{Math.round(settings.offsetX)}%</span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  step="1"
                  value={settings.offsetX}
                  onChange={(e) => setSetting("offsetX", Number(e.target.value))}
                  disabled={!overlayDataUrl}
                />
              </div>

              <div className="control">
                <div className="control-row">
                  <span>Move Y</span>
                  <span className="control-value">{Math.round(settings.offsetY)}%</span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  step="1"
                  value={settings.offsetY}
                  onChange={(e) => setSetting("offsetY", Number(e.target.value))}
                  disabled={!overlayDataUrl}
                />
              </div>
            </div>
          </aside>

          <main className="customization-main">
            <div className="preview-card">
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

              <div className="below-actions">
                <div className="upload-group">
                  <label className={`upload-btn ${loadingBgRemoval ? "disabled" : ""}`}>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={(e) => onUploadWithBg(e.target.files?.[0])}
                      disabled={loadingBgRemoval}
                    />
                    Upload (With BG)
                  </label>

                  <label className={`upload-btn secondary ${loadingBgRemoval ? "disabled" : ""}`}>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={(e) => onUploadWithoutBg(e.target.files?.[0])}
                      disabled={loadingBgRemoval}
                    />
                    Upload (No White BG)
                  </label>
                </div>

                <div className="action-group">
                  <button className="btn secondary" onClick={clearAll} type="button" disabled={loadingBgRemoval}>
                    Clear
                  </button>
                  <button className="btn" onClick={exportPreview} type="button" disabled={loadingBgRemoval}>
                    Download Preview
                  </button>
                </div>
              </div>

              <div className="status-row">
                <div className="status-left">
                  <span className="dot" />
                  <span className="status-text">
                    {loadingBgRemoval ? "Removing background..." : "Tip: Upload a PNG logo for best results."}
                  </span>
                </div>
                <div className="status-right">
                  {overlayDataUrl ? <div className="pill">Logo added</div> : <div className="pill muted">No logo</div>}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
