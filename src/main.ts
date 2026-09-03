type ScrubberState = {
  currentFrame: number;
  targetFrame: number;
  drawnFrame: number;
  scrollProgress: number;
  pointerProgress: number;
  lastWidth: number;
  lastHeight: number;
};

export {};

function setupMobileMenu(): void {
  const toggle = document.querySelector<HTMLButtonElement>("[data-menu-toggle]");
  const menu = document.querySelector<HTMLElement>("[data-mobile-menu]");

  if (!toggle || !menu) {
    return;
  }

  const setIsOpen = (isOpen: boolean): void => {
    document.body.classList.toggle("menu-is-open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
  };

  toggle.addEventListener("click", () => {
    setIsOpen(!document.body.classList.contains("menu-is-open"));
  });

  menu.addEventListener("click", (event) => {
    if ((event.target as HTMLElement).closest("a")) {
      setIsOpen(false);
    }
  });
}

function setupFrameScrubber(canvas: HTMLCanvasElement): void {
  const context = canvas.getContext("2d", { alpha: false });

  if (!context) {
    return;
  }

  const drawingContext = context;
  const frameCount = 61;
  const frameImages: HTMLImageElement[] = [];
  const state: ScrubberState = {
    currentFrame: 0,
    targetFrame: 0,
    drawnFrame: -1,
    scrollProgress: 0,
    pointerProgress: 0,
    lastWidth: 0,
    lastHeight: 0,
  };

  const framePath = (index: number): string =>
    `assets/hero-sequence/frame_${String(index).padStart(3, "0")}.png`;

  function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  function preloadFrames(): void {
    for (let index = 0; index < frameCount; index += 1) {
      const image = new Image();
      image.decoding = "async";
      image.loading = "eager";

      if (index < 3) {
        image.setAttribute("fetchpriority", "high");
      }

      image.onload = () => {
        if (index === 0) {
          drawFrame(0, true);
        }
      };

      image.src = framePath(index);
      frameImages[index] = image;
    }
  }

  function resizeCanvas(): void {
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.floor(window.innerWidth * pixelRatio);
    const height = Math.floor(window.innerHeight * pixelRatio);

    if (width === state.lastWidth && height === state.lastHeight) {
      return;
    }

    state.lastWidth = width;
    state.lastHeight = height;
    canvas.width = width;
    canvas.height = height;
    drawFrame(Math.round(state.currentFrame), true);
  }

  function drawImageCover(image: HTMLImageElement): void {
    const canvasRatio = canvas.width / canvas.height;
    const imageRatio = image.naturalWidth / image.naturalHeight;
    let drawWidth = canvas.width;
    let drawHeight = canvas.height;
    let offsetX = 0;
    let offsetY = 0;

    if (imageRatio > canvasRatio) {
      drawWidth = canvas.height * imageRatio;
      offsetX = (canvas.width - drawWidth) / 2;
    } else {
      drawHeight = canvas.width / imageRatio;
      offsetY = (canvas.height - drawHeight) / 2;
    }

    drawingContext.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
  }

  function drawFrame(frameIndex: number, force = false): void {
    const boundedFrameIndex = clamp(frameIndex, 0, frameCount - 1);
    const image = frameImages[boundedFrameIndex];

    if (!image?.complete || image.naturalWidth === 0) {
      return;
    }

    if (!force && boundedFrameIndex === state.drawnFrame) {
      return;
    }

    state.drawnFrame = boundedFrameIndex;
    drawingContext.fillStyle = "#000000";
    drawingContext.fillRect(0, 0, canvas.width, canvas.height);
    drawImageCover(image);
  }

  function getScrollProgress(): number {
    const hero = document.querySelector<HTMLElement>(".hero");
    const maxScroll = hero ? hero.offsetHeight - window.innerHeight : 0;

    return maxScroll > 0 ? clamp(window.scrollY / maxScroll, 0, 1) : 0;
  }

  function updateTargetFrame(): void {
    state.scrollProgress = getScrollProgress();
    const inputProgress = clamp(state.scrollProgress * 0.82 + state.pointerProgress * 0.18, 0, 1);
    state.targetFrame = inputProgress * (frameCount - 1);
  }

  function animate(): void {
    state.currentFrame += (state.targetFrame - state.currentFrame) * 0.18;
    drawFrame(Math.round(state.currentFrame));
    requestAnimationFrame(animate);
  }

  window.addEventListener("resize", resizeCanvas, { passive: true });
  window.addEventListener("scroll", updateTargetFrame, { passive: true });
  window.addEventListener(
    "pointermove",
    (event: PointerEvent) => {
      state.pointerProgress = clamp(event.clientX / window.innerWidth, 0, 1);
      updateTargetFrame();
    },
    { passive: true },
  );

  resizeCanvas();
  preloadFrames();
  updateTargetFrame();
  animate();
}

setupMobileMenu();

const canvas = document.querySelector<HTMLCanvasElement>("#frame-canvas");

if (canvas) {
  setupFrameScrubber(canvas);
}
