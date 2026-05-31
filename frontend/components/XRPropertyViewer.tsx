"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import {
  BadgeCheck,
  Bot,
  CalendarClock,
  Camera,
  ChevronLeft,
  Compass,
  DoorOpen,
  Headphones,
  Home,
  IndianRupee,
  Layers3,
  MapPin,
  Maximize,
  Minimize,
  Mic,
  MicOff,
  Move3D,
  Network,
  Pause,
  Play,
  RotateCcw,
  Send,
  Share2,
  ShieldAlert,
  SkipBack,
  SkipForward,
  Sparkles,
  Star,
  Volume2,
  X,
} from "lucide-react";
import type { XRGuideResponse, XRHotspot, XRPayload, XRVector } from "@/lib/api";
import { askXRGuide, createXRSession, formatCr, getPropertyXR, navigateXRGuide, saveXRFeedback } from "@/lib/api";

type Role = "public" | "buyer" | "broker" | "manager" | "admin";
type TourMode = "free" | "guided" | "personalized" | "broker" | "manager";

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

type SpeechWindow = Window & {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
};

export function XRPropertyViewer({ propertyId, role = "public" }: { propertyId: string; role?: Role }) {
  const [payload, setPayload] = useState<XRPayload | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [activeHotspot, setActiveHotspot] = useState<XRHotspot | null>(null);
  const [mode, setMode] = useState<TourMode>(role === "broker" ? "broker" : role === "manager" ? "manager" : "free");
  const [transcript, setTranscript] = useState<Array<{ speaker: "user" | "guide"; text: string; type?: string }>>([]);
  const [query, setQuery] = useState("Start the tour.");
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [webxrSupported, setWebxrSupported] = useState(false);
  const [comfortMode, setComfortMode] = useState(true);
  const [showRooms, setShowRooms] = useState(true);
  const [showTranscript, setShowTranscript] = useState(true);
  const [viewerReady, setViewerReady] = useState(false);
  const [assetFailed, setAssetFailed] = useState(false);
  const [autoPlaying, setAutoPlaying] = useState(false);
  const [autoIndex, setAutoIndex] = useState(0);
  const [dollhouse, setDollhouse] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const cameraTargetRef = useRef<{ position?: XRVector; lookAt?: XRVector; hotspotId?: string } | null>(null);
  const cameraStateRef = useRef<{ position: XRVector; target: XRVector } | null>(null);
  const dollhouseRef = useRef(false);
  const speakCancelRef = useRef(false);
  const navigateToRef = useRef<((hotspot: XRHotspot) => void) | null>(null);
  const captureRef = useRef<(() => string | null) | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let mounted = true;
    getPropertyXR(propertyId, role)
      .then(async (data) => {
        if (!mounted) return;
        setPayload(data);
        setActiveHotspot(data.hotspots[0] || null);
        const session = await createXRSession(propertyId, {
          role,
          device_type: "browser",
          webxr_supported: Boolean(navigator.xr),
        });
        if (!mounted) return;
        setSessionId(session.session_id);
        setTranscript([{ speaker: "guide", text: String(session.greeting || data.tour_script.opening || "Welcome to the XR tour."), type: "start_tour" }]);
        cameraTargetRef.current = {
          position: session.starting_camera_position,
          lookAt: session.starting_camera_look_at,
          hotspotId: session.current_hotspot_id,
        };
        const shared = parseSharedView(window.location.search);
        if (shared) {
          cameraTargetRef.current = { position: shared.position, lookAt: shared.lookAt, hotspotId: shared.hotspotId };
          const sharedHotspot = data.hotspots.find((hotspot) => hotspot.hotspot_id === shared.hotspotId);
          if (sharedHotspot) setActiveHotspot(sharedHotspot);
        }
      })
      .catch((error) => {
        console.error(error);
      });
    if (navigator.xr?.isSessionSupported) {
      navigator.xr.isSessionSupported("immersive-vr").then(setWebxrSupported).catch(() => setWebxrSupported(false));
    }
    return () => {
      mounted = false;
    };
  }, [propertyId, role]);

  const onGuideResponse = useCallback((response: XRGuideResponse) => {
    setTranscript((items) => [...items, { speaker: "guide", text: response.display_text, type: response.response_type }]);
    if (response.camera_position || response.camera_look_at || response.hotspot_id) {
      cameraTargetRef.current = {
        position: response.camera_position || undefined,
        lookAt: response.camera_look_at || undefined,
        hotspotId: response.hotspot_id || undefined,
      };
      const target = payload?.hotspots.find((item) => item.hotspot_id === response.hotspot_id);
      if (target) setActiveHotspot(target);
    }
    speak(response.spoken_text);
  }, [payload?.hotspots]);

  async function askGuide(text = query) {
    if (!payload) return;
    setTranscript((items) => [...items, { speaker: "user", text }]);
    setQuery("");
    try {
      const response = await askXRGuide(propertyId, {
        session_id: sessionId,
        query: text,
        role,
        current_room: activeHotspot?.room_name,
        current_hotspot_id: activeHotspot?.hotspot_id,
      });
      onGuideResponse(response);
    } catch {
      const fallback: XRGuideResponse = {
        response_type: "error",
        spoken_text: "I could not reach the XR guide. You can continue with text-guided tour mode.",
        display_text: "XR guide unavailable. Text-guided fallback is active.",
        highlight_hotspots: [],
        suggested_actions: ["Retry", "Schedule physical visit"],
        confidence_score: 0.4,
        requires_handoff: false,
        safety_notes: ["Voice/API unavailable."],
      };
      onGuideResponse(fallback);
    }
  }

  async function navigateTo(hotspot: XRHotspot) {
    if (dollhouseRef.current) {
      dollhouseRef.current = false;
      setDollhouse(false);
    }
    setActiveHotspot(hotspot);
    const orderedIndex = orderedHotspots.findIndex((item) => item.hotspot_id === hotspot.hotspot_id);
    if (orderedIndex >= 0) setAutoIndex(orderedIndex);
    cameraTargetRef.current = {
      position: hotspot.camera_position_json,
      lookAt: hotspot.camera_look_at_json,
      hotspotId: hotspot.hotspot_id,
    };
    setTranscript((items) => [...items, { speaker: "guide", text: hotspot.narration, type: "navigate" }]);
    speak(hotspot.narration);
    try {
      await navigateXRGuide(propertyId, { session_id: sessionId, role, hotspot_id: hotspot.hotspot_id });
    } catch {
      // Local camera navigation still works without the backend event.
    }
  }

  const orderedHotspots = useMemo(() => {
    const route = payload?.routes?.[0];
    if (!payload || !route) return [] as XRHotspot[];
    return route.ordered_hotspot_ids
      .map((id) => payload.hotspots.find((hotspot) => hotspot.hotspot_id === id))
      .filter(Boolean) as XRHotspot[];
  }, [payload]);

  useEffect(() => {
    navigateToRef.current = navigateTo;
  });

  useEffect(() => {
    if (!autoPlaying || orderedHotspots.length === 0) return;
    const timer = setTimeout(() => {
      const next = autoIndex + 1;
      if (next >= orderedHotspots.length) {
        setAutoPlaying(false);
        return;
      }
      setAutoIndex(next);
      navigateToRef.current?.(orderedHotspots[next]);
    }, 8200);
    return () => clearTimeout(timer);
  }, [autoPlaying, autoIndex, orderedHotspots]);

  function toggleAutoTour() {
    if (autoPlaying) {
      setAutoPlaying(false);
      return;
    }
    if (orderedHotspots.length === 0) return;
    const current = orderedHotspots.findIndex((hotspot) => hotspot.hotspot_id === activeHotspot?.hotspot_id);
    const start = current >= 0 ? current : 0;
    setAutoIndex(start);
    navigateTo(orderedHotspots[start]);
    setAutoPlaying(true);
  }

  function stepAutoTour(direction: number) {
    if (orderedHotspots.length === 0) return;
    const next = Math.min(Math.max(autoIndex + direction, 0), orderedHotspots.length - 1);
    setAutoIndex(next);
    navigateTo(orderedHotspots[next]);
  }

  function toggleDollhouse() {
    const next = !dollhouse;
    setDollhouse(next);
    dollhouseRef.current = next;
    if (next) {
      setAutoPlaying(false);
      cameraTargetRef.current = { position: { x: 0, y: 8, z: 8.5 }, lookAt: { x: 0, y: 0.4, z: 0 }, hotspotId: undefined };
    } else if (activeHotspot) {
      cameraTargetRef.current = {
        position: activeHotspot.camera_position_json,
        lookAt: activeHotspot.camera_look_at_json,
        hotspotId: activeHotspot.hotspot_id,
      };
    }
  }

  function flashToast(message: string) {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(message);
    toastTimerRef.current = setTimeout(() => setToast(null), 2600);
  }

  useEffect(() => () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
  }, []);

  function takeSnapshot() {
    const data = captureRef.current?.();
    if (!data) {
      flashToast("Snapshot unavailable — viewer still loading.");
      return;
    }
    const link = document.createElement("a");
    link.href = data;
    link.download = `astra-xr-${propertyId}-${activeHotspot?.room_name?.toLowerCase().replace(/\s+/g, "-") || "view"}.png`;
    link.click();
    flashToast("Snapshot saved to your downloads.");
  }

  async function shareView() {
    const state = cameraStateRef.current;
    const position = state?.position || activeHotspot?.camera_position_json;
    const lookAt = state?.target || activeHotspot?.camera_look_at_json;
    const params = new URLSearchParams();
    if (position) params.set("cam", `${round(position.x)},${round(position.y)},${round(position.z)}`);
    if (lookAt) params.set("look", `${round(lookAt.x)},${round(lookAt.y)},${round(lookAt.z)}`);
    if (activeHotspot?.hotspot_id) params.set("h", activeHotspot.hotspot_id);
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    try {
      await navigator.clipboard.writeText(url);
      flashToast("Shareable view link copied to clipboard.");
    } catch {
      flashToast("Copy failed — long-press the address bar to share.");
    }
  }

  function startVoice() {
    const SpeechRecognition = (window as SpeechWindow).SpeechRecognition || (window as SpeechWindow).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setTranscript((items) => [...items, { speaker: "guide", text: "Browser speech recognition is not available. Use the text box instead.", type: "voice_fallback" }]);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const text = event.results[0]?.[0]?.transcript || "";
      setListening(false);
      if (text) askGuide(text);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    setListening(true);
    recognition.start();
  }

  function speak(text: string) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    speakCancelRef.current = false;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-IN";
    utterance.rate = 0.94;
    utterance.pitch = 0.92;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }

  function stopSpeech() {
    speakCancelRef.current = true;
    setSpeaking(false);
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }

  async function saveFeedback(interested: boolean) {
    if (!sessionId) return;
    const result = await saveXRFeedback(propertyId, sessionId, {
      rating: interested ? 5 : 3,
      liked_rooms: activeHotspot ? [activeHotspot.room_name] : [],
      concerns: interested ? [] : ["Needs physical visit"],
      interested,
      wants_physical_visit: interested,
      wants_offer_help: interested,
    });
    setTranscript((items) => [...items, { speaker: "guide", text: String(result.next_action_recommendation || "Feedback saved."), type: "feedback" }]);
  }

  if (!payload) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#050608] text-white">
        <div className="rounded-[28px] border border-white/10 bg-white/8 p-8 text-center shadow-2xl">
          <Sparkles className="mx-auto text-amber-300" size={32} />
          <h1 className="mt-4 text-3xl font-black">Loading ASTRA Immersive XR Tour...</h1>
          <p className="mt-2 text-sm text-white/60">Preparing Gaussian Splat scene, hotspots, and AI guide.</p>
        </div>
      </main>
    );
  }

  const hasReadyAsset = payload.xr_asset?.processing_status === "ready";
  const roleLabel = role === "broker" ? "Broker Presentation" : role === "manager" ? "Manager Preview" : role === "buyer" ? "Buyer Personalized" : "Public Buyer";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#040507] text-white">
      <GaussianSplatScene
        payload={payload}
        activeHotspot={activeHotspot}
        cameraTargetRef={cameraTargetRef}
        cameraStateRef={cameraStateRef}
        dollhouseRef={dollhouseRef}
        captureRef={captureRef}
        comfortMode={comfortMode}
        onReady={() => setViewerReady(true)}
        onAssetFailed={() => setAssetFailed(true)}
        onHotspotSelect={navigateTo}
      />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.18)_62%,rgba(0,0,0,0.58)_100%)]" />

      <TopBar payload={payload} roleLabel={roleLabel} viewerReady={viewerReady} hasReadyAsset={hasReadyAsset} assetFailed={assetFailed} />

      <AutoTourDock
        playing={autoPlaying}
        index={autoIndex}
        total={orderedHotspots.length}
        current={orderedHotspots[autoIndex]?.label}
        onToggle={toggleAutoTour}
        onPrev={() => stepAutoTour(-1)}
        onNext={() => stepAutoTour(1)}
      />

      <div className="absolute left-4 top-24 z-30 flex flex-col gap-3 md:left-6">
        <button onClick={() => setShowRooms((value) => !value)} className="pointer-events-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/12 bg-black/42 text-white backdrop-blur-xl transition hover:bg-white/12">
          <DoorOpen size={20} />
        </button>
        <button onClick={() => setShowTranscript((value) => !value)} className="pointer-events-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/12 bg-black/42 text-white backdrop-blur-xl transition hover:bg-white/12">
          <Bot size={20} />
        </button>
        <button
          onClick={toggleDollhouse}
          aria-pressed={dollhouse}
          className={clsx("pointer-events-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl border backdrop-blur-xl transition", dollhouse ? "border-amber-300/40 bg-amber-400 text-slate-950" : "border-white/12 bg-black/42 text-white hover:bg-white/12")}
        >
          {dollhouse ? <Minimize size={20} /> : <Maximize size={20} />}
        </button>
        <button onClick={takeSnapshot} aria-label="Capture snapshot" className="pointer-events-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/12 bg-black/42 text-white backdrop-blur-xl transition hover:bg-white/12">
          <Camera size={20} />
        </button>
        <button onClick={shareView} aria-label="Share this view" className="pointer-events-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/12 bg-black/42 text-white backdrop-blur-xl transition hover:bg-white/12">
          <Share2 size={20} />
        </button>
      </div>

      <div className="absolute bottom-28 left-4 top-40 z-20 hidden w-[310px] flex-col gap-3 lg:flex">
        {showRooms ? <RoomNavigationPanel hotspots={payload.hotspots} activeHotspot={activeHotspot} mode={mode} setMode={setMode} onNavigate={navigateTo} /> : null}
        <Minimap
          hotspots={payload.hotspots}
          activeId={activeHotspot?.hotspot_id}
          cameraStateRef={cameraStateRef}
          dollhouse={dollhouse}
          onNavigate={navigateTo}
          onToggleDollhouse={toggleDollhouse}
        />
      </div>
      <GuidedTourTimeline payload={payload} activeHotspot={activeHotspot} onNavigate={navigateTo} />
      <XRSessionStatus webxrSupported={webxrSupported} comfortMode={comfortMode} setComfortMode={setComfortMode} />
      {showTranscript ? <TourTranscriptPanel transcript={transcript} onClose={() => setShowTranscript(false)} /> : null}

      <XRVoiceGuide
        query={query}
        setQuery={setQuery}
        listening={listening}
        speaking={speaking}
        onAsk={() => askGuide()}
        onVoice={startVoice}
        onStop={stopSpeech}
        onStartTour={() => askGuide("Start the guided tour.")}
      />

      <XRBottomActionBar role={role} onAsk={askGuide} onFeedback={saveFeedback} />

      {!hasReadyAsset || assetFailed ? <XRFallbackNotice payload={payload} role={role} /> : null}

      {toast ? (
        <div className="pointer-events-none absolute bottom-[150px] left-1/2 z-40 -translate-x-1/2 rounded-2xl border border-white/14 bg-black/72 px-4 py-2.5 text-sm font-black text-white shadow-2xl backdrop-blur-xl">
          {toast}
        </div>
      ) : null}
    </main>
  );
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function parseSharedView(search: string): { position: XRVector; lookAt: XRVector; hotspotId?: string } | null {
  const params = new URLSearchParams(search);
  const cam = params.get("cam");
  const look = params.get("look");
  if (!cam || !look) return null;
  const toVec = (raw: string): XRVector | null => {
    const parts = raw.split(",").map(Number);
    if (parts.length !== 3 || parts.some((value) => Number.isNaN(value))) return null;
    return { x: parts[0], y: parts[1], z: parts[2] };
  };
  const position = toVec(cam);
  const lookAt = toVec(look);
  if (!position || !lookAt) return null;
  return { position, lookAt, hotspotId: params.get("h") || undefined };
}

function GaussianSplatScene({
  payload,
  activeHotspot,
  cameraTargetRef,
  cameraStateRef,
  dollhouseRef,
  captureRef,
  comfortMode,
  onReady,
  onAssetFailed,
  onHotspotSelect,
}: {
  payload: XRPayload;
  activeHotspot: XRHotspot | null;
  cameraTargetRef: React.MutableRefObject<{ position?: XRVector; lookAt?: XRVector; hotspotId?: string } | null>;
  cameraStateRef: React.MutableRefObject<{ position: XRVector; target: XRVector } | null>;
  dollhouseRef: React.MutableRefObject<boolean>;
  captureRef: React.MutableRefObject<(() => string | null) | null>;
  comfortMode: boolean;
  onReady: () => void;
  onAssetFailed: () => void;
  onHotspotSelect: (hotspot: XRHotspot) => void;
}) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<{
    camera: import("three").PerspectiveCamera;
    controlsTarget: import("three").Vector3;
    hotspotMeshes: Map<string, import("three").Mesh>;
  } | null>(null);

  useEffect(() => {
    let mounted = true;
    let frame = 0;
    let cleanup = () => undefined;

    async function init() {
      const THREE = await import("three");
      const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");
      const { VRButton } = await import("three/examples/jsm/webxr/VRButton.js");
      if (!mounted || !mountRef.current) return;

      const container = mountRef.current;
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x050608);
      scene.fog = new THREE.Fog(0x050608, 10, 34);

      const camera = new THREE.PerspectiveCamera(68, container.clientWidth / Math.max(container.clientHeight, 1), 0.05, 100);
      camera.position.set(0, 1.6, 7);
      const controlsTarget = new THREE.Vector3(0, 1.2, 0);

      const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance", preserveDrawingBuffer: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.xr.enabled = true;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      container.appendChild(renderer.domElement);

      const vrButton = VRButton.createButton(renderer);
      vrButton.style.position = "absolute";
      vrButton.style.right = "20px";
      vrButton.style.bottom = "92px";
      vrButton.style.zIndex = "30";
      vrButton.style.borderRadius = "14px";
      vrButton.style.border = "1px solid rgba(255,255,255,.22)";
      vrButton.style.background = "rgba(0,0,0,.62)";
      vrButton.style.backdropFilter = "blur(16px)";
      container.appendChild(vrButton);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.target.copy(controlsTarget);
      controls.enableDamping = true;
      controls.dampingFactor = 0.055;
      controls.maxPolarAngle = Math.PI * 0.52;
      controls.minDistance = 1.2;
      controls.maxDistance = 12;

      const ambient = new THREE.HemisphereLight(0xffffff, 0x223344, 1.2);
      scene.add(ambient);
      const key = new THREE.DirectionalLight(0xfff2d6, 2.8);
      key.position.set(4, 8, 5);
      scene.add(key);

      const grid = new THREE.GridHelper(18, 18, 0x43515c, 0x1e2932);
      grid.position.y = -0.02;
      scene.add(grid);

      const shell = createDemoSplatPointCloud(THREE, payload);
      scene.add(shell);

      const walls = createComfortBounds(THREE);
      scene.add(walls);

      const hotspotMeshes = new Map<string, import("three").Mesh>();
      payload.hotspots.forEach((hotspot) => {
        const geometry = new THREE.SphereGeometry(0.12, 24, 16);
        const material = new THREE.MeshStandardMaterial({
          color: hotspot.hotspot_type === "legal" ? 0xf59e0b : hotspot.hotspot_type === "finance" ? 0x38bdf8 : 0x34d399,
          emissive: hotspot.hotspot_type === "legal" ? 0x6b3a00 : 0x064e3b,
          emissiveIntensity: 0.65,
          metalness: 0.1,
          roughness: 0.35,
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(hotspot.position_json.x, hotspot.position_json.y, hotspot.position_json.z);
        mesh.userData.hotspotId = hotspot.hotspot_id;
        scene.add(mesh);
        hotspotMeshes.set(hotspot.hotspot_id, mesh);
      });

      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2();
      const onPointer = (event: PointerEvent) => {
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObjects(Array.from(hotspotMeshes.values()), false);
        const id = hits[0]?.object.userData.hotspotId;
        const hotspot = payload.hotspots.find((item) => item.hotspot_id === id);
        if (hotspot) onHotspotSelect(hotspot);
      };
      renderer.domElement.addEventListener("pointerdown", onPointer);

      sceneRef.current = { camera, controlsTarget, hotspotMeshes };
      captureRef.current = () => {
        try {
          renderer.render(scene, camera);
          return renderer.domElement.toDataURL("image/png");
        } catch {
          return null;
        }
      };
      onReady();

      if (payload.xr_asset?.asset_url?.endsWith(".ksplat") || payload.xr_asset?.asset_url?.endsWith(".splat")) {
        // Browser-side gsplat loading needs a dedicated decoder. Until configured, this scene
        // uses a performance-safe point-cloud proxy and keeps the real asset metadata attached.
      } else if (payload.xr_asset?.processing_status !== "ready") {
        onAssetFailed();
      }

      const onResize = () => {
        camera.aspect = container.clientWidth / Math.max(container.clientHeight, 1);
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
      };
      window.addEventListener("resize", onResize);

      renderer.setAnimationLoop(() => {
        const command = cameraTargetRef.current;
        if (command?.position) {
          const targetPos = new THREE.Vector3(command.position.x, command.position.y, command.position.z);
          camera.position.lerp(targetPos, comfortMode ? 0.025 : 0.055);
        }
        if (command?.lookAt) {
          const look = new THREE.Vector3(command.lookAt.x, command.lookAt.y, command.lookAt.z);
          controls.target.lerp(look, comfortMode ? 0.025 : 0.055);
        }
        if (comfortMode && !dollhouseRef.current) {
          camera.position.y = THREE.MathUtils.lerp(camera.position.y, Math.max(1.25, Math.min(1.85, camera.position.y)), 0.2);
        }
        cameraStateRef.current = {
          position: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
          target: { x: controls.target.x, y: controls.target.y, z: controls.target.z },
        };
        hotspotMeshes.forEach((mesh, id) => {
          const material = mesh.material as import("three").MeshStandardMaterial;
          const active = activeHotspot?.hotspot_id === id || cameraTargetRef.current?.hotspotId === id;
          mesh.scale.setScalar(active ? 1.55 + Math.sin(frame / 18) * 0.08 : 1);
          material.emissiveIntensity = active ? 1.3 : 0.55;
        });
        frame += 1;
        controls.update();
        renderer.render(scene, camera);
      });

      cleanup = () => {
        renderer.setAnimationLoop(null);
        renderer.domElement.removeEventListener("pointerdown", onPointer);
        window.removeEventListener("resize", onResize);
        captureRef.current = null;
        controls.dispose();
        renderer.dispose();
        vrButton.remove();
        renderer.domElement.remove();
      };
    }

    init();
    return () => {
      mounted = false;
      cleanup();
    };
  }, [payload, comfortMode, activeHotspot?.hotspot_id, cameraTargetRef, cameraStateRef, dollhouseRef, captureRef, onAssetFailed, onHotspotSelect, onReady]);

  return <div ref={mountRef} className="absolute inset-0" />;
}

function createDemoSplatPointCloud(THREE: typeof import("three"), payload: XRPayload) {
  const count = 9000;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const room = Math.floor(i / (count / 6));
    const rx = (room % 3) * 2.6 - 2.6;
    const rz = Math.floor(room / 3) * 3.2 - 1.8;
    positions[i * 3] = rx + (Math.random() - 0.5) * 2.4;
    positions[i * 3 + 1] = Math.random() * 2.45 + 0.05;
    positions[i * 3 + 2] = rz + (Math.random() - 0.5) * 2.7;
    colors[i * 3] = 0.55 + Math.random() * 0.35;
    colors[i * 3 + 1] = 0.45 + Math.random() * 0.32;
    colors[i * 3 + 2] = 0.32 + Math.random() * 0.25;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const material = new THREE.PointsMaterial({ size: payload.xr_asset?.processing_status === "ready" ? 0.034 : 0.045, vertexColors: true, transparent: true, opacity: 0.92 });
  return new THREE.Points(geometry, material);
}

function createComfortBounds(THREE: typeof import("three")) {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color: 0x0f172a, transparent: true, opacity: 0.18, roughness: 0.9 });
  [
    [0, 1.2, -4.2, 8, 2.4, 0.08],
    [0, 1.2, 4.2, 8, 2.4, 0.08],
    [-4.2, 1.2, 0, 0.08, 2.4, 8],
    [4.2, 1.2, 0, 0.08, 2.4, 8],
  ].forEach(([x, y, z, w, h, d]) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z);
    group.add(mesh);
  });
  return group;
}

function TopBar({ payload, roleLabel, viewerReady, hasReadyAsset, assetFailed }: { payload: XRPayload; roleLabel: string; viewerReady: boolean; hasReadyAsset: boolean; assetFailed: boolean }) {
  return (
    <header className="absolute left-4 right-4 top-4 z-30 rounded-[24px] border border-white/12 bg-black/48 px-4 py-3 shadow-2xl backdrop-blur-xl md:left-6 md:right-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/properties/${payload.property.requested_id}`} className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 text-white transition hover:bg-white/18">
            <ChevronLeft size={20} />
          </Link>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-200">{roleLabel} - ASTRA Immersive XR</p>
            <h1 className="text-xl font-black tracking-tight md:text-2xl">{payload.property.title}</h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill icon={MapPin} label={payload.property.locality} />
          <StatusPill icon={IndianRupee} label={formatCr(payload.property.price)} />
          <StatusPill icon={Layers3} label={hasReadyAsset && !assetFailed ? "GSplat asset ready" : "Image/video fallback"} tone={hasReadyAsset && !assetFailed ? "emerald" : "amber"} />
          <StatusPill icon={Move3D} label={viewerReady ? "Viewer live" : "Loading"} tone={viewerReady ? "emerald" : "amber"} />
        </div>
      </div>
    </header>
  );
}

function StatusPill({ icon: Icon, label, tone = "slate" }: { icon: typeof Home; label?: string | null; tone?: "slate" | "emerald" | "amber" }) {
  const classes = tone === "emerald" ? "bg-emerald-400/16 text-emerald-100 border-emerald-300/20" : tone === "amber" ? "bg-amber-400/16 text-amber-100 border-amber-300/20" : "bg-white/10 text-white border-white/10";
  return <span className={clsx("inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-black", classes)}><Icon size={14} />{label || "-"}</span>;
}

function AutoTourDock({
  playing,
  index,
  total,
  current,
  onToggle,
  onPrev,
  onNext,
}: {
  playing: boolean;
  index: number;
  total: number;
  current?: string;
  onToggle: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (total === 0) return null;
  const progress = total > 1 ? (index / (total - 1)) * 100 : 0;
  return (
    <div className="pointer-events-auto absolute left-1/2 top-[92px] z-20 hidden w-[340px] -translate-x-1/2 rounded-[22px] border border-white/12 bg-black/52 p-3 shadow-2xl backdrop-blur-xl md:block">
      <div className="flex items-center gap-2">
        <button onClick={onPrev} className="grid h-10 w-10 place-items-center rounded-xl bg-white/8 text-white transition hover:bg-white/16">
          <SkipBack size={16} />
        </button>
        <button
          onClick={onToggle}
          className={clsx("grid h-11 w-11 place-items-center rounded-xl font-black transition", playing ? "bg-rose-500 text-white" : "bg-amber-400 text-slate-950")}
        >
          {playing ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <button onClick={onNext} className="grid h-10 w-10 place-items-center rounded-xl bg-white/8 text-white transition hover:bg-white/16">
          <SkipForward size={16} />
        </button>
        <div className="ml-1 min-w-0 flex-1">
          <p className="truncate text-xs font-black text-white">
            {playing ? "Auto-tour playing" : "Cinematic tour"} · {index + 1}/{total}
          </p>
          <p className="truncate text-[11px] font-semibold text-white/60">{current || "Ready to play"}</p>
        </div>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-emerald-400 transition-[width] duration-500 ease-out" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

function RoomNavigationPanel({ hotspots, activeHotspot, mode, setMode, onNavigate }: { hotspots: XRHotspot[]; activeHotspot: XRHotspot | null; mode: TourMode; setMode: (mode: TourMode) => void; onNavigate: (hotspot: XRHotspot) => void }) {
  return (
    <aside className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] border border-white/12 bg-black/48 shadow-2xl backdrop-blur-xl">
      <div className="shrink-0 border-b border-white/10 p-4">
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-200">Rooms and modes</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {[
            ["free", "Free Explore"],
            ["guided", "AI Guided"],
            ["personalized", "Buyer Fit"],
            ["broker", "Broker Mode"],
            ["manager", "Manager QA"],
          ].map(([id, label]) => (
            <button key={id} onClick={() => setMode(id as TourMode)} className={clsx("rounded-2xl px-3 py-2 text-xs font-black", mode === id ? "bg-amber-400 text-slate-950" : "bg-white/8 text-white/70 hover:bg-white/14")}>{label}</button>
          ))}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-3">
        {hotspots.map((hotspot) => (
          <button key={hotspot.hotspot_id} onClick={() => onNavigate(hotspot)} className={clsx("mb-2 w-full rounded-2xl border p-3 text-left transition", activeHotspot?.hotspot_id === hotspot.hotspot_id ? "border-emerald-300/40 bg-emerald-400/16" : "border-white/10 bg-white/7 hover:bg-white/12")}>
            <p className="text-sm font-black text-white">{hotspot.label}</p>
            <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-white/58">{hotspot.description}</p>
          </button>
        ))}
      </div>
    </aside>
  );
}

function Minimap({
  hotspots,
  activeId,
  cameraStateRef,
  dollhouse,
  onNavigate,
  onToggleDollhouse,
}: {
  hotspots: XRHotspot[];
  activeId?: string;
  cameraStateRef: React.MutableRefObject<{ position: XRVector; target: XRVector } | null>;
  dollhouse: boolean;
  onNavigate: (hotspot: XRHotspot) => void;
  onToggleDollhouse: () => void;
}) {
  const markerRef = useRef<HTMLDivElement | null>(null);
  const toPct = (value: number) => Math.max(4, Math.min(96, ((value + 7) / 14) * 100));

  useEffect(() => {
    let raf = 0;
    const clampPct = (value: number) => Math.max(2, Math.min(98, ((value + 7) / 14) * 100));
    const tick = () => {
      const state = cameraStateRef.current;
      const el = markerRef.current;
      if (state && el) {
        el.style.left = `${clampPct(state.position.x)}%`;
        el.style.top = `${clampPct(state.position.z)}%`;
        const angle = Math.atan2(state.target.z - state.position.z, state.target.x - state.position.x) * (180 / Math.PI);
        el.style.transform = `translate(-50%, -50%) rotate(${angle + 90}deg)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [cameraStateRef]);

  const dotColor = (type: string) => (type === "legal" ? "bg-amber-400" : type === "finance" ? "bg-sky-400" : "bg-emerald-400");

  return (
    <div className="shrink-0 overflow-hidden rounded-[28px] border border-white/12 bg-black/48 p-4 shadow-2xl backdrop-blur-xl">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-200">Floor map</p>
        <button
          onClick={onToggleDollhouse}
          className={clsx("inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider transition", dollhouse ? "bg-amber-400 text-slate-950" : "bg-white/8 text-white/70 hover:bg-white/14")}
        >
          <Maximize size={12} />
          {dollhouse ? "Exit" : "Overview"}
        </button>
      </div>
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_center,rgba(52,211,153,0.1),transparent_70%)]">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[length:25%_25%]" />
        {hotspots.map((hotspot) => (
          <button
            key={hotspot.hotspot_id}
            onClick={() => onNavigate(hotspot)}
            title={hotspot.label}
            className={clsx(
              "absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/40 transition",
              dotColor(hotspot.hotspot_type),
              activeId === hotspot.hotspot_id ? "z-10 scale-150 ring-2 ring-white" : "opacity-70 hover:scale-125 hover:opacity-100"
            )}
            style={{ left: `${toPct(hotspot.position_json.x)}%`, top: `${toPct(hotspot.position_json.z)}%` }}
          />
        ))}
        <div
          ref={markerRef}
          className="pointer-events-none absolute h-0 w-0 border-x-[6px] border-b-[12px] border-x-transparent border-b-rose-400 drop-shadow-[0_0_4px_rgba(244,63,94,0.8)]"
          style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}
        />
      </div>
      <p className="mt-2 text-[10px] font-semibold text-white/45">Tap a marker to jump · red arrow is your view</p>
    </div>
  );
}

function GuidedTourTimeline({ payload, activeHotspot, onNavigate }: { payload: XRPayload; activeHotspot: XRHotspot | null; onNavigate: (hotspot: XRHotspot) => void }) {
  const route = payload.routes[0];
  const ordered = route.ordered_hotspot_ids.map((id) => payload.hotspots.find((hotspot) => hotspot.hotspot_id === id)).filter(Boolean) as XRHotspot[];
  return (
    <div className="absolute bottom-24 left-4 right-4 z-20 hidden rounded-[24px] border border-white/12 bg-black/38 p-3 backdrop-blur-xl xl:left-[340px] xl:right-[420px] xl:block">
      <div className="flex items-center gap-2 overflow-x-auto">
        {ordered.map((hotspot, index) => (
          <button key={hotspot.hotspot_id} onClick={() => onNavigate(hotspot)} className={clsx("min-w-[150px] rounded-2xl px-3 py-2 text-left text-xs font-black", activeHotspot?.hotspot_id === hotspot.hotspot_id ? "bg-emerald-400 text-slate-950" : "bg-white/8 text-white/70")}>
            {index + 1}. {hotspot.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function XRSessionStatus({ webxrSupported, comfortMode, setComfortMode }: { webxrSupported: boolean; comfortMode: boolean; setComfortMode: (value: boolean) => void }) {
  return (
    <section className="absolute right-4 top-24 z-20 hidden rounded-[24px] border border-white/12 bg-black/42 p-3 text-xs font-black text-white/74 backdrop-blur-xl md:right-6 lg:block">
      <div className="flex items-center gap-2"><Headphones size={15} className="text-emerald-200" />WebXR {webxrSupported ? "supported" : "fallback"}</div>
      <button onClick={() => setComfortMode(!comfortMode)} className="mt-2 flex w-full items-center gap-2 rounded-2xl bg-white/8 px-3 py-2 text-left hover:bg-white/14">
        <Compass size={14} />
        Comfort {comfortMode ? "on" : "off"}
      </button>
    </section>
  );
}

function TourTranscriptPanel({ transcript, onClose }: { transcript: Array<{ speaker: "user" | "guide"; text: string; type?: string }>; onClose: () => void }) {
  return (
    <aside className="absolute bottom-28 right-4 top-40 z-20 hidden w-[390px] rounded-[28px] border border-white/12 bg-black/48 shadow-2xl backdrop-blur-xl xl:block">
      <div className="flex items-center justify-between border-b border-white/10 p-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-200">Voice transcript</p>
          <h2 className="text-lg font-black">AI Virtual Property Guide</h2>
        </div>
        <button onClick={onClose} className="rounded-2xl bg-white/8 p-2"><X size={16} /></button>
      </div>
      <div className="h-[calc(100%-74px)] space-y-3 overflow-auto p-4">
        {transcript.map((item, index) => (
          <div key={index} className={clsx("rounded-2xl p-3 text-sm font-semibold leading-6", item.speaker === "guide" ? "bg-white/9 text-white/78" : "bg-amber-400 text-slate-950")}>
            <p className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] opacity-70">{item.speaker} {item.type ? `- ${item.type}` : ""}</p>
            {item.text}
          </div>
        ))}
      </div>
    </aside>
  );
}

function XRVoiceGuide({ query, setQuery, listening, speaking, onAsk, onVoice, onStop, onStartTour }: { query: string; setQuery: (value: string) => void; listening: boolean; speaking: boolean; onAsk: () => void; onVoice: () => void; onStop: () => void; onStartTour: () => void }) {
  return (
    <section className="absolute bottom-4 left-4 right-4 z-30 rounded-[28px] border border-white/12 bg-black/58 p-3 shadow-2xl backdrop-blur-xl md:left-6 md:right-6">
      <div className="grid gap-3 lg:grid-cols-[auto_1fr_auto] lg:items-center">
        <div className="flex gap-2">
          <button onClick={onStartTour} className="inline-flex items-center gap-2 rounded-2xl bg-amber-400 px-4 py-3 text-sm font-black text-slate-950"><Play size={16} />Start Guided Tour</button>
          <button onClick={speaking ? onStop : onVoice} className={clsx("inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-black", listening ? "bg-rose-500 text-white" : "bg-white/10 text-white")}>{listening ? <MicOff size={16} /> : speaking ? <Pause size={16} /> : <Mic size={16} />}{listening ? "Listening" : speaking ? "Stop" : "Ask by Voice"}</button>
        </div>
        <form onSubmit={(event) => { event.preventDefault(); onAsk(); }} className="flex min-w-0 gap-2">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ask: show me the kitchen, what is EMI, is this legally safe..." className="min-h-12 min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/10 px-4 text-sm font-semibold text-white outline-none placeholder:text-white/38" />
          <button className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-400 text-slate-950"><Send size={17} /></button>
        </form>
        <div className="hidden items-center gap-2 text-xs font-black text-white/60 xl:flex"><Volume2 size={15} />Mock voice uses browser STT/TTS locally</div>
      </div>
    </section>
  );
}

function XRBottomActionBar({ role, onAsk, onFeedback }: { role: Role; onAsk: (text: string) => void; onFeedback: (interested: boolean) => void }) {
  const actions = role === "broker"
    ? [["Create PropertyPool", Network], ["Broker pitch", Star], ["Book visit", CalendarClock], ["Ask legal", ShieldAlert]]
    : role === "manager"
      ? [["Trigger XR processing", Sparkles], ["Quality report", BadgeCheck], ["Tour analytics", Layers3], ["Approve script", Star]]
      : [["Schedule visit", CalendarClock], ["Ask legal", ShieldAlert], ["Get EMI", IndianRupee], ["Shortlist", Star]];
  return (
    <div className="absolute bottom-[116px] right-4 z-20 hidden flex-wrap justify-end gap-2 lg:flex">
      {actions.map(([label, Icon]) => (
        <button key={String(label)} onClick={() => onAsk(String(label))} className="inline-flex items-center gap-2 rounded-2xl border border-white/12 bg-black/42 px-3 py-2 text-xs font-black text-white backdrop-blur-xl hover:bg-white/12">
          <Icon size={14} />
          {String(label)}
        </button>
      ))}
      <button onClick={() => onFeedback(true)} className="inline-flex items-center gap-2 rounded-2xl bg-emerald-400 px-3 py-2 text-xs font-black text-slate-950"><BadgeCheck size={14} />Interested</button>
      <button onClick={() => onFeedback(false)} className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2 text-xs font-black text-white"><RotateCcw size={14} />Compare</button>
    </div>
  );
}

function XRFallbackNotice({ payload, role }: { payload: XRPayload; role: Role }) {
  const canTrigger = role === "manager" || role === "admin";
  return (
    <section className="absolute left-4 right-4 top-[108px] z-20 rounded-[24px] border border-amber-300/20 bg-amber-400/14 p-4 text-amber-50 backdrop-blur-xl md:left-auto md:w-[420px]">
      <p className="text-sm font-black">3D tour asset fallback active</p>
      <p className="mt-1 text-sm leading-6 text-amber-50/78">
        {String(payload.xr_asset?.metadata_json?.message || "Gaussian Splat file metadata is present, but the browser is using a safe point-cloud/image fallback until the production decoder is configured.")}
      </p>
      {canTrigger ? <button className="mt-3 rounded-2xl bg-amber-300 px-3 py-2 text-xs font-black text-slate-950">Trigger Codex XR generation workflow</button> : null}
    </section>
  );
}
