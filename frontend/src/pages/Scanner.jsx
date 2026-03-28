import { useState, useRef, useCallback } from "react";
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
  SelectValue
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
  ArrowRight
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
  "Other"
];

export default function Scanner() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  const [mode, setMode] = useState("upload"); // upload | camera
  const [currentSide, setCurrentSide] = useState("front"); // front | back
  const [imageFrontBase64, setImageFrontBase64] = useState(null);
  const [imageBackBase64, setImageBackBase64] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [cardData, setCardData] = useState({
    card_name: "",
    card_type: "",
    card_year: "",
    damage_notes: ""
  });

  const currentImage = currentSide === "front" ? imageFrontBase64 : imageBackBase64;

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target.result;
      
      // Set the correct image based on current side
      if (currentSide === "front") {
        setImageFrontBase64(base64);
      } else {
        setImageBackBase64(base64);
      }
      
      // Only analyze on front side (main card info)
      if (currentSide === "front") {
        await analyzeImage(base64);
      } else {
        toast.success("Back image captured!");
      }
    };
    reader.readAsDataURL(file);
    
    // Reset file input so same file can be selected again
    e.target.value = '';
  };

  const analyzeImage = async (base64Data) => {
    setAnalyzing(true);
    try {
      const response = await axios.post(`${API}/cards/analyze-base64`, {
        image_base64: base64Data,
        side: currentSide
      });
      
      setCardData({
        card_name: response.data.card_name || "",
        card_type: response.data.card_type || "",
        card_year: response.data.card_year || "",
        damage_notes: response.data.damage_notes || ""
      });
      
      toast.success("Card analyzed successfully!");
    } catch (error) {
      console.error("Analysis error:", error);
      toast.error("Failed to analyze card. Please fill in details manually.");
    } finally {
      setAnalyzing(false);
    }
  };

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch (error) {
      console.error("Camera error:", error);
      toast.error("Failed to access camera");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  }, []);

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
      stopCamera();
      await analyzeImage(base64);
    } else {
      setImageBackBase64(base64);
      stopCamera();
      toast.success("Back image captured!");
    }
  }, [stopCamera, currentSide]);

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
      // Extract just the base64 data without the data URL prefix
      let frontData = imageFrontBase64;
      if (frontData && frontData.includes(",")) {
        frontData = frontData.split(",")[1];
      }

      let backData = imageBackBase64;
      if (backData && backData.includes(",")) {
        backData = backData.split(",")[1];
      }

      await axios.post(`${API}/cards`, {
        card_name: cardData.card_name,
        card_type: cardData.card_type,
        card_year: cardData.card_year || null,
        damage_notes: cardData.damage_notes || null,
        image_front_base64: frontData,
        image_back_base64: backData
      });
      
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
      damage_notes: ""
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

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Navigation */}
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
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-50 mb-2">Scan Card</h1>
        <p className="text-zinc-400 mb-8">Capture both front and back of your card</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Image Capture */}
          <div className="bg-zinc-900 border border-white/10 rounded-lg p-6">
            {/* Side Toggle */}
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

            {/* Mode Toggle */}
            <div className="flex gap-2 mb-6">
              <Button
                variant={mode === "upload" ? "default" : "outline"}
                onClick={() => { setMode("upload"); stopCamera(); }}
                data-testid="upload-mode-btn"
                className={`flex-1 ${mode === "upload" ? "bg-zinc-700 text-zinc-50" : "border-white/20 text-zinc-300"}`}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </Button>
              <Button
                variant={mode === "camera" ? "default" : "outline"}
                onClick={() => { setMode("camera"); startCamera(); }}
                data-testid="camera-mode-btn"
                className={`flex-1 ${mode === "camera" ? "bg-zinc-700 text-zinc-50" : "border-white/20 text-zinc-300"}`}
              >
                <Camera className="w-4 h-4 mr-2" />
                Camera
              </Button>
            </div>

            {/* Image Preview / Upload Area */}
            <div className="aspect-[3/4] bg-zinc-800 rounded-lg overflow-hidden relative mb-4">
              {currentImage ? (
                <>
                  <img 
                    src={currentImage}
                    alt={`Card ${currentSide}`}
                    className="w-full h-full object-contain"
                  />
                  {analyzing && (
                    <div className="absolute inset-0 bg-zinc-950/80 flex flex-col items-center justify-center">
                      <div className="relative w-full h-full">
                        <div className="absolute left-0 right-0 h-1 bg-amber-500 scanner-line"></div>
                      </div>
                      <div className="absolute flex flex-col items-center">
                        <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-2" />
                        <p className="text-zinc-300 text-sm">Analyzing card...</p>
                      </div>
                    </div>
                  )}
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
                  {/* Targeting reticle */}
                  <div className="absolute inset-0 pointer-events-none">
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <rect 
                        x="10" y="10" width="80" height="80" 
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
                  <div className="absolute bottom-2 left-2 bg-zinc-900/80 px-3 py-1 rounded text-sm text-zinc-50 uppercase tracking-wider">
                    {currentSide}
                  </div>
                </>
              ) : (
                <div 
                  className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-700/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="upload-area"
                >
                  <Upload className="w-12 h-12 text-zinc-500 mb-4" />
                  <p className="text-zinc-400 text-center">
                    Upload {currentSide} of card<br />
                    <span className="text-sm text-zinc-500">PNG, JPG, WEBP</span>
                  </p>
                </div>
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>

            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/png,image/jpeg,image/webp"
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

            {/* Quick navigation between sides */}
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

            {/* Thumbnails */}
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

          {/* Right: Card Details Form */}
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
                    {CARD_TYPES.map(type => (
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
                <Label htmlFor="damage_notes" className="text-zinc-300">Condition Notes</Label>
                <Textarea
                  id="damage_notes"
                  value={cardData.damage_notes}
                  onChange={(e) => setCardData({ ...cardData, damage_notes: e.target.value })}
                  placeholder="e.g., Minor corner whitening, light scratches..."
                  rows={3}
                  data-testid="damage-notes-input"
                  className="mt-1 bg-zinc-950 border-white/10 text-zinc-50 placeholder:text-zinc-500 resize-none"
                />
              </div>

              {/* Image status */}
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
