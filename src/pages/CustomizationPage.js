import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Navbar from "./Navbar";
import "./CustomizationPage.css";

const LS_KEYS = {
  product: "customization_selected_product",
  variant: "customization_selected_variant",
  overlay: "customization_overlay_image",
  settings: "customization_settings",
};

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const getPublicImg = (name) => `/images/banners/customize/${name}`;

const PRODUCTS = [
  {
    id: "tshirts",
    title: "T-Shirts",
    variants: [
      getPublicImg("t-shirt-white.jpg"),
      getPublicImg("t-shirt-black.jpg"),
      getPublicImg("t-shirt-brown.jpg"),
      getPublicImg("t-shirt-biege.jpg"),
      getPublicImg("t-shirt-lite-blue.jpg"),
      getPublicImg("t-shirt-purple.jpg"),
    ],
  },
  {
    id: "mugs",
    title: "Mugs",
    variants: [getPublicImg("mug-1.jpg"), getPublicImg("mug-2.jpg"), getPublicImg("mug-3.jpg")],
  },
  {
    id: "keychains",
    title: "Key-chains",
    variants: [getPublicImg("key-chain-1.jpg"), getPublicImg("key-chain-2.jpg"), getPublicImg("key-chain-3.jpg")],
  },
  {
    id: "visiting_cards",
    title: "Visiting Cards",
    variants: [
      getPublicImg("visiting-card-1.jpg"),
      getPublicImg("visiting-card-2.jpg"),
      getPublicImg("visiting-card-3.jpg"),
      getPublicImg("visiting-card-4.jpg"),
      getPublicImg("visiting-card-5.png"),
      getPublicImg("visiting-card-6.jpg"),
      getPublicImg("visiting-card-7.jpg"),
    ],
  },
  {
    id: "pamphlets",
    title: "Pamphlets",
    variants: [
      getPublicImg("pamplete-1.jpg"),
      getPublicImg("pamplete-2.jpg"),
      getPublicImg("pamplete-3.jpg"),
      getPublicImg("pamplete-4.jpg"),
      getPublicImg("pamplete-5.jpg"),
      getPublicImg("pamplete-6.jpg"),
    ],
  },
  {
    id: "wedding_cards",
    title: "Wedding Cards",
    variants: [
      getPublicImg("wedding-card-1.jpg"),
      getPublicImg("wedding-card-2.png"),
      getPublicImg("wedding-card-3.png"),
      getPublicImg("wedding-card-4.png"),
      getPublicImg("wedding-card-5.png"),
      getPublicImg("wedding-card-6.png"),
    ],
  },
  {
    id: "id_cards",
    title: "ID Cards",
    variants: [getPublicImg("id-card-1.jpg"), getPublicImg("id-card-2.jpg"), getPublicImg("id-card-3.jpg")],
  },
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
  fineStep: 2,
  snapToGrid: false,
  constrainToSafeArea: true,
  safeAreaPadPct: 0.08,
  bgThreshold: 245,
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
        if (r >= threshold && g >= threshold && b >= threshold) d[i + 3] = 0;
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
  const [toast, setToast] = useState("");

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const baseImgRef = useRef(null);
  const overlayImgRef = useRef(null);

  const drawStateRef = useRef({
    baseRect: { x: 0, y: 0, w: 0, h: 0 },
    safeRect: { x: 0, y: 0, w: 0, h: 0 },
    overlayMeta: { cx: 0, cy: 0, w: 0, h: 0, rotate: 0, flipX: false, flipY: false },
  });

  const dragRef = useRef({ dragging: false, lastX: 0, lastY: 0, pointerId: null });

  const selectedProduct = useMemo(
    () => PRODUCTS.find((p) => p.id === selectedProductId) || PRODUCTS[0],
    [selectedProductId]
  );

  const baseImageUrl = useMemo(() => {
    const idx = clamp(selectedVariantIndex, 0, selectedProduct.variants.length - 1);
    return selectedProduct.variants[idx];
  }, [selectedProduct, selectedVariantIndex]);

  const computeBaseRect = useCallback((cw, ch, img) => {
    if (!img) return { x: 0, y: 0, w: cw, h: ch };
    const imgW = img.naturalWidth || img.width;
    const imgH = img.naturalHeight || img.height;
    const scale = Math.min(cw / imgW, ch / imgH);
    const w = imgW * scale;
    const h = imgH * scale;
    const x = (cw - w) / 2;
    const y = (ch - h) / 2;
    return { x, y, w, h };
  }, []);

  const drawGrid = useCallback((ctx, baseRect) => {
    const { x, y, w, h } = baseRect;
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.strokeStyle = "#1e6bff";
    ctx.lineWidth = 1;
    const cols = 8;
    const rows = 8;
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
  }, []);

  const drawSafeArea = useCallback((ctx, baseRect, padPct) => {
    const { x, y, w, h } = baseRect;
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = "#1e6bff";
    ctx.lineWidth = 2;
    const pad = Math.min(w, h) * padPct;
    ctx.strokeRect(x + pad, y + pad, w - pad * 2, h - pad * 2);
    ctx.restore();
  }, []);

  const getSafeRect = useCallback((baseRect, padPct) => {
    const pad = Math.min(baseRect.w, baseRect.h) * padPct;
    return { x: baseRect.x + pad, y: baseRect.y + pad, w: baseRect.w - pad * 2, h: baseRect.h - pad * 2 };
  }, []);

  const offsetsFromCenter = useCallback((cx, cy, baseRect) => {
    const ox = ((cx - baseRect.x) / (baseRect.w || 1) - 0.5) * 100;
    const oy = ((cy - baseRect.y) / (baseRect.h || 1) - 0.5) * 100;
    return { ox: clamp(ox, -50, 50), oy: clamp(oy, -50, 50) };
  }, []);

  const centerFromOffsets = useCallback((s, baseRect) => {
    const cx = s.snapCenter ? baseRect.x + baseRect.w / 2 : baseRect.x + baseRect.w * (0.5 + s.offsetX / 100);
    const cy = s.snapCenter ? baseRect.y + baseRect.h / 2 : baseRect.y + baseRect.h * (0.5 + s.offsetY / 100);
    return { cx, cy };
  }, []);

  const snapPercent = useCallback((valPct, stepPct = 2) => {
    const step = Math.max(0.5, stepPct);
    return Math.round(valPct / step) * step;
  }, []);

  const normalizeAfterMove = useCallback(
    (next, baseRect) => {
      const safeRect = getSafeRect(baseRect, next.safeAreaPadPct);
      let { cx, cy } = centerFromOffsets(next, baseRect);

      if (next.snapToGrid) {
        const nx = snapPercent(next.offsetX, 2);
        const ny = snapPercent(next.offsetY, 2);
        next = { ...next, offsetX: clamp(nx, -50, 50), offsetY: clamp(ny, -50, 50), snapCenter: false };
        const c2 = centerFromOffsets(next, baseRect);
        cx = c2.cx;
        cy = c2.cy;
      }

      if (next.constrainToSafeArea) {
        const meta = drawStateRef.current.overlayMeta;
        const halfW = (meta.w || 0) / 2;
        const halfH = (meta.h || 0) / 2;
        const minX = safeRect.x + halfW;
        const maxX = safeRect.x + safeRect.w - halfW;
        const minY = safeRect.y + halfH;
        const maxY = safeRect.y + safeRect.h - halfH;

        const ccx = clamp(cx, minX, maxX);
        const ccy = clamp(cy, minY, maxY);

        const { ox, oy } = offsetsFromCenter(ccx, ccy, baseRect);
        next = { ...next, offsetX: ox, offsetY: oy, snapCenter: false };
      }

      return next;
    },
    [centerFromOffsets, getSafeRect, offsetsFromCenter, snapPercent]
  );

  const redraw = useCallback(() => {
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

    const safeRect = getSafeRect(baseRect, settings.safeAreaPadPct);
    drawStateRef.current.safeRect = safeRect;

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
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = "#1e6bff";
    ctx.font = "900 28px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.rotate((-10 * Math.PI) / 180);
    ctx.fillText("LIVE PREVIEW", -10, ch * 0.7);
    ctx.restore();

    if (settings.showGrid) drawGrid(ctx, baseRect);
    if (settings.showSafeArea) drawSafeArea(ctx, baseRect, settings.safeAreaPadPct);

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

      const { cx: centerX, cy: centerY } = centerFromOffsets(settings, baseRect);

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
        ctx.shadowColor = "rgba(30, 107, 255, 0.25)";
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

      if (settings.border > 0) {
        ctx.filter = "none";
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

      drawStateRef.current.overlayMeta = { cx: centerX, cy: centerY, w, h, rotate: settings.rotate, flipX: settings.flipX, flipY: settings.flipY };
    } else {
      drawStateRef.current.overlayMeta = { cx: 0, cy: 0, w: 0, h: 0, rotate: 0, flipX: false, flipY: false };
    }
  }, [centerFromOffsets, computeBaseRect, drawGrid, drawSafeArea, getSafeRect, settings]);

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
      return true;
    };

    document.addEventListener("contextmenu", blockContext);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("contextmenu", blockContext);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(""), 1800);
    return () => window.clearTimeout(t);
  }, [toast]);

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
  }, [baseImageUrl, redraw]);

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
  }, [overlayDataUrl, redraw]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  useEffect(() => {
  if (!containerRef.current || !canvasRef.current) return;

  const el = containerRef.current;
  const canvas = canvasRef.current;

  let rafId = 0;
  let lastW = 0;
  let lastH = 0;

  const applySize = (w, h) => {
    const dpr = window.devicePixelRatio || 1;

    if (w === lastW && h === lastH) return;
    lastW = w;
    lastH = h;

    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
  };

  const ro = new ResizeObserver((entries) => {
    const entry = entries[0];
    if (!entry) return;

    const w = Math.max(320, Math.floor(entry.contentRect.width));
    const h = Math.max(380, Math.floor(entry.contentRect.height));

    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      applySize(w, h);
      redraw();
    });
  });

  ro.observe(el);

  return () => {
    cancelAnimationFrame(rafId);
    ro.disconnect();
  };
}, [redraw]);

  useEffect(() => {
    setSelectedVariantIndex((idx) => clamp(idx, 0, selectedProduct.variants.length - 1));
  }, [selectedProduct]);

  const onPickProduct = (id) => {
    setSelectedProductId(id);
    setSelectedVariantIndex(0);
    setToast("Product changed");
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
    setSettings((s) => ({
      ...defaultSettings,
      fineStep: s.fineStep,
      showGrid: s.showGrid,
      showSafeArea: s.showSafeArea,
      snapToGrid: s.snapToGrid,
      constrainToSafeArea: s.constrainToSafeArea,
      safeAreaPadPct: s.safeAreaPadPct,
      bgThreshold: s.bgThreshold,
    }));
    setToast("Logo loaded");
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
      const processed = await removeWhiteBgToTransparent(dataUrl, clamp(settings.bgThreshold, 200, 255));
      applyOverlay(processed);
    } catch {
      const dataUrl = await readFileAsDataUrl(file);
      applyOverlay(dataUrl);
    } finally {
      setLoadingBgRemoval(false);
    }
  };

  const clearLogo = () => {
    setOverlayDataUrl("");
    setSettings((s) => ({
      ...defaultSettings,
      fineStep: s.fineStep,
      showGrid: s.showGrid,
      showSafeArea: s.showSafeArea,
      snapToGrid: s.snapToGrid,
      constrainToSafeArea: s.constrainToSafeArea,
      safeAreaPadPct: s.safeAreaPadPct,
      bgThreshold: s.bgThreshold,
    }));
    localStorage.removeItem(LS_KEYS.overlay);
    localStorage.removeItem(LS_KEYS.settings);
    setToast("Logo cleared");
  };

  const resetSettings = () => {
    setSettings((s) => ({
      ...defaultSettings,
      fineStep: s.fineStep,
      showGrid: s.showGrid,
      showSafeArea: s.showSafeArea,
      snapToGrid: s.snapToGrid,
      constrainToSafeArea: s.constrainToSafeArea,
      safeAreaPadPct: s.safeAreaPadPct,
      bgThreshold: s.bgThreshold,
    }));
    setToast("Controls reset");
  };

  const setSetting = (key, value) => setSettings((s) => ({ ...s, [key]: value }));

  const isPointInOverlay = useCallback((x, y) => {
    const meta = drawStateRef.current.overlayMeta;
    if (!meta || meta.w <= 0 || meta.h <= 0) return false;

    let lx = x - meta.cx;
    let ly = y - meta.cy;

    const rad = (-meta.rotate * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const rx = lx * cos - ly * sin;
    const ry = lx * sin + ly * cos;

    const fx = meta.flipX ? -1 : 1;
    const fy = meta.flipY ? -1 : 1;
    const ux = rx * fx;
    const uy = ry * fy;

    return ux >= -meta.w / 2 && ux <= meta.w / 2 && uy >= -meta.h / 2 && uy <= meta.h / 2;
  }, []);

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

    if ("touches" in e) e.preventDefault?.();

    dragRef.current.dragging = true;
    dragRef.current.lastX = p.x;
    dragRef.current.lastY = p.y;

    const canvas = canvasRef.current;
    if (canvas && "pointerId" in e && typeof e.pointerId === "number") {
      dragRef.current.pointerId = e.pointerId;
      try {
        canvas.setPointerCapture?.(e.pointerId);
      } catch {}
    }
  };

  const onPointerMove = (e) => {
    if (!dragRef.current.dragging) return;
    const p = toCanvasPoint(e);

    if ("touches" in e) e.preventDefault?.();

    const dx = p.x - dragRef.current.lastX;
    const dy = p.y - dragRef.current.lastY;
    dragRef.current.lastX = p.x;
    dragRef.current.lastY = p.y;

    const baseRect = drawStateRef.current.baseRect;
    const bw = baseRect.w || p.w || 1;
    const bh = baseRect.h || p.h || 1;

    setSettings((s) => {
      const next = {
        ...s,
        snapCenter: false,
        offsetX: clamp(s.offsetX + (dx / bw) * 100, -50, 50),
        offsetY: clamp(s.offsetY + (dy / bh) * 100, -50, 50),
      };
      return normalizeAfterMove(next, baseRect);
    });
  };

  const onPointerUp = (e) => {
    dragRef.current.dragging = false;
    const canvas = canvasRef.current;
    if (canvas && dragRef.current.pointerId != null) {
      try {
        canvas.releasePointerCapture?.(dragRef.current.pointerId);
      } catch {}
    }
    dragRef.current.pointerId = null;

    if (e?.type === "dblclick") {
      setSettings((s) => ({ ...s, snapCenter: true, offsetX: 0, offsetY: 0 }));
      setToast("Centered");
    }
  };

  const quickAlign = (pos) => {
    if (!overlayImgRef.current) return;
    const baseRect = drawStateRef.current.baseRect;

    const setAligned = (nextPartial) => {
      setSettings((s) => {
        const next = { ...s, ...nextPartial };
        return normalizeAfterMove(next, baseRect);
      });
    };

    if (pos === "center") setAligned({ offsetX: 0, offsetY: 0, snapCenter: true });
    if (pos === "left") setAligned({ snapCenter: false, offsetX: -35 });
    if (pos === "right") setAligned({ snapCenter: false, offsetX: 35 });
    if (pos === "top") setAligned({ snapCenter: false, offsetY: -35 });
    if (pos === "bottom") setAligned({ snapCenter: false, offsetY: 35 });

    setToast("Aligned");
  };

  const nudge = (dx, dy) => {
    const baseRect = drawStateRef.current.baseRect;
    setSettings((s) => {
      const step = Math.max(0.5, s.fineStep / 2);
      const next = {
        ...s,
        snapCenter: false,
        offsetX: clamp(s.offsetX + dx * step, -50, 50),
        offsetY: clamp(s.offsetY + dy * step, -50, 50),
      };
      return normalizeAfterMove(next, baseRect);
    });
  };

  const onWheel = (e) => {
    if (!overlayDataUrl) return;
    e.preventDefault();

    const delta = Math.sign(e.deltaY || 0);
    setSettings((s) => {
      let next = { ...s };

      if (e.shiftKey) {
        next.rotate = clamp(next.rotate + delta * 3, -180, 180);
        return next;
      }

      if (e.altKey) {
        next.opacity = clamp(next.opacity + delta * -0.03, 0.05, 1);
        return next;
      }

      const mult = delta > 0 ? 0.96 : 1.04;
      next.scale = clamp(next.scale * mult, 0.25, 3.2);
      return next;
    });
  };

  useEffect(() => {
    if (!overlayDataUrl) return;

    const onKeys = (e) => {
      const key = e.key?.toLowerCase?.() || "";
      const big = e.shiftKey ? 3 : 1;

      if (["arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) e.preventDefault();

      if (key === "arrowup") nudge(0, -big);
      if (key === "arrowdown") nudge(0, big);
      if (key === "arrowleft") nudge(-big, 0);
      if (key === "arrowright") nudge(big, 0);

      if (key === "+" || key === "=") setSettings((s) => ({ ...s, scale: clamp(s.scale * 1.05, 0.25, 3.2) }));
      if (key === "-" || key === "_") setSettings((s) => ({ ...s, scale: clamp(s.scale * 0.95, 0.25, 3.2) }));

      if (key === "r") setSettings((s) => ({ ...s, rotate: clamp(s.rotate + (e.shiftKey ? -5 : 5), -180, 180) }));

      if (key === "0") {
        setSettings((s) => ({ ...s, snapCenter: true, offsetX: 0, offsetY: 0 }));
        setToast("Centered");
      }
    };

    window.addEventListener("keydown", onKeys, { passive: false });
    return () => window.removeEventListener("keydown", onKeys);
  }, [overlayDataUrl]);

  const exportPreview = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `customized-${selectedProductId}-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setToast("Exported PNG");
    } catch {
      setToast("Export failed");
    }
  };

  const activeVariantIndex = clamp(selectedVariantIndex, 0, selectedProduct.variants.length - 1);

  return (
    <>
      <Navbar />

      <div className="customization-page">
        <div className="customization-header">
          <div className="customization-title-row">
            <div>
              <div className="customization-title">Customize Your Product</div>
              <div className="customization-desc">
                Pick a product, upload your logo, drag it in the preview, then fine tune with sliders or wheel controls.
              </div>
            </div>

            <div className="header-actions">
              <button className="btn outline small" type="button" onClick={exportPreview}>
                Export PNG
              </button>
              <button className="btn soft small" type="button" onClick={resetSettings} disabled={loadingBgRemoval}>
                Reset Controls
              </button>
            </div>
          </div>
        </div>

        <div className="customization-shell">
          <div
            className="panel left-panel"
            style={{ overflowY: "auto", maxHeight: "calc(100vh - 140px)" }}
          >
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
              <div className="panel-title">Quick Align</div>
              <div className="align-grid" style={{ display: "flex", gap: 8, flexWrap: "nowrap", overflowX: "auto" }}>
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
              <div className="nudge-row" style={{ display: "flex", gap: 8, justifyContent: "center", alignItems: "center" }}>
                <button className="nudge" type="button" onClick={() => nudge(0, -1)} disabled={!overlayDataUrl}>
                  ▲
                </button>
                <button className="nudge" type="button" onClick={() => nudge(-1, 0)} disabled={!overlayDataUrl}>
                  ◀
                </button>
                <button className="nudge" type="button" onClick={() => nudge(1, 0)} disabled={!overlayDataUrl}>
                  ▶
                </button>
                <button className="nudge" type="button" onClick={() => nudge(0, 1)} disabled={!overlayDataUrl}>
                  ▼
                </button>
              </div>

              <div className="control compact">
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
                <div className="preview-sub">
                  Drag logo, wheel to resize, Shift+wheel rotate, Alt+wheel opacity, double click to center.
                </div>
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
                  onDoubleClick={onPointerUp}
                  onWheel={onWheel}
                />
                {!overlayDataUrl ? (
                  <div className="empty-overlay-hint">
                    <div className="hint-title">Upload your logo to begin</div>
                    <div className="hint-sub">Try the remove-white option for clean PNG like results.</div>
                  </div>
                ) : null}
              </div>

              <div className="panel-block" style={{ paddingTop: 10 }}>
                <div className="panel-title">Variants</div>
                <div
                  className="variant-grid"
                  style={{
                    display: "flex",
                    gap: 10,
                    justifyContent: "center",
                    flexWrap: "nowrap",
                    overflowX: "auto",
                    paddingBottom: 6,
                  }}
                >
                  {selectedProduct.variants.map((src, idx) => (
                    <button
                      key={`${src}-${idx}`}
                      type="button"
                      className={`variant-tile ${idx === activeVariantIndex ? "active" : ""}`}
                      onClick={() => setSelectedVariantIndex(idx)}
                      title={`${selectedProduct.title} ${idx + 1}`}
                      style={{ flex: "0 0 auto" }}
                    >
                      <img src={src} alt={`${selectedProduct.title} ${idx + 1}`} loading="lazy" />
                      <div className="variant-badge">{idx + 1}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="panel-block" style={{ paddingTop: 0 }}>
                <div className="panel-title">Upload Logo</div>

                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "nowrap", overflowX: "auto" }}>
                  <label className={`upload-btn small ${loadingBgRemoval ? "disabled" : ""}`} style={{ flex: "0 0 auto" }}>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={(e) => onUploadWithBg(e.target.files?.[0])}
                      disabled={loadingBgRemoval}
                    />
                    Upload (With BG)
                  </label>

                  <label className={`upload-btn outline small ${loadingBgRemoval ? "disabled" : ""}`} style={{ flex: "0 0 auto" }}>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={(e) => onUploadWithoutBg(e.target.files?.[0])}
                      disabled={loadingBgRemoval}
                    />
                    Remove White BG
                  </label>

                  <button
                    className="btn outline small"
                    type="button"
                    onClick={() => setToast("Tip: Double click preview to center")}
                    style={{ flex: "0 0 auto" }}
                  >
                    Tips
                  </button>

                  <button className="btn soft small" type="button" onClick={clearLogo} disabled={loadingBgRemoval} style={{ flex: "0 0 auto" }}>
                    Clear
                  </button>
                </div>

                <div className="control compact" style={{ marginTop: 10 }}>
                  <div className="control-head">
                    <span>BG Threshold</span>
                    <span className="control-val">{settings.bgThreshold}</span>
                  </div>
                  <input
                    type="range"
                    min="200"
                    max="255"
                    step="1"
                    value={settings.bgThreshold}
                    onChange={(e) => setSetting("bgThreshold", Number(e.target.value))}
                  />
                  <div className="hint">Higher removes more near-white. If your logo is getting eaten, reduce it.</div>
                </div>

                <div className="mini-status" style={{ marginTop: 8 }}>
                  {loadingBgRemoval
                    ? "Processing image..."
                    : overlayDataUrl
                    ? "Logo loaded. Drag, scroll to size, Shift+scroll to rotate."
                    : "No logo selected"}
                </div>
              </div>

              <div
                className="center-actions"
                style={{ display: "flex", gap: 10, flexWrap: "nowrap", overflowX: "auto", justifyContent: "center" }}
              >
                <button className="btn outline small" type="button" onClick={() => setSetting("showGrid", !settings.showGrid)}>
                  {settings.showGrid ? "Hide Grid" : "Show Grid"}
                </button>

                <button className="btn outline small" type="button" onClick={() => setSetting("showSafeArea", !settings.showSafeArea)}>
                  {settings.showSafeArea ? "Hide Safe Area" : "Show Safe Area"}
                </button>

                <button
                  className={`btn outline small ${settings.snapToGrid ? "is-on" : ""}`}
                  type="button"
                  onClick={() => setSetting("snapToGrid", !settings.snapToGrid)}
                  disabled={!overlayDataUrl}
                >
                  {settings.snapToGrid ? "Grid Snap: On" : "Grid Snap: Off"}
                </button>

                <button
                  className={`btn outline small ${settings.constrainToSafeArea ? "is-on" : ""}`}
                  type="button"
                  onClick={() => setSetting("constrainToSafeArea", !settings.constrainToSafeArea)}
                  disabled={!overlayDataUrl}
                >
                  {settings.constrainToSafeArea ? "Constrain: On" : "Constrain: Off"}
                </button>
              </div>
            </div>
          </div>

          <div
            className="panel right-panel"
            style={{ overflowY: "auto", maxHeight: "calc(100vh - 140px)" }}
          >
            <div className="panel-block">
              <div className="panel-title">Controls</div>

              <div className="toggle-row" style={{ display: "flex", gap: 8, flexWrap: "nowrap", overflowX: "auto" }}>
                <button
                  className={`chip ${settings.flipX ? "active" : ""}`}
                  type="button"
                  onClick={() => setSetting("flipX", !settings.flipX)}
                  disabled={!overlayDataUrl}
                >
                  Flip X
                </button>
                <button
                  className={`chip ${settings.flipY ? "active" : ""}`}
                  type="button"
                  onClick={() => setSetting("flipY", !settings.flipY)}
                  disabled={!overlayDataUrl}
                >
                  Flip Y
                </button>
                <button
                  className={`chip ${settings.snapCenter ? "active" : ""}`}
                  type="button"
                  onClick={() => setSetting("snapCenter", !settings.snapCenter)}
                  disabled={!overlayDataUrl}
                >
                  Snap Center
                </button>
              </div>

              <div className="control">
                <div className="control-head">
                  <span>Size</span>
                  <span className="control-val">{settings.scale.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.25"
                  max="3.2"
                  step="0.01"
                  value={settings.scale}
                  onChange={(e) => setSetting("scale", Number(e.target.value))}
                  disabled={!overlayDataUrl}
                />
              </div>

              <div className="control">
                <div className="control-head">
                  <span>Rotate</span>
                  <span className="control-val">{Math.round(settings.rotate)}°</span>
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
                <div className="control-head">
                  <span>Opacity</span>
                  <span className="control-val">{Math.round(settings.opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="1"
                  step="0.01"
                  value={settings.opacity}
                  onChange={(e) => setSetting("opacity", Number(e.target.value))}
                  disabled={!overlayDataUrl}
                />
              </div>

              <div className="control">
                <div className="control-head">
                  <span>Move X</span>
                  <span className="control-val">{Math.round(settings.offsetX)}%</span>
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
                <div className="control-head">
                  <span>Move Y</span>
                  <span className="control-val">{Math.round(settings.offsetY)}%</span>
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

            <div className="panel-block">
              <div className="panel-title">Effects</div>

              <div className="control">
                <div className="control-head">
                  <span>Blend Mode</span>
                  <span className="control-val">{settings.blendMode}</span>
                </div>
                <select
                  className="select"
                  value={settings.blendMode}
                  onChange={(e) => setSetting("blendMode", e.target.value)}
                  disabled={!overlayDataUrl}
                >
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
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="1"
                  value={settings.shadow}
                  onChange={(e) => setSetting("shadow", Number(e.target.value))}
                  disabled={!overlayDataUrl}
                />
              </div>

              <div className="control">
                <div className="control-head">
                  <span>Border</span>
                  <span className="control-val">{settings.border}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="12"
                  step="1"
                  value={settings.border}
                  onChange={(e) => setSetting("border", Number(e.target.value))}
                  disabled={!overlayDataUrl}
                />
              </div>

              <div className="control">
                <div className="control-head">
                  <span>Border Color</span>
                  <span className="control-val">{settings.borderColor}</span>
                </div>
                <input
                  type="color"
                  className="color"
                  value={settings.borderColor}
                  onChange={(e) => setSetting("borderColor", e.target.value)}
                  disabled={!overlayDataUrl}
                />
              </div>

              <div className="control">
                <div className="control-head">
                  <span>Roundness</span>
                  <span className="control-val">{settings.radius}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  step="1"
                  value={settings.radius}
                  onChange={(e) => setSetting("radius", Number(e.target.value))}
                  disabled={!overlayDataUrl}
                />
              </div>

              <div className="control">
                <div className="control-head">
                  <span>Blur</span>
                  <span className="control-val">{settings.blur}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="12"
                  step="1"
                  value={settings.blur}
                  onChange={(e) => setSetting("blur", Number(e.target.value))}
                  disabled={!overlayDataUrl}
                />
              </div>

              <div className="control">
                <div className="control-head">
                  <span>Hue</span>
                  <span className="control-val">{settings.hue}°</span>
                </div>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="1"
                  value={settings.hue}
                  onChange={(e) => setSetting("hue", Number(e.target.value))}
                  disabled={!overlayDataUrl}
                />
              </div>

              <div className="control">
                <div className="control-head">
                  <span>Saturation</span>
                  <span className="control-val">{settings.saturate}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="220"
                  step="1"
                  value={settings.saturate}
                  onChange={(e) => setSetting("saturate", Number(e.target.value))}
                  disabled={!overlayDataUrl}
                />
              </div>

              <div className="control">
                <div className="control-head">
                  <span>Brightness</span>
                  <span className="control-val">{settings.brightness}%</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="180"
                  step="1"
                  value={settings.brightness}
                  onChange={(e) => setSetting("brightness", Number(e.target.value))}
                  disabled={!overlayDataUrl}
                />
              </div>

              <div className="control">
                <div className="control-head">
                  <span>Contrast</span>
                  <span className="control-val">{settings.contrast}%</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="180"
                  step="1"
                  value={settings.contrast}
                  onChange={(e) => setSetting("contrast", Number(e.target.value))}
                  disabled={!overlayDataUrl}
                />
              </div>

              <div className="right-actions" style={{ display: "flex", gap: 10, flexWrap: "nowrap" }}>
                <button className="btn outline small" type="button" onClick={resetSettings} disabled={loadingBgRemoval}>
                  Reset Controls
                </button>
              </div>
            </div>
          </div>
        </div>

        {toast ? <div className="toast">{toast}</div> : null}
      </div>
    </>
  );
}
