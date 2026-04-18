import { useState, useRef, useCallback, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "../App";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { toast } from "sonner";
import {
  CreditCard,
  Upload,
  Camera,
  ArrowLeft,
  Loader2,
  Check,
  X,
  RotateCcw,
  ArrowRight,
  MonitorUp,
  ScanLine,
  RefreshCw,
} from "lucide-react";

const CARD_TYPES = [
  "Sports - Baseball",
  "Sports - Basketball",
  "Sports - Football",
  "Sports - Hockey",
  "Pokemon",
  "Yu-Gi-Oh",
  "Magic: The Gathering",
  "Other TCG",
  "Other",
];

const CONDITIONS = [
  "Mint",
  "Near Mint",
  "Excellent",
  "Good",
  "Fair",
  "Poor",
];

export default function Scanner() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [mode, setMode] = useState("upload");
  const [currentSide, setCurrentSide] = useState("front");
  const [imageFrontBase64, setImageFrontBase64] = useState(null);
  const [imageBackBase64, setImageBackBase64] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [saving, setSaving] = useState(false);

  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [loadingDevices, setLoadingDevices] = useState(false);

  const [cardData, setCardData] = useState({
    card_name: "",
    card_type: "",
    card_year: "",
    condition: "",
    notes: "",
    avg_price: "",
    top_price: "",
    bottom_price: "",
    price_source: "manual",
  });

  const currentImage = currentSide === "front" ? imageFrontBase64 : imageBackBase64;

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  const startCamera = useCallback(async (deviceId) => {
    if (videoRef.current?.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
    }

    try {
      let stream;

      if (deviceId && deviceId !== "none" && deviceId !== "default") {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: deviceId } },
          });
        } catch (e) {
          console.log("Specific device failed, trying default");
        }
      }

      if (!stream) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" },
          });
        } catch (e) {
          console.log("Environment camera failed, trying any camera");
        }
      }

      if (!stream) {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
      }

      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current
            .play()
            .then(() => {
              setCameraActive(true);
            })
            .catch((err) => {
              console.error("Play error:", err);
              toast.error("Failed to start camera preview");
            });
        };
      }
    } catch (error) {
      console.error("Camera error:", error);
      toast.error("Failed to access camera. Please check permissions.");
      setCameraActive(false);
    }
  }, []);

  const loadVideoDevices = useCallback(async () => {
    setLoadingDevices(true);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        setVideoDevices([]);
        setLoadingDevices(false);
        return null;
      }

      try {
        const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
        tempStream.getTracks().forEach((track) => track.stop());
      } catch (permErr) {
        console.log("Camera permission request:", permErr.message);
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((device) => device.kind === "videoinput");

      setVideoDevices(videoInputs);

      if (videoInputs.length > 0) {
        const deviceId = videoInputs[0].deviceId || "default";
        if (!selectedDeviceId) {
          setSelectedDeviceId(deviceId);
        }
        return deviceId;
      }

      return null;
    } catch (error) {
      console.error("Error enumerating devices:", error);
      return null;
    } finally {
      setLoadingDevices(false);
    }
  }, [selectedDeviceId]);

  useEffect(() => {
    const handleMediaDeviceChange = () => {
      if (mode === "camera") {
        loadVideoDevices();
      }
    };

    if (navigator.mediaDevices?.addEventListener) {
      navigator.mediaDevices.addEventListener("devicechange", handleMediaDeviceChange);
    }

    return () => {
      if (navigator.mediaDevices?.removeEventListener) {
        navigator.mediaDevices.removeEventListener("devicechange", handleMediaDeviceChange);
      }
    };
  }, [mode, loadVideoDevices]);

  useEffect(() => {
  return () => {
    stopCamera();
  };
}, [stopCamera]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result;
      if (!base64) return;

      if (currentSide === "front") {
        setImageFrontBase64(base64);
        toast.success("Front image added");
      } else {
        setImageBackBase64(base64);
        toast.success("Back image added");
      }
    };

    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleDeviceChange = async (deviceId) => {
    setSelectedDeviceId(deviceId);
    if (cameraActive) {
      await startCamera(deviceId);
    }
  };

  const captureImage = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    const base64 = canvas.toDataURL("image/jpeg", 0.9);

    if (currentSide === "front") {
      setImageFrontBase64(base64);
      toast.success("Front image captured");
    } else {
      setImageBackBase64(base64);
      toast.success("Back image captured");
    }

    stopCamera();
  }, [currentSide, stopCamera]);

  const normalizeImage = (dataUrl) => {
    if (!dataUrl) return null;
    if (dataUrl.includes(",")) {
      return dataUrl.split(",")[1];
    }
    return dataUrl;
  };

  const parsePrice = (value) => {
    if (value === "" || value == null) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const handleSaveCard = async () => {
    if (!cardData.card_name || !cardData.card_type) {
      toast.error("Card name and type are required");
      return;
    }

    if (!imageFrontBase64) {
      toast.error("Front image is required");
      return;
    }

    if (!imageBackBase64) {
      toast.error("Back image is required");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        card_name: cardData.card_name,
        card_type: cardData.card_type,
        card_year: cardData.card_year || null,
        condition: cardData.condition || null,
        notes: cardData.notes || null,
        avg_price: parsePrice(cardData.avg_price),
        top_price: parsePrice(cardData.top_price),
        bottom_price: parsePrice(cardData.bottom_price),
        price_source: "manual",
        image_front_base64: normalizeImage(imageFrontBase64),
        image_back_base64: normalizeImage(imageBackBase64),
      };

      await axios.post(`${API}/cards`, payload);
      toast.success("Card saved to collection!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save card");
    } finally {
      setSaving(false);
    }
  };

  const resetCurrentSide = () => {
    if (currentSide === "front") {
      setImageFrontBase64(null);
    } else {
      setImageBackBase64(null);
    }
    stopCamera();
  };

  const resetAll = () => {
    setImageFrontBase64(null);
    setImageBackBase64(null);
    setCurrentSide("front");
    setCardData({
      card_name: "",
      card_type: "",
      card_year: "",
      condition: "",
      notes: "",
      avg_price: "",
      top_price: "",
      bottom_price: "",
      price_source: "manual",
    });
    stopCamera();
  };

  const switchToBack = () => {
    setCurrentSide("back");
    stopCamera();
  };

  const switchToFront = () => {
    setCurrentSide("front");
    stopCamera();
  };

  const activateCameraMode = async () => {
    setMode("camera");
    const deviceId = await loadVideoDevices();
    await startCamera(deviceId || "default");
  };

  const activateUploadMode = () => {
    setMode("upload");
    stopCamera();
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="glass sticky top-0 z-50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-zinc-950" strokeWidth={1.5} />
            </div>
            <span className="text-xl font-bold text-zinc-50 tracking-tight">CardVault</span>
          </Link>

          <Link to="/dashboard">
            <Button
              variant="ghost"
              data-testid="back-btn"
              className="text-zinc-300 hover:text-zinc-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-50 mb-2">Add Card</h1>
        <p className="text-zinc-400 mb-8">Capture or upload the front and back of your card, then enter details manually.</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-zinc-900 border border-white/10 rounded-lg p-6">
            <div className="flex gap-2 mb-4">
              <Button
                variant={currentSide === "front" ? "default" : "outline"}
                onClick={switchToFront}
                data-testid="front-side-btn"
                className={`flex-1 ${currentSide === "front" ? "bg-amber-500 text-zinc-950" : "border-white/20 text-zinc-300"}`}
              >
                Front {imageFrontBase64 && <Check className="w-4 h-4 ml-2" />}
              </Button>
              <Button
                variant={currentSide === "back" ? "default" : "outline"}
                onClick={switchToBack}
                data-testid="back-side-btn"
                className={`flex-1 ${currentSide === "back" ? "bg-amber-500 text-zinc-950" : "border-white/20 text-zinc-300"}`}
              >
                Back {imageBackBase64 && <Check className="w-4 h-4 ml-2" />}
              </Button>
            </div>

            <div className="flex gap-2 mb-4">
              <Button
                variant={mode === "upload" ? "default" : "outline"}
                onClick={activateUploadMode}
                data-testid="upload-mode-btn"
                className={`flex-1 ${mode === "upload" ? "bg-zinc-700 text-zinc-50" : "border-white/20 text-zinc-300"}`}
              >
                <Upload className="w-4 h-4 mr-2" />
                File / Scanner
              </Button>
              <Button
                variant={mode === "camera" ? "default" : "outline"}
                onClick={activateCameraMode}
                data-testid="camera-mode-btn"
                className={`flex-1 ${mode === "camera" ? "bg-zinc-700 text-zinc-50" : "border-white/20 text-zinc-300"}`}
              >
                <Camera className="w-4 h-4 mr-2" />
                Camera
              </Button>
            </div>

            {mode === "camera" && (
              <div className="mb-4 p-3 bg-zinc-800 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                    <MonitorUp className="w-4 h-4" />
                    Video Source
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => loadVideoDevices()}
                    disabled={loadingDevices}
                    className="text-zinc-400 hover:text-zinc-50 h-6 px-2"
                    data-testid="refresh-devices-btn"
                  >
                    <RefreshCw className={`w-3 h-3 ${loadingDevices ? "animate-spin" : ""}`} />
                  </Button>
                </div>

                <Select
                  value={selectedDeviceId || "default"}
                  onValueChange={(value) => value !== "none" && handleDeviceChange(value)}
                >
                  <SelectTrigger
                    data-testid="device-select"
                    className="bg-zinc-900 border-white/10 text-zinc-50"
                  >
                    <SelectValue placeholder={loadingDevices ? "Loading devices..." : "Select video source"} />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/10">
                    <SelectItem value="default" className="text-zinc-50 hover:bg-zinc-800 focus:bg-zinc-800">
                      Default Camera
                    </SelectItem>
                    {videoDevices.map((device, index) => (
                      <SelectItem
                        key={device.deviceId || `device-${index}`}
                        value={device.deviceId || `device-${index}`}
                        className="text-zinc-50 hover:bg-zinc-800 focus:bg-zinc-800"
                      >
                        {device.label || `Camera ${index + 1}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <p className="text-xs text-zinc-500 mt-2">
                  Includes webcams, virtual cameras, and capture cards.
                </p>
              </div>
            )}

            {mode === "upload" && (
              <div className="mb-4 p-3 bg-zinc-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <ScanLine className="w-4 h-4 text-amber-500" />
                  <span className="text-sm text-zinc-300">Flatbed Scanner Support</span>
                </div>
                <p className="text-xs text-zinc-500">
                  Use your scanner software to scan the card, then upload the image file here.
                  Supports JPEG, PNG, WEBP, TIFF, and BMP formats.
                </p>
              </div>
            )}

            <div className="aspect-[3/4] bg-zinc-800 rounded-lg overflow-hidden relative mb-4">
              {currentImage ? (
                <>
                  <img
                    src={currentImage}
                    alt={`Card ${currentSide}`}
                    className="w-full h-full object-contain"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={resetCurrentSide}
                    data-testid="reset-side-btn"
                    className="absolute top-2 right-2 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <div className="absolute bottom-2 left-2 bg-zinc-900/80 px-3 py-1 rounded text-sm text-zinc-50 uppercase tracking-wider">
                    {currentSide}
                  </div>
                </>
              ) : mode === "camera" && cameraActive ? (
                <>
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    autoPlay
                    muted
                  />
                  <div className="absolute inset-0 pointer-events-none">
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <rect
                        x="10"
                        y="10"
                        width="80"
                        height="80"
                        fill="none"
                        stroke="rgba(245, 158, 11, 0.5)"
                        strokeWidth="0.5"
                        strokeDasharray="5,5"
                      />
                      <line x1="10" y1="10" x2="20" y2="10" stroke="rgb(245, 158, 11)" strokeWidth="1" />
                      <line x1="10" y1="10" x2="10" y2="20" stroke="rgb(245, 158, 11)" strokeWidth="1" />
                      <line x1="90" y1="10" x2="80" y2="10" stroke="rgb(245, 158, 11)" strokeWidth="1" />
                      <line x1="90" y1="10" x2="90" y2="20" stroke="rgb(245, 158, 11)" strokeWidth="1" />
                      <line x1="10" y1="90" x2="20" y2="90" stroke="rgb(245, 158, 11)" strokeWidth="1" />
                      <line x1="10" y1="90" x2="10" y2="80" stroke="rgb(245, 158, 11)" strokeWidth="1" />
                      <line x1="90" y1="90" x2="80" y2="90" stroke="rgb(245, 158, 11)" strokeWidth="1" />
                      <line x1="90" y1="90" x2="90" y2="80" stroke="rgb(245, 158, 11)" strokeWidth="1" />
                    </svg>
                  </div>
                  <div className="absolute top-2 left-2 bg-zinc-900/80 px-3 py-1 rounded text-sm text-zinc-50 uppercase tracking-wider">
                    {currentSide}
                  </div>
                  <button
                    onClick={captureImage}
                    data-testid="capture-overlay-btn"
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-amber-500 hover:bg-amber-400 flex items-center justify-center shadow-lg border-4 border-white"
                  >
                    <Camera className="w-8 h-8 text-zinc-950" />
                  </button>
                </>
              ) : mode === "camera" ? (
                <div
                  className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-700/50 transition-colors"
                  onClick={() => startCamera(selectedDeviceId || "default")}
                  data-testid="start-camera-area"
                >
                  <Camera className="w-12 h-12 text-zinc-500 mb-4" />
                  <p className="text-zinc-400 text-center">
                    {loadingDevices ? "Loading cameras..." : "Tap to start camera"}
                    <br />
                    <span className="text-sm text-zinc-500">
                      {(selectedDeviceId &&
                        videoDevices.find((d) => d.deviceId === selectedDeviceId)?.label) ||
                        "Default Camera"}
                    </span>
                  </p>
                </div>
              ) : (
                <div
                  className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-700/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="upload-area"
                >
                  <Upload className="w-12 h-12 text-zinc-500 mb-4" />
                  <p className="text-zinc-400 text-center">
                    Upload {currentSide} of card
                    <br />
                    <span className="text-sm text-zinc-500">From scanner or file</span>
                  </p>
                </div>
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/png,image/jpeg,image/webp,image/tiff,image/bmp"
              className="hidden"
              data-testid="file-input"
            />

            {mode === "upload" && !currentImage && (
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-50"
                data-testid="select-file-btn"
              >
                <Upload className="w-4 h-4 mr-2" />
                Select {currentSide} Image
              </Button>
            )}

            {mode === "camera" && !cameraActive && !currentImage && (
              <Button
                onClick={() => startCamera(selectedDeviceId || "default")}
                disabled={loadingDevices}
                className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold disabled:opacity-50"
                data-testid="start-camera-btn"
              >
                {loadingDevices ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4 mr-2" />
                )}
                {loadingDevices ? "Loading..." : "Start Camera"}
              </Button>
            )}

            {mode === "camera" && cameraActive && !currentImage && (
              <Button
                onClick={captureImage}
                className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold"
                data-testid="capture-btn"
              >
                <Camera className="w-4 h-4 mr-2" />
                Capture {currentSide}
              </Button>
            )}

            {currentImage && currentSide === "front" && !imageBackBase64 && (
              <Button
                onClick={switchToBack}
                className="w-full mt-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold"
                data-testid="next-to-back-btn"
              >
                Next: Capture Back
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}

            <div className="flex gap-4 mt-4">
              <div
                className={`flex-1 aspect-[3/4] rounded border-2 overflow-hidden cursor-pointer ${currentSide === "front" ? "border-amber-500" : "border-white/10"}`}
                onClick={switchToFront}
              >
                {imageFrontBase64 ? (
                  <img src={imageFrontBase64} alt="Front" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                    <span className="text-xs text-zinc-500">FRONT</span>
                  </div>
                )}
              </div>

              <div
                className={`flex-1 aspect-[3/4] rounded border-2 overflow-hidden cursor-pointer ${currentSide === "back" ? "border-amber-500" : "border-white/10"}`}
                onClick={switchToBack}
              >
                {imageBackBase64 ? (
                  <img src={imageBackBase64} alt="Back" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                    <span className="text-xs text-zinc-500">BACK</span>
                  </div>
                )}
              </div>
            </div>

            {(imageFrontBase64 || imageBackBase64) && (
              <Button
                variant="ghost"
                onClick={resetAll}
                className="w-full mt-4 text-zinc-400 hover:text-zinc-50"
                data-testid="reset-all-btn"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset All
              </Button>
            )}
          </div>

          <div className="bg-zinc-900 border border-white/10 rounded-lg p-6">
            <h2 className="text-lg font-medium text-zinc-50 mb-6">Card Details</h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="card_name" className="text-zinc-300">Card Name *</Label>
                <Input
                  id="card_name"
                  value={cardData.card_name}
                  onChange={(e) => setCardData({ ...cardData, card_name: e.target.value })}
                  placeholder="e.g., Michael Jordan Rookie"
                  data-testid="card-name-input"
                  className="mt-1 bg-zinc-950 border-white/10 text-zinc-50 placeholder:text-zinc-500"
                />
              </div>

              <div>
                <Label htmlFor="card_type" className="text-zinc-300">Card Type *</Label>
                <Select
                  value={cardData.card_type}
                  onValueChange={(value) => setCardData({ ...cardData, card_type: value })}
                >
                  <SelectTrigger
                    data-testid="card-type-select"
                    className="mt-1 bg-zinc-950 border-white/10 text-zinc-50"
                  >
                    <SelectValue placeholder="Select card type" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/10">
                    {CARD_TYPES.map((type) => (
                      <SelectItem
                        key={type}
                        value={type}
                        className="text-zinc-50 hover:bg-zinc-800 focus:bg-zinc-800"
                      >
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="card_year" className="text-zinc-300">Year</Label>
                <Input
                  id="card_year"
                  value={cardData.card_year}
                  onChange={(e) => setCardData({ ...cardData, card_year: e.target.value })}
                  placeholder="e.g., 1986"
                  data-testid="card-year-input"
                  className="mt-1 bg-zinc-950 border-white/10 text-zinc-50 placeholder:text-zinc-500"
                />
              </div>

              <div>
                <Label htmlFor="condition" className="text-zinc-300">Condition</Label>
                <Select
                  value={cardData.condition}
                  onValueChange={(value) => setCardData({ ...cardData, condition: value })}
                >
                  <SelectTrigger
                    data-testid="condition-select"
                    className="mt-1 bg-zinc-950 border-white/10 text-zinc-50"
                  >
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/10">
                    {CONDITIONS.map((condition) => (
                      <SelectItem
                        key={condition}
                        value={condition}
                        className="text-zinc-50 hover:bg-zinc-800 focus:bg-zinc-800"
                      >
                        {condition}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes" className="text-zinc-300">Notes</Label>
                <Textarea
                  id="notes"
                  value={cardData.notes}
                  onChange={(e) => setCardData({ ...cardData, notes: e.target.value })}
                  placeholder="e.g., Minor corner whitening, light scratches, pulled from childhood binder..."
                  rows={3}
                  data-testid="notes-input"
                  className="mt-1 bg-zinc-950 border-white/10 text-zinc-50 placeholder:text-zinc-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="avg_price" className="text-zinc-300">Average Price</Label>
                  <Input
                    id="avg_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={cardData.avg_price}
                    onChange={(e) => setCardData({ ...cardData, avg_price: e.target.value })}
                    placeholder="0.00"
                    data-testid="avg-price-input"
                    className="mt-1 bg-zinc-950 border-white/10 text-zinc-50 placeholder:text-zinc-500"
                  />
                </div>

                <div>
                  <Label htmlFor="top_price" className="text-zinc-300">Top Price</Label>
                  <Input
                    id="top_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={cardData.top_price}
                    onChange={(e) => setCardData({ ...cardData, top_price: e.target.value })}
                    placeholder="0.00"
                    data-testid="top-price-input"
                    className="mt-1 bg-zinc-950 border-white/10 text-zinc-50 placeholder:text-zinc-500"
                  />
                </div>

                <div>
                  <Label htmlFor="bottom_price" className="text-zinc-300">Bottom Price</Label>
                  <Input
                    id="bottom_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={cardData.bottom_price}
                    onChange={(e) => setCardData({ ...cardData, bottom_price: e.target.value })}
                    placeholder="0.00"
                    data-testid="bottom-price-input"
                    className="mt-1 bg-zinc-950 border-white/10 text-zinc-50 placeholder:text-zinc-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-zinc-800 rounded-lg">
                <p className="text-xs text-zinc-400 uppercase tracking-wider mb-2">Images</p>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    {imageFrontBase64 ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <X className="w-4 h-4 text-zinc-500" />
                    )}
                    <span className={imageFrontBase64 ? "text-zinc-50" : "text-zinc-500"}>Front</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {imageBackBase64 ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <X className="w-4 h-4 text-zinc-500" />
                    )}
                    <span className={imageBackBase64 ? "text-zinc-50" : "text-zinc-500"}>Back</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <Button
                  onClick={handleSaveCard}
                  disabled={saving || !cardData.card_name || !cardData.card_type || !imageFrontBase64 || !imageBackBase64}
                  data-testid="save-card-btn"
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  Save to Collection
                </Button>

                <Button
                  variant="outline"
                  onClick={() => navigate("/dashboard")}
                  data-testid="cancel-btn"
                  className="border-white/20 text-zinc-300 hover:bg-zinc-800"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}