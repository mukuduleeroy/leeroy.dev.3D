type ScrubberState = {
  loaded: number;
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
const frameImages: HTMLImageElement[] = [];
const state: ScrubberState = {
  loaded: 0,
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

function preloadFrames(): void {
  for (let i = 0; i < frameCount; i += 1) {
    const image = new Image();
    image.decoding = "async";
    image.src = framePath(i);
    image.onload = () => {
      state.loaded += 1;

      if (i === 0 || state.loaded === frameCount) {
        drawFrame(Math.round(state.currentFrame));
      }
    };

    frameImages.push(image);
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
  drawImageCover(frameImages[frameIndex] ?? frameImages[0]);
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
preloadFrames();
updateTargetFrame();
animate();
