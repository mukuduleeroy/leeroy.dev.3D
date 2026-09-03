type ScrubberState = {
  loaded: number;
  criticalLoaded: number;
  currentFrame: number;
  targetFrame: number;
  pointerProgress: number;
  lastWidth: number;
  lastHeight: number;
};

export {};

const canvasElement = document.querySelector<HTMLCanvasElement>("#frame-canvas");

if (!canvasElement) {
  throw new Error("Canvas element #frame-canvas was not found.");
}

const canvas = canvasElement;
const canvasContext = canvas.getContext("2d", { alpha: false });

if (!canvasContext) {
  throw new Error("2D canvas context is not available.");
}

const context = canvasContext;
const heroFrameNumbers = Array.from({ length: 73 }, (_, index) => index * 4 + 1);
heroFrameNumbers.push(290);
const frameCount = heroFrameNumbers.length;
const criticalFrameCount = Math.min(12, frameCount);
const frameImages: HTMLImageElement[] = [];
const loadedFrameIndexes = new Set<number>();
const state: ScrubberState = {
  loaded: 0,
  criticalLoaded: 0,
  currentFrame: 0,
  targetFrame: 0,
  pointerProgress: 0,
  lastWidth: 0,
  lastHeight: 0,
};

const framePath = (index: number): string =>
  `assets/frames/ezgif-frame-${String(heroFrameNumbers[index]).padStart(3, "0")}.png`;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function createFrameImage(index: number): HTMLImageElement {
  const image = new Image();
  image.decoding = "async";
  image.loading = index < criticalFrameCount ? "eager" : "lazy";

  if (index < criticalFrameCount) {
    image.setAttribute("fetchpriority", "high");
  }

  frameImages[index] = image;
  return image;
}

function loadFrame(index: number): Promise<void> {
  const image = frameImages[index] ?? createFrameImage(index);

  if (loadedFrameIndexes.has(index)) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    image.onload = async () => {
      try {
        await image.decode();
      } catch {
        // Some browsers resolve onload after decode already, so drawing is still safe here.
      }

      loadedFrameIndexes.add(index);
      state.loaded += 1;

      if (index < criticalFrameCount) {
        state.criticalLoaded += 1;
      }

      if (index === 0 || state.criticalLoaded === criticalFrameCount) {
        drawFrame(Math.round(state.currentFrame));
      }

      resolve();
    };

    image.onerror = () => resolve();
    image.src = framePath(index);
  });
}

async function loadFramesInBatches(startIndex: number): Promise<void> {
  const batchSize = 6;

  for (let i = startIndex; i < frameCount; i += batchSize) {
    const batch = Array.from(
      { length: Math.min(batchSize, frameCount - i) },
      (_, offset) => loadFrame(i + offset),
    );
    await Promise.all(batch);
  }
}

async function preloadFrames(): Promise<void> {
  await Promise.all(Array.from({ length: criticalFrameCount }, (_, index) => loadFrame(index)));
  document.body.classList.add("is-ready");
  void loadFramesInBatches(criticalFrameCount);
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
  drawFrame(Math.round(state.currentFrame));
}

function drawImageCover(image: HTMLImageElement | undefined): void {
  if (!image?.complete || image.naturalWidth === 0) {
    return;
  }

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

  context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
}

function drawFrame(frameIndex: number): void {
  context.fillStyle = "#000000";
  context.fillRect(0, 0, canvas.width, canvas.height);
  drawImageCover(frameImages[getClosestLoadedFrameIndex(frameIndex)] ?? frameImages[0]);
}

function getClosestLoadedFrameIndex(frameIndex: number): number {
  if (loadedFrameIndexes.has(frameIndex)) {
    return frameIndex;
  }

  for (let offset = 1; offset < frameCount; offset += 1) {
    const previousIndex = frameIndex - offset;
    const nextIndex = frameIndex + offset;

    if (previousIndex >= 0 && loadedFrameIndexes.has(previousIndex)) {
      return previousIndex;
    }

    if (nextIndex < frameCount && loadedFrameIndexes.has(nextIndex)) {
      return nextIndex;
    }
  }

  return 0;
}

function getScrollProgress(): number {
  const hero = document.querySelector<HTMLElement>(".hero");
  const maxScroll = hero ? hero.offsetHeight - window.innerHeight : 0;

  return maxScroll > 0 ? clamp(window.scrollY / maxScroll, 0, 1) : 0;
}

function updateTargetFrame(): void {
  const scrollProgress = getScrollProgress();
  const blendedProgress = clamp(scrollProgress * 0.82 + state.pointerProgress * 0.18, 0, 1);
  state.targetFrame = blendedProgress * (frameCount - 1);
}

function animate(): void {
  state.currentFrame += (state.targetFrame - state.currentFrame) * 0.16;
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
void preloadFrames();
updateTargetFrame();
animate();
